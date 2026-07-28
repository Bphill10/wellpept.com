/** Featured vendor — Lobster International only (Cartman Gear).
 *  Customer storefront never links out to the vendor site.
 *  Sourced from Wayback 2026-06-27:
 *  https://cartmangear.co/product-category/lobster-international/
 */

export const THE_LOBSTER_VENDOR = {
  id: "v-the-lobster",
  name: "The Lobster (Cartman Gear)",
  email: "thelobster@tuta.com",
  telegram: "@THELOBSTERHGH",
  website: "https://cartmangear.co/product-category/lobster-international/",
  status: "approved",
  featured: true,
  minOrder: 800,
  shippingFlat: 0,
  shippingNote: "US shipping only · allow up to 4 weeks",
  priceListSource: "Lobster International (Wayback 2026-06-27)",
  notes:
    "Featured vendor. US shipping only. Min order applies. Drop-ship via Undisclosed only — do not expose vendor site to customers.",
  createdAt: "2026-01-01T00:00:00.000Z",
};

/**
 * vendorCost = Lobster International list price before Undisclosed markup.
 * KIT = 10 vials unless packVials/form says otherwise.
 * Skipped: TheProLobster 50 IU (listed at $0 on source).
 */
const LOBSTER_LINES = [
  { sku: "LOB-BPC12", name: "BPC-157", mg: 12, vendorCost: 80, category: "Recovery", packVials: 10 },
  { sku: "LOB-BPCTB", name: "BPC-157 + TB-500", mg: 10, vendorCost: 150, category: "Recovery", packVials: 10, form: "Lyophilized blend · 10/10mg*10vials · International" },
  { sku: "LOB-GHK100", name: "GHK-Cu", mg: 100, vendorCost: 90, category: "Cellular", packVials: 10 },
  { sku: "LOB-GHK50", name: "GHK-Cu", mg: 50, vendorCost: 50, category: "Cellular", packVials: 10 },
  { sku: "LOB-GHRP6", name: "GHRP-6", mg: 10, vendorCost: 60, category: "Growth", packVials: 10 },
  { sku: "LOB-GLOW70", name: "Glow", mg: 70, vendorCost: 200, category: "Recovery", packVials: 10, form: "Lyophilized blend kit · Glow 70 · International" },
  { sku: "LOB-HCG5K", name: "HCG", mg: 5000, unit: "IU", vendorCost: 80, category: "Research", packVials: 10, form: "Lyophilized vial · 5000 IU*10vials · International" },
  { sku: "LOB-HGH150", name: "HGH", mg: 150, unit: "IU", vendorCost: 100, category: "Growth", packVials: 1, form: "Pharma-grade kit · 150 IU · International" },
  { sku: "LOB-HGH310", name: "HGH", mg: 310, unit: "IU", vendorCost: 190, category: "Growth", packVials: 1, form: "Pharma-grade kit · 310 IU · International" },
  { sku: "LOB-IPA10", name: "Ipamorelin", mg: 10, vendorCost: 100, category: "Growth", packVials: 10 },
  { sku: "LOB-MT2", name: "Melanotan-2", mg: 10, vendorCost: 80, category: "Research", packVials: 10 },
  { sku: "LOB-MOTS10", name: "MOTS-c", mg: 10, vendorCost: 80, category: "Metabolic", packVials: 10 },
  { sku: "LOB-RETA12", name: "Retatrutide", mg: 12, vendorCost: 100, category: "Metabolic", packVials: 10 },
  { sku: "LOB-RETA30", name: "Retatrutide", mg: 30, vendorCost: 200, category: "Metabolic", packVials: 10 },
  { sku: "LOB-RETA60", name: "Retatrutide", mg: 60, vendorCost: 360, category: "Metabolic", packVials: 10 },
  { sku: "LOB-SS31", name: "SS-31", mg: 10, vendorCost: 120, category: "Cellular", packVials: 10 },
  { sku: "LOB-TB4", name: "TB-4 (full sequence)", mg: 10, vendorCost: 120, category: "Recovery", packVials: 10 },
  { sku: "LOB-TB500", name: "TB-500", mg: 12, vendorCost: 80, category: "Recovery", packVials: 10 },
  { sku: "LOB-TIRZ10", name: "Tirzepatide", mg: 10, vendorCost: 80, category: "Metabolic", packVials: 10 },
  { sku: "LOB-TIRZ30", name: "Tirzepatide", mg: 30, vendorCost: 160, category: "Metabolic", packVials: 10 },
  { sku: "LOB-TIRZ60", name: "Tirzepatide", mg: 60, vendorCost: 290, category: "Metabolic", packVials: 10 },
  { sku: "LOB-PRO62", name: "TheProLobster Plus HGH", mg: 62, unit: "IU", vendorCost: 35, category: "Growth", packVials: 1, vialMl: 10, form: "Large bottle · 62 IU single vial · 10ml · International" },
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
