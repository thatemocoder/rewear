// Server-only: recent articles from Australian fashion media via their public RSS feeds.
// These are the ONLY source the trends prompt may use. Feeds are cached for 3 hours.
import type { Article } from "./schemas";

const FEEDS = [
  { source: "ELLE Australia", url: "https://www.elle.com.au/fashion/feed" },
  { source: "marie claire Australia", url: "https://www.marieclaire.com.au/fashion/feed" },
  { source: "Who What Wear Australia", url: "https://www.whowhatwear.com.au/rss" },
];

const UA = "Mozilla/5.0 (compatible; Rewear/0.1; +https://rewear-henna.vercel.app)";
const MAX_AGE_DAYS = 30;
const PER_FEED = 12;

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
function clean(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/\s+/g, " ")
    .trim();
}

const tag = (xml: string, name: string) => xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"))?.[1] ?? "";

/** Minimal RSS 2.0 item parser; enough for WordPress-style feeds. */
export function parseRss(xml: string, source: string): Omit<Article, "id">[] {
  return xml
    .split(/<item[\s>]/i)
    .slice(1)
    .map((chunk) => {
      const item = chunk.split(/<\/item>/i)[0];
      const date = new Date(clean(tag(item, "pubDate")));
      return {
        source,
        title: clean(tag(item, "title")),
        url: clean(tag(item, "link")),
        date: Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10),
        summary: clean(tag(item, "description")).slice(0, 280),
      };
    })
    .filter((a) => a.title && /^https?:\/\//.test(a.url));
}

export async function recentArticles(): Promise<Article[]> {
  const cutoff = new Date(Date.now() - MAX_AGE_DAYS * 86400000).toISOString().slice(0, 10);
  const lists = await Promise.all(
    FEEDS.map(async (f) => {
      try {
        const res = await fetch(f.url, { headers: { "User-Agent": UA }, next: { revalidate: 10800 } });
        if (!res.ok) throw new Error(String(res.status));
        return parseRss(await res.text(), f.source)
          .filter((a) => !a.date || a.date >= cutoff)
          .slice(0, PER_FEED);
      } catch (err) {
        console.error(`[feeds] ${f.source}:`, (err as Error).message);
        return [];
      }
    }),
  );
  return lists.flat().map((a, i) => ({ ...a, id: i + 1 }));
}
