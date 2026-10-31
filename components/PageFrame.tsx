"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { CurtainProvider } from "./Curtain";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

/** App chrome. The cover page ("/") is full-bleed with its own masthead; every other page gets header + footer. */
export function PageFrame({ children }: { children: ReactNode }) {
  const cover = usePathname() === "/";
  return (
    <CurtainProvider>
      {!cover && <SiteHeader />}
      <main id="main" className={cover ? "w-full flex-1" : "w-full flex-1 px-4 py-8 md:px-8 lg:px-12 lg:py-10"}>
        {children}
      </main>
      {!cover && <SiteFooter />}
    </CurtainProvider>
  );
}
