/**
 * Undisclosed print-shop add-ons: we print caps, case, and labels for you.
 * Separate from free STL / label DIY downloads.
 */

import { CAP_SHORT_NAMES, shortCapName, capStlSlug } from "./capNames";

export const PRINT_VENDOR_ID = "wellpept-print";

/** US print fulfillment — not a peptide warehouse lane. */
export const PRINT_SHIPPING = {
  shippingFlat: 8,
  ships: "Printed in US · 5–10 days",
  shippingNote: "US print shop · 5–10 days · $8 shipping (waived if already shipping Warehouse A peptides)",
  minOrder: 0,
};

export const PRINT_PRICES = {
  capEach: 2.5,
  capPack10: 18,
  case: 32,
  labels10: 12,
  capsLabelsBundle: 28,
  fullKit: 55,
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

/** Single etched cap (qty of identical etch). Pack pricing when qty is multiple of 10. */
export function printCapLine({ peptide, short, qty = 1 } = {}) {
  const etch = short || shortCapName(peptide || "UD");
  const slug = etch === "UD" ? "blank" : capStlSlug(peptide || etch);
  const q = Math.max(1, Math.min(100, Number(qty) || 1));
  const pack = q >= 10 && q % 10 === 0;
  if (pack) {
    return {
      line: basePrintLine({
        id: `print-cap-pack-${slug}-${q}`,
        name: `Etched caps · ${etch}`,
        price: PRINT_PRICES.capPack10 * (q / 10),
        form: `${q} printed caps · ${peptide || etch}`,
        unitLabel: `${q} caps`,
        sku: `PRINT-CAP-${slug.toUpperCase()}-x${q}`,
        image: previewCapSrc(etch),
        printKind: "cap",
        etch,
        etchPeptide: peptide || etch,
      }),
      qty: 1,
    };
  }
  return {
    line: basePrintLine({
      id: `print-cap-${slug}`,
      name: `Etched cap · ${etch}`,
      price: PRINT_PRICES.capEach,
      form: `Printed flip-cap · ${peptide || etch}`,
      unitLabel: "1 cap",
      sku: `PRINT-CAP-${slug.toUpperCase()}`,
      image: previewCapSrc(etch),
      printKind: "cap",
      etch,
      etchPeptide: peptide || etch,
    }),
    qty: q,
  };
}

export function printCaseLine() {
  return basePrintLine({
    id: "print-vial-case",
    name: "10-vial kit case",
    price: PRINT_PRICES.case,
    form: "Printed base + lid + pin",
    unitLabel: "1 case",
    sku: "PRINT-CASE",
    image: "/printables/previews/free-prints-case-hero.webp",
    printKind: "case",
  });
}

export function printLabelsLine({
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
    id: `print-labels-${idKey}`,
    name: `Vial labels · ${etch}`,
    price: PRINT_PRICES.labels10,
    form: `10 wraps · ${peptide} · ${strength} · ${ml} mL bottle`,
    unitLabel: "10 labels",
    sku: `PRINT-LBL-${etch}`,
    image: "/printables/previews/free-prints-labels-hero.webp",
    printKind: "labels",
    etch,
    etchPeptide: peptide,
    vialMl: ml,
    labelMass: mass,
    labelUnit: unit,
  });
}

/** 10 matching caps + 10 labels for one peptide. */
export function printCapsLabelsBundleLine({
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
    id: `print-bundle-${idKey}`,
    name: `Caps + labels · ${etch}`,
    price: PRINT_PRICES.capsLabelsBundle,
    form: `10 caps + 10 wraps · ${peptide} · ${strength} · ${ml} mL`,
    unitLabel: "Bundle",
    sku: `PRINT-BND-${etch}`,
    image: "/printables/previews/free-prints-caps-hero.webp",
    printKind: "bundle",
    etch,
    etchPeptide: peptide,
    vialMl: ml,
  });
}

/** Case + 10 caps + 10 labels. */
export function printFullKitLine({
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
    id: `print-fullkit-${idKey}`,
    name: `Full print kit · ${etch}`,
    price: PRINT_PRICES.fullKit,
    form: `Case + 10 caps + 10 wraps · ${peptide} · ${strength} · ${ml} mL`,
    unitLabel: "Full kit",
    sku: `PRINT-KIT-${etch}`,
    image: "/printables/previews/free-prints-case-hero.webp",
    printKind: "fullkit",
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
