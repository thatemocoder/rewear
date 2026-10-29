// Item photos kept ON THIS DEVICE ONLY (IndexedDB), as small re-encoded JPEG thumbnails.
// They are never uploaded: the only time a photo leaves the browser is the one-off tagging
// call in Add items, exactly as before. If IndexedDB is unavailable, items simply show
// their colour silhouette instead.
import { useSyncExternalStore } from "react";

const DB = "rewear";
const STORE = "photos";
const THUMB_SIDE = 480;
const PREF_KEY = "rewear.keepPhotos.v1";

let urls = new Map<string, string>(); // item_id → object URL
let loaded = false;
const listeners = new Set<() => void>();
const EMPTY = new Map<string, string>();

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function emit(next: Map<string, string>) {
  urls = next;
  listeners.forEach((l) => l());
}

async function load() {
  if (loaded) return;
  loaded = true;
  try {
    const keys = (await tx("readonly", (s) => s.getAllKeys())) as string[];
    const next = new Map<string, string>();
    for (const k of keys) {
      const blob = (await tx("readonly", (s) => s.get(k))) as Blob | undefined;
      if (blob) next.set(k, URL.createObjectURL(blob));
    }
    emit(next);
  } catch {
    /* IndexedDB unavailable: silhouettes only */
  }
}

/** item_id → displayable photo URL, for items with a kept photo. */
export function usePhotos(): Map<string, string> {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      void load();
      return () => listeners.delete(l);
    },
    () => urls,
    () => EMPTY,
  );
}

/** Downscale a (data or object) URL to a small JPEG thumbnail. Re-encoding keeps metadata out. */
async function thumbnail(src: string): Promise<Blob> {
  const img = new Image();
  img.src = src;
  await img.decode();
  const ratio = Math.min(1, THUMB_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * ratio);
  canvas.height = Math.round(img.naturalHeight * ratio);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Couldn't save the photo."))), "image/jpeg", 0.82),
  );
}

/** Keep a photo for an item. `src` should already be a re-encoded image (e.g. from prepareImage). */
export async function savePhoto(itemId: string, src: string): Promise<boolean> {
  try {
    const blob = await thumbnail(src);
    await tx("readwrite", (s) => s.put(blob, itemId));
    const next = new Map(urls);
    const old = next.get(itemId);
    if (old) URL.revokeObjectURL(old);
    next.set(itemId, URL.createObjectURL(blob));
    emit(next);
    return true;
  } catch {
    return false;
  }
}

export async function deletePhoto(itemId: string) {
  try {
    await tx("readwrite", (s) => s.delete(itemId));
  } catch {
    /* nothing stored */
  }
  if (!urls.has(itemId)) return;
  const next = new Map(urls);
  URL.revokeObjectURL(next.get(itemId)!);
  next.delete(itemId);
  emit(next);
}

export async function clearPhotos() {
  try {
    await tx("readwrite", (s) => s.clear());
  } catch {
    /* nothing stored */
  }
  urls.forEach((u) => URL.revokeObjectURL(u));
  emit(new Map());
}

/** Remembered choice for "Keep a small photo on this device" (default: on). */
export function getKeepPhotosPref(): boolean {
  try {
    return window.localStorage.getItem(PREF_KEY) !== "0";
  } catch {
    return true;
  }
}
export function setKeepPhotosPref(on: boolean) {
  try {
    window.localStorage.setItem(PREF_KEY, on ? "1" : "0");
  } catch {
    /* not remembered */
  }
}
