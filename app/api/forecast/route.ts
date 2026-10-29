import { forecastAt } from "@/lib/place";

export async function GET(req: Request) {
  const p = new URL(req.url).searchParams;
  const lat = Number(p.get("lat"));
  const lon = Number(p.get("lon"));
  const date = p.get("date") ?? "";
  const hour = Number(p.get("hour"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !(hour >= 0 && hour <= 23)) {
    return Response.json({ ok: false, message: "Missing place or time." }, { status: 400 });
  }
  try {
    return Response.json({ ok: true, forecast: await forecastAt(lat, lon, date, Math.floor(hour)) });
  } catch (err) {
    const msg = (err as Error).message;
    console.error("[forecast]", msg);
    const outOfRange = /out of allowed range|date/i.test(msg);
    return Response.json(
      {
        ok: false,
        message: outOfRange
          ? "Forecasts only go about two weeks ahead. Type the temperature yourself."
          : "The forecast isn't available right now. Type the temperature yourself.",
      },
      { status: outOfRange ? 400 : 502 },
    );
  }
}
