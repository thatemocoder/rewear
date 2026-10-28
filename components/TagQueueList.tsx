"use client";

import { clearFinished, isOpen, isReviewable, type QueueEntry } from "@/lib/tagQueue";

const STATUS: Record<QueueEntry["status"], string> = {
  queued: "Waiting",
  tagging: "Reading…",
  draft: "Check tags",
  rejected: "No tags",
  error: "Didn’t work",
  saved: "Saved",
  discarded: "Discarded",
};

export function TagQueueList({
  entries,
  activeKey,
  onSelect,
}: {
  entries: QueueEntry[];
  activeKey?: string;
  onSelect: (key: string) => void;
}) {
  if (!entries.length) return null;
  const finished = entries.filter((e) => !isOpen(e)).length;

  return (
    <section aria-labelledby="queue-h" className="mt-6">
      <div className="flex items-baseline justify-between border-b border-hairline pb-1">
        <h2 id="queue-h" className="care text-graphite">
          Queue · {entries.length - finished} open
        </h2>
        {finished > 0 && (
          <button type="button" className="btn-quiet text-xs" onClick={clearFinished}>
            Clear finished
          </button>
        )}
      </div>
      <ol className="divide-y divide-hairline">
        {entries.map((e, i) => {
          const active = e.key === activeKey;
          const content = (
            <>
              <span className="grid h-12 w-10 shrink-0 place-items-center overflow-hidden border border-hairline bg-card">
                {e.preview ? (
                  <img src={e.preview} alt="" className="size-full object-contain" />
                ) : (
                  <span className="font-mono text-[10px] text-graphite">{String(i + 1).padStart(2, "0")}</span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm">{e.name}</span>
                <span
                  className={`care block ${
                    e.status === "draft" || e.status === "rejected" ? "text-oxblood" : "text-graphite"
                  } ${e.status === "tagging" ? "breathe" : ""}`}
                >
                  {e.status === "saved" ? `Saved as ${e.savedId}` : STATUS[e.status]}
                </span>
              </span>
            </>
          );
          return (
            <li key={e.key} className={active ? "border-l-2 border-ink" : "border-l-2 border-transparent"}>
              {isReviewable(e) ? (
                <button
                  type="button"
                  onClick={() => onSelect(e.key)}
                  aria-current={active ? "true" : undefined}
                  className="flex w-full items-center gap-3 py-2 pl-2 text-left hover:bg-card"
                >
                  {content}
                </button>
              ) : (
                <div className={`flex items-center gap-3 py-2 pl-2 ${isOpen(e) ? "" : "opacity-70"}`}>{content}</div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
