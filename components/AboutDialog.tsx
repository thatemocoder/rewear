"use client";

import { useRef, type ReactNode } from "react";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-hairline pt-3">
      <h3 className="care text-graphite">{title}</h3>
      <div className="mt-2 space-y-1.5">{children}</div>
    </section>
  );
}

function List({ items }: { items: ReactNode[] }) {
  return (
    <ul className="list-['–_'] space-y-1 pl-4 marker:text-graphite">
      {items.map((it, i) => (
        <li key={i}>{it}</li>
      ))}
    </ul>
  );
}

export function AboutDialog() {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        className="px-1 py-1 text-graphite hover:text-ink"
        aria-haspopup="dialog"
        onClick={() => ref.current?.showModal()}
      >
        About
      </button>
      <dialog
        ref={ref}
        aria-labelledby="about-h"
        onClick={(e) => e.target === ref.current && ref.current.close()}
        className="m-auto max-h-[90dvh] w-[min(42rem,calc(100vw-2rem))] overflow-y-auto border border-ink bg-paper p-0 text-ink backdrop:bg-ink/40"
      >
        <div className="p-6 sm:p-8">
          <div className="flex items-start justify-between gap-6">
            <h2 id="about-h" className="font-serif text-[2rem] leading-tight">
              About Rewear
            </h2>
            <button type="button" className="btn-quiet text-sm" onClick={() => ref.current?.close()}>
              Close
            </button>
          </div>
          <p className="mt-2 max-w-prose text-graphite">
            Rewear helps one person plan outfits from clothes they already own, and think twice before buying more. The AI
            does the combinations; you keep taste, dress-code judgement and spending decisions.
          </p>

          <div className="mt-6 space-y-5">
            <Block title="What the AI does">
              <List
                items={[
                  "Drafts tags (type, colour, formality, warmth, notes) from a photo of one garment.",
                  "Suggests up to three outfits from your catalogue for an occasion, temperature and dress code.",
                  "Shows how something you’re considering overlaps with what you own, with an estimate of new combinations.",
                ]}
              />
            </Block>
            <Block title="What the AI must not do">
              <List
                items={[
                  "Use items that aren’t in your catalogue.",
                  "Tell you to buy or not buy anything, or comment on price.",
                  "Give body-shape, size, fit or “flattering” advice.",
                  "Save anything on its own.",
                ]}
              />
            </Block>
            <Block title="When it hands over to you">
              <List
                items={[
                  "Unclear dress codes and high-stakes occasions get a “Your call” note saying what to check.",
                  "Every tag is a draft until you press Save. Fields you change are marked “edited”.",
                  "Purchase checks end with “This is information, not a recommendation. Your call.”",
                ]}
              />
            </Block>
            <Block title="How you can tell the AI is involved">
              <p>
                Everything the AI produced carries an oxblood label such as{" "}
                <span className="care font-medium text-oxblood">AI suggestion</span>. The footer shows the prompt version, and
                the session log lists every AI call with its inputs and raw output.
              </p>
            </Block>
            <Block title="Your data">
              <List
                items={[
                  "Photos are never stored, on a server or in your browser. Your browser re-encodes each one (removing location data) and sends it once to the AI.",
                  "Items you add are kept in this browser only. There are no accounts and no database.",
                  "Text and photos you submit are sent to Google’s Gemini API to generate responses. On its free tier, Google may use submitted content to improve its services, so don’t upload anything private.",
                ]}
              />
            </Block>
            <Block title="About this prototype">
              <p>
                A student prototype for UNSW INFS5706 <em>AI in Action</em>, using a third-party AI API (Google Gemini). Built
                with AI assistance (Claude Code). Suggestions can be wrong, so check them.
              </p>
            </Block>
          </div>
        </div>
      </dialog>
    </>
  );
}
