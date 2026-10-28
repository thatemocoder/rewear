"use client";

import { usePathname } from "next/navigation";
import { PROMPT_CONFIG } from "@/lib/prompts.config";
import type { Feature } from "@/lib/schemas";
import { SessionLog } from "./SessionLog";

const FEATURE_FOR_PATH: Record<string, Feature> = { "/": "plan", "/add": "tag", "/buy": "buy" };

export function SiteFooter() {
  const feature = FEATURE_FOR_PATH[usePathname()] ?? "plan";
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto max-w-6xl px-4 py-4 text-sm text-graphite md:px-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <span className="care">
            Prompt: {feature} {PROMPT_CONFIG[feature]}
          </span>
          <span>Student prototype · UNSW INFS5706 · Built with AI assistance</span>
        </div>
        <div className="mt-3">
          <SessionLog />
        </div>
      </div>
    </footer>
  );
}
