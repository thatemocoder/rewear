"use client";

import { useEffect, useMemo, useState } from "react";
import { AiLabel } from "@/components/AiLabel";
import { SwingTag } from "@/components/SwingTag";
import { callAI } from "@/lib/api";
import { useCatalogue } from "@/lib/catalogue";
import type { TrendsResult } from "@/lib/schemas";

// Per-viewer cache so revisiting the page doesn't spend another AI call (12 hours, per wardrobe).
const CACHE_KEY = "rewear.trends.v1";
const CACHE_MS = 12 * 3600 * 1000;

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; result: TrendsResult; at: number };

export default function StylePage() {
  const catalogue = useCatalogue();
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
    setState({ status: "done", result: res.data, at });
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
      <header className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 className="font-serif text-display font-normal tracking-tight">What&apos;s in style</h1>
          <p className="mt-3 max-w-2xl text-graphite">
            Trends the AI has summarised from recent Australian fashion media, with ideas for wearing them with clothes you
            already own. It&apos;s a reading list, not a shopping list.
          </p>
        </div>
        <button type="button" className="btn" onClick={load} disabled={state.status === "loading"}>
          {state.status === "done" ? "Refresh trends" : state.status === "loading" ? "Reading…" : "Pull current trends"}
          <span aria-hidden>→</span>
        </button>
      </header>

      <section aria-live="polite" aria-busy={state.status === "loading"}>
        {state.status === "idle" && (
          <p className="max-w-md border-t border-hairline pt-4 font-serif text-xl leading-snug text-graphite italic">
            Pull the trends to see what Australian fashion media are covering this month, and how your wardrobe can join in.
          </p>
        )}
        {state.status === "loading" && (
          <p className="breathe border-t border-hairline pt-4 font-serif text-xl italic">Reading this month&apos;s fashion pages…</p>
        )}
        {state.status === "error" && (
          <div className="rise border-t border-ink pt-4" role="alert">
            <p className="care text-graphite">Something went wrong</p>
            <p className="mt-1 max-w-prose">{state.message}</p>
          </div>
        )}

        {state.status === "done" && (
          <div className="rise">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-ink pt-2">
              <AiLabel>AI summary of fashion media</AiLabel>
              <span className="care text-graphite">
                {state.result.articles.length} articles{state.result.as_of && ` · latest ${state.result.as_of}`} · pulled{" "}
                {new Date(state.at).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" })}
              </span>
            </div>

            {state.result.trends.length === 0 ? (
              <p className="mt-6 font-serif text-xl italic">The recent articles didn&apos;t describe any clear clothing trends.</p>
            ) : (
              <ol className="mt-2 divide-y divide-hairline">
                {state.result.trends.map((t, i) => {
                  const refs = t.source_ids.map((id) => articles.get(id)).filter(Boolean);
                  return (
                    <li key={i} className="grid gap-6 py-10 md:grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-10">
                      <span className="font-serif text-5xl leading-none font-light text-graphite">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h2 className="font-serif text-3xl leading-tight">{t.name}</h2>
                        <p className="mt-3 max-w-prose">{t.summary}</p>
                        {t.brands.length > 0 && (
                          <p className="mt-3 text-sm">
                            <span className="care text-graphite">Mentioned · </span>
                            {t.brands.join(", ")}
                          </p>
                        )}
                        {refs.length > 0 && (
                          <div className="mt-4">
                            <p className="care text-graphite">Sources</p>
                            <ul className="mt-1 space-y-1 text-sm">
                              {refs.map((a) => (
                                <li key={a!.id}>
                                  <a href={a!.url} target="_blank" rel="noopener noreferrer" className="btn-quiet">
                                    {a!.title}
                                  </a>
                                  <span className="text-graphite">
                                    {" "}
                                    · {a!.source}
                                    {a!.date && `, ${a!.date}`}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="care text-graphite">Try it with what you own</p>
                        <p className="mt-2 font-serif text-lg leading-snug italic">{t.with_your_wardrobe}</p>
                        {t.item_ids.length > 0 && (
                          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {t.item_ids.map((id) => (
                              <li key={id}>
                                <SwingTag item={byId.get(id)} fallback={{ item_id: id, description: "" }} />
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            <p className="border-t border-hairline pt-4 text-sm text-graphite">
              Summarised by AI from the RSS feeds of {sources.join(", ")}. Headlines and articles belong to their publishers;
              follow the links to read them. Trends can be summarised wrongly, so check the sources. Your call.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
