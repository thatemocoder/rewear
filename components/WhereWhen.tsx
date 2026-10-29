"use client";

import { useEffect, useState } from "react";
import { describeTime, distanceKm, findVenues, getForecast, isoDate, locate, preciseLocation } from "@/lib/context";
import type { Forecast, Place, Venue } from "@/lib/schemas";
import { Icon, weatherIcon } from "./Icon";

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
      setPlaceMsg(p ? null : "Area unknown.");
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
    <div className="space-y-5">
      {/* Where you are */}
      <div>
        <p className="label">You're in</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {place && (
            <span className="inline-flex items-center gap-1.5">
              <Icon name="pin" className="size-3.5 text-graphite" />
              {place.label}
              <span className="badge" title={place.source === "ip" ? "Approximate, from your connection" : "From your device"}>
                {place.source === "ip" ? "approx." : "device"}
              </span>
            </span>
          )}
          {placeMsg && <span className="text-graphite">{placeMsg}</span>}
          {place?.source !== "device" && (
            <button type="button" className="btn-quiet text-sm" onClick={usePrecise}>
              Use my location
            </button>
          )}
        </div>
      </div>

      {/* Venue */}
      <div>
        <label htmlFor="venue" className="label">
          Venue <span className="opt">(optional)</span>
        </label>
        {venue ? (
          <div className="mt-1 border-b border-ink pb-2">
            <p className="font-medium">{venue.name}</p>
            <p className="text-sm text-graphite">
              {venue.kind}
              {km !== null && ` · ${km} km away`}
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
              <button
                type="button"
                className="btn-ghost shrink-0 border-hairline"
                onClick={search}
                disabled={searching}
                aria-label="Find venue"
              >
                <Icon name="search" className="size-3.5" />
                {searching ? "Finding…" : "Find"}
              </button>
            </div>
            {venueMsg && <p className="mt-2 text-sm text-graphite">{venueMsg}</p>}
            {results && results.length > 0 && (
              <div className="mt-2">
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
          <label htmlFor="date" className="label">
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
          <label htmlFor="hour" className="label">
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

      {/* Forecast card */}
      <div aria-live="polite">
        {forecast && forecastFor ? (
          <div className="rise flex items-center gap-4 rounded-lg border border-hairline bg-card px-4 py-3">
            <Icon name={weatherIcon(forecast.conditions)} className="size-9 text-ink" label={forecast.conditions} />
            <div className="min-w-0 flex-1">
              <p className="flex items-baseline gap-2">
                <span className="font-serif text-3xl leading-none">{forecast.temperature_c}°</span>
                {forecast.feels_like_c !== forecast.temperature_c && (
                  <span className="text-xs text-graphite">feels {forecast.feels_like_c}°</span>
                )}
              </p>
              <p className="mt-1 truncate text-xs text-graphite">
                {forecast.conditions}
                {forecast.rain_chance_pct !== null && ` · ${forecast.rain_chance_pct}% rain`} · {describeTime(forecast.time)}
              </p>
              <p className="truncate text-xs text-graphite">{forecastFor}</p>
            </div>
          </div>
        ) : (
          forecastMsg && <p className="text-sm text-graphite">{forecastMsg}</p>
        )}
        {forecast && <p className="mt-1 text-right text-[10px] text-graphite">Weather data by Open-Meteo.com</p>}
      </div>
    </div>
  );
}
