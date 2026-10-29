import { useId } from "react";
import { fillFor, isLight } from "@/lib/colour";
import type { CatalogueItem } from "@/lib/schemas";

// Flat "fashion flat" silhouettes on a 100×120 canvas. Shape comes from the type plus
// keywords in the notes; fill comes from the colour tag.

type Shape =
  | "tee" | "polo" | "shirt" | "knit" | "tank"
  | "trousers" | "jeans" | "shorts" | "skirt"
  | "dress" | "coat" | "jacket"
  | "sneaker" | "boot" | "heel"
  | "bag" | "hat" | "scarf" | "belt";

export function shapeFor(item: Pick<CatalogueItem, "type" | "notes" | "colour">): Shape {
  const t = `${item.notes} ${item.colour}`.toLowerCase();
  const has = (re: RegExp) => re.test(t);
  switch (item.type) {
    case "top":
      if (has(/polo/)) return "polo";
      if (has(/shirt|blouse|button/) && !has(/t-shirt|tee|sweatshirt/)) return "shirt";
      if (has(/tank|cami|singlet/)) return "tank";
      if (has(/knit|jumper|sweater|cardigan|hoodie|sweatshirt|turtleneck|long.?sleeve|merino|wool/)) return "knit";
      return "tee";
    case "bottom":
      if (has(/short/)) return "shorts";
      if (has(/skirt/)) return "skirt";
      if (has(/jean|denim/)) return "jeans";
      return "trousers";
    case "dress":
      return "dress";
    case "outerwear":
      return has(/coat|trench|parka|overcoat|puffer|longline/) ? "coat" : "jacket";
    case "shoes":
      if (has(/boot/)) return "boot";
      if (has(/heel|pump|stiletto|mule|slingback/)) return "heel";
      return "sneaker";
    default:
      if (has(/hat|cap|beanie|beret/)) return "hat";
      if (has(/scarf/)) return "scarf";
      if (has(/belt/)) return "belt";
      return "bag";
  }
}

// [outline path, detail paths]
const ART: Record<Shape, [string, string[]]> = {
  tee: ["M30 20 L42 15 Q50 22 58 15 L70 20 L88 34 L80 46 L72 40 L72 104 L28 104 L28 40 L20 46 L12 34 Z", ["M42 15 Q50 25 58 15"]],
  polo: [
    "M30 20 L42 15 Q50 22 58 15 L70 20 L88 34 L80 46 L72 40 L72 104 L28 104 L28 40 L20 46 L12 34 Z",
    ["M42 15 L46 25 L50 21 L54 25 L58 15", "M50 21 L50 36"],
  ],
  shirt: [
    "M30 19 L42 13 L50 22 L58 13 L70 19 L90 62 L80 66 L72 46 L72 106 L28 106 L28 46 L20 66 L10 62 Z",
    ["M42 13 L45 27 L50 22 L55 27 L58 13", "M50 22 L50 106", "M78 60 L88 56", "M22 60 L12 56"],
  ],
  knit: [
    "M30 19 L42 15 Q50 21 58 15 L70 19 L88 64 L80 68 L72 46 L72 104 L28 104 L28 46 L20 68 L12 64 Z",
    ["M42 15 Q50 25 58 15", "M28 97 L72 97", "M79 61 L88 58", "M21 61 L12 58"],
  ],
  tank: ["M37 12 L42 12 Q50 28 58 12 L63 12 L67 32 L71 104 L29 104 L33 32 Z", []],
  trousers: ["M30 12 L70 12 L75 110 L56 110 L50 42 L44 110 L25 110 Z", ["M30 20 L70 20", "M50 20 L50 38"]],
  jeans: [
    "M30 12 L70 12 L75 110 L56 110 L50 42 L44 110 L25 110 Z",
    ["M30 20 L70 20", "M50 20 L50 38", "M31 26 Q38 28 40 20", "M69 26 Q62 28 60 20"],
  ],
  shorts: ["M28 30 L72 30 L76 80 L55 82 L50 58 L45 82 L24 80 Z", ["M28 38 L72 38", "M50 38 L50 52"]],
  skirt: ["M36 22 L64 22 L78 102 L22 102 Z", ["M36 30 L64 30", "M44 30 L38 102", "M56 30 L62 102"]],
  dress: [
    "M39 10 L44 10 Q50 18 56 10 L61 10 L63 30 L58 46 L80 110 L20 110 L42 46 L37 30 Z",
    ["M42 46 L58 46"],
  ],
  coat: [
    "M30 15 L42 10 L50 32 L58 10 L70 15 L88 72 L78 76 L72 50 L75 114 L25 114 L28 50 L22 76 L12 72 Z",
    ["M42 10 L45 42 L50 32 L55 42 L58 10", "M50 32 L50 114", "M28 70 L72 70"],
  ],
  jacket: [
    "M30 18 L42 13 L50 34 L58 13 L70 18 L88 70 L78 74 L72 50 L72 92 L28 92 L28 50 L22 74 L12 70 Z",
    ["M42 13 L45 42 L50 34 L55 42 L58 13", "M50 34 L50 92"],
  ],
  sneaker: [
    "M10 64 L10 50 Q16 44 26 46 L36 52 Q48 58 58 58 Q68 60 68 68 L68 72 L10 72 Z M30 92 L30 78 Q36 72 46 74 L56 80 Q68 86 78 86 Q88 88 88 96 L88 100 L30 100 Z",
    ["M10 66 L68 66", "M30 94 L88 94", "M22 50 L30 56", "M42 78 L50 84"],
  ],
  boot: [
    "M20 22 L40 22 L42 66 Q56 70 68 72 Q78 74 78 84 L78 90 L20 90 Z",
    ["M20 84 L78 84", "M20 30 L40 30"],
  ],
  heel: [
    "M14 68 Q24 56 38 64 Q54 74 74 70 Q82 70 82 78 L70 80 L48 80 Q34 76 26 78 L23 98 L19 98 L17 78 Z",
    ["M70 80 L82 78"],
  ],
  bag: ["M22 52 L78 52 L84 106 L16 106 Z", ["M36 52 Q36 26 50 26 Q64 26 64 52", "M22 62 L78 62"]],
  hat: ["M24 72 Q24 40 50 38 Q76 40 76 72 Z M8 72 L92 72 L92 78 L8 78 Z", ["M26 64 L74 64"]],
  scarf: ["M32 10 L54 10 L54 72 L62 108 L44 110 L40 76 L32 76 Z", ["M44 110 L44 116", "M50 109 L50 115", "M56 108 L57 114"]],
  belt: ["M6 54 L94 54 L94 66 L6 66 Z", ["M30 52 L42 52 L42 68 L30 68 Z", "M36 60 L48 60"]],
};

export function GarmentArt({ item, className = "" }: { item: Pick<CatalogueItem, "type" | "notes" | "colour">; className?: string }) {
  const uid = useId().replace(/:/g, "");
  const shape = shapeFor(item);
  const fill = fillFor(item.colour);
  const [outline, details] = ART[shape];
  const second = fill.secondary ?? (isLight(fill.primary) ? "#1c1a17" : "#f4f0e8");
  const paint = fill.pattern === "plain" ? fill.primary : `url(#p${uid})`;

  return (
    <svg viewBox="0 0 100 120" className={className} aria-hidden focusable="false">
      {fill.pattern !== "plain" && (
        <defs>
          <pattern id={`p${uid}`} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill={fill.primary} />
            {fill.pattern === "stripe" && <rect y="5" width="8" height="3" fill={second} />}
            {fill.pattern === "check" && <path d="M0 0 H8 M0 0 V8" stroke={second} strokeWidth="2" opacity=".6" />}
            {fill.pattern === "print" && <circle cx="4" cy="4" r="1.6" fill={second} />}
          </pattern>
        </defs>
      )}
      <path d={outline} fill={paint} stroke="#1c1a17" strokeWidth="1.4" strokeLinejoin="round" fillRule="nonzero" />
      {details.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#1c1a17" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
      ))}
      {shape === "shirt" &&
        [38, 54, 70, 86].map((y) => <circle key={y} cx="53" cy={y} r="1.2" fill="#1c1a17" opacity=".55" />)}
    </svg>
  );
}
