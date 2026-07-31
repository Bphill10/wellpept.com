/**
 * Customer catalog assembly (top 25):
 * Warehouse A (JEC) → B (Changsha) → C (ERP)
 * Supplier names never shown — only warehouse labels.
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
import { withWarehouseFields, warehouseRank } from "../data/warehouses";

const POLICY_KEY = "wellpept-supply-policy-v1";

export const DEFAULT_SUPPLY_POLICY = {
  /** When false, backups never substitute OOS primary lines. */
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

function indexByOfferKey(products) {
  const map = new Map();
  for (const p of products || []) {
    const k = offerMatchKey(p);
    if (!k || k.startsWith("::")) continue;
    const prev = map.get(k);
    if (
      !prev ||
      (p.price != null && (prev.price == null || p.price < prev.price))
    ) {
      map.set(k, p);
    }
  }
  return map;
}

function pushFill(out, coveredKeys, product, lane) {
  const k = offerMatchKey(product);
  if (!k || k.startsWith("::") || coveredKeys.has(k)) return;
  out.push(
    withWarehouseFields({
      ...product,
      supplyLane: lane,
      inStock: true,
    })
  );
  coveredKeys.add(k);
}

/**
 * Build the customer-facing product list for the top 25:
 * - Keep available Warehouse A (JEC) offers
 * - OOS A → B match, else C match
 * - Gap-fill remaining strengths: B then C
 * - Sorted A → B → C
 */
export function applySupplyFallback(products, policy = loadSupplyPolicy()) {
  const list = Array.isArray(products) ? products : [];
  const primary = list.filter((p) => p.vendorId === PRIMARY_VENDOR_ID);
  const changsha = list.filter(
    (p) =>
      p.vendorId === CHANGSHA_VENDOR_ID || p.vendorId === "v-changsha-premium"
  );
  const erp = list.filter((p) => p.vendorId === STG_VENDOR_ID);

  const changshaByKey = indexByOfferKey(changsha);
  const erpByKey = indexByOfferKey(erp);

  const enabled = policy?.fallbackEnabled !== false;
  const out = [];
  const coveredKeys = new Set();

  for (const p of primary) {
    const unavailable = isPrimaryUnavailable(p, policy);
    if (!unavailable) {
      out.push(
        withWarehouseFields({
          ...p,
          supplyLane: "warehouse-a",
          inStock: true,
        })
      );
      coveredKeys.add(offerMatchKey(p));
      continue;
    }
    if (!enabled) continue;

    const key = offerMatchKey(p);
    const alt = changshaByKey.get(key) || erpByKey.get(key);
    if (!alt) continue;

    out.push(
      withWarehouseFields({
        ...alt,
        name: p.name,
        category: p.category,
        blurb: p.blurb,
        tagline: p.tagline,
        powderColor: p.powderColor || alt.powderColor,
        badge: null,
        featured: false,
        supplyLane:
          alt.vendorId === STG_VENDOR_ID
            ? "warehouse-c-fallback"
            : "warehouse-b-fallback",
        replacedSubmissionId: p.submissionId,
        replacedSku: p.sku,
        inStock: true,
      })
    );
    coveredKeys.add(key);
  }

  for (const p of changshaByKey.values()) {
    pushFill(out, coveredKeys, p, "warehouse-b");
  }

  for (const p of erpByKey.values()) {
    pushFill(out, coveredKeys, p, "warehouse-c");
  }

  out.sort((a, b) => {
    const wr = warehouseRank(a) - warehouseRank(b);
    if (wr !== 0) return wr;
    const n = String(a.name).localeCompare(String(b.name));
    if (n !== 0) return n;
    return (Number(a.mg) || 0) - (Number(b.mg) || 0);
  });

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
