// Queue for tagging several photos. Photos are processed one at a time (gentle on the
// free-tier quota). The AI only drafts: every item still needs the person's Save.
// Photos live in memory only, survive switching tabs within the app, and are dropped
// as soon as an item is saved or discarded. Nothing here is persisted.
import { useSyncExternalStore } from "react";
import { callAI } from "./api";
import { addItem } from "./catalogue";
import { prepareImage } from "./image";
import type { CatalogueItem, ImageInput, ItemTags } from "./schemas";

export const MAX_QUEUE = 12;

export type QueueStatus = "queued" | "tagging" | "draft" | "rejected" | "error" | "saved" | "discarded";

export interface QueueEntry {
  key: string;
  name: string;
  status: QueueStatus;
  preview: string | null; // in-memory data URL, cleared once finished
  draft?: ItemTags; // the AI's original suggestion
  value?: ItemTags; // the person's edited version
  reason?: string; // AI said it's not a single garment
  message?: string; // error text
  savedId?: string;
}

/** Needs the person's attention. */
export const isReviewable = (e: QueueEntry) => e.status === "draft" || e.status === "rejected" || e.status === "error";
export const isOpen = (e: QueueEntry) => e.status !== "saved" && e.status !== "discarded";

let entries: QueueEntry[] = [];
const files = new Map<string, File>(); // kept outside entries; only for (re)processing
const images = new Map<string, ImageInput>(); // re-encoded copies, reused on retry
const listeners = new Set<() => void>();
let running = false;

const EMPTY: QueueEntry[] = [];

function emit() {
  listeners.forEach((l) => l());
}

function update(key: string, patch: Partial<QueueEntry>) {
  entries = entries.map((e) => (e.key === key ? { ...e, ...patch } : e));
  emit();
}

function forget(key: string) {
  files.delete(key);
  images.delete(key);
}

export function useTagQueue(): QueueEntry[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => entries,
    () => EMPTY,
  );
}

/** Adds photos to the queue. Returns how many were skipped for being over the limit or not images. */
export function enqueue(list: File[]): number {
  const room = MAX_QUEUE - entries.filter(isOpen).length;
  const accepted = list.filter((f) => f.type.startsWith("image/")).slice(0, Math.max(0, room));
  for (const f of accepted) {
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    files.set(key, f);
    entries = [...entries, { key, name: f.name, status: "queued", preview: null }];
  }
  emit();
  void pump();
  return list.length - accepted.length;
}

async function pump() {
  if (running) return;
  running = true;
  try {
    let next: QueueEntry | undefined;
    while ((next = entries.find((e) => e.status === "queued"))) await processEntry(next.key);
  } finally {
    running = false;
  }
}

async function processEntry(key: string) {
  update(key, { status: "tagging", message: undefined, reason: undefined });

  let image = images.get(key);
  if (!image) {
    const file = files.get(key);
    if (!file) return update(key, { status: "error", message: "The photo is no longer available. Add it again." });
    try {
      const prepared = await prepareImage(file);
      image = { mimeType: prepared.mimeType, data: prepared.data };
      images.set(key, image);
      files.delete(key); // the original file (with its metadata) is no longer needed
      update(key, { preview: prepared.previewUrl });
    } catch (err) {
      return update(key, { status: "error", message: (err as Error).message || "That photo couldn't be read." });
    }
  }

  const res = await callAI("tag", { image }, { photo: "attached (not stored or logged)" });
  if (!res.ok) update(key, { status: "error", message: res.message });
  else if (!res.data.ok) update(key, { status: "rejected", reason: res.data.reason });
  else update(key, { status: "draft", draft: res.data.tags, value: res.data.tags });
}

export function editEntry(key: string, value: ItemTags) {
  update(key, { value });
}

/** The person confirms the (possibly edited) tags. This is the only path that saves. */
export function saveEntry(key: string): CatalogueItem | null {
  const e = entries.find((x) => x.key === key);
  if (!e || e.status !== "draft" || !e.value) return null;
  const item = addItem({ ...e.value, colour: e.value.colour.trim(), notes: e.value.notes.trim() });
  forget(key);
  update(key, { status: "saved", savedId: item.item_id, preview: null });
  return item;
}

export function discardEntry(key: string) {
  forget(key);
  update(key, { status: "discarded", preview: null });
}

export function retryEntry(key: string) {
  if (!files.has(key) && !images.has(key)) return;
  update(key, { status: "queued" });
  void pump();
}

/** Removes saved and discarded rows from the list. */
export function clearFinished() {
  entries = entries.filter(isOpen);
  emit();
}
