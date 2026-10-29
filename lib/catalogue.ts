// Client-side catalogue store: the seed file plus this viewer's own changes.
// - Added items:            localStorage "rewear.added.v1" (array of catalogue items, unchanged format)
// - Edits/removals of seed:  localStorage "rewear.edits.v1" ({ overrides, removed })
// If storage is unavailable (private mode, blocked storage) changes live in memory for
// the session and the app still works.
import { useSyncExternalStore } from "react";
import seedJson from "@/data/catalogue.json";
import { downloadFile } from "./download";
import { TYPE_PREFIX, type CatalogueItem, type ItemTags, type ItemType } from "./schemas";
import { sanitizeCatalogue } from "./validate";

const ADDED_KEY = "rewear.added.v1";
const EDITS_KEY = "rewear.edits.v1";
export const SEED = (sanitizeCatalogue(seedJson) ?? []) as CatalogueItem[];
const SEED_IDS = new Set(SEED.map((i) => i.item_id));

/** Fields a person can change after an item exists. Type is fixed because it sets the ID prefix. */
export type ItemEdit = Partial<Pick<CatalogueItem, "colour" | "notes" | "formality" | "warmth">>;

interface Edits {
  overrides: Record<string, ItemEdit>;
  removed: string[];
}

let added: CatalogueItem[] | null = null;
let edits: Edits = { overrides: {}, removed: [] };
let combined: CatalogueItem[] = SEED;
let storageOk = true;
const listeners = new Set<() => void>();

function rebuild() {
  const removed = new Set(edits.removed);
  const seed = SEED.filter((i) => !removed.has(i.item_id)).map((i) => ({ ...i, ...edits.overrides[i.item_id] }));
  combined = [...seed, ...added!];
}

function init() {
  if (added) return;
  added = [];
  try {
    const raw = window.localStorage.getItem(ADDED_KEY);
    if (raw) added = sanitizeCatalogue(JSON.parse(raw)) ?? [];
    const e = window.localStorage.getItem(EDITS_KEY);
    if (e) {
      const parsed = JSON.parse(e) as Partial<Edits>;
      edits = { overrides: parsed.overrides ?? {}, removed: Array.isArray(parsed.removed) ? parsed.removed : [] };
    }
  } catch {
    storageOk = false;
  }
  // Once exported items become the seed, the seed copy wins over the browser copy.
  added = added.filter((i) => !SEED_IDS.has(i.item_id));
  rebuild();
}

function write(key: string, value: unknown, empty: boolean) {
  try {
    if (empty) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, JSON.stringify(value));
    storageOk = true;
  } catch {
    storageOk = false;
  }
}

function commit(next: { added?: CatalogueItem[]; edits?: Edits }) {
  if (next.added) {
    added = next.added;
    write(ADDED_KEY, added, added.length === 0);
  }
  if (next.edits) {
    edits = next.edits;
    write(EDITS_KEY, edits, !Object.keys(edits.overrides).length && !edits.removed.length);
  }
  rebuild();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

function getSnapshot() {
  init();
  return combined;
}

export function useCatalogue(): CatalogueItem[] {
  return useSyncExternalStore(subscribe, getSnapshot, () => SEED);
}

export function isStorageAvailable() {
  return storageOk;
}

export function addedCount() {
  init();
  return added!.length;
}

/** Added + edited + removed, for the reset prompt. */
export function localChangeCount() {
  init();
  return added!.length + Object.keys(edits.overrides).length + edits.removed.length;
}

export function isAddedHere(id: string) {
  init();
  return added!.some((i) => i.item_id === id);
}

export function isEditedHere(id: string) {
  init();
  return Boolean(edits.overrides[id]);
}

/** Next free ID for a type, e.g. T01, T02 … Shipped IDs are never reused, even if removed here. */
export function nextItemId(type: ItemType, catalogue: CatalogueItem[] = getSnapshot()): string {
  const prefix = TYPE_PREFIX[type];
  const used = new Set(
    [...catalogue.map((i) => i.item_id), ...SEED_IDS].filter((id) => id.startsWith(prefix)).map((id) => Number(id.slice(1))),
  );
  let n = 1;
  while (used.has(n)) n++;
  return prefix + String(n).padStart(2, "0");
}

export function addItem(tags: ItemTags): CatalogueItem {
  init();
  const item: CatalogueItem = { item_id: nextItemId(tags.type), ...tags };
  commit({ added: [...added!, item] });
  return item;
}

export function updateItem(id: string, patch: ItemEdit) {
  init();
  if (added!.some((i) => i.item_id === id)) {
    commit({ added: added!.map((i) => (i.item_id === id ? { ...i, ...patch } : i)) });
  } else if (SEED_IDS.has(id)) {
    commit({ edits: { ...edits, overrides: { ...edits.overrides, [id]: { ...edits.overrides[id], ...patch } } } });
  }
}

export function removeItem(id: string) {
  init();
  if (added!.some((i) => i.item_id === id)) {
    commit({ added: added!.filter((i) => i.item_id !== id) });
  } else if (SEED_IDS.has(id)) {
    const { [id]: _dropped, ...overrides } = edits.overrides;
    commit({ edits: { overrides, removed: [...new Set([...edits.removed, id])] } });
  }
}

/** Downloads the full catalogue (seed + changes) in the exact data/catalogue.json format. */
export function exportCatalogueJson() {
  const items = getSnapshot().map(({ item_id, type, colour, formality, warmth, notes }) => ({
    item_id,
    type,
    colour,
    formality,
    warmth,
    notes,
  }));
  downloadFile("catalogue.json", JSON.stringify(items, null, 2) + "\n", "application/json");
}

/** "Reset to my catalogue": drop everything this viewer added, edited or removed. */
export function resetCatalogue() {
  init();
  commit({ added: [], edits: { overrides: {}, removed: [] } });
}
