// Server-only: the only module that talks to Gemini. Never import from a client component.
import { GoogleGenAI, ThinkingLevel, type Part } from "@google/genai";
import type { ImageInput } from "./schemas";

/** Change the model here. Must support image input. */
// History (2026-10-28): gemini-3.8-flash gave persistent 503 "high demand" on the free tier;
// gemini-3.6-flash worked but its free tier allows only 20 requests/day (5/min).
// gemini-3.5-flash-lite: free, image input, ~500 requests/day (10/min).
export const GEMINI_MODEL = "gemini-3.5-flash-lite";

/** Extra attempts after a transient 500/503 from Gemini (1s, then 2s backoff). */
const RETRIES = 2;

let client: GoogleGenAI | null = null;

export function isConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generate(opts: { system: string; text: string; image?: ImageInput }): Promise<string> {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const parts: Part[] = [{ text: opts.text }];
  if (opts.image) parts.push({ inlineData: opts.image });

  // Retry transient server-side failures (e.g. 503 "high demand") with a short backoff.
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await client.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: "user", parts }],
        config: {
          systemInstruction: opts.system,
          temperature: 0.4,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });
      return res.text ?? "";
    } catch (err) {
      const status = (err as { status?: number }).status ?? 0;
      if (attempt >= RETRIES || ![500, 503].includes(status)) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
    }
  }
}
