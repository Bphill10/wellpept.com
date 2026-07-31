/**
 * Third backup supply — seeded from public/vendor-lists/ERP/ERP_Price_list_Jul31end.pdf
 * (Shanghai ERP Peptide). Never shown by name on the storefront.
 *
 * Used as:
 * - Gap-fill for top-25 strengths neither JEC nor Changsha carry
 * - OOS stand-in when a JEC line is unavailable and Changsha has no match
 */

import { ERP_SUBMISSIONS, ERP_VENDOR } from "./erpPeptide";
import { JEC_VENDOR_ID } from "./jecPremium";

export const PRIMARY_VENDOR_ID = JEC_VENDOR_ID;
export const STG_VENDOR_ID = "v-stg-backup";

export const STG_VENDOR = {
  id: STG_VENDOR_ID,
  name: "STG",
  email: "",
  status: "approved",
  role: "backup-3",
  minOrder: 0,
  shippingFlat: ERP_VENDOR.shippingFlat ?? 50,
  shippingNote:
    "US shipping only · 2–3 weeks delivery · $50 first 500g · free standard over $598",
  priceListSource: "public/vendor-lists/ERP/ERP_Price_list_Jul31end.pdf",
  createdAt: "2026-07-31T00:00:00.000Z",
};

/** Remap ERP catalog rows onto the silent STG vendor id. */
export const STG_SUBMISSIONS = ERP_SUBMISSIONS.map((row) => {
  const rawId = String(row.id || "");
  const id = rawId.startsWith("s-erp-")
    ? rawId.replace(/^s-erp-/, "s-stg-")
    : rawId.startsWith("s-stg-")
      ? rawId
      : `s-stg-${rawId.replace(/^s-/, "")}`;
  return {
    ...row,
    id,
    vendorId: STG_VENDOR_ID,
    priceListSource: STG_VENDOR.priceListSource,
  };
});
