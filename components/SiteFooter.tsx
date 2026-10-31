"use client";

import { usePathname } from "next/navigation";
import { PROMPT_CONFIG } from "@/lib/prompts.config";
import type { Feature } from "@/lib/schemas";
import { APP_VERSION } from "@/lib/version";
import { SessionLog } from "./SessionLog";

// The prompts each page uses (the Wardrobe page uses none).
const FEATURES_FOR_PATH: Record<string, Feature[]> = {
  "/plan": ["plan", "stylist"],
  "/add": ["tag"],
  "/buy": ["buy"],
  "/style": ["trends"],
};

export function SiteFooter() {
  const features = FEATURES_FOR_PATH[usePathname()] ?? [];
  return (
    <footer className="border-t border-hairline">
      <div className="px-4 py-4 text-xs text-graphite md:px-8 lg:px-12">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <span className="font-mono text-[11px]">
            {features.length ? `Prompt: ${features.map((f) => `${f} ${PROMPT_CONFIG[f]}`).join(" · ")}` : "No AI on this page"}
          </span>
          <span>Rewear {APP_VERSION} · Student prototype · UNSW INFS5706 · Built with AI assistance</span>
        </div>
        <div className="mt-2">
          <SessionLog />
        </div>
      </div>
    </footer>
  );
}
