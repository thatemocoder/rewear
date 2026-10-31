"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AboutDialog } from "./AboutDialog";
import { Icon } from "./Icon";

const NAV = [
  { href: "/", label: "Plan an outfit" },
  { href: "/wardrobe", label: "Wardrobe" },
  { href: "/add", label: "Add items" },
  { href: "/buy", label: "Before you buy" },
  { href: "/style", label: "In style" },
];

/** Masthead: one row on wide screens (wordmark · nav · About); two rows on narrow ones. */
export function SiteHeader() {
  const path = usePathname();
  return (
    <header className="border-b border-ink">
      <div className="grid grid-cols-[1fr_auto] items-center gap-x-6 px-4 md:px-8 lg:px-12 xl:grid-cols-[auto_1fr_auto] xl:gap-x-10">
        <div className="order-1 pt-5 pb-3 xl:py-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
            <Link href="/" className="group inline-flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full border border-ink transition-transform duration-200 group-hover:-rotate-6">
                <Icon name="hanger" className="size-5" />
              </span>
              <span className="font-serif text-[1.85rem] leading-none font-medium tracking-tight">Rewear</span>
            </Link>
            <p className="max-w-[17rem] text-xs leading-snug text-graphite">
              AI-assisted outfit planner — suggestions only. You make the final call.
            </p>
          </div>
        </div>
        <div className="order-2 xl:order-3">
          <AboutDialog />
        </div>
        <nav
          aria-label="Main"
          className="order-3 col-span-2 -mx-3 flex gap-x-1 overflow-x-auto border-t border-hairline py-1.5 text-base xl:order-2 xl:col-span-1 xl:mx-0 xl:border-t-0 xl:py-0"
        >
          {NAV.map((n) => {
            const active = n.href === "/" ? path === "/" : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 rounded-md px-3 py-2 whitespace-nowrap underline-offset-[10px] ${
                  active
                    ? "font-semibold text-ink underline decoration-2"
                    : "text-graphite decoration-transparent hover:bg-panel hover:text-ink"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
