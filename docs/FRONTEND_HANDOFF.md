# Front-end handoff (for a Replit rebuild)

This file is the contract for anyone rebuilding Rewear's UI, whether a person or Replit Agent. The backend, prompts and client logic already work; **only the presentation layer should change.** Rewear is marked on how clearly the human–AI boundary is designed, so the "Must keep" list below is not optional styling.

---

## 1. What to change, what to leave alone

| Change freely | Do not modify |
|---|---|
| `components/*` | `app/api/**` (all API routes) |
| `app/page.tsx`, `app/add/page.tsx`, `app/buy/page.tsx`, `app/wardrobe/page.tsx`, `app/style/page.tsx` | `lib/**` (all logic, see §3) |
| `app/layout.tsx`, `app/globals.css` (design tokens) | `prompts/**`, `scripts/build-prompts.mjs` |
| Fonts, colours, layout, motion, copy *tone* | `data/catalogue.json` (the owner replaces it) |
| | `package.json` scripts (`prebuild` bundles the prompts) |

Rules of thumb:
- Components may **call** `lib/` functions and hooks; they must not reimplement them or call `fetch("/api/...")` directly. Use `callAI()` (it writes the session log).
- Keep it Next.js App Router + TypeScript. Tailwind v4 is set up; replacing it is fine as long as `npm run build` passes.
- Never add a database, accounts, analytics or third-party scripts.
- Never read `process.env.GEMINI_API_KEY` or import `lib/gemini.ts` from a component.

---

## 2. Must keep (assessment requirements)

**Transparency labels**
- Every AI-produced block shows a visible label: **"AI suggestion"** (outfits, purchase checks), **"AI tags — check before saving"** (draft tags), **"AI stylist"** (Hem), **"AI summary of fashion media"** (trends). Use one reserved accent colour for AI content only (currently oxblood `#6b2525`).
- A **"Your call"** note is shown prominently whenever a result has `your_call` (plan, Hem).
- After every purchase check, show this **fixed UI text (not from the AI)**: *"This is information, not a recommendation. Your call."*
- Header subtitle: *"AI-assisted outfit planner — suggestions only. You make the final call."*
- The footer shows the prompt version(s) for the current page (`PROMPT_CONFIG` from `lib/prompts.config.ts`) and a **Session log** panel (see below).
- An **About** dialog covering: what the AI does, what it must not do, when it hands over, how you can tell the AI is involved, data use, and the student-prototype / third-party-API note. Reuse the current content in `components/AboutDialog.tsx`.

**Human control**
- Add items: nothing is saved until the person presses **Save**. Every tag field is editable, and fields changed from the AI draft are marked **"· edited"**. A rejected photo shows the AI's reason with no tags.
- Plan: the temperature is filled from the forecast but stays an editable input; once the person types, their number wins (with a "Use forecast" option). The venue is chosen by the person from search results.
- AI-referenced item IDs that aren't in the catalogue must stay visible (currently a hatched "Not in your wardrobe" card), not be hidden or silently fixed.
- Hem is labelled as an AI persona ("Hem is Rewear's AI stylist, not a person").

**Session log (evidence)**
- A collapsible panel listing every AI call in this tab, from `useSessionLog()`: time, feature, prompt version, model, status, inputs, raw output. Include **"Download log as CSV"** (`downloadCsv(log)`) and Clear (`clearLog()`).

**Privacy copy and attribution**
- Photo note on Add items: photos are re-encoded in the browser (location data removed), sent once to draft tags, never stored on a server; an optional small copy can be kept on this device (checkbox beside Save).
- Show **"Places © OpenStreetMap contributors"** with venue results and **"Weather data by Open-Meteo.com"** with forecasts.
- Trends page: link every trend to its source articles and name the publishers. No shopping links anywhere in the app.

**Quality**
- WCAG AA contrast, visible focus states, real `<label>`s, full keyboard use, and works at 390px width with no horizontal page scroll.
- No chat bubbles, purple gradients, glassmorphism or emoji icons (original design direction: an editorial lookbook, not a SaaS dashboard).

---

## 3. Client logic to reuse (`lib/`)

| Import | What it gives the UI |
|---|---|
| `callAI(feature, body, logInputs)` from `lib/api` | Calls `/api/<feature>`, returns the envelope (§4), **logs the call**. `logInputs` = what to show in the log (text only, never images). |
| `useCatalogue()`, `addItem`, `updateItem`, `removeItem`, `nextItemId`, `exportCatalogueJson`, `resetCatalogue`, `localChangeCount`, `addedCount`, `isAddedHere`, `isEditedHere`, `isStorageAvailable` from `lib/catalogue` | The wardrobe (seed + this browser's changes). |
| `useTagQueue()`, `enqueue(files)`, `editEntry`, `saveEntry(key, { keepPhoto })`, `discardEntry`, `retryEntry`, `clearFinished`, `isReviewable`, `isOpen`, `MAX_QUEUE` from `lib/tagQueue` | Multi-photo tagging queue (handles AI limits, waits and retries). |
| `usePhotos()`, `savePhoto`, `deletePhoto`, `getKeepPhotosPref`, `setKeepPhotosPref` from `lib/photos` | On-device item photos (IndexedDB). |
| `prepareImage(file)` from `lib/image` | Re-encodes/downscales a photo (strips EXIF). Use before any upload. |
| `locate`, `preciseLocation`, `findVenues`, `getForecast`, `distanceKm`, `describeTime`, `isoDate` from `lib/context` | Area, venue search, forecast. |
| `useSessionLog`, `downloadCsv`, `clearLog` from `lib/sessionLog` | Session log. |
| `PROMPT_CONFIG` from `lib/prompts.config` | Active prompt versions for the footer. |
| `revealOnSmallScreens(el)` from `lib/reveal` | Scrolls results into view on phones. |
| Types from `lib/schemas` | All request/response shapes. |

Existing components worth keeping or restyling rather than rewriting the logic: `WhereWhen` (location/venue/time/forecast state), `StylistNotes` (Hem conversation state), `TagEditor`/`DotScale` (accessible 1–5 scales), `GarmentArt`/`GarmentCard` (silhouettes and photos).

---

## 4. API contract

All AI routes: `POST`, JSON body, and this response envelope:

```ts
{ ok: true,  data: T, raw: string, promptVersion: string, model: string }
{ ok: false, error: "bad_request" | "rate_limited" | "ai_busy" | "quota_daily" | "ai_error" | "parse_failed" | "not_configured",
  message: string,            // friendly, show it as-is
  raw?: string, promptVersion?: string, model?: string,
  retryAfterSec?: number,     // ai_busy
  resetAt?: string }          // quota_daily (ISO)
```

| Route | Body | `data` |
|---|---|---|
| `/api/plan` | `PlanRequest`: `catalogue`, `occasion`, `temperature_c`, `dress_code`, `dress_code_notes`, optional `when`, `location`, `venue {name, kind, distance_km}`, `weather {source: "forecast"\|"typed", feels_like_c, rain_chance_pct, conditions}` | `PlanResult`: `outfits [{ items: [{item_id, description}], reason }]`, `your_call`, `message` |
| `/api/stylist` | `catalogue`, `request` (PlanRequest without catalogue), `plan` (PlanResult), `conversation [{role: "person"\|"hem", text}]` (last turn = person) | `StylistResult`: `reply`, `outfits`, `your_call` |
| `/api/tag` | `image {mimeType, data}` (base64 from `prepareImage`) | `TagResult`: `{ok: true, tags {type, colour, formality, warmth, notes}}` or `{ok: false, reason}` |
| `/api/buy` | `catalogue`, `considering`, optional `image` | `BuyResult`: `considered_item`, `same_role [{item_id, description}]`, `new_combinations` (number or null), `estimate_explanation` |
| `/api/trends` | `catalogue` | `TrendsResult`: `as_of`, `trends [{name, summary, brands, source_ids, with_your_wardrobe, item_ids}]`, `articles [{id, source, title, url, date}]` (map `source_ids` → `articles`) |

Non-AI routes (`GET`): `/api/locate` → `{ok, place}`; `/api/venue?q=&lat=&lon=` → `{ok, venues | message}`; `/api/forecast?lat=&lon=&date=YYYY-MM-DD&hour=0-23` → `{ok, forecast | message}`. Prefer the `lib/context` wrappers.

Item IDs are a type prefix plus 2 digits (`T` top, `B` bottom, `D` dress, `O` outerwear, `S` shoes, `A` accessory). Use a font where `O` and `0` look different (currently JetBrains Mono).

---

## 5. Browser storage (keep these keys and formats)

| Key | Where | Contents |
|---|---|---|
| `rewear.added.v1` | localStorage | Items added in this browser (catalogue item array). **The owner has real data here; never rename or reformat.** |
| `rewear.edits.v1` | localStorage | `{ overrides, removed }` for shipped items |
| `rewear.keepPhotos.v1` | localStorage | "1"/"0" keep-photo preference |
| `rewear.trends.v1` | localStorage | 12-hour trends cache |
| `rewear.log.v1` | sessionStorage | Session log |
| `rewear` / `photos` | IndexedDB | On-device photo thumbnails keyed by item ID |

---

## 6. Before merging a redesign

1. `npm run build` passes.
2. Walk the §2 checklist on every page, at 1366px and 390px, keyboard only.
3. Run one plan and check the session log shows it with the prompt version and model.
4. Confirm existing wardrobe items still appear (localStorage untouched).
