/**
 * Undisclosed print-shop add-ons: we print for you, or DIY free.
 * Pricing: 10 caps $5 · 10 labels $5 · full kit $15.
 *
 * Caps: many etched name options, or 4 solid basic colors (no etch).
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
  .concat([{ peptide: "Blank / UD", short: "UD", slug: "blank" }]);

/** Four solid filament colors — no name etch. */
export const PRINT_CAP_COLORS = [
  {
    id: "black",
    label: "Black",
    hex: "#1a1a1a",
    ink: "#6a6a6a",
    sku: "BLK",
  },
  {
    id: "white",
    label: "White",
    hex: "#f2f2f0",
    ink: "#333333",
    sku: "WHT",
  },
  {
    id: "blue",
    label: "Blue",
    hex: "#1e4a8c",
    ink: "#a8c4ef",
    sku: "BLU",
  },
  {
    id: "red",
    label: "Red",
    hex: "#9b1c1c",
    ink: "#f0b0b0",
    sku: "RED",
  },
];

export function printCapColorById(id) {
  return PRINT_CAP_COLORS.find((c) => c.id === id) || PRINT_CAP_COLORS[0];
}

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

function previewColorCapSrc(colorId) {
  return `/printables/previews/cap-color-${colorId || "black"}.svg`;
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

/**
 * Pack of 10 caps — $5.
 * mode: "name" (etched short name) | "color" (solid basic color, blank face)
 */
export function printCaps10Line({
  mode = "name",
  peptide,
  short,
  colorId = "black",
} = {}) {
  if (mode === "color") {
    const color = printCapColorById(colorId);
    return basePrintLine({
      id: `print-caps10-color-${color.id}`,
      name: `10 caps · ${color.label}`,
      price: PRINT_PRICES.caps10,
      form: `10 solid ${color.label.toLowerCase()} flip-caps · no etch`,
      unitLabel: "10 caps",
      sku: `PRINT-CAP10-${color.sku}`,
      image: previewColorCapSrc(color.id),
      printKind: "caps10",
      capMode: "color",
      capColor: color.id,
      capColorLabel: color.label,
      etch: "",
      etchPeptide: "",
    });
  }

  const etch = short || shortCapName(peptide || "UD");
  const slug = etch === "UD" ? "blank" : capStlSlug(peptide || etch);
  return basePrintLine({
    id: `print-caps10-${slug}`,
    name: `10 etched caps · ${etch}`,
    price: PRINT_PRICES.caps10,
    form: `10 printed flip-caps · etched ${peptide || etch}`,
    unitLabel: "10 caps",
    sku: `PRINT-CAP10-${slug.toUpperCase()}`,
    image: previewCapSrc(etch),
    printKind: "caps10",
    capMode: "name",
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
    image: "/ud-labels/examples/KLOW_80mg_40x20_Catalog_Preview.png",
    printKind: "labels10",
    etch,
    etchPeptide: peptide,
    vialMl: ml,
    labelMass: mass,
    labelUnit: unit,
  });
}

/**
 * Print kit: case + 10 caps + 10 labels — $15.
 * Caps follow mode name|color same as printCaps10Line.
 */
export function printKitLine({
  peptide = "Peptide",
  mass = "",
  unit = "mg",
  vialMl = 3,
  capMode = "name",
  colorId = "black",
  short,
} = {}) {
  const etch = short || shortCapName(peptide);
  const ml = [3, 5, 10, 30].includes(Number(vialMl)) ? Number(vialMl) : 3;
  const strength = mass ? `${mass} ${unit}` : "custom strength";
  const color = printCapColorById(colorId);
  const capPart =
    capMode === "color"
      ? `10 ${color.label.toLowerCase()} caps`
      : `10 ${etch} caps`;
  const idKey =
    capMode === "color"
      ? `color-${color.id}-${ml}ml`
      : `${capStlSlug(peptide)}-${ml}ml`.replace(/[^a-z0-9-]/gi, "");

  return basePrintLine({
    id: `print-kit-${idKey}`,
    name:
      capMode === "color"
        ? `Print kit · ${color.label} caps`
        : `Print kit · ${etch}`,
    price: PRINT_PRICES.kit,
    form: `Case + ${capPart} + 10 wraps · ${peptide} · ${strength} · ${ml} mL`,
    unitLabel: "Print kit",
    sku:
      capMode === "color"
        ? `PRINT-KIT-${color.sku}`
        : `PRINT-KIT-${etch}`,
    image: "/ud-labels/approved/KLOW_80mg_3mL_Blue_BlackCap_Website.png",
    printKind: "kit",
    capMode,
    capColor: capMode === "color" ? color.id : "",
    capColorLabel: capMode === "color" ? color.label : "",
    etch: capMode === "color" ? "" : etch,
    etchPeptide: peptide,
    vialMl: ml,
  });
}

export function formatPrintMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `$${v.toFixed(v % 1 === 0 ? 0 : 2)}`;
}
