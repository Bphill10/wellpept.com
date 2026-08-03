/**
 * Undisclosed label-system website assets (from ud-label-system package).
 * Approved catalog photos + stock vials + brand — see ud-label-system/START_HERE_CURSOR.md
 */

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

/** Final approved website vial photos (black-cap, labeled). */
export const UD_APPROVED_PRODUCT_IMAGES = {
  KLOW: "/ud-labels/approved/KLOW_80mg_3mL_Blue_BlackCap_Website.png",
  "TA-1": "/ud-labels/approved/TA1_5mg_3mL_White_BlackCap_Website_Final.png",
  TA1: "/ud-labels/approved/TA1_5mg_3mL_White_BlackCap_Website_Final.png",
  "THYMOSIN ALPHA-1":
    "/ud-labels/approved/TA1_5mg_3mL_White_BlackCap_Website_Final.png",
  "THYMOSIN ALPHA 1":
    "/ud-labels/approved/TA1_5mg_3mL_White_BlackCap_Website_Final.png",
  NAD: "/ud-labels/approved/NAD_PLUS_1000mg_10mL_White_BlackCap_Website.png",
  "NAD+": "/ud-labels/approved/NAD_PLUS_1000mg_10mL_White_BlackCap_Website.png",
  "NAD PLUS":
    "/ud-labels/approved/NAD_PLUS_1000mg_10mL_White_BlackCap_Website.png",
};

/**
 * Return approved catalog photo URL when the product matches a locked reference.
 */
export function approvedCatalogImage(product = {}) {
  const name = String(product.name || product.sku || "")
    .trim()
    .toUpperCase();
  if (!name) return "";
  if (UD_APPROVED_PRODUCT_IMAGES[name]) return UD_APPROVED_PRODUCT_IMAGES[name];
  if (/\bKLOW\b/.test(name)) return UD_APPROVED_PRODUCT_IMAGES.KLOW;
  if (/\bTA-?1\b|\bTHYMOSIN\s*ALPHA/.test(name))
    return UD_APPROVED_PRODUCT_IMAGES.TA1;
  if (/\bNAD\+?\b|\bNAD\s*PLUS\b/.test(name))
    return UD_APPROVED_PRODUCT_IMAGES["NAD+"];
  return "";
}
