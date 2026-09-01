/**
 * Undisclosed website vial assets.
 *
 * Catalog photos: Excel-mapped Website.webp plates in public/ud-labels/catalog/.
 * One native website renderer plus hand-approved compatibility fallbacks.
 */

import catalogManifest from "./udCatalogVialManifest.json";
import silverVialOverrides from "./udSilverVialOverrides.json";

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

/** Manifest candidate keys for a product: name aliases x amount/unit/vialMl. */
function candidateKeys(product = {}) {
  const name = normName(product.name || product.sku || product.labelName);
  if (!name) return { keys: [], aliases: [], amount: "", vialMl: 3 };
  const amount = amountKey(product.mg ?? product.amount ?? product.mass);
  const unit = String(product.unit || "mg").trim().toUpperCase() || "MG";
  const vialMl = Number(product.vialMl) || 3;
  const head = name.split("(")[0].trim();

  const nameAliases = [name, head].filter(Boolean);
  if (/^TA1\b|^THYMOSIN\s*ALPHA/.test(head)) nameAliases.push("TA-1");
  if (/^NAD\b|^NAD\s*PLUS/.test(head)) nameAliases.push("NAD+", "NAD PLUS");
  if (/^BPC157\b|^BPC\s*157\b/.test(head)) nameAliases.push("BPC-157", "BPC157");
  if (/^TB500\b|^TB\s*500\b/.test(head)) nameAliases.push("TB-500", "TB500");
  if (/^AHK\b/.test(head)) nameAliases.push("AHK-CU", "AHK CU");
  if (/^GHK\b/.test(head) && !/\bBASIC\b/.test(head))
    nameAliases.push("GHK-CU", "GHK CU");
  if (/CJC/.test(head) && /IPA|IPAMORELIN/.test(head)) {
    nameAliases.push("CJC/IPA", "CJC-1295 / IPAMORELIN", "CI");
  }
  if (/^RETA\b|^RETATRUTIDE\b/.test(head)) nameAliases.push("RETA", "RETATRUTIDE");
  if (/^VITAMIN\s*B12\b|^B12\b/.test(head)) nameAliases.push("B12", "VITAMIN B12");

  const aliases = [...new Set(nameAliases)];
  const keys = [];
  for (const n of aliases) {
    keys.push(
      `${n}|${amount}|${unit}|${vialMl}`,
      `${n}|${amount}|MG|${vialMl}`,
      `${n}|${amount}|IU|${vialMl}`,
      `${n}|${amount}`
    );
  }
  return { keys, aliases, amount, vialMl };
}

/**
 * Curated silver-accent finals (per strength). Top priority so hand-built photos
 * win over the auto-generated catalog plates.
 */
export function approvedSilverImage(product = {}) {
  const { keys } = candidateKeys(product);
  for (const key of keys) {
    if (silverVialOverrides[key]) return silverVialOverrides[key];
  }
  return "";
}

/**
 * Resolve placed-label vial photo from Excel catalog mapping.
 */
export function catalogVialImage(product = {}) {
  const byKey = catalogManifest?.byKey || {};
  const products = catalogManifest?.products || [];
  const { keys, aliases, amount, vialMl } = candidateKeys(product);
  if (!keys.length) return "";

  for (const key of keys) {
    if (byKey[key]) return byKey[key];
  }

  const amtNum = Number(amount);
  const soft = products
    .filter((row) => {
      const rn = normName(row.labelName);
      return aliases.includes(rn) && Number(row.vialMl) === vialMl;
    })
    .sort(
      (a, b) =>
        Math.abs(Number(a.amount) - amtNum) -
        Math.abs(Number(b.amount) - amtNum)
    );
  if (soft[0]?.image) return soft[0].image;

  return "";
}

/**
 * Curated silver finals first, then the catalog renderer output, then
 * hand-approved finals as a last-resort compatibility fallback.
 */
export function approvedCatalogImage(product = {}) {
  const silver = approvedSilverImage(product);
  if (silver) return silver;

  const fromMap = catalogVialImage(product);
  if (fromMap) return fromMap;

  const name = normName(product.name || product.sku);
  const head = name.split("(")[0].trim();
  if (UD_APPROVED_PRODUCT_IMAGES[head]) return UD_APPROVED_PRODUCT_IMAGES[head];
  if (/^KLOW\b/.test(head)) return UD_APPROVED_PRODUCT_IMAGES.KLOW;
  if (/^TA-?1\b|^THYMOSIN\s*ALPHA/.test(head))
    return UD_APPROVED_PRODUCT_IMAGES["TA-1"];
  if (/^NAD\b/.test(head)) return UD_APPROVED_PRODUCT_IMAGES["NAD+"];
  return "";
}

export function getCatalogManifest() {
  return catalogManifest;
}
