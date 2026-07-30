/** Featured vendor — Lobster (HGH focus).
 *  Customer storefront never links out to the vendor site.
 *  Sourced from Wayback 2026-06-27:
 *  https://cartmangear.co/product-category/lobster-international/
 */

export const THE_LOBSTER_VENDOR = {
  id: "v-the-lobster",
  name: "Lobster",
  email: "thelobster@tuta.com",
  telegram: "@THELOBSTERHGH",
  website: "https://cartmangear.co/product-category/lobster-international/",
  status: "approved",
  featured: true,
  featuredFor: "HGH",
  minOrder: 800,
  shippingFlat: 100,
  shippingNote: "US only · $100 flat shipping · request first · pay after supply check · 2–3 weeks",
  priceListSource: "Lobster International (Wayback 2026-06-27)",
  notes:
    "Featured for HGH. Request first — confirm supply within 24h, then payment. US shipping only · $100 flat. Min order applies. Allow 2–3 weeks after payment. Drop-ship via Wellpept only — do not expose vendor site to customers.",
  createdAt: "2026-01-01T00:00:00.000Z",
};

/**
 * Focused Lobster list: HGH, Retatrutide, TB-4, and Wolverine (BPC+TB).
 * vendorCost = Lobster International list price before Wellpept markup.
 * KIT = 10 vials unless packVials/form says otherwise.
 */
const LOBSTER_LINES = [
  { sku: "LOB-HGH150", name: "HGH", mg: 150, unit: "IU", vendorCost: 100, category: "Growth", packVials: 10, form: "Pharma-grade kit · 150 IU · International" },
  { sku: "LOB-HGH310", name: "HGH", mg: 310, unit: "IU", vendorCost: 190, category: "Growth", packVials: 10, form: "Pharma-grade kit · 310 IU · International" },
  { sku: "LOB-PRO62", name: "HGH", mg: 62, unit: "IU", vendorCost: 35, category: "Growth", packVials: 10, form: "Pharma-grade kit · 62 IU · International" },
  { sku: "LOB-RETA12", name: "Retatrutide", mg: 12, vendorCost: 100, category: "Metabolic", packVials: 10 },
  { sku: "LOB-RETA30", name: "Retatrutide", mg: 30, vendorCost: 200, category: "Metabolic", packVials: 10 },
  { sku: "LOB-RETA60", name: "Retatrutide", mg: 60, vendorCost: 360, category: "Metabolic", packVials: 10 },
  { sku: "LOB-TB4", name: "TB-500", mg: 10, vendorCost: 120, category: "Recovery", packVials: 10 },
  { sku: "LOB-BPCTB", name: "Wolverine", mg: 10, vendorCost: 150, category: "Recovery", packVials: 10, form: "Lyophilized blend · 10/10mg*10vials · International" },
];

export const THE_LOBSTER_SUBMISSIONS = LOBSTER_LINES.map((line) => ({
  id: `s-${line.sku.toLowerCase()}`,
  vendorId: "v-the-lobster",
  sku: line.sku,
  name: line.name,
  form:
    line.form ||
    `Lyophilized vial · ${line.mg}${line.unit || "mg"}*${line.packVials}vials · 3ml · International`,
  purity: "≥99%",
  mg: line.mg,
  unit: line.unit || "mg",
  vendorCost: line.vendorCost,
  category: line.category,
  packVials: line.packVials,
  vialMl: line.vialMl || 3,
  status: "approved",
  submittedAt: "2026-06-27T00:00:00.000Z",
  reviewedAt: "2026-07-28T00:00:00.000Z",
}));
