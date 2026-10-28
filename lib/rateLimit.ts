// Best-effort daily cap on AI calls. Counters live in memory, so each serverless
// instance keeps its own and they reset on cold start. Cost safety comes from using
// a free-tier Gemini key with no billing; this just stops casual abuse of the link.

const PER_IP = Number(process.env.RATE_LIMIT_PER_IP) || 80;
const GLOBAL = Number(process.env.RATE_LIMIT_GLOBAL) || 200;

interface State {
  day: string;
  global: number;
  byIp: Map<string, number>;
}

// Kept on globalThis so dev hot-reloads don't reset it.
const g = globalThis as typeof globalThis & { __rewearRate?: State };

function state(): State {
  const day = new Date().toISOString().slice(0, 10); // resets at UTC midnight
  if (!g.__rewearRate || g.__rewearRate.day !== day) {
    g.__rewearRate = { day, global: 0, byIp: new Map() };
  }
  return g.__rewearRate;
}

/** Records one call. Returns false if the caller is over a cap. */
export function takeToken(ip: string): boolean {
  const s = state();
  const used = s.byIp.get(ip) ?? 0;
  if (s.global >= GLOBAL || used >= PER_IP) return false;
  s.global += 1;
  s.byIp.set(ip, used + 1);
  return true;
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0].trim() || req.headers.get("x-real-ip") || "unknown";
}
