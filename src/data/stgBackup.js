/**
 * STG (Vendor Promo / price sheet) — silent supply backup.
 * Never shown by name on the storefront. Used only when a primary
 * (JEC) line is marked unavailable and STG has a matching SKU.
 */

import { JEC_VENDOR_ID } from "./jecPremium";

export const PRIMARY_VENDOR_ID = JEC_VENDOR_ID;
export const STG_VENDOR_ID = "v-stg-backup";

export const STG_VENDOR = {
  id: STG_VENDOR_ID,
  name: "STG",
  email: "",
  status: "approved",
  role: "fallback",
  minOrder: 0,
  shippingFlat: 60,
  shippingNote:
    "US shipping only · 2–3 weeks delivery · times follow latest STG sheet",
  priceListSource: "STG Vendor Promo sheet",
  createdAt: "2026-07-30T00:00:00.000Z",
};

/** Seed empty — filled by Admin sync / sheet pull. */
export const STG_SUBMISSIONS = [];
