/**
 * JEC / JCE (Jinan Elitepeptide Chemical) — primary Undisclosed supply.
 * Seeded from US warehouse inventory screenshot:
 * public/vendor-lists/JEC US/Screenshot 2026-07-30 182013.png
 * Never show the vendor name on the storefront.
 */

export const JEC_VENDOR_ID = "v-jec-premium";

export const JEC_VENDOR = {
  id: JEC_VENDOR_ID,
  name: "JEC",
  email: "aria@jce111.com",
  status: "approved",
  minOrder: 0,
  shippingFlat: 10,
  shippingNote:
    "Warehouse A · 7–10 days · $10 shipping · free on 2+ kits from Warehouse A",
  priceListSource:
    "public/vendor-lists/JEC US/Screenshot 2026-07-30 182013.png",
  createdAt: "2026-07-30T00:00:00.000Z",
};

const NOW = "2026-07-31T00:00:00.000Z";
const REVIEWED = "2026-07-31T00:30:00.000Z";

function line({ sku, name, mg, vendorCost, category, form, unit = "mg" }) {
  const mass = Number(mg);
  return {
    id: `s-jec-${String(sku).toLowerCase()}`.replace(/[^a-z0-9-]+/g, "-"),
    vendorId: JEC_VENDOR_ID,
    sku,
    name,
    form:
      form ||
      `Lyophilized vial · ${Number.isFinite(mass) ? mass : "?"}${unit}*10vials`,
    purity: "≥98%",
    mg: Number.isFinite(mass) ? mg : 0,
    unit,
    vendorCost: Number(vendorCost),
    category,
    packVials: 10,
    status: "approved",
    submittedAt: NOW,
    reviewedAt: REVIEWED,
    priceListSource: JEC_VENDOR.priceListSource,
  };
}

/**
 * US warehouse A + B in-stock kits (deduped). Prices from Aria’s inventory update.
 * Warehouse A codes: 1060, 1210, 1230, 7650, 76100, 8540, 2110, 9910, 8810
 * Warehouse B codes: MG622-622001 … 622007
 */
export const JEC_SUBMISSIONS = [
  line({
    sku: "T30",
    name: "Tirzepatide",
    mg: 30,
    vendorCost: 100,
    category: "Metabolic",
  }),
  line({
    sku: "T60",
    name: "Tirzepatide",
    mg: 60,
    vendorCost: 180,
    category: "Metabolic",
  }),
  line({
    sku: "R10",
    name: "Retatrutide",
    mg: 10,
    vendorCost: 105,
    category: "Metabolic",
  }),
  line({
    sku: "R20",
    name: "Retatrutide",
    mg: 20,
    vendorCost: 160,
    category: "Metabolic",
  }),
  line({
    sku: "R30",
    name: "Retatrutide",
    mg: 30,
    vendorCost: 200,
    category: "Metabolic",
  }),
  line({
    sku: "GHK50",
    name: "GHK-Cu",
    mg: 50,
    vendorCost: 50,
    category: "Cellular",
  }),
  line({
    sku: "GHK100",
    name: "GHK-Cu",
    mg: 100,
    vendorCost: 70,
    category: "Cellular",
  }),
  line({
    sku: "MOTS40",
    name: "MOTS-c",
    mg: 40,
    vendorCost: 200,
    category: "Cellular",
  }),
  line({
    sku: "TESA10",
    name: "Tesamorelin",
    mg: 10,
    vendorCost: 180,
    category: "Growth",
  }),
  line({
    sku: "SEMAX10",
    name: "Semax",
    mg: 10,
    vendorCost: 65,
    category: "Cognitive",
  }),
  line({
    sku: "SELANK10",
    name: "Selank",
    mg: 10,
    vendorCost: 65,
    category: "Cognitive",
  }),
  line({
    sku: "CJCIPA10",
    name: "CJC-1295 without DAC + Ipamorelin",
    mg: 10,
    vendorCost: 125,
    category: "Growth",
    form: "Lyophilized vial · 10mg*10vials (CJC + IPA blend)",
  }),
  line({
    sku: "NAD1000",
    name: "NAD+",
    mg: 1000,
    vendorCost: 120,
    category: "Cellular",
  }),
];

export const JEC_ITEM_COUNT = JEC_SUBMISSIONS.length;
