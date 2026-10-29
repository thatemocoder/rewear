"use client";

import { useEffect, useState } from "react";
import { describeTime, distanceKm, findVenues, getForecast, isoDate, locate, preciseLocation } from "@/lib/context";
import type { Forecast, Place, Venue } from "@/lib/schemas";

export interface WhereWhenValue {
  place: Place | null;
  venue: Venue | null;
  date: string;
  hour: number;
  forecast: Forecast | null;
  /** Where the forecast is for: the venue if chosen, else the person's area. */
  forecastFor: string | null;
}

/**
 * Location, optional venue and time. Fetches a forecast for the venue (or the person's
 * area) and reports it up; the parent decides whether to use it for the temperature.
 */
export function WhereWhen({ onChange }: { onChange: (v: WhereWhenValue) => void }) {
  const now = new Date();
  const [place, setPlace] = useState<Place | null>(null);
  const [placeMsg, setPlaceMsg] = useState<string | null>("Finding your area…");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Venue[] | null>(null);
  const [venueMsg, setVenueMsg] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const [venue, setVenue] = useState<Venue | null>(null);
  const [date, setDate] = useState(isoDate(now));
  const [hour, setHour] = useState(Math.min(23, now.getHours() + 1));
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [forecastMsg, setForecastMsg] = useState<string | null>(null);

  useEffect(() => {
    locate().then((p) => {
      setPlace(p);
      setPlaceMsg(p ? null : "Couldn’t detect your area. Choose a venue, use your current location, or type the temperature.");
    });
  }, []);

  const target = venue ?? place;
  useEffect(() => {
    if (!target) return setForecast(null);
    let live = true;
    setForecastMsg("Checking the forecast…");
    getForecast(target.lat, target.lon, date, hour).then((r) => {
      if (!live) return;
      setForecast(r.forecast ?? null);
      setForecastMsg(r.message ?? null);
    });
    return () => {
      live = false;
    };
  }, [target, date, hour]);

  const forecastFor = venue ? venue.name : place?.label ?? null;
  useEffect(() => {
    onChange({ place, venue, date, hour, forecast, forecastFor });
    // onChange is a stable callback from the parent (useCallback).
  }, [place, venue, date, hour, forecast]);

  async function search() {
    if (query.trim().length < 2) return;
    setSearching(true);
    setVenueMsg(null);
    const r = await findVenues(query.trim(), place);
    setSearching(false);
    setResults(r.venues ?? []);
    setVenueMsg(r.message ?? (r.venues?.length ? null : "No places found. Try adding the suburb or city."));
  }

  async function usePrecise() {
    setPlaceMsg("Asking your browser…");
    try {
      setPlace(await preciseLocation());
      setPlaceMsg(null);
    } catch (err) {
      setPlaceMsg((err as Error).message);
    }
  }

  const maxDate = isoDate(new Date(now.getTime() + 14 * 86400000));
  const km = venue && place ? Math.round(distanceKm(place, venue)) : null;

  return (
    <div className="space-y-6">
      {/* Where you are */}
      <div>
        <p className="care text-graphite">Where you are</p>
        {place && (
          <p className="mt-1 text-sm">
            {place.label}
            <span className="text-graphite">
              {place.source === "ip" ? " · approximate, from your connection" : " · from your device"}
            </span>
          </p>
        )}
        {placeMsg && <p className="mt-1 text-sm text-graphite">{placeMsg}</p>}
        {place?.source !== "device" && (
          <button type="button" className="btn-quiet mt-1 text-sm" onClick={usePrecise}>
            Use my current location
          </button>
        )}
      </div>

      {/* Venue */}
      <div>
        <label htmlFor="venue" className="care block text-graphite">
          Venue <span className="normal-case tracking-normal">(optional)</span>
        </label>
        {venue ? (
          <div className="mt-1 border-b border-ink pb-2">
            <p className="font-medium">{venue.name}</p>
            <p className="text-sm text-graphite">
              {venue.kind}
              {km !== null && ` · about ${km} km from you`}
            </p>
            <button
              type="button"
              className="btn-quiet mt-1 text-sm"
              onClick={() => {
                setVenue(null);
                setResults(null);
              }}
            >
              Change venue
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-end gap-3">
              <input
                id="venue"
                className="field"
                maxLength={120}
                placeholder="e.g. Sydney Opera House"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    search();
                  }
                }}
              />
              <button type="button" className="btn-quiet shrink-0 pb-1.5 text-sm" onClick={search} disabled={searching}>
                {searching ? "Finding…" : "Find"}
              </button>
            </div>
            {venueMsg && <p className="mt-2 text-sm text-graphite">{venueMsg}</p>}
            {results && results.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-graphite">Choose the right place:</p>
                <ul className="mt-1 divide-y divide-hairline border-y border-hairline">
                  {results.map((v, i) => (
                    <li key={`${v.lat},${v.lon},${i}`}>
                      <button
                        type="button"
                        className="w-full py-2 text-left hover:bg-card"
                        onClick={() => {
                          setVenue(v);
                          setResults(null);
                        }}
                      >
                        <span className="block text-sm font-medium">{v.name}</span>
                        <span className="block truncate text-xs text-graphite">
                          {v.kind} · {v.address}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="mt-1 text-[11px] text-graphite">Places © OpenStreetMap contributors</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* When */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="care block text-graphite">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="field"
            min={isoDate(now)}
            max={maxDate}
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="hour" className="care block text-graphite">
            Time
          </label>
          <select id="hour" className="field" value={hour} onChange={(e) => setHour(Number(e.target.value))}>
            {Array.from({ length: 24 }, (_, h) => (
              <option key={h} value={h}>
                {h === 0 ? "12 am" : h < 12 ? `${h} am` : h === 12 ? "12 pm" : `${h - 12} pm`}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Forecast summary */}
      <div aria-live="polite" className="text-sm">
        {forecast && forecastFor ? (
          <p>
            <span className="care text-graphite">Forecast · </span>
            {forecastFor}, {describeTime(forecast.time)}: <strong className="font-medium">{forecast.temperature_c}°C</strong>
            {forecast.feels_like_c !== forecast.temperature_c && `, feels like ${forecast.feels_like_c}°`}
            {forecast.rain_chance_pct !== null && `, ${forecast.rain_chance_pct}% chance of rain`}, {forecast.conditions}.
            <span className="block text-[11px] text-graphite">Weather data by Open-Meteo.com</span>
          </p>
        ) : (
          forecastMsg && <p className="text-graphite">{forecastMsg}</p>
        )}
      </div>
    </div>
  );
}
