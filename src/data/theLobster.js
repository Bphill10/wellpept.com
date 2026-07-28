/** Featured vendor — full Lobster / Cartman Gear catalog.
 *  Customer storefront never links out to the vendor site.
 *  Sourced from Wayback 2026-06-27 category snapshots:
 *  lobster-international, china-international, pharma-grade-pct,
 *  canada-domestic-price-usd, australia-domestic-price-au, peptides-raws
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
  shippingNote: "Allow up to 4 weeks for shipping",
  priceListSource:
    "Cartman Gear categories (Wayback 2026-06-27): International, China, Pharma/PCT, Canada, Australia, Raws",
  notes:
    "Featured vendor. Min order applies. Drop-ship via Undisclosed only — do not expose vendor site to customers.",
  createdAt: "2026-01-01T00:00:00.000Z",
};

/** Rough AUD→USD for AU domestic list prices (category is Price Au$). */
const AUD = (n) => Math.round(Number(n) * 0.65 * 100) / 100;

/**
 * vendorCost = Lobster list price before Undisclosed markup.
 * KIT = 10 vials unless packVials/form says otherwise.
 */
const LOBSTER_LINES = [
  // —— Lobster International (reship, USD) ——
  { sku: "LOB-BPC12", name: "BPC-157", mg: 12, vendorCost: 80, category: "Recovery", packVials: 10, lane: "International" },
  { sku: "LOB-BPCTB", name: "BPC-157 + TB-500", mg: 10, vendorCost: 150, category: "Recovery", packVials: 10, lane: "International", form: "Lyophilized blend · 10/10mg*10vials · International" },
  { sku: "LOB-GHK100", name: "GHK-Cu", mg: 100, vendorCost: 90, category: "Cellular", packVials: 10, lane: "International" },
  { sku: "LOB-GHK50", name: "GHK-Cu", mg: 50, vendorCost: 50, category: "Cellular", packVials: 10, lane: "International" },
  { sku: "LOB-GHRP6", name: "GHRP-6", mg: 10, vendorCost: 60, category: "Growth", packVials: 10, lane: "International" },
  { sku: "LOB-GLOW70", name: "Glow", mg: 70, vendorCost: 200, category: "Recovery", packVials: 10, lane: "International", form: "Lyophilized blend kit · Glow 70 · International" },
  { sku: "LOB-HCG5K", name: "HCG", mg: 5000, unit: "IU", vendorCost: 80, category: "Research", packVials: 10, lane: "International", form: "Lyophilized vial · 5000 IU*10vials · International" },
  { sku: "LOB-HGH150", name: "HGH", mg: 150, unit: "IU", vendorCost: 100, category: "Growth", packVials: 1, lane: "International", form: "Pharma-grade kit · 150 IU · International" },
  { sku: "LOB-HGH310", name: "HGH", mg: 310, unit: "IU", vendorCost: 190, category: "Growth", packVials: 1, lane: "International", form: "Pharma-grade kit · 310 IU · International" },
  { sku: "LOB-IPA10", name: "Ipamorelin", mg: 10, vendorCost: 100, category: "Growth", packVials: 10, lane: "International" },
  { sku: "LOB-MT2", name: "Melanotan-2", mg: 10, vendorCost: 80, category: "Research", packVials: 10, lane: "International" },
  { sku: "LOB-MOTS10", name: "MOTS-c", mg: 10, vendorCost: 80, category: "Metabolic", packVials: 10, lane: "International" },
  { sku: "LOB-RETA12", name: "Retatrutide", mg: 12, vendorCost: 100, category: "Metabolic", packVials: 10, lane: "International" },
  { sku: "LOB-RETA30", name: "Retatrutide", mg: 30, vendorCost: 200, category: "Metabolic", packVials: 10, lane: "International" },
  { sku: "LOB-RETA60", name: "Retatrutide", mg: 60, vendorCost: 360, category: "Metabolic", packVials: 10, lane: "International" },
  { sku: "LOB-SS31", name: "SS-31", mg: 10, vendorCost: 120, category: "Cellular", packVials: 10, lane: "International" },
  { sku: "LOB-TB4", name: "TB-4 (full sequence)", mg: 10, vendorCost: 120, category: "Recovery", packVials: 10, lane: "International" },
  { sku: "LOB-TB500", name: "TB-500", mg: 12, vendorCost: 80, category: "Recovery", packVials: 10, lane: "International" },
  { sku: "LOB-TIRZ10", name: "Tirzepatide", mg: 10, vendorCost: 80, category: "Metabolic", packVials: 10, lane: "International" },
  { sku: "LOB-TIRZ30", name: "Tirzepatide", mg: 30, vendorCost: 160, category: "Metabolic", packVials: 10, lane: "International" },
  { sku: "LOB-TIRZ60", name: "Tirzepatide", mg: 60, vendorCost: 290, category: "Metabolic", packVials: 10, lane: "International" },
  { sku: "LOB-PRO62", name: "TheProLobster Plus HGH", mg: 62, unit: "IU", vendorCost: 35, category: "Growth", packVials: 1, lane: "International", form: "Large bottle · 62 IU single vial · International" },

  // —— China International HGH ——
  { sku: "LOB-HGH110-CN", name: "HGH China", mg: 110, unit: "IU", vendorCost: 50, category: "Growth", packVials: 1, lane: "China", form: "Lobster HGH 110 IU · China international" },
  { sku: "LOB-HGH150-CN", name: "HGH China", mg: 150, unit: "IU", vendorCost: 63, category: "Growth", packVials: 1, lane: "China", form: "Lobster HGH 150 IU · China international" },
  { sku: "LOB-HGH240-CN", name: "HGH China", mg: 240, unit: "IU", vendorCost: 100, category: "Growth", packVials: 1, lane: "China", form: "Lobster HGH 240 IU · China international" },

  // —— Pharma grade & PCT (international) ——
  { sku: "LOB-NGENLA24", name: "NGENLA (Somatrogon)", mg: 24, vendorCost: 160, category: "Growth", packVials: 1, lane: "Pharma", form: "Pharma · 24mg 1.2ml pen · International" },
  { sku: "LOB-NGENLA60", name: "NGENLA (Somatrogon)", mg: 60, vendorCost: 350, category: "Growth", packVials: 1, lane: "Pharma", form: "Pharma · 60mg 1.2ml pen · International" },
  { sku: "LOB-GENO36", name: "Pfizer Genotropin", mg: 36, unit: "IU", vendorCost: 220, category: "Growth", packVials: 1, lane: "Pharma", form: "Pharma · Genotropin 36 IU · International" },

  // —— Canada domestic (USD) ——
  { sku: "LOB-HGH110-CAD5", name: "HGH Canada Domestic", mg: 110, unit: "IU", vendorCost: 650, category: "Growth", packVials: 5, lane: "Canada", form: "5× Lobster HGH 110 IU · Canada domestic" },
  { sku: "LOB-HGH135-CAD5", name: "HGH Canada Domestic", mg: 135, unit: "IU", vendorCost: 775, category: "Growth", packVials: 5, lane: "Canada", form: "5× Lobster HGH 135 IU · Canada domestic" },
  { sku: "LOB-BAC30", name: "BAC Water", mg: 30, unit: "ml", vendorCost: 30, category: "Research", packVials: 1, lane: "Canada", form: "Bacteriostatic water · 30ml" },

  // —— Australia domestic (list Au$ → USD @0.65) ——
  { sku: "LOB-BPC10-AU", name: "BPC-157 AU Domestic", mg: 10, vendorCost: AUD(450), category: "Recovery", packVials: 10, lane: "Australia", form: "10mg*10vials · AU domestic (from Au$450)" },
  { sku: "LOB-BPCTB20-AU", name: "BPC-157 + TB-500 AU Domestic", mg: 20, vendorCost: AUD(700), category: "Recovery", packVials: 10, lane: "Australia", form: "BPC/TB 20mg vials · AU domestic (from Au$700)" },
  { sku: "LOB-GHK100-AU", name: "GHK-Cu AU Domestic", mg: 100, vendorCost: AUD(550), category: "Cellular", packVials: 10, lane: "Australia", form: "100mg*10vials · AU domestic (from Au$550)" },
  { sku: "LOB-HCG10K-AU", name: "HCG AU Domestic", mg: 10000, unit: "IU", vendorCost: AUD(600), category: "Research", packVials: 1, lane: "Australia", form: "10000 IU vials · AU domestic (from Au$600)" },
  { sku: "LOB-HCG5K-AU", name: "HCG AU Domestic", mg: 5000, unit: "IU", vendorCost: AUD(350), category: "Research", packVials: 10, lane: "Australia", form: "5000 IU*10vials · AU domestic (from Au$350)" },
  { sku: "LOB-HGH110-AU", name: "HGH AU Domestic", mg: 110, unit: "IU", vendorCost: AUD(250), category: "Growth", packVials: 10, lane: "Australia", form: "110 IU*10vials · AU domestic (from Au$250)" },
  { sku: "LOB-HGH150-AU", name: "HGH AU Domestic", mg: 150, unit: "IU", vendorCost: AUD(350), category: "Growth", packVials: 1, lane: "Australia", form: "150 IU vials · AU domestic (from Au$350)" },
  { sku: "LOB-HGH310-AU", name: "HGH AU Domestic", mg: 310, unit: "IU", vendorCost: AUD(650), category: "Growth", packVials: 1, lane: "Australia", form: "310 IU vials · AU domestic (from Au$650)" },
  { sku: "LOB-IPA10-AU", name: "Ipamorelin AU Domestic", mg: 10, vendorCost: AUD(500), category: "Growth", packVials: 10, lane: "Australia", form: "10mg*10vials · AU domestic (from Au$500)" },
  { sku: "LOB-MT2-AU", name: "Melanotan-2 AU Domestic", mg: 10, vendorCost: AUD(350), category: "Research", packVials: 10, lane: "Australia", form: "10mg*10vials · AU domestic (from Au$350)" },
  { sku: "LOB-RETA10-AU", name: "Retatrutide AU Domestic", mg: 10, vendorCost: AUD(600), category: "Metabolic", packVials: 10, lane: "Australia", form: "10mg*10vials · AU domestic (from Au$600)" },
  { sku: "LOB-RETA20-AU", name: "Retatrutide AU Domestic", mg: 20, vendorCost: AUD(900), category: "Metabolic", packVials: 10, lane: "Australia", form: "20mg*10vials · AU domestic (from Au$900)" },
  { sku: "LOB-RETA30-AU", name: "Retatrutide AU Domestic", mg: 30, vendorCost: AUD(1200), category: "Metabolic", packVials: 10, lane: "Australia", form: "30mg*10vials · AU domestic (from Au$1,200)" },
  { sku: "LOB-TB500-AU", name: "TB-500 AU Domestic", mg: 12, vendorCost: AUD(500), category: "Recovery", packVials: 10, lane: "Australia", form: "12mg*10vials · AU domestic (from Au$500)" },
  { sku: "LOB-TIRZ20-AU", name: "Tirzepatide AU Domestic", mg: 20, vendorCost: AUD(700), category: "Metabolic", packVials: 10, lane: "Australia", form: "20mg*10vials · AU domestic (from Au$700)" },

  // —— Peptides raws (bulk) ——
  { sku: "LOB-RAW-BPC", name: "BPC-157 Raw", mg: 1000, vendorCost: 250, category: "Recovery", packVials: 1, lane: "Raws", form: "Raw powder · bulk" },
  { sku: "LOB-RAW-GHK", name: "GHK-Cu Raw", mg: 1000, vendorCost: 15, category: "Cellular", packVials: 1, lane: "Raws", form: "Raw powder · bulk" },
  { sku: "LOB-RAW-GHRP6", name: "GHRP-6 Raw", mg: 1000, vendorCost: 200, category: "Growth", packVials: 1, lane: "Raws", form: "Raw powder · bulk" },
  { sku: "LOB-RAW-HCG5M", name: "HCG Raw", mg: 5000000, unit: "IU", vendorCost: 3.8, category: "Research", packVials: 1, lane: "Raws", form: "Raw · 5M IU bulk" },
  { sku: "LOB-RAW-HGH1G", name: "HGH Raw", mg: 1000, vendorCost: 900, category: "Growth", packVials: 1, lane: "Raws", form: "Raw powder · 1g bulk" },
  { sku: "LOB-RAW-IPA", name: "Ipamorelin Raw", mg: 1000, vendorCost: 300, category: "Growth", packVials: 1, lane: "Raws", form: "Raw powder · bulk" },
  { sku: "LOB-RAW-MOTS", name: "MOTS-c Raw", mg: 1000, vendorCost: 340, category: "Metabolic", packVials: 1, lane: "Raws", form: "Raw powder · bulk" },
  { sku: "LOB-RAW-MT2", name: "Melanotan-2 Raw", mg: 1000, vendorCost: 300, category: "Research", packVials: 1, lane: "Raws", form: "Raw powder · bulk" },
  { sku: "LOB-RAW-RETA", name: "Retatrutide Raw", mg: 1000, vendorCost: 300, category: "Metabolic", packVials: 1, lane: "Raws", form: "Raw powder · bulk" },
  { sku: "LOB-RAW-SEMA", name: "Semaglutide Raw", mg: 1000, vendorCost: 180, category: "Metabolic", packVials: 1, lane: "Raws", form: "Raw powder · bulk" },
  { sku: "LOB-RAW-SS31", name: "SS-31 Raw", mg: 1000, vendorCost: 500, category: "Cellular", packVials: 1, lane: "Raws", form: "Raw powder · bulk" },
  { sku: "LOB-RAW-TB4", name: "TB-4 Raw", mg: 1000, vendorCost: 600, category: "Recovery", packVials: 1, lane: "Raws", form: "Raw powder · bulk · full sequence" },
  { sku: "LOB-RAW-TB500", name: "TB-500 Raw", mg: 1000, vendorCost: 350, category: "Recovery", packVials: 1, lane: "Raws", form: "Raw powder · bulk · fragment" },
];

export const THE_LOBSTER_SUBMISSIONS = LOBSTER_LINES.map((line) => ({
  id: `s-${line.sku.toLowerCase()}`,
  vendorId: "v-the-lobster",
  sku: line.sku,
  name: line.name,
  form:
    line.form ||
    `Lyophilized vial · ${line.mg}${line.unit || "mg"}*${line.packVials}vials · ${line.lane}`,
  purity: line.lane === "Pharma" ? "Pharma grade" : "≥99%",
  mg: line.mg,
  unit: line.unit || "mg",
  vendorCost: line.vendorCost,
  category: line.category,
  packVials: line.packVials,
  status: "approved",
  submittedAt: "2026-06-27T00:00:00.000Z",
  reviewedAt: "2026-07-28T00:00:00.000Z",
}));
