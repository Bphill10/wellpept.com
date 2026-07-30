/**
 * Pull STG price list + shipping notes into the silent backup vendor.
 * Supports published Google Sheet CSV URLs, direct CSV URLs, or parsed file lines.
 */

import { guessCategory } from "../data/products";
import { STG_VENDOR, STG_VENDOR_ID } from "../data/stgBackup";
import { parsePriceListText } from "./parsePriceList";
import { saveSupplyPolicy } from "./supplyFallback";

const STG_CACHE_KEY = "wellpept-stg-submissions-v1";

/** Only allow Google / common spreadsheet hosts for remote pull. */
export function isAllowedSheetUrl(url) {
  try {
    const u = new URL(String(url || "").trim());
    if (u.protocol !== "https:") return false;
    const host = u.hostname.toLowerCase();
    return (
      host === "docs.google.com" ||
      host === "spreadsheets.google.com" ||
      host.endsWith(".googleusercontent.com") ||
      host === "raw.githubusercontent.com"
    );
  } catch {
    return false;
  }
}

/** Turn a Google Sheets edit/view link into a CSV export when possible. */
export function toSheetCsvUrl(url) {
  const raw = String(url || "").trim();
  if (!raw) return "";
  try {
    const u = new URL(raw);
    const m = u.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
    if (m) {
      const id = m[1];
      const gid =
        u.searchParams.get("gid") ||
        (u.hash.match(/gid=(\d+)/) || [])[1] ||
        "0";
      return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
    }
  } catch {
    /* keep raw */
  }
  return raw;
}

function extractShippingHints(text) {
  const t = String(text || "");
  let shippingFlat = null;
  let shippingNote = "";

  const flat =
    t.match(/shipping[^$\d]{0,24}\$?\s*(\d+(?:\.\d+)?)/i) ||
    t.match(/\$\s*(\d+(?:\.\d+)?)\s*(?:ship|shipping|freight)/i);
  if (flat) shippingFlat = Number(flat[1]);

  const weeks = t.match(/(\d\s*[–\-]\s*\d|\d+)\s*weeks?/i);
  const days = t.match(/(\d\s*[–\-]\s*\d|\d+)\s*days?/i);
  const bits = [];
  if (weeks) bits.push(`${weeks[1].replace(/\s+/g, "")} weeks`);
  if (days) bits.push(`${days[1].replace(/\s+/g, "")} days`);
  if (bits.length) {
    shippingNote = `US shipping only · ${bits.join(" · ")} (from STG sheet)`;
  } else if (/ship/i.test(t.slice(0, 2000))) {
    const line = t
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find((l) => /ship|delivery|transit/i.test(l) && l.length < 180);
    if (line) shippingNote = line;
  }

  return { shippingFlat, shippingNote };
}

export function linesToStgSubmissions(lines, meta = {}) {
  const now = new Date().toISOString();
  const source = meta.source || STG_VENDOR.priceListSource;
  return (lines || [])
    .filter((line) => line?.name && Number(line.vendorCost) > 0)
    .map((line, index) => {
      const mg = Number(line.mg);
      const sku =
        String(line.sku || "").trim() ||
        `STG-${String(line.name)
          .toUpperCase()
          .replace(/[^A-Z0-9]+/g, "-")
          .slice(0, 16)}-${Number.isFinite(mg) ? mg : index}`;
      return {
        id: `s-stg-${sku}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
        vendorId: STG_VENDOR_ID,
        sku,
        name: String(line.name).trim(),
        form: line.form || "Lyophilized vial · kit of 10",
        purity: line.purity || "≥98%",
        mg: Number.isFinite(mg) ? mg : 0,
        unit: line.unit || "mg",
        vendorCost: Number(line.vendorCost),
        category: line.category || guessCategory(line.name),
        packVials: Number(line.packVials) || 10,
        vialMl: line.vialMl,
        status: "approved",
        submittedAt: now,
        reviewedAt: now,
        priceListSource: source,
        externalOnly: false,
      };
    });
}

export function loadCachedStgSubmissions() {
  try {
    const raw = localStorage.getItem(STG_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCachedStgSubmissions(submissions) {
  const list = Array.isArray(submissions) ? submissions : [];
  localStorage.setItem(STG_CACHE_KEY, JSON.stringify(list));
  return list;
}

/**
 * Fetch sheet text via same-origin proxy (avoids browser CORS),
 * falling back to direct fetch for allowed hosts.
 */
export async function fetchSheetCsvText(url) {
  const csvUrl = toSheetCsvUrl(url);
  if (!csvUrl || !isAllowedSheetUrl(csvUrl)) {
    throw new Error(
      "Use a published Google Sheet link (File → Share → Anyone with the link, or Publish to web → CSV)."
    );
  }

  const proxy = `/api/stg-sheet?url=${encodeURIComponent(csvUrl)}`;
  let res = await fetch(proxy, { credentials: "same-origin" });
  if (!res.ok) {
    // Local/dev without API: try direct
    res = await fetch(csvUrl);
  }
  if (!res.ok) {
    throw new Error(`Sheet fetch failed (${res.status}). Check the link is public.`);
  }
  const text = await res.text();
  if (!text.trim()) throw new Error("Sheet was empty");
  return { text, csvUrl };
}

export async function syncStgFromSheetUrl(url, { applyShipping = true } = {}) {
  const { text, csvUrl } = await fetchSheetCsvText(url);
  const parsed = await parsePriceListText(text);
  const submissions = linesToStgSubmissions(parsed.lines, {
    source: csvUrl,
  });
  saveCachedStgSubmissions(submissions);

  const hints = extractShippingHints(text);
  const policyPatch = {
    sheetCsvUrl: String(url || "").trim(),
    lastSyncAt: new Date().toISOString(),
    lastSyncCount: submissions.length,
    lastSyncError: "",
  };
  if (applyShipping) {
    if (hints.shippingFlat != null) policyPatch.shippingFlat = hints.shippingFlat;
    if (hints.shippingNote) policyPatch.shippingNote = hints.shippingNote;
  }
  const policy = saveSupplyPolicy(policyPatch);

  return { submissions, policy, hints, count: submissions.length };
}

export async function syncStgFromParsedLines(lines, meta = {}) {
  const submissions = linesToStgSubmissions(lines, meta);
  saveCachedStgSubmissions(submissions);
  const policy = saveSupplyPolicy({
    lastSyncAt: new Date().toISOString(),
    lastSyncCount: submissions.length,
    lastSyncError: "",
    ...(meta.shippingFlat != null ? { shippingFlat: meta.shippingFlat } : {}),
    ...(meta.shippingNote ? { shippingNote: meta.shippingNote } : {}),
  });
  return { submissions, policy, count: submissions.length };
}

export function stgVendorWithPolicy(policy) {
  return {
    ...STG_VENDOR,
    shippingFlat:
      policy?.shippingFlat != null && Number(policy.shippingFlat) > 0
        ? Number(policy.shippingFlat)
        : STG_VENDOR.shippingFlat,
    shippingNote:
      String(policy?.shippingNote || "").trim() || STG_VENDOR.shippingNote,
    priceListSource: policy?.sheetCsvUrl || STG_VENDOR.priceListSource,
  };
}
