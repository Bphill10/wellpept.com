/**
 * Cool things to 3D-print (or order) for a peptide research kit.
 * status: "ready" = STL on site · "labels" = calculator · "soon" = designed next
 */

export const PRINT_IDEAS = [
  {
    id: "etched-caps",
    title: "Etched flip-caps",
    blurb:
      "Short-name etched caps from a big name library, or solid black / white / blue / red with blank STL.",
    status: "ready",
    tag: "Organization",
    href: "/printables/undisclosed-cap-plate.stl",
    download: "undisclosed-cap-plate.stl",
    image: "/printables/previews/caps-collage.svg",
  },
  {
    id: "kit-case",
    title: "10-vial hinged kit case",
    blurb:
      "Clear hinged case like the featured KLOW photo — 2×5 vials, 4 round cap wells. Print in clear PETG/PLA.",
    status: "ready",
    tag: "Travel",
    href: "/printables/undisclosed-vial-case-plate.stl",
    download: "undisclosed-vial-case-plate.stl",
    image: "/undisclosed-hero-kit-sm.webp",
  },
  {
    id: "wrap-labels",
    title: "Clinical wrap labels",
    blurb:
      "Black-on-white die-cut wraps with strength, BAC line, QR — free download from Free prints or the calculator.",
    status: "labels",
    tag: "Labels",
    image: "/undisclosed-label-flat.webp",
  },
  {
    id: "angled-rack",
    title: "Angled benchtop rack",
    blurb:
      "Tilted 5-slot rack so label text faces you — perfect for reconstituting without hunting for names.",
    status: "soon",
    tag: "Bench",
  },
  {
    id: "syringe-station",
    title: "Syringe + vial station",
    blurb:
      "One vial cradle plus 5 insulin-syringe parks — weighted base so nothing tips on the fridge shelf.",
    status: "soon",
    tag: "Bench",
  },
  {
    id: "fridge-tray",
    title: "Butter-drawer fridge tray",
    blurb:
      "Low-profile 2×5 or 3×5 insert sized for the fridge butter drawer — stackable modules for a growing catalog.",
    status: "soon",
    tag: "Fridge",
  },
  {
    id: "bac-stand",
    title: "BAC water bottle stand",
    blurb:
      "Dedicated cradle for 30 mL bacteriostatic water so it doesn’t roll and crush vials beside it.",
    status: "soon",
    tag: "Bench",
  },
  {
    id: "travel-snap",
    title: "Day-trip snap case",
    blurb:
      "Compact snap box: a few 3 mL vials, BAC slot, alcohol pads, and a syringe channel for weekends away.",
    status: "soon",
    tag: "Travel",
  },
  {
    id: "rugged-mag",
    title: "Rugged magnetic-lid box",
    blurb:
      "Hard-shell vial box with magnet closure — drop-resistant for gym bags and glove boxes.",
    status: "soon",
    tag: "Travel",
  },
  {
    id: "cap-rings",
    title: "Color-code cap rings",
    blurb:
      "Snap-on collar rings under the flip-cap — color by category (metabolic, recovery, nootropic) without rewriting labels.",
    status: "soon",
    tag: "Organization",
  },
  {
    id: "cap-carousel",
    title: "Spare-cap carousel",
    blurb:
      "Spinning or grid tray that holds a full set of etched caps so spares never vanish into a drawer.",
    status: "soon",
    tag: "Organization",
  },
  {
    id: "dose-park",
    title: "Weekly dose syringe park",
    blurb:
      "Seven labeled syringe slots for pre-drawn research doses — fridge-safe PLA/PETG, names facing out.",
    status: "soon",
    tag: "Fridge",
  },
  {
    id: "wipe-caddy",
    title: "Alcohol wipe caddy",
    blurb:
      "Open-top wipe holder that sits next to the reconstitution station — one-handed grab.",
    status: "soon",
    tag: "Bench",
  },
  {
    id: "draw-cradle",
    title: "Vial drawing cradle",
    blurb:
      "Hands-free vial clamp while you draw — fits 3–30 mL necks so the bottle doesn’t skate across the bench.",
    status: "soon",
    tag: "Bench",
  },
  {
    id: "label-jig",
    title: "Label wrap jig",
    blurb:
      "Roller cradle that holds the vial while you apply wrap labels straight — no bubbles, no crooked QR.",
    status: "soon",
    tag: "Labels",
  },
  {
    id: "coa-badge",
    title: "COA / QR badge card",
    blurb:
      "Credit-card sized holder for a printed COA QR or kit ID — clips into the kit case lid frame.",
    status: "soon",
    tag: "Organization",
  },
  {
    id: "cold-sleeve",
    title: "Ice-brick cold sleeve",
    blurb:
      "Nest that grips a slim ice pack around the kit case for short warm-weather runs between fridge and lab.",
    status: "soon",
    tag: "Travel",
  },
  {
    id: "cap-opener",
    title: "Flip-cap opener tool",
    blurb:
      "Small pry tool sized for aluminum flip-off seals — cleaner than keys, won’t scar the septum.",
    status: "soon",
    tag: "Bench",
  },
  {
    id: "multi-size-insert",
    title: "Multi-size vial insert",
    blurb:
      "One tray with pockets for 3 / 5 / 10 / 30 mL so BAC, blends, and singles live in one grid.",
    status: "soon",
    tag: "Organization",
  },
  {
    id: "desk-display",
    title: "Desk display stand",
    blurb:
      "Photogenic riser for 3–5 vials — Undisclosed monogram optional — for inventory shots and unboxings.",
    status: "soon",
    tag: "Display",
  },
];

export const PRINT_IDEA_STATUS = {
  ready: { label: "Free STL", tone: "ready" },
  labels: { label: "Free / order", tone: "ready" },
  soon: { label: "Coming soon", tone: "soon" },
};
