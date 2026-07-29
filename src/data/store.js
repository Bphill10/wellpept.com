import {
  SEED_SUBMISSIONS,
  SEED_VENDORS,
  buildCatalog,
} from "./products";
import { CHANGSHA_VENDOR } from "./changshaPremium";
import { THE_LOBSTER_VENDOR } from "./theLobster";
import { isFocusedSubmission } from "./catalogFocus";

/** Bump whenever the focused catalog / pricing must replace stale local data. */
const STORAGE_KEY = "wellpept-marketplace-v6";

/** Vendors currently live on Undisclosed. */
const ACTIVE_VENDOR_IDS = new Set(["v-changsha-premium", "v-the-lobster"]);

function syncVendor(v) {
  if (v.id === CHANGSHA_VENDOR.id) {
    return {
      ...v,
      name: CHANGSHA_VENDOR.name,
      priceListSource: CHANGSHA_VENDOR.priceListSource,
      shippingFlat: CHANGSHA_VENDOR.shippingFlat,
      shippingNote: CHANGSHA_VENDOR.shippingNote,
      minOrder: CHANGSHA_VENDOR.minOrder,
      status: "approved",
    };
  }
  if (v.id === THE_LOBSTER_VENDOR.id) {
    return {
      ...v,
      name: THE_LOBSTER_VENDOR.name,
      featured: true,
      featuredFor: "HGH",
      shippingFlat: THE_LOBSTER_VENDOR.shippingFlat,
      shippingNote: THE_LOBSTER_VENDOR.shippingNote,
      notes: THE_LOBSTER_VENDOR.notes,
      status: "approved",
    };
  }
  return v;
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.vendors || !parsed?.submissions) return null;
    const vendors = parsed.vendors
      .filter((v) => ACTIVE_VENDOR_IDS.has(v.id))
      .map(syncVendor);
    // Keep any extra focused lines from ops, but never ERP / Sema / unfocused stock.
    const seedIds = new Set(SEED_SUBMISSIONS.map((s) => s.id));
    const extra = parsed.submissions.filter(
      (s) =>
        ACTIVE_VENDOR_IDS.has(s.vendorId) &&
        isFocusedSubmission(s) &&
        !seedIds.has(s.id)
    );
    const submissions = [...SEED_SUBMISSIONS, ...extra];
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
  // Always prefer seed vendors so Changsha/Lobster names + shipping stay correct.
  const byId = new Map((saved?.vendors || []).map((v) => [v.id, v]));
  const vendors = SEED_VENDORS.map((seed) =>
    syncVendor(byId.get(seed.id) ? { ...seed, ...byId.get(seed.id), ...seed } : seed)
  );
  const submissions = saved?.submissions?.length
    ? saved.submissions
    : SEED_SUBMISSIONS;
  return {
    vendors,
    submissions,
    products: buildCatalog(vendors, submissions),
  };
}

export function persistMarketplace(vendors, submissions) {
  const cleanVendors = vendors
    .filter((v) => ACTIVE_VENDOR_IDS.has(v.id))
    .map(syncVendor);
  const cleanSubs = submissions.filter(
    (s) => ACTIVE_VENDOR_IDS.has(s.vendorId) && isFocusedSubmission(s)
  );
  saveState({ vendors: cleanVendors, submissions: cleanSubs });
  return buildCatalog(cleanVendors, cleanSubs);
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
