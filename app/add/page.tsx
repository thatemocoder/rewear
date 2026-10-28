"use client";

import { useRef, useState, type FormEvent } from "react";
import { AiLabel } from "@/components/AiLabel";
import { PhotoDrop } from "@/components/PhotoDrop";
import { SwingTag } from "@/components/SwingTag";
import { TagEditor } from "@/components/TagEditor";
import { WardrobeStrip } from "@/components/WardrobeStrip";
import { callAI } from "@/lib/api";
import { addItem, nextItemId, useCatalogue } from "@/lib/catalogue";
import { prepareImage } from "@/lib/image";
import { revealOnSmallScreens } from "@/lib/reveal";
import type { CatalogueItem, ItemTags } from "@/lib/schemas";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "rejected"; reason: string }
  | { status: "draft"; draft: ItemTags; value: ItemTags }
  | { status: "saved"; item: CatalogueItem };

export default function AddPage() {
  const catalogue = useCatalogue();
  // The photo lives only in this component's memory; it is dropped on save, discard or leaving the page.
  const [preview, setPreview] = useState<string | null>(null);
  const [state, setState] = useState<State>({ status: "idle" });
  const resultRef = useRef<HTMLElement>(null);

  async function handleFile(file: File) {
    setState({ status: "loading" });
    let image;
    try {
      image = await prepareImage(file);
    } catch (err) {
      setPreview(null);
      setState({ status: "error", message: (err as Error).message || "That photo couldn't be read." });
      return;
    }
    setPreview(image.previewUrl);
    const res = await callAI(
      "tag",
      { image: { mimeType: image.mimeType, data: image.data } },
      { photo: "attached (not stored or logged)" },
    );
    if (!res.ok) setState({ status: "error", message: res.message });
    else if (!res.data.ok) setState({ status: "rejected", reason: res.data.reason });
    else setState({ status: "draft", draft: res.data.tags, value: res.data.tags });
    revealOnSmallScreens(resultRef.current);
  }

  function save(e: FormEvent) {
    e.preventDefault();
    if (state.status !== "draft") return;
    const v = state.value;
    const item = addItem({ ...v, colour: v.colour.trim(), notes: v.notes.trim() });
    setPreview(null);
    setState({ status: "saved", item });
  }

  function reset() {
    setPreview(null);
    setState({ status: "idle" });
  }

  const busy = state.status === "loading";

  return (
    <div className="space-y-16">
      <div className="grid gap-12 md:grid-cols-[17rem_1fr] lg:gap-20">
        <section aria-labelledby="add-h">
          <h1 id="add-h" className="font-serif text-display font-normal tracking-tight">
            Add an item
          </h1>
          <p className="mt-3 text-graphite">
            Photograph one piece. The AI drafts its tags; you check every field before it joins your wardrobe.
          </p>
          <div className="mt-8">
            <PhotoDrop onFile={handleFile} disabled={busy} previewUrl={preview} />
          </div>
          <p className="mt-3 text-sm text-graphite">
            Photos aren&apos;t stored. Your browser re-encodes the image (removing location data) and sends it once to
            draft tags.
          </p>
        </section>

        <section ref={resultRef} aria-labelledby="draft-h" aria-live="polite" aria-busy={busy} className="scroll-mt-6">
          <h2 id="draft-h" className="sr-only">
            Draft tags
          </h2>

          {state.status === "idle" && (
            <p className="max-w-sm border-t border-hairline pt-4 font-serif text-xl leading-snug text-graphite italic">
              A draft tag appears here. Nothing is saved until you say so.
            </p>
          )}

          {busy && (
            <p className="breathe border-t border-hairline pt-4 font-serif text-xl italic">Reading the label…</p>
          )}

          {state.status === "error" && (
            <div className="rise border-t border-ink pt-4" role="alert">
              <p className="care text-graphite">Something went wrong</p>
              <p className="mt-1 max-w-prose">{state.message}</p>
            </div>
          )}

          {state.status === "rejected" && (
            <div className="rise border-t border-ink pt-2">
              <AiLabel>AI response · no tags drafted</AiLabel>
              <p className="mt-3 max-w-prose font-serif text-xl leading-snug italic">{state.reason}</p>
              <button type="button" className="btn-quiet mt-5" onClick={reset}>
                Try another photo
              </button>
            </div>
          )}

          {state.status === "draft" && (
            <form onSubmit={save} className="rise max-w-md">
              <div className="mb-4">
                <AiLabel>AI tags — check before saving</AiLabel>
                <p className="mt-1 text-sm text-graphite">
                  Every field is a guess from the photo. Correct anything that&apos;s wrong.
                </p>
              </div>
              <TagEditor
                itemId={nextItemId(state.value.type, catalogue)}
                draft={state.draft}
                value={state.value}
                onChange={(value) => setState({ ...state, value })}
              />
              <div className="mt-6 flex flex-wrap items-center gap-5">
                <button type="submit" className="btn">
                  Save to wardrobe
                </button>
                <button type="button" className="btn-quiet" onClick={reset}>
                  Discard
                </button>
              </div>
            </form>
          )}

          {state.status === "saved" && (
            <div className="rise max-w-md">
              <p className="care text-graphite">Saved to your wardrobe</p>
              <p className="mt-1 font-serif text-2xl">
                Added as <span className="font-mono text-xl">{state.item.item_id}</span>
              </p>
              <div className="mt-5 w-48">
                <SwingTag item={state.item} />
              </div>
              <button type="button" className="btn mt-6" onClick={reset}>
                Add another item
              </button>
            </div>
          )}
        </section>
      </div>

      <WardrobeStrip catalogue={catalogue} />
    </div>
  );
}
