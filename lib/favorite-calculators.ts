export type FavoriteCalculator = {
  id: string;
  title: string;
  specialty: string;
};

export const favoriteCalculatorsStorageKey = "eco-salud-favorite-calculators-v1";
export const favoriteCalculatorsChangedEvent = "eco-salud-favorite-calculators-changed";

function normalizeFavorites(value: unknown): FavoriteCalculator[] {
  if (!Array.isArray(value)) return [];
  const favorites = new Map<string, FavoriteCalculator>();
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || !/^[a-z0-9-]{1,80}$/.test(record.id)) continue;
    if (typeof record.title !== "string" || typeof record.specialty !== "string") continue;
    favorites.set(record.id, {
      id: record.id,
      title: record.title.trim().slice(0, 160),
      specialty: record.specialty.trim().slice(0, 100),
    });
  }
  return [...favorites.values()].slice(0, 100);
}

export function readFavoriteCalculators(): FavoriteCalculator[] {
  if (typeof window === "undefined") return [];
  try {
    const value = window.localStorage.getItem(favoriteCalculatorsStorageKey);
    return value ? normalizeFavorites(JSON.parse(value)) : [];
  } catch {
    return [];
  }
}

export function toggleFavoriteCalculator(calculator: FavoriteCalculator): FavoriteCalculator[] {
  const favorites = readFavoriteCalculators();
  const next = favorites.some((favorite) => favorite.id === calculator.id)
    ? favorites.filter((favorite) => favorite.id !== calculator.id)
    : [...favorites, calculator];
  window.localStorage.setItem(favoriteCalculatorsStorageKey, JSON.stringify(next));
  window.dispatchEvent(new Event(favoriteCalculatorsChangedEvent));
  return next;
}
