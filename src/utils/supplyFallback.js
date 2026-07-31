/**
 * Customer catalog assembly:
 * - JEC primary lines (STG replaces a JEC line only when marked unavailable)
 * - Changsha gap-fill lines (strengths JEC does not carry)
 * - STG-only SKUs never expand the shop
 */

import {
  normalizeCompoundKey,
  resolveVialUnit,
} from "../data/products";
import { CHANGSHA_VENDOR_ID } from "../data/changshaPremium";
import {
  PRIMARY_VENDOR_ID,
  STG_VENDOR_ID,
} from "../data/stgBackup";

const POLICY_KEY = "wellpept-supply-policy-v1";

export const DEFAULT_SUPPLY_POLICY = {
  /** When false, STG never substitutes (sync can still run). */
  fallbackEnabled: true,
  /** Match keys: `${compoundKey}::${mg}::${unit}` for primary lines that are out. */
  unavailableKeys: [],
  /** Published Google Sheet CSV / export URL (optional). */
  sheetCsvUrl: "",
  lastSyncAt: null,
  lastSyncCount: 0,
  lastSyncError: "",
  shippingFlat: null,
  shippingNote: "",
};

export function offerMatchKey(product) {
  const key = normalizeCompoundKey(product?.name || "");
  const mg = Number(product?.mg);
  const unit = resolveVialUnit(product) || product?.unit || "mg";
  return `${key}::${Number.isFinite(mg) ? mg : 0}::${unit}`;
}

export function loadSupplyPolicy() {
  try {
    const raw = localStorage.getItem(POLICY_KEY);
    if (!raw) return { ...DEFAULT_SUPPLY_POLICY };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SUPPLY_POLICY,
      ...parsed,
      unavailableKeys: Array.isArray(parsed.unavailableKeys)
        ? parsed.unavailableKeys.map(String)
        : [],
    };
  } catch {
    return { ...DEFAULT_SUPPLY_POLICY };
  }
}

export function saveSupplyPolicy(patch) {
  const prev = loadSupplyPolicy();
  const next = {
    ...prev,
    ...patch,
    unavailableKeys: Array.isArray(patch?.unavailableKeys)
      ? patch.unavailableKeys.map(String)
      : prev.unavailableKeys,
  };
  localStorage.setItem(POLICY_KEY, JSON.stringify(next));
  return next;
}

export function isPrimaryUnavailable(product, policy) {
  if (!product) return true;
  if (product.available === false) return true;
  const keys = new Set(policy?.unavailableKeys || []);
  return keys.has(offerMatchKey(product));
}

/**
 * Build the customer-facing product list:
 * - Keep primary (JEC) offers that are available
 * - Replace unavailable primary offers with a matching STG offer (same compound + mg)
 * - Add Changsha offers for strengths JEC does not carry
 * - Never add STG-only lines
 */
export function applySupplyFallback(products, policy = loadSupplyPolicy()) {
  const list = Array.isArray(products) ? products : [];
  const primary = list.filter((p) => p.vendorId === PRIMARY_VENDOR_ID);
  const changsha = list.filter(
    (p) =>
      p.vendorId === CHANGSHA_VENDOR_ID || p.vendorId === "v-changsha-premium"
  );
  const fallback = list.filter((p) => p.vendorId === STG_VENDOR_ID);

  const fallbackByKey = new Map();
  for (const p of fallback) {
    const k = offerMatchKey(p);
    if (!k.startsWith("::")) {
      const prev = fallbackByKey.get(k);
      if (
        !prev ||
        (p.price != null && (prev.price == null || p.price < prev.price))
      ) {
        fallbackByKey.set(k, p);
      }
    }
  }

  const enabled = policy?.fallbackEnabled !== false;
  const out = [];
  const coveredKeys = new Set();

  for (const p of primary) {
    const unavailable = isPrimaryUnavailable(p, policy);
    if (!unavailable) {
      out.push({
        ...p,
        supplyLane: "primary",
        inStock: true,
        vendor: "",
      });
      coveredKeys.add(offerMatchKey(p));
      continue;
    }
    if (!enabled) continue;
    const alt = fallbackByKey.get(offerMatchKey(p));
    if (!alt) continue;

    const shipFlat =
      policy.shippingFlat != null && Number(policy.shippingFlat) > 0
        ? Number(policy.shippingFlat)
        : alt.shippingFlat;
    const shipNote =
      String(policy.shippingNote || "").trim() || alt.shippingNote;

    out.push({
      ...alt,
      name: p.name,
      category: p.category,
      blurb: p.blurb,
      tagline: p.tagline,
      powderColor: p.powderColor || alt.powderColor,
      badge: null,
      featured: false,
      vendor: "",
      supplyLane: "stg-fallback",
      replacedSubmissionId: p.submissionId,
      replacedSku: p.sku,
      shippingFlat: shipFlat,
      shippingNote: shipNote,
      ships:
        "US only · request first · pay after supply check · 2–3 weeks",
      inStock: true,
    });
    coveredKeys.add(offerMatchKey(p));
  }

  // Changsha fills strengths not already covered by live JEC (or STG stand-in).
  const changshaByKey = new Map();
  for (const p of changsha) {
    const k = offerMatchKey(p);
    if (!k || k.startsWith("::") || coveredKeys.has(k)) continue;
    const prev = changshaByKey.get(k);
    if (
      !prev ||
      (p.price != null && (prev.price == null || p.price < prev.price))
    ) {
      changshaByKey.set(k, p);
    }
  }
  for (const p of changshaByKey.values()) {
    out.push({
      ...p,
      supplyLane: "changsha-fill",
      inStock: true,
      vendor: "",
      ships:
        p.ships ||
        "US only · request first · pay after supply check · 2–3 weeks",
    });
    coveredKeys.add(offerMatchKey(p));
  }

  return out;
}

/** Primary focused lines for Admin OOS toggles. */
export function primaryOfferRows(products) {
  return (products || [])
    .filter((p) => p.vendorId === PRIMARY_VENDOR_ID)
    .slice()
    .sort((a, b) => {
      const n = String(a.name).localeCompare(String(b.name));
      if (n !== 0) return n;
      return (Number(a.mg) || 0) - (Number(b.mg) || 0);
    });
}
