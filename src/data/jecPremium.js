/**
 * JEC / JCE (Jinan Elitepeptide Chemical) — primary Undisclosed supply.
 * Seeded from Aria’s public promo SKUs (Apr–Jul 2026 forum posts).
 * Drop a full XLSX/CSV in public/vendor-lists/ (Windows:
 * C:\\Users\\bphil\\Ben_Phillips_Resume\\public\\vendor-lists) to replace
 * this seed with the complete list. Never show the vendor name on the storefront.
 */

export const JEC_VENDOR_ID = "v-jec-premium";

export const JEC_VENDOR = {
  id: JEC_VENDOR_ID,
  name: "JEC",
  email: "aria@jce111.com",
  status: "approved",
  minOrder: 0,
  shippingFlat: 50,
  shippingNote:
    "US shipping only · 2–3 weeks delivery · $50 shipping · free over $350",
  priceListSource: "JEC public promo SKUs (Apr–Jul 2026)",
  createdAt: "2026-07-30T00:00:00.000Z",
};

const NOW = "2026-07-30T00:00:00.000Z";
const REVIEWED = "2026-07-30T12:00:00.000Z";

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
    mg: Number.isFinite(mass) ? mass : 0,
    unit,
    vendorCost: Number(vendorCost),
    category,
    packVials: 10,
    status: "approved",
    submittedAt: NOW,
    reviewedAt: REVIEWED,
  };
}

/**
 * Deduped kit SKUs. Prefer latest weekly promo prices when several posts list
 * the same code; fill gaps from other JEC promo threads.
 */
export const JEC_SUBMISSIONS = [
  line({
    sku: "T15",
    name: "Tirzepatide",
    mg: 15,
    vendorCost: 55,
    category: "Metabolic",
  }),
  line({
    sku: "T20",
    name: "Tirzepatide",
    mg: 20,
    vendorCost: 70,
    category: "Metabolic",
  }),
  line({
    sku: "T30",
    name: "Tirzepatide",
    mg: 30,
    vendorCost: 100,
    category: "Metabolic",
  }),
  line({
    sku: "T40",
    name: "Tirzepatide",
    mg: 40,
    vendorCost: 140,
    category: "Metabolic",
  }),
  line({
    sku: "T60",
    name: "Tirzepatide",
    mg: 60,
    vendorCost: 200,
    category: "Metabolic",
  }),
  line({
    sku: "RT10",
    name: "Retatrutide",
    mg: 10,
    vendorCost: 75,
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
    sku: "RT30",
    name: "Retatrutide",
    mg: 30,
    vendorCost: 170,
    category: "Metabolic",
  }),
  line({
    sku: "SM10",
    name: "Semaglutide",
    mg: 10,
    vendorCost: 65,
    category: "Metabolic",
  }),
  line({
    sku: "SM15",
    name: "Semaglutide",
    mg: 15,
    vendorCost: 80,
    category: "Metabolic",
  }),
  line({
    sku: "CAGRI10",
    name: "Cagrilintide",
    mg: 10,
    vendorCost: 145,
    category: "Metabolic",
  }),
  line({
    sku: "BPC10",
    name: "BPC-157",
    mg: 10,
    vendorCost: 55,
    category: "Recovery",
  }),
  line({
    sku: "TB5",
    name: "TB-500",
    mg: 5,
    vendorCost: 69,
    category: "Recovery",
  }),
  line({
    sku: "TB10",
    name: "TB-500",
    mg: 10,
    vendorCost: 105,
    category: "Recovery",
  }),
  line({
    sku: "KPV30",
    name: "KPV",
    mg: 30,
    vendorCost: 179,
    category: "Recovery",
  }),
  line({
    sku: "KLOW80",
    name: "KLOW",
    mg: 80,
    vendorCost: 165,
    category: "Recovery",
    form: "Lyophilized vial · 80mg*10vials",
  }),
  line({
    sku: "GLOW70",
    name: "GLOW",
    mg: 70,
    vendorCost: 130,
    category: "Recovery",
    form: "Lyophilized vial · 70mg*10vials",
  }),
  line({
    sku: "EPI10",
    name: "Epithalon",
    mg: 10,
    vendorCost: 50,
    category: "Longevity",
  }),
  line({
    sku: "TESA10",
    name: "Tesamorelin",
    mg: 10,
    vendorCost: 145,
    category: "Growth",
  }),
  line({
    sku: "IPA5",
    name: "Ipamorelin",
    mg: 5,
    vendorCost: 48,
    category: "Growth",
  }),
  line({
    sku: "IPA10",
    name: "Ipamorelin",
    mg: 10,
    vendorCost: 65,
    category: "Growth",
  }),
  line({
    sku: "MOTS10",
    name: "MOTS-c",
    mg: 10,
    vendorCost: 65,
    category: "Cellular",
  }),
  line({
    sku: "GHK100",
    name: "GHK-Cu",
    mg: 100,
    vendorCost: 78,
    category: "Cellular",
  }),
  line({
    sku: "NAD500",
    name: "NAD+",
    mg: 500,
    vendorCost: 65,
    category: "Cellular",
  }),
  line({
    sku: "NAD1000",
    name: "NAD+",
    mg: 1000,
    vendorCost: 120,
    category: "Cellular",
  }),
  line({
    sku: "GLU600",
    name: "Glutathione",
    mg: 600,
    vendorCost: 35,
    category: "Cellular",
  }),
  line({
    sku: "SNAP8",
    name: "SNAP-8",
    mg: 10,
    vendorCost: 60,
    category: "Research",
  }),
  line({
    sku: "VIP10",
    name: "VIP",
    mg: 10,
    vendorCost: 130,
    category: "Research",
  }),
  line({
    sku: "HCG",
    name: "HCG",
    mg: 5000,
    vendorCost: 60,
    category: "Hormone",
    unit: "IU",
    form: "Lyophilized vial · 5000IU*10vials",
  }),
];

export const JEC_ITEM_COUNT = JEC_SUBMISSIONS.length;
