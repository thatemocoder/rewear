import { parsePlan, parseStylist } from "@/lib/parse";
import { runFeature } from "@/lib/runFeature";
import { clip, sanitizeCatalogue, sanitizePlanContext } from "@/lib/validate";

const MAX_TURNS = 16;

export async function POST(req: Request) {
  return runFeature(
    req,
    "stylist",
    (body) => {
      const b = (body ?? {}) as Record<string, unknown>;
      const catalogue = sanitizeCatalogue(b.catalogue);
      if (!catalogue) return { error: "Your wardrobe is empty." };
      const ctx = sanitizePlanContext(b.request);
      if ("error" in ctx) return { error: "Plan an outfit first, then talk it through." };
      // Re-read the earlier plan through the same parser so only its known shape reaches the prompt.
      const plan = parsePlan(JSON.stringify(b.plan ?? {})) ?? { outfits: [], your_call: null, message: null };

      const conversation = (Array.isArray(b.conversation) ? b.conversation : [])
        .slice(-MAX_TURNS)
        .map((t) => ({
          role: (t as Record<string, unknown>)?.role === "hem" ? "hem" : "person",
          text: clip((t as Record<string, unknown>)?.text, 800),
        }))
        .filter((t) => t.text);
      if (!conversation.length || conversation[conversation.length - 1].role !== "person") {
        return { error: "Write a message first." };
      }
      return { text: JSON.stringify({ catalogue, request: ctx.context, plan, conversation }, null, 2) };
    },
    parseStylist,
  );
}
