"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AboutDialog } from "./AboutDialog";

const NAV = [
  { href: "/", label: "Plan an outfit" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/add", label: "Add items" },
  { href: "/buy", label: "Before you buy" },
  { href: "/style", label: "In style" },
];

export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="border-b border-ink">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 pt-6 pb-4 md:flex-row md:items-end md:justify-between md:px-8">
        <div>
          <Link href="/" className="font-serif text-[1.75rem] leading-none font-medium tracking-tight">
            Rewear
          </Link>
          <p className="mt-2 max-w-md text-sm text-graphite">
            AI-assisted outfit planner — suggestions only. You make the final call.
          </p>
        </div>
        <nav aria-label="Main" className="-mx-1 flex flex-wrap gap-x-5 gap-y-1 text-[0.9375rem]">
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`px-1 py-1 underline-offset-[6px] ${
                  active ? "underline decoration-1" : "text-graphite hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
          <AboutDialog />
        </nav>
      </div>
    </header>
  );
}
