import {
  SEED_SUBMISSIONS,
  SEED_VENDORS,
  ACTIVE_VENDOR_IDS,
  displayVendorName,
  buildCatalog,
  changshaGapFillSubmissions,
  erpGapFillSubmissions,
} from "./products";
import { JEC_VENDOR, JEC_VENDOR_ID, JEC_SUBMISSIONS } from "./jecPremium";
import {
  CHANGSHA_VENDOR,
  CHANGSHA_VENDOR_ID,
  CHANGSHA_SUBMISSIONS,
} from "./changshaPremium";
import { STG_VENDOR, STG_VENDOR_ID, STG_SUBMISSIONS } from "./stgBackup";
import { isFocusedSubmission, isJecSellable } from "./catalogFocus";
import { WAREHOUSES } from "./warehouses";
import {
  applySupplyFallback,
  loadSupplyPolicy,
} from "../utils/supplyFallback";
import {
  loadCachedStgSubmissions,
  stgVendorWithPolicy,
} from "../utils/stgSync";

/** Bump when focused vendors/catalog must replace stale local data. */
const STORAGE_KEY = "wellpept-marketplace-v28";

function syncVendor(v, policy = null) {
  if (!v || !ACTIVE_VENDOR_IDS.has(v.id)) return null;
  if (v.id === JEC_VENDOR_ID) {
    return {
      ...v,
      id: JEC_VENDOR_ID,
      name: "JEC",
      priceListSource: JEC_VENDOR.priceListSource,
      shippingFlat: WAREHOUSES.A.shippingFlat,
      shippingNote: WAREHOUSES.A.shippingNote,
      minOrder: WAREHOUSES.A.minOrder,
      status: "approved",
      role: "warehouse-a",
      warehouseId: "A",
    };
  }
  if (v.id === CHANGSHA_VENDOR_ID) {
    return {
      ...v,
      id: CHANGSHA_VENDOR_ID,
      name: "Changsha",
      priceListSource: CHANGSHA_VENDOR.priceListSource,
      shippingFlat: WAREHOUSES.B.shippingFlat,
      shippingNote: WAREHOUSES.B.shippingNote,
      minOrder: WAREHOUSES.B.minOrder,
      status: "approved",
      role: "warehouse-b",
      warehouseId: "B",
    };
  }
  if (v.id === STG_VENDOR_ID) {
    const base = stgVendorWithPolicy(policy || loadSupplyPolicy());
    return {
      ...base,
      ...v,
      id: STG_VENDOR_ID,
      name: "STG",
      role: "warehouse-c",
      warehouseId: "C",
      status: "approved",
      shippingFlat: WAREHOUSES.C.shippingFlat,
      shippingNote: WAREHOUSES.C.shippingNote,
      minOrder: WAREHOUSES.C.minOrder,
    };
  }
  return {
    ...v,
    name: displayVendorName(v.name, v.id) || v.name,
  };
}

function jecSeed() {
  return JEC_SUBMISSIONS.filter((s) => isJecSellable(s.name));
}

function changshaSeed(jecSubs) {
  return changshaGapFillSubmissions(jecSubs, CHANGSHA_SUBMISSIONS).filter(
    (s) => isFocusedSubmission(s)
  );
}

function erpSeed(coveredSubs, stgSubs) {
  const pool =
    Array.isArray(stgSubs) && stgSubs.length > 0 ? stgSubs : STG_SUBMISSIONS;
  return erpGapFillSubmissions(coveredSubs, pool).filter((s) =>
    isFocusedSubmission(s)
  );
}

function mergeSubmissions(seedSubs, stgSubs) {
  const fromSeed = seedSubs || [];
  let jec = fromSeed.filter(
    (s) => s.vendorId === JEC_VENDOR_ID && isFocusedSubmission(s)
  );
  if (!jec.length) jec = jecSeed();

  // Always re-gap-fill by compound so A ownership blocks B/C entirely.
  const changshaPool = fromSeed.filter(
    (s) => s.vendorId === CHANGSHA_VENDOR_ID && isFocusedSubmission(s)
  );
  const changsha = changshaGapFillSubmissions(
    jec,
    changshaPool.length ? changshaPool : CHANGSHA_SUBMISSIONS
  );

  const erpPool = fromSeed.filter(
    (s) => s.vendorId === STG_VENDOR_ID && isFocusedSubmission(s)
  );
  const erp = erpGapFillSubmissions(
    [...jec, ...changsha],
    erpPool.length ? erpPool : resolveStgSeed(stgSubs)
  );

  return [...jec, ...changsha, ...erp];
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

function resolveStgSeed(stgCached) {
  if (Array.isArray(stgCached) && stgCached.length > 0) return stgCached;
  return STG_SUBMISSIONS;
}

export function getInitialMarketplace() {
  const policy = loadSupplyPolicy();
  const stgSubs = resolveStgSeed(loadCachedStgSubmissions());
  const vendors = SEED_VENDORS.map((seed) => syncVendor(seed, policy)).filter(
    Boolean
  );
  const submissions = mergeSubmissions(SEED_SUBMISSIONS, stgSubs);
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

  const jecFromState = submissions.filter(
    (s) =>
      s.vendorId === JEC_VENDOR_ID &&
      ACTIVE_VENDOR_IDS.has(s.vendorId) &&
      isFocusedSubmission(s)
  );
  const changshaFromState = submissions.filter(
    (s) =>
      s.vendorId === CHANGSHA_VENDOR_ID &&
      ACTIVE_VENDOR_IDS.has(s.vendorId) &&
      isFocusedSubmission(s)
  );
  const stgFromState = submissions.filter(
    (s) => s.vendorId === STG_VENDOR_ID && isFocusedSubmission(s)
  );
  const stgSubs = resolveStgSeed(
    stgFromState.length > 0 ? stgFromState : loadCachedStgSubmissions()
  );
  const jec = jecFromState.length ? jecFromState : jecSeed();
  const changsha = changshaFromState.length
    ? changshaFromState
    : changshaSeed(jec);
  const finalSubs = mergeSubmissions([...jec, ...changsha, ...stgSubs], stgSubs);

  saveState({ vendors: cleanVendors, submissions: finalSubs });
  return buildMarketplaceProducts(cleanVendors, finalSubs, pol);
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
