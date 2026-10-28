// Server-only: the only module that talks to Gemini. Never import from a client component.
import { GoogleGenAI, ThinkingLevel, type Part } from "@google/genai";
import type { ImageInput } from "./schemas";

/** Change the model here. Must support image input. */
export const GEMINI_MODEL = "gemini-3.8-flash";

let client: GoogleGenAI | null = null;

export function isConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

export async function generate(opts: { system: string; text: string; image?: ImageInput }): Promise<string> {
  client ??= new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const parts: Part[] = [{ text: opts.text }];
  if (opts.image) parts.push({ inlineData: opts.image });

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
}
