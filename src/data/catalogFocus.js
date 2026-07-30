/**
 * Focused Undisclosed catalog.
 * Changsha only for now (more vendors later).
 * Popular research lines (no pure GLP-1 like Semaglutide / Liraglutide).
 */

function norm(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[·•]/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Changsha keepers from the storefront brief, plus 5 popular non-GLP-1 picks:
 * BPC-157, GHK-Cu, Epithalon, MOTS-c, PT-141.
 */
export function isChangshaFocused(name) {
  const n = norm(name);
  if (!n) return false;

  // Explicitly out: classic GLP-1s and GLP-1 combo kits
  if (n.includes("semaglutide") || n.includes("liraglutide")) return false;
  if (n.includes("cagri sema") || n.includes("cagrisema")) return false;
  if (n.includes("mazdutide") || n.includes("survodutide") || n.includes("eloralintide")) {
    return false;
  }

  // Requested popular set
  if (n === "klow" || n.includes("wolverine")) return true;
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
  // No CJC with DAC (CJC W DAC)
  if (
    n.includes("cjc") &&
    n.includes("dac") &&
    !n.includes("no dac") &&
    !n.includes("without dac") &&
    !n.includes("whitout dac")
  ) {
    return false;
  }
  if (n.includes("cjc")) return true;
  if (n.startsWith("tirzepatide") || n.startsWith("triz")) return true; // Triz
  if (n.startsWith("retatrutide") || n === "reta") return true;
  if (n === "nad+" || n.startsWith("nad+") || n === "nad") return true;
  if (n.startsWith("glutathione") || n.startsWith("gluta")) return true;
  if (n.includes("semax")) return true;
  if (n.includes("selank")) return true;

  // 5 additional popular non-GLP-1 lines
  if (n === "bpc 157" || n === "bpc-157" || n.startsWith("bpc-157") || n.startsWith("bpc 157")) {
    return true;
  }
  if (n === "ghk-cu" || n === "ghk cu") return true;
  if (n.startsWith("epithalon") || n.startsWith("epitalon")) return true;
  if (n.startsWith("mots-c") || n.startsWith("mots c")) return true;
  if (n === "pt141" || n === "pt-141" || n.startsWith("pt 141")) return true;

  return false;
}

export function isFocusedSubmission(submission) {
  if (!submission) return false;
  if (submission.vendorId === "v-changsha-premium") {
    return isChangshaFocused(submission.name);
  }
  return false;
}
