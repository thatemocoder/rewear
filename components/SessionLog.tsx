"use client";

import { useState } from "react";
import { clearLog, downloadCsv, useSessionLog } from "@/lib/sessionLog";

const FEATURE_NAME = {
  plan: "Plan an outfit",
  tag: "Add items",
  buy: "Before you buy",
  stylist: "Stylist (Hem)",
  trends: "What’s in style",
} as const;

/** Every AI call in this browser tab, for the test log. Collapsible; never sent anywhere. */
export function SessionLog() {
  const log = useSessionLog();
  const [open, setOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        type="button"
        className="font-mono text-[11px] text-graphite hover:text-ink"
        aria-expanded={open}
        aria-controls="session-log"
        onClick={() => setOpen((o) => !o)}
      >
        Session log ({log.length}) {open ? "▴" : "▾"}
      </button>

      {open && (
        <section id="session-log" aria-label="Session log" className="rise mt-4 border-t border-ink pt-4 text-ink">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
            <p className="max-w-prose text-sm text-graphite">
              Every AI call in this browser tab: inputs (never images) and the AI&apos;s raw output. Kept in this tab only and
              never sent anywhere.
            </p>
            <div className="flex gap-5 text-sm">
              <button type="button" className="btn-quiet" disabled={!log.length} onClick={() => downloadCsv(log)}>
                Download log as CSV
              </button>
              {log.length > 0 && (
                <button
                  type="button"
                  className="btn-quiet"
                  onClick={() => window.confirm("Clear the session log?") && clearLog()}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {log.length === 0 ? (
            <p className="mt-4 font-serif italic text-graphite">No AI calls yet in this session.</p>
          ) : (
            <ol className="mt-4 max-h-[32rem] divide-y divide-hairline overflow-y-auto border-y border-hairline">
              {[...log].reverse().map((e, i) => (
                <li key={e.id} className="grid gap-3 py-4 md:grid-cols-[13rem_1fr]">
                  <div className="space-y-0.5 text-sm">
                    <p className="font-mono text-xs text-graphite">
                      #{log.length - i} · {new Date(e.timestamp).toLocaleTimeString()}
                    </p>
                    <p className="font-medium">{FEATURE_NAME[e.feature]}</p>
                    <p className="care text-graphite">
                      Prompt {e.feature} {e.promptVersion}
                    </p>
                    {e.model && <p className="care text-graphite">{e.model}</p>}
                    <p className={`care ${e.status === "ok" ? "text-graphite" : "font-medium text-oxblood"}`}>
                      {e.status === "ok" ? "OK" : e.status.replace("_", " ")}
                    </p>
                  </div>
                  <div className="min-w-0 space-y-2">
                    <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-sm">
                      {Object.entries(e.inputs).map(([k, v]) => (
                        <div key={k} className="contents">
                          <dt className="care pt-0.5 text-graphite">{k.replace(/_/g, " ")}</dt>
                          <dd className="break-words">{String(v) || "—"}</dd>
                        </div>
                      ))}
                    </dl>
                    <pre className="max-h-48 overflow-auto bg-card p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
                      {e.output || "(empty)"}
                    </pre>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </div>
  );
}
