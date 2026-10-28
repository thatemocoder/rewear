// Client-side catalogue store: the seed file plus items this viewer has added.
// Additions are mirrored to localStorage when it's available; if it isn't (private
// mode, blocked storage) they live in memory for the session and the app still works.
import { useSyncExternalStore } from "react";
import seedJson from "@/data/catalogue.json";
import { downloadFile } from "./download";
import { TYPE_PREFIX,type CatalogueItem, type ItemTags, type ItemType } from "./schemas";
import { sanitizeCatalogue } from "./validate";

const KEY = "rewear.added.v1";
export const SEED = (sanitizeCatalogue(seedJson) ?? []) as CatalogueItem[];

let added: CatalogueItem[] | null = null;
let combined: CatalogueItem[] = SEED;
let storageOk = true;
const listeners = new Set<() => void>();

function init() {
  if (added) return;
  added = [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) added = sanitizeCatalogue(JSON.parse(raw)) ?? [];
  } catch {
    storageOk = false;
  }
  // Once exported items become the seed, the seed copy wins over the browser copy.
  const seedIds = new Set(SEED.map((i) => i.item_id));
  added = added.filter((i) => !seedIds.has(i.item_id));
  combined = [...SEED, ...added];
}

function commit(next: CatalogueItem[]) {
  added = next;
  combined = [...SEED, ...next];
  try {
    if (next.length) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
    storageOk = true;
  } catch {
    storageOk = false;
  }
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

/** Next free ID for a type, e.g. T01, T02 … (T100 if ever needed). */
export function nextItemId(type: ItemType, catalogue: CatalogueItem[] = getSnapshot()): string {
  const prefix = TYPE_PREFIX[type];
  const used = new Set(catalogue.filter((i) => i.item_id.startsWith(prefix)).map((i) => Number(i.item_id.slice(1))));
  let n = 1;
  while (used.has(n)) n++;
  return prefix + String(n).padStart(2, "0");
}

export function addItem(tags: ItemTags): CatalogueItem {
  init();
  const item: CatalogueItem = { item_id: nextItemId(tags.type), ...tags };
  commit([...added!, item]);
  return item;
}

/** Downloads the full catalogue (seed + additions) in the exact data/catalogue.json format. */
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

/** "Reset to my catalogue": drop everything this viewer added. */
export function resetCatalogue() {
  init();
  commit([]);
}
