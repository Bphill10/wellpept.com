/**
 * Focused Undisclosed catalog — top 25 peptides only.
 * 1) JEC US primary · 2) Changsha gap-fill · 3) ERP/STG third backup.
 * Supplier names never shown.
 */

import { JEC_VENDOR_ID } from "./jecPremium";
import { CHANGSHA_VENDOR_ID } from "./changshaPremium";

function norm(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[·•]/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Storefront top 25 (compound families). Multiple vial strengths still show
 * under each name. Order is display priority for “featured” thinking.
 */
export const TOP_25_PEPTIDES = [
  "Tirzepatide",
  "Retatrutide",
  "Semaglutide",
  "BPC-157",
  "TB-500",
  "KLOW",
  "GLOW",
  "GHK-Cu",
  "Tesamorelin",
  "Ipamorelin",
  "CJC-1295",
  "CJC-1295 / Ipamorelin",
  "NAD+",
  "MOTS-c",
  "Epithalon",
  "Semax",
  "Selank",
  "Glutathione",
  "SS-31",
  "PT-141",
  "Thymosin Alpha-1",
  "KPV",
  "Cagrilintide",
  "LL-37",
  "FOX04-DRI",
];

/** Supplies / non-peptide lines — not sold as catalog peptides. */
export function isChangshaSupply(name) {
  const n = norm(name);
  if (!n) return true;
  if (n === "water" || n === "bac water" || n.includes("bac water")) return true;
  if (n === "acetic acid") return true;
  if (n === "1mg/ml" || n === "1 mg/ml") return true;
  return false;
}

/** CJC with DAC was removed from the focused / sellable set. */
export function isCjcWithDac(name) {
  const n = norm(name);
  if (!n.includes("cjc") || !n.includes("dac")) return false;
  if (
    n.includes("no dac") ||
    n.includes("without dac") ||
    n.includes("whitout dac")
  ) {
    return false;
  }
  return true;
}

/**
 * Every research peptide we can sell from the Changsha list
 * (excludes supplies and CJC with DAC).
 */
export function isChangshaSellable(name) {
  if (!name) return false;
  if (isChangshaSupply(name)) return false;
  if (isCjcWithDac(name)) return false;
  return true;
}

/** True when the compound is in the top-25 storefront set. */
export function isTop25Peptide(name) {
  const n = norm(name);
  if (!n || isChangshaSupply(name)) return false;
  if (isCjcWithDac(name)) return false;

  // KLOW blend only (not separate Wolverine cards)
  if (n.includes("klow")) return true;
  if (n === "glow" || (n.includes("glow") && n.includes("ghk"))) return true;

  if (n.startsWith("tirzepatide") || n.startsWith("triz")) return true;
  if (n.startsWith("retatrutide") || n === "reta" || n.startsWith("reta ")) {
    return true;
  }
  if (n.includes("semaglutide")) return true;

  // Standalone BPC-157 only (not BPC+TB / Wolverine)
  if (
    n === "bpc 157" ||
    n === "bpc-157" ||
    n.startsWith("bpc-157") ||
    n.startsWith("bpc 157") ||
    (n.startsWith("bpc") && !n.includes("tb") && !n.includes("wolverine"))
  ) {
    return true;
  }

  if (
    n === "tb500" ||
    n === "tb-500" ||
    n === "tb 500" ||
    n.startsWith("tb500") ||
    n.startsWith("tb-500") ||
    n.startsWith("tb 500")
  ) {
    return true;
  }

  if (n === "ghk-cu" || n === "ghk cu" || n.startsWith("ghk-cu") || n === "ghk") {
    return true;
  }

  // Standalone Tesamorelin (not Tesamorelin/Ipamorelin blend)
  if (
    (n.startsWith("tesamorelin") || n.startsWith("tesa")) &&
    !n.includes("ipa")
  ) {
    return true;
  }
  if (
    (n === "ipamorelin" || n.startsWith("ipa ") || n.startsWith("ipamorelin")) &&
    !n.includes("cjc") &&
    !n.includes("tesa")
  ) {
    return true;
  }
  if (n.includes("cjc") && n.includes("ipa")) return true;
  if (
    n.includes("cjc") &&
    (n.includes("no dac") || n.includes("without") || n.includes("whitout"))
  ) {
    return true;
  }
  // Plain CJC-1295 without DAC wording (Changsha rows)
  if (n.includes("cjc-1295") || n.includes("cjc 1295") || /^cjc\b/.test(n)) {
    return true;
  }

  if (n === "nad+" || n.startsWith("nad+") || n === "nad" || n.startsWith("nad ")) {
    return true;
  }
  if (n.startsWith("mots-c") || n.startsWith("mots c") || n.startsWith("mots-c")) {
    return true;
  }
  if (n.startsWith("epithalon") || n.startsWith("epitalon")) return true;
  // Standalone Semax / Selank only (not Selank+Semax combo kits)
  if (n.includes("semax") && n.includes("selank")) return false;
  if (n.includes("semax")) return true;
  if (n.includes("selank")) return true;
  if (n.startsWith("glutathione") || n.startsWith("gluta")) return true;

  if (
    n === "ss.31" ||
    n === "ss-31" ||
    n === "ss31" ||
    n.startsWith("ss.31") ||
    n.startsWith("ss-31") ||
    n.startsWith("ss31")
  ) {
    return true;
  }

  if (
    n === "pt141" ||
    n === "pt-141" ||
    n.startsWith("pt 141") ||
    n.startsWith("pt-141") ||
    n.startsWith("pt141")
  ) {
    return true;
  }

  if (
    n.includes("thymosin alpha") ||
    n === "ta-1" ||
    n === "ta1" ||
    n.startsWith("ta-1") ||
    n.startsWith("ta1 ")
  ) {
    return true;
  }

  if (n === "kpv" || n.startsWith("kpv ")) return true;
  // Standalone Cagrilintide (not Cagri+Sema combo kits)
  if (
    (n.includes("cagrilintide") || n.includes("cagri")) &&
    !n.includes("sema")
  ) {
    return true;
  }
  if (n === "ll37" || n === "ll-37" || n.startsWith("ll37") || n.startsWith("ll-37")) {
    return true;
  }
  if (
    n.includes("fox04") ||
    n.includes("foxo4") ||
    n.includes("fox 04") ||
    n.includes("foxo-4") ||
    n.includes("fox04-dri") ||
    n.includes("fox04-dir")
  ) {
    return true;
  }

  return false;
}

/** @deprecated use isTop25Peptide — kept for older call sites. */
export function isChangshaFocused(name) {
  return isTop25Peptide(name) && isChangshaSellable(name);
}

/** JEC lines that are in the top-25 set. */
export function isJecSellable(name) {
  if (!name) return false;
  if (isChangshaSupply(name)) return false;
  return isTop25Peptide(name);
}

export function isFocusedSubmission(submission) {
  if (!submission) return false;
  if (!isTop25Peptide(submission.name)) return false;

  if (submission.vendorId === JEC_VENDOR_ID || submission.vendorId === "v-jec") {
    return isJecSellable(submission.name);
  }
  if (
    submission.vendorId === CHANGSHA_VENDOR_ID ||
    submission.vendorId === "v-changsha-premium"
  ) {
    return isChangshaSellable(submission.name);
  }
  if (submission.vendorId === "v-stg-backup") {
    return isTop25Peptide(submission.name);
  }
  return false;
}

/** Full sellable lines for calculator / label peptide dropdown. */
export function isSellableSubmission(submission) {
  return isFocusedSubmission(submission);
}
