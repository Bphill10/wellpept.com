import {
  CHANGSHA_SUBMISSIONS,
  CHANGSHA_VENDOR,
} from "./changshaPremium";
import { ERP_SUBMISSIONS, ERP_VENDOR } from "./erpPeptide";
import {
  THE_LOBSTER_SUBMISSIONS,
  THE_LOBSTER_VENDOR,
} from "./theLobster";
import { resolveVialMl } from "../utils/vialArt";

export { resolveVialMl };

/** Default retail markup applied on top of vendor cost after approval.
 *  Final catalog price is marked up, then rounded UP to the nearest $5.
 */
export const MARKUP = 0.5;

export function retailFromVendor(vendorCost) {
  const marked =
    Math.round(Number(vendorCost) * (1 + MARKUP) * 100) / 100;
  if (!Number.isFinite(marked) || marked <= 0) return 0;
  return Math.ceil(marked / 5) * 5;
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
    "Body-protection compound studied for gut lining, soft-tissue, and recovery signaling in research models. Often explored where repair pathways are the focus.",
  "TB-500":
    "Synthetic thymosin β-4 fragment used in cytoskeletal, mobility, and tissue-remodeling research. Paired with BPC in many recovery protocols.",
  "TB-4 (full sequence)":
    "Full-sequence thymosin beta-4 studied for actin regulation, cell migration, and repair biology — broader than the TB-500 fragment.",
  "BPC-157 + TB-500":
    "Recovery blend combining BPC-157 and TB-500 for labs comparing dual tissue-signaling pathways in one kit.",
  "GHK-Cu":
    "Copper-binding tripeptide explored in skin, collagen, and gene-expression research. Common in cosmetic and wound-biology assays.",
  "GHK BASIC":
    "Non-copper GHK peptide studied alongside GHK-Cu for skin and remodeling research without the copper complex.",
  "AHK-CU":
    "Copper peptide examined in hair-follicle and dermal research settings.",
  "GHRP-6":
    "Ghrelin mimetic used in growth-hormone pulse and appetite-axis research. Strong GH secretagogue profile in lab models.",
  "GHRP-2":
    "GH-releasing peptide studied for pulsatile GH secretion with a different receptor bias than GHRP-6.",
  Ipamorelin:
    "Selective ghrelin-receptor agonist studied for cleaner GH pulses with less off-target hormone noise in research models.",
  "CJC-1295 (no DAC)":
    "GHRH analogue used in growth-hormone axis research without a drug-affinity complex — short-acting pulse design.",
  "CJC-1295 with DAC":
    "Long-acting GHRH analogue (with DAC) studied for extended GH-axis stimulation in research protocols.",
  Sermorelin:
    "GHRH (1-29) analogue used to probe pituitary GH release in endocrine research.",
  Tesamorelin:
    "Stabilized GHRH analogue studied in visceral-fat and GH-axis research models.",
  Hexarelin:
    "Potent GHRP secretagogue examined in cardiac and GH-release research.",
  "HGH Fragment 176-191":
    "C-terminal HGH fragment studied in fat-metabolism research without full somatropin activity.",
  HGH:
    "Recombinant growth hormone (somatropin) for GH-receptor and growth-pathway laboratory research.",
  "TheProLobster Plus HGH":
    "Lobster HGH presentation for growth-pathway research. Confirm IU labeling on the vendor line before assay design.",
  Glow:
    "Blend typically pairing recovery and copper peptides (often BPC / TB / GHK-Cu) for multi-pathway tissue research.",
  GLOW:
    "Multi-peptide recovery blend used when labs want BPC, TB-500, and GHK-Cu signaling in one research kit.",
  KLOW:
    "Multi-peptide blend oriented toward skin/hair appearance research — check the vendor form for exact component ratios.",
  Retatrutide:
    "Triple agonist at GLP-1, GIP, and glucagon receptors — studied for metabolic, weight, and energy-balance research. Incretin-class compound for lab use only.",
  Tirzepatide:
    "Dual GIP/GLP-1 receptor agonist in the incretin (GLP-1 class) family — widely studied in metabolic research. Kits are commonly 10 vials at the labeled mg each.",
  Semaglutide:
    "Selective GLP-1 receptor agonist — metabolic, glycemic, and appetite-pathway research compound. Distinct from Semax (a different nootropic peptide).",
  Liraglutide:
    "GLP-1 receptor agonist analogue studied in metabolic research; shorter-acting profile than semaglutide in clinical literature.",
  Cagrilintide:
    "Long-acting amylin analogue studied alongside incretins in satiety and metabolic research.",
  Mazdutide:
    "Dual GLP-1/glucagon agonist explored in metabolic research models.",
  Survodutide:
    "Dual GLP-1/glucagon receptor agonist studied for metabolic pathway work.",
  AOD9604:
    "Modified HGH fragment studied in lipolysis and fat-metabolism research.",
  "MOTS-c":
    "Mitochondrial-derived peptide studied in metabolic regulation, exercise, and insulin-pathway research.",
  "SS-31":
    "Mitochondria-targeted peptide (elamipretide class) explored for cellular energy and oxidative-stress research.",
  "Melanotan-2":
    "Melanocortin agonist studied for pigmentation and melanocortin-receptor research. Research use only.",
  "Melanotan 1":
    "α-MSH analogue used in pigmentation and photobiology research.",
  PT141:
    "Melanocortin receptor agonist (bremelanotide class) studied in behavioral and receptor pharmacology research.",
  HCG:
    "Human chorionic gonadotropin used in reproductive-axis and LH-receptor laboratory research.",
  "NAD+":
    "Essential redox coenzyme for cellular energy, sirtuin, and aging-pathway research.",
  Epithalon:
    "Tetrapeptide associated with telomerase and circadian/aging-pathway research.",
  Selank:
    "Synthetic tuftsin analogue examined in stress-response and cognitive research settings.",
  Semax:
    "ACTH-derived peptide used in neuroprotection and cognition research models.",
  Dihexa:
    "Angiotensin IV analogue studied for synaptic and cognitive research applications.",
  "LL-37":
    "Human cathelicidin antimicrobial peptide used in innate-immunity and host-defense research.",
  KPV:
    "α-MSH tripeptide fragment studied for inflammatory-pathway and gut-barrier research.",
  Thymalin:
    "Thymus peptide complex examined in immune-modulation research.",
  "Thymosin Alpha-1":
    "Immune-signaling peptide studied for T-cell and host-response research models.",
  DSIP:
    "Delta sleep-inducing peptide explored in sleep and stress-axis research.",
  Oxytocin:
    "Neuropeptide used in social-behavior and receptor pharmacology research.",
  "IGF-1 LR3":
    "Long-acting IGF-1 analogue studied in growth-factor and muscle-cell research.",
  MGF:
    "Mechano growth factor (IGF-1 Ec) variant examined in muscle repair research.",
  "PEG MGF":
    "PEGylated MGF studied for extended growth-factor signaling in tissue research.",
  Follistatin:
    "Activin-binding glycoprotein studied in myostatin/muscle-growth pathway research.",
  "5-AMINO-1MQ":
    "NNMT inhibitor small molecule explored in metabolic and fat-biology research.",
  "SLU-PP-332":
    "ERR agonist studied in exercise-mimetic and metabolic research models.",
  AICAR:
    "AMPK activator used in metabolic and endurance-pathway laboratory research.",
  Glutathione:
    "Endogenous antioxidant tripeptide for redox and detoxification research.",
  Cerebrolysin:
    "Neuropeptide preparation studied in neuroprotection research models.",
  Pinealon:
    "Synthetic tripeptide examined in CNS and circadian research settings.",
  Humanin:
    "Mitochondrial-derived peptide studied in cytoprotection and aging research.",
  VIP:
    "Vasoactive intestinal peptide used in inflammatory and neuroendocrine research.",
  "SNAP-8":
    "Octapeptide explored in cosmetic wrinkle-pathway and SNARE-complex research.",
  Matrixyl:
    "Palmitoyl peptide blend studied in collagen and dermal-matrix research.",
  "KissPeptin-10":
    "Kisspeptin fragment used in reproductive-axis (GnRH) research.",
  Gonadorelin:
    "GnRH analogue for pituitary gonadotropin-release research.",
  Melatonin:
    "Circadian hormone used in sleep-timing and pineal-axis research.",
  BAC:
    "Bacteriostatic water for reconstituting lyophilized research peptides in the lab.",
  "BAC WATER":
    "Bacteriostatic water for reconstituting lyophilized research peptides in the lab.",
};

export function guessBlurb(name) {
  const raw = String(name || "").trim();
  if (BLURBS[raw]) return BLURBS[raw];

  const key = Object.keys(BLURBS).find(
    (k) => k.toLowerCase() === raw.toLowerCase()
  );
  if (key) return BLURBS[key];

  const n = raw.toUpperCase().replace(/\s+/g, " ");

  if (/\bBPC\b/.test(n) && /\bTB\b/.test(n)) return BLURBS["BPC-157 + TB-500"];
  if (/\bBPC\b/.test(n)) return BLURBS["BPC-157"];
  if (/\bTB-?4\b/.test(n) || /FULL SEQUENCE/.test(n)) return BLURBS["TB-4 (full sequence)"];
  if (/\bTB-?500\b/.test(n) || /\bTB500\b/.test(n)) return BLURBS["TB-500"];
  if (/GHK/.test(n) && /CU|COPPER/.test(n)) return BLURBS["GHK-Cu"];
  if (/AHK/.test(n)) return BLURBS["AHK-CU"];
  if (/GHRP-?6/.test(n)) return BLURBS["GHRP-6"];
  if (/GHRP-?2/.test(n)) return BLURBS["GHRP-2"];
  if (/IPAMORELIN/.test(n)) return BLURBS.Ipamorelin;
  if (/CJC/.test(n) && /DAC/.test(n) && !/WITHOUT|NO DAC|WHITOUT/.test(n))
    return BLURBS["CJC-1295 with DAC"];
  if (/CJC/.test(n)) return BLURBS["CJC-1295 (no DAC)"];
  if (/SERMORELIN/.test(n)) return BLURBS.Sermorelin;
  if (/TESAMORELIN|TESA/.test(n)) return BLURBS.Tesamorelin;
  if (/HEXARELIN/.test(n)) return BLURBS.Hexarelin;
  if (/176-?191|AOD|FRAGMENT/.test(n) && /HGH|GH|AOD/.test(n))
    return BLURBS["HGH Fragment 176-191"];
  if (/AOD\s*9604|AOD9604/.test(n)) return BLURBS.AOD9604;
  if (/PROLOBSTER|SOMATROPIN|\bHGH\b/.test(n)) return BLURBS.HGH;
  if (/\bGLOW\b/.test(n)) return BLURBS.Glow;
  if (/\bKLOW\b/.test(n)) return BLURBS.KLOW;
  if (/RETATRUTIDE|RETA\b/.test(n)) return BLURBS.Retatrutide;
  if (/TIRZEPATIDE|TIRZ/.test(n)) return BLURBS.Tirzepatide;
  if (/SEMAGLUTIDE|SEMA\b/.test(n) && !/SEMAX|SELANK/.test(n))
    return BLURBS.Semaglutide;
  if (/LIRAGLUTIDE/.test(n)) return BLURBS.Liraglutide;
  if (/CAGRILINTIDE|CAGRI/.test(n)) return BLURBS.Cagrilintide;
  if (/MAZDUTIDE/.test(n)) return BLURBS.Mazdutide;
  if (/SURVODUTIDE/.test(n)) return BLURBS.Survodutide;
  if (/MOTS/.test(n)) return BLURBS["MOTS-c"];
  if (/SS-?31|ELAMIPRETIDE/.test(n)) return BLURBS["SS-31"];
  if (/MELANOTAN\s*2|MELANOTAN-2|MT-?2\b/.test(n)) return BLURBS["Melanotan-2"];
  if (/MELANOTAN\s*1|MT-?1\b/.test(n)) return BLURBS["Melanotan 1"];
  if (/PT-?141|BREMELANOTIDE/.test(n)) return BLURBS.PT141;
  if (/\bHCG\b/.test(n)) return BLURBS.HCG;
  if (/NAD/.test(n)) return BLURBS["NAD+"];
  if (/EPITHAL/.test(n)) return BLURBS.Epithalon;
  if (/SELANK/.test(n)) return BLURBS.Selank;
  if (/SEMAX/.test(n)) return BLURBS.Semax;
  if (/DIHEXA/.test(n)) return BLURBS.Dihexa;
  if (/LL-?37/.test(n)) return BLURBS["LL-37"];
  if (/\bKPV\b/.test(n)) return BLURBS.KPV;
  if (/THYMALIN|THYMULIN/.test(n)) return BLURBS.Thymalin;
  if (/THYMOSIN\s*ALPHA|TA1|Tα1/.test(n)) return BLURBS["Thymosin Alpha-1"];
  if (/\bDSIP\b/.test(n)) return BLURBS.DSIP;
  if (/OXYTOCIN/.test(n)) return BLURBS.Oxytocin;
  if (/IGF/.test(n)) return BLURBS["IGF-1 LR3"];
  if (/PEG\s*MGF/.test(n)) return BLURBS["PEG MGF"];
  if (/\bMGF\b/.test(n)) return BLURBS.MGF;
  if (/FOLLISTATIN/.test(n)) return BLURBS.Follistatin;
  if (/5-?AMINO|1MQ/.test(n)) return BLURBS["5-AMINO-1MQ"];
  if (/SLU-?PP|SLUPP/.test(n)) return BLURBS["SLU-PP-332"];
  if (/AICAR/.test(n)) return BLURBS.AICAR;
  if (/GLUTATHIONE/.test(n)) return BLURBS.Glutathione;
  if (/CEREBROLYSIN/.test(n)) return BLURBS.Cerebrolysin;
  if (/PINEALON/.test(n)) return BLURBS.Pinealon;
  if (/HUMANIN/.test(n)) return BLURBS.Humanin;
  if (/\bVIP\b/.test(n)) return BLURBS.VIP;
  if (/SNAP-?8/.test(n)) return BLURBS["SNAP-8"];
  if (/MATRIXYL/.test(n)) return BLURBS.Matrixyl;
  if (/KISSPEPTIN|KISSPETIN/.test(n)) return BLURBS["KissPeptin-10"];
  if (/GONADORELIN/.test(n)) return BLURBS.Gonadorelin;
  if (/MELATONIN/.test(n)) return BLURBS.Melatonin;
  if (/BAC|BACTERIOSTATIC|STERILE WATER|\bWATER\b/.test(n)) return BLURBS["BAC WATER"];

  return "Research compound for laboratory use only. Review COA and vendor notes before assay design — not for human consumption.";
}
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
  const vialMl = resolveVialMl(product);
  return `${mg}|${pack}|${vialMl}|${product.externalOnly ? "ext" : "std"}`;
}

export function formatStrengthLabel(product) {
  const amount = Number(product.mg);
  const pack = Number(product.packVials) || 1;
  const unit = product.unit || "mg";
  const form = String(product.form || "");
  const vialMl = resolveVialMl(product);
  const lane =
    form.includes("· International")
      ? "Intl"
      : form.includes("· China")
        ? "China"
        : form.includes("· Canada")
          ? "Canada"
          : form.includes("· AU ") || form.includes("AU domestic")
            ? "AU"
            : form.includes("Raw")
              ? "Raw"
              : form.includes("Pharma")
                ? "Pharma"
                : null;

  if (!amount && !product.externalOnly) {
    return pack > 1 ? `${pack}-pack · ${vialMl} mL` : `${vialMl} mL vial`;
  }

  let amountPart;
  if (unit === "ml") amountPart = `${amount} ml`;
  else if (amount >= 1000000 && unit === "IU")
    amountPart = `${amount / 1000000}M IU`;
  else if (amount >= 1000 && unit === "mg" && form.includes("Raw"))
    amountPart = amount === 1000 ? "1g raw" : `${amount} mg raw`;
  else amountPart = `${amount} ${unit}`;

  const packPart = pack > 1 ? ` · ${pack}-pack` : "";
  const vialPart = ` · ${vialMl} mL`;
  const lanePart = lane ? ` · ${lane}` : "";
  return `${amountPart}${vialPart}${packPart}${lanePart}`;
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
    const vialMl = resolveVialMl(item);
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
      vialMl,
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
        ? "US shipping only · featured vendor · allow up to 4 weeks"
        : "US shipping only · drop-ships in 7–15 business days",
      badge: featured
        ? "Featured vendor"
        : index < 3
          ? "Best price"
          : null,
      featured,
    };
  });
}
