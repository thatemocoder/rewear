// Shown in the footer and About dialog so "before" (v1) and "after" (v2) screenshots are distinguishable.
export const APP_VERSION = "v2";

/** User-facing summary of what changed from v1 (full log: CHANGELOG.md). */
export const V2_CHANGES = [
  "Photo tagging counts pairs and sets as one item, ignores background clutter, and tells dresses from skirts more carefully.",
  "The AI flags fields it’s unsure about (“AI unsure · check”) so you know where to look.",
  "If the AI declines a photo, you can point it at the right item or tag it yourself without AI.",
  "Duplicate photos and near-duplicate items are caught before saving.",
  "Rewear checks every AI answer for item IDs that aren’t in your wardrobe, asks again once, and tells you if any remain.",
];
