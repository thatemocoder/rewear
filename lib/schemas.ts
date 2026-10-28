// Shared types and constants. Safe to import from both client and server.

export const ITEM_TYPES = ["top", "bottom", "dress", "outerwear", "shoes", "accessory"] as const;
export type ItemType = (typeof ITEM_TYPES)[number];

export const TYPE_PREFIX: Record<ItemType, string> = {
  top: "T",
  bottom: "B",
  dress: "D",
  outerwear: "O",
  shoes: "S",
  accessory: "A",
};

export interface CatalogueItem {
  item_id: string;
  type: ItemType;
  colour: string;
  formality: number; // 1 gym/lounge → 5 formal event
  warmth: number; // 1 very light → 5 very warm
  notes: string;
}

export type ItemTags = Omit<CatalogueItem, "item_id">;

export const DRESS_CODES = [
  "casual",
  "smart casual",
  "business casual",
  "business",
  "formal",
  "not sure",
] as const;
export type DressCode = (typeof DRESS_CODES)[number];

export type Feature = "plan" | "tag" | "buy";

export interface ImageInput {
  mimeType: string;
  data: string; // base64, no data: prefix
}

/** An item as the AI referenced it. The ID is not guaranteed to exist in the catalogue. */
export interface ItemRef {
  item_id: string;
  description: string;
}

// ── Feature 2: plan ───────────────────────────────────────────
export interface PlanRequest {
  catalogue: CatalogueItem[];
  occasion: string;
  temperature_c: number;
  dress_code: DressCode;
  dress_code_notes: string;
}
export interface Outfit {
  items: ItemRef[];
  reason: string;
}
export interface PlanResult {
  outfits: Outfit[];
  your_call: string | null;
  message: string | null;
}

// ── Feature 1: tag ────────────────────────────────────────────
export interface TagRequest {
  image: ImageInput;
}
export type TagResult = { ok: true; tags: ItemTags } | { ok: false; reason: string };

// ── Feature 3: buy ────────────────────────────────────────────
export interface BuyRequest {
  catalogue: CatalogueItem[];
  considering: string;
  image?: ImageInput;
}
export interface BuyResult {
  considered_item: string;
  same_role: ItemRef[];
  new_combinations: number | null;
  estimate_explanation: string;
}

// ── API envelope ──────────────────────────────────────────────
export type ApiErrorCode =
  | "bad_request"
  | "rate_limited" // Rewear's own daily cap
  | "ai_busy" // Gemini per-minute quota; retryAfterSec says how long to wait
  | "quota_daily" // Gemini per-day quota; resetAt says when it resets
  | "ai_error"
  | "parse_failed"
  | "not_configured";

export type ApiResponse<T> =
  | { ok: true; data: T; raw: string; promptVersion: string; model: string }
  | {
      ok: false;
      error: ApiErrorCode;
      message: string;
      raw?: string;
      promptVersion?: string;
      model?: string;
      retryAfterSec?: number;
      resetAt?: string;
    };
