"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AiLabel } from "@/components/AiLabel";
import { Icon } from "@/components/Icon";
import { PhotoDrop } from "@/components/PhotoDrop";
import { SwingTag } from "@/components/SwingTag";
import { TagEditor } from "@/components/TagEditor";
import { TagQueueList } from "@/components/TagQueueList";
import { WardrobeStrip } from "@/components/WardrobeStrip";
import { nextItemId, useCatalogue } from "@/lib/catalogue";
import { getKeepPhotosPref, setKeepPhotosPref } from "@/lib/photos";
import { revealOnSmallScreens } from "@/lib/reveal";
import type { CatalogueItem } from "@/lib/schemas";
import {
  MAX_QUEUE,
  discardEntry,
  editEntry,
  enqueue,
  isOpen,
  isReviewable,
  retryEntry,
  retryWithHint,
  saveEntry,
  tagManually,
  useTagQueue,
} from "@/lib/tagQueue";

export default function AddPage() {
  const catalogue = useCatalogue();
  const entries = useTagQueue();
  const [selectedKey, setSelectedKey] = useState<string>();
  const [lastSaved, setLastSaved] = useState<CatalogueItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [keepPhoto, setKeepPhoto] = useState(true);
  const [hint, setHint] = useState("");
  const [confirmDup, setConfirmDup] = useState<string | null>(null); // entry key whose duplicate warning was accepted
  useEffect(() => setKeepPhoto(getKeepPhotosPref()), []);
  const reviewRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  const active = entries.find((e) => e.key === selectedKey && isReviewable(e)) ?? entries.find(isReviewable);
  const working = entries.find((e) => e.status === "tagging" || e.status === "waiting");
  const waiting = entries.filter((e) => e.status === "queued").length;
  const open = entries.filter(isOpen);
  const savedCount = entries.filter((e) => e.status === "saved").length;

  // Bring the first draft into view on phones when it arrives.
  const activeKey = active?.key;
  useEffect(() => {
    if (activeKey) revealOnSmallScreens(reviewRef.current);
  }, [activeKey]);

  // Photos and drafts live only in memory: warn before the tab is closed with work open.
  const hasOpen = open.length > 0;
  useEffect(() => {
    if (!hasOpen) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasOpen]);

  function addFiles(files: File[]) {
    const skipped = enqueue(files);
    setLastSaved(null);
    setNotice(skipped ? `${skipped} file${skipped === 1 ? " was" : "s were"} skipped (images only, up to ${MAX_QUEUE} open at once).` : null);
  }

  function finish(action: () => void) {
    setSelectedKey(undefined);
    action();
    headingRef.current?.focus();
  }

  // Possible duplicate already in the wardrobe: same type and the same colour + notes (case-insensitive).
  const norm = (t: string) => t.trim().toLowerCase().replace(/s+/g, " ");
  const similar =
    active?.status === "draft" && active.value
      ? catalogue.find(
          (i) =>
            i.type === active.value!.type &&
            norm(i.colour) === norm(active.value!.colour) &&
            norm(i.notes) === norm(active.value!.notes),
        )
      : undefined;

  function save(e: FormEvent) {
    e.preventDefault();
    if (!active) return;
    if (similar && confirmDup !== active.key) return setConfirmDup(active.key);
    finish(() => setLastSaved(saveEntry(active.key, { keepPhoto })));
    setConfirmDup(null);
  }

  function retry(e: FormEvent) {
    e.preventDefault();
    if (!active || !hint.trim()) return;
    const key = active.key;
    setHint("");
    finish(() => retryWithHint(key, hint));
  }

  return (
    <div className="space-y-16">
      <div className="grid gap-12 md:grid-cols-[20rem_1fr] lg:gap-16">
        <section aria-labelledby="add-h">
          <h1 id="add-h" className="font-serif text-display font-normal tracking-tight">
            Add items
          </h1>
          <p className="mt-2 text-graphite">One garment per photo.</p>
          <div className="mt-8">
            <PhotoDrop onFiles={addFiles} multiple prompt="Drop photos here" hint={`or browse · up to ${MAX_QUEUE}`} />
          </div>
          <details className="group mt-3 text-sm">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md py-1 text-graphite hover:text-ink [&::-webkit-details-marker]:hidden">
              <Icon name="shield" className="size-4" /> Privacy
              <Icon name="chevron" className="size-3.5 transition-transform duration-200 group-open:rotate-180" />
            </summary>
            <p className="mt-2 rounded-lg border border-hairline bg-card p-3 text-graphite">
              Each photo is re-encoded in your browser (location data removed) and sent once to draft tags. Nothing is stored
              on a server. You can keep a small copy on this device only.
            </p>
          </details>
          {notice && (
            <p className="mt-2 text-sm" role="status">
              {notice}
            </p>
          )}
          <TagQueueList entries={entries} activeKey={active?.key} onSelect={setSelectedKey} />
        </section>

        <section ref={reviewRef} aria-labelledby="draft-h" aria-live="polite" className="scroll-mt-6">
          <h2 id="draft-h" ref={headingRef} tabIndex={-1} className="sr-only">
            Review
          </h2>

          {lastSaved && (
            <p className="rise mb-6 border-b border-hairline pb-3 text-sm" role="status">
              Saved <span className="font-mono">{lastSaved.item_id}</span> · {lastSaved.notes} to your wardrobe.
            </p>
          )}

          {!active && !working && waiting === 0 && (
            <>
              {savedCount > 0 && open.length === 0 && lastSaved ? (
                <div className="rise max-w-md">
                  <p className="care text-graphite">Queue finished</p>
                  <p className="mt-1 font-serif text-2xl">
                    {savedCount} item{savedCount === 1 ? "" : "s"} added to your wardrobe
                  </p>
                  <div className="mt-5 w-48">
                    <SwingTag item={lastSaved} />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4 py-10 text-center">
                  <span className="swing w-28 -rotate-3" aria-hidden>
                    <span className="swing-body flex h-36 flex-col justify-end px-3 pb-3">
                      <span className="swing-hole" />
                      <span className="mb-2 h-1.5 w-12 rounded-full bg-hairline" />
                      <span className="mb-1 h-1.5 w-16 rounded-full bg-hairline" />
                      <span className="h-1.5 w-10 rounded-full bg-hairline" />
                    </span>
                  </span>
                  <p className="font-serif text-lg text-graphite italic">Draft tags appear here.</p>
                  <p className="-mt-3 text-sm text-graphite">Nothing saves until you do.</p>
                </div>
              )}
            </>
          )}

          {!active && (working || waiting > 0) && (
            <p className="breathe border-t border-hairline pt-4 font-serif text-xl italic">
              {working?.status === "waiting" ? "Pausing for the AI's per-minute limit…" : "Reading the label…"}
            </p>
          )}

          {active && (
            <div key={active.key} className="rise">
              <p className="mb-4 text-sm text-graphite">
                {[
                  open.length > 1 && `${open.length - 1} more in the queue`,
                  working && working.key !== active.key && (working.status === "waiting" ? "pausing for the AI's per-minute limit" : "reading the next photo"),
                ]
                  .filter(Boolean)
                  .join(" · ") || "Last one"}
              </p>

              <div className="grid gap-6 sm:grid-cols-[9rem_1fr]">
                <div className="aspect-[4/5] w-36 overflow-hidden rounded-lg border border-hairline bg-card">
                  {active.preview && (
                    <img src={active.preview} alt={`Photo: ${active.name}`} className="size-full object-contain p-2" />
                  )}
                </div>

                {active.status === "draft" && active.draft && active.value && (
                  <form onSubmit={save} className="max-w-md">
                    <div className="mb-4 space-y-1.5">
                      {active.manual ? (
                        <p className="label">Tag it yourself</p>
                      ) : (
                        <>
                          <AiLabel>AI tags — check before saving</AiLabel>
                          {!!active.uncertain?.length && (
                            <p className="text-sm text-oxblood">
                              AI is unsure about: <strong className="font-semibold">{active.uncertain.join(", ")}</strong>. Check
                              {active.uncertain.length === 1 ? " it" : " them"} against the photo.
                            </p>
                          )}
                          {active.note && <p className="text-sm text-graphite italic">{active.note}</p>}
                          {active.hint && <p className="text-xs text-graphite">Your hint: “{active.hint}”</p>}
                        </>
                      )}
                    </div>
                    <TagEditor
                      itemId={nextItemId(active.value.type, catalogue)}
                      draft={active.draft}
                      value={active.value}
                      onChange={(v) => editEntry(active.key, v)}
                      uncertain={active.uncertain}
                      manual={active.manual}
                    />
                    <label className="mt-5 flex items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        className="mt-1 accent-[var(--color-ink)]"
                        checked={keepPhoto}
                        onChange={(e) => {
                          setKeepPhoto(e.target.checked);
                          setKeepPhotosPref(e.target.checked);
                        }}
                      />
                      <span>
                        Keep photo on this device
                        <span className="block text-xs text-graphite">For outfit views · never uploaded</span>
                      </span>
                    </label>
                    {similar && (
                      <p className="mt-4 rounded-lg border border-hairline bg-card px-3 py-2 text-sm" role="status">
                        Looks like <span className="font-mono">{similar.item_id}</span> ({similar.colour} {similar.notes}) is already in
                        your wardrobe.{" "}
                        {confirmDup === active.key ? "Press Save again to add it anyway." : "Change the tags, or Save to check again."}
                      </p>
                    )}
                    <div className="mt-5 flex flex-wrap items-center gap-5">
                      <button type="submit" className="btn">
                        {similar && confirmDup === active.key ? "Save anyway" : "Save to wardrobe"}
                      </button>
                      <button type="button" className="btn-quiet" onClick={() => finish(() => discardEntry(active.key))}>
                        Discard
                      </button>
                    </div>
                  </form>
                )}

                {active.status === "rejected" && (
                  <div className="border-t border-ink pt-2">
                    <AiLabel>AI response · no tags drafted</AiLabel>
                    <p className="mt-3 max-w-prose font-serif text-xl leading-snug italic">{active.reason}</p>

                    {/* Human override: point the AI at the right item, or tag it without AI. */}
                    <form onSubmit={retry} className="mt-5 max-w-md">
                      <label htmlFor="hint" className="label">
                        Is it one item? Say which <span className="opt">(e.g. “the black heels”, “earring set”)</span>
                      </label>
                      <div className="mt-1 flex items-end gap-3">
                        <input
                          id="hint"
                          className="field"
                          maxLength={80}
                          value={hint}
                          onChange={(e) => setHint(e.target.value)}
                          placeholder="the dress"
                        />
                        <button type="submit" className="btn-secondary shrink-0 py-2 text-sm" disabled={!hint.trim()}>
                          <Icon name="refresh" className="size-3.5" /> Try again
                        </button>
                      </div>
                    </form>
                    <div className="mt-4 flex flex-wrap gap-5 text-sm">
                      <button type="button" className="btn-quiet" onClick={() => tagManually(active.key)}>
                        Tag it myself (no AI)
                      </button>
                      <button type="button" className="btn-quiet" onClick={() => finish(() => discardEntry(active.key))}>
                        Remove from queue
                      </button>
                    </div>
                  </div>
                )}

                {active.status === "error" && (
                  <div className="border-t border-ink pt-4" role="alert">
                    <p className="text-sm font-semibold">Something went wrong</p>
                    <p className="mt-1 max-w-prose">{active.message}</p>
                    <div className="mt-5 flex flex-wrap items-center gap-5">
                      <button type="button" className="btn" onClick={() => finish(() => retryEntry(active.key))}>
                        Try again
                      </button>
                      <button type="button" className="btn-quiet" onClick={() => tagManually(active.key)}>
                        Tag it myself (no AI)
                      </button>
                      <button type="button" className="btn-quiet" onClick={() => finish(() => discardEntry(active.key))}>
                        Remove
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <WardrobeStrip catalogue={catalogue} />
    </div>
  );
}
