"use client";

import { useEffect, useMemo, useState } from "react";
import { AiLabel } from "@/components/AiLabel";
import { CheckNote } from "@/components/CheckNote";
import { GarmentCard } from "@/components/GarmentCard";
import { Icon } from "@/components/Icon";
import { TrendArt } from "@/components/TrendArt";
import { callAI } from "@/lib/api";
import { useCatalogue } from "@/lib/catalogue";
import { usePhotos } from "@/lib/photos";
import type { TrendsResult } from "@/lib/schemas";

// Per-viewer cache so revisiting the page doesn't spend another AI call (12 hours, per wardrobe).
const CACHE_KEY = "rewear.trends.v1";
const CACHE_MS = 12 * 3600 * 1000;

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: TrendsResult; at: number; check?: { warnings?: string[]; retried?: boolean } };

export default function StylePage() {
  const catalogue = useCatalogue();
  const photos = usePhotos();
  const [state, setState] = useState<State>({ status: "idle" });
  const byId = useMemo(() => new Map(catalogue.map((i) => [i.item_id, i])), [catalogue]);
  const wardrobeKey = catalogue.map((i) => `${i.item_id}:${i.colour}:${i.notes}`).join("|");

  useEffect(() => {
    try {
      const c = JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? "null");
      if (c && c.key === wardrobeKey && Date.now() - c.at < CACHE_MS) setState({ status: "done", result: c.result, at: c.at });
    } catch {
      /* no cache */
    }
  }, [wardrobeKey]);

  async function load() {
    setState({ status: "loading" });
    const res = await callAI("trends", { catalogue }, { catalogue_ids: catalogue.map((i) => i.item_id).join(" ") });
    if (!res.ok) return setState({ status: "error", message: res.message });
    const at = Date.now();
    setState({ status: "done", result: res.data, at, check: { warnings: res.warnings, retried: res.retried } });
    try {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify({ key: wardrobeKey, at, result: res.data }));
    } catch {
      /* storage unavailable */
    }
  }

  const articles = state.status === "done" ? new Map(state.result.articles.map((a) => [a.id, a])) : new Map();
  const sources = state.status === "done" ? [...new Set(state.result.articles.map((a) => a.source))] : [];

  return (
    <div className="space-y-12">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div>
          <h1 className="font-serif text-display font-normal tracking-tight">What&apos;s in style</h1>
          <p className="mt-2 text-graphite">From Australian fashion media. A reading list, not a shopping list.</p>
        </div>
        {state.status === "done" && (
          <button type="button" className="btn-secondary" onClick={load}>
            <Icon name="refresh" /> Refresh
          </button>
        )}
      </header>

      <section aria-live="polite" aria-busy={state.status === "loading"}>
        {(state.status === "idle" || state.status === "loading") && (
          <div className="flex flex-col items-center gap-8 py-6">
            <div className={`grid w-full max-w-xl grid-cols-3 gap-4 ${state.status === "loading" ? "breathe" : ""}`}>
              {["linen shirt", "racerback tank", "striped knit"].map((t, i) => (
                <div key={t} style={{ rotate: `${[-2, 1, -1][i]}deg` }}>
                  <TrendArt text={t} index={i} />
                </div>
              ))}
            </div>
            <button type="button" className="btn" onClick={load} disabled={state.status === "loading"}>
              {state.status === "loading" ? "Reading the fashion pages…" : "Pull current trends"} <Icon name="arrow" />
            </button>
          </div>
        )}
        {state.status === "error" && (
          <div className="rise border-t border-ink pt-4" role="alert">
            <p className="text-sm font-semibold">Something went wrong</p>
            <p className="mt-1 max-w-prose">{state.message}</p>
            <button type="button" className="btn-secondary mt-4" onClick={load}>
              <Icon name="refresh" /> Try again
            </button>
          </div>
        )}

        {state.status === "done" && (
          <div className="rise">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-ink pt-2">
              <AiLabel>AI summary of fashion media</AiLabel>
              <span className="text-xs text-graphite">
                {state.result.articles.length} articles{state.result.as_of && ` · latest ${state.result.as_of}`} · pulled{" "}
                {new Date(state.at).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}
              </span>
            </div>

            {state.check && (
              <div className="mt-4">
                <CheckNote {...state.check} />
              </div>
            )}
            {state.result.trends.length === 0 ? (
              <p className="mt-6 font-serif text-xl italic">No clear clothing trends in the latest articles.</p>
            ) : (
              <ol className="mt-2 divide-y divide-hairline">
                {state.result.trends.map((t, i) => {
                  const refs = t.source_ids.map((id) => articles.get(id)).filter(Boolean);
                  return (
                    <li
                      key={i}
                      className="grid gap-6 py-10 sm:grid-cols-[9rem_minmax(0,1fr)] lg:grid-cols-[11rem_minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10"
                    >
                      <div className={`w-36 sm:w-auto ${i % 2 ? "rotate-1" : "-rotate-1"}`}>
                        <TrendArt text={`${t.name} ${t.summary}`} index={i} />
                      </div>
                      <div>
                        <h2 className="font-serif text-3xl leading-tight">{t.name}</h2>
                        <p className="mt-3 max-w-prose">{t.summary}</p>
                        {t.brands.length > 0 && (
                          <p className="mt-3 flex flex-wrap gap-1.5">
                            {t.brands.map((b) => (
                              <span key={b} className="badge">
                                {b}
                              </span>
                            ))}
                          </p>
                        )}
                        {refs.length > 0 && (
                          <ul className="mt-4 space-y-1 text-sm">
                            {refs.map((a) => (
                              <li key={a!.id} className="flex gap-1.5">
                                <Icon name="arrow" className="mt-1 size-3 -rotate-45 text-graphite" />
                                <span>
                                  <a href={a!.url} target="_blank" rel="noopener noreferrer" className="btn-quiet">
                                    {a!.title}
                                  </a>
                                  <span className="text-graphite"> · {a!.source}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <div className="sm:col-span-2 lg:col-span-1">
                        <p className="label">Try it with what you own</p>
                        {t.item_ids.length > 0 ? (
                          <>
                            <p className="mt-1.5 font-serif text-lg leading-snug italic">{t.with_your_wardrobe}</p>
                            <ul className="mt-4 grid grid-cols-3 gap-3">
                              {t.item_ids.map((id) => (
                                <li key={id} className="lift">
                                  <GarmentCard item={byId.get(id)} fallback={{ item_id: id, description: "" }} photoUrl={photos.get(id)} />
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <p className="mt-2 flex items-start gap-2 text-sm text-graphite">
                            <Icon name="hanger" className="mt-0.5 size-4" />
                            {t.with_your_wardrobe || "Nothing in your wardrobe for this one yet."}
                          </p>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <p className="flex items-start gap-2 border-t border-hairline pt-4 text-xs text-graphite">
              <Icon name="info" className="size-3.5" />
              Summarised by AI from {sources.join(", ")}. Articles belong to their publishers; check the sources. Your call.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
