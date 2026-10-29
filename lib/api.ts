// Client-side caller for the AI routes. Every call (success or failure) is written
// to the session log here, so UI components don't have to remember to.
import { PROMPT_CONFIG } from "./prompts.config";
import type { ApiResponse, BuyResult, Feature, PlanResult, StylistResult, TagResult, TrendsResult } from "./schemas";
import { logCall } from "./sessionLog";

type ResultFor = { plan: PlanResult; tag: TagResult; buy: BuyResult; stylist: StylistResult; trends: TrendsResult };

export async function callAI<F extends Feature>(
  feature: F,
  body: unknown,
  logInputs: Record<string, string | number>,
): Promise<ApiResponse<ResultFor[F]>> {
  let res: ApiResponse<ResultFor[F]>;
  try {
    const r = await fetch(`/api/${feature}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    res = await r.json();
  } catch {
    res = { ok: false, error: "ai_error", message: "Couldn't reach Rewear's server. Check your connection and try again." };
  }

  // Show the daily-quota reset time in the viewer's own time zone.
  if (!res.ok && res.error === "quota_daily" && res.resetAt) {
    const at = new Date(res.resetAt).toLocaleString([], { weekday: "short", hour: "numeric", minute: "2-digit" });
    res = { ...res, message: `${res.message.replace(/\.$/, "")} (${at} your time).` };
  }

  logCall({
    feature,
    promptVersion: res.promptVersion ?? PROMPT_CONFIG[feature],
    model: res.model ?? "",
    status: res.ok ? "ok" : res.error,
    inputs: logInputs,
    output: res.raw ?? (res.ok ? "" : res.message),
  });
  return res;
}
