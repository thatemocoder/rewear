import { parseBuy } from "@/lib/parse";
import { runFeature } from "@/lib/runFeature";
import { clip, sanitizeCatalogue, sanitizeImage } from "@/lib/validate";

export async function POST(req: Request) {
  return runFeature(
    req,
    "buy",
    (body) => {
      const b = (body ?? {}) as Record<string, unknown>;
      const catalogue = sanitizeCatalogue(b.catalogue);
      const considering = clip(b.considering, 300);
      if (!catalogue) return { error: "Your wardrobe is empty, so there's nothing to compare against." };
      if (!considering) return { error: "Describe the item you're considering." };

      const image = b.image ? sanitizeImage(b.image) : undefined;
      if (image === null) return { error: "That photo couldn't be read. Try a JPEG, PNG or WebP." };

      return { text: JSON.stringify({ catalogue, considering }, null, 2), image };
    },
    parseBuy,
  );
}
