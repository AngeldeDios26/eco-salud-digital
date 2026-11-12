export const libraryStateChangedEvent = "eco-salud-library-state-changed";
const recentKey = "eco-salud-library-recent-v1";
const favoriteKey = "eco-salud-library-favorites-v1";
const maxRecent = 6;

function readList(key: string, limit: number): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(value)) return [];
    return [...new Set(value.filter((item): item is string => typeof item === "string" && item.startsWith("https://") && item.length <= 2000))].slice(0, limit);
  } catch {
    return [];
  }
}

export function readRecentLibraryItems() { return readList(recentKey, maxRecent); }
export function readFavoriteLibraryItems() { return readList(favoriteKey, 50); }

export function recordRecentLibraryItem(url: string) {
  const next = [url, ...readRecentLibraryItems().filter((item) => item !== url)].slice(0, maxRecent);
  try {
    window.localStorage.setItem(recentKey, JSON.stringify(next));
    window.dispatchEvent(new Event(libraryStateChangedEvent));
  } catch {
    return readRecentLibraryItems();
  }
  return next;
}

export function toggleFavoriteLibraryItem(url: string) {
  const current = readFavoriteLibraryItems();
  const next = current.includes(url) ? current.filter((item) => item !== url) : [url, ...current].slice(0, 50);
  try {
    window.localStorage.setItem(favoriteKey, JSON.stringify(next));
    window.dispatchEvent(new Event(libraryStateChangedEvent));
  } catch {
    return readFavoriteLibraryItems();
  }
  return next;
}
