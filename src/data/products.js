import {
  CHANGSHA_SUBMISSIONS,
  CHANGSHA_VENDOR,
} from "./changshaPremium";
import { isChangshaFocused, isChangshaSellable } from "./catalogFocus";
import { resolveVialMl, resolveVialUnit, resolvePowderColor } from "../utils/vialArt";

export { resolveVialMl, resolveVialUnit, resolvePowderColor };

/** Retail = 2× Changsha vendor cost, then rounded UP to the nearest $5. */
export const RETAIL_MULTIPLIER = 2;
/** @deprecated use RETAIL_MULTIPLIER — kept as alias (markup fraction = multiplier − 1). */
export const MARKUP = RETAIL_MULTIPLIER - 1;

export function retailFromVendor(vendorCost) {
  const marked =
    Math.round(Number(vendorCost) * RETAIL_MULTIPLIER * 100) / 100;
  if (!Number.isFinite(marked) || marked <= 0) return 0;
  return Math.ceil(marked / 5) * 5;
}

export function formatMoney(n) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(n) || 0);
}

/** Live Undisclosed vendors only. */
export const ACTIVE_VENDOR_IDS = new Set([
  "v-changsha-premium",
]);

/** Never expose supply-source names on the storefront. */
export function displayVendorName(name, vendorId = "") {
  const id = String(vendorId || "");
  if (id === "v-changsha-premium" || id === "v-changsha") return "";
  const cleaned = String(name || "")
    .replace(/\bpremium\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (/changsha/i.test(cleaned)) return "";
  return cleaned;
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
  "TA-1": "Recovery",
  "Thymosin Alpha-1": "Recovery",
  "Vitamin B12": "Cellular",
  "Vitamin B": "Cellular",
  "GHK-Cu": "Cellular",
  "CJC-1295 (no DAC)": "Growth",
  Ipamorelin: "Growth",
  "NAD+": "Cellular",
  Selank: "Cognitive",
  Semax: "Cognitive",
  "MOTS-c": "Metabolic",
  Epithalon: "Longevity",
};

/** Brief summaries: what it is + what labs study it for (1–2 sentences). */
const BLURBS = {
  "BPC-157":
    "BPC-157 is a body-protection pentadecapeptide. Labs use it to study gut lining, soft-tissue repair, and recovery signaling in research models.",
  "TB-500":
    "TB-500 is a synthetic fragment of thymosin β-4. It is used in cytoskeletal, cell-migration, and tissue-remodeling research, often alongside BPC-157.",
  "TB-4 (full sequence)":
    "Full-sequence thymosin β-4 regulates actin and cell migration. Researchers choose it when they need the broader biology beyond the TB-500 fragment.",
  "BPC-157 + TB-500":
    "A recovery blend that pairs BPC-157 with TB-500. Useful when a lab wants both tissue-signaling pathways in one research kit.",
  "GHK-Cu":
    "GHK-Cu is a copper-binding tripeptide. It is studied in skin, collagen, wound biology, and gene-expression assays.",
  "GHK BASIC":
    "Non-copper GHK peptide used beside GHK-Cu when remodeling research should exclude the copper complex.",
  "AHK-CU":
    "AHK-Cu is a copper peptide examined in hair-follicle and dermal research settings.",
  "GHRP-6":
    "GHRP-6 is a ghrelin mimetic and strong GH secretagogue. Labs use it for growth-hormone pulse and appetite-axis research.",
  "GHRP-2":
    "GHRP-2 is a GH-releasing peptide studied for pulsatile GH secretion, with a different receptor bias than GHRP-6.",
  Ipamorelin:
    "Ipamorelin is a selective ghrelin-receptor agonist. It is studied for cleaner GH pulses with less off-target hormone noise in research models.",
  "CJC-1295 (no DAC)":
    "A short-acting GHRH analogue without a drug-affinity complex. Used for pulsed growth-hormone axis research.",
  "CJC-1295 with DAC":
    "Long-acting GHRH analogue with DAC. Studied when protocols need extended GH-axis stimulation.",
  Sermorelin:
    "Sermorelin is GHRH (1-29). Endocrine labs use it to probe pituitary GH release.",
  Tesamorelin:
    "Stabilized GHRH analogue studied in visceral-fat and GH-axis research models.",
  Hexarelin:
    "Potent GHRP secretagogue examined in cardiac and GH-release research.",
  "HGH Fragment 176-191":
    "C-terminal fragment of HGH studied in fat-metabolism research without full somatropin activity.",
  HGH:
    "Recombinant growth hormone (somatropin). Used for GH-receptor, growth, and metabolic pathway laboratory work.",
  "TheProLobster Plus HGH":
    "Lobster HGH presentation for growth-pathway research. Confirm IU labeling on the line before assay design.",
  Glow:
    "Multi-peptide blend (often BPC, TB, and GHK-Cu). Built for labs comparing recovery and copper-peptide pathways together.",
  GLOW:
    "Multi-peptide recovery blend used when labs want BPC, TB-500, and GHK-Cu signaling in one research kit.",
  KLOW:
    "80 mg blend per vial: 50 mg GHK-UD, 10 mg BPC-157, 10 mg TB500, 10 mg KPV. Kit of 10 lyophilized research vials.",
  Retatrutide:
    "Retatrutide is a triple agonist at GLP-1, GIP, and glucagon receptors. Studied for metabolic, weight, and energy-balance research (lab use only).",
  Tirzepatide:
    "Tirzepatide is a dual GIP/GLP-1 incretin agonist. Widely used in metabolic research; kits are commonly 10 vials at the labeled mg each.",
  Semaglutide:
    "Semaglutide is a selective GLP-1 receptor agonist. Studied for metabolic, glycemic, and appetite pathways — not the same peptide as Semax.",
  Liraglutide:
    "GLP-1 receptor agonist analogue for metabolic research, with a shorter clinical half-life profile than semaglutide.",
  Cagrilintide:
    "Long-acting amylin analogue studied with incretins in satiety and metabolic research.",
  Mazdutide:
    "Dual GLP-1/glucagon agonist explored in metabolic research models.",
  Survodutide:
    "Dual GLP-1/glucagon receptor agonist studied for metabolic pathway work.",
  AOD9604:
    "Modified HGH fragment studied in lipolysis and fat-metabolism research.",
  "MOTS-c":
    "MOTS-c is a mitochondrial-derived peptide. Labs study it for metabolic regulation, exercise biology, and insulin-pathway research.",
  "SS-31":
    "SS-31 is a mitochondria-targeted peptide (elamipretide class). Explored for cellular energy and oxidative-stress research.",
  "Melanotan-2":
    "Melanocortin agonist studied for pigmentation and melanocortin-receptor research. Research use only.",
  "Melanotan 1":
    "α-MSH analogue used in pigmentation and photobiology research.",
  PT141:
    "Melanocortin receptor agonist (bremelanotide class) studied in behavioral and receptor pharmacology research.",
  HCG:
    "Human chorionic gonadotropin used in reproductive-axis and LH-receptor laboratory research.",
  "NAD+":
    "Essential redox coenzyme. Used in cellular energy, sirtuin, and aging-pathway research.",
  Epithalon:
    "Tetrapeptide associated with telomerase and circadian / aging-pathway research.",
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
  "TA-1":
    "Thymosin Alpha-1 (TA-1). Immune-signaling peptide studied for T-cell and host-response research models.",
  "Vitamin B12":
    "Vitamin B12 (cobalamin) liquid research vial. Used in metabolic and coenzyme laboratory work.",
  "Vitamin B":
    "Vitamin B research line. Used in metabolic and coenzyme laboratory work.",
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
    "Activin-binding glycoprotein studied in myostatin and muscle-growth pathway research.",
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

/** Ultra-short vial taglines (fits under product name on 3 mL wrap). */
const TAGLINES = {
  "BPC-157": "Tissue & gut recovery research",
  "TB-500": "Actin & remodeling research",
  "TB-4 (full sequence)": "Full thymosin β-4 research",
  "BPC-157 + TB-500": "Dual recovery pathway kit",
  "GHK-Cu": "Skin & collagen research",
  "GHK BASIC": "Remodeling without copper",
  "AHK-CU": "Hair & dermal research",
  "GHRP-6": "GH pulse & appetite axis",
  "GHRP-2": "Pulsatile GH research",
  Ipamorelin: "Selective GH secretagogue",
  "CJC-1295 (no DAC)": "Short-acting GHRH research",
  "CJC-1295 with DAC": "Extended GHRH research",
  Sermorelin: "Pituitary GH release",
  Tesamorelin: "GH axis & visceral research",
  Hexarelin: "Potent GHRP research",
  "HGH Fragment 176-191": "Fat-metabolism fragment",
  HGH: "Somatropin pathway research",
  "TheProLobster Plus HGH": "Growth pathway research",
  Glow: "Multi-pathway tissue blend",
  GLOW: "BPC / TB / GHK-Cu blend",
  KLOW: "GHK-UD / BPC / TB500 / KPV",
  Retatrutide: "Triple incretin agonist",
  Tirzepatide: "Dual GIP/GLP-1 research",
  Semaglutide: "GLP-1 metabolic research",
  Liraglutide: "GLP-1 analogue research",
  Cagrilintide: "Amylin / satiety research",
  Mazdutide: "GLP-1/glucagon research",
  Survodutide: "GLP-1/glucagon research",
  AOD9604: "Lipolysis research fragment",
  "MOTS-c": "Mitochondrial metabolism",
  "SS-31": "Mitochondrial energy research",
  "Melanotan-2": "Melanocortin research",
  "Melanotan 1": "Pigmentation research",
  PT141: "Melanocortin pharmacology",
  HCG: "LH-receptor research",
  "NAD+": "Redox & energy research",
  Epithalon: "Telomerase / aging research",
  Selank: "Stress & cognition research",
  Semax: "Neuroprotection research",
  Dihexa: "Synaptic research analogue",
  "LL-37": "Innate immunity research",
  KPV: "Inflammation & barrier research",
  Thymalin: "Immune modulation research",
  "Thymosin Alpha-1": "T-cell signaling research",
  "TA-1": "T-cell signaling research (Thymosin Alpha-1)",
  "Vitamin B12": "Cobalamin research liquid",
  "Vitamin B": "B-vitamin research liquid",
  DSIP: "Sleep & stress-axis research",
  Oxytocin: "Neuropeptide research",
  "IGF-1 LR3": "Growth-factor research",
  MGF: "Muscle repair research",
  "PEG MGF": "Extended MGF signaling",
  Follistatin: "Myostatin pathway research",
  "5-AMINO-1MQ": "NNMT / metabolic research",
  "SLU-PP-332": "Exercise-mimetic research",
  AICAR: "AMPK pathway research",
  Glutathione: "Redox research tripeptide",
  Cerebrolysin: "Neuroprotection research",
  Pinealon: "CNS / circadian research",
  Humanin: "Cytoprotection research",
  VIP: "Neuroendocrine research",
  "SNAP-8": "Cosmetic peptide research",
  Matrixyl: "Collagen matrix research",
  "KissPeptin-10": "GnRH axis research",
  Gonadorelin: "Gonadotropin release research",
  Melatonin: "Circadian timing research",
  BAC: "Reconstitution diluent",
  "BAC WATER": "Reconstitution diluent",
};

function resolveCompoundKey(name) {
  const raw = String(name || "").trim();
  if (!raw) return null;
  if (BLURBS[raw]) return raw;

  const exact = Object.keys(BLURBS).find(
    (k) => k.toLowerCase() === raw.toLowerCase()
  );
  if (exact) return exact;

  const n = raw.toUpperCase().replace(/\s+/g, " ");

  if (/\bBPC\b/.test(n) && /\bTB\b/.test(n)) return "BPC-157 + TB-500";
  if (/\bBPC\b/.test(n)) return "BPC-157";
  if (/\bTB-?4\b/.test(n) || /FULL SEQUENCE/.test(n)) return "TB-4 (full sequence)";
  if (/\bTB-?500\b/.test(n) || /\bTB500\b/.test(n)) return "TB-500";
  if (/GHK/.test(n) && /CU|COPPER/.test(n)) return "GHK-Cu";
  if (/GHK/.test(n) && /BASIC|NO.?COPPER/.test(n)) return "GHK BASIC";
  if (/AHK/.test(n)) return "AHK-CU";
  if (/GHRP-?6/.test(n)) return "GHRP-6";
  if (/GHRP-?2/.test(n)) return "GHRP-2";
  if (/IPAMORELIN/.test(n)) return "Ipamorelin";
  if (/CJC/.test(n) && /DAC/.test(n) && !/WITHOUT|NO DAC|WHITOUT/.test(n))
    return "CJC-1295 with DAC";
  if (/CJC/.test(n)) return "CJC-1295 (no DAC)";
  if (/SERMORELIN/.test(n)) return "Sermorelin";
  if (/TESAMORELIN|TESA/.test(n)) return "Tesamorelin";
  if (/HEXARELIN/.test(n)) return "Hexarelin";
  if (/176-?191|AOD|FRAGMENT/.test(n) && /HGH|GH|AOD/.test(n))
    return "HGH Fragment 176-191";
  if (/AOD\s*9604|AOD9604/.test(n)) return "AOD9604";
  if (/PROLOBSTER|SOMATROPIN|\bHGH\b/.test(n)) return "HGH";
  if (/\bGLOW\b/.test(n)) return "Glow";
  if (/\bKLOW\b/.test(n)) return "KLOW";
  if (/RETATRUTIDE|RETA\b/.test(n)) return "Retatrutide";
  if (/TIRZEPATIDE|TIRZ/.test(n)) return "Tirzepatide";
  if (/SEMAGLUTIDE|SEMA\b/.test(n) && !/SEMAX|SELANK/.test(n)) return "Semaglutide";
  if (/LIRAGLUTIDE/.test(n)) return "Liraglutide";
  if (/CAGRILINTIDE|CAGRI/.test(n)) return "Cagrilintide";
  if (/MAZDUTIDE/.test(n)) return "Mazdutide";
  if (/SURVODUTIDE/.test(n)) return "Survodutide";
  if (/MOTS/.test(n)) return "MOTS-c";
  if (/SS-?31|ELAMIPRETIDE/.test(n)) return "SS-31";
  if (/MELANOTAN\s*2|MELANOTAN-2|MT-?2\b/.test(n)) return "Melanotan-2";
  if (/MELANOTAN\s*1|MT-?1\b/.test(n)) return "Melanotan 1";
  if (/PT-?141|BREMELANOTIDE/.test(n)) return "PT141";
  if (/\bHCG\b/.test(n)) return "HCG";
  if (/NAD/.test(n)) return "NAD+";
  if (/EPITHAL/.test(n)) return "Epithalon";
  if (/SELANK/.test(n)) return "Selank";
  if (/SEMAX/.test(n)) return "Semax";
  if (/DIHEXA/.test(n)) return "Dihexa";
  if (/LL-?37/.test(n)) return "LL-37";
  if (/\bKPV\b/.test(n)) return "KPV";
  if (/THYMALIN|THYMULIN/.test(n)) return "Thymalin";
  if (/THYMOSIN\s*ALPHA|TA-?1\b|Tα1/.test(n)) return "TA-1";
  if (/VITAMIN\s*B\s*12|METHYLCOBALAMIN|\bB12\b/.test(n)) return "Vitamin B12";
  if (/VITAMIN\s*B\b/.test(n)) return "Vitamin B";
  if (/\bDSIP\b/.test(n)) return "DSIP";
  if (/OXYTOCIN/.test(n)) return "Oxytocin";
  if (/IGF/.test(n)) return "IGF-1 LR3";
  if (/PEG\s*MGF/.test(n)) return "PEG MGF";
  if (/\bMGF\b/.test(n)) return "MGF";
  if (/FOLLISTATIN/.test(n)) return "Follistatin";
  if (/5-?AMINO|1MQ/.test(n)) return "5-AMINO-1MQ";
  if (/SLU-?PP|SLUPP/.test(n)) return "SLU-PP-332";
  if (/AICAR/.test(n)) return "AICAR";
  if (/GLUTATHIONE/.test(n)) return "Glutathione";
  if (/CEREBROLYSIN/.test(n)) return "Cerebrolysin";
  if (/PINEALON/.test(n)) return "Pinealon";
  if (/HUMANIN/.test(n)) return "Humanin";
  if (/\bVIP\b/.test(n)) return "VIP";
  if (/SNAP-?8/.test(n)) return "SNAP-8";
  if (/MATRIXYL/.test(n)) return "Matrixyl";
  if (/KISSPEPTIN|KISSPETIN/.test(n)) return "KissPeptin-10";
  if (/GONADORELIN/.test(n)) return "Gonadorelin";
  if (/MELATONIN/.test(n)) return "Melatonin";
  if (/BAC|BACTERIOSTATIC|STERILE WATER|\bWATER\b/.test(n)) return "BAC WATER";
  return null;
}

export function guessBlurb(name) {
  const key = resolveCompoundKey(name);
  if (key && BLURBS[key]) return BLURBS[key];
  return "Research compound for laboratory use only. Review COA and batch notes before assay design. Not for human consumption.";
}

/** Short line for vial labels and card meta — more detail without a wall of text. */
export function guessTagline(name) {
  const key = resolveCompoundKey(name);
  if (key && TAGLINES[key]) return TAGLINES[key];
  return "Laboratory research compound";
}
/** Active vendor for now: Changsha only (more vendors later). */
export const SEED_VENDORS = [CHANGSHA_VENDOR];

/** Focused seed submissions (popular Changsha research lines) for the shop. */
export const SEED_SUBMISSIONS = [
  ...CHANGSHA_SUBMISSIONS.filter((s) => isChangshaFocused(s.name)),
];

/** Every sellable Changsha peptide (calculator / label dropdown). */
export const CALCULATOR_SUBMISSIONS = [
  ...CHANGSHA_SUBMISSIONS.filter((s) => isChangshaSellable(s.name)),
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
    .replace(/\([^)]*\)/g, " ")
    .replace(/^\+\s*/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(\d+(?:\.\d+)?)\s*mgs?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Customer-facing peptide names — what people actually call them.
 * Drops vendor jargon and odd formatting; dosage stays in the strength picker.
 */
export function displayPeptideName(name = "") {
  const raw = String(name || "").replace(/\s+/g, " ").trim();
  if (!raw) return "Peptide";
  const n = raw
    .toLowerCase()
    .replace(/[·•]/g, ".")
    .replace(/[（(].*?[）)]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (n.includes("wolverine") || (n.includes("bpc") && n.includes("tb"))) {
    return "Wolverine";
  }
  if (n === "hgh" || n.includes("prolobster") || /\bplus hgh\b/.test(n)) {
    return n.includes("prolobster") ? "HGH" : "HGH";
  }
  if (n.includes("tb-4") || n.includes("tb4") || n.includes("thymosin beta")) {
    return "TB-500";
  }
  if (n.includes("tb-500") || n.includes("tb500") || n === "tb 500") {
    return "TB-500";
  }
  if (
    n.includes("thymosin alpha") ||
    n === "ta-1" ||
    n === "ta1" ||
    n.startsWith("ta-1") ||
    n.startsWith("ta1 ")
  ) {
    return "TA-1";
  }
  if (
    n.includes("vitamin b12") ||
    n.includes("methylcobalamin") ||
    n === "b12" ||
    (n.includes("b12") && !n.includes("lipo"))
  ) {
    return "Vitamin B12";
  }
  if (n.includes("vitamin b")) return "Vitamin B";
  if (n.startsWith("bpc")) return "BPC-157";
  if (n.includes("retatrutide") || n === "reta") return "Retatrutide";
  if (n.includes("tirzepatide") || n.startsWith("triz")) return "Tirzepatide";
  if (
    (n.includes("tesamorelin") || n.startsWith("tesa")) &&
    (n.includes("ipa") || n.includes("ip5") || n.includes("+ip"))
  ) {
    return "Tesamorelin / Ipamorelin";
  }
  if (n.startsWith("tesa") || n.includes("tesamorelin")) return "Tesamorelin";
  if (n.includes("cjc") && n.includes("ipa")) return "CJC-1295 / Ipamorelin";
  if (n.includes("cjc") && (n.includes("without") || n.includes("no dac") || n.includes("w/o"))) {
    return "CJC-1295";
  }
  if (n.includes("cjc") && n.includes("dac")) return "CJC-1295 with DAC";
  if (n.includes("cjc")) return "CJC-1295";
  if (n.includes("ipamorelin") || n.startsWith("ipa ")) return "Ipamorelin";
  if (n === "nad+" || n === "nad" || n.startsWith("nad+")) return "NAD+";
  if (n.includes("glutathione") || n.startsWith("gluta")) return "Glutathione";
  if (n.includes("ghk") && n.includes("cu")) return "GHK-Cu";
  if (n.includes("ghk")) return "GHK";
  if (n.includes("epithalon") || n.includes("epitalon")) return "Epitalon";
  if (n.includes("mots")) return "MOTS-c";
  if (n.includes("pt141") || n.includes("pt-141") || n.includes("pt 141")) {
    return "PT-141";
  }
  if (n.includes("ss.31") || n.includes("ss-31") || n === "ss31") {
    return "SS-31";
  }
  if (n.includes("n-acetyl") && n.includes("semax")) return "NA-Semax";
  if (n.includes("semax")) return "Semax";
  if (n.includes("selank")) return "Selank";
  if (n === "klow") return "KLOW";

  // Title-case leftover clean names
  return raw
    .replace(/[（(].*?[）)]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function variantKey(product) {
  const mg = Number(product.mg) || 0;
  const pack = Number(product.packVials) || 10;
  const vialMl = resolveVialMl(product);
  return `${mg}|${pack}|${vialMl}|${product.externalOnly ? "ext" : "std"}`;
}

export function strengthKey(product) {
  return variantKey(product);
}

export function formatStrengthLabel(product) {
  if (product?.skin) {
    return product.form || product.unitLabel || product.size || "Skincare";
  }
  const amount = Number(product.mg);
  const pack = Number(product.packVials) || 10;
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
    return `Kit of ${pack} · ${vialMl} mL`;
  }

  let amountPart;
  if (unit === "ml") amountPart = `${amount} ml`;
  else if (amount >= 1000000 && unit === "IU")
    amountPart = `${amount / 1000000}M IU`;
  else if (amount >= 1000 && unit === "mg" && form.includes("Raw"))
    amountPart = amount === 1000 ? "1g raw" : `${amount} mg raw`;
  else amountPart = `${amount} ${unit}`;

  const packPart = ` · kit of ${pack}`;
  const vialPart = ` · ${vialMl} mL`;
  const lanePart = lane ? ` · ${lane}` : "";
  return `${amountPart}${vialPart}${packPart}${lanePart}`;
}

/** Short strength line for card/detail dropdowns. */
export function formatStrengthSelectLabel(strengthOrProduct) {
  const amount = Number(strengthOrProduct?.mg);
  const pack = Number(strengthOrProduct?.packVials) || 10;
  const unit = strengthOrProduct?.unit || "mg";
  if (!Number.isFinite(amount) || amount <= 0) {
    return formatStrengthLabel(strengthOrProduct);
  }
  return `${amount} ${unit} · kit of ${pack}`;
}

function sortOffers(a, b) {
  const pa = a.price == null ? Number.POSITIVE_INFINITY : Number(a.price);
  const pb = b.price == null ? Number.POSITIVE_INFINITY : Number(b.price);
  if (pa !== pb) return pa - pb;
  if (Boolean(b.featured) !== Boolean(a.featured)) return b.featured ? 1 : -1;
  return String(a.vendor || "").localeCompare(String(b.vendor || ""));
}

export function formatVendorOfferLabel(product) {
  const price =
    product.price == null ? "Quote" : formatMoney(product.price);
  const ship =
    product.shippingFlat != null
      ? ` · ship ${formatMoney(product.shippingFlat)}`
      : "";
  return `${formatStrengthLabel(product)} · ${price}${ship}`;
}

/**
 * Collapse duplicate compound rows into strength groups with all vendor offers.
 * Default offer per strength is the lowest retail price.
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
        tagline: product.tagline,
        offersByStrength: new Map(),
      });
    }

    const group = groups.get(key);
    const vKey = variantKey(product);
    if (!group.offersByStrength.has(vKey)) {
      group.offersByStrength.set(vKey, []);
    }
    group.offersByStrength.get(vKey).push(product);

    if (product.name.length < group.name.length) {
      group.name = product.name;
    }
  }

  return [...groups.values()]
    .map((group) => {
      const strengths = [...group.offersByStrength.entries()]
        .map(([key, offers]) => {
          const sorted = [...offers].sort(sortOffers);
          const sample = sorted[0];
          const priced = sorted.find((o) => o.price != null);
          return {
            key,
            mg: sample.mg,
            unit: sample.unit || "mg",
            packVials: sample.packVials,
            vialMl: sample.vialMl,
            label: formatStrengthLabel(sample),
            selectLabel: formatStrengthSelectLabel(sample),
            offers: sorted,
            defaultOfferId: (priced || sample).id,
            lowestPrice: priced?.price ?? null,
            vendorCount: sorted.length,
          };
        })
        .sort((a, b) => {
          const mgDiff = (Number(a.mg) || 0) - (Number(b.mg) || 0);
          if (mgDiff !== 0) return mgDiff;
          return (Number(a.packVials) || 1) - (Number(b.packVials) || 1);
        });

      const variants = strengths.flatMap((s) => s.offers);
      const defaultStrength =
        strengths.find((s) => s.lowestPrice != null) || strengths[0];
      const defaultVariantId = defaultStrength?.defaultOfferId || variants[0]?.id;
      const reviews = variants.reduce((sum, v) => sum + (Number(v.reviews) || 0), 0);
      const rated = variants.filter((v) => Number(v.reviews) > 0 && Number(v.rating) > 0);
      const rating =
        rated.length > 0
          ? rated.reduce((sum, v) => sum + Number(v.rating), 0) / rated.length
          : null;

      return {
        id: group.id,
        name: group.name,
        category: group.category || defaultStrength?.offers[0]?.category,
        blurb: group.blurb || defaultStrength?.offers[0]?.blurb,
        tagline: group.tagline || defaultStrength?.offers[0]?.tagline,
        strengths,
        variants,
        defaultVariantId,
        rating,
        reviews,
        badge: defaultStrength?.offers[0]?.badge || null,
        featured: variants.some((v) => v.featured),
        vendorCount: new Set(variants.map((v) => v.vendorId)).size,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Peptide + dosage options for the reconstitution calculator,
 * derived from the live Undisclosed catalog.
 */
export function calculatorOptionsFromListings(listings = []) {
  return (listings || [])
    .filter((listing) => listing?.strengths?.length)
    .map((listing) => {
      const strengths = listing.strengths
        .filter((s) => Number(s.mg) > 0)
        .map((s) => {
          const sample = {
            name: listing.name,
            mg: s.mg,
            unit: s.unit,
            packVials: s.packVials,
            vialMl: s.vialMl,
            form: s.form,
          };
          const unit = resolveVialUnit(sample);
          const vialMl = resolveVialMl(sample);
          return {
            key: s.key,
            mg: Number(s.mg),
            unit,
            packVials: Number(s.packVials) || 1,
            vialMl,
            form: s.form || "",
            label:
              s.label ||
              formatStrengthLabel({
                name: listing.name,
                mg: s.mg,
                unit,
                packVials: s.packVials,
                vialMl,
              }),
          };
        });
      if (!strengths.length) return null;
      const name = displayPeptideName(listing.name) || listing.name;
      return {
        id: listing.id,
        name,
        rawName: listing.name,
        category: listing.category || guessCategory(listing.name),
        key: listing.key || normalizeCompoundKey(listing.name),
        strengths,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Full sellable peptide list for the calculator dropdown
 * (every Changsha research line, not only the compact shop focus).
 */
export function buildCalculatorListings(vendors = SEED_VENDORS) {
  const products = buildCatalog(vendors, CALCULATOR_SUBMISSIONS);
  return groupCatalog(products);
}

/** Match a calculator seed (URL / product CTA) to a catalog option. */
export function matchCalculatorOption(options, seed) {
  if (!options?.length) return null;
  if (!seed?.name && seed?.mass == null) {
    return { option: options[0], strength: options[0].strengths[0] };
  }

  const needle = normalizeCompoundKey(seed?.name || "");
  let option =
    (needle &&
      options.find(
        (o) =>
          o.key === needle ||
          normalizeCompoundKey(o.name) === needle ||
          o.key.includes(needle) ||
          needle.includes(o.key)
      )) ||
    null;

  if (!option && seed?.name) {
    const raw = String(seed.name).toLowerCase();
    option =
      options.find((o) => o.name.toLowerCase() === raw) ||
      options.find((o) => o.name.toLowerCase().includes(raw)) ||
      options.find((o) => raw.includes(o.name.toLowerCase())) ||
      null;
  }

  if (!option) option = options[0];

  const mass = Number(seed?.mass);
  const unit = String(seed?.unit || "").toUpperCase();
  let strength =
    (Number.isFinite(mass) &&
      option.strengths.find(
        (s) =>
          Number(s.mg) === mass &&
          (!unit || String(s.unit || "mg").toUpperCase() === unit)
      )) ||
    (Number.isFinite(mass) &&
      option.strengths.find((s) => Number(s.mg) === mass)) ||
    option.strengths[0];

  return { option, strength };
}

/** Offers for the same strength as the given product within a listing. */
export function offersForStrength(listing, product) {
  if (!listing?.strengths?.length) {
    return product ? [product] : [];
  }
  const key = product ? variantKey(product) : listing.strengths[0].key;
  const strength =
    listing.strengths.find((s) => s.key === key) || listing.strengths[0];
  return strength?.offers || [];
}

export function strengthForProduct(listing, product) {
  if (!listing?.strengths?.length) return null;
  const key = product ? variantKey(product) : null;
  return (
    listing.strengths.find((s) => s.key === key) ||
    listing.strengths[0] ||
    null
  );
}

/**
 * Build the public catalog from approved submissions.
 * One retail offer per vendor SKU (vendorId + sku).
 * Changsha is the live vendor for now.
 */
export function buildCatalog(vendors, submissions) {
  const vendorById = Object.fromEntries(
    vendors
      .filter((v) => ACTIVE_VENDOR_IDS.has(v.id))
      .map((v) => [v.id, { ...v, name: displayVendorName(v.name, v.id) }])
  );
  const approved = submissions.filter(
    (s) => s.status === "approved" && ACTIVE_VENDOR_IDS.has(s.vendorId)
  );
  const byOffer = new Map();

  for (const item of approved) {
    const vendor = vendorById[item.vendorId];
    if (!vendor || vendor.status !== "approved") continue;
    const offerKey = `${item.vendorId}::${item.sku}`;
    const prev = byOffer.get(offerKey);
    const isExternal = Boolean(item.externalOnly);
    if (
      !prev ||
      isExternal ||
      Number(item.vendorCost) < Number(prev.vendorCost)
    ) {
      byOffer.set(offerKey, { ...item, vendor });
    }
  }

  return [...byOffer.values()].map((item) => {
    const isExternal = Boolean(item.externalOnly);
    const vendorCost = Number(item.vendorCost);
    const price = isExternal ? null : retailFromVendor(vendorCost);
    const packVials = 10; // All Undisclosed lines ship as kits of 10
    const featured = Boolean(item.vendor.featured);
    const vialMl = resolveVialMl(item);
    const displayName = displayPeptideName(item.name);
    const powderColor = resolvePowderColor({ name: displayName, form: item.form });
    return {
      id: `p-${item.vendorId}-${item.sku}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
      submissionId: item.id,
      sku: item.sku,
      name: displayName,
      form: item.form,
      purity: item.purity,
      coaUrl: item.coaUrl || "",
      mg: item.mg,
      unit: resolveVialUnit(item),
      packVials,
      vialMl,
      powderColor,
      unitLabel: "kit of 10",
      category: item.category || guessCategory(displayName),
      blurb: guessBlurb(displayName),
      tagline: guessTagline(displayName),
      vendorId: item.vendorId,
      // Blank on purpose — never show supply source (e.g. Changsha) to customers.
      vendor: "",
      vendorCost,
      price,
      priceLabel: null,
      compareAt: price ? Math.round(price * 1.18 * 100) / 100 : null,
      externalOnly: false,
      externalUrl: null,
      minOrder: Number(item.vendor.minOrder) || 0,
      shippingFlat: Number(item.vendor.shippingFlat) || 0,
      shippingNote: item.vendor.shippingNote || "",
      rating: item.rating != null ? Number(item.rating) : null,
      reviews: Number(item.reviews) || 0,
      inStock: true,
      ships:
        "US only · request first · pay after supply check · 2–3 weeks",
      badge: featured ? "Featured" : null,
      featured,
    };
  });
}
