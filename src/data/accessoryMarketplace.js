/**
 * Partner marketplace — vendors apply to list on WellPept and/or Undisclosed.
 * Separate from Undisclosed peptide supply vendors (wellpept-marketplace-v31).
 */

import {
  WELLPEPT_COSMETIC_LEGAL as PEPTIDE_LEGAL,
  UNDISCLOSED_LEGAL,
} from "./siteLegal";

const STORAGE_KEY = "wellpept-accessory-marketplace-v1";

export const MARKET_CHANNELS = {
  wellpept: {
    id: "wellpept",
    label: "WellPept Renew",
    blurb: "Main site · cosmetic accessories & travel minis only",
  },
  undisclosed: {
    id: "undisclosed",
    label: "Undisclosed",
    blurb: "Lab catalog · research-use tools / supplies (not for human use)",
  },
};

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

export function normalizeChannels(input) {
  const list = Array.isArray(input) ? input : input ? [input] : [];
  const out = [];
  for (const c of list) {
    const id = String(c || "").toLowerCase();
    if ((id === "wellpept" || id === "undisclosed") && !out.includes(id)) {
      out.push(id);
    }
  }
  return out.length ? out : ["wellpept"];
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

export function getApprovedAccessoryListings(
  market = loadAccessoryMarketplace(),
  { channel = null } = {}
) {
  const approvedVendors = new Set(
    (market.vendors || [])
      .filter((v) => v.status === "approved")
      .map((v) => v.id)
  );
  return (market.listings || [])
    .filter((l) => {
      if (l.status !== "approved" || !approvedVendors.has(l.vendorId)) {
        return false;
      }
      if (!channel) return true;
      const channels = normalizeChannels(l.channels || l.channel);
      return channels.includes(channel);
    })
    .map((l) => listingToStoreProduct(l, { channel }));
}

/** Normalize a marketplace listing for ProductCard / cart. */
export function listingToStoreProduct(listing, { channel = null } = {}) {
  const modes = normalizeShipModes(listing.shipModes || listing.shipMode);
  const primary = modes[0] || "economy";
  const ship = ACCESSORY_SHIP_OPTIONS[primary];
  const channels = normalizeChannels(listing.channels || listing.channel);
  const forUndisclosed =
    channel === "undisclosed" ||
    (!channel && channels.includes("undisclosed") && !channels.includes("wellpept"));
  const kind =
    listing.kind === "mini"
      ? "mini"
      : listing.kind === "research"
        ? "research"
        : "tool";
  const line =
    listing.line ||
    (kind === "mini" ? "Mini" : kind === "research" ? "Partner" : "Tools");

  return {
    id: listing.id,
    name: listing.name,
    line,
    kind: kind === "research" ? "tool" : kind,
    listingKind: kind,
    price: Number(listing.price) || 0,
    size: listing.size || "",
    image: listing.image || "",
    blurb: listing.blurb || "",
    focus: listing.focus || "",
    legal: forUndisclosed ? UNDISCLOSED_LEGAL : PEPTIDE_LEGAL,
    shipModes: modes,
    shipMode: primary,
    ships: ship.ships,
    shippingFlat: ship.shippingFlat,
    marketplace: true,
    marketplaceVendorId: listing.vendorId || "",
    channels,
    channel: forUndisclosed ? "undisclosed" : "wellpept",
    vendorId: `wellpept-mkt-${primary}`,
  };
}

export function applyAccessoryVendor({
  name,
  email,
  company = "",
  notes = "",
  channels = ["wellpept"],
  product = null,
}) {
  const market = loadAccessoryMarketplace();
  const vendorId = uid("av");
  const channelList = normalizeChannels(channels);
  const vendor = {
    id: vendorId,
    name: String(name || "").trim(),
    email: String(email || "").trim().toLowerCase(),
    company: String(company || "").trim(),
    notes: String(notes || "").trim(),
    channels: channelList,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  if (!vendor.name || !vendor.email) {
    return { ok: false, error: "Name and email are required." };
  }
  if (!channelList.length) {
    return { ok: false, error: "Pick at least one site to sell on." };
  }

  const listings = [...market.listings];
  let listing = null;
  if (product?.name && Number(product.price) > 0) {
    const kind =
      product.kind === "mini"
        ? "mini"
        : product.kind === "research"
          ? "research"
          : "tool";
    // Cosmetic minis/tools only on WellPept; research kind only for Undisclosed
    let listingChannels = channelList;
    if (kind === "research") {
      listingChannels = channelList.filter((c) => c === "undisclosed");
      if (!listingChannels.length) {
        return {
          ok: false,
          error: "Research listings can only sell on Undisclosed.",
        };
      }
    }
    listing = {
      id: uid("al"),
      vendorId,
      name: String(product.name).trim(),
      blurb: String(product.blurb || "").trim(),
      price: Number(product.price),
      size: String(product.size || "").trim(),
      image: String(product.image || "").trim(),
      kind,
      line:
        kind === "mini" ? "Mini" : kind === "research" ? "Partner" : "Tools",
      focus: String(product.focus || "").trim(),
      shipModes: normalizeShipModes(product.shipModes),
      channels: listingChannels,
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
    "WELLPEPT / UNDISCLOSED SELL APPLICATION (partner marketplace)",
    `Vendor: ${vendor.name} <${vendor.email}>`,
  ];
  if (vendor.company) lines.push(`Company: ${vendor.company}`);
  if (vendor.notes) lines.push(`Notes: ${vendor.notes}`);
  lines.push(
    `Sites: ${(vendor.channels || ["wellpept"]).join(", ")}`,
    `Vendor ID: ${vendor.id}`,
    `Status: ${vendor.status}`,
    ""
  );
  if (listing) {
    lines.push(
      "First listing:",
      `  ${listing.name} · $${Number(listing.price).toFixed(2)} · ${listing.size || "—"}`,
      `  Kind: ${listing.kind} · Sites: ${(listing.channels || []).join(", ")} · Ship: ${(listing.shipModes || []).join(", ")}`,
      `  ${listing.blurb || ""}`,
      `  Listing ID: ${listing.id}`
    );
  } else {
    lines.push("No first product submitted — vendor profile only.");
  }
  lines.push(
    "",
    "Approve in Undisclosed Admin → Marketplace (partners).",
    "WellPept channel → Accessories. Undisclosed channel → Partner listings."
  );
  return lines.join("\n");
}
