import {
  SEED_SUBMISSIONS,
  SEED_VENDORS,
  ACTIVE_VENDOR_IDS,
  displayVendorName,
  buildCatalog,
} from "./products";
import { JEC_VENDOR, JEC_VENDOR_ID } from "./jecPremium";
import { STG_VENDOR, STG_VENDOR_ID } from "./stgBackup";
import { isFocusedSubmission } from "./catalogFocus";
import {
  applySupplyFallback,
  loadSupplyPolicy,
} from "../utils/supplyFallback";
import {
  loadCachedStgSubmissions,
  stgVendorWithPolicy,
} from "../utils/stgSync";

/** Bump when focused vendors/catalog must replace stale local data. */
const STORAGE_KEY = "wellpept-marketplace-v15";

function syncVendor(v, policy = null) {
  if (!v || !ACTIVE_VENDOR_IDS.has(v.id)) return null;
  if (v.id === JEC_VENDOR_ID) {
    return {
      ...v,
      id: JEC_VENDOR_ID,
      name: "JEC",
      priceListSource: JEC_VENDOR.priceListSource,
      shippingFlat: JEC_VENDOR.shippingFlat,
      shippingNote: JEC_VENDOR.shippingNote,
      minOrder: JEC_VENDOR.minOrder,
      status: "approved",
      role: "primary",
    };
  }
  if (v.id === STG_VENDOR_ID) {
    const base = stgVendorWithPolicy(policy || loadSupplyPolicy());
    return {
      ...base,
      ...v,
      id: STG_VENDOR_ID,
      name: "STG",
      role: "fallback",
      status: "approved",
      shippingFlat:
        policy?.shippingFlat != null && Number(policy.shippingFlat) > 0
          ? Number(policy.shippingFlat)
          : v.shippingFlat ?? base.shippingFlat,
      shippingNote:
        String(policy?.shippingNote || v.shippingNote || base.shippingNote || "")
          .trim() || STG_VENDOR.shippingNote,
    };
  }
  return {
    ...v,
    name: displayVendorName(v.name, v.id) || v.name,
  };
}

function mergeSubmissions(seedSubs, stgSubs) {
  const primary = seedSubs.filter(
    (s) => s.vendorId === JEC_VENDOR_ID && isFocusedSubmission(s)
  );
  const stg = (stgSubs || []).filter(
    (s) => s.vendorId === STG_VENDOR_ID && isFocusedSubmission(s)
  );
  return [...primary, ...stg];
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.vendors || !parsed?.submissions) return null;
    const policy = loadSupplyPolicy();
    const vendors = parsed.vendors.map((v) => syncVendor(v, policy)).filter(Boolean);
    if (!vendors.length) return null;
    return { vendors, submissions: parsed.submissions, policy };
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      vendors: state.vendors,
      submissions: state.submissions,
    })
  );
}

export function buildMarketplaceProducts(vendors, submissions, policy) {
  const pol = policy || loadSupplyPolicy();
  const cleanVendors = vendors.map((v) => syncVendor(v, pol)).filter(Boolean);
  for (const seed of SEED_VENDORS) {
    if (!cleanVendors.some((v) => v.id === seed.id)) {
      cleanVendors.push(syncVendor(seed, pol));
    }
  }
  const raw = buildCatalog(cleanVendors, submissions);
  return applySupplyFallback(raw, pol);
}

export function getInitialMarketplace() {
  const policy = loadSupplyPolicy();
  const stgCached = loadCachedStgSubmissions();
  const vendors = SEED_VENDORS.map((seed) => syncVendor(seed, policy)).filter(
    Boolean
  );
  const submissions = mergeSubmissions(SEED_SUBMISSIONS, stgCached);
  void loadState();
  return {
    vendors,
    submissions,
    products: buildMarketplaceProducts(vendors, submissions, policy),
    policy,
  };
}

export function persistMarketplace(vendors, submissions, policy) {
  const pol = policy || loadSupplyPolicy();
  const cleanVendors = vendors.map((v) => syncVendor(v, pol)).filter(Boolean);
  for (const seed of SEED_VENDORS) {
    if (!cleanVendors.some((v) => v.id === seed.id)) {
      cleanVendors.push(syncVendor(seed, pol));
    }
  }

  const primarySubs = submissions.filter(
    (s) =>
      s.vendorId === JEC_VENDOR_ID &&
      ACTIVE_VENDOR_IDS.has(s.vendorId) &&
      isFocusedSubmission(s)
  );
  const stgFromState = submissions.filter(
    (s) => s.vendorId === STG_VENDOR_ID && isFocusedSubmission(s)
  );
  const stgSubs =
    stgFromState.length > 0 ? stgFromState : loadCachedStgSubmissions();
  const finalPrimary = primarySubs.length ? primarySubs : SEED_SUBMISSIONS;
  const finalSubs = mergeSubmissions(finalPrimary, stgSubs);

  saveState({ vendors: cleanVendors, submissions: finalSubs });
  return buildMarketplaceProducts(cleanVendors, finalSubs, pol);
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
