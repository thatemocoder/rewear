import { parsePlan } from "@/lib/parse";
import { runFeature } from "@/lib/runFeature";
import { clip, sanitizeCatalogue, sanitizeDressCode } from "@/lib/validate";

export async function POST(req: Request) {
  return runFeature(
    req,
    "plan",
    (body) => {
      const b = (body ?? {}) as Record<string, unknown>;
      const catalogue = sanitizeCatalogue(b.catalogue);
      const occasion = clip(b.occasion, 200);
      const temperature_c = Number(b.temperature_c);
      const dress_code = sanitizeDressCode(b.dress_code);

      if (!catalogue) return { error: "Your wardrobe is empty, so there's nothing to plan with." };
      if (!occasion) return { error: "Add an occasion." };
      if (!Number.isFinite(temperature_c) || temperature_c < -30 || temperature_c > 55) {
        return { error: "Enter a temperature between -30 and 55 °C." };
      }
      if (!dress_code) return { error: "Choose a dress code." };

      const payload = { catalogue, occasion, temperature_c, dress_code, dress_code_notes: clip(b.dress_code_notes, 200) };
      return { text: JSON.stringify(payload, null, 2) };
    },
    parsePlan,
  );
}
