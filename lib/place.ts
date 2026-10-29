// Server-only: approximate location, venue search and weather. No AI involved.
// - Approximate area: Vercel's IP geolocation headers (no browser permission, never stored)
// - Venues: OpenStreetMap Nominatim (usage policy: identify the app, ≤1 request/second, no autocomplete)
// - Weather: Open-Meteo forecast API (free, no key)
import type { Forecast, Place, Venue } from "./schemas";

const UA = "Rewear/0.1 (student prototype; https://rewear-henna.vercel.app)";

export function placeFromHeaders(req: Request): Place | null {
  const h = req.headers;
  const lat = Number(h.get("x-vercel-ip-latitude"));
  const lon = Number(h.get("x-vercel-ip-longitude"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) return null;
  const city = decodeURIComponent(h.get("x-vercel-ip-city") ?? "");
  const region = h.get("x-vercel-ip-country-region") ?? "";
  const country = h.get("x-vercel-ip-country") ?? "";
  const label = [city, region].filter(Boolean).join(", ") || country || "Your area";
  return { label, lat, lon, source: "ip" };
}

// ── Venues ──
let lastNominatim = 0;
const venueCache = new Map<string, Venue[]>();

export async function searchVenues(q: string, near?: { lat: number; lon: number }): Promise<Venue[]> {
  const key = `${q.toLowerCase()}|${near ? `${near.lat.toFixed(1)},${near.lon.toFixed(1)}` : ""}`;
  const hit = venueCache.get(key);
  if (hit) return hit;

  const wait = lastNominatim + 1100 - Date.now(); // stay under 1 request/second
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastNominatim = Date.now();

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.search = new URLSearchParams({ q, format: "jsonv2", limit: "6", "accept-language": "en" }).toString();
  if (near) {
    // Prefer results near the person, without excluding faraway ones.
    const d = 1.5;
    url.searchParams.set("viewbox", `${near.lon - d},${near.lat + d},${near.lon + d},${near.lat - d}`);
  }
  const res = await fetch(url, { headers: { "User-Agent": UA, Referer: "https://rewear-henna.vercel.app" } });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, string>>;
  const venues = rows.map((r) => ({
    name: r.name || r.display_name.split(",")[0],
    address: r.display_name,
    kind: humanKind(r.category, r.type),
    lat: Number(r.lat),
    lon: Number(r.lon),
  }));
  if (venueCache.size > 500) venueCache.clear();
  venueCache.set(key, venues);
  return venues;
}

function humanKind(category = "", type = ""): string {
  if (!type || type === "yes") return category.replace(/_/g, " ");
  if (["city", "town", "suburb", "village", "administrative", "neighbourhood"].includes(type)) return "area";
  return type.replace(/_/g, " ");
}

// ── Weather ──
const WMO: [number[], string][] = [
  [[0], "clear"],
  [[1], "mainly clear"],
  [[2], "partly cloudy"],
  [[3], "overcast"],
  [[45, 48], "fog"],
  [[51, 53, 55, 56, 57], "drizzle"],
  [[61, 63, 65, 66, 67], "rain"],
  [[71, 73, 75, 77, 85, 86], "snow"],
  [[80, 81, 82], "showers"],
  [[95, 96, 99], "thunderstorms"],
];
const describe = (code: number) => WMO.find(([codes]) => codes.includes(code))?.[1] ?? "unsettled";

/** Hourly forecast at a place for a local date (YYYY-MM-DD) and hour (0–23). Up to ~15 days ahead. */
export async function forecastAt(lat: number, lon: number, date: string, hour: number): Promise<Forecast> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    hourly: "temperature_2m,apparent_temperature,precipitation_probability,weather_code",
    timezone: "auto",
    start_date: date,
    end_date: date,
  }).toString();
  const res = await fetch(url, { next: { revalidate: 1800 } });
  const body = await res.json();
  if (!res.ok) throw new Error(body?.reason ?? `Open-Meteo ${res.status}`);
  const h = body.hourly;
  const i = Math.max(0, Math.min(h.time.length - 1, hour));
  return {
    temperature_c: Math.round(h.temperature_2m[i]),
    feels_like_c: Math.round(h.apparent_temperature[i]),
    rain_chance_pct: h.precipitation_probability[i] ?? null,
    conditions: describe(h.weather_code[i]),
    time: h.time[i],
    timezone: body.timezone,
  };
}
