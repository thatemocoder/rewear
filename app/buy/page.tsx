"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { AiLabel } from "@/components/AiLabel";
import { Icon } from "@/components/Icon";
import { PhotoDrop } from "@/components/PhotoDrop";
import { CheckNote } from "@/components/CheckNote";
import { EmptyCompare } from "@/components/EmptyCompare";
import { GarmentCard } from "@/components/GarmentCard";
import { WardrobeStrip } from "@/components/WardrobeStrip";
import { callAI } from "@/lib/api";
import { useCatalogue } from "@/lib/catalogue";
import { usePhotos } from "@/lib/photos";
import { prepareImage } from "@/lib/image";
import { revealOnSmallScreens } from "@/lib/reveal";
import type { BuyResult, ImageInput } from "@/lib/schemas";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: BuyResult; check?: { warnings?: string[]; retried?: boolean } };

export default function BuyPage() {
  const catalogue = useCatalogue();
  const photos = usePhotos();
  const [considering, setConsidering] = useState("");
  // Optional photo: memory only, never stored.
  const [photo, setPhoto] = useState<(ImageInput & { previewUrl: string }) | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [state, setState] = useState<State>({ status: "idle" });
  const resultsRef = useRef<HTMLElement>(null);

  const byId = useMemo(() => new Map(catalogue.map((i) => [i.item_id, i])), [catalogue]);
  const marks = useMemo(
    () => new Map(state.status === "done" ? state.result.same_role.map((r) => [r.item_id, "Same role"]) : []),
    [state],
  );

  async function choosePhoto(files: File[]) {
    setPhotoError(null);
    try {
      setPhoto(await prepareImage(files[0]));
    } catch (err) {
      setPhoto(null);
      setPhotoError((err as Error).message);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });
    const body = {
      catalogue,
      considering,
      ...(photo && { image: { mimeType: photo.mimeType, data: photo.data } }),
    };
    const res = await callAI("buy", body, {
      considering,
      photo: photo ? "attached (not stored or logged)" : "none",
      catalogue_ids: catalogue.map((i) => i.item_id).join(" "),
    });
    setState(
      res.ok
        ? { status: "done", result: res.data, check: { warnings: res.warnings, retried: res.retried } }
        : { status: "error", message: res.message },
    );
    revealOnSmallScreens(resultsRef.current);
  }

  return (
    <div className="space-y-16">
      <div className="grid gap-12 md:grid-cols-[20rem_1fr] lg:gap-16">
        <section aria-labelledby="buy-h">
          <h1 id="buy-h" className="font-serif text-display font-normal tracking-tight">
            Before you buy
          </h1>
          <p className="mt-2 text-graphite">How it overlaps with what you own.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <div className="panel space-y-5">
            <div>
              <label htmlFor="considering" className="label">
                What are you considering?
              </label>
              <input
                id="considering"
                className="field"
                required
                maxLength={300}
                placeholder="black blazer, $120"
                value={considering}
                onChange={(e) => setConsidering(e.target.value)}
              />
            </div>
            <div>
              <p className="label mb-2">
                Photo <span className="opt">(optional)</span>
              </p>
              <PhotoDrop onFiles={choosePhoto} compact previewUrl={photo?.previewUrl} prompt="Add a photo" hint="Drop or browse" />
              {photo && (
                <button type="button" className="btn-quiet mt-2 text-sm" onClick={() => setPhoto(null)}>
                  Remove photo
                </button>
              )}
              {photoError && <p className="mt-2 text-sm">{photoError}</p>}
            </div>
            </div>
            <button type="submit" className="btn w-full justify-between" disabled={state.status === "loading"}>
              {state.status === "loading" ? "Working…" : "Check my wardrobe"} <Icon name="arrow" />
            </button>
          </form>
        </section>

        <section
          ref={resultsRef}
          className="scroll-mt-6"
          aria-labelledby="buy-results-h"
          aria-live="polite"
          aria-busy={state.status === "loading"}
        >
          <h2 id="buy-results-h" className="sr-only">
            Comparison
          </h2>
          {state.status === "idle" && <EmptyCompare />}
          {state.status === "loading" && (
            <p className="breathe border-t border-hairline pt-4 font-serif text-xl italic">Comparing with your wardrobe…</p>
          )}
          {state.status === "error" && (
            <div className="rise border-t border-ink pt-4" role="alert">
              <p className="care text-graphite">Something went wrong</p>
              <p className="mt-1 max-w-prose">{state.message}</p>
            </div>
          )}
          {state.status === "done" && (
            <div className="rise space-y-4">
              <CheckNote {...state.check} />
              <header className="flex items-baseline justify-between gap-4 border-t border-ink pt-2">
                <AiLabel />
                {state.result.considered_item && (
                  <span className="care truncate text-graphite">{state.result.considered_item}</span>
                )}
              </header>

              <h3 className="care mt-6 text-graphite">Already filling this role</h3>
              {state.result.same_role.length ? (
                <ul className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-6">
                  {state.result.same_role.map((ref, i) => (
                    <li key={`${ref.item_id}-${i}`}>
                      <GarmentCard item={byId.get(ref.item_id)} fallback={ref} photoUrl={photos.get(ref.item_id)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 font-serif text-xl italic">Nothing you own fills quite the same role.</p>
              )}

              <div className="mt-10 grid gap-x-8 gap-y-2 border-t border-hairline pt-4 sm:grid-cols-[auto_1fr] sm:items-baseline">
                <h3 className="care text-graphite sm:col-span-2">New combinations (estimate)</h3>
                <p className="font-serif text-[4rem] leading-none font-light">
                  {state.result.new_combinations ?? "—"}
                </p>
                {state.result.estimate_explanation && (
                  <p className="max-w-prose">
                    <span className="care text-graphite">How estimated · </span>
                    {state.result.estimate_explanation}
                  </p>
                )}
              </div>

              {/* Fixed text, not AI-generated: always shown with a result. */}
              <p className="mt-10 border-t border-ink pt-4 font-serif text-xl">
                This is information, not a recommendation. Your call.
              </p>
            </div>
          )}
        </section>
      </div>

      <WardrobeStrip catalogue={catalogue} marks={marks} />
    </div>
  );
}
