// Turns a free-text colour tag ("navy", "black and white stripe", "pale blue") into fills
// for the garment silhouettes. Unknown words fall back to a neutral grey.

const NAMED: Record<string, string> = {
  black: "#1f1d1b", charcoal: "#3a3a3c", graphite: "#45474a", grey: "#8d8d8d", gray: "#8d8d8d", silver: "#bfc1c2",
  white: "#f7f6f2", ivory: "#f4efe1", cream: "#efe6cf", ecru: "#e9dfc7", oat: "#ddd1b8", oatmeal: "#ddd1b8",
  beige: "#d9c7a7", stone: "#cfc3ae", sand: "#d8c39a", taupe: "#a8998a", camel: "#c19a6b", tan: "#c8a27a",
  khaki: "#b5a77a", brown: "#6f4e37", chocolate: "#4e3426", mocha: "#7b5b4a", rust: "#a5492a", terracotta: "#c0643f",
  navy: "#1f2a44", denim: "#4a6787", blue: "#3d6aa8", cobalt: "#2251a8", "sky": "#9cc3e6", teal: "#2e7d7a",
  turquoise: "#3fb7b0", green: "#4c7a4e", olive: "#6b6b3a", khakigreen: "#6b6b3a", sage: "#a3b18f", mint: "#b8dcc4",
  forest: "#2f4f3a", emerald: "#1f7a53", yellow: "#e8c547", mustard: "#c99a2e", gold: "#c9a443", orange: "#e07b39",
  red: "#b3332e", burgundy: "#6d1f2c", maroon: "#6b2230", oxblood: "#5e1f22", wine: "#6a2335", pink: "#e6a1b0",
  blush: "#ecc3c0", rose: "#d98a96", fuchsia: "#c2367e", magenta: "#b0307a", purple: "#6c4a8a", lilac: "#c3aed6",
  lavender: "#bfb3dc", plum: "#5d3354", coral: "#e9806e", peach: "#f2b99a", nude: "#d9b49a", multi: "#9a8c7a",
};

const ALIASES: Record<string, string> = { "off-white": "ivory", offwhite: "ivory", "light blue": "sky", "baby blue": "sky" };

export interface Fill {
  primary: string;
  secondary: string | null; // second colour for stripes/two-tone
  pattern: "plain" | "stripe" | "check" | "print";
}

function mix(hex: string, toward: string, amount: number): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const a = p(hex);
  const b = p(toward);
  return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * amount).toString(16).padStart(2, "0")).join("");
}

/** True for light colours (relative luminance), to pick a contrasting pattern colour. */
export function isLight(hex: string): boolean {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.55;
}

export function fillFor(colourText: string): Fill {
  let t = ` ${colourText.toLowerCase().replace(/[^a-z\s-]/g, " ")} `;
  for (const [k, v] of Object.entries(ALIASES)) t = t.replace(` ${k} `, ` ${v} `);
  const words = t.split(/\s+/).filter(Boolean);

  const found: string[] = [];
  words.forEach((w, i) => {
    const key = NAMED[w] ? w : NAMED[w.replace(/s$/, "")] ? w.replace(/s$/, "") : null;
    if (!key) return;
    let hex = NAMED[key];
    const prev = words[i - 1];
    if (prev === "light" || prev === "pale") hex = mix(hex, "#ffffff", 0.45);
    if (prev === "dark" || prev === "deep") hex = mix(hex, "#000000", 0.35);
    found.push(hex);
  });

  const pattern = /stripe|striped|pinstripe|breton/.test(t)
    ? "stripe"
    : /check|plaid|gingham|tartan|houndstooth/.test(t)
      ? "check"
      : /floral|print|leopard|paisley|polka|dot/.test(t)
        ? "print"
        : "plain";

  return { primary: found[0] ?? "#9b958c", secondary: found[1] ?? null, pattern };
}
