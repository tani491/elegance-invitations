export const THEME_SYNC_EVENT = "elegance:themes-updated";
export const THEME_SYNC_STORAGE_KEY = "elegance:themes-updated-at";

export function notifyThemeCatalogChanged() {
  if (typeof window === "undefined") return;

  const timestamp = String(Date.now());
  window.localStorage.setItem(THEME_SYNC_STORAGE_KEY, timestamp);
  window.dispatchEvent(new CustomEvent(THEME_SYNC_EVENT, { detail: timestamp }));
}

export function subscribeThemeCatalogChanges(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const handleCustomEvent = () => callback();
  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_SYNC_STORAGE_KEY) callback();
  };

  window.addEventListener(THEME_SYNC_EVENT, handleCustomEvent);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(THEME_SYNC_EVENT, handleCustomEvent);
    window.removeEventListener("storage", handleStorage);
  };
}
