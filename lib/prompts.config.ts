// Active prompt version per feature. Safe for client import (no prompt text).
import config from "@/prompts/config.json";
import type { Feature } from "./schemas";

export const PROMPT_CONFIG = config as Record<Feature, string>;
