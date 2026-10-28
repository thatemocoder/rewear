# Rewear

**Plan outfits from clothes you already own, and think twice before buying more.**

Live: **https://rewear-henna.vercel.app** (no login)

Rewear is a small AI-assisted outfit planner. It is a prototype for UNSW INFS5706 *AI in Action*, where the brief is to design and test a clear boundary between what the AI does and what the human keeps.

> The AI does the combinations. The human keeps taste, dress-code judgement and spending decisions.

---

## The problem

Most of us wear a small share of what we own and still feel we have "nothing to wear". That feeling drives repeat purchases of things we already have. Rewear works on both ends:

1. **Plan an outfit:** suggestions built only from your own wardrobe, for an occasion, a temperature and a dress code.
2. **Add items:** photograph clothes and the AI drafts their tags, which you confirm.
3. **Before you buy:** see which things you already own play the same role as something you're considering, and roughly how many new outfits it would really add.

## The human–AI boundary

| | |
|---|---|
| **AI may** | Draft tags (type, colour, formality, warmth, notes) from a photo of one garment. Combine catalogue items into up to 3 outfits with a one-line reason. Show overlap between a possible purchase and the wardrobe, with an estimate of new combinations. |
| **AI must not** | Use items outside the catalogue. Save anything. Recommend buying or not buying, or comment on price. Give body-shape, size, fit or "flattering" advice. Suggest shopping when the wardrobe falls short. |
| **AI hands to the human when** | The dress code is "not sure" or ambiguous, or the occasion is high-stakes (interview, formal event): a **Your call** note says what to check. A photo isn't a single garment: no tags, just the reason. Every purchase check ends with *"This is information, not a recommendation. Your call."* (fixed UI text, not AI-generated). |
| **Human then** | Checks and edits every drafted tag field, and nothing saves without **Save**. Edited fields are marked `· edited`. Chooses which outfit, if any, to wear. Decides whether to buy. |
| **How the user knows AI is involved** | Everything AI-generated carries an oxblood label (**AI suggestion**, **AI tags — check before saving**). Oxblood is used for nothing else. The prompt version is in the footer, a session log lists every AI call, and an About dialog explains it all. |

## How it works

```
Browser (components/, app/*/page.tsx)
  │  catalogue (seed JSON + this browser's additions) and form inputs
  │  photos re-encoded on a canvas first: EXIF/GPS stripped, ≤1024px, never stored
  ▼
/api/plan · /api/tag · /api/buy  (Next.js route handlers)
  └─ lib/runFeature.ts: validate → daily cap → versioned prompt → Gemini → parse
       ├─ lib/prompts.ts   prompts/<feature>_<version>.md, bundled at build time
       ├─ lib/gemini.ts    the only module that calls the API (key is server-side only)
       └─ lib/parse.ts     all AI-response parsing in one place
```

- **Stack:** Next.js (App Router) + TypeScript, Tailwind v4 (design tokens in `app/globals.css`), `@google/genai`. No database, no accounts.
- **Model:** `gemini-3.5-flash-lite`, set in one constant in `lib/gemini.ts`. During the build, `gemini-3.8-flash` returned constant 503 "high demand" errors on the free tier, and `gemini-3.6-flash` allowed only 20 requests a day; Flash-Lite allows about 500. Transient 500/503 errors are retried twice. When Gemini's per-minute limit is hit, the photo queue waits and retries; when the daily quota is used up, the app says when it resets.
- **UI and logic are separate.** Components only render. Everything else is in `lib/` and the API routes, so the front end can be redesigned without touching AI logic.
- **Storage:** the seed catalogue ships as `data/catalogue.json`. Items you add live in your browser's `localStorage`. **Export catalogue (JSON)** downloads the full wardrobe in the seed format, and **Reset to my catalogue** removes your additions.
- **Abuse limit:** a best-effort in-memory daily cap per IP and globally (`RATE_LIMIT_PER_IP`, default 80; `RATE_LIMIT_GLOBAL`, default 200). It's per server instance; cost safety comes from using a free-tier key with no billing attached.

## Evidence features

**Versioned prompts.** Each feature's system prompt is its own file: `prompts/plan_v1.md`, `prompts/tag_v1.md`, `prompts/buy_v1.md`. The active version is set in `prompts/config.json`:

```json
{ "plan": "v1", "tag": "v1", "buy": "v1" }
```

To test a redesign, add `prompts/plan_v2.md` and change `"plan": "v2"`, a one-line change. The build fails if the config points to a file that doesn't exist. The active version shows in the footer (`Prompt: plan v1`) and is recorded with every call.

**Session log.** The footer's **Session log** panel lists every AI call in the current browser tab: timestamp, feature, prompt version, model, status, the inputs (never images) and the AI's raw output, including failures and responses that couldn't be parsed. **Download log as CSV** exports it for the test log. The log stays in `sessionStorage` and is never sent anywhere.

## Run locally

Requires Node 20+ and a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey).

```bash
npm install
cp .env.example .env.local   # then set GEMINI_API_KEY=...
npm run dev                  # http://localhost:3000
```

`npm run build` bundles the prompts and makes a production build.

## Deploy (Vercel)

1. Import the GitHub repo in Vercel. The framework is detected automatically.
2. Add the environment variable `GEMINI_API_KEY` (Production and Preview). Optionally add `RATE_LIMIT_PER_IP` and `RATE_LIMIT_GLOBAL`.
3. Deploy. Every push to `main` redeploys.

## Test results

*To be completed.* Test cases, inputs, expected and actual behaviour, with session-log CSV excerpts.

| # | Feature | Input | Expected | Actual | Pass? |
|---|---|---|---|---|---|
| | | | | | |

## Redesign (before/after)

*To be completed.* What failed in testing, what changed (prompt version, code), and the result.

| Issue found | Before (v1) | Change | After | Evidence |
|---|---|---|---|---|
| | | | | |

---

Student prototype for UNSW INFS5706 *AI in Action*. Uses a third-party AI API (Google Gemini); on the free tier, Google may use submitted content to improve its services. Suggestions can be wrong. AI-assisted build: made with [Claude Code](https://claude.com/claude-code).
