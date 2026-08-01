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

function normalizePath(pathname = "") {
  const path = String(pathname || "").trim().toLowerCase();
  if (!path || path === "/") return "/";
  return path.replace(/\/+$/, "") || "/";
}

/** True when the URL path is the Undisclosed entry route. */
export function labUnlockFromPath(pathname = "") {
  const path = normalizePath(pathname);
  if (path === "/undisclosed" || path === "/lab") return true;
  const segment = path.split("/").filter(Boolean).pop() || "";
  return LAB_GATE_CODES.has(segment);
}

/** Parse /undisclosed, ?lab=1, ?menu=undisclosed, #undisclosed style unlocks. */
export function labUnlockFromUrl(search = "", hash = "", pathname = "") {
  if (labUnlockFromPath(pathname)) return true;

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

/** Strip one-time query/hash unlocks. Do not rewrite `/` → `/undisclosed`
 *  (that made every refresh land on Undisclosed). Intentional visits to
 *  `/undisclosed` keep that path. */
export function cleanLabUnlockUrl({ promotePath = false } = {}) {
  try {
    const url = new URL(window.location.href);
    ["lab", "menu", "atelier", "gate", "undisclosed"].forEach((key) =>
      url.searchParams.delete(key)
    );
    if (LAB_GATE_CODES.has(url.hash.replace(/^#/, "").toLowerCase())) {
      url.hash = "";
    }
    // promotePath kept for rare callers that explicitly want a shareable lab URL.
    if (promotePath && normalizePath(url.pathname) === "/") {
      url.pathname = "/undisclosed";
    }
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  } catch {
    /* ignore */
  }
}

/** Return to the public skincare URL when exiting Undisclosed. */
export function cleanPublicEntryUrl() {
  try {
    const url = new URL(window.location.href);
    url.pathname = "/";
    url.hash = "";
    window.history.replaceState({}, "", `${url.pathname}${url.search}`);
  } catch {
    /* ignore */
  }
}
