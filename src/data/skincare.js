/** Public WellPept skincare: mix-and-match topical peptides and ready formulas. */

/** Shared legal language for any peptide-containing product. */
export const PEPTIDE_LEGAL = {
  short:
    "For external cosmetic use only. Not for injection, ingestion, inhalation, or any clinical or medical use. Not evaluated by the FDA. Not intended to diagnose, treat, cure, or prevent any disease.",
  medium:
    "WellPept Fresh Mix products contain cosmetic-grade topical peptides sold for external use on intact skin only. They are not drugs, not sterile injectables, and not for compounding into injectable preparations. Keep out of reach of children. Discontinue if irritation occurs. Consult a qualified professional if you are pregnant, nursing, or under medical care.",
  long: [
    "COSMETIC USE ONLY. External application on intact skin. Not for injection, IV, IM, SQ, oral, nasal, ocular (unless labeled as an eye serum for periocular skin), or any other route.",
    "NOT A DRUG. These products are not intended to diagnose, treat, cure, or prevent any disease. No therapeutic or medical claims are made.",
    "NOT FDA EVALUATED. Statements have not been evaluated by the U.S. Food and Drug Administration.",
    "NOT FOR RESEARCH OR CLINICAL COMPOUNDING. Do not use as a starting material for sterile compounding, pharmacy preparations, or laboratory assays requiring research-grade reagents.",
    "FRESH ACTIVATION. Dry peptides are sealed separately to limit shelf degradation. Once mixed into the base, use within the stated window and refrigerate when directed. Potency after activation is not guaranteed beyond labeled guidance.",
    "ASSUMPTION OF RISK. By purchasing you confirm you understand topical peptides may cause irritation or sensitization, will follow mix instructions, and will not misrepresent or misuse these products.",
    "AGE AND JURISDICTION. You must be 18+ and purchasing for lawful personal cosmetic use in the United States. Void where prohibited.",
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
    blurb: "Quiet hydration with a soft matte finish for day-to-night wear.",
    focus: "Barrier, softness",
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
    blurb: "A mineral mist to reset skin between steps. Never sticky, never loud.",
    focus: "Reset, comfort",
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
    blurb: "A measured oil blend for glow without weight. Last step, lights low.",
    focus: "Glow, seal",
    texture: "Dry-touch oil",
  },
];

/**
 * Four core topical peptides, each with a different job.
 * GHK-Cu is the staple; pick 1 to 4 into one vehicle (serum or cream).
 */
export const PEPTIDES = [
  {
    id: "pep-ghk",
    name: "GHK-Cu",
    inci: "Copper Tripeptide-1",
    need: "Firm, repair, glow",
    job: "Staple copper for a firmer, brighter look",
    amount: "1 g dry powder",
    price: 48,
    image: "/skincare/buffet-serum.png",
    packaging: "twist-cap",
    blurb:
      "The staple. Flagship copper peptide ships dry in a twist-cap so it doesn’t fade on the shelf.",
  },
  {
    id: "pep-matrixyl",
    name: "Matrixyl 3000",
    inci: "Palmitoyl Tripeptide-1, Palmitoyl Tetrapeptide-7",
    need: "Lines, elasticity",
    job: "Matrix support for the look of deeper lines",
    amount: "600 mg dry complex",
    price: 36,
    image: "/skincare/serum-bottle.png",
    packaging: "vial",
    blurb:
      "Classic matrix-signal pair for the look of smoother static lines. Sealed dry until you mix.",
  },
  {
    id: "pep-synake",
    name: "Syn-Ake",
    inci: "Dipeptide Diaminobutyroyl Benzylamide Diacetate",
    need: "Expression lines",
    job: "Expression zones via the Syn-Ake pathway",
    amount: "250 mg dry powder",
    price: 34,
    image: "/skincare/serum-2.jpg",
    packaging: "vial",
    blurb:
      "Snake-venom inspired peptide for expression-line zones. Works differently than SNAP-8’s Argireline-family pathway.",
  },
  {
    id: "pep-snap8",
    name: "SNAP-8",
    inci: "Acetyl Octapeptide-3",
    need: "Expression, soften",
    job: "Expression lines via Argireline-family octapeptide",
    amount: "200 mg dry powder",
    price: 38,
    image: "/skincare/serum-1.jpg",
    packaging: "vial",
    blurb:
      "Fourth core. SNAP-8 for the look of softer expression lines, a longer cousin of Argireline, sealed dry until mix.",
  },
];

/**
 * Three vehicles: two serums and one cream.
 * Pick one, then load 1 to 4 peptides.
 */
export const SERUM_BASES = [
  {
    id: "base-buffet",
    name: "Buffet-Style Serum",
    form: "serum",
    volume: "30 mL",
    price: 28,
    image: "/skincare/buffet-serum.png",
    blurb:
      "Ordinary Buffet type multi-peptide / HA / amino-acid serum. Best all-rounder face vehicle.",
    bestFor: "Face serum, daily, 1 to 4 peptides",
    shelfAfterMix: "Use within 21 to 30 days after activation. Refrigerate if GHK-Cu included.",
  },
  {
    id: "base-cream",
    name: "Peptide Cream Base",
    form: "cream",
    volume: "50 mL",
    price: 32,
    image: "/skincare/peptide-cream.png",
    blurb:
      "Silken moisture cream vehicle. Mix dry peptides into a leave-on cream instead of a dropper serum.",
    bestFor: "Face cream, richer feel, day or night",
    shelfAfterMix: "Use within 30 days after activation. Keep cool and dark. Refrigerate if GHK-Cu included.",
  },
  {
    id: "base-eye",
    name: "Eye Serum Vehicle",
    form: "serum",
    volume: "15 mL",
    price: 24,
    image: "/skincare/eye-serum.png",
    blurb:
      "Cooling periocular serum. Pair with SNAP-8 or Syn-Ake for crow’s feet, or add Eyeseryl as a custom.",
    bestFor: "Under-eye, crow’s feet, expression",
    shelfAfterMix: "Use within 30 days after activation. Refrigerate.",
  },
];

/**
 * Optional add-on custom peptides beyond the core four.
 * Added as extra dry vials on the same order.
 */
export const CUSTOM_PEPTIDES = [
  {
    id: "custom-eyeseryl",
    name: "Eyeseryl",
    inci: "Acetyl Tetrapeptide-5",
    amount: "150 mg dry",
    price: 28,
    blurb: "Under-eye puff and rested-look add-on. Optional with the eye serum vehicle.",
  },
  {
    id: "custom-argireline",
    name: "Argireline",
    inci: "Acetyl Hexapeptide-8",
    amount: "300 mg dry",
    price: 32,
    blurb: "Optional hexapeptide to stack with SNAP-8 or Syn-Ake.",
  },
  {
    id: "custom-copper",
    name: "Extra GHK-Cu",
    inci: "Copper Tripeptide-1",
    amount: "+500 mg dry",
    price: 30,
    blurb: "Boost copper load beyond the standard 1 g staple chamber.",
  },
];

export const SKINCARE_RITUAL = [
  {
    step: "01",
    title: "Pick a vehicle",
    copy: "Buffet serum, peptide cream, or eye serum. One base per mix.",
  },
  {
    step: "02",
    title: "Add 1 to 4 peptides",
    copy: "GHK-Cu (staple), Matrixyl 3000, Syn-Ake, SNAP-8. Mix freely. Add Eyeseryl and other customs if you want.",
  },
  {
    step: "03",
    title: "Activate fresh",
    copy: "Twist-cap or tip dry powder into serum or cream. Mix. Use while potent.",
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
 * Requires base + at least one core peptide (1 to 4).
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
  const isCream = base.form === "cream";
  const vehicleWord = isCream ? "cream" : "serum";
  const title =
    uniquePep.length === 1
      ? `${uniquePep[0].name} in ${base.name}`
      : `Custom ${uniquePep.length}-Peptide ${isCream ? "Cream" : "Serum"}`;

  const hasGhk = uniquePep.some((p) => p.id === "pep-ghk");
  const packaging = hasGhk ? "twist-cap" : "vial";
  const subtitle = `${uniquePep.length} peptide${uniquePep.length > 1 ? "s" : ""}, ${base.volume} ${base.name}`;

  const creamSteps = [
    "Open the cream jar. Keep peptides dry until ready.",
    hasGhk
      ? "Twist the GHK-Cu powder cap over the cream (or tip powder in), then add any other dry vials."
      : "Tip each dry peptide vial into the cream (spatula / funnel included).",
    "Fold and stir 60 to 90 seconds until evenly dispersed with no dry pockets.",
    "Seal. Use on intact skin only. Follow the labeled use-by window after mixing.",
  ];

  const serumTwistSteps = [
    "Keep upright. Do not shake before activating.",
    "Twist any GHK-Cu powder cap until the chamber breaks. Dry peptide drops into the serum.",
    "Tip any additional dry peptide vials into the bottle (funnel included).",
    "Seat the dropper (ships beside the bottle) after activation. Shake 45 to 60 seconds until even.",
    "Use as directed. Follow refrigeration guidance.",
  ];

  const serumVialSteps = [
    "Confirm the serum base is in the dropper bottle.",
    "Tip each dry peptide vial into the base (funnel included).",
    "Cap and shake 40 to 60 seconds until fully dissolved.",
    "Use on intact skin only. Follow the labeled use-by window after mixing.",
  ];

  let steps = serumVialSteps;
  if (isCream) steps = creamSteps;
  else if (packaging === "twist-cap") steps = serumTwistSteps;

  let texture = "Mix-at-home peptide serum";
  if (isCream) texture = "Mix-at-home peptide cream";
  else if (packaging === "twist-cap") texture = "Twist-cap activated serum";

  return {
    id: `mix-${base.id}-${uniquePep.map((p) => p.id).sort().join("-")}-${uniqueCustom
      .map((p) => p.id)
      .sort()
      .join("-") || "x"}`,
    name: title,
    subtitle,
    line: isCream ? "Fresh Mix Cream" : "Fresh Mix Serum",
    kind: "mix",
    packaging,
    form: base.form || "serum",
    price,
    size: `${base.volume}, ${uniquePep.length} peptide${uniquePep.length > 1 ? "s" : ""}`,
    image: hasGhk && !isCream ? "/skincare/buffet-serum.png" : base.image,
    gallery:
      hasGhk && !isCream
        ? ["/skincare/buffet-serum.png", "/skincare/peptide-cream.png", "/skincare/eye-serum.png"]
        : isCream
          ? ["/skincare/peptide-cream.png", "/skincare/buffet-serum.png", "/skincare/eye-serum.png"]
          : [base.image, "/skincare/buffet-serum.png", "/skincare/peptide-cream.png"],
    blurb: `Your mix: ${names.join(" + ")} in ${base.name}. Dry peptides stay sealed until you activate into the ${vehicleWord}.`,
    focus: uniquePep.map((p) => p.need).join(", "),
    texture,
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
        name: `Custom add-on: ${p.name} (${p.inci})`,
        amount: p.amount,
      })),
    ],
    steps,
    legal: PEPTIDE_LEGAL,
  };
}

/** Default featured build: Buffet serum + GHK-Cu staple. */
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
    blurb: "GHK-Cu staple in Buffet serum with twist-cap freshness.",
    baseId: "base-buffet",
    peptideIds: ["pep-ghk"],
    customIds: [],
  },
  {
    id: "preset-lines",
    name: "Lines + expression",
    blurb: "Matrixyl + Syn-Ake + SNAP-8 in peptide cream.",
    baseId: "base-cream",
    peptideIds: ["pep-matrixyl", "pep-synake", "pep-snap8"],
    customIds: [],
  },
  {
    id: "preset-eye",
    name: "Crow’s feet focus",
    blurb: "SNAP-8 + Syn-Ake in eye serum. Add Eyeseryl as a custom if you want.",
    baseId: "base-eye",
    peptideIds: ["pep-snap8", "pep-synake"],
    customIds: [],
  },
  {
    id: "preset-all",
    name: "All four peptides",
    blurb: "GHK-Cu, Matrixyl, Syn-Ake, and SNAP-8 in one Buffet serum.",
    baseId: "base-buffet",
    peptideIds: ["pep-ghk", "pep-matrixyl", "pep-synake", "pep-snap8"],
    customIds: [],
  },
];

export const ALL_SKINCARE = [...SKINCARE_PRODUCTS];

export function getSkincareById(id) {
  return ALL_SKINCARE.find((p) => p.id === id) || null;
}
