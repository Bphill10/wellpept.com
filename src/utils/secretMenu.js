/** Secret Undisclosed lab gate — public face is WellPept skincare. */

const STORAGE_KEY = "wellpept-lab-unlocked-v1";

/** Quiet unlock phrases / query values. */
export const LAB_GATE_CODES = new Set([
  "lab",
  "atelier",
  "peptides",
  "wellpept-lab",
  "wp-lab",
  "undisclosed",
  "ud",
]);

export function isLabUnlocked() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setLabUnlocked(unlocked) {
  try {
    if (unlocked) localStorage.setItem(STORAGE_KEY, "1");
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  return Boolean(unlocked);
}

/** Parse ?lab=1 / ?menu=undisclosed / #undisclosed style unlocks. */
export function labUnlockFromUrl(search = "", hash = "") {
  const params = new URLSearchParams(search);
  const candidates = [
    params.get("lab"),
    params.get("menu"),
    params.get("atelier"),
    params.get("gate"),
    params.get("undisclosed"),
    hash.replace(/^#/, ""),
  ]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase());

  for (const value of candidates) {
    if (value === "1" || value === "true" || LAB_GATE_CODES.has(value)) {
      return true;
    }
  }
  return false;
}

/** Strip lab unlock params from the address bar after consuming them. */
export function cleanLabUnlockUrl() {
  try {
    const url = new URL(window.location.href);
    ["lab", "menu", "atelier", "gate", "undisclosed"].forEach((key) =>
      url.searchParams.delete(key)
    );
    if (LAB_GATE_CODES.has(url.hash.replace(/^#/, "").toLowerCase())) {
      url.hash = "";
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* ignore */
  }
}
