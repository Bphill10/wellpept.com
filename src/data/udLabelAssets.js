/**
 * Undisclosed website vial assets.
 *
 * Product photos are STATIC 1024×1536 PNGs from the build-time mounted-label
 * generator only. Live canvas compositing is disconnected from catalog pages.
 */

import websiteManifest from "./udWebsiteVialManifest.json";

export const UD_LABEL_BRAND = {
  latest: "/ud-labels/brand/UD_Brand_Mark_Latest_Original.png",
  blackTransparent: "/ud-labels/brand/UD_Brand_Mark_Black_Transparent.png",
  whiteTransparent: "/ud-labels/brand/UD_Brand_Mark_White_Transparent.png",
  mascot: "/ud-labels/brand/UD_Sentinel_Mascot_Original.png",
  mascotWhite: "/ud-labels/brand/UD_Sentinel_Mascot_White_Transparent.png",
};

export const UD_STOCK_VIALS = {
  white3ml: "/ud-labels/vials/UD_3mL_White_Peptide_Black_Cap_Unlabeled.png",
  blue3ml: "/ud-labels/vials/UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png",
  white10ml: "/ud-labels/vials/UD_10mL_White_Peptide_Black_Cap_Unlabeled.png",
};

/** Featured KLOW 10-vial case photo. */
export const UD_FEATURED_KIT_SRC = "/references/klow-case-kit.png";

/** Hero labeling scene: unlabeled stock vial + flat print preview (print only). */
export const UD_HERO_SCENE = {
  emptyVial: "/references/vial-unlabeled-white.png",
  catalogLabel: "/ud-labels/examples/KLOW_80mg_40x20_Catalog_Preview.png",
};

/** Hand-approved finals (optional overrides; not from rejected batch renderer). */
export const UD_APPROVED_PRODUCT_IMAGES = {
  KLOW: "/ud-labels/approved/KLOW_80mg_3mL_Blue_BlackCap_Website.png",
  "TA-1": "/ud-labels/approved/TA1_5mg_3mL_White_BlackCap_Website_Final.png",
  TA1: "/ud-labels/approved/TA1_5mg_3mL_White_BlackCap_Website_Final.png",
  "NAD+": "/ud-labels/approved/NAD_PLUS_1000mg_10mL_White_BlackCap_Website.png",
  NAD: "/ud-labels/approved/NAD_PLUS_1000mg_10mL_White_BlackCap_Website.png",
};

function normName(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\+/g, "+")
    .replace(/\s+/g, " ");
}

function amountKey(value) {
  const n = Number(value);
  if (Number.isFinite(n)) return String(n);
  return String(value || "").trim();
}

/**
 * Build-time mounted-label website vial (1024×1536 static PNG).
 */
export function websiteVialImage(product = {}) {
  const byKey = websiteManifest?.byKey || {};
  const name = normName(product.name || product.sku || product.labelName);
  if (!name) return "";
  const amount = amountKey(product.mg ?? product.amount ?? product.mass);
  const unit = String(product.unit || "mg").trim().toUpperCase() || "MG";
  const vialMl = Number(product.vialMl) || 3;
  const head = name.split("(")[0].trim();

  const aliases = [name, head].filter(Boolean);
  if (/^RETA\b|^RETATRUTIDE\b/.test(head)) {
    aliases.push("RETA", "RETATRUTIDE");
  }

  for (const n of [...new Set(aliases)]) {
    const key = `${n}|${amount}|${unit}|${vialMl}`;
    if (byKey[key]) return byKey[key];
  }
  return "";
}

/**
 * @deprecated Old Excel catalog website map removed. Use websiteVialImage.
 */
export function catalogVialImage(product = {}) {
  return websiteVialImage(product);
}

/**
 * Prefer build-time website vial; then hand-approved finals only.
 * Never falls back to live canvas compositing.
 */
export function approvedCatalogImage(product = {}) {
  const fromBuild = websiteVialImage(product);
  if (fromBuild) return fromBuild;

  const name = normName(product.name || product.sku);
  const head = name.split("(")[0].trim();
  if (UD_APPROVED_PRODUCT_IMAGES[head]) return UD_APPROVED_PRODUCT_IMAGES[head];
  if (/^KLOW\b/.test(head)) return UD_APPROVED_PRODUCT_IMAGES.KLOW;
  if (/^TA-?1\b|^THYMOSIN\s*ALPHA/.test(head))
    return UD_APPROVED_PRODUCT_IMAGES["TA-1"];
  if (/^NAD\b/.test(head)) return UD_APPROVED_PRODUCT_IMAGES["NAD+"];
  return "";
}
