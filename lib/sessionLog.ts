// Every AI call in this browser session, for the test log. Kept in memory and mirrored
// to sessionStorage (cleared when the tab closes). Never sent anywhere. No images.
import { useSyncExternalStore } from "react";
import { downloadFile, stamp } from "./download";
import type { Feature } from "./schemas";

export interface LogEntry {
  id: string;
  timestamp: string; // ISO
  feature: Feature;
  promptVersion: string;
  model: string; // empty if the request never reached the AI
  status: string; // "ok" or an error code
  inputs: Record<string, string | number>;
  output: string; // the AI's raw output, or the error message when there is none
}

const KEY = "rewear.log.v1";
const EMPTY: LogEntry[] = [];
let entries: LogEntry[] | null = null;
const listeners = new Set<() => void>();

function init(): LogEntry[] {
  if (entries) return entries;
  entries = [];
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (raw) entries = JSON.parse(raw);
  } catch {
    /* storage unavailable: memory only */
  }
  return entries!;
}

function commit(next: LogEntry[]) {
  entries = next;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* memory only */
  }
  listeners.forEach((l) => l());
}

export function useSessionLog(): LogEntry[] {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    init,
    () => EMPTY,
  );
}

export function logCall(e: Omit<LogEntry, "id" | "timestamp">) {
  const now = new Date();
  commit([...init(), { id: `${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`, timestamp: now.toISOString(), ...e }]);
}

export function clearLog() {
  commit([]);
}

const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

export function toCsv(list: LogEntry[]): string {
  const header = ["timestamp", "feature", "prompt_version", "model", "status", "inputs", "ai_raw_output"];
  const rows = list.map((e) =>
    [e.timestamp, e.feature, e.promptVersion, e.model, e.status, JSON.stringify(e.inputs), e.output].map((v) => csvCell(String(v))),
  );
  return [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

export function downloadCsv(list: LogEntry[]) {
  // Leading BOM so Excel opens the UTF-8 CSV correctly.
  downloadFile(`rewear-session-log-${stamp()}.csv`, String.fromCharCode(0xfeff) + toCsv(list), "text/csv;charset=utf-8");
}
