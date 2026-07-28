import {
  SEED_SUBMISSIONS,
  SEED_VENDORS,
  buildCatalog,
} from "./products";

const STORAGE_KEY = "undisclosed-marketplace-v10";

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.vendors || !parsed?.submissions) return null;
    return parsed;
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
