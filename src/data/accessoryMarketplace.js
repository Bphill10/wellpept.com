/**
 * Public accessories marketplace — vendors apply to list on WellPept Renew.
 * Separate from Undisclosed peptide vendors (wellpept-marketplace-v31).
 */

import { WELLPEPT_COSMETIC_LEGAL as PEPTIDE_LEGAL } from "./siteLegal";

const STORAGE_KEY = "wellpept-accessory-marketplace-v1";

export const ACCESSORY_SHIP_OPTIONS = {
  economy: {
    id: "economy",
    label: "Economy",
    delivery: "2–4 weeks",
    ships: "Economy · ships from partner · 2–4 weeks",
    shippingFlat: 0,
    blurb: "Best price · partner ships from China · 2–4 weeks",
  },
  fast: {
    id: "fast",
    label: "Fast",
    delivery: "2–5 days",
    ships: "Fast · US stock · 2–5 days",
    shippingFlat: 6,
    blurb: "Faster · US stock when available · 2–5 days",
  },
};

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export function loadAccessoryMarketplace() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { vendors: [], listings: [] };
    const data = JSON.parse(raw);
    return {
      vendors: Array.isArray(data.vendors) ? data.vendors : [],
      listings: Array.isArray(data.listings) ? data.listings : [],
    };
  } catch {
    return { vendors: [], listings: [] };
  }
}

export function saveAccessoryMarketplace(next) {
  const payload = {
    vendors: Array.isArray(next?.vendors) ? next.vendors : [],
    listings: Array.isArray(next?.listings) ? next.listings : [],
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
  return payload;
}

export function getApprovedAccessoryListings(
  market = loadAccessoryMarketplace()
) {
  const approvedVendors = new Set(
    (market.vendors || [])
      .filter((v) => v.status === "approved")
      .map((v) => v.id)
  );
  return (market.listings || [])
    .filter(
      (l) => l.status === "approved" && approvedVendors.has(l.vendorId)
    )
    .map(listingToStoreProduct);
}

/** Normalize a marketplace listing (or seed accessory) for ProductCard / cart. */
export function listingToStoreProduct(listing) {
  const modes = normalizeShipModes(listing.shipModes || listing.shipMode);
  const primary = modes[0] || "economy";
  const ship = ACCESSORY_SHIP_OPTIONS[primary];
  return {
    id: listing.id,
    name: listing.name,
    line: listing.line || (listing.kind === "mini" ? "Mini" : "Tools"),
    kind: listing.kind === "mini" ? "mini" : "tool",
    price: Number(listing.price) || 0,
    size: listing.size || "",
    image: listing.image || "",
    blurb: listing.blurb || "",
    focus: listing.focus || "",
    legal: PEPTIDE_LEGAL,
    shipModes: modes,
    shipMode: primary,
    ships: ship.ships,
    shippingFlat: ship.shippingFlat,
    marketplace: true,
    marketplaceVendorId: listing.vendorId || "",
    vendorId: `wellpept-mkt-${primary}`,
  };
}

export function normalizeShipModes(input) {
  const list = Array.isArray(input)
    ? input
    : input
      ? [input]
      : ["economy"];
  const out = [];
  for (const m of list) {
    const id = String(m || "").toLowerCase();
    if ((id === "economy" || id === "fast") && !out.includes(id)) out.push(id);
  }
  return out.length ? out : ["economy"];
}

export function applyAccessoryVendor({
  name,
  email,
  company = "",
  notes = "",
  product = null,
}) {
  const market = loadAccessoryMarketplace();
  const vendorId = uid("av");
  const vendor = {
    id: vendorId,
    name: String(name || "").trim(),
    email: String(email || "").trim().toLowerCase(),
    company: String(company || "").trim(),
    notes: String(notes || "").trim(),
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  if (!vendor.name || !vendor.email) {
    return { ok: false, error: "Name and email are required." };
  }

  const listings = [...market.listings];
  let listing = null;
  if (product?.name && Number(product.price) > 0) {
    listing = {
      id: uid("al"),
      vendorId,
      name: String(product.name).trim(),
      blurb: String(product.blurb || "").trim(),
      price: Number(product.price),
      size: String(product.size || "").trim(),
      image: String(product.image || "").trim(),
      kind: product.kind === "mini" ? "mini" : "tool",
      line: product.kind === "mini" ? "Mini" : "Tools",
      focus: String(product.focus || "").trim(),
      shipModes: normalizeShipModes(product.shipModes),
      status: "pending",
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
    };
    listings.push(listing);
  }

  const next = saveAccessoryMarketplace({
    vendors: [...market.vendors, vendor],
    listings,
  });
  return { ok: true, vendor, listing, market: next };
}

export function setAccessoryVendorStatus(vendorId, status) {
  const market = loadAccessoryMarketplace();
  const vendors = market.vendors.map((v) =>
    v.id === vendorId
      ? { ...v, status, reviewedAt: new Date().toISOString() }
      : v
  );
  let listings = market.listings;
  if (status === "approved") {
    listings = listings.map((l) =>
      l.vendorId === vendorId && l.status === "pending"
        ? { ...l, status: "approved", reviewedAt: new Date().toISOString() }
        : l
    );
  }
  if (status === "rejected") {
    listings = listings.map((l) =>
      l.vendorId === vendorId && l.status === "pending"
        ? { ...l, status: "rejected", reviewedAt: new Date().toISOString() }
        : l
    );
  }
  return saveAccessoryMarketplace({ vendors, listings });
}

export function setAccessoryListingStatus(listingId, status) {
  const market = loadAccessoryMarketplace();
  const listings = market.listings.map((l) =>
    l.id === listingId
      ? { ...l, status, reviewedAt: new Date().toISOString() }
      : l
  );
  return saveAccessoryMarketplace({ vendors: market.vendors, listings });
}

export function formatAccessoryApplyText({ vendor, listing }) {
  const lines = [
    "WELLPEPT SELL APPLICATION (accessories marketplace)",
    `Vendor: ${vendor.name} <${vendor.email}>`,
  ];
  if (vendor.company) lines.push(`Company: ${vendor.company}`);
  if (vendor.notes) lines.push(`Notes: ${vendor.notes}`);
  lines.push(`Vendor ID: ${vendor.id}`, `Status: ${vendor.status}`, "");
  if (listing) {
    lines.push(
      "First listing:",
      `  ${listing.name} · $${Number(listing.price).toFixed(2)} · ${listing.size || "—"}`,
      `  Kind: ${listing.kind} · Ship: ${(listing.shipModes || []).join(", ")}`,
      `  ${listing.blurb || ""}`,
      `  Listing ID: ${listing.id}`
    );
  } else {
    lines.push("No first product submitted — vendor profile only.");
  }
  lines.push(
    "",
    "Approve in Undisclosed Admin → Marketplace (accessories).",
    "Approved listings appear on WellPept → Accessories."
  );
  return lines.join("\n");
}
