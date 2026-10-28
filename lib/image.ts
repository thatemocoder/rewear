// Re-encodes a photo through a canvas before upload. Drawing to canvas and exporting
// a fresh JPEG drops all EXIF metadata (including GPS location). Longest side ≤ 1024px.
import type { ImageInput } from "./schemas";

const MAX_SIDE = 1024;

export async function prepareImage(file: File): Promise<ImageInput & { previewUrl: string }> {
  if (!file.type.startsWith("image/")) throw new Error("That file isn't an image.");

  // imageOrientation applies the EXIF rotation to the pixels before the metadata is dropped.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new Error("This browser can’t read that image format. Try a JPEG or PNG.");
  }
  const ratio = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * ratio);
  canvas.height = Math.round(bitmap.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("This browser can't process images.");
  ctx.fillStyle = "#ffffff"; // flatten transparent PNGs
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const previewUrl = canvas.toDataURL("image/jpeg", 0.85);
  return { mimeType: "image/jpeg", data: previewUrl.split(",")[1], previewUrl };
}
