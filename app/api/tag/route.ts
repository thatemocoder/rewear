import { parseTag } from "@/lib/parse";
import { runFeature } from "@/lib/runFeature";
import { sanitizeImage } from "@/lib/validate";

export async function POST(req: Request) {
  return runFeature(
    req,
    "tag",
    (body) => {
      // The image is used for this one call only. It is never written to disk or logged.
      const image = sanitizeImage((body as Record<string, unknown> | null)?.image);
      if (!image) return { error: "Add a JPEG, PNG or WebP photo." };
      return { text: "Draft tags for the clothing item in this photo.", image };
    },
    parseTag,
  );
}
