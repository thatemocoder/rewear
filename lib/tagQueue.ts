// Queue for tagging several photos. Photos are processed one at a time (gentle on the
// free-tier quota). The AI only drafts: every item still needs the person's Save.
// Photos live in memory only, survive switching tabs within the app, and are dropped
// as soon as an item is saved or discarded. Nothing here is persisted.
import { useSyncExternalStore } from "react";
import { callAI } from "./api";
import { addItem } from "./catalogue";
import { prepareImage } from "./image";
import { savePhoto } from "./photos";
import type { CatalogueItem, ImageInput, ItemTags } from "./schemas";

export const MAX_QUEUE = 12;

/** Automatic waits per photo when Gemini's per-minute limit is hit. */
const MAX_WAITS = 3;

export type QueueStatus = "queued" | "tagging" | "waiting" | "draft" | "rejected" | "error" | "saved" | "discarded";

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
  uncertain?: (keyof ItemTags)[]; // fields the AI flagged as unsure (tag v2+)
  note?: string | null; // how the AI read the photo
  hint?: string; // the person's pointer, e.g. "the black heels"
  manual?: boolean; // tagged by the person without AI
  hash?: string; // fingerprint of the re-encoded photo, to catch duplicates
  allowDuplicate?: boolean;
}

const BLANK: ItemTags = { type: "top", colour: "", formality: 3, warmth: 2, notes: "" };

/** Cheap fingerprint of the re-encoded image data (FNV-1a over a sample). */
function fingerprint(data: string): string {
  let h = 0x811c9dc5;
  const step = Math.max(1, Math.floor(data.length / 4096));
  for (let i = 0; i < data.length; i += step) {
    h ^= data.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return `${data.length.toString(36)}-${h.toString(36)}`;
}

/** Needs the person's attention. */
export const isReviewable = (e: QueueEntry) => e.status === "draft" || e.status === "rejected" || e.status === "error";
export const isOpen = (e: QueueEntry) => e.status !== "saved" && e.status !== "discarded";

let entries: QueueEntry[] = [];
const files = new Map<string, File>(); // kept outside entries; only for (re)processing
const images = new Map<string, ImageInput>(); // re-encoded copies, reused on retry
const waits = new Map<string, number>(); // per-photo count of automatic waits
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
      update(key, { preview: prepared.previewUrl, hash: fingerprint(prepared.data) });
    } catch (err) {
      return update(key, { status: "error", message: (err as Error).message || "That photo couldn't be read." });
    }
  }

  // Same photo already in this session's queue: don't spend an AI call on it.
  // Only photos queued earlier count, so the first copy is always the one that gets tagged.
  const myIndex = entries.findIndex((e) => e.key === key);
  const me = entries[myIndex];
  const twin =
    me.hash && !me.allowDuplicate && entries.slice(0, myIndex).find((e) => e.hash === me.hash && e.status !== "discarded");
  if (twin) {
    return update(key, {
      status: "error",
      message: `Same photo as “${twin.name}”${twin.savedId ? `, already saved as ${twin.savedId}` : ""}. Remove it, or try again if it's a different item.`,
      allowDuplicate: true, // a deliberate retry goes through
    });
  }

  const hint = me.hint?.trim() || undefined;
  const res = await callAI(
    "tag",
    { image, ...(hint && { hint }) },
    { photo: "attached (not stored or logged)", ...(hint && { hint }) },
  );

  // Gemini's per-minute limit: wait as long as it asks, then retry this photo (a few times at most).
  const tries = (waits.get(key) ?? 0) + 1;
  if (!res.ok && res.error === "ai_busy" && tries <= MAX_WAITS) {
    waits.set(key, tries);
    const sec = (res.retryAfterSec ?? 30) + 2;
    update(key, { status: "waiting", message: `Waiting ${sec}s for the AI's per-minute limit` });
    await new Promise((r) => setTimeout(r, sec * 1000));
    if (entries.find((e) => e.key === key)?.status === "waiting") update(key, { status: "queued" });
    return;
  }
  waits.delete(key);

  // Daily quota used up: stop the queue; everything still waiting becomes retryable later.
  if (!res.ok && res.error === "quota_daily") {
    entries = entries.map((e) =>
      e.key === key || e.status === "queued" ? { ...e, status: "error" as const, message: res.message } : e,
    );
    emit();
    return;
  }

  if (!res.ok) update(key, { status: "error", message: res.message });
  else if (!res.data.ok) update(key, { status: "rejected", reason: res.data.reason });
  else
    update(key, {
      status: "draft",
      draft: res.data.tags,
      value: res.data.tags,
      uncertain: res.data.uncertain,
      note: res.data.note,
      manual: false,
    });
}

export function editEntry(key: string, value: ItemTags) {
  update(key, { value });
}

/**
 * The person confirms the (possibly edited) tags. This is the only path that saves.
 * With keepPhoto, a small thumbnail is kept on this device (IndexedDB) for outfit views.
 */
export function saveEntry(key: string, { keepPhoto = false } = {}): CatalogueItem | null {
  const e = entries.find((x) => x.key === key);
  if (!e || e.status !== "draft" || !e.value) return null;
  const item = addItem({ ...e.value, colour: e.value.colour.trim(), notes: e.value.notes.trim() });
  if (keepPhoto && e.preview) void savePhoto(item.item_id, e.preview);
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

/** After a rejection: ask the AI again, pointing at the item the person means. */
export function retryWithHint(key: string, hint: string) {
  if (!files.has(key) && !images.has(key)) return;
  update(key, { status: "queued", hint: hint.trim().slice(0, 80), reason: undefined });
  void pump();
}

/** The person tags the photo themselves; no AI call. */
export function tagManually(key: string) {
  update(key, { status: "draft", draft: { ...BLANK }, value: { ...BLANK }, uncertain: [], note: null, manual: true });
}

/** Removes saved and discarded rows from the list. */
export function clearFinished() {
  entries = entries.filter(isOpen);
  emit();
}
