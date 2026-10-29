import { parsePlan } from "@/lib/parse";
import { runFeature } from "@/lib/runFeature";
import { sanitizeCatalogue, sanitizePlanContext } from "@/lib/validate";

export async function POST(req: Request) {
  return runFeature(
    req,
    "plan",
    (body) => {
      const catalogue = sanitizeCatalogue((body as Record<string, unknown> | null)?.catalogue);
      if (!catalogue) return { error: "Your wardrobe is empty, so there's nothing to plan with." };
      const ctx = sanitizePlanContext(body);
      if ("error" in ctx) return ctx;
      return { text: JSON.stringify({ catalogue, ...ctx.context }, null, 2) };
    },
    parsePlan,
  );
}
