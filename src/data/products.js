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

/** Seed vendors shown before any local submissions exist. */
export const SEED_VENDORS = [
  {
    id: "v-northlab",
    name: "NorthLab Research",
    email: "supply@northlab.example",
    status: "approved",
    minOrder: 150,
    shippingFlat: 18,
    shippingNote: "Cold-pack USPS Priority",
    createdAt: "2026-07-10T12:00:00.000Z",
  },
  {
    id: "v-apex",
    name: "Apex Peptide Supply",
    email: "desk@apex.example",
    status: "approved",
    minOrder: 200,
    shippingFlat: 22,
    shippingNote: "2-day insulated",
    createdAt: "2026-07-12T12:00:00.000Z",
  },
  {
    id: "v-clearwater",
    name: "Clearwater Bio",
    email: "orders@clearwater.example",
    status: "approved",
    minOrder: 100,
    shippingFlat: 15,
    shippingNote: "Ground with ice pack",
    createdAt: "2026-07-14T12:00:00.000Z",
  },
];

/** Seed price-list lines awaiting/approved in the catalog pipeline. */
export const SEED_SUBMISSIONS = [
  {
    id: "s-bpc",
    vendorId: "v-northlab",
    sku: "BPC-157-5MG",
    name: "BPC-157",
    form: "Lyophilized vial",
    purity: "99.1%",
    mg: 5,
    vendorCost: 28,
    category: "Recovery",
    status: "approved",
    submittedAt: "2026-07-20T10:00:00.000Z",
    reviewedAt: "2026-07-20T16:00:00.000Z",
  },
  {
    id: "s-tb500",
    vendorId: "v-northlab",
    sku: "TB500-5MG",
    name: "TB-500",
    form: "Lyophilized vial",
    purity: "98.9%",
    mg: 5,
    vendorCost: 32,
    category: "Recovery",
    status: "approved",
    submittedAt: "2026-07-20T10:00:00.000Z",
    reviewedAt: "2026-07-20T16:00:00.000Z",
  },
  {
    id: "s-ghk",
    vendorId: "v-northlab",
    sku: "GHK-CU-50MG",
    name: "GHK-Cu",
    form: "Lyophilized vial",
    purity: "99.0%",
    mg: 50,
    vendorCost: 24,
    category: "Cellular",
    status: "approved",
    submittedAt: "2026-07-20T10:00:00.000Z",
    reviewedAt: "2026-07-20T16:00:00.000Z",
  },
  {
    id: "s-cjc",
    vendorId: "v-apex",
    sku: "CJC-2MG",
    name: "CJC-1295 (no DAC)",
    form: "Lyophilized vial",
    purity: "98.7%",
    mg: 2,
    vendorCost: 36,
    category: "Growth",
    status: "approved",
    submittedAt: "2026-07-22T11:00:00.000Z",
    reviewedAt: "2026-07-22T17:00:00.000Z",
  },
  {
    id: "s-ipa",
    vendorId: "v-apex",
    sku: "IPA-5MG",
    name: "Ipamorelin",
    form: "Lyophilized vial",
    purity: "99.2%",
    mg: 5,
    vendorCost: 30,
    category: "Growth",
    status: "approved",
    submittedAt: "2026-07-22T11:00:00.000Z",
    reviewedAt: "2026-07-22T17:00:00.000Z",
  },
  {
    id: "s-nad",
    vendorId: "v-apex",
    sku: "NAD-500MG",
    name: "NAD+",
    form: "Lyophilized vial",
    purity: "99.4%",
    mg: 500,
    vendorCost: 42,
    category: "Cellular",
    status: "approved",
    submittedAt: "2026-07-22T11:00:00.000Z",
    reviewedAt: "2026-07-22T17:00:00.000Z",
  },
  {
    id: "s-selank",
    vendorId: "v-clearwater",
    sku: "SEL-5MG",
    name: "Selank",
    form: "Lyophilized vial",
    purity: "98.8%",
    mg: 5,
    vendorCost: 26,
    category: "Cognitive",
    status: "approved",
    submittedAt: "2026-07-25T09:00:00.000Z",
    reviewedAt: "2026-07-25T15:00:00.000Z",
  },
  {
    id: "s-semax",
    vendorId: "v-clearwater",
    sku: "SEM-5MG",
    name: "Semax",
    form: "Lyophilized vial",
    purity: "99.0%",
    mg: 5,
    vendorCost: 27,
    category: "Cognitive",
    status: "approved",
    submittedAt: "2026-07-25T09:00:00.000Z",
    reviewedAt: "2026-07-25T15:00:00.000Z",
  },
  {
    id: "s-mots",
    vendorId: "v-clearwater",
    sku: "MOTS-10MG",
    name: "MOTS-c",
    form: "Lyophilized vial",
    purity: "98.6%",
    mg: 10,
    vendorCost: 48,
    category: "Metabolic",
    status: "approved",
    submittedAt: "2026-07-25T09:00:00.000Z",
    reviewedAt: "2026-07-25T15:00:00.000Z",
  },
  {
    id: "s-epit",
    vendorId: "v-clearwater",
    sku: "EPIT-20MG",
    name: "Epithalon",
    form: "Lyophilized vial",
    purity: "99.1%",
    mg: 20,
    vendorCost: 34,
    category: "Longevity",
    status: "approved",
    submittedAt: "2026-07-25T09:00:00.000Z",
    reviewedAt: "2026-07-25T15:00:00.000Z",
  },
  {
    id: "s-pending-demo",
    vendorId: "v-apex",
    sku: "AOD-5MG",
    name: "AOD-9604",
    form: "Lyophilized vial",
    purity: "98.5%",
    mg: 5,
    vendorCost: 29,
    category: "Metabolic",
    status: "pending",
    submittedAt: "2026-07-27T14:30:00.000Z",
    reviewedAt: null,
  },
];

export function guessCategory(name) {
  return CATEGORY_MAP[name] || "Research";
}

export function guessBlurb(name) {
  return (
    BLURBS[name] ||
    "Research peptide for laboratory use only. Not for human consumption."
  );
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
    return {
      id: `p-${item.sku.toLowerCase()}`,
      submissionId: item.id,
      sku: item.sku,
      name: item.name,
      form: item.form,
      purity: item.purity,
      mg: item.mg,
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
      ships: "Drop-ships in 2–4 business days",
      badge: index < 3 ? "Best price" : null,
    };
  });
}
