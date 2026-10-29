// Client-side helpers for location, venue and weather context (no AI).
import type { Forecast, Place, Venue } from "./schemas";

export async function locate(): Promise<Place | null> {
  try {
    const r = await (await fetch("/api/locate")).json();
    return r.ok ? r.place : null;
  } catch {
    return null;
  }
}

export function preciseLocation(): Promise<Place> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("This browser can't share its location."));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ label: "Your current location", lat: p.coords.latitude, lon: p.coords.longitude, source: "device" }),
      () => reject(new Error("Location permission wasn't given.")),
      { timeout: 10000, maximumAge: 600000 },
    );
  });
}

export async function findVenues(q: string, near?: Place | null): Promise<{ venues?: Venue[]; message?: string }> {
  const p = new URLSearchParams({ q });
  if (near) p.set("lat", String(near.lat)), p.set("lon", String(near.lon));
  try {
    const r = await (await fetch(`/api/venue?${p}`)).json();
    return r.ok ? { venues: r.venues } : { message: r.message };
  } catch {
    return { message: "Venue search isn't responding." };
  }
}

export async function getForecast(lat: number, lon: number, date: string, hour: number): Promise<{ forecast?: Forecast; message?: string }> {
  const p = new URLSearchParams({ lat: String(lat), lon: String(lon), date, hour: String(hour) });
  try {
    const r = await (await fetch(`/api/forecast?${p}`)).json();
    return r.ok ? { forecast: r.forecast } : { message: r.message };
  } catch {
    return { message: "The forecast isn't available right now." };
  }
}

/** Great-circle distance in km. */
export function distanceKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Local YYYY-MM-DD for a Date. */
export const isoDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** "Thu 29 Oct, 3 pm" from a local forecast time like 2026-10-29T15:00. */
export function describeTime(local: string): string {
  const [d, t] = local.split("T");
  const [y, m, day] = d.split("-").map(Number);
  const h = Number(t.slice(0, 2));
  const date = new Date(y, m - 1, day);
  const wd = date.toLocaleDateString("en-AU", { weekday: "short" });
  const mon = date.toLocaleDateString("en-AU", { month: "short" });
  const hh = h === 0 ? "12 am" : h < 12 ? `${h} am` : h === 12 ? "12 pm" : `${h - 12} pm`;
  return `${wd} ${day} ${mon}, ${hh}`;
}
