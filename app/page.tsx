"use client";

import { useMemo, useRef, useState, type FormEvent } from "react";
import { AiLabel, YourCall } from "@/components/AiLabel";
import { OutfitFlatLay } from "@/components/OutfitFlatLay";
import { WardrobeStrip } from "@/components/WardrobeStrip";
import { callAI } from "@/lib/api";
import { useCatalogue } from "@/lib/catalogue";
import { revealOnSmallScreens } from "@/lib/reveal";
import { DRESS_CODES, type PlanResult } from "@/lib/schemas";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: PlanResult };

export default function PlanPage() {
  const catalogue = useCatalogue();
  const [occasion, setOccasion] = useState("");
  const [temp, setTemp] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const resultsRef = useRef<HTMLElement>(null);

  const byId = useMemo(() => new Map(catalogue.map((i) => [i.item_id, i])), [catalogue]);

  const picked = useMemo(() => {
    const m = new Map<string, number[]>();
    if (state.status !== "done") return m;
    state.result.outfits.forEach((o, i) =>
      o.items.forEach(({ item_id }) => {
        const looks = m.get(item_id) ?? [];
        if (!looks.includes(i + 1)) m.set(item_id, [...looks, i + 1]);
      }),
    );
    return m;
  }, [state]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });
    const body = {
      catalogue,
      occasion,
      temperature_c: Number(temp),
      dress_code: dressCode,
      dress_code_notes: notes,
    };
    const res = await callAI("plan", body, {
      occasion,
      temperature_c: Number(temp),
      dress_code: dressCode,
      dress_code_notes: notes,
      catalogue_ids: catalogue.map((i) => i.item_id).join(" "),
    });
    setState(res.ok ? { status: "done", result: res.data } : { status: "error", message: res.message });
    revealOnSmallScreens(resultsRef.current);
  }

  return (
    <div className="space-y-16">
      <div className="grid gap-12 md:grid-cols-[17rem_1fr] lg:gap-20">
        {/* ── Brief ── */}
        <section aria-labelledby="plan-h">
          <h1 id="plan-h" className="font-serif text-display font-normal tracking-tight">
            Plan an outfit
          </h1>
          <p className="mt-3 text-graphite">Combinations from clothes you already own. You choose what to wear.</p>

          <form onSubmit={submit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="occasion" className="care block text-graphite">
                Occasion
              </label>
              <input
                id="occasion"
                className="field"
                required
                maxLength={200}
                placeholder="uni day, networking event…"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="temp" className="care block text-graphite">
                Temperature (°C)
              </label>
              <input
                id="temp"
                className="field"
                type="number"
                inputMode="numeric"
                required
                min={-30}
                max={55}
                step={1}
                placeholder="18"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="dress" className="care block text-graphite">
                Dress code
              </label>
              <select
                id="dress"
                className="field"
                required
                value={dressCode}
                onChange={(e) => setDressCode(e.target.value)}
              >
                <option value="" disabled>
                  Choose…
                </option>
                {DRESS_CODES.map((d) => (
                  <option key={d} value={d}>
                    {d[0].toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="notes" className="care block text-graphite">
                Anything else <span className="normal-case tracking-normal">(optional)</span>
              </label>
              <input
                id="notes"
                className="field"
                maxLength={200}
                placeholder="invite says ‘cocktail’"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
            <button type="submit" className="btn" disabled={state.status === "loading"}>
              {state.status === "loading" ? "Working…" : "Pull outfits"} <span aria-hidden>→</span>
            </button>
          </form>
        </section>

        {/* ── Results ── */}
        <section ref={resultsRef} className="scroll-mt-6" aria-labelledby="results-h" aria-live="polite" aria-busy={state.status === "loading"}>
          <h2 id="results-h" className="sr-only">
            Suggestions
          </h2>
          {state.status === "idle" && (
            <p className="max-w-sm border-t border-hairline pt-4 font-serif text-xl leading-snug text-graphite italic">
              Outfits appear here, built only from the items in your wardrobe.
            </p>
          )}
          {state.status === "loading" && (
            <p className="breathe border-t border-hairline pt-4 font-serif text-xl italic">
              Pulling options from your wardrobe…
            </p>
          )}
          {state.status === "error" && (
            <div className="rise border-t border-ink pt-4" role="alert">
              <p className="care text-graphite">Something went wrong</p>
              <p className="mt-1 max-w-prose">{state.message}</p>
            </div>
          )}
          {state.status === "done" && (
            <div className="space-y-12">
              {state.result.your_call && <YourCall>{state.result.your_call}</YourCall>}
              {state.result.message && (
                <div className="rise border-t border-ink pt-2">
                  <AiLabel />
                  <p className="mt-3 max-w-prose font-serif text-xl leading-snug italic">{state.result.message}</p>
                </div>
              )}
              {state.result.outfits.map((o, i) => (
                <OutfitFlatLay key={i} outfit={o} index={i} catalogue={byId} />
              ))}
              {state.result.outfits.length === 0 && !state.result.message && (
                <p className="text-graphite">No outfits came back for this request.</p>
              )}
            </div>
          )}
        </section>
      </div>

      <WardrobeStrip catalogue={catalogue} picked={picked} />
    </div>
  );
}
