/**
 * Undisclosed print-shop add-ons: we print for you, or DIY free.
 * Pricing: 10 caps $5 · 10 labels $5 · full kit $15.
 */

import { CAP_SHORT_NAMES, shortCapName, capStlSlug } from "./capNames";

export const PRINT_VENDOR_ID = "wellpept-print";

/** US print fulfillment — not a peptide warehouse lane. */
export const PRINT_SHIPPING = {
  shippingFlat: 8,
  ships: "Printed in US · 5–10 days",
  shippingNote:
    "US print shop · 5–10 days · $8 shipping (waived if already shipping Warehouse A peptides)",
  minOrder: 0,
};

export const PRINT_PRICES = {
  caps10: 5,
  labels10: 5,
  kit: 15,
};

/** Cap etch options for the order picker (deduped short names). */
export const PRINT_CAP_OPTIONS = Object.entries(CAP_SHORT_NAMES)
  .filter(([name], i, arr) => {
    const short = CAP_SHORT_NAMES[name];
    return arr.findIndex(([, s]) => s === short) === i;
  })
  .map(([peptide, short]) => ({ peptide, short, slug: capStlSlug(peptide) }))
  .concat([{ peptide: "Blank", short: "UD", slug: "blank" }]);

function previewCapSrc(short) {
  const slug =
    !short || short === "UD"
      ? "blank"
      : String(short)
          .toLowerCase()
          .replace(/\+/g, "plus")
          .replace(/[^a-z0-9]+/g, "");
  return `/printables/previews/cap-${slug}.svg`;
}

function basePrintLine(overrides = {}) {
  return {
    vendor: "WellPept",
    vendorId: PRINT_VENDOR_ID,
    category: "Prints",
    print: true,
    skin: false,
    mg: 0,
    unit: "",
    packVials: 1,
    warehouseId: "",
    warehouseLabel: "",
    ...PRINT_SHIPPING,
    ...overrides,
  };
}

/** Pack of 10 etched caps — $5. */
export function printCaps10Line({ peptide, short } = {}) {
  const etch = short || shortCapName(peptide || "UD");
  const slug = etch === "UD" ? "blank" : capStlSlug(peptide || etch);
  return basePrintLine({
    id: `print-caps10-${slug}`,
    name: `10 etched caps · ${etch}`,
    price: PRINT_PRICES.caps10,
    form: `10 printed flip-caps · ${peptide || etch}`,
    unitLabel: "10 caps",
    sku: `PRINT-CAP10-${slug.toUpperCase()}`,
    image: previewCapSrc(etch),
    printKind: "caps10",
    etch,
    etchPeptide: peptide || etch,
  });
}

/** Pack of 10 vial wrap labels — $5. */
export function printLabels10Line({
  peptide = "Peptide",
  mass = "",
  unit = "mg",
  vialMl = 3,
} = {}) {
  const etch = shortCapName(peptide);
  const ml = [3, 5, 10, 30].includes(Number(vialMl)) ? Number(vialMl) : 3;
  const strength = mass ? `${mass} ${unit}` : "custom strength";
  const idKey = `${capStlSlug(peptide)}-${ml}ml`.replace(/[^a-z0-9-]/gi, "");
  return basePrintLine({
    id: `print-labels10-${idKey}`,
    name: `10 vial labels · ${etch}`,
    price: PRINT_PRICES.labels10,
    form: `10 wraps · ${peptide} · ${strength} · ${ml} mL bottle`,
    unitLabel: "10 labels",
    sku: `PRINT-LBL10-${etch}`,
    image: "/printables/previews/free-prints-labels-hero.webp",
    printKind: "labels10",
    etch,
    etchPeptide: peptide,
    vialMl: ml,
    labelMass: mass,
    labelUnit: unit,
  });
}

/** Print kit: case + 10 caps + 10 labels — $15. */
export function printKitLine({
  peptide = "Peptide",
  mass = "",
  unit = "mg",
  vialMl = 3,
} = {}) {
  const etch = shortCapName(peptide);
  const ml = [3, 5, 10, 30].includes(Number(vialMl)) ? Number(vialMl) : 3;
  const strength = mass ? `${mass} ${unit}` : "custom strength";
  const idKey = `${capStlSlug(peptide)}-${ml}ml`.replace(/[^a-z0-9-]/gi, "");
  return basePrintLine({
    id: `print-kit-${idKey}`,
    name: `Print kit · ${etch}`,
    price: PRINT_PRICES.kit,
    form: `Case + 10 caps + 10 wraps · ${peptide} · ${strength} · ${ml} mL`,
    unitLabel: "Print kit",
    sku: `PRINT-KIT-${etch}`,
    image: "/printables/previews/free-prints-case-hero.webp",
    printKind: "kit",
    etch,
    etchPeptide: peptide,
    vialMl: ml,
  });
}

export function formatPrintMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `$${v.toFixed(v % 1 === 0 ? 0 : 2)}`;
}
