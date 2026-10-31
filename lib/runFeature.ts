// The one pipeline every AI route goes through:
// validate input → check key → rate limit → load versioned prompt → call Gemini → parse.
import { GEMINI_MODEL, generate, isConfigured } from "./gemini";
import { getPrompt } from "./prompts";
import { clientIp, takeToken } from "./rateLimit";
import type { ApiErrorCode, ApiResponse, Feature, ImageInput } from "./schemas";

export type BuiltInput = { text: string; image?: ImageInput } | { error: string };

function reply<T>(body: ApiResponse<T>, status: number): Response {
  return Response.json(body, { status });
}

type FailExtra = { raw?: string; promptVersion?: string; model?: string; retryAfterSec?: number; resetAt?: string };

function fail(error: ApiErrorCode, message: string, status: number, extra?: FailExtra) {
  return reply<never>({ ok: false, error, message, ...extra }, status);
}

/** Gemini's daily quotas reset at midnight US Pacific time. */
function nextPacificMidnight(now = new Date()): Date {
  const la = new Date(now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }));
  const offset = now.getTime() - la.getTime();
  la.setHours(24, 0, 0, 0);
  return new Date(la.getTime() + offset);
}

export async function runFeature<T>(
  req: Request,
  feature: Feature,
  build: (body: unknown) => BuiltInput | Promise<BuiltInput>,
  parse: (raw: string) => T | null,
  /** Optional post-check (e.g. item IDs exist). Problems trigger one corrective retry, then a visible warning. */
  check?: (data: T) => string[],
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_request", "The request couldn't be read.", 400);
  }

  const input = await build(body);
  if ("error" in input) return fail("bad_request", input.error, 400);

  if (!isConfigured()) {
    return fail("not_configured", "The AI isn't set up on this deployment yet (missing API key).", 503);
  }

  if (!takeToken(clientIp(req))) {
    return fail(
      "rate_limited",
      "Rewear has reached its daily limit of AI requests. It's a student prototype on a free plan, so please try again tomorrow.",
      429,
    );
  }

  const prompt = getPrompt(feature);
  let raw: string;
  try {
    raw = await generate({ system: prompt.text, ...input });
  } catch (err) {
    const status = (err as { status?: number }).status;
    console.error(`[${feature}] Gemini error`, status, (err as Error).message);
    if (status === 429) {
      // Gemini free tier has both a per-minute and a per-day request quota; tell them apart.
      const msg = (err as Error).message ?? "";
      const meta = { promptVersion: prompt.version, model: GEMINI_MODEL };
      if (/per day/i.test(msg)) {
        return fail(
          "quota_daily",
          "Today's free AI quota for Rewear is used up. It resets at midnight Pacific time.",
          429,
          { ...meta, resetAt: nextPacificMidnight().toISOString() },
        );
      }
      const wait = Math.ceil(Number(msg.match(/retry in ([\d.]+)s/i)?.[1] ?? 30));
      return fail(
        "ai_busy",
        `The AI's per-minute limit was reached. Please wait about ${wait} seconds and try again.`,
        429,
        { ...meta, retryAfterSec: wait },
      );
    }
    if (status === 503) {
      return fail("ai_error", "Gemini is overloaded right now (this happens at busy times). Please try again in a minute.", 503, {
        promptVersion: prompt.version,
        model: GEMINI_MODEL,
      });
    }
    return fail("ai_error", "The AI service didn't respond. Please try again.", 502, { promptVersion: prompt.version, model: GEMINI_MODEL });
  }

  let data = parse(raw);
  let warnings: string[] = [];
  let retried = false;
  const firstProblems = data !== null && check ? check(data) : [];
  if (firstProblems.length) {
    retried = true;
    try {
      const correction = `\n\nCORRECTION from Rewear: your previous answer had problems: ${firstProblems.join(" ")} Answer again using only item_ids that appear in the catalogue above.`;
      const raw2 = await generate({ system: prompt.text, ...input, text: input.text + correction });
      const data2 = parse(raw2);
      raw = `${raw}\n\n--- retry after Rewear's ID check (${firstProblems.join(" ")}) ---\n${raw2}`;
      if (data2 !== null) {
        data = data2;
        warnings = check!(data2);
      } else warnings = firstProblems;
    } catch {
      warnings = firstProblems; // keep the first answer, flagged
    }
  }
  if (data === null) {
    return fail("parse_failed", "Couldn't read the AI's response. The raw output is in the session log.", 502, {
      raw,
      promptVersion: prompt.version,
      model: GEMINI_MODEL,
    });
  }

  return reply<T>(
    { ok: true, data, raw, promptVersion: prompt.version, model: GEMINI_MODEL, ...(retried && { retried }), ...(warnings.length && { warnings }) },
    200,
  );
}
