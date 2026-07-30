/**
 * Focused Undisclosed catalog.
 * Changsha only for now (more vendors later).
 * Popular research lines for the shop; calculator can list every sellable peptide.
 */

function norm(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[·•]/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

/** Supplies / non-peptide lines — not sold as catalog peptides. */
export function isChangshaSupply(name) {
  const n = norm(name);
  if (!n) return true;
  if (n === "water" || n === "bac water" || n.includes("bac water")) return true;
  if (n === "acetic acid") return true;
  if (n === "1mg/ml" || n.startsWith("1mg/ml")) return true;
  return false;
}

/** CJC with DAC was removed from the focused / sellable set. */
export function isCjcWithDac(name) {
  const n = norm(name);
  if (!n.includes("cjc") || !n.includes("dac")) return false;
  if (n.includes("no dac") || n.includes("without dac") || n.includes("whitout dac")) {
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

/**
 * Changsha keepers for the storefront brief, plus popular non-GLP-1 picks:
 * BPC-157, GHK-Cu, Epithalon, MOTS-c, PT-141, KLOW, etc.
 */
export function isChangshaFocused(name) {
  const n = norm(name);
  if (!n) return false;
  if (!isChangshaSellable(name)) return false;

  // Explicitly out of the compact shop: classic GLP-1s and GLP-1 combo kits
  if (n.includes("semaglutide") || n.includes("liraglutide")) return false;
  if (n.includes("cagri sema") || n.includes("cagrisema")) return false;
  if (
    n.includes("mazdutide") ||
    n.includes("survodutide") ||
    n.includes("eloralintide")
  ) {
    return false;
  }

  // Requested popular set (KLOW name is "KLOW(...)" — match includes)
  if (n.includes("klow") || n.includes("wolverine")) return true;
  if (n.startsWith("bpc") && n.includes("tb")) return true; // Wolverine-style BPC+TB
  if (n.startsWith("tesamorelin") || n.startsWith("tesa")) return true; // Tessa
  if (
    n === "ss.31" ||
    n === "ss-31" ||
    n === "ss31" ||
    n.startsWith("ss.31") ||
    n.startsWith("ss-31")
  ) {
    return true;
  }
  if (n.includes("cjc") && n.includes("ipa")) return true; // CJC/IPA
  if (n === "ipamorelin" || n.startsWith("ipa ")) return true;
  if (n.includes("cjc")) return true;
  if (n.startsWith("tirzepatide") || n.startsWith("triz")) return true; // Triz
  if (n.startsWith("retatrutide") || n === "reta") return true;
  if (n === "nad+" || n.startsWith("nad+") || n === "nad") return true;
  if (n.startsWith("glutathione") || n.startsWith("gluta")) return true;
  if (n.includes("semax")) return true;
  if (n.includes("selank")) return true;

  // Additional popular non-GLP-1 lines
  if (
    n === "bpc 157" ||
    n === "bpc-157" ||
    n.startsWith("bpc-157") ||
    n.startsWith("bpc 157")
  ) {
    return true;
  }
  if (n === "ghk-cu" || n === "ghk cu") return true;
  if (n.startsWith("epithalon") || n.startsWith("epitalon")) return true;
  if (n.startsWith("mots-c") || n.startsWith("mots c")) return true;
  if (n === "pt141" || n === "pt-141" || n.startsWith("pt 141")) return true;

  // TB-500 / TB500 (standalone — not only inside Wolverine/KLOW blends)
  if (
    n === "tb500" ||
    n === "tb-500" ||
    n === "tb 500" ||
    n.startsWith("tb500") ||
    n.startsWith("tb-500")
  ) {
    return true;
  }

  // Thymosin Alpha-1 / TA-1
  if (
    n.includes("thymosin alpha") ||
    n === "ta-1" ||
    n === "ta1" ||
    n.startsWith("ta-1") ||
    n.startsWith("ta1 ")
  ) {
    return true;
  }

  return false;
}

export function isFocusedSubmission(submission) {
  if (!submission) return false;
  if (submission.vendorId === "v-changsha-premium") {
    return isChangshaFocused(submission.name);
  }
  return false;
}

/** Full sellable Changsha lines for calculator / label peptide dropdown. */
export function isSellableSubmission(submission) {
  if (!submission) return false;
  if (submission.vendorId === "v-changsha-premium") {
    return isChangshaSellable(submission.name);
  }
  return false;
}
