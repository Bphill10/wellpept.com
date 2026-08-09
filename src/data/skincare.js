/** Public WellPept skincare: mix-and-match actives and ready formulas. */

export {
  WELLPEPT_COSMETIC_LEGAL as PEPTIDE_LEGAL,
  WELLPEPT_COSMETIC_LEGAL,
} from "./siteLegal";
import { WELLPEPT_COSMETIC_LEGAL } from "./siteLegal";

/** @deprecated import PEPTIDE_LEGAL from siteLegal — kept for local references below. */
const PEPTIDE_LEGAL = WELLPEPT_COSMETIC_LEGAL;

/** Round a dollar amount to the nearest $5 (e.g. 54 → 55, 32 → 30). */
export function roundToNearest5(n) {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0) return 0;
  return Math.round(v / 5) * 5;
}

export const SKINCARE_PRODUCTS = [
  {
    id: "wp-cream-veil",
    name: "Veil Moisture Cream",
    line: "Ready",
    kind: "ready",
    price: 55,
    size: "50 mL",
    image: "/skincare/cream-veil.webp",
    blurb: "Quiet hydration with a soft matte finish for day-to-night wear.",
    focus: "Barrier, softness",
    texture: "Silken cream",
    legal: PEPTIDE_LEGAL,
  },
  {
    id: "wp-mist-calm",
    name: "Calm Mineral Mist",
    line: "Ready",
    kind: "ready",
    price: 30,
    size: "100 mL",
    image: "/skincare/mist-calm.webp",
    blurb: "A mineral mist to reset skin between steps. Never sticky, never loud.",
    focus: "Reset, comfort",
    texture: "Fine mist",
    legal: PEPTIDE_LEGAL,
  },
  {
    id: "wp-oil-signal",
    name: "Signal Facial Oil",
    line: "Ready",
    kind: "ready",
    price: 70,
    size: "30 mL",
    image: "/skincare/oil-signal.webp",
    blurb: "A measured oil blend for glow without weight. Last step, lights low.",
    focus: "Glow, seal",
    texture: "Dry-touch oil",
    legal: PEPTIDE_LEGAL,
  },
];

/**
 * Low-cost Renew accessories — tools + travel minis.
 * Same cosmetic legal as Ready. Margin add-ons for the main-page bag.
 */
export const RENEW_ACCESSORIES = [
  {
    id: "wp-renew-10-pack",
    name: "Renew Serum Travel 10-Pack",
    line: "Travel Serum",
    kind: "kit",
    price: 499,
    size: "10 × 1 mL",
    sku: "WP-RENEW-1ML-10PK",
    image: "/skincare/wellpept-renew-10-pack.webp",
    imageContain: true,
    alt: "WellPept Renew travel set with ten frosted 1 mL serum vials and ten glass droppers in a clean presentation tray",
    blurb:
      "Ten individually sealed 1 mL Renew serum vials with ten precision glass droppers for clean, travel-ready skincare routines.",
    focus: "Single-use · travel-ready",
    legal: PEPTIDE_LEGAL,
    shipModes: ["economy", "fast"],
    ingredients: [
      { name: "Frosted Renew serum vials", amount: "Ten 1 mL" },
      { name: "Precision glass droppers", amount: "Ten" },
      { name: "Clean presentation tray", amount: "Included" },
    ],
    steps: [
      "Open one sealed 1 mL serum vial.",
      "Install one clean glass dropper.",
      "Apply to clean, intact skin as part of your cosmetic skincare routine.",
      "Keep the remaining vials sealed until needed.",
    ],
  },
  {
    id: "wp-acc-activate-kit",
    name: "Activate Mix Kit",
    line: "Tools",
    kind: "tool",
    price: 20,
    size: "Spatula · bowl · dropper",
    image: "/skincare/buffet-serum-mixing.webp",
    blurb:
      "Everything you need to tip dry actives into serum or cream without the mess.",
    focus: "Mix, activate",
    legal: PEPTIDE_LEGAL,
    shipModes: ["economy", "fast"],
  },
  {
    id: "wp-acc-dropper-duo",
    name: "Glass Dropper Duo",
    line: "Tools",
    kind: "tool",
    price: 15,
    size: "2 droppers",
    image: "/skincare/buffet-serum.webp",
    blurb: "Spare glass droppers for Renew serum bottles after you activate.",
    focus: "Refill, dose",
    legal: PEPTIDE_LEGAL,
    shipModes: ["economy", "fast"],
  },
  {
    id: "wp-acc-cloths",
    name: "Soft Ritual Cloths",
    line: "Tools",
    kind: "tool",
    price: 15,
    size: "Set of 3",
    image: "",
    blurb: "Gentle face cloths for mist resets and cream wipe-downs. Washable.",
    focus: "Cleanse, reset",
    legal: PEPTIDE_LEGAL,
    shipModes: ["economy", "fast"],
  },
  {
    id: "wp-acc-microneedle",
    name: "Microneedle Stamp",
    line: "Tools",
    kind: "tool",
    price: 25,
    size: "0.25 mm · titanium",
    sku: "WP-ACC-MN25",
    image: "/skincare/microneedle-stamp.webp",
    imageContain: true,
    alt: "Handheld titanium microneedle stamp for cosmetic serum prep",
    blurb:
      "Short titanium stamp for cosmetic serum prep. Sanitize before and after each use. Not a medical device.",
    focus: "Prep, absorb",
    legal: PEPTIDE_LEGAL,
    shipModes: ["economy", "fast"],
  },
  {
    id: "wp-mini-serum-5ml",
    name: "Serum Sample Trio",
    line: "Mini",
    kind: "mini",
    price: 35,
    size: "3 × 5 mL",
    sku: "WP-MINI-S5",
    image: "/skincare/serum-sample-trio.webp",
    imageContain: true,
    alt: "Three small 5 mL frosted serum sample bottles",
    blurb:
      "Three 5 mL frosted sample vials to try Renew serum before a full bottle. Dropper caps included.",
    focus: "Try, travel",
    texture: "Light serum",
    legal: PEPTIDE_LEGAL,
    shipModes: ["economy", "fast"],
  },
  {
    id: "wp-mini-veil",
    name: "Veil Cream Travel",
    line: "Mini",
    kind: "mini",
    price: 25,
    size: "15 mL",
    image: "/skincare/cream-veil.webp",
    blurb: "Same quiet Veil hydration in a travel size for day bags and trips.",
    focus: "Barrier, softness",
    texture: "Silken cream",
    legal: PEPTIDE_LEGAL,
    shipModes: ["economy", "fast"],
  },
  {
    id: "wp-mini-calm",
    name: "Calm Mist Travel",
    line: "Mini",
    kind: "mini",
    price: 20,
    size: "50 mL",
    image: "/skincare/mist-calm.webp",
    blurb: "Pocket Calm mist for desk resets and travel. Same mineral quiet.",
    focus: "Reset, comfort",
    texture: "Fine mist",
    legal: PEPTIDE_LEGAL,
    shipModes: ["economy", "fast"],
  },
  {
    id: "wp-mini-signal",
    name: "Signal Oil Travel",
    line: "Mini",
    kind: "mini",
    price: 30,
    size: "10 mL",
    image: "/skincare/oil-signal.webp",
    blurb: "A measured Signal glow in a smaller bottle. Last step, lights low.",
    focus: "Glow, seal",
    texture: "Dry-touch oil",
    legal: PEPTIDE_LEGAL,
    shipModes: ["economy", "fast"],
  },
];

/**
 * Four core cosmetic actives, each with a different job.
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
    price: 50,
    image: "/skincare/buffet-serum.webp",
    packaging: "twist-cap",
    blurb:
      "The staple. Flagship copper active ships dry in a twist-cap so it stays fresh on the shelf.",
  },
  {
    id: "pep-matrixyl",
    name: "Matrixyl 3000",
    inci: "Palmitoyl Tripeptide-1, Palmitoyl Tetrapeptide-7",
    need: "Lines, elasticity",
    job: "Matrix support for the look of deeper lines",
    amount: "600 mg dry complex",
    price: 35,
    image: "/skincare/peptide-vial-matrixyl.webp",
    packaging: "vial",
    blurb:
      "Classic matrix-support pair for the look of smoother static lines. Sealed dry until you mix.",
  },
  {
    id: "pep-synake",
    name: "Syn-Ake",
    inci: "Dipeptide Diaminobutyroyl Benzylamide Diacetate",
    need: "Expression lines",
    job: "Expression zones via the Syn-Ake pathway",
    amount: "250 mg dry powder",
    price: 35,
    image: "/skincare/peptide-vial-synake.webp",
    packaging: "vial",
    blurb:
      "Expression-line active inspired by snake-venom pathways. Works differently than SNAP-8.",
  },
  {
    id: "pep-snap8",
    name: "SNAP-8",
    inci: "Acetyl Octapeptide-3",
    need: "Expression, soften",
    job: "Expression lines via Argireline-family pathway",
    amount: "200 mg dry powder",
    price: 40,
    image: "/skincare/peptide-vial-snap8.webp",
    packaging: "vial",
    blurb:
      "Fourth core. SNAP-8 for the look of softer expression lines. Sealed dry until you mix.",
  },
];

/**
 * Three vehicles: two serums and one cream.
 * Pick one, then load 1 to 4 actives.
 */
export const SERUM_BASES = [
  {
    id: "base-buffet",
    name: "Renew Serum Base",
    form: "serum",
    volume: "30 mL",
    price: 30,
    image: "/skincare/WellPept-Renew-Single-Product-Hero.png",
    blurb:
      "Anti-aging face serum with HA and amino acids. Best all-rounder base for 1 to 4 dry actives.",
    bestFor: "Face serum, daily, 1 to 4 actives",
    shelfAfterMix: "Use within 21 to 30 days after activation. Refrigerate if GHK-Cu included.",
  },
  {
    id: "base-cream",
    name: "Renew Cream Base",
    form: "cream",
    volume: "50 mL",
    price: 30,
    image: "/skincare/peptide-cream.webp",
    blurb:
      "Silken moisture cream in a soft powder-blue finish. Mix dry actives into a leave-on cream instead of a dropper serum.",
    bestFor: "Face cream, richer feel, day or night",
    shelfAfterMix: "Use within 30 days after activation. Keep cool and dark. Refrigerate if GHK-Cu included.",
  },
  {
    id: "base-eye",
    name: "Eye Serum Base",
    form: "serum",
    volume: "15 mL",
    price: 25,
    image: "/skincare/eye-serum.webp",
    blurb:
      "Cooling periocular serum. Pair with SNAP-8 or Syn-Ake for crow’s feet, or add Eyeseryl as a custom.",
    bestFor: "Under-eye, crow’s feet, expression",
    shelfAfterMix: "Use within 30 days after activation. Refrigerate.",
  },
];

/**
 * Optional add-on actives beyond the core four.
 * Added as extra dry vials on the same order.
 */
export const CUSTOM_PEPTIDES = [
  {
    id: "custom-eyeseryl",
    name: "Eyeseryl",
    inci: "Acetyl Tetrapeptide-5",
    amount: "150 mg dry",
    price: 30,
    blurb: "Under-eye puff and rested-look add-on. Optional with the eye serum base.",
  },
  {
    id: "custom-argireline",
    name: "Argireline",
    inci: "Acetyl Hexapeptide-8",
    amount: "300 mg dry",
    price: 30,
    blurb: "Optional expression-line booster to stack with SNAP-8 or Syn-Ake.",
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
    title: "Pick a base",
    copy: "Renew face serum, moisture cream, or eye serum. One base per formula.",
  },
  {
    step: "02",
    title: "Add 1 to 4 actives",
    copy: "GHK-Cu (staple), Matrixyl 3000, Syn-Ake, SNAP-8. Mix freely. Add Eyeseryl and other boosters if you want.",
  },
  {
    step: "03",
    title: "Activate fresh",
    copy: "Twist-cap or tip dry powder into serum or cream. Mix. Use while fresh.",
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
 * Price a custom formula: one base + selected core actives + optional customs.
 * Total is rounded to the nearest $5.
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
  return roundToNearest5(base.price + pepTotal + customTotal);
}

/**
 * Build a cart-ready product from mix-and-match selections.
 * Requires base + at least one core active (1 to 4).
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
      : `Custom ${uniquePep.length}-active ${isCream ? "cream" : "serum"}`;

  const hasGhk = uniquePep.some((p) => p.id === "pep-ghk");
  const packaging = hasGhk ? "twist-cap" : "vial";
  const subtitle = `${uniquePep.length} active${uniquePep.length > 1 ? "s" : ""}, ${base.volume} ${base.name}`;

  const creamSteps = [
    "Open the cream jar. Keep actives dry until ready.",
    hasGhk
      ? "Twist the GHK-Cu powder cap over the cream (or tip powder in), then add any other dry vials."
      : "Tip each dry active vial into the cream (spatula / funnel included).",
    "Fold and stir 60 to 90 seconds until evenly dispersed with no dry pockets.",
    "Seal. Use on intact skin only. Follow the labeled use-by window after mixing.",
  ];

  const serumTwistSteps = [
    "Keep upright. Do not shake before activating.",
    "Twist any GHK-Cu powder cap until the chamber breaks. Dry active drops into the serum.",
    "Tip any additional dry active vials into the bottle (funnel included).",
    "Seat the dropper (ships beside the bottle) after activation. Shake 45 to 60 seconds until even.",
    "Use as directed. Follow refrigeration guidance.",
  ];

  const serumVialSteps = [
    "Confirm the serum base is in the dropper bottle.",
    "Tip each dry active vial into the base (funnel included).",
    "Cap and shake 40 to 60 seconds until fully dissolved.",
    "Use on intact skin only. Follow the labeled use-by window after mixing.",
  ];

  let steps = serumVialSteps;
  if (isCream) steps = creamSteps;
  else if (packaging === "twist-cap") steps = serumTwistSteps;

  let texture = "Mix-at-home face serum";
  if (isCream) texture = "Mix-at-home face cream";
  else if (packaging === "twist-cap") texture = "Twist-cap activated serum";

  return {
    id: `mix-${base.id}-${uniquePep.map((p) => p.id).sort().join("-")}-${uniqueCustom
      .map((p) => p.id)
      .sort()
      .join("-") || "x"}`,
    name: title,
    subtitle,
    line: isCream ? "Renew Cream" : "Renew Serum",
    kind: "mix",
    packaging,
    form: base.form || "serum",
    price,
    size: `${base.volume}, ${uniquePep.length} active${uniquePep.length > 1 ? "s" : ""}`,
    image:
      hasGhk && !isCream
        ? "/skincare/WellPept-Renew-Single-Product-Hero.png"
        : base.image,
    gallery:
      hasGhk && !isCream
        ? [
            "/skincare/WellPept-Renew-Single-Product-Hero.png",
            "/skincare/buffet-serum-mixed.webp",
          ]
        : isCream
          ? ["/skincare/peptide-cream.webp"]
          : [base.image],
    video: hasGhk && !isCream ? "/skincare/mix-activation.mp4" : null,
    videoPoster: hasGhk && !isCream ? "/skincare/buffet-serum-mixing.webp" : null,
    blurb: `Your formula: ${names.join(" + ")} in ${base.name}. Dry actives stay sealed until you activate into the ${vehicleWord}.`,
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

/** Default featured build: Renew face serum + GHK-Cu staple. */
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
    blurb: "GHK-Cu staple in Renew serum with twist-cap freshness.",
    baseId: "base-buffet",
    peptideIds: ["pep-ghk"],
    customIds: [],
  },
  {
    id: "preset-lines",
    name: "Lines + expression",
    blurb: "Matrixyl + Syn-Ake + SNAP-8 in Renew cream.",
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
    name: "All four actives",
    blurb: "GHK-Cu, Matrixyl, Syn-Ake, and SNAP-8 in one Renew serum.",
    baseId: "base-buffet",
    peptideIds: ["pep-ghk", "pep-matrixyl", "pep-synake", "pep-snap8"],
    customIds: [],
  },
];

export const ALL_SKINCARE = [...SKINCARE_PRODUCTS, ...RENEW_ACCESSORIES];

export function getSkincareById(id) {
  return ALL_SKINCARE.find((p) => p.id === id) || null;
}
