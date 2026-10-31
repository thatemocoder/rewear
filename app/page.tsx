"use client";

import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import { AboutDialog } from "@/components/AboutDialog";
import { useCurtain } from "@/components/Curtain";
import { GarmentArt } from "@/components/GarmentArt";
import { Icon, type IconName } from "@/components/Icon";
import type { ItemType } from "@/lib/schemas";
import { APP_VERSION } from "@/lib/version";

// The flat-lay: pieces drift in one by one, then float. Positions are % of the stage.
const PIECES: { type: ItemType; notes: string; colour: string; left: number; top: number; w: number; r: number; d: number }[] = [
  { type: "outerwear", notes: "wool overcoat", colour: "camel", left: 3, top: 10, w: 29, r: -8, d: 150 },
  { type: "top", notes: "chunky knit", colour: "oat", left: 35, top: 1, w: 27, r: 5, d: 300 },
  { type: "bottom", notes: "straight jeans", colour: "indigo denim", left: 66, top: 13, w: 27, r: 9, d: 450 },
  { type: "shoes", notes: "chelsea boots", colour: "brown", left: 9, top: 56, w: 26, r: 4, d: 600 },
  { type: "dress", notes: "slip dress", colour: "sage", left: 39, top: 50, w: 27, r: -6, d: 750 },
  { type: "accessory", notes: "leather tote bag", colour: "tan", left: 70, top: 60, w: 22, r: 7, d: 900 },
];

const STEPS: { icon: IconName; text: string }[] = [
  { icon: "camera", text: "Snap what you own" },
  { icon: "hanger", text: "Pull looks from it" },
  { icon: "check", text: "Your call, always" },
];

export default function Cover() {
  const { go } = useCurtain();

  // Real links (work without JS, open in new tabs); plain clicks get the curtain transition.
  const curtain = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    go(href);
  };

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* masthead */}
      <header className="flex items-center justify-between gap-4 px-4 pt-6 md:px-8 lg:px-12">
        <Link href="/" className="group inline-flex items-center gap-2.5" aria-label="Rewear home">
          <span className="grid size-9 place-items-center rounded-full border border-ink transition-transform duration-200 group-hover:-rotate-6">
            <Icon name="hanger" className="size-5" />
          </span>
          <span className="font-serif text-[1.85rem] leading-none font-medium tracking-tight">Rewear</span>
        </Link>
        <span className="care hidden text-graphite sm:inline">Issue 01 · Spring 2026</span>
        <AboutDialog />
      </header>
      <div className="mx-4 mt-5 border-t border-ink md:mx-8 lg:mx-12" />

      {/* hero */}
      <section className="grid flex-1 items-center gap-12 px-4 py-10 md:px-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:px-12 lg:py-6">
        <div>
          <p className="care cover-fade text-graphite" style={{ "--d": "0ms" } as CSSProperties}>
            Plan outfits from what you own
          </p>
          <h1
            className="cover-fade mt-4 font-serif text-[clamp(3.4rem,8.6vw,8.75rem)] leading-[0.9] font-normal tracking-[-0.02em]"
            style={{ "--d": "80ms" } as CSSProperties}
          >
            Wear what
            <br />
            you{" "}
            <span className="relative inline-block italic">
              own
              <svg
                viewBox="0 0 200 24"
                preserveAspectRatio="none"
                className="cover-underline absolute -bottom-2 left-0 h-[0.18em] w-full text-ink"
                aria-hidden
              >
                <path d="M3 15 C 50 4, 110 22, 197 8" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" pathLength="1" />
              </svg>
            </span>
            .
          </h1>
          <p className="cover-fade mt-7 max-w-md text-lg text-graphite" style={{ "--d": "220ms" } as CSSProperties}>
            AI-assisted outfit planner — suggestions only. You make the final call.
          </p>

          <div className="cover-fade mt-9 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ "--d": "340ms" } as CSSProperties}>
            <a href="/plan" onClick={curtain("/plan")} className="btn group px-7 py-4 text-lg">
              Plan an outfit
              <Icon name="arrow" className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
            </a>
            <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-graphite">
              <a href="/add" onClick={curtain("/add")} className="btn-quiet">
                Add items
              </a>
              <a href="/buy" onClick={curtain("/buy")} className="btn-quiet">
                Before you buy
              </a>
              <a href="/style" onClick={curtain("/style")} className="btn-quiet">
                In style
              </a>
            </span>
          </div>

          <ol className="cover-fade mt-12 flex flex-wrap gap-x-8 gap-y-3" style={{ "--d": "480ms" } as CSSProperties}>
            {STEPS.map((s, i) => (
              <li key={s.text} className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full border border-hairline bg-card">
                  <Icon name={s.icon} className="size-[18px]" />
                </span>
                <span className="text-sm">
                  <span className="font-mono text-xs text-graphite">{String(i + 1).padStart(2, "0")} </span>
                  {s.text}
                </span>
              </li>
            ))}
          </ol>
        </div>

        {/* flat-lay stage */}
        <div className="relative mx-auto aspect-[5/4] w-full max-w-[660px]" aria-hidden>
          <span className="absolute inset-[8%] rounded-full bg-panel" />
          <span className="absolute inset-[18%] rounded-full border border-dashed border-hairline" />
          {PIECES.map((p) => (
            <div
              key={p.notes}
              className="cover-piece absolute"
              style={{ left: `${p.left}%`, top: `${p.top}%`, width: `${p.w}%`, "--r": `${p.r}deg`, "--d": `${p.d}ms` } as CSSProperties}
            >
              <div className="rounded-lg border border-hairline bg-card p-[8%] shadow-[0_14px_30px_-18px_rgb(28_26_23/0.45)] transition-transform duration-200 hover:-translate-y-1.5">
                <GarmentArt item={p} className="aspect-[5/6] w-full" />
              </div>
            </div>
          ))}
          {/* swing tag on a string */}
          <div className="cover-fade absolute top-[-6%] left-[57%] w-[17%]" style={{ "--d": "1100ms" } as CSSProperties}>
            <div className="cover-sway flex flex-col items-center">
              <span className="h-12 w-px bg-ink" />
              <span className="swing w-full" style={{ ["--cut" as string]: "10px" }}>
                <span className="swing-body flex flex-col items-center px-2 pt-6 pb-3 text-center">
                  <span className="swing-hole" />
                  <span className="care text-[10px] text-graphite">AI suggests</span>
                  <span className="mt-0.5 font-serif text-sm leading-tight italic sm:text-base">You decide</span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-2 px-4 pb-5 text-xs text-graphite md:px-8 lg:px-12">
        <span>Rewear {APP_VERSION} · Student prototype · UNSW INFS5706 · Built with AI assistance</span>
        <span className="font-mono text-[11px]">No account needed · photos never stored on a server</span>
      </footer>
    </div>
  );
}
