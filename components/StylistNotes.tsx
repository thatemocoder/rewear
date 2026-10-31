"use client";

import { useRef, useState, type FormEvent } from "react";
import { callAI } from "@/lib/api";
import type { CatalogueItem, ChatTurn, Outfit, PlanRequest, PlanResult } from "@/lib/schemas";
import { YourCall } from "./AiLabel";
import { CheckNote } from "./CheckNote";
import { HemAvatar } from "./HemAvatar";
import { OutfitFlatLay } from "./OutfitFlatLay";

interface Turn {
  role: "person" | "hem";
  text: string;
  outfits?: Outfit[];
  your_call?: string | null;
  check?: { warnings?: string[]; retried?: boolean };
}

const QUICK = ["Something warmer", "A bit more formal", "Different shoes", "Fewer layers", "Why the first look?"];
const MAX_TURNS = 8; // person messages per conversation, to protect the free-tier quota

/** What Hem said, plus the item IDs it proposed, so the next turn has that context. */
function toChat(t: Turn): ChatTurn {
  if (t.role === "person" || !t.outfits?.length) return { role: t.role, text: t.text };
  const looks = t.outfits.map((o) => o.items.map((i) => i.item_id).join(" + ")).join("; ");
  return { role: "hem", text: `${t.text} [Suggested: ${looks}]` };
}

/**
 * "Fitting-room notes": a short conversation with Hem, Rewear's AI stylist, to refine
 * the current plan. Styled as annotated notes rather than chat bubbles.
 */
export function StylistNotes({
  request,
  plan,
  catalogue,
}: {
  request: PlanRequest;
  plan: PlanResult;
  catalogue: Map<string, CatalogueItem>;
}) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const asked = turns.filter((t) => t.role === "person").length;
  const atLimit = asked >= MAX_TURNS;

  async function send(text: string) {
    const message = text.trim();
    if (!message || busy || atLimit) return;
    const next: Turn[] = [...turns, { role: "person", text: message }];
    setTurns(next);
    setDraft("");
    setError(null);
    setBusy(true);
    const { catalogue: items, ...context } = request;
    const res = await callAI(
      "stylist",
      { catalogue: items, request: context, plan, conversation: next.map(toChat) },
      { message, turn: next.filter((t) => t.role === "person").length, occasion: request.occasion },
    );
    setBusy(false);
    if (res.ok) {
      setTurns([
        ...next,
        {
          role: "hem",
          text: res.data.reply,
          outfits: res.data.outfits,
          your_call: res.data.your_call,
          check: { warnings: res.warnings, retried: res.retried },
        },
      ]);
    } else {
      setError(res.message);
    }
    inputRef.current?.focus();
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    send(draft);
  }

  return (
    <section aria-labelledby="hem-h" className="@container">
      <div className="flex items-center gap-4">
        <HemAvatar size={44} className="-ml-1 drop-shadow-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h3 id="hem-h" className="font-serif text-xl leading-tight">
              Talk it through with Hem
            </h3>
            <span className="care inline-flex items-center gap-2 font-medium text-oxblood">
              <span className="size-2 bg-oxblood" aria-hidden />
              AI stylist
            </span>
          </div>
          <p className="mt-0.5 text-sm text-graphite">An AI stylist, not a person. Only uses your wardrobe.</p>
        </div>
      </div>

      {turns.length > 0 && (
        <ol className="mt-5 space-y-5" aria-live="polite">
          {turns.map((t, i) => (
            <li key={i} className="rise grid gap-2 @md:grid-cols-[5rem_1fr] @md:gap-3">
              {t.role === "hem" ? (
                <p className="care flex items-center gap-2 font-medium text-oxblood @md:flex-col @md:items-start">
                  <HemAvatar size={34} decorative />
                  Hem · AI
                </p>
              ) : (
                <p className="care pt-1 text-graphite">You</p>
              )}
              <div className="min-w-0 space-y-5">
                <p className={t.role === "hem" ? "max-w-prose font-serif text-lg leading-snug @2xl:text-xl" : "max-w-prose"}>{t.text}</p>
                {t.check && <CheckNote {...t.check} />}
                {t.your_call && <YourCall>{t.your_call}</YourCall>}
                {t.outfits?.map((o, j) => (
                  <OutfitFlatLay
                    key={j}
                    outfit={o}
                    index={j}
                    catalogue={catalogue}
                    idPrefix={`hem-${i}`}
                    label={`Hem · option ${j + 1}`}
                    dense
                  />
                ))}
              </div>
            </li>
          ))}
          {busy && (
            <li className="grid gap-2 @md:grid-cols-[5rem_1fr] @md:gap-3">
              <p className="care flex items-center gap-2 font-medium text-oxblood @md:flex-col @md:items-start">
                <HemAvatar size={34} decorative className="breathe" />
                Hem · AI
              </p>
              <p className="breathe self-center font-serif text-xl italic">Looking through the rails…</p>
            </li>
          )}
        </ol>
      )}

      {error && (
        <p className="mt-4 text-sm" role="alert">
          {error}
        </p>
      )}

      {atLimit ? (
        <p className="mt-6 text-sm text-graphite">
          That&apos;s the end of this conversation ({MAX_TURNS} messages). Plan again to start a fresh one.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Quick requests">
            {QUICK.map((q) => (
              <button
                key={q}
                type="button"
                disabled={busy}
                onClick={() => send(q)}
                className="pill disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
          <label htmlFor="hem-input" className="label mt-4">
            Your note to Hem
          </label>
          <div className="flex items-end gap-4">
            <textarea
              id="hem-input"
              ref={inputRef}
              rows={2}
              maxLength={800}
              className="field resize-none"
              placeholder="e.g. I'd rather not wear the chinos"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
            />
            <button type="submit" className="btn shrink-0" disabled={busy || !draft.trim()}>
              Send
            </button>
          </div>
        </form>
      )}
    </section>
  );
}

/** Placeholder for the Hem panel before any outfits exist. */
export function HemIdle({ loading }: { loading: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <HemAvatar size={64} className={loading ? "breathe" : ""} />
      <p className="font-serif text-xl">Hem</p>
      <span className="care inline-flex items-center gap-2 font-medium text-oxblood">
        <span className="size-2 bg-oxblood" aria-hidden />
        AI stylist
      </span>
      <p className="max-w-[16rem] text-sm text-graphite">
        {loading ? "Watching the looks come in…" : "Pull some outfits, then ask Hem to tweak them here."}
      </p>
    </div>
  );
}
