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

function fail(error: ApiErrorCode, message: string, status: number, extra?: { raw?: string; promptVersion?: string; model?: string }) {
  return reply<never>({ ok: false, error, message, ...extra }, status);
}

export async function runFeature<T>(
  req: Request,
  feature: Feature,
  build: (body: unknown) => BuiltInput,
  parse: (raw: string) => T | null,
): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return fail("bad_request", "The request couldn't be read.", 400);
  }

  const input = build(body);
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
      return fail(
        "rate_limited",
        "The AI service is busy or its free quota is used up for now. Please try again a little later.",
        429,
        { promptVersion: prompt.version, model: GEMINI_MODEL },
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

  const data = parse(raw);
  if (data === null) {
    return fail("parse_failed", "Couldn't read the AI's response. The raw output is in the session log.", 502, {
      raw,
      promptVersion: prompt.version,
      model: GEMINI_MODEL,
    });
  }

  return reply<T>({ ok: true, data, raw, promptVersion: prompt.version, model: GEMINI_MODEL }, 200);
}
