import { useId } from "react";
import { fillFor } from "@/lib/colour";
import type { ItemType } from "@/lib/schemas";
import { GarmentArt } from "./GarmentArt";

// Decorative plate for a trend: a garment silhouette picked from the trend's words, or a
// fabric swatch when no garment is named. Purely illustrative; it carries no information.

const GARMENTS: [RegExp, ItemType, string][] = [
  [/racerback|tank|singlet|cami/, "top", "tank"],
  [/polo|tennis/, "top", "polo"],
  [/shirt|blouse|button/, "top", "shirt"],
  [/knit|jumper|cardigan|sweater|crochet/, "top", "knit"],
  [/tee|t-shirt|top/, "top", "tee"],
  [/dress|gown/, "dress", "dress"],
  [/skirt/, "bottom", "skirt"],
  [/short/, "bottom", "shorts"],
  [/jean|denim/, "bottom", "jeans"],
  [/trouser|pant|tailor/, "bottom", "trousers"],
  [/coat|trench|outerwear/, "outerwear", "coat"],
  [/jacket|blazer|bomber/, "outerwear", "jacket"],
  [/boot/, "shoes", "boot"],
  [/heel|pump|sandal|mule|slingback|kitten/, "shoes", "heel"],
  [/sneaker|trainer|shoe|loafer|flat/, "shoes", "sneaker"],
  [/bag|tote|clutch/, "accessory", "bag"],
  [/hat|cap|beanie/, "accessory", "hat"],
  [/scarf/, "accessory", "scarf"],
  [/belt/, "accessory", "belt"],
];

const SOFT = ["sand", "sage", "blush", "light blue", "camel"];
const FALLBACK = fillFor("").primary;

export function TrendArt({ text, index }: { text: string; index: number }) {
  const uid = useId().replace(/:/g, "");
  const t = text.toLowerCase();
  const garment = GARMENTS.find(([re]) => re.test(t));
  // Use colour words from the trend if any, otherwise a soft palette colour.
  const colour = fillFor(t).primary === FALLBACK ? `${SOFT[index % SOFT.length]} ${t}` : t;

  return (
    <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-xl border border-hairline bg-panel" aria-hidden>
      <span className="absolute size-[78%] rounded-full bg-card" />
      {garment ? (
        <GarmentArt item={{ type: garment[1], notes: garment[2], colour }} className="relative h-[72%] w-[72%]" />
      ) : (
        <Swatch fill={fillFor(colour)} weave={/linen|cotton|texture|fabric|weave/.test(t)} id={uid} />
      )}
      <span className="absolute top-2.5 left-3 font-serif text-2xl leading-none text-graphite">
        {String(index + 1).padStart(2, "0")}
      </span>
    </div>
  );
}

function Swatch({ fill, weave, id }: { fill: ReturnType<typeof fillFor>; weave: boolean; id: string }) {
  // Pinked (zigzag) edges like a fabric sample
  const zig = Array.from({ length: 12 }, (_, i) => `${10 + i * 6.67},${i % 2 ? 22 : 18}`).join(" ");
  const zigB = Array.from({ length: 12 }, (_, i) => `${83.4 - i * 6.67},${i % 2 ? 98 : 102}`).join(" ");
  const second = fill.secondary ?? "#1c1a17";
  return (
    <svg viewBox="0 0 100 120" className="relative h-[72%] w-[72%] -rotate-6">
      <defs>
        <pattern id={`s${id}`} width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill={fill.primary} />
          {fill.pattern === "stripe" && <rect y="5" width="8" height="3" fill={second} opacity=".8" />}
          {fill.pattern === "check" && <path d="M0 0H8M0 0V8" stroke={second} strokeWidth="2" opacity=".5" />}
          {fill.pattern === "print" && <circle cx="4" cy="4" r="1.7" fill={second} opacity=".7" />}
          {fill.pattern === "plain" && weave && <path d="M0 2H8M0 6H8M2 0V8M6 0V8" stroke="#1c1a17" strokeWidth=".4" opacity=".25" />}
        </pattern>
      </defs>
      <polygon
        points={`10,20 ${zig} 90,20 90,100 ${zigB} 10,100`}
        fill={`url(#s${id})`}
        stroke="#1c1a17"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
