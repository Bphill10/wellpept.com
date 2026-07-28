/** Public WellPept skincare — ready formulas + fresh mix-at-home serum combos. */

export const SKINCARE_PRODUCTS = [
  {
    id: "wp-serum-renew",
    name: "Renew Serum",
    line: "Ready",
    kind: "ready",
    price: 68,
    size: "30 mL",
    image: "/skincare/serum-bottle.png",
    blurb: "Lightweight daily serum for smoother-looking tone and refined texture.",
    focus: "Tone · Texture",
    texture: "Fast-absorbing gel-serum",
  },
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
    id: "wp-eye-lumen",
    name: "Lumen Eye Concentrate",
    line: "Ready",
    kind: "ready",
    price: 48,
    size: "15 mL",
    image: "/skincare/serum-1.jpg",
    blurb: "A cool, concentrated eye treatment for the look of rested brightness.",
    focus: "Brightness · Contour",
    texture: "Cooling concentrate",
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

/**
 * Fresh Mix kits — we ship separated ingredients; you combine at home
 * right before use for maximum freshness.
 */
export const SERUM_COMBOS = [
  {
    id: "wp-mix-radiance",
    name: "Radiance Fresh Mix",
    line: "Fresh Mix",
    kind: "mix",
    price: 84,
    size: "Makes ~30 mL",
    image: "/skincare/mix-ampoules.png",
    blurb:
      "Fresh vitamin C powder + ferulic vehicle. Mix when you open — bright, clear finish.",
    focus: "Brightness · Even tone",
    texture: "Mix-at-home serum",
    mixYield: "30 mL",
    shelfAfterMix: "Use within 14 days once mixed",
    ingredients: [
      { name: "L-Ascorbic acid (fresh powder)", amount: "1.5 g vial" },
      { name: "Ferulic + HA vehicle", amount: "28 mL" },
      { name: "Empty dropper bottle", amount: "1" },
    ],
    steps: [
      "Pour the vehicle into the empty dropper bottle.",
      "Add the fresh vitamin C powder.",
      "Cap, shake 30 seconds until dissolved.",
      "Use morning on clean skin. Store cool & dark.",
    ],
  },
  {
    id: "wp-mix-clarity",
    name: "Clarity Fresh Mix",
    line: "Fresh Mix",
    kind: "mix",
    price: 76,
    size: "Makes ~30 mL",
    image: "/skincare/serum-2.jpg",
    blurb:
      "Fresh niacinamide + zinc ampoule into a calm hydrating base. Mix at home for a clear, settled look.",
    focus: "Clarity · Balance",
    texture: "Mix-at-home serum",
    mixYield: "30 mL",
    shelfAfterMix: "Use within 30 days once mixed",
    ingredients: [
      { name: "Niacinamide + zinc concentrate", amount: "5 mL ampoule" },
      { name: "Multiweight HA base", amount: "25 mL" },
      { name: "Empty dropper bottle", amount: "1" },
    ],
    steps: [
      "Empty the ampoule into the dropper bottle.",
      "Add the HA base.",
      "Shake gently 15 seconds.",
      "Apply evening after cleansing.",
    ],
  },
  {
    id: "wp-mix-barrier",
    name: "Barrier Fresh Mix",
    line: "Fresh Mix",
    kind: "mix",
    price: 88,
    size: "Makes ~30 mL",
    image: "/skincare/cream-1.jpg",
    blurb:
      "Ceramide, cholesterol, and fatty-acid concentrates stay separate until you blend — cushion without heaviness.",
    focus: "Barrier · Softness",
    texture: "Mix-at-home cream-serum",
    mixYield: "30 mL",
    shelfAfterMix: "Use within 45 days once mixed",
    ingredients: [
      { name: "Ceramide concentrate", amount: "4 mL" },
      { name: "Cholesterol + fatty acids", amount: "4 mL" },
      { name: "Emollient base", amount: "22 mL" },
      { name: "Empty pump bottle", amount: "1" },
    ],
    steps: [
      "Warm the base bottle in your hands for 20 seconds.",
      "Add both concentrates.",
      "Shake firmly 40 seconds until uniform.",
      "Seal as last step day or night.",
    ],
  },
  {
    id: "wp-mix-calm",
    name: "Calm Fresh Mix",
    line: "Fresh Mix",
    kind: "mix",
    price: 72,
    size: "Makes ~30 mL",
    image: "/skincare/mist-1.jpg",
    blurb:
      "Centella and panthenol arrive sealed fresh. Combine with the soothing vehicle when you’re ready.",
    focus: "Comfort · Redness look",
    texture: "Mix-at-home serum",
    mixYield: "30 mL",
    shelfAfterMix: "Use within 30 days once mixed",
    ingredients: [
      { name: "Centella fresh extract", amount: "3 mL ampoule" },
      { name: "Panthenol boost", amount: "2 mL ampoule" },
      { name: "Soothing vehicle", amount: "25 mL" },
      { name: "Empty dropper bottle", amount: "1" },
    ],
    steps: [
      "Add both ampoules to the empty bottle.",
      "Pour in the soothing vehicle.",
      "Invert gently 10 times — do not foam.",
      "Use morning and night as needed.",
    ],
  },
  {
    id: "wp-mix-glow",
    name: "Glow Fresh Mix",
    line: "Fresh Mix",
    kind: "mix",
    price: 79,
    size: "Makes ~30 mL",
    image: "/skincare/oil-1.jpg",
    blurb:
      "Multiweight hyaluronic strands + glycerin vehicle — hydrated glass finish, mixed the day you start.",
    focus: "Plump · Glow",
    texture: "Mix-at-home serum",
    mixYield: "30 mL",
    shelfAfterMix: "Use within 45 days once mixed",
    ingredients: [
      { name: "HA complex (fresh vial)", amount: "6 mL" },
      { name: "Glycerin vehicle", amount: "24 mL" },
      { name: "Empty dropper bottle", amount: "1" },
    ],
    steps: [
      "Add HA complex to the dropper bottle.",
      "Fill with glycerin vehicle.",
      "Shake 20 seconds.",
      "Layer under cream or oil.",
    ],
  },
];

export const ALL_SKINCARE = [...SERUM_COMBOS, ...SKINCARE_PRODUCTS];

export const SKINCARE_RITUAL = [
  {
    step: "01",
    title: "Receive fresh",
    copy: "Actives ship separated so they stay potent until you open them.",
  },
  {
    step: "02",
    title: "Mix at home",
    copy: "Combine into the empty bottle in under a minute — no lab gear.",
  },
  {
    step: "03",
    title: "Apply",
    copy: "Use while fresh. Each kit lists how long the blend stays at its best.",
  },
];

export function getSkincareById(id) {
  return ALL_SKINCARE.find((p) => p.id === id) || null;
}
