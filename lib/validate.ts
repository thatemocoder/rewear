// Server-side checks on what the browser sends. The catalogue comes from the client
// (seed + localStorage additions), so it is treated as untrusted input.
import { DRESS_CODES, ITEM_TYPES, type CatalogueItem, type DressCode, type ImageInput, type ItemType, type PlanRequest } from "./schemas";

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

const num = (v: unknown, min: number, max: number): number | undefined => {
  const n = Number(v);
  return v !== undefined && v !== null && v !== "" && Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : undefined;
};

/** The planning request minus the catalogue: required fields plus optional venue/weather context. */
export function sanitizePlanContext(v: unknown): { context: Omit<PlanRequest, "catalogue"> } | { error: string } {
  const b = isObj(v) ? v : {};
  const occasion = clip(b.occasion, 200);
  const temperature_c = Number(b.temperature_c);
  const dress_code = sanitizeDressCode(b.dress_code);
  if (!occasion) return { error: "Add an occasion." };
  if (!Number.isFinite(temperature_c) || temperature_c < -30 || temperature_c > 55) {
    return { error: "Enter a temperature between -30 and 55 °C." };
  }
  if (!dress_code) return { error: "Choose a dress code." };

  const context: Omit<PlanRequest, "catalogue"> = { occasion, temperature_c, dress_code, dress_code_notes: clip(b.dress_code_notes, 200) };
  const when = clip(b.when, 40);
  if (when) context.when = when;
  const location = clip(b.location, 80);
  if (location) context.location = location;
  if (isObj(b.venue) && clip(b.venue.name, 120)) {
    context.venue = { name: clip(b.venue.name, 120), kind: clip(b.venue.kind, 40), distance_km: num(b.venue.distance_km, 0, 20000) };
  }
  if (isObj(b.weather)) {
    const source = b.weather.source === "forecast" ? "forecast" : "typed";
    context.weather =
      source === "forecast"
        ? {
            source,
            feels_like_c: num(b.weather.feels_like_c, -50, 60),
            rain_chance_pct: num(b.weather.rain_chance_pct, 0, 100),
            conditions: clip(b.weather.conditions, 40) || undefined,
          }
        : { source };
  }
  return { context };
}

/** Item IDs the AI referenced that are not in the catalogue (deduplicated). */
export function unknownIds(ids: string[], catalogue: CatalogueItem[]): string[] {
  const known = new Set(catalogue.map((i) => i.item_id));
  return [...new Set(ids.filter((id) => !known.has(id)))];
}
export const idProblem = (ids: string[]) => (ids.length ? [`Unknown item_id ${ids.join(", ")} (not in the catalogue).`] : []);
