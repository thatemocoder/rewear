// Server-only. Prompt versions are switched in prompts/config.json (one line per feature).
// Prompt text is bundled at build time by scripts/build-prompts.mjs.
import { PROMPT_CONFIG } from "./prompts.config";
import { PROMPTS } from "./prompts.generated";
import type { Feature } from "./schemas";

export function getPrompt(feature: Feature): { version: string; text: string } {
  const version = PROMPT_CONFIG[feature];
  const text = PROMPTS[`${feature}_${version}`];
  if (!text) throw new Error(`Missing prompt ${feature}_${version}`);
  return { version, text };
}
