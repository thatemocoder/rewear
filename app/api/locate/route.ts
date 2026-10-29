import { placeFromHeaders } from "@/lib/place";

// Approximate area from the connection (Vercel IP geolocation). Not stored or logged.
export async function GET(req: Request) {
  const place = placeFromHeaders(req);
  return Response.json(place ? { ok: true, place } : { ok: false }, { headers: { "Cache-Control": "private, no-store" } });
}
