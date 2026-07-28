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
 * Fresh Mix kits — topical peptides shipped dry/separated so they don’t
 * sit degrading in a store bottle. You blend into a stable base at home.
 *
 * Lineup covers the most-asked needs:
 * - GHK-Cu → firm / repair / glow (flagship)
 * - Matrixyl 3000 → lines & elasticity look
 * - Argireline → expression lines
 * - Eye peptide → under-eye puffiness / dark-circle look
 * - Multi Signal → Matrixyl + Argireline all-rounder
 */
export const SERUM_COMBOS = [
  {
    id: "wp-mix-ghk",
    name: "GHK-Cu Fresh Mix",
    line: "Fresh Mix · Flagship",
    kind: "mix",
    featured: true,
    packaging: "twist-cap",
    need: "Firm · Repair · Glow",
    price: 98,
    size: "30 mL serum · 1 g dry GHK-Cu in twist cap",
    image: "/skincare/ghk-twist-cap.png",
    gallery: [
      "/skincare/ghk-twist-cap.png",
      "/skincare/ghk-twist-howto.png",
    ],
    blurb:
      "Dry GHK-Cu powder lives in the twist-on cap — sealed fresh until you activate. Twist to break the chamber and drop 1 g copper peptide into the Buffet-style serum below.",
    focus: "Firm look · Repair look · Glow",
    texture: "Twist-cap activated copper serum",
    mixYield: "30 mL",
    shelfAfterMix: "Use within 21 days after activation · refrigerate once mixed",
    ingredients: [
      {
        name: "Dry GHK-Cu powder (copper tripeptide-1) — loaded in twist-cap chamber",
        amount: "1 g",
      },
      {
        name: "Buffet-style multi-peptide serum base in bottle",
        amount: "30 mL",
      },
      { name: "Breakaway twist-cap activator", amount: "1 (pre-loaded)" },
    ],
    steps: [
      "Keep upright. Do not shake before activating.",
      "Twist the powder cap firmly until you feel the chamber break open — dry GHK-Cu drops into the serum.",
      "Remove the spent powder chamber if it separates; seat the dropper top.",
      "Shake 45–60 seconds until fully dissolved (blue-green tint). Use 2–4 drops evening. Refrigerate after activation.",
    ],
  },
  {
    id: "wp-mix-matrixyl",
    name: "Matrixyl Fresh Mix",
    line: "Fresh Mix",
    kind: "mix",
    need: "Lines · Elasticity",
    price: 86,
    size: "Makes ~30 mL · Matrixyl 3000",
    image: "/skincare/serum-bottle.png",
    blurb:
      "Fresh Matrixyl 3000 (palmitoyl tripeptide-1 + palmitoyl tetrapeptide-7) — the store-shelf classic for the look of smoother lines, mixed only when you open.",
    focus: "Lines · Elasticity look",
    texture: "Mix-at-home peptide serum",
    mixYield: "30 mL",
    shelfAfterMix: "Use within 45 days once mixed · cool & dark",
    ingredients: [
      {
        name: "Fresh Matrixyl 3000 complex (palmitoyl tripeptide-1 + tetrapeptide-7)",
        amount: "600 mg vial",
      },
      { name: "Hydrating peptide vehicle (HA + glycerin)", amount: "30 mL" },
      { name: "Empty dropper bottle", amount: "1" },
      { name: "Mini funnel + mix card", amount: "1" },
    ],
    steps: [
      "Pour the hydrating vehicle into the empty dropper bottle.",
      "Add the Matrixyl 3000 vial.",
      "Shake 40 seconds until clear and even.",
      "Use morning and night. Layer under moisturizer.",
    ],
  },
  {
    id: "wp-mix-argireline",
    name: "Argireline Fresh Mix",
    line: "Fresh Mix",
    kind: "mix",
    need: "Expression lines",
    price: 78,
    size: "Makes ~30 mL · acetyl hexapeptide-8",
    image: "/skincare/serum-2.jpg",
    blurb:
      "Fresh acetyl hexapeptide-8 (Argireline) for the look of softened expression lines — forehead and crow’s feet zones without sitting months in a warm aisle.",
    focus: "Expression lines · Smooth look",
    texture: "Mix-at-home peptide serum",
    mixYield: "30 mL",
    shelfAfterMix: "Use within 45 days once mixed · cool & dark",
    ingredients: [
      { name: "Fresh acetyl hexapeptide-8 (Argireline)", amount: "300 mg vial" },
      { name: "Light HA serum base", amount: "30 mL" },
      { name: "Empty dropper bottle", amount: "1" },
      { name: "Mini funnel + mix card", amount: "1" },
    ],
    steps: [
      "Add the light HA base to the empty dropper bottle.",
      "Tip in the Argireline vial.",
      "Shake 30 seconds until fully dissolved.",
      "Pat onto expression zones morning and night. Avoid rubbing hard.",
    ],
  },
  {
    id: "wp-mix-eye",
    name: "Eye Peptide Fresh Mix",
    line: "Fresh Mix",
    kind: "mix",
    need: "Under-eye",
    price: 74,
    size: "Makes ~15 mL · eye-strength",
    image: "/skincare/serum-1.jpg",
    blurb:
      "Fresh acetyl tetrapeptide-5 (Eyeseryl-type) plus a touch of GHK-Cu — built for the under-eye look of less puff and more rested brightness.",
    focus: "Puffiness look · Bright under-eye",
    texture: "Mix-at-home eye serum",
    mixYield: "15 mL",
    shelfAfterMix: "Use within 30 days once mixed · refrigerate",
    ingredients: [
      { name: "Fresh acetyl tetrapeptide-5", amount: "150 mg vial" },
      { name: "Fresh GHK-Cu micro-dose", amount: "100 mg vial" },
      { name: "Cooling eye vehicle (HA + caffeine-free)", amount: "15 mL" },
      { name: "Empty roller / dropper", amount: "1" },
    ],
    steps: [
      "Pour the eye vehicle into the empty bottle.",
      "Add both peptide vials.",
      "Shake 35 seconds until uniform (light blue tint is normal).",
      "Tap a rice-grain amount under each eye morning and night.",
    ],
  },
  {
    id: "wp-mix-multi",
    name: "Multi Signal Fresh Mix",
    line: "Fresh Mix",
    kind: "mix",
    need: "All-rounder",
    price: 92,
    size: "Makes ~30 mL · Matrixyl + Argireline",
    image: "/skincare/ingredients.jpg",
    blurb:
      "The one bottle for most faces: fresh Matrixyl 3000 + Argireline into one vehicle — lines and expression zones, mixed fresh so neither peptide sits degrading.",
    focus: "Lines · Expression · Daily",
    texture: "Mix-at-home multi-peptide serum",
    mixYield: "30 mL",
    shelfAfterMix: "Use within 30 days once mixed · cool & dark",
    ingredients: [
      { name: "Fresh Matrixyl 3000 complex", amount: "400 mg vial" },
      { name: "Fresh acetyl hexapeptide-8 (Argireline)", amount: "200 mg vial" },
      { name: "Buffet-style multi-peptide serum base", amount: "30 mL" },
      { name: "Empty dropper bottle", amount: "1" },
      { name: "Mini funnel + mix card", amount: "1" },
    ],
    steps: [
      "Pour the Buffet-style base into the empty dropper bottle.",
      "Add Matrixyl, then Argireline.",
      "Shake 50 seconds until fully clear.",
      "Use morning and night as your main face peptide serum.",
    ],
  },
];

export const FLAGSHIP_SERUM =
  SERUM_COMBOS.find((p) => p.featured) || SERUM_COMBOS[0];

export const ALL_SKINCARE = [...SERUM_COMBOS, ...SKINCARE_PRODUCTS];

export const SKINCARE_RITUAL = [
  {
    step: "01",
    title: "Powder stays dry",
    copy: "Peptide sits sealed in the twist-cap chamber — not dissolving on a store shelf.",
  },
  {
    step: "02",
    title: "Twist to activate",
    copy: "Twist the cap to break the chamber. Dry powder drops into the serum.",
  },
  {
    step: "03",
    title: "Shake & use",
    copy: "Shake until clear, then apply while the peptide is still fresh.",
  },
];

export function getSkincareById(id) {
  return ALL_SKINCARE.find((p) => p.id === id) || null;
}
