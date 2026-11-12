import type { FavoriteCalculator } from "./favorite-calculators";

export const recentCalculatorsStorageKey = "eco-salud-recent-calculators-v1";
export const recentCalculatorsChangedEvent = "eco-salud-recent-calculators-changed";
const maxRecentCalculators = 8;

function normalize(value: unknown): FavoriteCalculator[] {
  if (!Array.isArray(value)) return [];
  const unique = new Map<string, FavoriteCalculator>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || !/^[a-z0-9-]{1,80}$/.test(record.id)) continue;
    if (typeof record.title !== "string" || typeof record.specialty !== "string") continue;
    const entry = { id: record.id, title: record.title.trim().slice(0, 160), specialty: record.specialty.trim().slice(0, 100) };
    unique.set(entry.id + "::" + entry.specialty, entry);
  }
  return [...unique.values()].slice(0, maxRecentCalculators);
}

export function readRecentCalculators(): FavoriteCalculator[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(recentCalculatorsStorageKey);
    return stored ? normalize(JSON.parse(stored)) : [];
  } catch {
    return [];
  }
}

export function recordRecentCalculator(calculator: FavoriteCalculator): FavoriteCalculator[] {
  const next = [calculator, ...readRecentCalculators().filter((item) => item.id !== calculator.id || item.specialty !== calculator.specialty)].slice(0, maxRecentCalculators);
  try {
    window.localStorage.setItem(recentCalculatorsStorageKey, JSON.stringify(next));
    window.dispatchEvent(new Event(recentCalculatorsChangedEvent));
  } catch {
    return readRecentCalculators();
  }
  return next;
}
