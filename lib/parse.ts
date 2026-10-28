// All AI-response parsing lives here. v1 asks for JSON in the prompt but does not
// enforce a response schema, so parsing tolerates code fences and stray text, and
// returns null when the shape can't be read. It does NOT check item IDs against the
// catalogue (that is a candidate Phase 2 redesign).

import { ITEM_TYPES, type BuyResult, type ItemRef, type ItemType, type PlanResult, type TagResult } from "./schemas";

/** Pull the first JSON object out of a model reply. */
export function extractJson(raw: string): unknown {
  const text = raw
    .trim()
    .replace(/^`{3}(?:json)?\s*/i, "")
    .replace(/\s*`{3}$/, "");
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end <= start) return null;
    try {
      return JSON.parse(text.slice(start, end + 1));
    } catch {
      return null;
    }
  }
}

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");
const strOrNull = (v: unknown): string | null => str(v) || null;
const scale = (v: unknown): number => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(5, Math.max(1, n)) : 3;
};

function itemRefs(v: unknown): ItemRef[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((r): ItemRef | null => {
      if (typeof r === "string" && r.trim()) return { item_id: r.trim().toUpperCase(), description: "" };
      if (!isObj(r) || !str(r.item_id)) return null;
      return { item_id: str(r.item_id).toUpperCase(), description: str(r.description) };
    })
    .filter((r): r is ItemRef => r !== null);
}

export function parsePlan(raw: string): PlanResult | null {
  const j = extractJson(raw);
  if (!isObj(j) || !Array.isArray(j.outfits)) return null;
  const outfits = j.outfits
    .filter(isObj)
    .map((o) => ({ items: itemRefs(o.items), reason: str(o.reason) }))
    .filter((o) => o.items.length > 0);
  return { outfits, your_call: strOrNull(j.your_call), message: strOrNull(j.message) };
}

export function parseTag(raw: string): TagResult | null {
  const j = extractJson(raw);
  if (!isObj(j)) return null;
  if (j.ok === false) return { ok: false, reason: str(j.reason) || "That photo couldn't be tagged." };
  if (!isObj(j.tags)) return null;
  const t = j.tags;
  const type = str(t.type).toLowerCase();
  return {
    ok: true,
    tags: {
      type: (ITEM_TYPES as readonly string[]).includes(type) ? (type as ItemType) : "top",
      colour: str(t.colour),
      formality: scale(t.formality),
      warmth: scale(t.warmth),
      notes: str(t.notes),
    },
  };
}

export function parseBuy(raw: string): BuyResult | null {
  const j = extractJson(raw);
  if (!isObj(j) || !("same_role" in j || "new_combinations" in j)) return null;
  const n = j.new_combinations === null || j.new_combinations === undefined ? NaN : Number(j.new_combinations);
  return {
    considered_item: str(j.considered_item),
    same_role: itemRefs(j.same_role),
    new_combinations: Number.isFinite(n) ? Math.max(0, Math.round(n)) : null,
    estimate_explanation: str(j.estimate_explanation),
  };
}
