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
  Tirzepatide: "TRIZ",
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
  Cagrilintide: "CAGRI",
  "ARA-290": "ARA",
  "FOX04-DRI": "FOX",
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
  if (n.includes("tirzepatide") || n.startsWith("triz") || n === "tzp") return "TRIZ";
  if (n.includes("retatrutide") || n === "reta") return "RETA";
  if (n.includes("semaglutide") || n === "sema") return "SEMA";
  if (n.includes("bpc")) return "BPC";
  if (n.includes("tb-500") || n.includes("tb500") || n.includes("tb 500")) return "TB5";
  if (n.includes("klow")) return "KLOW";
  if (n.includes("glow")) return "GLOW";
  if (n.includes("ghk")) return "GHK";
  if (n.includes("tesamorelin") || n.startsWith("tesa")) return "TESA";
  if (n.includes("ipamorelin") || n === "ipa") return "IPA";
  if (n.includes("cjc") && n.includes("ipa")) return "CJC+";
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
  if (n.includes("cagrilintide") || n.startsWith("cagri")) return "CAGRI";
  if (n.includes("ara-290") || n.includes("ara 290") || n.includes("cibinetide")) return "ARA";
  if (n.includes("fox")) return "FOX";
  if (n.includes("dsip")) return "DSIP";
  if (n.includes("b12") || n.includes("methylcobalamin") || n.includes("vitamin b")) return "B12";

  // Custom: strip to alphanumerics, take first 5 chars
  const cleaned = raw
    .toUpperCase()
    .replace(/[^A-Z0-9+]/g, "")
    .slice(0, 5);
  return cleaned || "UD";
}

/** Filename slug for STL downloads. */
export function capStlSlug(name = "") {
  return shortCapName(name)
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "");
}
