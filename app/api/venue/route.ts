import { searchVenues } from "@/lib/place";
import { clip } from "@/lib/validate";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const q = clip(p.get("q"), 120);
  if (q.length < 2) return Response.json({ ok: false, message: "Type a venue name or address." }, { status: 400 });
  const lat = Number(p.get("lat"));
  const lon = Number(p.get("lon"));
  const near = p.has("lat") && Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : undefined;
  try {
    return Response.json({ ok: true, venues: await searchVenues(q, near) });
  } catch (err) {
    console.error("[venue]", (err as Error).message);
    return Response.json({ ok: false, message: "Venue search isn't responding. Try again, or leave it blank." }, { status: 502 });
  }
}
