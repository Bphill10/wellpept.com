/** Public WellPept skincare — mix-and-match topical peptides + ready formulas. */

/** Shared legal language for any peptide-containing product. */
export const PEPTIDE_LEGAL = {
  short:
    "For external cosmetic use only. Not for injection, ingestion, inhalation, or any clinical / medical use. Not evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent any disease.",
  medium:
    "WellPept Fresh Mix products contain cosmetic-grade topical peptides sold for external use on intact skin only. They are not drugs, not sterile injectables, and not for compounding into injectable preparations. Keep out of reach of children. Discontinue if irritation occurs. Consult a qualified professional if you are pregnant, nursing, or under medical care.",
  long: [
    "COSMETIC USE ONLY — External application on intact skin. Not for injection, IV, IM, SQ, oral, nasal, ocular (unless labeled as an eye serum for periocular skin), or any other route.",
    "NOT A DRUG — These products are not intended to diagnose, treat, cure, or prevent any disease. No therapeutic or medical claims are made.",
    "NOT FDA EVALUATED — Statements have not been evaluated by the U.S. Food and Drug Administration.",
    "NOT FOR RESEARCH / CLINICAL COMPOUNDING — Do not use as a starting material for sterile compounding, pharmacy preparations, or laboratory assays requiring research-grade reagents.",
    "FRESH ACTIVATION — Dry peptides are sealed separately to limit shelf degradation. Once mixed into the base, use within the stated window and refrigerate when directed. Potency after activation is not guaranteed beyond labeled guidance.",
    "ASSUMPTION OF RISK — By purchasing you confirm you understand topical peptides may cause irritation or sensitization, will follow mix instructions, and will not misrepresent or misuse these products.",
    "AGE / JURISDICTION — You must be 18+ and purchasing for lawful personal cosmetic use in the United States. Void where prohibited.",
  ],
};

export const SKINCARE_PRODUCTS = [
  {
    id: "wp-cream-veil",
    name: "Veil Moisture Cream",
    line: "Ready",
    kind: "ready",
    price: 54,
    size: "50 mL",
    image: "/skincare/cream-1.jpg",
    blurb: "Quiet hydration with a soft matte finish — built for day-to-night wear.",
    focus: "Barrier · Softness",
    texture: "Silken cream",
  },
  {
    id: "wp-mist-calm",
    name: "Calm Mineral Mist",
    line: "Ready",
    kind: "ready",
    price: 32,
    size: "100 mL",
    image: "/skincare/mist-1.jpg",
    blurb: "A mineral mist to reset skin between steps — never sticky, never loud.",
    focus: "Reset · Comfort",
    texture: "Fine mist",
  },
  {
    id: "wp-oil-signal",
    name: "Signal Facial Oil",
    line: "Ready",
    kind: "ready",
    price: 72,
    size: "30 mL",
    image: "/skincare/oil-1.jpg",
    blurb: "A measured oil blend for glow without weight — last step, lights low.",
    focus: "Glow · Seal",
    texture: "Dry-touch oil",
  },
];

/** Four core topical peptides — pick 1, 2, 3, or all four for one serum. */
export const PEPTIDES = [
  {
    id: "pep-ghk",
    name: "GHK-Cu",
    inci: "Copper Tripeptide-1",
    need: "Firm · Repair · Glow",
    amount: "1 g dry powder",
    price: 48,
    image: "/skincare/ghk-twist-cap.png",
    packaging: "twist-cap",
    blurb:
      "Flagship copper peptide. Ships dry in a twist-cap chamber so it doesn’t fade on the shelf.",
  },
  {
    id: "pep-matrixyl",
    name: "Matrixyl 3000",
    inci: "Palmitoyl Tripeptide-1 · Palmitoyl Tetrapeptide-7",
    need: "Lines · Elasticity",
    amount: "600 mg dry complex",
    price: 36,
    image: "/skincare/serum-bottle.png",
    packaging: "vial",
    blurb:
      "The classic matrix signal peptide pair for the look of smoother lines — sealed dry until you mix.",
  },
  {
    id: "pep-argireline",
    name: "Argireline",
    inci: "Acetyl Hexapeptide-8",
    need: "Expression lines",
    amount: "300 mg dry powder",
    price: 32,
    image: "/skincare/serum-2.jpg",
    packaging: "vial",
    blurb:
      "Expression-zone peptide for forehead and crow’s feet areas — fresh, not aisle-aged.",
  },
  {
    id: "pep-eyeseryl",
    name: "Eyeseryl",
    inci: "Acetyl Tetrapeptide-5",
    need: "Under-eye",
    amount: "150 mg dry powder",
    price: 28,
    image: "/skincare/serum-1.jpg",
    packaging: "vial",
    blurb:
      "Periocular peptide for the look of less puff and more rested brightness under the eye.",
  },
];

/** Three serum bases — choose one vehicle for your peptide blend. */
export const SERUM_BASES = [
  {
    id: "base-buffet",
    name: "Buffet-Style Base",
    volume: "30 mL",
    price: 28,
    image: "/skincare/mix-ampoules.png",
    blurb:
      "Ordinary Buffet–type multi-peptide / HA / amino-acid matrix. Best all-rounder for face serums.",
    bestFor: "Face · daily · 1–4 peptides",
    shelfAfterMix: "Use within 21–30 days after activation · refrigerate if GHK-Cu included",
  },
  {
    id: "base-ha",
    name: "Light HA Base",
    volume: "30 mL",
    price: 22,
    image: "/skincare/serum-bottle.png",
    blurb:
      "Clean multiweight hyaluronic + glycerin vehicle. Light, fast, ideal when you want peptides alone to lead.",
    bestFor: "Face · layering · lighter feel",
    shelfAfterMix: "Use within 30–45 days after activation · cool & dark",
  },
  {
    id: "base-eye",
    name: "Eye Vehicle",
    volume: "15 mL",
    price: 24,
    image: "/skincare/serum-1.jpg",
    blurb:
      "Cooling periocular base sized for under-eye use. Pair with Eyeseryl and optionally a micro dose of GHK-Cu.",
    bestFor: "Under-eye · Eyeseryl ± GHK-Cu",
    shelfAfterMix: "Use within 30 days after activation · refrigerate",
  },
];

/**
 * Optional add-on custom peptides beyond the core four.
 * Added as extra dry vials on the same order.
 */
export const CUSTOM_PEPTIDES = [
  {
    id: "custom-syncoll",
    name: "Syn-Coll",
    inci: "Palmitoyl Tripeptide-5",
    amount: "250 mg dry",
    price: 34,
    blurb: "Collagen-signal peptide add-on for firmness-focused builds.",
  },
  {
    id: "custom-snap8",
    name: "SNAP-8",
    inci: "Acetyl Octapeptide-3",
    amount: "200 mg dry",
    price: 38,
    blurb: "Expression-line add-on related to Argireline’s family — optional stack.",
  },
  {
    id: "custom-copper",
    name: "Extra GHK-Cu",
    inci: "Copper Tripeptide-1",
    amount: "+500 mg dry",
    price: 30,
    blurb: "Boost copper load in your bottle beyond the standard 1 g chamber.",
  },
];

export const SKINCARE_RITUAL = [
  {
    step: "01",
    title: "Pick a base",
    copy: "Buffet-style, light HA, or eye vehicle — one bottle per mix.",
  },
  {
    step: "02",
    title: "Add 1–4 peptides",
    copy: "Mix and match GHK-Cu, Matrixyl, Argireline, and Eyeseryl. Add custom vials if you want more.",
  },
  {
    step: "03",
    title: "Activate fresh",
    copy: "Twist-cap or tip dry powder into the base. Shake. Use while potent.",
  },
];

export function getPeptide(id) {
  return PEPTIDES.find((p) => p.id === id) || null;
}

export function getBase(id) {
  return SERUM_BASES.find((b) => b.id === id) || null;
}

export function getCustomPeptide(id) {
  return CUSTOM_PEPTIDES.find((p) => p.id === id) || null;
}

/**
 * Price a custom serum: one base + selected core peptides + optional customs.
 */
export function priceSerumBuild({ baseId, peptideIds = [], customIds = [] }) {
  const base = getBase(baseId);
  if (!base) return 0;
  const pepTotal = peptideIds.reduce((sum, id) => {
    const p = getPeptide(id);
    return sum + (p?.price || 0);
  }, 0);
  const customTotal = customIds.reduce((sum, id) => {
    const p = getCustomPeptide(id);
    return sum + (p?.price || 0);
  }, 0);
  return base.price + pepTotal + customTotal;
}

/**
 * Build a cart-ready product from mix-and-match selections.
 * Requires base + at least one core peptide (1–4).
 * Legal acknowledgment is enforced in the UI before add-to-bag.
 */
export function buildSerumProduct({
  baseId,
  peptideIds = [],
  customIds = [],
}) {
  const base = getBase(baseId);
  const peptides = peptideIds.map(getPeptide).filter(Boolean);
  const customs = customIds.map(getCustomPeptide).filter(Boolean);

  if (!base || peptides.length < 1 || peptides.length > 4) return null;

  const uniquePep = [...new Map(peptides.map((p) => [p.id, p])).values()];
  const uniqueCustom = [...new Map(customs.map((p) => [p.id, p])).values()];
  const price = priceSerumBuild({
    baseId,
    peptideIds: uniquePep.map((p) => p.id),
    customIds: uniqueCustom.map((p) => p.id),
  });

  const names = uniquePep.map((p) => p.name);
  const title =
    uniquePep.length === 1
      ? `${uniquePep[0].name} · ${base.name}`
      : `Custom ${uniquePep.length}-Peptide · ${base.name}`;

  const hasGhk = uniquePep.some((p) => p.id === "pep-ghk");
  const packaging = hasGhk ? "twist-cap" : "vial";
  const subtitle = `${uniquePep.length} peptide${uniquePep.length > 1 ? "s" : ""} · ${base.volume} ${base.name}`;

  return {
    id: `mix-${base.id}-${uniquePep.map((p) => p.id).sort().join("-")}-${uniqueCustom
      .map((p) => p.id)
      .sort()
      .join("-") || "x"}`,
    name: title,
    subtitle,
    line: "Fresh Mix · Custom",
    kind: "mix",
    packaging,
    price,
    size: `${base.volume} · ${uniquePep.length} peptide${uniquePep.length > 1 ? "s" : ""}`,
    image: hasGhk ? "/skincare/ghk-twist-cap.png" : base.image,
    gallery: hasGhk
      ? ["/skincare/ghk-twist-cap.png", "/skincare/ghk-twist-howto.png"]
      : [base.image],
    blurb: `Your mix: ${names.join(" + ")} in ${base.name}. Dry peptides stay sealed until you activate into the base.`,
    focus: uniquePep.map((p) => p.need).join(" · "),
    texture: packaging === "twist-cap" ? "Twist-cap activated serum" : "Mix-at-home peptide serum",
    mixYield: base.volume,
    shelfAfterMix: base.shelfAfterMix,
    base,
    peptides: uniquePep,
    customs: uniqueCustom,
    buildSummary: {
      base: base.name,
      peptides: uniquePep.map((p) => p.name),
      customs: uniqueCustom.map((p) => p.name),
    },
    ingredients: [
      { name: base.name, amount: base.volume },
      ...uniquePep.map((p) => ({
        name: `${p.name} (${p.inci})`,
        amount: p.amount,
      })),
      ...uniqueCustom.map((p) => ({
        name: `Custom add-on · ${p.name} (${p.inci})`,
        amount: p.amount,
      })),
    ],
    steps:
      packaging === "twist-cap"
        ? [
            "Keep upright. Do not shake before activating.",
            "Twist any GHK-Cu powder cap until the chamber breaks — dry peptide drops into the serum.",
            "Tip any additional dry peptide vials into the bottle (funnel included).",
            "Seat the dropper. Shake 45–60 seconds until even. Use as directed. Follow refrigeration guidance.",
          ]
        : [
            "Pour or confirm the serum base is in the dropper bottle.",
            "Tip each dry peptide vial into the base (funnel included).",
            "Cap and shake 40–60 seconds until fully dissolved.",
            "Use on intact skin only. Follow the labeled use-by window after mixing.",
          ],
    legal: PEPTIDE_LEGAL,
  };
}

/** Default featured build: Buffet base + GHK-Cu. */
export const FLAGSHIP_BUILD = {
  baseId: "base-buffet",
  peptideIds: ["pep-ghk"],
  customIds: [],
};

export const FLAGSHIP_SERUM = buildSerumProduct(FLAGSHIP_BUILD);

/** Preset quick picks (still mix-and-match under the hood). */
export const SERUM_PRESETS = [
  {
    id: "preset-ghk",
    name: "Flagship copper",
    blurb: "GHK-Cu in Buffet base — twist-cap freshness.",
    baseId: "base-buffet",
    peptideIds: ["pep-ghk"],
    customIds: [],
  },
  {
    id: "preset-lines",
    name: "Lines + expression",
    blurb: "Matrixyl + Argireline in one face serum.",
    baseId: "base-buffet",
    peptideIds: ["pep-matrixyl", "pep-argireline"],
    customIds: [],
  },
  {
    id: "preset-eye",
    name: "Under-eye",
    blurb: "Eyeseryl + micro GHK-Cu in eye vehicle.",
    baseId: "base-eye",
    peptideIds: ["pep-eyeseryl", "pep-ghk"],
    customIds: [],
  },
  {
    id: "preset-all",
    name: "All four peptides",
    blurb: "GHK-Cu, Matrixyl, Argireline, Eyeseryl — one bottle.",
    baseId: "base-buffet",
    peptideIds: ["pep-ghk", "pep-matrixyl", "pep-argireline", "pep-eyeseryl"],
    customIds: [],
  },
];

export const ALL_SKINCARE = [...SKINCARE_PRODUCTS];

export function getSkincareById(id) {
  return ALL_SKINCARE.find((p) => p.id === id) || null;
}
