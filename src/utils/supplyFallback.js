/**
 * Customer catalog assembly (focused set):
 * Warehouse A (JEC) → Warehouse B gap-fill (Changsha, then ERP)
 * Ownership is by compound name only (not strength).
 * Supplier names never shown — only warehouse labels.
 */

import { normalizeCompoundKey } from "../data/products";
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
  /**
   * Per-strength OOS flags for Warehouse A lines:
   * `${compoundKey}::${mg}::${unit}`
   * If every A strength of a compound is flagged, B takes the compound.
   */
  unavailableKeys: [],
  /** Published Google Sheet CSV / export URL (optional). */
  sheetCsvUrl: "",
  lastSyncAt: null,
  lastSyncCount: 0,
  lastSyncError: "",
  shippingFlat: null,
  shippingNote: "",
};

/** Per-kit key (admin OOS toggles). */
export function offerMatchKey(product) {
  const key = normalizeCompoundKey(product?.name || "");
  const mg = Number(product?.mg);
  const unit = product?.unit || "mg";
  return `${key}::${Number.isFinite(mg) ? mg : 0}::${unit}`;
}

/** Warehouse ownership key — compound only. */
export function compoundMatchKey(product) {
  return normalizeCompoundKey(product?.name || "");
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

function indexByCompound(products) {
  const map = new Map();
  for (const p of products || []) {
    const k = compoundMatchKey(p);
    if (!k) continue;
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(p);
  }
  return map;
}

function pushCompound(out, coveredCompounds, compound, products, lane) {
  if (!compound || coveredCompounds.has(compound)) return;
  const lines = products || [];
  if (!lines.length) return;
  for (const product of lines) {
    out.push(
      withWarehouseFields({
        ...product,
        supplyLane: lane,
        inStock: true,
      })
    );
  }
  coveredCompounds.add(compound);
}

/**
 * Build the customer-facing product list:
 * - Warehouse A owns a compound if it has any in-stock strength
 * - Else Warehouse B (Changsha first, then ERP)
 * - Sorted A → B
 */
export function applySupplyFallback(products, policy = loadSupplyPolicy()) {
  const list = Array.isArray(products) ? products : [];
  const primary = list.filter((p) => p.vendorId === PRIMARY_VENDOR_ID);
  const changsha = list.filter(
    (p) =>
      p.vendorId === CHANGSHA_VENDOR_ID || p.vendorId === "v-changsha-premium"
  );
  const erp = list.filter((p) => p.vendorId === STG_VENDOR_ID);

  const primaryByCompound = indexByCompound(primary);
  const changshaByCompound = indexByCompound(changsha);
  const erpByCompound = indexByCompound(erp);

  const enabled = policy?.fallbackEnabled !== false;
  const out = [];
  const coveredCompounds = new Set();

  for (const [compound, aLines] of primaryByCompound) {
    const available = aLines.filter((p) => !isPrimaryUnavailable(p, policy));
    if (available.length) {
      for (const p of available) {
        out.push(
          withWarehouseFields({
            ...p,
            supplyLane: "warehouse-a",
            inStock: true,
          })
        );
      }
      coveredCompounds.add(compound);
      continue;
    }

    // Every A strength for this compound is OOS → whole compound to B, else C
    if (!enabled) continue;
    const fromB = changshaByCompound.get(compound) || [];
    const fromC = erpByCompound.get(compound) || [];
    const fill = fromB.length ? fromB : fromC;
    const lane = fromB.length
      ? "warehouse-b-fallback"
      : "warehouse-b-erp-fallback";
    for (const alt of fill) {
      const sample = aLines[0];
      out.push(
        withWarehouseFields({
          ...alt,
          name: sample?.name || alt.name,
          category: sample?.category || alt.category,
          blurb: sample?.blurb || alt.blurb,
          tagline: sample?.tagline || alt.tagline,
          powderColor: sample?.powderColor || alt.powderColor,
          badge: null,
          featured: false,
          supplyLane: lane,
          replacedSubmissionId: sample?.submissionId,
          replacedSku: sample?.sku,
          inStock: true,
        })
      );
    }
    if (fill.length) coveredCompounds.add(compound);
  }

  for (const [compound, lines] of changshaByCompound) {
    pushCompound(out, coveredCompounds, compound, lines, "warehouse-b");
  }

  for (const [compound, lines] of erpByCompound) {
    pushCompound(out, coveredCompounds, compound, lines, "warehouse-b");
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
