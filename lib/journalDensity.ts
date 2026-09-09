export type JournalDensity = "default" | "cards";

const LS_KEY = "tj-journal-density";

export function getStoredDensity(): JournalDensity {
  if (typeof window === "undefined") return "default";
  return (localStorage.getItem(LS_KEY) as JournalDensity) ?? "default";
}

export function setStoredDensity(density: JournalDensity) {
  localStorage.setItem(LS_KEY, density);
  window.dispatchEvent(new CustomEvent("tj-density-change", { detail: density }));
}
