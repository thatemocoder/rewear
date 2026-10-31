"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { AiLabel, YourCall } from "@/components/AiLabel";
import { OutfitFlatLay } from "@/components/OutfitFlatLay";
import { HemIdle, StylistNotes } from "@/components/StylistNotes";
import { CheckNote } from "@/components/CheckNote";
import { EmptyRail } from "@/components/EmptyRail";
import { Icon } from "@/components/Icon";
import { WardrobeStrip } from "@/components/WardrobeStrip";
import { WhereWhen, type WhereWhenValue } from "@/components/WhereWhen";
import { callAI } from "@/lib/api";
import { useCatalogue } from "@/lib/catalogue";
import { describeTime, distanceKm } from "@/lib/context";
import { revealOnSmallScreens } from "@/lib/reveal";
import { DRESS_CODES, type PlanRequest, type PlanResult } from "@/lib/schemas";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: PlanResult; check?: { warnings?: string[]; retried?: boolean } };

export default function PlanPage() {
  const catalogue = useCatalogue();
  const [occasion, setOccasion] = useState("");
  const [temp, setTemp] = useState("");
  const [dressCode, setDressCode] = useState("");
  const [notes, setNotes] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [ww, setWw] = useState<WhereWhenValue | null>(null);
  const [tempSource, setTempSource] = useState<"forecast" | "manual">("forecast");
  const [lastRequest, setLastRequest] = useState<PlanRequest | null>(null);
  const resultsRef = useRef<HTMLElement>(null);

  const byId = useMemo(() => new Map(catalogue.map((i) => [i.item_id, i])), [catalogue]);

  // item_id → "In look 01, 02" for the wardrobe strip
  const marks = useMemo(() => {
    const looks = new Map<string, number[]>();
    if (state.status === "done") {
      state.result.outfits.forEach((o, i) =>
        o.items.forEach(({ item_id }) => {
          const l = looks.get(item_id) ?? [];
          if (!l.includes(i + 1)) looks.set(item_id, [...l, i + 1]);
        }),
      );
    }
    return new Map(
      [...looks].map(([id, l]) => [id, `In look ${l.map((n) => String(n).padStart(2, "0")).join(", ")}`]),
    );
  }, [state]);

  // The forecast fills the temperature until the person types their own number.
  const onWhereWhen = useCallback((v: WhereWhenValue) => setWw(v), []);
  useEffect(() => {
    if (tempSource === "forecast" && ww?.forecast) setTemp(String(ww.forecast.temperature_c));
  }, [ww?.forecast, tempSource]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setState({ status: "loading" });
    const f = ww?.forecast;
    const usingForecast = tempSource === "forecast" && !!f;
    const km = ww?.venue && ww.place ? Math.round(distanceKm(ww.place, ww.venue)) : undefined;
    const request: PlanRequest = {
      catalogue,
      occasion,
      temperature_c: Number(temp),
      dress_code: dressCode as PlanRequest["dress_code"],
      dress_code_notes: notes,
      ...(f && { when: describeTime(f.time) }),
      ...(ww?.place && { location: ww.place.label }),
      ...(ww?.venue && { venue: { name: ww.venue.name, kind: ww.venue.kind, distance_km: km } }),
      weather: usingForecast
        ? { source: "forecast", feels_like_c: f.feels_like_c, rain_chance_pct: f.rain_chance_pct ?? undefined, conditions: f.conditions }
        : { source: "typed" },
    };
    const res = await callAI("plan", request, {
      occasion,
      temperature_c: Number(temp),
      temperature_source: usingForecast ? `forecast (${ww?.forecastFor})` : "typed by user",
      dress_code: dressCode,
      dress_code_notes: notes,
      venue: ww?.venue ? `${ww.venue.name} (${ww.venue.kind})` : "",
      when: f ? describeTime(f.time) : "",
      catalogue_ids: catalogue.map((i) => i.item_id).join(" "),
    });
    setLastRequest(request);
    setState(
      res.ok
        ? { status: "done", result: res.data, check: { warnings: res.warnings, retried: res.retried } }
        : { status: "error", message: res.message },
    );
    revealOnSmallScreens(resultsRef.current);
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-10 md:grid-cols-[22rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)_21rem] xl:gap-8 2xl:grid-cols-[24rem_minmax(0,1fr)_26rem] 2xl:gap-10">
        {/* ── Brief (stays in view while results scroll) ── */}
        <section
          aria-labelledby="plan-h"
          className="md:sticky md:top-4 md:max-h-[calc(100dvh-2rem)] md:self-start md:overflow-y-auto md:pr-1"
        >
          <h1 id="plan-h" className="font-serif text-display font-normal tracking-tight">
            Plan an outfit
          </h1>
          <p className="mt-2 text-graphite">From clothes you already own.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <fieldset className="panel space-y-5">
              <legend className="sr-only">The occasion</legend>
              <p className="panel-title" aria-hidden>
                <Icon name="calendar" /> The occasion
              </p>
              <div>
                <label htmlFor="occasion" className="label">
                  What for?
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
                <label htmlFor="notes" className="label">
                  Anything else <span className="opt">(optional)</span>
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
            </fieldset>

            <fieldset className="panel">
              <legend className="sr-only">Where and when</legend>
              <p className="panel-title" aria-hidden>
                <Icon name="pin" /> Where &amp; when
              </p>
              <WhereWhen onChange={onWhereWhen} />
            </fieldset>

            <fieldset className="panel space-y-5">
              <legend className="sr-only">Conditions</legend>
              <p className="panel-title" aria-hidden>
                <Icon name="thermo" /> Conditions
              </p>
              <div>
                <label htmlFor="temp" className="label">
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
                  aria-describedby="temp-source"
                  onChange={(e) => {
                    setTemp(e.target.value);
                    setTempSource("manual");
                  }}
                />
                <p id="temp-source" className="mt-1.5 text-xs text-graphite">
                  {tempSource === "manual" ? (
                    <>
                      Using your number.{" "}
                      {ww?.forecast && (
                        <button type="button" className="btn-quiet" onClick={() => setTempSource("forecast")}>
                          Use forecast ({ww.forecast.temperature_c}°)
                        </button>
                      )}
                    </>
                  ) : ww?.forecast ? (
                    "From the forecast · editable"
                  ) : (
                    "Type the expected temperature"
                  )}
                </p>
              </div>
              <div>
                <label htmlFor="dress" className="label">
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
            </fieldset>

            <button type="submit" className="btn w-full justify-between" disabled={state.status === "loading"}>
              {state.status === "loading" ? "Working…" : "Pull outfits"} <Icon name="arrow" />
            </button>
          </form>
        </section>

        {/* ── Results ── */}
        <section ref={resultsRef} className="scroll-mt-6" aria-labelledby="results-h" aria-live="polite" aria-busy={state.status === "loading"}>
          <h2 id="results-h" className="sr-only">
            Suggestions
          </h2>
          {state.status === "idle" && <EmptyRail />}
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
            <div className="space-y-8">
              <CheckNote {...state.check} />
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

        {/* ── Hem: right-hand panel on wide screens, below results otherwise ── */}
        <aside
          aria-label="Stylist"
          className={`md:col-span-2 xl:sticky xl:top-4 xl:col-span-1 xl:max-h-[calc(100dvh-2rem)] xl:self-start xl:overflow-y-auto ${
            state.status === "done" && lastRequest ? "" : "hidden xl:block"
          }`}
        >
          <div className="rounded-xl border border-hairline bg-card/70 p-4">
            {state.status === "done" && lastRequest ? (
              <StylistNotes key={JSON.stringify(state.result)} request={lastRequest} plan={state.result} catalogue={byId} />
            ) : (
              <HemIdle loading={state.status === "loading"} />
            )}
          </div>
        </aside>
      </div>

      <WardrobeStrip catalogue={catalogue} marks={marks} />
    </div>
  );
}
