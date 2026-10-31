import { recentArticles } from "@/lib/feeds";
import { parseTrends } from "@/lib/parse";
import { runFeature } from "@/lib/runFeature";
import type { Article, CatalogueItem } from "@/lib/schemas";
import { idProblem, sanitizeCatalogue, unknownIds } from "@/lib/validate";

export async function POST(req: Request) {
  let articles: Article[] = [];
  let items: CatalogueItem[] = [];
  return runFeature(
    req,
    "trends",
    async (body) => {
      const catalogue = sanitizeCatalogue((body as Record<string, unknown> | null)?.catalogue);
      if (!catalogue) return { error: "Your wardrobe is empty." };
      items = catalogue;
      articles = await recentArticles();
      if (articles.length < 3) return { error: "Couldn't reach the fashion news feeds right now. Try again later." };
      const forPrompt = articles.map(({ id, source, date, title, summary }) => ({ id, source, date, title, summary }));
      return { text: JSON.stringify({ articles: forPrompt, catalogue }, null, 2) };
    },
    // The article list (titles + links) is attached here from the feeds, never written by the AI.
    (raw) => {
      const t = parseTrends(raw);
      return t && { ...t, articles: articles.map(({ id, source, title, url, date }) => ({ id, source, title, url, date })) };
    },
    (r) => {
      const known = new Set(articles.map((a) => a.id));
      const badSources = [...new Set(r.trends.flatMap((t) => t.source_ids).filter((id) => !known.has(id)))];
      return [
        ...idProblem(unknownIds(r.trends.flatMap((t) => t.item_ids), items)),
        ...(badSources.length ? [`Unknown article id ${badSources.join(", ")} (not in the articles list).`] : []),
      ];
    },
  );
}
