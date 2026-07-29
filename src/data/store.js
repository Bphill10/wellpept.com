import {
  SEED_SUBMISSIONS,
  SEED_VENDORS,
  buildCatalog,
} from "./products";
import { CHANGSHA_VENDOR } from "./changshaPremium";
import { THE_LOBSTER_VENDOR } from "./theLobster";

const STORAGE_KEY = "wellpept-marketplace-v2";

/** Vendors currently live on Undisclosed. */
const ACTIVE_VENDOR_IDS = new Set(["v-changsha-premium", "v-the-lobster"]);

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.vendors || !parsed?.submissions) return null;
    const vendors = parsed.vendors.filter((v) => ACTIVE_VENDOR_IDS.has(v.id));
    const submissions = parsed.submissions.filter((s) =>
      ACTIVE_VENDOR_IDS.has(s.vendorId)
    );
    if (!vendors.length) return null;
    // Keep display names in sync with seed (e.g. Changsha, not Premium).
    const vendorsSynced = vendors.map((v) => {
      if (v.id === CHANGSHA_VENDOR.id) {
        return {
          ...v,
          name: CHANGSHA_VENDOR.name,
          priceListSource: CHANGSHA_VENDOR.priceListSource,
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
        };
      }
      return v;
    });
    return { vendors: vendorsSynced, submissions };
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
  const vendors = saved?.vendors ?? SEED_VENDORS;
  const submissions = saved?.submissions ?? SEED_SUBMISSIONS;
  return {
    vendors,
    submissions,
    products: buildCatalog(vendors, submissions),
  };
}

export function persistMarketplace(vendors, submissions) {
  saveState({ vendors, submissions });
  return buildCatalog(vendors, submissions);
}

export function uid(prefix) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}-${Date.now().toString(36)}`;
}
