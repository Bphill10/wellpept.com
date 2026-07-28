import {
  CHANGSHA_SUBMISSIONS,
  CHANGSHA_VENDOR,
} from "./changshaPremium";

/** Default retail markup applied on top of vendor cost after approval. */
export const MARKUP = 0.4;

export function retailFromVendor(vendorCost) {
  return Math.round(Number(vendorCost) * (1 + MARKUP) * 100) / 100;
}

export function formatMoney(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);
}

export const CATEGORIES = [
  "All",
  "Recovery",
  "Growth",
  "Cellular",
  "Cognitive",
  "Metabolic",
  "Longevity",
  "Research",
];

const CATEGORY_MAP = {
  "BPC-157": "Recovery",
  "TB-500": "Recovery",
  "GHK-Cu": "Cellular",
  "CJC-1295 (no DAC)": "Growth",
  Ipamorelin: "Growth",
  "NAD+": "Cellular",
  Selank: "Cognitive",
  Semax: "Cognitive",
  "MOTS-c": "Metabolic",
  Epithalon: "Longevity",
};

const BLURBS = {
  "BPC-157":
    "A pentadecapeptide studied for tissue signaling and recovery pathways in research models.",
  "TB-500":
    "A synthetic fragment related to thymosin beta-4, used in cytoskeletal and mobility research.",
  "GHK-Cu":
    "Copper-binding tripeptide explored in skin, repair, and gene-expression research.",
  "CJC-1295 (no DAC)":
    "GHRH analogue used in growth-hormone axis research without drug affinity complex.",
  Ipamorelin:
    "Selective ghrelin-receptor agonist studied for pulsatile GH release models.",
  "NAD+": "Essential coenzyme for redox and cellular energy research applications.",
  Selank:
    "Synthetic tuftsin analogue examined in stress and cognitive research settings.",
  Semax: "ACTH-derived peptide used in neuroprotection and cognition research.",
  "MOTS-c":
    "Mitochondrial-derived peptide studied in metabolic regulation models.",
  Epithalon:
    "Tetrapeptide associated with telomerase and aging-pathway research.",
};

/** Demo vendor kept pending so the approval queue still has an example. */
const DEMO_PENDING_VENDOR = {
  id: "v-demo-pending",
  name: "Demo Vendor (pending)",
  email: "demo@example.com",
  status: "pending",
  minOrder: 100,
  shippingFlat: 20,
  shippingNote: "Example submission only",
  createdAt: "2026-07-27T12:00:00.000Z",
};

/** Seed vendors: Changsha Premium (imported price list) + optional demo queue item. */
export const SEED_VENDORS = [CHANGSHA_VENDOR, DEMO_PENDING_VENDOR];

/** Seed submissions: 182 approved Changsha lines + one pending demo. */
export const SEED_SUBMISSIONS = [
  ...CHANGSHA_SUBMISSIONS,
  {
    id: "s-pending-demo",
    vendorId: "v-demo-pending",
    sku: "DEMO-5MG",
    name: "Demo peptide",
    form: "Lyophilized vial · 5mg*10vials",
    purity: "≥98%",
    mg: 5,
    vendorCost: 50,
    category: "Research",
    packVials: 10,
    status: "pending",
    submittedAt: "2026-07-27T14:30:00.000Z",
    reviewedAt: null,
  },
];

export function guessCategory(name) {
  if (CATEGORY_MAP[name]) return CATEGORY_MAP[name];
  const n = name.toUpperCase();
  if (n.includes("BPC") || n.includes("TB ") || n.includes("KPV")) return "Recovery";
  if (n.includes("SEMAX") || n.includes("SELANK") || n.includes("DIHEXA")) return "Cognitive";
  if (n.includes("CJC") || n.includes("IPAM") || n.includes("IGF") || n.includes("MGF") || n.includes("GH ")) return "Growth";
  if (n.includes("NAD") || n.includes("GHK") || n.includes("LL37")) return "Cellular";
  if (n.includes("MOTS") || n.includes("AOD") || n.includes("TIRZ") || n.includes("SEMA") || n.includes("LIRA")) return "Metabolic";
  if (n.includes("EPITHAL")) return "Longevity";
  return "Research";
}

export function guessBlurb(name) {
  if (BLURBS[name]) return BLURBS[name];
  const n = name.toUpperCase();
  if (n.includes("BPC")) {
    return "Pentadecapeptide studied for tissue signaling and recovery pathways in research models.";
  }
  if (n.includes("TB") || n.includes("THYMOSIN")) {
    return "Thymosin-related peptide used in cytoskeletal and mobility research.";
  }
  if (n.includes("SEMAX") || n.includes("SELANK")) {
    return "Nootropic peptide examined in cognitive and neuroprotection research.";
  }
  if (n.includes("TIRZ") || n.includes("SEMA") || n.includes("LIRA")) {
    return "GLP-related peptide studied in metabolic and appetite research models.";
  }
  return "Research peptide for laboratory use only. Not for human consumption.";
}

/**
 * Build the public catalog from approved submissions.
 * For each SKU, keep the lowest vendor cost among approved vendors.
 */
export function buildCatalog(vendors, submissions) {
  const vendorById = Object.fromEntries(vendors.map((v) => [v.id, v]));
  const approved = submissions.filter((s) => s.status === "approved");
  const bySku = new Map();

  for (const item of approved) {
    const vendor = vendorById[item.vendorId];
    if (!vendor || vendor.status !== "approved") continue;
    const prev = bySku.get(item.sku);
    if (!prev || Number(item.vendorCost) < Number(prev.vendorCost)) {
      bySku.set(item.sku, { ...item, vendor });
    }
  }

  return [...bySku.values()].map((item, index) => {
    const price = retailFromVendor(item.vendorCost);
    const packVials = Number(item.packVials) || 1;
    return {
      id: `p-${item.sku.toLowerCase()}`,
      submissionId: item.id,
      sku: item.sku,
      name: item.name,
      form: item.form,
      purity: item.purity,
      mg: item.mg,
      packVials,
      unitLabel: packVials > 1 ? `${packVials}-pack` : "each",
      category: item.category || guessCategory(item.name),
      blurb: guessBlurb(item.name),
      vendorId: item.vendorId,
      vendor: item.vendor.name,
      vendorCost: Number(item.vendorCost),
      price,
      compareAt: Math.round(price * 1.18 * 100) / 100,
      minOrder: Number(item.vendor.minOrder) || 0,
      shippingFlat: Number(item.vendor.shippingFlat) || 0,
      shippingNote: item.vendor.shippingNote || "",
      rating: 4.4 + ((index * 7) % 6) / 10,
      reviews: 12 + index * 9,
      inStock: true,
      ships: "Drop-ships in 7–15 business days",
      badge: index < 3 ? "Best price" : null,
    };
  });
}
