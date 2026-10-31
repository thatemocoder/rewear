import { parseTag } from "@/lib/parse";
import { runFeature } from "@/lib/runFeature";
import { clip, sanitizeImage } from "@/lib/validate";

export async function POST(req: Request) {
  return runFeature(
    req,
    "tag",
    (body) => {
      // The image is used for this one call only. It is never written to disk or logged.
      const b = (body ?? {}) as Record<string, unknown>;
      const image = sanitizeImage(b.image);
      if (!image) return { error: "Add a JPEG, PNG or WebP photo." };
      // Optional pointer from the person, e.g. "the black heels" (tag v2+).
      const hint = clip(b.hint, 80);
      const text = "Draft tags for the wardrobe item in this photo." + (hint ? `\n\nhint: ${JSON.stringify(hint)}` : "");
      return { text, image };
    },
    parseTag,
  );
}
