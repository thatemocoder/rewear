# Changelog

Rewear is deployed as two separate sites so the redesign can be compared before and after:

| Version | URL | Source |
|---|---|---|
| **v1 (before)** | https://rewear-henna.vercel.app | `main` branch, frozen |
| **v2 (after)** | https://rewear-v2.vercel.app | `v2` branch |

## v2 (31 October 2026)

Changes driven by stress-test failures in **Add items** (photo tagging), plus safeguards for related risks.

### 1. Tagging prompt `tag_v1` → `tag_v2` (`prompts/tag_v2.md`, `prompts/config.json`)
| Test failure (v1) | v2 change |
|---|---|
| Brown knit tube dress photographed on a hanger was tagged **Bottom, "textured knit midi skirt"** (wrong type; colour also corrected by the user) | Explicit dress vs bottom rule (straps, neckline, sleeves or bodice means dress, even when hanging). The AI must mark `type` uncertain when it can't see the top edge |
| Card of earrings rejected as "multiple pairs of earrings on a card" | Pairs (shoes, earrings, socks, gloves) and sets sold together count as **one item** |
| Pair of black pumps rejected because part of another shoe showed in the corner | Ignore partial objects at the edges and in the background |
| Shop photo of a model in a floral maxi dress rejected ("person wearing a dress and shoes") | If one garment clearly dominates, or the person gives a hint, tag only that garment and never describe the person |
| Generic notes, e.g. "denim jeans" (the user refined it to "bootleg denim jeans") | Notes should include a cut or silhouette word when visible (2–6 words) |
| No way to know which fields the AI was guessing | New `uncertain` list and `note` in the output |

### 2. Add items UI (`app/add/page.tsx`, `components/TagEditor.tsx`, `components/DotScale.tsx`)
- **"AI unsure · check" flags** on the fields the AI marks as uncertain, plus a summary line ("AI is unsure about: type, colour") and the AI's note about how it read the photo.
- **Human override after a rejection:** "Is it one item? Say which" (a hint such as "the black heels") with **Try again**, or **Tag it myself (no AI)**. The manual option also appears on errors, so a working AI is never required to add an item.
- Manual tags are labelled **"Your tags · no AI involved"** rather than as AI output.
- **Near-duplicate warning** before saving: if an item with the same type, colour and notes exists, the person must confirm with "Save anyway".

### 3. Queue (`lib/tagQueue.ts`)
- **Exact duplicate photos** are detected by a fingerprint of the re-encoded image and skipped **without spending an AI call**. Only earlier photos count, so the first copy is always the one tagged (a bug found in testing and fixed before release).
- Hints are sent with the retry and recorded in the session log.

### 4. Server-side item-ID check (`lib/runFeature.ts`, all AI routes)
- Plan, Hem, Before you buy and In style answers are checked for **item IDs that aren't in the catalogue** (and, for trends, article IDs that aren't in the feed).
- If any are found, Rewear asks the AI **once more** with a correction. Anything still wrong is shown in a "Rewear checked this answer" notice, and those items stay marked "Not in your wardrobe".
- The session log status reads `ok · ID check retried` or `ok · ID warning`, and the raw output includes both attempts.
- This is a preventive safeguard (one of the brief's Phase 2 candidates). It was not triggered by a documented test failure.

### 5. Smaller fixes
- Parser: an unrecognised garment type is no longer silently replaced with "top"; it is defaulted and flagged as uncertain.
- Clearer message for photos the browser can't read (e.g. iPhone HEIC).
- Version label ("Rewear v2") in the footer and on the cover, and a "What changed in v2" list in About.

### Unchanged on purpose
`plan_v2`, `stylist_v1`, `buy_v1` and `trends_v1` prompts, the Save gate (nothing is saved without the person), photo privacy (sent once, never stored on a server), and all labels.

## v1

The original build: Plan an outfit, Add items, Before you buy, with versioned prompts and a session log. Later additions on `main`: Wardrobe tab, Hem, What's in style, forecast and venue, garment visuals, and the cover page.
