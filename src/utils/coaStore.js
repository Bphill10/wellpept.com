/** Per-product COA URLs stored from the product selection page. */

const STORAGE_KEY = "wellpept-coa-v1";

function readMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeMap(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getCoaUrl(productId) {
  if (!productId) return "";
  const entry = readMap()[productId];
  if (!entry) return "";
  return String(entry.url || "").trim();
}

export function getCoaMeta(productId) {
  if (!productId) return null;
  const entry = readMap()[productId];
  if (!entry?.url) return null;
  return {
    url: String(entry.url),
    name: entry.name || "Certificate of Analysis",
    updatedAt: entry.updatedAt || null,
  };
}

export function setCoaUrl(productId, url, name = "Certificate of Analysis") {
  if (!productId) return "";
  const map = readMap();
  const cleaned = String(url || "").trim();
  if (!cleaned) {
    delete map[productId];
    writeMap(map);
    return "";
  }
  map[productId] = {
    url: cleaned,
    name: String(name || "Certificate of Analysis"),
    updatedAt: new Date().toISOString(),
  };
  writeMap(map);
  return cleaned;
}

export function clearCoaUrl(productId) {
  return setCoaUrl(productId, "");
}

/** Prefer product COA, then local store, then optional fallback, then site. */
export function resolveCoaQrPayload({
  productId = "",
  coaUrl = "",
  fallback = "",
} = {}) {
  const site = "https://www.wellpept.com";
  const fromProduct = String(coaUrl || "").trim();
  if (fromProduct) return fromProduct;
  const stored = getCoaUrl(productId);
  if (stored) return stored;
  const fromFallback = String(fallback || "").trim();
  if (
    fromFallback &&
    !/^https?:\/\/(www\.)?wellpept\.com\/?$/i.test(fromFallback)
  ) {
    return fromFallback;
  }
  if (fromFallback) return fromFallback;
  return site;
}
