import {
  SEED_SUBMISSIONS,
  SEED_VENDORS,
  ACTIVE_VENDOR_IDS,
  displayVendorName,
  buildCatalog,
} from "./products";
import { CHANGSHA_VENDOR } from "./changshaPremium";
import { isFocusedSubmission } from "./catalogFocus";

/** Bump when focused vendors/catalog must replace stale local data. */
const STORAGE_KEY = "wellpept-marketplace-v11";

function syncVendor(v) {
  if (!v || !ACTIVE_VENDOR_IDS.has(v.id)) return null;
  if (v.id === CHANGSHA_VENDOR.id) {
    return {
      ...v,
      id: CHANGSHA_VENDOR.id,
      name: "Changsha",
      priceListSource: CHANGSHA_VENDOR.priceListSource,
      shippingFlat: CHANGSHA_VENDOR.shippingFlat,
      shippingNote: CHANGSHA_VENDOR.shippingNote,
      minOrder: CHANGSHA_VENDOR.minOrder,
      status: "approved",
    };
  }
  return {
    ...v,
    name: displayVendorName(v.name, v.id),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.vendors || !parsed?.submissions) return null;
    const vendors = parsed.vendors.map(syncVendor).filter(Boolean);
    // Public catalog always reseeds focused lines; drop other vendors.
    const submissions = SEED_SUBMISSIONS.filter(isFocusedSubmission);
    if (!vendors.length) return null;
    return { vendors, submissions };
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

export function getInitialMarketplace() {
  const saved = loadState();
  const vendors = SEED_VENDORS.map((seed) => syncVendor(seed)).filter(Boolean);
  // Prefer seed catalog so only Changsha focused lines show.
  const submissions = SEED_SUBMISSIONS;
  // Keep seed vendor objects even if something was saved.
  void saved;
  return {
    vendors,
    submissions,
    products: buildCatalog(vendors, submissions),
  };
}

export function persistMarketplace(vendors, submissions) {
  const cleanVendors = vendors.map(syncVendor).filter(Boolean);
  // Ensure the live vendor always exists.
  for (const seed of SEED_VENDORS) {
    if (!cleanVendors.some((v) => v.id === seed.id)) {
      cleanVendors.push(syncVendor(seed));
    }
  }
  const cleanSubs = submissions.filter(
    (s) => ACTIVE_VENDOR_IDS.has(s.vendorId) && isFocusedSubmission(s)
  );
  // If ops wiped everything, fall back to seed.
  const finalSubs = cleanSubs.length ? cleanSubs : SEED_SUBMISSIONS;
  saveState({ vendors: cleanVendors, submissions: finalSubs });
  return buildCatalog(cleanVendors, finalSubs);
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
