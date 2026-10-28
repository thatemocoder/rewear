"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AiLabel } from "@/components/AiLabel";
import { PhotoDrop } from "@/components/PhotoDrop";
import { SwingTag } from "@/components/SwingTag";
import { TagEditor } from "@/components/TagEditor";
import { TagQueueList } from "@/components/TagQueueList";
import { WardrobeStrip } from "@/components/WardrobeStrip";
import { nextItemId, useCatalogue } from "@/lib/catalogue";
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
  saveEntry,
  useTagQueue,
} from "@/lib/tagQueue";

export default function AddPage() {
  const catalogue = useCatalogue();
  const entries = useTagQueue();
  const [selectedKey, setSelectedKey] = useState<string>();
  const [lastSaved, setLastSaved] = useState<CatalogueItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
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

  function save(e: FormEvent) {
    e.preventDefault();
    if (!active) return;
    finish(() => setLastSaved(saveEntry(active.key)));
  }

  return (
    <div className="space-y-16">
      <div className="grid gap-12 md:grid-cols-[17rem_1fr] lg:gap-20">
        <section aria-labelledby="add-h">
          <h1 id="add-h" className="font-serif text-display font-normal tracking-tight">
            Add items
          </h1>
          <p className="mt-3 text-graphite">
            Photograph one piece per photo. The AI drafts the tags; you check every field before anything joins your
            wardrobe.
          </p>
          <div className="mt-8">
            <PhotoDrop
              onFiles={addFiles}
              multiple
              prompt="Drop photos, one garment each"
              hint={`or choose files · up to ${MAX_QUEUE}`}
            />
          </div>
          <p className="mt-3 text-sm text-graphite">
            Photos aren&apos;t stored. Your browser re-encodes each image (removing location data) and sends it once to
            draft tags. Photos are tagged one at a time.
          </p>
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
                <p className="max-w-sm border-t border-hairline pt-4 font-serif text-xl leading-snug text-graphite italic">
                  Draft tags appear here, one photo at a time. Nothing is saved until you say so.
                </p>
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
              <p className="care mb-4 text-graphite">
                {[
                  open.length > 1 && `${open.length - 1} more in the queue`,
                  working && working.key !== active.key && (working.status === "waiting" ? "pausing for the AI's per-minute limit" : "reading the next photo"),
                ]
                  .filter(Boolean)
                  .join(" · ") || "Last one"}
              </p>

              <div className="grid gap-6 sm:grid-cols-[9rem_1fr]">
                <div className="aspect-[4/5] w-36 border border-hairline bg-card">
                  {active.preview && (
                    <img src={active.preview} alt={`Photo: ${active.name}`} className="size-full object-contain p-2" />
                  )}
                </div>

                {active.status === "draft" && active.draft && active.value && (
                  <form onSubmit={save} className="max-w-md">
                    <div className="mb-4">
                      <AiLabel>AI tags — check before saving</AiLabel>
                      <p className="mt-1 text-sm text-graphite">
                        Every field is a guess from the photo. Correct anything that&apos;s wrong.
                      </p>
                    </div>
                    <TagEditor
                      itemId={nextItemId(active.value.type, catalogue)}
                      draft={active.draft}
                      value={active.value}
                      onChange={(v) => editEntry(active.key, v)}
                    />
                    <div className="mt-6 flex flex-wrap items-center gap-5">
                      <button type="submit" className="btn">
                        Save to wardrobe
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
                    <button type="button" className="btn-quiet mt-5" onClick={() => finish(() => discardEntry(active.key))}>
                      Remove from queue
                    </button>
                  </div>
                )}

                {active.status === "error" && (
                  <div className="border-t border-ink pt-4" role="alert">
                    <p className="care text-graphite">Something went wrong</p>
                    <p className="mt-1 max-w-prose">{active.message}</p>
                    <div className="mt-5 flex gap-5">
                      <button type="button" className="btn" onClick={() => finish(() => retryEntry(active.key))}>
                        Try again
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
