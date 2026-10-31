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

export type Feature = "plan" | "tag" | "buy" | "stylist" | "trends";

export interface ImageInput {
  mimeType: string;
  data: string; // base64, no data: prefix
}

/** An item as the AI referenced it. The ID is not guaranteed to exist in the catalogue. */
export interface ItemRef {
  item_id: string;
  description: string;
}

// ── Location, venue, weather (no AI) ─────────────────────────
export interface Place {
  label: string;
  lat: number;
  lon: number;
  source: "ip" | "device";
}
export interface Venue {
  name: string;
  address: string;
  kind: string; // e.g. "restaurant", "university", "hotel"
  lat: number;
  lon: number;
}
export interface Forecast {
  temperature_c: number;
  feels_like_c: number;
  rain_chance_pct: number | null;
  conditions: string;
  time: string; // local ISO, e.g. 2026-10-29T15:00
  timezone: string;
}

// ── Feature 2: plan ───────────────────────────────────────────
export interface PlanRequest {
  catalogue: CatalogueItem[];
  occasion: string;
  temperature_c: number;
  dress_code: DressCode;
  dress_code_notes: string;
  /** Optional context (plan v2+). */
  when?: string;
  location?: string;
  venue?: { name: string; kind: string; distance_km?: number };
  weather?: { source: "forecast" | "typed"; feels_like_c?: number; rain_chance_pct?: number; conditions?: string };
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
export type TagResult =
  | {
      ok: true;
      tags: ItemTags;
      /** Fields the AI says it is unsure about (tag v2+); shown to the person as "check this". */
      uncertain: (keyof ItemTags)[];
      /** How the AI read the photo, e.g. "Tagged the dress worn by the model." */
      note: string | null;
    }
  | { ok: false; reason: string };

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

// ── Stylist (Hem) ─────────────────────────────────────────────
export interface ChatTurn {
  role: "person" | "hem";
  text: string;
}
export interface StylistRequest {
  catalogue: CatalogueItem[];
  request: Omit<PlanRequest, "catalogue">;
  plan: PlanResult;
  conversation: ChatTurn[];
}
export interface StylistResult {
  reply: string;
  outfits: Outfit[];
  your_call: string | null;
}

// ── What's in style ───────────────────────────────────────────
export interface Article {
  id: number;
  source: string;
  date: string; // YYYY-MM-DD
  title: string;
  summary: string;
  url: string;
}
export interface Trend {
  name: string;
  summary: string;
  brands: string[];
  source_ids: number[];
  with_your_wardrobe: string;
  item_ids: string[];
}
export interface TrendsResult {
  as_of: string;
  trends: Trend[];
  articles: Pick<Article, "id" | "source" | "title" | "url" | "date">[]; // added server-side, not by the AI
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
  | {
      ok: true;
      data: T;
      raw: string;
      promptVersion: string;
      model: string;
      /** Rewear's post-check asked the AI again (e.g. it used an unknown item ID). */
      retried?: boolean;
      /** Problems still present after the retry; shown to the person. */
      warnings?: string[];
    }
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
