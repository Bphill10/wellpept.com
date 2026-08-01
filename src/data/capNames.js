/**
 * Short etched names for printable vial flip-caps.
 * Keep ≤5 characters so the top face stays readable at ~13–15 mm OD.
 */

function norm(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[·•]/g, ".")
    .replace(/\s+/g, " ")
    .trim();
}

/** Catalog display name → short cap etch. */
export const CAP_SHORT_NAMES = {
  Tirzepatide: "TIRZ",
  Retatrutide: "RETA",
  Semaglutide: "SEMA",
  "BPC-157": "BPC",
  "TB-500": "TB5",
  KLOW: "KLOW",
  GLOW: "GLOW",
  "GHK-Cu": "GHK",
  Tesamorelin: "TESA",
  Ipamorelin: "IPA",
  "CJC-1295": "CJC",
  "CJC-1295 / Ipamorelin": "CJC+",
  "CJC-1295 without DAC + Ipamorelin": "CJC+",
  HGH: "HGH",
  "NAD+": "NAD",
  "MOTS-c": "MOTS",
  Epithalon: "EPI",
  Epitalon: "EPI",
  Semax: "SEMX",
  Selank: "SELK",
  Glutathione: "GSH",
  "SS-31": "SS31",
  "PT-141": "PT",
  "Thymosin Alpha-1": "TA1",
  "TA-1": "TA1",
  KPV: "KPV",
  Cagrilintide: "CARGI",
  "ARA-290": "ARA",
  "FOX04-DRI": "FOX",
  "FOXO4-DRI": "FOX",
  DSIP: "DSIP",
  "Vitamin B12": "B12",
};

/**
 * Resolve a short cap etch from any peptide name / custom string.
 * Returns uppercase ≤5 chars suitable for a 13 mm flip-cap top.
 */
export function shortCapName(name = "") {
  const raw = String(name || "").trim();
  if (!raw) return "UD";
  const exact = CAP_SHORT_NAMES[raw];
  if (exact) return exact;

  const n = norm(raw);
  if (n.includes("tirzepatide") || n.startsWith("triz") || n.startsWith("tirz") || n === "tzp") return "TIRZ";
  if (n.includes("retatrutide") || n === "reta") return "RETA";
  if (n.includes("semaglutide") || n === "sema") return "SEMA";
  if (n.includes("bpc")) return "BPC";
  if (n.includes("tb-500") || n.includes("tb500") || n.includes("tb 500")) return "TB5";
  if (n.includes("klow")) return "KLOW";
  if (n.includes("glow")) return "GLOW";
  if (n.includes("ghk")) return "GHK";
  if (n.includes("tesamorelin") || n.startsWith("tesa")) return "TESA";
  if (n.includes("ipamorelin") || n === "ipa") return "IPA";
  if (
    (n.includes("cjc") && n.includes("ipa")) ||
    n.includes("cjc-1295 / ipamorelin") ||
    n.includes("cjc + ipa")
  )
    return "CJC+";
  if (n.includes("cjc")) return "CJC";
  if (n === "hgh" || n.includes("somatropin")) return "HGH";
  if (n.includes("nad")) return "NAD";
  if (n.includes("mots")) return "MOTS";
  if (n.includes("epithalon") || n.includes("epitalon")) return "EPI";
  if (n.includes("semax")) return "SEMX";
  if (n.includes("selank")) return "SELK";
  if (n.includes("glutathione")) return "GSH";
  if (n.includes("ss-31") || n.includes("ss 31") || n.includes("elamipretide")) return "SS31";
  if (n.includes("pt-141") || n.includes("pt 141") || n.includes("bremelanotide")) return "PT";
  if (n.includes("thymosin alpha") || n === "ta-1" || n === "ta1") return "TA1";
  if (n === "kpv") return "KPV";
  if (n.includes("cagrilintide") || n.startsWith("cagri") || n.startsWith("cargi")) return "CARGI";
  if (n.includes("ara-290") || n.includes("ara 290") || n.includes("cibinetide")) return "ARA";
  if (
    n.includes("foxo4") ||
    n.includes("fox04") ||
    n.includes("fox 04") ||
    n.includes("fox04-dri") ||
    n.includes("foxo4-dri") ||
    n.includes("fox")
  )
    return "FOX";
  if (n.includes("dsip")) return "DSIP";
  if (n.includes("b12") || n.includes("methylcobalamin") || n.includes("vitamin b")) return "B12";

  // Custom: strip to alphanumerics, take first 5 chars
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9+]/g, "")
    .slice(0, 5);
  return cleaned || "UD";
}

/**
 * Short names for vial wrap labels (can be longer than flip-cap etch).
 * User set: CJC/IPA · FOX4 · TA-1 · TESA · IPA · GLUTA · TB500 · BPC157 · EPIT
 * · CARGI · RETA · SEMA · TIRZ
 */
export const LABEL_SHORT_NAMES = {
  "CJC-1295 / Ipamorelin": "CJC/IPA",
  "CJC-1295 without DAC + Ipamorelin": "CJC/IPA",
  "FOX04-DRI": "FOX4",
  "FOXO4-DRI": "FOX4",
  "Thymosin Alpha-1": "TA-1",
  "TA-1": "TA-1",
  Tesamorelin: "TESA",
  Ipamorelin: "IPA",
  Glutathione: "GLUTA",
  "TB-500": "TB500",
  "BPC-157": "BPC157",
  Epithalon: "EPIT",
  Epitalon: "EPIT",
  Cagrilintide: "CARGI",
  Retatrutide: "RETA",
  Semaglutide: "SEMA",
  Tirzepatide: "TIRZ",
};

export function shortLabelName(name = "") {
  const raw = String(name || "").trim();
  if (!raw) return "UD";
  const exact = LABEL_SHORT_NAMES[raw];
  if (exact) return exact;

  const n = norm(raw);

  if (
    (n.includes("cjc") && n.includes("ipa")) ||
    n.includes("cjc-1295 / ipamorelin") ||
    n.includes("without dac + ipamorelin") ||
    n.includes("cjc + ipa")
  ) {
    return "CJC/IPA";
  }
  if (
    n.includes("foxo4") ||
    n.includes("fox04") ||
    n.includes("fox 04") ||
    n.includes("fox04-dri") ||
    n.includes("foxo4-dri")
  ) {
    return "FOX4";
  }
  if (n.includes("thymosin alpha") || n === "ta-1" || n === "ta1") {
    return "TA-1";
  }
  if (
    (n.includes("tesamorelin") || n.startsWith("tesa")) &&
    !n.includes("ipa")
  ) {
    return "TESA";
  }
  // Standalone Ipamorelin only (blend already returned CJC/IPA)
  if (
    (n.includes("ipamorelin") || n === "ipa") &&
    !n.includes("cjc") &&
    !n.includes("tesa")
  ) {
    return "IPA";
  }
  if (n.includes("glutathione") || n === "gluta" || n === "gsh") {
    return "GLUTA";
  }
  if (n.includes("tb-500") || n.includes("tb500") || n.includes("tb 500") || n.includes("thymosin beta")) {
    return "TB500";
  }
  if (n.includes("bpc-157") || n.includes("bpc157") || n.includes("bpc 157") || (n.includes("bpc") && !n.includes("tb") && !n.includes("wolverine"))) {
    return "BPC157";
  }
  if (n.includes("epithalon") || n.includes("epitalon") || n === "epit" || n === "epi") {
    return "EPIT";
  }
  if (
    (n.includes("cagrilintide") || n.startsWith("cagri") || n.startsWith("cargi")) &&
    !n.includes("sema")
  ) {
    return "CARGI";
  }
  if (n.includes("retatrutide") || n === "reta") {
    return "RETA";
  }
  if (n.includes("semaglutide") || n === "sema") {
    return "SEMA";
  }
  if (n.includes("tirzepatide") || n.startsWith("triz") || n.startsWith("tirz") || n === "tzp") {
    return "TIRZ";
  }

  const cap = shortCapName(raw);
  if (cap === "CJC+") return "CJC/IPA";
  if (cap === "FOX") return "FOX4";
  if (cap === "TA1") return "TA-1";
  if (cap === "GSH") return "GLUTA";
  if (cap === "TB5") return "TB500";
  if (cap === "BPC") return "BPC157";
  if (cap === "EPI") return "EPIT";
  if (cap === "CAGRI") return "CARGI";
  if (cap === "TRIZ") return "TIRZ";
  if (cap === "TESA") return "TESA";
  if (cap === "IPA") return "IPA";
  if (cap === "RETA") return "RETA";
  if (cap === "SEMA") return "SEMA";
  return cap;
}

/** Filename slug for STL downloads. */
export function capStlSlug(name = "") {
  return shortCapName(name)
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "");
}
