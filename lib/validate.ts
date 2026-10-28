// Server-side checks on what the browser sends. The catalogue comes from the client
// (seed + localStorage additions), so it is treated as untrusted input.
import { DRESS_CODES, ITEM_TYPES, type CatalogueItem, type DressCode, type ImageInput, type ItemType } from "./schemas";

const MAX_ITEMS = 200;
const MAX_IMAGE_B64 = 3_000_000; // ~2.2 MB decoded; client sends ~1024px JPEGs well under this
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

export const clip = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");

const scale = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? n : null;
};

export function sanitizeCatalogue(v: unknown): CatalogueItem[] | null {
  if (!Array.isArray(v) || v.length === 0) return null;
  const items: CatalogueItem[] = [];
  for (const raw of v.slice(0, MAX_ITEMS)) {
    if (!isObj(raw)) continue;
    const item_id = clip(raw.item_id, 8).toUpperCase();
    const type = clip(raw.type, 20) as ItemType;
    const formality = scale(raw.formality);
    const warmth = scale(raw.warmth);
    if (!/^[TBDOSA]\d{2,3}$/.test(item_id) || !ITEM_TYPES.includes(type) || !formality || !warmth) continue;
    items.push({ item_id, type, formality, warmth, colour: clip(raw.colour, 60), notes: clip(raw.notes, 120) });
  }
  return items.length ? items : null;
}

export function sanitizeImage(v: unknown): ImageInput | null {
  if (!isObj(v)) return null;
  const mimeType = clip(v.mimeType, 20);
  const data = typeof v.data === "string" ? v.data : "";
  if (!IMAGE_TYPES.includes(mimeType) || !data || data.length > MAX_IMAGE_B64) return null;
  if (!/^[A-Za-z0-9+/=]+$/.test(data)) return null;
  return { mimeType, data };
}

export function sanitizeDressCode(v: unknown): DressCode | null {
  return (DRESS_CODES as readonly string[]).includes(v as string) ? (v as DressCode) : null;
}
