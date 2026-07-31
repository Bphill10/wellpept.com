/**
 * Customer-facing warehouses (never show supplier names).
 * A = JEC US (cheapest / fastest)
 * B = intl gap-fill (Changsha, then ERP when needed)
 * Only define a warehouse when it is actually used in the shop.
 */

import { JEC_VENDOR_ID } from "./jecPremium";
import { CHANGSHA_VENDOR_ID } from "./changshaPremium";
import { STG_VENDOR_ID } from "./stgBackup";

export const WAREHOUSE_A = "A";
export const WAREHOUSE_B = "B";

/** Catalog filter chips: All + active warehouses only. */
export const WAREHOUSE_FILTERS = [
  { id: "All", label: "All warehouses" },
  { id: WAREHOUSE_A, label: "Warehouse A", hint: "7–10 days" },
  { id: WAREHOUSE_B, label: "Warehouse B", hint: "2–4 weeks" },
];

export const WAREHOUSES = {
  A: {
    id: WAREHOUSE_A,
    label: "Warehouse A",
    vendorId: JEC_VENDOR_ID,
    rank: 1,
    shippingFlat: 10,
    minOrder: 0,
    /** Free flat shipping when kit qty from this warehouse ≥ this. */
    freeShippingAtKits: 2,
    delivery: "7–10 days",
    ships: "Warehouse A · 7–10 days · $10 shipping · free on 2+ kits from A",
    shippingNote:
      "Warehouse A · 7–10 days · $10 shipping · free on 2+ kits from this warehouse",
  },
  B: {
    id: WAREHOUSE_B,
    label: "Warehouse B",
    vendorId: CHANGSHA_VENDOR_ID,
    rank: 2,
    shippingFlat: 60,
    minOrder: 0,
    freeShippingAtKits: null,
    delivery: "2–4 weeks",
    ships: "Warehouse B · 2–4 weeks · $60 shipping",
    shippingNote: "Warehouse B · 2–4 weeks · $60 shipping per order from B",
  },
};

const BY_VENDOR = Object.fromEntries(
  Object.values(WAREHOUSES).map((w) => [w.vendorId, w])
);

export function warehouseForVendorId(vendorId) {
  const id = String(vendorId || "");
  if (id === JEC_VENDOR_ID || id === "v-jec") return WAREHOUSES.A;
  // Changsha + ERP share Warehouse B (intl gap-fill lane)
  if (
    id === CHANGSHA_VENDOR_ID ||
    id === "v-changsha-premium" ||
    id === STG_VENDOR_ID ||
    id === "v-stg-backup" ||
    id === "v-erp-peptide"
  ) {
    return WAREHOUSES.B;
  }
  return BY_VENDOR[id] || null;
}

export function warehouseRank(warehouseIdOrProduct) {
  if (warehouseIdOrProduct && typeof warehouseIdOrProduct === "object") {
    const w =
      warehouseIdOrProduct.warehouseId ||
      warehouseForVendorId(warehouseIdOrProduct.vendorId)?.id;
    return WAREHOUSES[w]?.rank ?? 99;
  }
  return WAREHOUSES[warehouseIdOrProduct]?.rank ?? 99;
}

/** Attach warehouse fields onto a catalog product (hides supplier identity). */
export function withWarehouseFields(product, overrides = {}) {
  const wh = warehouseForVendorId(overrides.vendorId || product?.vendorId);
  if (!wh) {
    return { ...product, ...overrides, vendor: "" };
  }
  return {
    ...product,
    ...overrides,
    warehouseId: wh.id,
    warehouseLabel: wh.label,
    warehouseRank: wh.rank,
    minOrder: wh.minOrder,
    shippingFlat: wh.shippingFlat,
    shippingNote: wh.shippingNote,
    ships: wh.ships,
    vendor: "",
  };
}

/**
 * Shipping charged once per warehouse in the cart, using that warehouse’s
 * flat fee / free-shipping kit threshold / minimum order.
 */
export function cartShippingBreakdown(cart) {
  const byWh = new Map();
  const otherByVendor = new Map();

  for (const line of cart || []) {
    const wh =
      (line.warehouseId && WAREHOUSES[line.warehouseId]) ||
      warehouseForVendorId(line.vendorId);

    if (wh && !line?.skin && !line?.print) {
      if (!byWh.has(wh.id)) {
        byWh.set(wh.id, {
          warehouseId: wh.id,
          label: wh.label,
          flat: wh.shippingFlat,
          minOrder: wh.minOrder,
          freeShippingAtKits: wh.freeShippingAtKits,
          delivery: wh.delivery,
          kits: 0,
          merchandise: 0,
        });
      }
      const row = byWh.get(wh.id);
      row.kits += Number(line.qty) || 0;
      row.merchandise +=
        (Number(line.price) || 0) * (Number(line.qty) || 0);
      continue;
    }

    // Skincare / print shop / unknown: one flat fee per vendorId
    const vid = line.vendorId || "other";
    if (!otherByVendor.has(vid)) {
      otherByVendor.set(vid, {
        warehouseId: vid,
        label: line.print
          ? "Print shop"
          : line.skin
            ? "US shipping"
            : "US shipping",
        flat: Number(line.shippingFlat) || 0,
        minOrder: Number(line.minOrder) || 0,
        freeShippingAtKits: null,
        delivery: line.ships || "2–3 weeks",
        kits: 0,
        merchandise: 0,
      });
    }
    const other = otherByVendor.get(vid);
    other.kits += Number(line.qty) || 0;
    other.merchandise +=
      (Number(line.price) || 0) * (Number(line.qty) || 0);
  }

  const lines = [...byWh.values(), ...otherByVendor.values()]
    .sort((a, b) => {
      const ra = WAREHOUSES[a.warehouseId]?.rank ?? 50;
      const rb = WAREHOUSES[b.warehouseId]?.rank ?? 50;
      if (ra !== rb) return ra - rb;
      return String(a.label).localeCompare(String(b.label));
    })
    .map((row) => {
      const hasWarehouseA = byWh.has(WAREHOUSE_A);
      const isPrintShop = row.warehouseId === "wellpept-print";
      const free =
        (isPrintShop && hasWarehouseA) ||
        (row.freeShippingAtKits != null &&
          row.kits >= Number(row.freeShippingAtKits));
      const fee = free ? 0 : Number(row.flat) || 0;
      const meetsMin = row.merchandise >= (Number(row.minOrder) || 0);
      return {
        ...row,
        fee,
        free,
        meetsMin,
        note: free
          ? isPrintShop && hasWarehouseA
            ? `${row.label}: free with Warehouse A peptides`
            : `${row.label}: free shipping (${row.kits} kits)`
          : `${row.label}: ${fee > 0 ? `$${fee}` : "$0"} · ${row.delivery}`,
      };
    });

  return {
    lines,
    total: lines.reduce((sum, l) => sum + l.fee, 0),
    minOrderWarnings: lines
      .filter((l) => !l.meetsMin && l.minOrder > 0)
      .map(
        (l) =>
          `${l.label} minimum order is $${Number(l.minOrder).toFixed(0)} (cart has $${l.merchandise.toFixed(0)})`
      ),
  };
}

export function cartShippingTotal(cart) {
  return cartShippingBreakdown(cart).total;
}
