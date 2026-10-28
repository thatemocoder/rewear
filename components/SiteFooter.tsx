"use client";

import { usePathname } from "next/navigation";
import { PROMPT_CONFIG } from "@/lib/prompts.config";
import type { Feature } from "@/lib/schemas";

const FEATURE_FOR_PATH: Record<string, Feature> = { "/": "plan", "/add": "tag", "/buy": "buy" };

export function SiteFooter() {
  const feature = FEATURE_FOR_PATH[usePathname()] ?? "plan";
  return (
    <footer className="border-t border-hairline">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-4 text-sm text-graphite md:px-8">
        <span className="care">
          Prompt: {feature} {PROMPT_CONFIG[feature]}
        </span>
        <span>Student prototype · UNSW INFS5706</span>
      </div>
    </footer>
  );
}
