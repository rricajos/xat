import { browser } from "$app/environment";

const STORAGE_KEY = "xat-dark-mode";

export function getDarkMode(): boolean {
  if (!browser) return false;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored !== null) return stored === "true";

  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function setDarkMode(enabled: boolean): void {
  if (!browser) return;

  localStorage.setItem(STORAGE_KEY, String(enabled));
  applyDarkMode(enabled);
}

export function toggleDarkMode(): boolean {
  const next = !getDarkMode();
  setDarkMode(next);
  return next;
}

export function applyDarkMode(enabled: boolean): void {
  if (!browser) return;

  if (enabled) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

export function initDarkMode(): void {
  if (!browser) return;
  applyDarkMode(getDarkMode());
}
