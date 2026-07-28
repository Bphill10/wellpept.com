import {
  CHANGSHA_SUBMISSIONS,
  CHANGSHA_VENDOR,
} from "./changshaPremium";
import { ERP_SUBMISSIONS, ERP_VENDOR } from "./erpPeptide";
import {
  THE_LOBSTER_SUBMISSIONS,
  THE_LOBSTER_VENDOR,
} from "./theLobster";

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

/** Seed vendors: Changsha, ERP, The Lobster (featured), + demo pending. */
export const SEED_VENDORS = [
  CHANGSHA_VENDOR,
  ERP_VENDOR,
  THE_LOBSTER_VENDOR,
  DEMO_PENDING_VENDOR,
];

/** Seed submissions: imported vendor lists + Lobster placeholders + demo. */
export const SEED_SUBMISSIONS = [
  ...CHANGSHA_SUBMISSIONS,
  ...ERP_SUBMISSIONS,
  ...THE_LOBSTER_SUBMISSIONS,
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

/** Normalize compound names so "BPC 157" / "BPC-157" share one listing. */
export function normalizeCompoundKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(\d+(?:\.\d+)?)\s*mgs?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function variantKey(product) {
  const mg = Number(product.mg) || 0;
  const pack = Number(product.packVials) || 1;
  return `${mg}|${pack}|${product.externalOnly ? "ext" : "std"}`;
}

export function formatStrengthLabel(product) {
  const amount = Number(product.mg);
  const pack = Number(product.packVials) || 1;
  const unit = product.unit || "mg";
  if (!amount && !product.externalOnly) {
    return pack > 1 ? `${pack}-pack` : "Standard";
  }
  const amountPart = amount ? `${amount} ${unit}` : "See options";
  return pack > 1 ? `${amountPart} · ${pack}-pack` : amountPart;
}

/**
 * Collapse duplicate compound rows into one listing with MG (strength) variants.
 * Same strength across vendors keeps the lowest retail price.
 */
export function groupCatalog(products) {
  const groups = new Map();

  for (const product of products) {
    const key = normalizeCompoundKey(product.name);
    if (!key) continue;

    if (!groups.has(key)) {
      groups.set(key, {
        id: `g-${key.replace(/\s+/g, "-")}`,
        key,
        name: product.name,
        category: product.category,
        blurb: product.blurb,
        variantsByKey: new Map(),
      });
    }

    const group = groups.get(key);
    const vKey = variantKey(product);
    const prev = group.variantsByKey.get(vKey);

    const better =
      !prev ||
      (!product.externalOnly && prev.externalOnly) ||
      (!product.externalOnly &&
        !prev.externalOnly &&
        Number(product.price) < Number(prev.price)) ||
      (product.externalOnly &&
        prev.externalOnly &&
        (Number(product.mg) || 0) === (Number(prev.mg) || 0));

    if (better) {
      group.variantsByKey.set(vKey, product);
    }

    if (product.name.length < group.name.length) {
      group.name = product.name;
    }
  }

  return [...groups.values()]
    .map((group) => {
      const variants = [...group.variantsByKey.values()].sort((a, b) => {
        const mgDiff = (Number(a.mg) || 0) - (Number(b.mg) || 0);
        if (mgDiff !== 0) return mgDiff;
        return (Number(a.packVials) || 1) - (Number(b.packVials) || 1);
      });
      const defaultVariant =
        variants.find((v) => !v.externalOnly) || variants[0];
      const reviews = variants.reduce((sum, v) => sum + (v.reviews || 0), 0);
      const rating =
        variants.reduce((sum, v) => sum + (v.rating || 0), 0) /
        Math.max(variants.length, 1);

      return {
        id: group.id,
        name: group.name,
        category: group.category || defaultVariant?.category,
        blurb: group.blurb || defaultVariant?.blurb,
        variants,
        defaultVariantId: defaultVariant?.id,
        rating,
        reviews,
        badge: defaultVariant?.badge || null,
        featured: variants.some((v) => v.featured),
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
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
    const isExternal = Boolean(item.externalOnly);
    if (
      !prev ||
      isExternal ||
      Number(item.vendorCost) < Number(prev.vendorCost)
    ) {
      bySku.set(item.sku, { ...item, vendor });
    }
  }

  return [...bySku.values()].map((item, index) => {
    const isExternal = Boolean(item.externalOnly);
    const vendorCost = Number(item.vendorCost);
    const price = isExternal ? null : retailFromVendor(vendorCost);
    const packVials = Number(item.packVials) || 1;
    const featured = Boolean(item.vendor.featured);
    return {
      id: `p-${item.sku.toLowerCase()}`,
      submissionId: item.id,
      sku: item.sku,
      name: item.name,
      form: item.form,
      purity: item.purity,
      mg: item.mg,
      unit: item.unit || (/\bIU\b/i.test(item.form || "") ? "IU" : "mg"),
      packVials,
      unitLabel: packVials > 1 ? `${packVials}-pack` : "each",
      category: item.category || guessCategory(item.name),
      blurb: guessBlurb(item.name),
      vendorId: item.vendorId,
      vendor: item.vendor.name,
      vendorCost,
      price,
      priceLabel: null,
      compareAt: price ? Math.round(price * 1.18 * 100) / 100 : null,
      externalOnly: false,
      externalUrl: null,
      minOrder: Number(item.vendor.minOrder) || 0,
      shippingFlat: Number(item.vendor.shippingFlat) || 0,
      shippingNote: item.vendor.shippingNote || "",
      rating: 4.4 + ((index * 7) % 6) / 10,
      reviews: 12 + index * 9,
      inStock: true,
      ships: featured
        ? "Drop-ship via The Lobster"
        : "Drop-ships in 7–15 business days",
      badge: featured
        ? "Featured · The Lobster"
        : index < 3
          ? "Best price"
          : null,
      featured,
    };
  });
}
