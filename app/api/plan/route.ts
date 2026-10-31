import { parsePlan } from "@/lib/parse";
import { runFeature } from "@/lib/runFeature";
import type { CatalogueItem } from "@/lib/schemas";
import { idProblem, sanitizeCatalogue, sanitizePlanContext, unknownIds } from "@/lib/validate";

export async function POST(req: Request) {
  let items: CatalogueItem[] = [];
  return runFeature(
    req,
    "plan",
    (body) => {
      const catalogue = sanitizeCatalogue((body as Record<string, unknown> | null)?.catalogue);
      if (!catalogue) return { error: "Your wardrobe is empty, so there's nothing to plan with." };
      items = catalogue;
      const ctx = sanitizePlanContext(body);
      if ("error" in ctx) return ctx;
      return { text: JSON.stringify({ catalogue, ...ctx.context }, null, 2) };
    },
    parsePlan,
    (plan) => idProblem(unknownIds(plan.outfits.flatMap((o) => o.items.map((i) => i.item_id)), items)),
  );
}
