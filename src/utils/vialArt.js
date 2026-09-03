import QRCode from "qrcode";
import { shortLabelName } from "../data/capNames";

/** Wellpept / Undisclosed vial art — photoreal glass vial + compact clinical sticker. */

/** Undisclosed brand plate (labeled vial with UD mark). */
export const BRAND_IMAGE_SRC =
  "/ud-labels/approved/TA1_5mg_3mL_White_BlackCap_Website_Final.png";
export const BRAND_IMAGE_FALLBACK_SRC =
  "/ud-labels/vials/UD_3mL_White_Peptide_Black_Cap_Unlabeled.png";
/** Photoreal 3 mL plate — blank Undisclosed wrap, neutral lyophilized cake. */
export const BRAND_VIAL_SRC =
  "/ud-labels/vials/UD_3mL_White_Peptide_Black_Cap_Unlabeled.png";
/** Compact plate for catalog cards / phone grids. */
export const BRAND_VIAL_CARD_SRC =
  "/ud-labels/vials/UD_3mL_White_Peptide_Black_Cap_Unlabeled.png";
/** Calculator-only unlabeled glass plate with a low, flat lyophilized layer. */
export const UNLABELED_VIAL_SRC =
  "/references/vial-unlabeled-white.png";
export const UNLABELED_VIAL_CARD_SRC =
  "/references/vial-unlabeled-white.png";
/** Featured KLOW 10-vial clear kit case photo. */
export const KLOW_CASE_KIT_SRC = "/references/klow-case-kit.png";
export const KLOW_CASE_KIT_SM_SRC = "/references/klow-case-kit.png";
/** Complete filled-label example (calculator target look). */
export const VIAL_COMPLETE_EXAMPLE_SRC =
  "/ud-labels/approved/KLOW_80mg_3mL_Blue_BlackCap_Website.png";
/** Photoreal unlabeled 10 mL research vial (studio photo). */
export const BRAND_VIAL_10_SRC =
  "/ud-labels/vials/UD_10mL_White_Peptide_Black_Cap_Unlabeled.png";
export const BRAND_VIAL_10_CARD_SRC =
  "/ud-labels/vials/UD_10mL_White_Peptide_Black_Cap_Unlabeled.png";
/** Dedicated B12 10 mL ruby-red liquid plate (never a recolored powder cake). */
export const BRAND_VIAL_B12_SRC =
  "/ud-labels/vials/UD_10mL_B12_Red_Liquid_Black_Cap_Unlabeled.png";
export const BRAND_VIAL_B12_CARD_SRC =
  "/ud-labels/vials/UD_10mL_B12_Red_Liquid_Black_Cap_Unlabeled.png";
/** Studio blue-cake vial — blank Undisclosed wrap (KLOW / GLOW / GHK-Cu). */
export const BLUE_VIAL_SRC =
  "/ud-labels/vials/UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png";
export const BLUE_VIAL_CARD_SRC =
  "/ud-labels/vials/UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png";
export const KLOW_VIAL_SRC =
  "/ud-labels/approved/KLOW_80mg_3mL_Blue_BlackCap_Website.png";
export const KLOW_VIAL_CARD_SRC =
  "/ud-labels/approved/KLOW_80mg_3mL_Blue_BlackCap_Website.png";
export const KLOW_VIAL_FALLBACK_SRC =
  "/ud-labels/vials/UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png";
/** Blank clinical wrap template (flat). */
export const BLANK_LABEL_SRC =
  "/ud-labels/examples/KLOW_80mg_40x20_Catalog_Preview.png";
export const BLANK_LABEL_FALLBACK_SRC =
  "/ud-labels/examples/TA1_5mg_40x20_Catalog_Preview.png";
/** Latest supplied UD hex brand mark (authoritative — replaces old ud-monogram.svg). */
export const UD_BRAND_MARK_LATEST =
  "/ud-labels/brand/UD_Brand_Mark_Latest_Original.png";
export const UD_BRAND_MARK_WHITE =
  "/ud-labels/brand/UD_Brand_Mark_White_Transparent.png";
/** Hex UD seal / monogram for Undisclosed UI chrome + vial art. */
export const UD_MARK_SRC = UD_BRAND_MARK_WHITE;
/** UD Sentinel mascot. */
export const UD_SENTINEL_MASCOT =
  "/ud-labels/brand/UD_Sentinel_Mascot_Black_Transparent.png";
/** @deprecated use UD_MARK_SRC */
export const WP_MARK_SRC = UD_MARK_SRC;
/** @deprecated use UD_MARK_SRC */
export const WP_MONOGRAM_SRC = UD_MARK_SRC;

/** Print resolution for physical wrap downloads (true mm size via PNG pHYs). */
export const LABEL_PRINT_DPI = 600;

/**
 * Hard lock: 3 mL research vials use a 40 mm × 20 mm wrap (W × H).
 * Do not change without updating die-cut stock.
 */
export const LABEL_3ML_MM = Object.freeze({ widthMm: 40, heightMm: 20 });

/**
 * Physical wrap label size by vial bottle (rounded sticker).
 * 3 mL → 40×20 · 5 mL → 40×25 · 10 mL → 50×30 · 30 mL → 70×40
 * @type {Record<number, { widthMm: number, heightMm: number, src?: string }>}
 */
export const LABEL_SPEC_BY_VIAL_ML = {
  3: { ...LABEL_3ML_MM, src: BLANK_LABEL_SRC },
  5: { widthMm: 40, heightMm: 25 },
  10: { widthMm: 50, heightMm: 30 },
  30: { widthMm: 70, heightMm: 40 },
};

export const LABEL_BOTTLE_SIZES_ML = [3, 5, 10, 30];

/**
 * Four Undisclosed NIIMBOT-aligned label templates for the calculator UI.
 * Catalog = name/amount/form/storage · Calculator = + diluent/conc/dose block.
 */
export const UD_LABEL_TEMPLATE_OPTIONS = Object.freeze([
  {
    id: "catalog-40x20",
    labelType: "CATALOG",
    labelSize: "40x20",
    vialMl: 3,
    title: "Catalog · 40×20",
    blurb: "3 mL · wrap without dosage block",
  },
  {
    id: "calculator-40x20",
    labelType: "CALCULATOR",
    labelSize: "40x20",
    vialMl: 3,
    title: "Calculator · 40×20",
    blurb: "3 mL · diluent / concentration / dose",
  },
  {
    id: "catalog-50x30",
    labelType: "CATALOG",
    labelSize: "50x30",
    vialMl: 10,
    title: "Catalog · 50×30",
    blurb: "10 mL · wrap without dosage block",
  },
  {
    id: "calculator-50x30",
    labelType: "CALCULATOR",
    labelSize: "50x30",
    vialMl: 10,
    title: "Calculator · 50×30",
    blurb: "10 mL · diluent / concentration / dose",
  },
]);

export function udLabelTemplateById(id) {
  return (
    UD_LABEL_TEMPLATE_OPTIONS.find((t) => t.id === id) ||
    UD_LABEL_TEMPLATE_OPTIONS[1]
  );
}

export function udLabelTemplateFor(vialMl = 3, labelType = "CALCULATOR") {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const type = String(labelType || "CALCULATOR").toUpperCase() === "CATALOG"
    ? "CATALOG"
    : "CALCULATOR";
  const size = ml >= 10 ? "50x30" : "40x20";
  return (
    UD_LABEL_TEMPLATE_OPTIONS.find(
      (t) => t.vialMl === ml && t.labelType === type && t.labelSize === size
    ) || UD_LABEL_TEMPLATE_OPTIONS[1]
  );
}

export function labelSpecForVialMl(vialMl = 3) {
  const ml = Number(vialMl) || 3;
  // 3 mL always 40×20 mm — ignore any mutated table entry.
  if (ml === 3) return { ...LABEL_3ML_MM, src: BLANK_LABEL_SRC };
  if (LABEL_SPEC_BY_VIAL_ML[ml]) return LABEL_SPEC_BY_VIAL_ML[ml];
  // Nearest known bottle size (never coerce unknown small bottles away from 3 mL)
  if (ml >= 20) return LABEL_SPEC_BY_VIAL_ML[30];
  if (ml >= 8) return LABEL_SPEC_BY_VIAL_ML[10];
  if (ml >= 4) return LABEL_SPEC_BY_VIAL_ML[5];
  return { ...LABEL_3ML_MM, src: BLANK_LABEL_SRC };
}

/** Print pixels + on-screen preview size for a physical wrap label. */
export function physicalLabelCanvasSize(vialMl = 3, size = "md") {
  const spec = labelSpecForVialMl(vialMl);
  const dpi = LABEL_PRINT_DPI;
  // Exact mm → px at LABEL_PRINT_DPI (3 mL → 945 × 472 @ 600 DPI).
  const printW = Math.round((spec.widthMm / 25.4) * dpi);
  const printH = Math.round((spec.heightMm / 25.4) * dpi);
  // Larger on-screen preview so text stays readable in the 50/50 calc column.
  const pxPerMm = { sm: 14, md: 20, lg: 28 }[size] || 20;
  // ~2 mm corner radius — reads as a die-cut sticker, not a sharp card.
  const cornerR = Math.max(14, Math.round((2 / 25.4) * dpi));
  return {
    spec,
    dpi,
    printW,
    printH,
    cssW: `${Math.round(spec.widthMm * pxPerMm)}px`,
    cssH: `${Math.round(spec.heightMm * pxPerMm)}px`,
    cornerR,
  };
}

let brandImageCache = null;
let brandImagePromise = null;
let brandVialCache = null;
let brandVialPromise = null;
let brandVialCardCache = null;
let brandVialCardPromise = null;
let brandVial10Cache = null;
let brandVial10Promise = null;
let brandVial10CardCache = null;
let brandVial10CardPromise = null;
let brandVialB12Cache = null;
let brandVialB12Promise = null;
let brandVialB12CardCache = null;
let brandVialB12CardPromise = null;
let klowVialCache = null;
let klowVialPromise = null;
let klowVialCardCache = null;
let klowVialCardPromise = null;
let blueVialCache = null;
let blueVialPromise = null;
let blueVialCardCache = null;
let blueVialCardPromise = null;
let unlabeledVialCache = null;
let unlabeledVialPromise = null;
let blankLabelCache = null;
let blankLabelPromise = null;
let udMarkCache = null;
let udMarkPromise = null;
let sentinelMascotCache = null;
let sentinelMascotPromise = null;

function loadImage(src) {
  if (typeof Image === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

/** Prefetch the Undisclosed brand plate (UD mark) for canvas compositing. */
export function loadBrandImage() {
  if (brandImageCache) return Promise.resolve(brandImageCache);
  if (brandImagePromise) return brandImagePromise;
  brandImagePromise = loadImage(BRAND_IMAGE_SRC).then(async (img) => {
    if (img) {
      brandImageCache = img;
      return img;
    }
    const jpg = await loadImage(BRAND_IMAGE_FALLBACK_SRC);
    brandImageCache = jpg;
    return jpg;
  });
  return brandImagePromise;
}

/** Prefetch the real studio 3 mL vial photo. */
export function loadBrandVial() {
  if (brandVialCache) return Promise.resolve(brandVialCache);
  if (brandVialPromise) return brandVialPromise;
  brandVialPromise = loadImage(BRAND_VIAL_SRC).then(async (img) => {
    if (img) {
      brandVialCache = img;
      return img;
    }
    const plate = await loadBrandImage();
    brandVialCache = plate;
    return plate;
  });
  return brandVialPromise;
}

/** Compact 3 mL plate for catalog / phone cards. */
export function loadBrandVialCard() {
  if (brandVialCardCache) return Promise.resolve(brandVialCardCache);
  if (brandVialCardPromise) return brandVialCardPromise;
  brandVialCardPromise = loadImage(BRAND_VIAL_CARD_SRC).then(async (img) => {
    if (img) {
      brandVialCardCache = img;
      return img;
    }
    return loadBrandVial();
  });
  return brandVialCardPromise;
}

/** Blue-cake studio plate (KLOW / GLOW / GHK-Cu) — blank wrap template. */
export function loadBlueVial() {
  if (blueVialCache) return Promise.resolve(blueVialCache);
  if (blueVialPromise) return blueVialPromise;
  blueVialPromise = loadImage(BLUE_VIAL_SRC).then((img) => {
    blueVialCache = img;
    return img;
  });
  return blueVialPromise;
}

export function loadBlueVialCard() {
  if (blueVialCardCache) return Promise.resolve(blueVialCardCache);
  if (blueVialCardPromise) return blueVialCardPromise;
  blueVialCardPromise = loadImage(BLUE_VIAL_CARD_SRC).then(async (img) => {
    if (img) {
      blueVialCardCache = img;
      return img;
    }
    return loadBlueVial();
  });
  return blueVialCardPromise;
}

/** Prefetch the real studio 10 mL vial photo. */
export function loadBrandVial10() {
  if (brandVial10Cache) return Promise.resolve(brandVial10Cache);
  if (brandVial10Promise) return brandVial10Promise;
  brandVial10Promise = loadImage(BRAND_VIAL_10_SRC).then(async (img) => {
    if (img) {
      brandVial10Cache = img;
      return img;
    }
    return loadBrandVial();
  });
  return brandVial10Promise;
}

export function loadBrandVial10Card() {
  if (brandVial10CardCache) return Promise.resolve(brandVial10CardCache);
  if (brandVial10CardPromise) return brandVial10CardPromise;
  brandVial10CardPromise = loadImage(BRAND_VIAL_10_CARD_SRC).then(async (img) => {
    if (img) {
      brandVial10CardCache = img;
      return img;
    }
    return loadBrandVial10();
  });
  return brandVial10CardPromise;
}

/** Prefetch dedicated B12 ruby-liquid 10 mL plate. */
export function loadBrandVialB12() {
  if (brandVialB12Cache) return Promise.resolve(brandVialB12Cache);
  if (brandVialB12Promise) return brandVialB12Promise;
  brandVialB12Promise = loadImage(BRAND_VIAL_B12_SRC).then(async (img) => {
    if (img) {
      brandVialB12Cache = img;
      return img;
    }
    return loadBrandVial10();
  });
  return brandVialB12Promise;
}

export function loadBrandVialB12Card() {
  if (brandVialB12CardCache) return Promise.resolve(brandVialB12CardCache);
  if (brandVialB12CardPromise) return brandVialB12CardPromise;
  brandVialB12CardPromise = loadImage(BRAND_VIAL_B12_CARD_SRC).then(async (img) => {
    if (img) {
      brandVialB12CardCache = img;
      return img;
    }
    return loadBrandVialB12();
  });
  return brandVialB12CardPromise;
}

/** Prefetch unlabeled 3 mL studio plate (no wrap — calculator composites the live label). */
export function loadUnlabeledVial() {
  if (unlabeledVialCache) return Promise.resolve(unlabeledVialCache);
  if (unlabeledVialPromise) return unlabeledVialPromise;
  unlabeledVialPromise = loadImage(UNLABELED_VIAL_SRC).then(async (img) => {
    if (img) {
      unlabeledVialCache = img;
      return img;
    }
    // Fall back to blank-wrap white plate if unlabeled asset missing
    return loadBrandVial();
  });
  return unlabeledVialPromise;
}

/** Prefetch the studio blue-cake plate (blank wrap). */
export function loadKlowVial() {
  return loadBlueVial().then((img) => {
    klowVialCache = img;
    return img;
  });
}

export function loadKlowVialCard() {
  return loadBlueVialCard().then((img) => {
    klowVialCardCache = img;
    return img;
  });
}

/** Prefetch the Undisclosed UD hex mark. */
export function loadUdMark() {
  if (udMarkCache) return Promise.resolve(udMarkCache);
  if (udMarkPromise) return udMarkPromise;
  udMarkPromise = loadImage(UD_MARK_SRC).then((img) => {
    udMarkCache = img;
    return img;
  });
  return udMarkPromise;
}

/** Prefetch the black transparent Sentinel used above calculator QR codes. */
export function loadSentinelMascot() {
  if (sentinelMascotCache) return Promise.resolve(sentinelMascotCache);
  if (sentinelMascotPromise) return sentinelMascotPromise;
  sentinelMascotPromise = loadImage(UD_SENTINEL_MASCOT).then((img) => {
    sentinelMascotCache = img;
    return img;
  });
  return sentinelMascotPromise;
}

/** @deprecated use loadUdMark — Undisclosed seals are UD, not W. */
export function loadWpMark() {
  return loadUdMark();
}

/** Prefetch the blank 40×20 mm clinical wrap photo (peptide fields cleared). */
export function loadBlankLabelImage() {
  if (blankLabelCache) return Promise.resolve(blankLabelCache);
  if (blankLabelPromise) return blankLabelPromise;
  blankLabelPromise = loadImage(BLANK_LABEL_SRC).then(async (img) => {
    if (img) {
      blankLabelCache = img;
      return img;
    }
    const jpg = await loadImage(
      "/ud-labels/examples/TA1_5mg_40x20_Catalog_Preview.png"
    );
    blankLabelCache = jpg;
    return jpg;
  });
  return blankLabelPromise;
}

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < String(str).length; i += 1) {
    h ^= String(str).charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a) {
  return function rand() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function getVialPalette(seed = "", category = "Research") {
  return {
    seed: hashString(`${seed}-${category}`),
    labelTint: "#0a0a0a",
    accent: "#0047ab",
  };
}

function wrapLines(ctx, text, maxWidth, maxLines = 3) {
  const words = String(text || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return [""];
  const lines = [];
  let current = words[0];
  for (let i = 1; i < words.length; i += 1) {
    const next = `${current} ${words[i]}`;
    if (ctx.measureText(next).width <= maxWidth) current = next;
    else {
      lines.push(current);
      current = words[i];
      if (lines.length >= maxLines - 1) break;
    }
  }
  lines.push(current);
  if (lines.length > maxLines) {
    const last = lines[maxLines - 1];
    lines[maxLines - 1] =
      last.length > 3 ? `${last.slice(0, Math.max(0, last.length - 1))}…` : last;
    return lines.slice(0, maxLines);
  }
  return lines;
}

function roundRect(ctx, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function ellipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
}

/** Lyophilized cake — white for most kits; blue for KLOW, GLOW, GHK-Cu. */
function drawPowderCake(ctx, bodyX, cakeY, bodyW, cakeH, radius, powderColor = "white") {
  ctx.save();
  // Cake silhouette: flat floor, soft dome top (real lyophilized plug)
  const dome = Math.min(cakeH * 0.45, bodyW * 0.28, radius * 1.8);
  ctx.beginPath();
  ctx.moveTo(bodyX, cakeY + cakeH);
  ctx.lineTo(bodyX, cakeY + dome);
  ctx.bezierCurveTo(
    bodyX,
    cakeY,
    bodyX + bodyW,
    cakeY,
    bodyX + bodyW,
    cakeY + dome
  );
  ctx.lineTo(bodyX + bodyW, cakeY + cakeH);
  ctx.closePath();
  ctx.clip();

  if (powderColor === "blue") {
    // Dusty cobalt cake (not neon) — reads as lyophilized, not a UI chip
    ctx.fillStyle = "#1a4f7a";
    ctx.fillRect(bodyX - 1, cakeY - 1, bodyW + 2, cakeH + 2);
    const cake = ctx.createLinearGradient(bodyX, cakeY, bodyX, cakeY + cakeH);
    cake.addColorStop(0, "#7eb6d9");
    cake.addColorStop(0.35, "#4f92bf");
    cake.addColorStop(0.7, "#2f6f9c");
    cake.addColorStop(1, "#1c557c");
    ctx.fillStyle = cake;
    ctx.fillRect(bodyX, cakeY, bodyW, cakeH);
  } else {
    ctx.fillStyle = "#d8dde4";
    ctx.fillRect(bodyX - 1, cakeY - 1, bodyW + 2, cakeH + 2);
    const cake = ctx.createLinearGradient(bodyX, cakeY, bodyX, cakeY + cakeH);
    cake.addColorStop(0, "#ffffff");
    cake.addColorStop(0.45, "#eef1f5");
    cake.addColorStop(1, "#c9ced6");
    ctx.fillStyle = cake;
    ctx.fillRect(bodyX, cakeY, bodyW, cakeH);
  }

  const rand = mulberry32(powderColor === "blue" ? 91 : 42);
  ctx.fillStyle =
    powderColor === "blue" ? "rgba(230,245,255,0.4)" : "rgba(255,255,255,0.55)";
  for (let i = 0; i < 40; i += 1) {
    ctx.fillRect(
      bodyX + 2 + rand() * (bodyW - 4),
      cakeY + dome * 0.35 + rand() * (cakeH - dome * 0.4),
      1 + rand() * 1.8,
      1 + rand() * 1.8
    );
  }
  // Soft top highlight
  const hi = ctx.createRadialGradient(
    bodyX + bodyW * 0.45,
    cakeY + dome * 0.6,
    1,
    bodyX + bodyW * 0.5,
    cakeY + dome,
    bodyW * 0.55
  );
  hi.addColorStop(
    0,
    powderColor === "blue" ? "rgba(210,235,255,0.35)" : "rgba(255,255,255,0.4)"
  );
  hi.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hi;
  ctx.fillRect(bodyX, cakeY, bodyW, cakeH * 0.55);
  ctx.restore();
}

/**
 * Standalone B12 / methylcobalamin only — not Lipo-C / MIC blends that mention B12.
 */
export function isB12Compound(name = "", form = "") {
  void form;
  const raw = String(name || "").trim();
  if (!raw) return false;
  const head = raw.split("(")[0].trim();
  const upper = raw.toUpperCase();
  if (/LIPO|MIC\b|WITHOUT|WITH\s+B12/i.test(upper) && !/^B12\b/i.test(head) && !/^VITAMIN\s*B\s*12\b/i.test(head)) {
    return false;
  }
  if (/^B12$/i.test(head) || /^B12\b/i.test(head)) return true;
  if (/^VITAMIN\s*B\s*12\b/i.test(head) || /^VITAMIN\s*B\s*12\b/i.test(raw)) return true;
  if (/\bmethylcobalamin\b/i.test(raw) && /\bb12\b/i.test(raw)) return true;
  return false;
}

/** True for NAD / Glutathione / B12 — the only 10 mL bottles. (Tesamorelin is a 3 mL.) */
export function isTenMlCompound(name = "", form = "") {
  const text = `${name || ""} ${form || ""}`;
  return (
    /\bglutathione\b/i.test(text) ||
    /\bgluta\b/i.test(text) ||
    /\bnad\+?\b/i.test(text) ||
    isB12Compound(name, form)
  );
}

/** True for HGH lines — the only IU products. */
export function isHghCompound(name = "", form = "") {
  const text = `${name || ""} ${form || ""}`;
  return /\bhgh\b/i.test(text) || /\bgrowth hormone\b/i.test(text);
}

/** KLOW uses the dedicated blue studio plate. */
export function isKlowCompound(name = "", form = "") {
  void form;
  const head = String(name || "")
    .split("(")[0]
    .trim()
    .toUpperCase();
  return head === "KLOW" || /^KLOW\b/.test(head);
}

/**
 * Blue lyophilized cake plate — only GLOW, KLOW, and GHK-Cu.
 * Name-only (ignore form/subtitle) so blend ingredient text can't flip other vials.
 */
export function isBluePowderCompound(name = "", form = "") {
  void form;
  const raw = String(name || "").trim();
  if (!raw) return false;
  const upper = raw.toUpperCase();
  const head = upper.split("(")[0].trim();

  if (head === "KLOW" || /^KLOW\b/.test(head)) return true;
  if (head === "GLOW" || /^GLOW\b/.test(head)) return true;
  // GHK-Cu / GHK CU / AHK-Cu — not GHK BASIC
  if (/\bBASIC\b/.test(head)) return false;
  if (/^GHK[-\s]?CU\b/.test(head) || /^GHK[-\s]?CU\b/.test(upper)) return true;
  if (/^AHK[-\s]?CU\b/.test(head) || /^AHK[-\s]?CU\b/.test(upper)) return true;
  return false;
}

/** Powder fill color for kit vials. */
export function resolvePowderColor({ name = "", form = "" } = {}) {
  return isBluePowderCompound(name, form) ? "blue" : "white";
}

/**
 * Vial volume for composited plates.
 * Prefer an explicit bottle size when the caller passed one (calculator
 * templates, catalog Excel map). Otherwise: NAD / Glutathione / B12 → 10 mL.
 */
export function resolveVialMl({ form = "", name = "", vialMl } = {}) {
  const explicit = Number(vialMl);
  if (Number.isFinite(explicit) && explicit > 0) {
    if (explicit >= 20) return 30;
    if (explicit >= 8) return 10;
    if (explicit >= 4) return 5;
    return 3;
  }
  if (isTenMlCompound(name, form)) return 10;
  return 3;
}

/**
 * Strength unit: default mg. Only HGH is IU.
 * Legacy mcg/ug and IU on non-HGH lines normalize to mg.
 */
export function resolveVialUnit({ name = "", form = "", unit } = {}) {
  if (isHghCompound(name, form)) return "IU";
  void unit;
  return "mg";
}

function drawDarkStudio(ctx, w, h) {
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, w, h);
}

/**
 * UD hex seal fallback when the SVG mark fails to load.
 */
function drawUdMonogramSeal(ctx, cx, cy, r) {
  drawLabelSpineMark(ctx, cx, cy, r);
}

/** Draw the Undisclosed UD hex mark, or fall back to a drawn hex. */
function drawUdSeal(ctx, cx, cy, r, markImage) {
  if (markImage && markImage.width) {
    ctx.save();
    ctx.drawImage(markImage, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    return;
  }
  drawUdMonogramSeal(ctx, cx, cy, r);
}

/** @deprecated use drawUdSeal */
function drawWpSeal(ctx, cx, cy, r, markImage) {
  drawUdSeal(ctx, cx, cy, r, markImage);
}

function buildQrMatrix(seedStr, n = 21) {
  const rand = mulberry32(hashString(seedStr) || 1);
  const m = Array.from({ length: n }, () => Array(n).fill(null));

  function paintFinder(ox, oy) {
    for (let r = 0; r < 7; r += 1) {
      for (let c = 0; c < 7; c += 1) {
        const border = r === 0 || r === 6 || c === 0 || c === 6;
        const core = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        m[oy + r][ox + c] = border || core;
      }
    }
  }

  paintFinder(0, 0);
  paintFinder(n - 7, 0);
  paintFinder(0, n - 7);

  for (let i = 0; i < 8; i += 1) {
    if (m[7][i] == null) m[7][i] = false;
    if (m[i][7] == null) m[i][7] = false;
    if (m[7][n - 1 - i] == null) m[7][n - 1 - i] = false;
    if (m[i][n - 8] == null) m[i][n - 8] = false;
    if (m[n - 8][i] == null) m[n - 8][i] = false;
    if (m[n - 1 - i][7] == null) m[n - 1 - i][7] = false;
  }

  for (let i = 8; i < n - 8; i += 1) {
    if (m[6][i] == null) m[6][i] = i % 2 === 0;
    if (m[i][6] == null) m[i][6] = i % 2 === 0;
  }
  m[n - 8][8] = true;

  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (m[r][c] == null) m[r][c] = rand() > 0.48;
    }
  }
  return m;
}

function buildRealQrMatrix(payload) {
  try {
    const qr = QRCode.create(String(payload), { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    const m = Array.from({ length: n }, (_, r) =>
      Array.from({ length: n }, (_, c) => Boolean(qr.modules.get(r, c)))
    );
    return m;
  } catch {
    return null;
  }
}

/** Scannable QR when `payload` is set; otherwise a deterministic decorative mark. */
export function drawQrCode(ctx, x, y, size, seedStr, inverted = false, payload = "") {
  const quiet = Math.max(1, Math.floor(size * 0.08));
  const inner = size - quiet * 2;
  const matrix =
    (payload && buildRealQrMatrix(payload)) || buildQrMatrix(seedStr || payload || "WP", 21);
  const n = matrix.length;
  const mod = inner / n;

  ctx.fillStyle = inverted ? "#0a0a0a" : "#ffffff";
  roundRect(ctx, x, y, size, size, Math.max(1, size * 0.06));
  ctx.fill();

  ctx.fillStyle = inverted ? "#ffffff" : "#0a0a0a";
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (!matrix[r][c]) continue;
      ctx.fillRect(
        x + quiet + c * mod,
        y + quiet + r * mod,
        Math.ceil(mod),
        Math.ceil(mod)
      );
    }
  }

  ctx.strokeStyle = inverted ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)";
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, size - 1, size - 1, Math.max(1, size * 0.06));
  ctx.stroke();
}

function qrSeedFromOptions(options) {
  const {
    name = "",
    mass = "",
    unit = "mg",
    bacWater = "",
    concentration = "",
    doseRange = "",
    sku = "",
  } = options;
  return `WP|${name}|${mass}${unit}|${bacWater}|${concentration}|${doseRange}|${sku}`;
}

/** Default QR target when no COA is stored — the public site. */
export const SITE_QR_URL = "https://www.wellpept.com";

function qrPayloadFromOptions(options = {}) {
  const coa = String(options.coaUrl || "").trim();
  if (coa) return coa;
  const qr = String(options.qrPayload || "").trim();
  if (qr) return qr;
  return SITE_QR_URL;
}

function drawBrandWordmark(ctx, cx, y, maxW) {
  ctx.fillStyle = "#f5f5f5";
  ctx.font = `600 ${Math.max(11, maxW * 0.11)}px "Cormorant Garamond", "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("UNDISCLOSED", cx, y);

  const lineW = maxW * 0.42;
  const grad = ctx.createLinearGradient(cx - lineW, 0, cx + lineW, 0);
  grad.addColorStop(0, "rgba(200,210,220,0)");
  grad.addColorStop(0.5, "rgba(220,228,235,0.9)");
  grad.addColorStop(1, "rgba(200,210,220,0)");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - lineW, y + maxW * 0.055);
  ctx.lineTo(cx + lineW, y + maxW * 0.055);
  ctx.stroke();
  ellipse(ctx, cx, y + maxW * 0.055, 3.2, 3.2);
  ctx.strokeStyle = "rgba(210,218,226,0.95)";
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `600 ${Math.max(8, maxW * 0.048)}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("BROUGHT TO YOU BY WELLPEPT", cx, y + maxW * 0.12);
}

/**
 * 3 mL vial matching the Undisclosed brand image:
 * brushed silver cap · clear glass · lyophilized cake · matte black V-sleeve · UD hex seal.
 */
function drawBrandThreeMl(ctx, dims, options) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    sku = "",
    reconstituted = false,
    wpMark = null,
    udMark = null,
    bacWater = "",
    concentration = "",
    doseRange = "",
    qrPayload = "",
  } = options;

  const cx = dims.w / 2;
  drawDarkStudio(ctx, dims.w, dims.h);

  // Soft vignette spotlight like brand shot
  const spot = ctx.createRadialGradient(cx, dims.h * 0.35, 10, cx, dims.h * 0.4, dims.w * 0.55);
  spot.addColorStop(0, "rgba(255,255,255,0.05)");
  spot.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, dims.w, dims.h);

  const bodyW = dims.w * 0.3;
  const bodyH = dims.h * 0.46;
  const bodyX = cx - bodyW / 2;
  const bodyBottom = dims.h * 0.72;
  const bodyY = bodyBottom - bodyH;
  const neckW = bodyW * 0.42;
  const neckH = bodyH * 0.12;
  const shoulderH = bodyH * 0.1;
  const capH = bodyH * 0.1;
  const neckY = bodyY - neckH;
  const capY = neckY - capH * 0.75;
  const radius = bodyW * 0.14;

  // Contact shadow
  ellipse(ctx, cx, bodyBottom + dims.h * 0.015, bodyW * 0.75, bodyW * 0.14);
  const shadow = ctx.createRadialGradient(cx, bodyBottom, 2, cx, bodyBottom, bodyW);
  shadow.addColorStop(0, "rgba(0,0,0,0.65)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.fill();

  // —— Brushed silver flat cap (brand) ——
  const capW = neckW * 1.22;
  const silverSide = ctx.createLinearGradient(cx - capW / 2, 0, cx + capW / 2, 0);
  silverSide.addColorStop(0, "#4a5058");
  silverSide.addColorStop(0.25, "#c5ccd4");
  silverSide.addColorStop(0.5, "#f2f4f6");
  silverSide.addColorStop(0.75, "#9aa3ad");
  silverSide.addColorStop(1, "#3d434a");
  ctx.fillStyle = silverSide;
  roundRect(ctx, cx - capW / 2, capY + capH * 0.28, capW, capH * 0.72, 2);
  ctx.fill();
  // vertical brush lines
  ctx.strokeStyle = "rgba(0, 47, 117, 0.18)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    const x = cx - capW * 0.35 + (capW * 0.7 * i) / 7;
    ctx.beginPath();
    ctx.moveTo(x, capY + capH * 0.32);
    ctx.lineTo(x, capY + capH * 0.95);
    ctx.stroke();
  }
  ellipse(ctx, cx, capY + capH * 0.3, capW / 2, capH * 0.2);
  const silverTop = ctx.createRadialGradient(
    cx - capW * 0.15,
    capY + capH * 0.18,
    1,
    cx,
    capY + capH * 0.3,
    capW * 0.55
  );
  silverTop.addColorStop(0, "#ffffff");
  silverTop.addColorStop(0.45, "#c8d0d8");
  silverTop.addColorStop(1, "#5a616a");
  ctx.fillStyle = silverTop;
  ctx.fill();

  // Glass neck
  const neckGrad = ctx.createLinearGradient(cx - neckW / 2, 0, cx + neckW / 2, 0);
  neckGrad.addColorStop(0, "rgba(160, 175, 190, 0.5)");
  neckGrad.addColorStop(0.3, "rgba(255,255,255,0.35)");
  neckGrad.addColorStop(0.7, "rgba(255,255,255,0.12)");
  neckGrad.addColorStop(1, "rgba(130, 150, 170, 0.5)");
  ctx.fillStyle = neckGrad;
  roundRect(ctx, cx - neckW / 2, neckY, neckW, neckH + shoulderH * 0.3, neckW * 0.15);
  ctx.fill();

  // Shoulders
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2, neckY + neckH);
  ctx.bezierCurveTo(
    cx - neckW / 2,
    bodyY + shoulderH * 0.2,
    cx - bodyW / 2,
    bodyY + shoulderH * 0.4,
    cx - bodyW / 2,
    bodyY + shoulderH
  );
  ctx.lineTo(cx + bodyW / 2, bodyY + shoulderH);
  ctx.bezierCurveTo(
    cx + bodyW / 2,
    bodyY + shoulderH * 0.4,
    cx + neckW / 2,
    bodyY + shoulderH * 0.2,
    cx + neckW / 2,
    neckY + neckH
  );
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();

  // Glass body (upper clear zone)
  const glass = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  glass.addColorStop(0, "rgba(100, 120, 140, 0.55)");
  glass.addColorStop(0.15, "rgba(255,255,255,0.45)");
  glass.addColorStop(0.5, "rgba(240,245,250,0.1)");
  glass.addColorStop(0.85, "rgba(255,255,255,0.4)");
  glass.addColorStop(1, "rgba(90, 110, 130, 0.55)");
  ctx.fillStyle = glass;
  roundRect(ctx, bodyX, bodyY + shoulderH * 0.85, bodyW, bodyH - shoulderH * 0.85, radius);
  ctx.fill();

  const inset = Math.max(2, bodyW * 0.04);
  ctx.save();
  roundRect(
    ctx,
    bodyX + inset,
    bodyY + shoulderH + inset,
    bodyW - inset * 2,
    bodyH - shoulderH - inset * 2,
    radius * 0.7
  );
  ctx.clip();

  // Interior
  ctx.fillStyle = "rgba(230, 235, 240, 0.2)";
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

  if (reconstituted) {
    const liquidTop = bodyY + bodyH * 0.45;
    ctx.fillStyle = "rgba(200, 215, 230, 0.45)";
    ctx.fillRect(bodyX, liquidTop, bodyW, bodyBottom - liquidTop);
  } else {
    const cakeH = bodyH * 0.28;
    const cakeY = bodyBottom - cakeH - radius * 0.4;
    drawPowderCake(
      ctx,
      bodyX + inset,
      cakeY,
      bodyW - inset * 2,
      cakeH,
      3,
      resolvePowderColor({ name })
    );
  }
  ctx.restore();

  // Specular on glass
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(bodyX + bodyW * 0.12, bodyY + shoulderH, bodyW * 0.1, bodyH * 0.35);

  // —— Matte black sleeve with V notch (brand) ——
  const sleeveTop = bodyY + bodyH * 0.38;
  const sleeveH = bodyBottom - sleeveTop;
  ctx.beginPath();
  ctx.moveTo(bodyX, sleeveTop + bodyW * 0.12);
  ctx.lineTo(cx, sleeveTop - bodyW * 0.02);
  ctx.lineTo(bodyX + bodyW, sleeveTop + bodyW * 0.12);
  ctx.lineTo(bodyX + bodyW, bodyBottom - radius * 0.3);
  ctx.quadraticCurveTo(bodyX + bodyW, bodyBottom, cx, bodyBottom);
  ctx.quadraticCurveTo(bodyX, bodyBottom, bodyX, bodyBottom - radius * 0.3);
  ctx.closePath();
  const sleeveGrad = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  sleeveGrad.addColorStop(0, "#050505");
  sleeveGrad.addColorStop(0.35, "#1a1a1a");
  sleeveGrad.addColorStop(0.5, "#222222");
  sleeveGrad.addColorStop(0.65, "#1a1a1a");
  sleeveGrad.addColorStop(1, "#050505");
  ctx.fillStyle = sleeveGrad;
  ctx.fill();

  // Sleeve edge highlight
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bodyX + 1, sleeveTop + bodyW * 0.12);
  ctx.lineTo(cx, sleeveTop);
  ctx.lineTo(bodyX + bodyW - 1, sleeveTop + bodyW * 0.12);
  ctx.stroke();

  // Cobalt UD seal from brand mark image
  const sealR = bodyW * 0.28;
  const sealCy = sleeveTop + sleeveH * 0.32;
  drawUdSeal(ctx, cx, sealCy, sealR, udMark || wpMark || udMarkCache);

  // Product name + strength + calc data + QR on sleeve
  const massNum = mass !== "" && mass != null ? mass : "";
  const unitLabel = String(unit || "mg").toUpperCase();
  const massLabel = massNum !== "" ? `${massNum} ${unitLabel}` : "";

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.max(9, bodyW * 0.11)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const titleY = sealCy + sealR + sleeveH * 0.12;
  const titleLines = wrapLines(ctx, String(name).toUpperCase(), bodyW * 0.86, 2);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, cx, titleY + i * bodyW * 0.12);
  });

  let metaY = titleY + titleLines.length * bodyW * 0.12 + bodyW * 0.02;
  if (massLabel) {
    ctx.fillStyle = "#5b9fff";
    ctx.font = `700 ${Math.max(10, bodyW * 0.13)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(massLabel, cx, metaY + bodyW * 0.06);
    metaY += bodyW * 0.14;
  }

  const detailBits = [bacWater, concentration, doseRange].filter(Boolean);
  if (detailBits.length) {
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = `600 ${Math.max(6.5, bodyW * 0.065)}px Outfit, "Segoe UI", sans-serif`;
    detailBits.slice(0, 3).forEach((bit, i) => {
      ctx.fillText(bit, cx, metaY + bodyW * 0.02 + i * bodyW * 0.08);
    });
    metaY += detailBits.slice(0, 3).length * bodyW * 0.08;
  }

  const qrSize = Math.min(bodyW * 0.42, sleeveH * 0.28);
  const qrY = Math.min(bodyBottom - qrSize - bodyW * 0.16, metaY + bodyW * 0.04);
  drawQrCode(
    ctx,
    cx - qrSize / 2,
    qrY,
    qrSize,
    qrSeedFromOptions({
      name,
      mass,
      unit,
      bacWater,
      concentration,
      doseRange,
      sku,
    }),
    true,
    qrPayloadFromOptions({ qrPayload })
  );

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `600 ${Math.max(6.5, bodyW * 0.07)}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("Reference Material", cx, bodyBottom - bodyW * 0.08);

  // Outer glass rim over sleeve edges
  ctx.strokeStyle = "rgba(180, 190, 200, 0.35)";
  ctx.lineWidth = 1.2;
  roundRect(ctx, bodyX, bodyY + shoulderH * 0.85, bodyW, bodyH - shoulderH * 0.85, radius);
  ctx.stroke();

  drawBrandWordmark(ctx, cx, bodyBottom + dims.h * 0.055, dims.w * 0.7);

}

/** 10 mL — same Undisclosed brand language, taller bottle. */
function drawBrandTenMl(ctx, dims, options) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    sku = "",
    reconstituted = false,
    wpMark = null,
    udMark = null,
    bacWater = "",
    concentration = "",
    doseRange = "",
    qrPayload = "",
  } = options;

  const cx = dims.w / 2;
  drawDarkStudio(ctx, dims.w, dims.h);

  const bodyW = dims.w * 0.36;
  const bodyH = dims.h * 0.52;
  const bodyX = cx - bodyW / 2;
  const bodyBottom = dims.h * 0.74;
  const bodyY = bodyBottom - bodyH;
  const neckW = bodyW * 0.4;
  const neckH = bodyH * 0.1;
  const shoulderH = bodyH * 0.08;
  const capH = bodyH * 0.08;
  const neckY = bodyY - neckH;
  const capY = neckY - capH * 0.75;
  const radius = bodyW * 0.1;

  ellipse(ctx, cx, bodyBottom + dims.h * 0.012, bodyW * 0.7, bodyW * 0.12);
  const shadow = ctx.createRadialGradient(cx, bodyBottom, 2, cx, bodyBottom, bodyW);
  shadow.addColorStop(0, "rgba(0,0,0,0.6)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.fill();

  const capW = neckW * 1.2;
  const silverSide = ctx.createLinearGradient(cx - capW / 2, 0, cx + capW / 2, 0);
  silverSide.addColorStop(0, "#4a5058");
  silverSide.addColorStop(0.5, "#f2f4f6");
  silverSide.addColorStop(1, "#3d434a");
  ctx.fillStyle = silverSide;
  roundRect(ctx, cx - capW / 2, capY + capH * 0.28, capW, capH * 0.72, 2);
  ctx.fill();
  ellipse(ctx, cx, capY + capH * 0.3, capW / 2, capH * 0.2);
  ctx.fill();

  const glass = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  glass.addColorStop(0, "rgba(100, 120, 140, 0.55)");
  glass.addColorStop(0.2, "rgba(255,255,255,0.4)");
  glass.addColorStop(0.5, "rgba(240,245,250,0.1)");
  glass.addColorStop(0.8, "rgba(255,255,255,0.35)");
  glass.addColorStop(1, "rgba(90, 110, 130, 0.55)");
  ctx.fillStyle = glass;
  roundRect(ctx, cx - neckW / 2, neckY, neckW, neckH + shoulderH, 4);
  ctx.fill();
  roundRect(ctx, bodyX, bodyY + shoulderH * 0.5, bodyW, bodyH - shoulderH * 0.5, radius);
  ctx.fill();

  const inset = Math.max(2, bodyW * 0.04);
  ctx.save();
  roundRect(
    ctx,
    bodyX + inset,
    bodyY + shoulderH + inset,
    bodyW - inset * 2,
    bodyH - shoulderH - inset * 2,
    radius * 0.7
  );
  ctx.clip();
  if (!reconstituted) {
    const cakeH = bodyH * 0.18;
    const cakeY = bodyBottom - cakeH - radius * 0.4;
    drawPowderCake(
      ctx,
      bodyX + inset,
      cakeY,
      bodyW - inset * 2,
      cakeH,
      3,
      resolvePowderColor({ name })
    );
  } else {
    ctx.fillStyle = "rgba(200, 215, 230, 0.4)";
    ctx.fillRect(bodyX, bodyY + bodyH * 0.4, bodyW, bodyH * 0.6);
  }
  ctx.restore();

  const sleeveTop = bodyY + bodyH * 0.32;
  ctx.beginPath();
  ctx.moveTo(bodyX, sleeveTop + bodyW * 0.1);
  ctx.lineTo(cx, sleeveTop);
  ctx.lineTo(bodyX + bodyW, sleeveTop + bodyW * 0.1);
  ctx.lineTo(bodyX + bodyW, bodyBottom - 4);
  ctx.lineTo(bodyX, bodyBottom - 4);
  ctx.closePath();
  ctx.fillStyle = "#0c0c0c";
  ctx.fill();

  const sealR = bodyW * 0.24;
  const sealCy = sleeveTop + (bodyBottom - sleeveTop) * 0.28;
  drawUdSeal(ctx, cx, sealCy, sealR, udMark || wpMark || udMarkCache);

  const massNum = mass !== "" && mass != null ? mass : "";
  const massLabel = massNum !== "" ? `${massNum} ${String(unit || "mg").toUpperCase()}` : "";
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${Math.max(11, bodyW * 0.11)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let y = sealCy + sealR + bodyW * 0.14;
  wrapLines(ctx, String(name).toUpperCase(), bodyW * 0.88, 2).forEach((line) => {
    ctx.fillText(line, cx, y);
    y += bodyW * 0.12;
  });
  if (massLabel) {
    ctx.fillStyle = "#5b9fff";
    ctx.font = `700 ${Math.max(12, bodyW * 0.14)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(massLabel, cx, y + bodyW * 0.02);
    y += bodyW * 0.16;
  }
  const bits = [bacWater, concentration, doseRange].filter(Boolean);
  if (bits.length) {
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ctx.font = `600 ${Math.max(7, bodyW * 0.06)}px Outfit, "Segoe UI", sans-serif`;
    bits.slice(0, 3).forEach((bit) => {
      ctx.fillText(bit, cx, y);
      y += bodyW * 0.08;
    });
  }
  const qrSize = Math.min(bodyW * 0.36, (bodyBottom - y) * 0.55);
  drawQrCode(
    ctx,
    cx - qrSize / 2,
    Math.min(y + 4, bodyBottom - qrSize - bodyW * 0.14),
    qrSize,
    qrSeedFromOptions({
      name,
      mass,
      unit,
      bacWater,
      concentration,
      doseRange,
      sku,
    }),
    true,
    qrPayloadFromOptions({ qrPayload })
  );

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `600 ${Math.max(8, bodyW * 0.07)}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("10 mL · Reference Material", cx, bodyBottom - bodyW * 0.06);

  drawBrandWordmark(ctx, cx, bodyBottom + dims.h * 0.05, dims.w * 0.7);
}

/**
 * Draw a photoreal vial on black marble.
 * Catalog: blank-wrap template + short name.
 * Calculator: unlabeled glass plate + full clinical wrap composited on.
 */
export async function drawGeneratedVial(canvas, options = {}) {
  const {
    name = "Peptide",
    subtitle = "",
    sku = "",
    mass = "",
    unit = "mg",
    size = "md",
    reconstituted = false,
    vialMl: vialMlOpt,
    form = "",
    bacWater = "",
    concentration = "",
    doseRange = "",
    qrPayload = "",
    coaUrl = "",
    catalogTemplate = true,
    showLabel = true,
    labelType = "CALCULATOR",
    formText = "LYOPHILIZED POWDER",
    storageTemp = "36–46°F",
  } = options;

  // Catalog uses the resolved bottle (3 mL default · 10 mL for NAD / Gluta / B12)
  const vialMl = resolveVialMl({
    name,
    form: form || subtitle,
    vialMl: vialMlOpt,
  });
  const isTen = vialMl >= 10;
  const wrapLabelType =
    String(labelType || "").toUpperCase() === "CATALOG"
      ? "CATALOG"
      : "CALCULATOR";

  // Catalog cards are small on phones — keep canvas light
  const dims = catalogTemplate
    ? {
        sm: { w: 120, h: 180 },
        md: { w: 200, h: 300 },
        lg: { w: 320, h: 480 },
      }[size] || { w: 200, h: 300 }
    : {
        sm: { w: 160, h: 240 },
        md: { w: 280, h: 420 },
        lg: { w: 360, h: 540 },
      }[size] || { w: 280, h: 420 };

  const dprCap = catalogTemplate || size === "sm" ? 1.5 : 3;
  const deviceDpr =
    typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
  const dpr = catalogTemplate
    ? Math.min(Math.max(deviceDpr, 1.5), dprCap)
    : Math.min(Math.max(deviceDpr, 2), dprCap);
  canvas.width = Math.round(dims.w * dpr);
  canvas.height = Math.round(dims.h * dpr);
  canvas.style.width = `${dims.w}px`;
  canvas.style.height = `${dims.h}px`;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, dims.w, dims.h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = catalogTemplate ? "medium" : "high";

  const useBluePlate = isBluePowderCompound(name, form || subtitle);
  const useB12Liquid = isB12Compound(name, form || subtitle);
  const resolvedFormText = useB12Liquid
    ? "LIQUID"
    : formText || "LYOPHILIZED POWDER";

  // Calculator: bare glass + live wrap (swappable label art). Catalog: blank printed wrap + name.
  // B12 always uses the dedicated ruby-liquid 10 mL plate (never white cake recolored).
  const photo = useB12Liquid
    ? await (size !== "lg" ? loadBrandVialB12Card() : loadBrandVialB12())
    : !catalogTemplate
      ? isTen
        ? await (size !== "lg" ? loadBrandVial10Card() : loadBrandVial10())
        : await loadUnlabeledVial()
      : isTen
        ? await (size !== "lg" ? loadBrandVial10Card() : loadBrandVial10())
        : useBluePlate
          ? await (size !== "lg" ? loadBlueVialCard() : loadBlueVial())
          : await (size !== "lg" ? loadBrandVialCard() : loadBrandVial());

  if (photo && photo.width) {
    if (!catalogTemplate) {
      await Promise.all([loadUdMark(), loadSentinelMascot()]);
      drawUnlabeledPlateWithWrap(ctx, dims, photo, {
        name,
        mass,
        unit,
        sku,
        bacWater,
        concentration,
        doseRange,
        showLabel,
        powderBlue: useBluePlate && !useB12Liquid,
        qrPayload,
        coaUrl,
        isTen: isTen || useB12Liquid,
        labelType: wrapLabelType,
        formText: resolvedFormText,
        storageTemp,
      });
    } else {
      drawExamplePlate(ctx, dims, photo, {
        name,
        mass,
        unit,
        bacWater,
        concentration,
        doseRange,
        showLabel,
        fullLabel: false,
        powderWhite: false,
        qrPayload,
        coaUrl,
        labelType: wrapLabelType,
        formText: resolvedFormText,
        storageTemp,
      });
    }
  } else {
    const fallbackOpts = {
      name,
      mass,
      unit,
      sku,
      bacWater,
      concentration,
      doseRange,
      qrPayload,
      coaUrl,
      reconstituted: catalogTemplate ? false : reconstituted || useB12Liquid,
      showLabel,
      powderColor: useBluePlate ? "blue" : "white",
      labelType: wrapLabelType,
      formText: resolvedFormText,
      storageTemp,
    };
    if (isTen) drawLabeledTenMl(ctx, dims, fallbackOpts);
    else drawLabeledThreeMl(ctx, dims, fallbackOpts);
  }

  if (options.exportPng) {
    return canvas.toDataURL("image/png");
  }
  return "";
}

/**
 * Unlabeled studio vial + full clinical wrap (same art as the flat printable).
 * Used above the calculator label preview.
 */
function drawUnlabeledPlateWithWrap(ctx, dims, photo, options = {}) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    sku = "",
    bacWater = "",
    concentration = "",
    doseRange = "",
    showLabel = true,
    powderBlue = false,
    qrPayload = "",
    coaUrl = "",
    isTen = false,
  } = options;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, dims.w, dims.h);

  const iw = photo.width;
  const ih = photo.height;
  const scale = Math.max(dims.w / iw, dims.h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (dims.w - dw) / 2;
  const dy = (dims.h - dh) / 2;
  ctx.drawImage(photo, dx, dy, dw, dh);

  // Blue cake for KLOW / GLOW / GHK-Cu on the white unlabeled plate
  if (powderBlue) {
    tintStudioCakeBlue(ctx, {
      bodyX: dx + dw * 0.28,
      bodyW: dw * 0.44,
      cakeTop: dy + dh * 0.7,
      cakeBottom: dy + dh * 0.96,
    });
  }

  if (!showLabel) return;

  // Full glass OD, then wrap band inset 10% width + seated with extra top gap.
  const glassX = dx + dw * (isTen ? 0.24 : 0.276);
  const glassW = dw * (isTen ? 0.52 : 0.434);
  const bodyW = glassW * 1.117;
  const bodyX = glassX + (glassW - bodyW) / 2;
  // Wide glass body (below shoulder → near base) ≈ 54% of plate height.
  const glassBodyTop = dy + dh * (isTen ? 0.32 : 0.36);
  const glassBodyH = dh * (isTen ? 0.52 : 0.54);
  const sleeveHFull = glassBodyH * 0.7;
  const sleeveH = sleeveHFull * 0.855;
  // Prior nudges, then whole band down 10%, then back up 5%
  // (top locked to full-height seat; height shrink comes off the bottom)
  const sleeveTop =
    glassBodyTop +
    glassBodyH -
    sleeveHFull -
    dh * 0.02 -
    glassBodyH * 0.2 +
    glassBodyH * 0.1 -
    glassBodyH * 0.05 -
    glassBodyH * 0.03 +
    glassBodyH * 0.1 -
    glassBodyH * 0.05;

  const wrapBmp = createWrapLabelBitmap({
    name,
    mass,
    unit,
    sku,
    bacWater,
    concentration,
    doseRange,
    labelType: options.labelType || "CALCULATOR",
    formText: options.formText,
    storageTemp: options.storageTemp,
    vialMl: isTen ? 10 : 3,
    qrPayload: qrPayload || coaUrl || SITE_QR_URL,
    coaUrl: coaUrl || "",
    forceSiteQr: false,
    footerText: "",
    udMark: udMarkCache,
    // Square corners on the vial — rounded sticker corners + white underfill
    // read as a white flare past the black spine (esp. bottom / DILUTENT).
    squareCorners: true,
  });
  if (!wrapBmp) return;

  // Capture glass lighting under the wrap so shade follows the photo
  // (dark left / bright right highlight), not a fake symmetric cylinder.
  const snapX = Math.max(0, Math.floor(bodyX));
  const snapY = Math.max(0, Math.floor(sleeveTop));
  const snapW = Math.min(Math.ceil(bodyW), dims.w - snapX);
  const snapH = Math.min(Math.ceil(sleeveH), dims.h - snapY);
  let glassSnap = null;
  try {
    glassSnap = ctx.getImageData(snapX, snapY, snapW, snapH);
  } catch {
    glassSnap = null;
  }

  drawCatalogWrapOnVial(ctx, wrapBmp, {
    bodyX,
    bodyW,
    sleeveTop,
    sleeveH,
    radius: Math.max(2, bodyW * 0.03),
    snug: true,
    glassSnap,
    snapX,
    snapY,
  });
}

/**
 * Draw blank Undisclosed wrap plate.
 * Catalog (fullLabel false): peptide name only.
 * Calculator (fullLabel true): name + mass + BAC / concentration / dose — matches
 * public/references/vial-complete-example-klow.png
 */
function drawExamplePlate(ctx, dims, photo, options = {}) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    bacWater = "",
    concentration = "",
    doseRange = "",
    showLabel = true,
    fullLabel = false,
    powderWhite = false,
    qrPayload = "",
    coaUrl = "",
  } = options;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, dims.w, dims.h);

  const iw = photo.width;
  const ih = photo.height;
  const scale = Math.max(dims.w / iw, dims.h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (dims.w - dw) / 2;
  const dy = (dims.h - dh) / 2;
  ctx.drawImage(photo, dx, dy, dw, dh);

  // Same 3 mL blue plate for everyone — whiten cake when peptide isn't blue
  if (powderWhite) {
    tintStudioCakeWhite(ctx, {
      bodyX: dims.w * 0.28,
      bodyW: dims.w * 0.44,
      cakeTop: dims.h * 0.70,
      cakeBottom: dims.h * 0.96,
    });
  }

  if (!showLabel) return;

  // Label face on 682×1024 blank wrap templates
  const lx = dx + dw * 0.255;
  const ly = dy + dh * 0.39;
  const lw = dw * 0.49;
  const lh = dh * 0.30;

  // Center write-in panel (between spine and QR)
  const midX = lx + lw * 0.14;
  const midW = lw * 0.58;
  const midCx = midX + midW / 2;

  const massText =
    mass !== "" && mass != null
      ? `${String(mass).trim()}${unit ? ` ${String(unit).trim()}` : ""}`.toUpperCase()
      : "";

  const family = 'Outfit, "Segoe UI", "Arial Black", sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#000000";

  if (!fullLabel) {
    // Catalog: always the suggested short name (black text only)
    const shortName = shortLabelName(name);
    drawLabelNameBlock(ctx, {
      name: shortName,
      rawName: name,
      cx: midCx,
      y: ly + lh * 0.28,
      h: lh * 0.32,
      maxWidth: midW * 0.96,
      family,
      maxLines: 1,
      basePx: Math.max(14, lh * 0.26),
      minPx: 9,
      weight: "800",
      skipShorten: true,
    });
    return;
  }

  // Full calculator label — short name + mass + grid values (black text only)
  // Nudge auto-gen text down ~20% of the wrap face (catalog unchanged)
  const calcNudgeY = lh * 0.2;
  const nameBandY = ly + lh * 0.12 + calcNudgeY;
  const nameBandH = lh * 0.28;
  drawLabelNameBlock(ctx, {
    name: shortLabelName(name),
    rawName: name,
    cx: midCx,
    y: nameBandY,
    h: nameBandH,
    maxWidth: midW * 0.96,
    family,
    maxLines: 1,
    basePx: Math.max(14, lh * 0.24),
    minPx: 9,
    weight: "800",
    skipShorten: true,
  });

  if (massText) {
    // Center mass between the two write-in rules on the blank wrap
    const ruleTop = ly + lh * 0.607;
    const ruleBot = ly + lh * 0.813;
    const massH = Math.min(lh * 0.14, (ruleBot - ruleTop) * 0.72);
    const massY = (ruleTop + ruleBot) / 2 - massH / 2;
    drawLabelNameBlock(ctx, {
      name: massText,
      rawName: massText,
      cx: midCx,
      y: massY,
      h: massH,
      maxWidth: midW * 0.9,
      family,
      maxLines: 1,
      basePx: Math.max(11, lh * 0.14),
      minPx: 8,
      weight: "700",
      skipShorten: true,
    });
  }

  const bac = String(bacWater || "").trim();
  const conc = String(concentration || "").trim();
  const dose = String(doseRange || "").trim();
  if (bac || conc || dose) {
    // Three footer cells — values centered under headers near wrap bottom
    const gridY = ly + lh * 0.82;
    const gridH = lh * 0.14;
    const colW = midW / 3;
    const vals = [bac, conc, dose];
    vals.forEach((val, i) => {
      if (!val) return;
      const cx = midX + colW * (i + 0.5);
      drawLabelNameBlock(ctx, {
        name: val,
        rawName: val,
        cx,
        y: gridY,
        h: gridH,
        maxWidth: colW * 0.94,
        family,
        maxLines: 2,
        basePx: Math.max(11, lh * 0.13),
        minPx: 8,
        weight: "700",
        skipShorten: true,
      });
    });
  }

  // Keep the printed QR on blank-wrap photos — do not paint a second live QR on top.
}

/** Cover-fit photo into canvas. */
function drawCoverImage(ctx, img, w, h) {
  const iw = img.width;
  const ih = img.height;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Shared storefront label defaults (QR). Mass & dosage come per product. */
export const CATALOG_VIAL_TEMPLATE = {
  mass: "80",
  unit: "mg",
  bacWater: "3.2 mL",
  concentration: "25 mg/mL",
  doseRange: "2.5 – 5 mg (10 – 20 u)",
  footerText: "",
  qrPayload: SITE_QR_URL,
};

/**
 * Photoreal catalog vial — identical camera/lighting for every product.
 * When showLabel is true, draws the clinical wrap (name, mg, dosage, QR).
 */
function drawPhotorealVial(ctx, dims, options) {
  const {
    photo,
    name = "Peptide",
    isTen = false,
    mass,
    unit,
    sku = "",
    bacWater,
    concentration,
    doseRange,
    qrPayload,
    coaUrl,
    showLabel = true,
  } = options;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, dims.w, dims.h);
  // Studio plate matches user reference framing (same as KLOW shot)
  drawZoomedVialPhoto(ctx, photo, dims.w, dims.h, isTen ? 1.12 : 1.08);

  const powderColor = resolvePowderColor({ name });
  if (powderColor === "blue") {
    const bodyW = dims.w * (isTen ? 0.52 : 0.5);
    const bodyX = dims.w / 2 - bodyW / 2;
    tintStudioCakeBlue(ctx, {
      bodyX,
      bodyW,
      cakeTop: dims.h * (isTen ? 0.74 : 0.78),
      cakeBottom: dims.h * 0.96,
    });
  } else {
    // Ensure no leftover blue cake on shared plates
    const bodyW = dims.w * (isTen ? 0.52 : 0.5);
    const bodyX = dims.w / 2 - bodyW / 2;
    tintStudioCakeWhite(ctx, {
      bodyX,
      bodyW,
      cakeTop: dims.h * (isTen ? 0.74 : 0.78),
      cakeBottom: dims.h * 0.96,
    });
  }

  if (!showLabel) return;

  // Wrap band aligned to the reference clinical label on the studio plate
  const glassCx = dims.w * (isTen ? 0.5 : 0.5);
  const bodyW = dims.w * (isTen ? 0.52 : 0.5);
  const bodyX = glassCx - bodyW / 2;
  const sleeveTop = dims.h * (isTen ? 0.34 : 0.36);
  const sleeveHClamped = dims.h * (isTen ? 0.34 : 0.32);

  const wrapBmp = createWrapLabelBitmap({
    name,
    mass: mass ?? CATALOG_VIAL_TEMPLATE.mass,
    unit: unit || CATALOG_VIAL_TEMPLATE.unit,
    bacWater: bacWater || CATALOG_VIAL_TEMPLATE.bacWater,
    concentration: concentration || CATALOG_VIAL_TEMPLATE.concentration,
    doseRange: doseRange || CATALOG_VIAL_TEMPLATE.doseRange,
    sku,
    qrPayload: SITE_QR_URL,
    coaUrl: "",
    forceSiteQr: true,
    footerText: CATALOG_VIAL_TEMPLATE.footerText,
  });

  drawCatalogWrapOnVial(ctx, wrapBmp, {
    bodyX,
    bodyW,
    sleeveTop,
    sleeveH: sleeveHClamped,
    radius: Math.max(3, bodyW * 0.04),
  });
}

/** Cover-fit with zoom so the vial reads like a close product shot. */
function drawZoomedVialPhoto(ctx, img, w, h, zoom = 1.55) {
  const iw = img.width;
  const ih = img.height;
  const scale = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (w - dw) / 2;
  const dy = (h - dh) / 2 + h * 0.015;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Recolor only pale cake pixels under the wrap — keeps the real plug shape. */
function tintStudioCakeBlue(ctx, { bodyX, bodyW, cakeTop, cakeBottom }) {
  const scale = ctx.getTransform?.().a || 1;
  const x0 = Math.max(0, Math.floor(bodyX * scale));
  const x1 = Math.min(ctx.canvas.width, Math.ceil((bodyX + bodyW) * scale));
  const y0 = Math.max(0, Math.floor(cakeTop * scale));
  const y1 = Math.min(ctx.canvas.height, Math.ceil(cakeBottom * scale));
  const w = x1 - x0;
  const h = y1 - y0;
  if (w < 4 || h < 4) return;
  let img;
  try {
    img = ctx.getImageData(x0, y0, w, h);
  } catch {
    return;
  }
  const data = img.data;
  const cx = w / 2;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 30) continue;
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const avg = (r + g + b) / 3;
      // Only the chalky cake — skip glass edge sparks
      if (!(max > 155 && max - min < 36 && avg > 150)) continue;
      // Soft elliptical falloff so we don't leave a hard blue rectangle
      const nx = (x - cx) / (w * 0.48);
      const ny = (y - h * 0.15) / (h * 0.85);
      if (nx * nx + ny * ny > 1.05) continue;
      const lum = avg / 255;
      data[i] = Math.round(28 + lum * 50);
      data[i + 1] = Math.round(95 + lum * 95);
      data[i + 2] = Math.round(155 + lum * 70);
    }
  }
  ctx.putImageData(img, x0, y0);
}

/** Recolor blue lyophilized cake to neutral on the shared blue vial plate. */
function tintStudioCakeWhite(ctx, { bodyX, bodyW, cakeTop, cakeBottom }) {
  const scale = ctx.getTransform?.().a || 1;
  const x0 = Math.max(0, Math.floor(bodyX * scale));
  const x1 = Math.min(ctx.canvas.width, Math.ceil((bodyX + bodyW) * scale));
  const y0 = Math.max(0, Math.floor(cakeTop * scale));
  const y1 = Math.min(ctx.canvas.height, Math.ceil(cakeBottom * scale));
  const w = x1 - x0;
  const h = y1 - y0;
  if (w < 4 || h < 4) return;
  let img;
  try {
    img = ctx.getImageData(x0, y0, w, h);
  } catch {
    return;
  }
  const data = img.data;
  const cx = w / 2;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a < 30) continue;
      // Blue / cyan cake pixels (skip glass highlights and dark seal)
      const isBlueCake =
        b > 90 && b >= r + 18 && b >= g + 8 && (r + g + b) / 3 > 70;
      const isBrightCake =
        Math.max(r, g, b) > 140 &&
        Math.max(r, g, b) - Math.min(r, g, b) < 55 &&
        (r + g + b) / 3 > 120;
      if (!isBlueCake && !isBrightCake) continue;
      const nx = (x - cx) / (w * 0.48);
      const ny = (y - h * 0.12) / (h * 0.88);
      if (nx * nx + ny * ny > 1.08) continue;
      const lum = Math.min(1, Math.max(0.35, (r + g + b) / (3 * 255)));
      data[i] = Math.round(210 + lum * 40);
      data[i + 1] = Math.round(212 + lum * 38);
      data[i + 2] = Math.round(216 + lum * 35);
    }
  }
  ctx.putImageData(img, x0, y0);
}

/**
 * Front-of-vial clinical sticker — tall portrait so name / mass / QR stay sharp
 * on product cards (full wrap remains on the printable flat label).
 */
function createBottleFaceLabel(options = {}) {
  return createWrapLabelBitmap(options);
}

/** Build an offscreen flat wrap-label for the printable template / vial face. */
function createWrapLabelBitmap(options) {
  const ml = Number(options.vialMl) >= 8 ? 10 : 3;
  const spec = labelSpecForVialMl(ml);
  // Match physical wrap aspect so vial overlays aren't stretched.
  const square = Boolean(options.squareCorners);
  const dims = {
    w: 1000,
    h: Math.round(1000 * (spec.heightMm / spec.widthMm)),
    cornerR: square ? 0 : Math.round(500 * 0.07),
  };
  const c =
    typeof document !== "undefined"
      ? document.createElement("canvas")
      : null;
  if (!c) return null;
  c.width = dims.w;
  c.height = dims.h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  paintLabelTemplate(ctx, dims, options);
  return c;
}

/**
 * Reference-style clinical wrap: face-on cylinder with UNDISCLOSED spine
 * left, product panel center, QR right — tight to the outer glass.
 */
function drawCatalogWrapOnVial(ctx, labelCanvas, geom) {
  if (!labelCanvas || !labelCanvas.width) return;
  const {
    bodyX,
    bodyW,
    sleeveTop,
    sleeveH,
    snug = false,
    glassSnap = null,
    snapX = Math.floor(bodyX),
    snapY = Math.floor(sleeveTop),
  } = geom;
  // Push white border back ~4% each side and round the rim so edges wrap away
  const sideInset = snug ? Math.max(1.2, bodyW * 0.04) : 0;
  const drawX = bodyX + sideInset;
  const drawW = bodyW - sideInset * 2;
  const cx = bodyX + bodyW / 2;
  const R = (snug ? drawW : bodyW) / 2;
  const lw = labelCanvas.width;
  const lh = labelCanvas.height;
  // Keep every projected strip at least ~1 CSS pixel wide. Hundreds of
  // sub-pixel strips soften small label type even when the source is sharp.
  const slices = snug
    ? Math.max(96, Math.min(180, Math.round(drawW * 0.9)))
    : Math.max(96, Math.min(220, Math.round(bodyW)));
  // Front wrap across the glass face (height is sized separately to 70% of body)
  const visibleArc = Math.PI * (snug ? 1.08 : 0.9);
  // Bias yaw so black spine sits flush; +10° turns vial toward the right
  const vialTurn = snug ? (10 * Math.PI) / 180 : 0;
  const yaw = (0.5 - (snug ? 0.405 : 0.355)) * visibleArc + vialTurn;
  const leftExtra = snug ? 0 : 0.08;
  const uStart = 0;
  const uEnd = 1;
  const xMin = snug ? drawX : bodyX;
  const xMax = snug ? drawX + drawW : bodyX + bodyW;

  ctx.save();

  // Soft contact shadow under the wrap onto the glass (label sits outside)
  if (snug) {
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.ellipse(cx, sleeveTop + sleeveH + 0.8, R * 0.92, 1.4, 0, 0, Math.PI);
    ctx.fill();
  } else {
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    ctx.beginPath();
    ctx.ellipse(cx, sleeveTop + 0.5, R * 0.98, 2.2, 0, Math.PI, 0, true);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx, sleeveTop + sleeveH - 0.5, R * 0.98, 2.4, 0, 0, Math.PI);
    ctx.fill();
  }

  // Clip to glass band; bottom corners inset — spine/DILUTENT side more,
  // QR (opposite) side a lighter pull-back. Side inset rounds L/R white border.
  // Viewer-left (spine) tilts ~2% — top pulls in so the edge wraps away.
  // Bottom-left pulled back toward glass another 2%.
  // Keep the bottom edge flat (no triangular flap under the wrap).
  const botInsetL = snug ? Math.max(1.2, drawW * 0.048) : 0;
  const botInsetR = snug ? Math.max(0.8, drawW * 0.014) : 0;
  const leftTilt = snug ? Math.max(1, drawW * 0.02) : 0;
  const botLeftPush = snug ? Math.max(1, drawW * 0.04) : 0;
  const xLeftBot = xMin + botInsetL + botLeftPush;
  ctx.beginPath();
  if (snug) {
    ctx.moveTo(xMin + leftTilt, sleeveTop);
    ctx.lineTo(xMax, sleeveTop);
    ctx.lineTo(xMax - botInsetR, sleeveTop + sleeveH);
    ctx.lineTo(xLeftBot, sleeveTop + sleeveH);
    ctx.closePath();
  } else {
    ctx.rect(bodyX, sleeveTop, bodyW, sleeveH);
  }
  ctx.clip();

  // No full-band white underfill in snug mode — it showed past the black spine.
  if (!snug) {
    ctx.fillStyle = "#f7f7f5";
    ctx.fillRect(bodyX, sleeveTop, bodyW, sleeveH);
  }

  // The label bitmap is already high-resolution. Nearest sampling here keeps
  // type and QR modules crisp while the strip geometry supplies the curvature.
  ctx.imageSmoothingEnabled = false;

  for (let i = 0; i < slices; i += 1) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;
    const theta0 = (t0 - 0.5) * visibleArc + yaw - leftExtra * (1 - t0);
    const theta1 = (t1 - 0.5) * visibleArc + yaw - leftExtra * (1 - t1);
    const cos = (Math.cos(theta0) + Math.cos(theta1)) / 2;
    if (cos < (snug ? 0.02 : 0.025)) continue;

    const x0 = cx + R * Math.sin(theta0);
    const x1 = cx + R * Math.sin(theta1);
    const destX = Math.max(xMin, Math.min(x0, x1));
    const destRight = Math.min(xMax, Math.max(x0, x1));
    const destW = Math.max(0.6, destRight - destX + (snug ? 0.15 : 0.55));
    if (destX >= xMax || destRight <= xMin) continue;

    const u0 = uStart + t0 * (uEnd - uStart);
    const u1 = uStart + t1 * (uEnd - uStart);
    const srcX = u0 * lw;
    const srcW = Math.max(1, (u1 - u0) * lw + 0.5);

    ctx.globalAlpha = 1;
    ctx.drawImage(
      labelCanvas,
      srcX,
      0,
      srcW,
      lh,
      destX,
      sleeveTop,
      destW,
      sleeveH
    );

    // Catalog path keeps a light geometric rim; snug uses photo shade after.
    if (!snug) {
      const shadeAmt = Math.pow(1 - Math.max(0, cos), 1.35);
      if (shadeAmt > 0.015) {
        ctx.fillStyle = `rgba(8,10,14,${(shadeAmt * 0.48).toFixed(3)})`;
        ctx.fillRect(destX, sleeveTop, destW, sleeveH);
      }
    }
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.globalAlpha = 1;

  // Soft-round L/R white border — edges turn away into the cylinder
  if (snug) {
    const edge = Math.max(1.5, sideInset);
    // Follow the tilted left edge (top inset more)
    const leftFade = ctx.createLinearGradient(
      xMin + leftTilt,
      sleeveTop,
      xMin + leftTilt + edge * 1.35,
      sleeveTop
    );
    leftFade.addColorStop(0, "rgba(0,0,0,0.55)");
    leftFade.addColorStop(0.4, "rgba(0,0,0,0.18)");
    leftFade.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = leftFade;
    ctx.beginPath();
    ctx.moveTo(xMin + leftTilt, sleeveTop);
    ctx.lineTo(xMin + leftTilt + edge * 1.35, sleeveTop);
    ctx.lineTo(xLeftBot + edge * 1.35, sleeveTop + sleeveH);
    ctx.lineTo(xLeftBot, sleeveTop + sleeveH);
    ctx.closePath();
    ctx.fill();

    const rightFade = ctx.createLinearGradient(xMax - edge * 1.35, 0, xMax, 0);
    rightFade.addColorStop(0, "rgba(0,0,0,0)");
    rightFade.addColorStop(0.6, "rgba(0,0,0,0.16)");
    rightFade.addColorStop(1, "rgba(0,0,0,0.5)");
    ctx.fillStyle = rightFade;
    ctx.fillRect(xMax - edge * 1.35, sleeveTop, edge * 1.35, sleeveH);

    // Keep spine edge clean (no white hairline past black)
    const trim = Math.max(1, drawW * 0.01);
    ctx.fillStyle = "rgba(0,0,0,0.88)";
    ctx.beginPath();
    ctx.moveTo(xMin + leftTilt, sleeveTop);
    ctx.lineTo(xMin + leftTilt + trim, sleeveTop);
    ctx.lineTo(xLeftBot + trim, sleeveTop + sleeveH);
    ctx.lineTo(xLeftBot, sleeveTop + sleeveH);
    ctx.closePath();
    ctx.fill();
  }

  if (!snug) {
    const occ = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
    occ.addColorStop(0, "rgba(0,0,0,0.28)");
    occ.addColorStop(0.12, "rgba(0,0,0,0.06)");
    occ.addColorStop(0.38, "rgba(0,0,0,0)");
    occ.addColorStop(0.62, "rgba(0,0,0,0)");
    occ.addColorStop(0.88, "rgba(0,0,0,0.05)");
    occ.addColorStop(1, "rgba(0,0,0,0.26)");
    ctx.fillStyle = occ;
    ctx.fillRect(bodyX, sleeveTop, bodyW, sleeveH);

    const spec = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
    spec.addColorStop(0, "rgba(255,255,255,0)");
    spec.addColorStop(0.16, "rgba(255,255,255,0)");
    spec.addColorStop(0.22, "rgba(255,255,255,0.12)");
    spec.addColorStop(0.28, "rgba(255,255,255,0)");
    spec.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = spec;
    ctx.fillRect(bodyX, sleeveTop, bodyW, sleeveH);
  }

  ctx.strokeStyle = snug ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.25)";
  ctx.lineWidth = snug ? 0.8 : 0.7;
  ctx.beginPath();
  ctx.moveTo(xMin + 2, sleeveTop + 0.5);
  ctx.lineTo(xMax - 2, sleeveTop + 0.5);
  ctx.stroke();
  ctx.strokeStyle = snug ? "rgba(0,0,0,0.1)" : "rgba(0,0,0,0.2)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(xLeftBot + 2, sleeveTop + sleeveH - 0.4);
  ctx.lineTo(xMax - botInsetR - 2, sleeveTop + sleeveH - 0.4);
  ctx.stroke();

  ctx.restore();

  // Multiply wrap by the real glass luminance so left dark / right highlight
  // (and top-forward falloff in the photo) drive the label shading.
  if (snug && glassSnap && glassSnap.data && glassSnap.width && glassSnap.height) {
    applyPhotoShadeToWrap(ctx, {
      snapX,
      snapY,
      glassSnap,
    });
  }
}

/**
 * Re-shade the drawn wrap using luminance from the unlabeled vial photo.
 * Horizontal glass lighting only (dark left / bright right). Vertical photo
 * falloff is ignored — cake + heel under the band were crushing the bottom.
 */
function applyPhotoShadeToWrap(ctx, { snapX, snapY, glassSnap }) {
  const w = glassSnap.width;
  const h = glassSnap.height;
  let wrapped;
  try {
    wrapped = ctx.getImageData(snapX, snapY, w, h);
  } catch {
    return;
  }
  const g = glassSnap.data;
  const d = wrapped.data;

  const lumAt = (x, y) => {
    const i = (y * w + x) * 4;
    return (g[i] + g[i + 1] + g[i + 2]) / 3;
  };
  const isCakeOrHot = (x, y) => {
    const i = (y * w + x) * 4;
    const r = g[i];
    const gr = g[i + 1];
    const b = g[i + 2];
    const L = (r + gr + b) / 3;
    const chroma = Math.max(r, gr, b) - Math.min(r, gr, b);
    return L > 170 && chroma < 32;
  };

  // Sample clear glass in the upper-mid band only — skip cake / heel
  const y0 = Math.floor(h * 0.12);
  const y1 = Math.max(y0 + 2, Math.floor(h * 0.55));
  const colShade = new Float32Array(w);
  let midSum = 0;
  let midN = 0;
  for (let x = 0; x < w; x += 1) {
    let sum = 0;
    let n = 0;
    for (let y = y0; y < y1; y += 1) {
      if (isCakeOrHot(x, y)) continue;
      const L = lumAt(x, y);
      if (L < 14) continue;
      sum += L;
      n += 1;
    }
    colShade[x] = n ? sum / n : 0;
    if (colShade[x] > 0) {
      midSum += colShade[x];
      midN += 1;
    }
  }
  for (let x = 0; x < w; x += 1) {
    if (colShade[x] > 0) continue;
    let found = 0;
    for (let dlt = 1; dlt < w && !found; dlt += 1) {
      if (x - dlt >= 0 && colShade[x - dlt] > 0) found = colShade[x - dlt];
      else if (x + dlt < w && colShade[x + dlt] > 0) found = colShade[x + dlt];
    }
    colShade[x] = found || 95;
  }
  const mid = Math.max(48, (midSum / Math.max(1, midN)) * 1.0);

  for (let y = 0; y < h; y += 1) {
    const v = y / Math.max(1, h - 1); // 0 top → 1 bottom
    // Top 75% pops out of glass — was reading dark/in-glass
    const topLift = v < 0.75 ? 1.05 : 1 + (1 - (v - 0.75) / 0.25) * 0.05;

    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (d[i + 3] < 8) continue;

      // Tiny left/right cue only — paper stays bright (outside glass)
      let shade = colShade[x] / mid;
      shade = Math.min(1.05, Math.max(0.9, shade));
      shade = 1 + (shade - 1) * 0.16;
      shade *= 1.07 * topLift;

      const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
      const ink = lum < 55 ? 0.12 : lum < 120 ? 0.25 : 1;
      const m = 1 + (shade - 1) * ink;
      d[i] = Math.min(255, Math.round(d[i] * m));
      d[i + 1] = Math.min(255, Math.round(d[i + 1] * m));
      d[i + 2] = Math.min(255, Math.round(d[i + 2] * m));
    }
  }
  ctx.putImageData(wrapped, snapX, snapY);
}

/**
 * Apply the clinical wrap upright on the glass (spine left → QR right).
 */
function drawUprightLabelOnVial(ctx, labelCanvas, geom) {
  drawCatalogWrapOnVial(ctx, labelCanvas, geom);
}

/**
 * Apply the clinical wrap to the glass like the reference product shot:
 * mild front-arc wrap so it reads as attached to the cylinder, not a flat card.
 */
function drawReferenceWrapOnVial(ctx, labelCanvas, geom) {
  drawUprightLabelOnVial(ctx, labelCanvas, geom);
}

/** Portrait sticker artwork — unused; wrap template is the source of truth. */
function paintBottleFaceLabel(ctx, dims, options = {}) {
  paintLabelTemplate(ctx, dims, options);
}

/**
 * Draw the portrait face sticker onto the vial glass with light edge shade.
 */
function drawFrontFaceLabel(ctx, labelCanvas, geom) {
  drawReferenceWrapOnVial(ctx, labelCanvas, geom);
}

function drawLabeledThreeMl(ctx, dims, options) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    sku = "",
    reconstituted = false,
    bacWater = "",
    concentration = "",
    doseRange = "",
    qrPayload = "",
    coaUrl = "",
  } = options;

  const cx = dims.w / 2;
  drawDarkStudio(ctx, dims.w, dims.h);

  const spot = ctx.createRadialGradient(cx, dims.h * 0.35, 10, cx, dims.h * 0.4, dims.w * 0.55);
  spot.addColorStop(0, "rgba(255,255,255,0.05)");
  spot.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, dims.w, dims.h);

  const bodyW = dims.w * 0.3;
  const bodyH = dims.h * 0.46;
  const bodyX = cx - bodyW / 2;
  const bodyBottom = dims.h * 0.72;
  const bodyY = bodyBottom - bodyH;
  const neckW = bodyW * 0.42;
  const neckH = bodyH * 0.12;
  const shoulderH = bodyH * 0.1;
  const capH = bodyH * 0.1;
  const neckY = bodyY - neckH;
  const capY = neckY - capH * 0.75;
  const radius = bodyW * 0.14;

  ellipse(ctx, cx, bodyBottom + dims.h * 0.015, bodyW * 0.75, bodyW * 0.14);
  const shadow = ctx.createRadialGradient(cx, bodyBottom, 2, cx, bodyBottom, bodyW);
  shadow.addColorStop(0, "rgba(0,0,0,0.65)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.fill();

  // Silver brushed aluminum cap
  const capW = neckW * 1.22;
  const silverSide = ctx.createLinearGradient(cx - capW / 2, 0, cx + capW / 2, 0);
  silverSide.addColorStop(0, "#4a5058");
  silverSide.addColorStop(0.25, "#c5ccd4");
  silverSide.addColorStop(0.5, "#f2f4f6");
  silverSide.addColorStop(0.75, "#9aa3ad");
  silverSide.addColorStop(1, "#3d434a");
  ctx.fillStyle = silverSide;
  roundRect(ctx, cx - capW / 2, capY + capH * 0.28, capW, capH * 0.72, 2);
  ctx.fill();
  ellipse(ctx, cx, capY + capH * 0.3, capW / 2, capH * 0.2);
  const silverTop = ctx.createRadialGradient(
    cx - capW * 0.15,
    capY + capH * 0.18,
    1,
    cx,
    capY + capH * 0.3,
    capW * 0.55
  );
  silverTop.addColorStop(0, "#ffffff");
  silverTop.addColorStop(0.45, "#c8d0d8");
  silverTop.addColorStop(1, "#5a616a");
  ctx.fillStyle = silverTop;
  ctx.fill();

  const neckGrad = ctx.createLinearGradient(cx - neckW / 2, 0, cx + neckW / 2, 0);
  neckGrad.addColorStop(0, "rgba(160, 175, 190, 0.5)");
  neckGrad.addColorStop(0.3, "rgba(255,255,255,0.35)");
  neckGrad.addColorStop(0.7, "rgba(255,255,255,0.12)");
  neckGrad.addColorStop(1, "rgba(130, 150, 170, 0.5)");
  ctx.fillStyle = neckGrad;
  roundRect(ctx, cx - neckW / 2, neckY, neckW, neckH + shoulderH * 0.3, neckW * 0.15);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2, neckY + neckH);
  ctx.bezierCurveTo(
    cx - neckW / 2,
    bodyY + shoulderH * 0.2,
    cx - bodyW / 2,
    bodyY + shoulderH * 0.4,
    cx - bodyW / 2,
    bodyY + shoulderH
  );
  ctx.lineTo(cx + bodyW / 2, bodyY + shoulderH);
  ctx.bezierCurveTo(
    cx + bodyW / 2,
    bodyY + shoulderH * 0.4,
    cx + neckW / 2,
    bodyY + shoulderH * 0.2,
    cx + neckW / 2,
    neckY + neckH
  );
  ctx.closePath();
  ctx.fillStyle = neckGrad;
  ctx.fill();

  const glass = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  glass.addColorStop(0, "rgba(100, 120, 140, 0.55)");
  glass.addColorStop(0.15, "rgba(255,255,255,0.45)");
  glass.addColorStop(0.5, "rgba(240,245,250,0.1)");
  glass.addColorStop(0.85, "rgba(255,255,255,0.4)");
  glass.addColorStop(1, "rgba(90, 110, 130, 0.55)");
  ctx.fillStyle = glass;
  roundRect(ctx, bodyX, bodyY + shoulderH * 0.85, bodyW, bodyH - shoulderH * 0.85, radius);
  ctx.fill();

  const inset = Math.max(2, bodyW * 0.04);
  ctx.save();
  roundRect(
    ctx,
    bodyX + inset,
    bodyY + shoulderH + inset,
    bodyW - inset * 2,
    bodyH - shoulderH - inset * 2,
    radius * 0.7
  );
  ctx.clip();
  ctx.fillStyle = "rgba(230, 235, 240, 0.2)";
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

  if (reconstituted) {
    const liquidTop = bodyY + bodyH * 0.45;
    ctx.fillStyle = "rgba(200, 215, 230, 0.45)";
    ctx.fillRect(bodyX, liquidTop, bodyW, bodyBottom - liquidTop);
  } else {
    const cakeH = bodyH * 0.28;
    const cakeY = bodyBottom - cakeH - radius * 0.4;
    drawPowderCake(
      ctx,
      bodyX + inset,
      cakeY,
      bodyW - inset * 2,
      cakeH,
      3,
      resolvePowderColor({ name })
    );
  }
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(bodyX + bodyW * 0.12, bodyY + shoulderH, bodyW * 0.1, bodyH * 0.35);

  ctx.strokeStyle = "rgba(180, 190, 200, 0.35)";
  ctx.lineWidth = 1.2;
  roundRect(ctx, bodyX, bodyY + shoulderH * 0.85, bodyW, bodyH - shoulderH * 0.85, radius);
  ctx.stroke();

  drawBrandWordmark(ctx, cx, bodyBottom + dims.h * 0.055, dims.w * 0.7);
}

function drawLabeledTenMl(ctx, dims, options) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    sku = "",
    reconstituted = false,
    bacWater = "",
    concentration = "",
    doseRange = "",
    qrPayload = "",
    coaUrl = "",
  } = options;

  const cx = dims.w / 2;
  drawDarkStudio(ctx, dims.w, dims.h);

  const bodyW = dims.w * 0.36;
  const bodyH = dims.h * 0.52;
  const bodyX = cx - bodyW / 2;
  const bodyBottom = dims.h * 0.74;
  const bodyY = bodyBottom - bodyH;
  const neckW = bodyW * 0.4;
  const neckH = bodyH * 0.1;
  const shoulderH = bodyH * 0.08;
  const capH = bodyH * 0.08;
  const neckY = bodyY - neckH;
  const capY = neckY - capH * 0.75;
  const radius = bodyW * 0.1;

  ellipse(ctx, cx, bodyBottom + dims.h * 0.012, bodyW * 0.7, bodyW * 0.12);
  const shadow = ctx.createRadialGradient(cx, bodyBottom, 2, cx, bodyBottom, bodyW);
  shadow.addColorStop(0, "rgba(0,0,0,0.6)");
  shadow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shadow;
  ctx.fill();

  const capW = neckW * 1.2;
  const silverSide = ctx.createLinearGradient(cx - capW / 2, 0, cx + capW / 2, 0);
  silverSide.addColorStop(0, "#4a5058");
  silverSide.addColorStop(0.5, "#f2f4f6");
  silverSide.addColorStop(1, "#3d434a");
  ctx.fillStyle = silverSide;
  roundRect(ctx, cx - capW / 2, capY + capH * 0.28, capW, capH * 0.72, 2);
  ctx.fill();
  ellipse(ctx, cx, capY + capH * 0.3, capW / 2, capH * 0.2);
  ctx.fill();

  const glass = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  glass.addColorStop(0, "rgba(100, 120, 140, 0.55)");
  glass.addColorStop(0.2, "rgba(255,255,255,0.4)");
  glass.addColorStop(0.5, "rgba(240,245,250,0.1)");
  glass.addColorStop(0.8, "rgba(255,255,255,0.35)");
  glass.addColorStop(1, "rgba(90, 110, 130, 0.55)");
  ctx.fillStyle = glass;
  roundRect(ctx, cx - neckW / 2, neckY, neckW, neckH + shoulderH, 4);
  ctx.fill();
  roundRect(ctx, bodyX, bodyY + shoulderH * 0.5, bodyW, bodyH - shoulderH * 0.5, radius);
  ctx.fill();

  const inset = Math.max(2, bodyW * 0.04);
  ctx.save();
  roundRect(
    ctx,
    bodyX + inset,
    bodyY + shoulderH + inset,
    bodyW - inset * 2,
    bodyH - shoulderH - inset * 2,
    radius * 0.7
  );
  ctx.clip();
  if (!reconstituted) {
    const cakeH = bodyH * 0.18;
    const cakeY = bodyBottom - cakeH - radius * 0.4;
    drawPowderCake(
      ctx,
      bodyX + inset,
      cakeY,
      bodyW - inset * 2,
      cakeH,
      3,
      resolvePowderColor({ name })
    );
  } else {
    ctx.fillStyle = "rgba(200, 215, 230, 0.4)";
    ctx.fillRect(bodyX, bodyY + bodyH * 0.4, bodyW, bodyH * 0.6);
  }
  ctx.restore();

  drawBrandWordmark(ctx, cx, bodyBottom + dims.h * 0.05, dims.w * 0.72);
}

/** Cover-fit helper kept for any legacy photo paths (unused by default). */
function drawPhotoVial(ctx, dims, options) {
  const { photo } = options;

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, dims.w, dims.h);

  const iw = photo.width;
  const ih = photo.height;
  const scale = Math.max(dims.w / iw, dims.h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (dims.w - dw) / 2;
  const dy = (dims.h - dh) / 2;
  ctx.drawImage(photo, dx, dy, dw, dh);
}

/** Clean BAC volume text for the label grid (drop redundant "BAC"). */
function formatBacForLabel(bacWater) {
  const raw = String(bacWater || "").trim();
  if (!raw) return "—";
  return raw.replace(/\s*BAC\s*$/i, "").trim() || "—";
}

function fitCenteredText(ctx, text, maxWidth, basePx, family) {
  let size = basePx;
  const value = String(text || "");
  while (size > 8) {
    ctx.font = `700 ${size}px ${family}`;
    if (ctx.measureText(value).width <= maxWidth) break;
    size -= 1;
  }
  return size;
}

/** Full → mid → short (or short-first) for label fitting. */
function labelNameOptions(displayName, rawName = "", { skipShorten = false, preferShort = false } = {}) {
  const full = String(displayName || "")
    .replace(/\(.*?\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  if (skipShorten) return full ? [full] : ["—"];

  const mid = full
    .replace(/\bCJC-1295\s*WITHOUT\s*DAC\s*\+\s*IPAMORELIN\b/g, "CJC/IPA")
    .replace(/\bCJC-1295\s*\/\s*IPAMORELIN\b/g, "CJC/IPA")
    .replace(/\bCJC-1295\b/g, "CJC")
    .replace(/\bBPC-157\b/g, "BPC157")
    .replace(/\bTB-500\b/g, "TB500")
    .replace(/\bTB500\b/g, "TB500")
    .replace(/\bFOX04-DRI\b/g, "FOX4")
    .replace(/\bFOXO4-DRI\b/g, "FOX4")
    .replace(/\bFOXO4\b/g, "FOX4")
    .replace(/\bFOX04\b/g, "FOX4")
    .replace(/\bTHYMOSIN ALPHA-1\b/g, "TA-1")
    .replace(/\bTHYMOSIN ALPHA 1\b/g, "TA-1")
    .replace(/\bTESAMORELIN\b/g, "TESA")
    .replace(/\bIPAMORELIN\b/g, "IPA")
    .replace(/\bGLUTATHIONE\b/g, "GLUTA")
    .replace(/\bEPITHALON\b/g, "EPIT")
    .replace(/\bEPITALON\b/g, "EPIT")
    .replace(/\bCAGRILINTIDE\b/g, "CARGI")
    .replace(/\bRETATRUTIDE\b/g, "RETA")
    .replace(/\bSEMAGLUTIDE\b/g, "SEMA")
    .replace(/\bTIRZEPATIDE\b/g, "TIRZ")
    .replace(/\s*\/\s*/g, "/")
    .replace(/\s+/g, " ")
    .trim();

  const short = String(shortLabelName(rawName || displayName) || "")
    .trim()
    .toUpperCase();

  const ordered = preferShort ? [short, mid, full] : [full, mid, short];
  const opts = [];
  for (const v of ordered) {
    if (v && !opts.includes(v)) opts.push(v);
  }
  return opts.length ? opts : ["PEPTIDE"];
}

function wrapTextLines(ctx, text, maxWidth) {
  const raw = String(text || "").trim();
  if (!raw) return [""];
  if (ctx.measureText(raw).width <= maxWidth) return [raw];

  // Keep slash/hyphen compounds (CJC/IPA) intact — only break on spaces.
  const words = raw.split(/\s+/).filter(Boolean);
  const lines = [];
  let cur = "";
  for (const word of words) {
    const next = cur ? `${cur} ${word}` : word;
    if (!cur || ctx.measureText(next).width <= maxWidth) {
      cur = next;
      continue;
    }
    // Word itself is wider than the column — soft-break at / or -
    if (ctx.measureText(word).width > maxWidth && /[/-]/.test(word)) {
      if (cur) {
        lines.push(cur);
        cur = "";
      }
      const parts = word.split(/(?=[/-])/);
      let buf = "";
      for (const p of parts) {
        if (!buf) {
          buf = p;
        } else if (ctx.measureText(buf + p).width <= maxWidth) {
          buf += p;
        } else {
          lines.push(buf);
          buf = p.replace(/^[/-]/, "") || p;
        }
      }
      cur = buf;
      continue;
    }
    lines.push(cur);
    cur = word;
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [raw];
}

/**
 * Black text only (transparent background). Wraps up to maxLines;
 * uses shortened peptide names when the full name can't stay readable.
 */
function drawLabelNameBlock(
  ctx,
  {
    name,
    rawName = "",
    cx,
    y,
    h,
    maxWidth,
    family,
    maxLines = 2,
    basePx = 14,
    minPx = 8,
    weight = "800",
    skipShorten = false,
    preferShort = false,
  }
) {
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const candidates = labelNameOptions(name, rawName, { skipShorten, preferShort });
  const readableMin = Math.max(minPx + 1, Math.round(basePx * 0.78));

  function tryFit(candidate) {
    for (let size = basePx; size >= minPx; size -= 1) {
      ctx.font = `${weight} ${size}px ${family}`;
      const lines = wrapTextLines(ctx, candidate, maxWidth);
      if (lines.length > maxLines) continue;
      const lineH = size * 1.12;
      if (lines.length * lineH > h * 1.05) continue;
      return { lines, size, lineH, candidate };
    }
    return null;
  }

  let best = null;
  let bestAny = null;
  for (const candidate of candidates) {
    const fit = tryFit(candidate);
    if (!fit) continue;
    if (!bestAny || fit.size > bestAny.size) bestAny = fit;
    // Prefer first readable candidate (short-first on catalog, else full → mid → short)
    if (fit.size >= readableMin) {
      best = fit;
      break;
    }
  }
  best = best || bestAny;

  if (!best) {
    const fallback = candidates[candidates.length - 1];
    ctx.font = `${weight} ${minPx}px ${family}`;
    best = {
      lines: wrapTextLines(ctx, fallback, maxWidth).slice(0, maxLines),
      size: minPx,
      lineH: minPx * 1.12,
    };
  }

  const totalH = best.lines.length * best.lineH;
  let ty = y + (h - totalH) / 2 + best.lineH / 2;
  ctx.font = `${weight} ${best.size}px ${family}`;
  for (const line of best.lines) {
    ctx.fillText(line, cx, ty);
    ty += best.lineH;
  }
}

/** White Undisclosed mark, optionally rotated with the vertical rail. */
function drawLabelSpineMark(
  ctx,
  cx,
  cy,
  r,
  markImage = udMarkCache,
  rotation = 0
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  if (markImage?.width) {
    ctx.drawImage(markImage, -r, -r, r * 2, r * 2);
    ctx.restore();
    return;
  }

  // Asset-loading fallback: preserve only the hex outline. Never redraw or
  // substitute the retired letterform.
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 30);
    const x = r * Math.cos(a);
    const y = r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(1.5, r * 0.16);
  ctx.stroke();
  ctx.restore();
}

/** Draw the borderless locked label at its physical print size. */
export function drawBlankLabelFromImage(canvas, options = {}) {
  return drawPhysicalLabel(canvas, { ...options, blank: true });
}

export function drawPhysicalLabel(canvas, options = {}) {
  const { vialMl = 3, size = "md", blank = false } = options;
  const { printW, printH, cssW, spec, dpi } = physicalLabelCanvasSize(
    vialMl,
    size
  );

  // Buffer matches print pixels exactly (LABEL_PRINT_DPI). Display fills the
  // parent column while locking the physical W×H aspect (3 mL → 40×20).
  canvas.width = printW;
  canvas.height = printH;
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  canvas.style.maxWidth = cssW;
  canvas.style.aspectRatio = `${spec.widthMm} / ${spec.heightMm}`;
  canvas.dataset.labelMm = `${spec.widthMm}x${spec.heightMm}`;
  canvas.dataset.labelDpi = String(dpi);
  canvas.dataset.vialMl = String(Number(vialMl) || 3);

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, printW, printH);
  // Vector fills / text — keep smoothing off so edges stay crisp when
  // the high-res canvas is downscaled to the CSS preview size.
  ctx.imageSmoothingEnabled = false;

  paintLabelTemplate(
    ctx,
    { w: printW, h: printH, cornerR: 0 },
    {
      ...options,
      blank,
      forceSiteQr: Boolean(options.forceSiteQr) && blank,
      qrPayload: blank
        ? SITE_QR_URL
        : options.qrPayload || options.coaUrl || SITE_QR_URL,
      coaUrl: blank ? "" : options.coaUrl || "",
    }
  );

  return embedPngDpi(canvas.toDataURL("image/png"), dpi);
}

export function drawLabelTemplate(canvas, options = {}) {
  const { size = "md", vialMl = 3 } = options;
  return drawPhysicalLabel(canvas, {
    ...options,
    vialMl,
    size,
  });
}

/**
 * Paint the locked Undisclosed label master:
 * square white stock, full-bleed black rail, black amount bar, Sentinel above
 * the QR, and no outside printed border.
 */
function paintLabelTemplate(ctx, dims, options = {}) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    bacWater = "",
    concentration = "",
    doseRange = "",
    sku = "",
    qrPayload = "",
    coaUrl = "",
    footerText = "",
    blank = false,
    forceSiteQr = false,
    labelType = "CALCULATOR",
    formText = "LYOPHILIZED POWDER",
    storageTemp = "36–46°F",
    mascot = sentinelMascotCache,
    udMark = udMarkCache,
    brandGapChars = 1,
  } = options;

  const w = dims.w;
  const h = dims.h;
  const ink = "#000000";
  const paper = "#ffffff";
  const isCatalog = String(labelType || "").toUpperCase() === "CATALOG";
  const railW = Math.round(w * (h / w > 0.55 ? 0.1 : 0.092));
  const rightW = Math.round(w * 0.235);
  const midX = railW;
  const rightX = w - rightW;
  const midW = rightX - midX;
  const midCx = midX + midW / 2;
  const pad = midW * 0.055;
  const contentW = midW - pad * 2;
  const lineW = Math.max(2, h * 0.004);

  // White stock, no outline and no rounded outside edge.
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = paper;
  ctx.fillRect(0, 0, w, h);

  // Full-bleed black physical-edge rail.
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, railW, h);

  const company = "UNDISCLOSED";
  const companyFont = Math.max(13, Math.min(h * 0.075, railW * 0.44));
  const companyTrack = companyFont * 0.12;
  const markR = Math.min(railW * 0.33, h * 0.083);
  ctx.save();
  ctx.font = `900 ${companyFont}px Outfit, "Arial Narrow", sans-serif`;
  let companyW = 0;
  for (const ch of company) companyW += ctx.measureText(ch).width + companyTrack;
  companyW -= companyTrack;
  const gapCount = Math.max(0, Math.min(4, Number(brandGapChars) || 0));
  const brandGap = ctx.measureText(" ").width * gapCount;
  const brandBlockH = companyW + brandGap + markR * 2;
  const brandBlockTop = Math.max(0, (h - brandBlockH) / 2);
  const companyCy = brandBlockTop + companyW / 2;
  const markCy = brandBlockTop + companyW + brandGap + markR;
  ctx.translate(railW * 0.53, companyCy);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = paper;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let companyX = -companyW / 2;
  for (const ch of company) {
    const chW = ctx.measureText(ch).width;
    ctx.fillText(ch, companyX + chW / 2, 0);
    companyX += chW + companyTrack;
  }
  ctx.restore();

  drawLabelSpineMark(
    ctx,
    railW * 0.53,
    markCy,
    markR,
    udMark,
    -Math.PI / 2
  );

  // Locked panel divider.
  ctx.strokeStyle = ink;
  ctx.lineWidth = lineW;
  ctx.beginPath();
  ctx.moveTo(rightX, h * 0.045);
  ctx.lineTo(rightX, h * 0.955);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const headerSize = Math.max(14, h * 0.058);
  ctx.font = `900 ${headerSize}px Outfit, "Arial Narrow", sans-serif`;
  ctx.fillText("— UNDISCLOSED —", midCx, h * 0.12);

  if (!blank) {
    const product = String(name || "PEPTIDE")
      .replace(/\(.*?\)/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
    const nameFamily = 'Outfit, "Arial Narrow", "Arial Black", sans-serif';
    const nameSize = fitCenteredText(
      ctx,
      product,
      contentW * 0.95,
      Math.max(24, h * 0.145),
      nameFamily
    );
    ctx.font = `900 ${nameSize}px ${nameFamily}`;
    ctx.fillText(product, midCx, h * 0.305);
  }

  // Same centered black amount bar for catalog and calculator masters.
  const barX = midX + pad;
  const barY = h * 0.435;
  const barW = contentW;
  const barH = h * 0.19;
  ctx.fillStyle = ink;
  roundRect(ctx, barX, barY, barW, barH, Math.max(3, h * 0.012));
  ctx.fill();

  const massNum =
    !blank && mass !== "" && mass != null ? String(mass).trim() : "";
  if (massNum) {
    const massUnit = String(unit || "mg").toUpperCase();
    const numSize = Math.max(22, h * 0.125);
    const unitSize = Math.max(12, h * 0.058);
    ctx.font = `900 ${numSize}px Outfit, "Arial Narrow", sans-serif`;
    const numW = ctx.measureText(massNum).width;
    ctx.font = `900 ${unitSize}px Outfit, "Arial Narrow", sans-serif`;
    const unitLabel = ` ${massUnit}`;
    const unitW = ctx.measureText(unitLabel).width;
    const startX = midCx - (numW + unitW) / 2;
    ctx.fillStyle = paper;
    ctx.textAlign = "left";
    ctx.font = `900 ${numSize}px Outfit, "Arial Narrow", sans-serif`;
    ctx.fillText(massNum, startX, barY + barH / 2);
    ctx.font = `900 ${unitSize}px Outfit, "Arial Narrow", sans-serif`;
    ctx.fillText(unitLabel, startX + numW, barY + barH / 2 + unitSize * 0.08);
  }

  if (isCatalog) {
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.font = `900 ${Math.max(11, h * 0.052)}px Outfit, "Arial Narrow", sans-serif`;
    ctx.fillText(
      String(formText || "LYOPHILIZED POWDER").toUpperCase(),
      midCx,
      h * 0.77
    );
    ctx.font = `800 ${Math.max(10, h * 0.045)}px Outfit, "Arial Narrow", sans-serif`;
    ctx.fillText(
      `STORE AT ${String(storageTemp || "36–46°F")}`.toUpperCase(),
      midCx,
      h * 0.89
    );
  } else {
    const gridTop = h * 0.70;
    const gridBottom = h * 0.91;
    const colW = contentW / 3;
    const cells = blank
      ? [
          { label: "DILUENT", value: "" },
          { label: "CONCENTRATION", value: "" },
          { label: "DOSE RANGE", value: "" },
        ]
      : [
          { label: "DILUENT", value: formatBacForLabel(bacWater) },
          { label: "CONCENTRATION", value: String(concentration || "—") },
          { label: "DOSE RANGE", value: String(doseRange || "—") },
        ];

    cells.forEach((cell, i) => {
      const cellX = midX + pad + colW * i;
      const cellCx = cellX + colW / 2;
      if (i > 0) {
        ctx.strokeStyle = ink;
        ctx.lineWidth = lineW;
        ctx.beginPath();
        ctx.moveTo(cellX, gridTop);
        ctx.lineTo(cellX, gridBottom);
        ctx.stroke();
      }
      ctx.fillStyle = ink;
      ctx.textAlign = "center";
      ctx.font = `900 ${Math.max(10, h * 0.041)}px Outfit, "Arial Narrow", sans-serif`;
      ctx.fillText(cell.label, cellCx, h * 0.72);

      const raw = String(cell.value ?? "");
      if (!raw) return;
      const split = raw.match(/^(.*?)\s*(\([^)]+\))\s*$/);
      if (split) {
        const first = split[1].trim();
        const second = split[2].trim().replace(/^\(|\)$/g, "");
        const firstSize = fitCenteredText(
          ctx,
          first,
          colW * 0.88,
          Math.max(14, h * 0.064),
          'Outfit, "Arial Narrow", sans-serif'
        );
        ctx.font = `800 ${firstSize}px Outfit, "Arial Narrow", sans-serif`;
        ctx.fillText(first, cellCx, h * 0.815);
        const secondSize = fitCenteredText(
          ctx,
          second,
          colW * 0.88,
          Math.max(11, h * 0.048),
          'Outfit, "Arial Narrow", sans-serif'
        );
        ctx.font = `700 ${secondSize}px Outfit, "Arial Narrow", sans-serif`;
        ctx.fillText(second, cellCx, h * 0.885);
      } else {
        const valueSize = fitCenteredText(
          ctx,
          raw,
          colW * 0.88,
          Math.max(14, h * 0.065),
          'Outfit, "Arial Narrow", sans-serif'
        );
        ctx.font = `800 ${valueSize}px Outfit, "Arial Narrow", sans-serif`;
        ctx.fillText(raw, cellCx, h * 0.84);
      }
    });
  }

  // Sentinel sits behind and above the QR box, matching the locked master.
  const rightCx = rightX + rightW / 2;
  const mascotSize = Math.min(rightW * 0.54, h * 0.22);
  const mascotY = h * 0.075;
  const mascotImg = mascot || sentinelMascotCache;
  if (mascotImg?.width) {
    ctx.drawImage(
      mascotImg,
      rightCx - mascotSize / 2,
      mascotY,
      mascotSize,
      mascotSize
    );
  }

  const qrBox = Math.min(rightW * 0.76, h * 0.39);
  const qrX = rightCx - qrBox / 2;
  const qrY = mascotY + mascotSize * 0.72;
  ctx.fillStyle = paper;
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(2, h * 0.006);
  roundRect(ctx, qrX, qrY, qrBox, qrBox, Math.max(4, qrBox * 0.08));
  ctx.fill();
  ctx.stroke();

  const payload = forceSiteQr
    ? SITE_QR_URL
    : qrPayloadFromOptions({
        qrPayload: blank ? SITE_QR_URL : qrPayload,
        coaUrl: blank ? "" : coaUrl,
      });
  const qrInset = qrBox * 0.1;
  drawQrCode(
    ctx,
    qrX + qrInset,
    qrY + qrInset,
    qrBox - qrInset * 2,
    "site",
    false,
    payload
  );

  const discSize = Math.max(9, h * 0.042);
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.font = `900 ${discSize}px Outfit, "Arial Narrow", sans-serif`;
  ["RESEARCH USE", "NOT FOR HUMAN", "CONSUMPTION"].forEach((line, i) => {
    ctx.fillText(line, rightCx, qrY + qrBox + discSize * (1.55 + i * 1.32));
  });

  void sku;
  void footerText;
}

/** @deprecated Kept temporarily for visual regression comparison. */
function paintLegacyLabelTemplate(ctx, dims, options = {}) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    bacWater = "",
    concentration = "",
    doseRange = "",
    sku = "",
    qrPayload = "",
    coaUrl = "",
    footerText = "",
    blank = false,
    forceSiteQr = false,
    labelType = "CALCULATOR",
    formText = "LYOPHILIZED POWDER",
    storageTemp = "36–46°F",
  } = options;

  const isCatalog = String(labelType || "").toUpperCase() === "CATALOG";

  const cornerR =
    dims.cornerR ?? Math.max(8, Math.round(Math.min(dims.w, dims.h) * 0.07));
  const spineW = Math.round(dims.w * 0.095);
  const rightW = Math.round(dims.w * 0.225);
  const midX = spineW;
  const midW = dims.w - spineW - rightW;
  const rightX = spineW + midW;
  const ink = "#000000";
  const muted = "#222222";
  const paper = "#ffffff";
  const hair = Math.max(1, dims.h * 0.0035);
  const footerTrim = String(footerText || "").trim();
  const footerH = footerTrim ? Math.round(dims.h * 0.1) : 0;
  const bodyH = dims.h - footerH;
  const padX = midW * 0.055;
  const contentW = midW - padX * 2;
  const ruleX = midX + padX;
  const midCx = midX + midW / 2;

  // Reference vertical rhythm (full white face, no Made-in-China bar)
  const yHeader = bodyH * 0.12;
  const yName = bodyH * (isCatalog ? 0.32 : 0.34);
  const yRule2 = bodyH * 0.44;
  const yMass = bodyH * (isCatalog ? 0.52 : 0.55);
  const yRule3 = bodyH * 0.66;
  // BAC / concentration / dose grid — low on the face, room for readable type
  const gridTop = bodyH * 0.74;
  const gridBottom = bodyH * 0.98;
  const gridH = Math.max(22, gridBottom - gridTop);

  ctx.fillStyle = paper;
  roundRect(ctx, 0, 0, dims.w, dims.h, cornerR);
  ctx.fill();

  ctx.save();
  roundRect(ctx, 0, 0, dims.w, dims.h, cornerR);
  ctx.clip();

  // Black spine
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, spineW, bodyH);

  const railW = Math.max(1.5, spineW * 0.06);
  ctx.fillStyle = paper;
  ctx.fillRect(spineW - railW, 0, railW, bodyH);

  // Spine wordmark — bold + larger; UD mark pulled up toward it
  const spineFont = Math.max(13, Math.min(bodyH * 0.077, spineW * 0.456));
  const spineWord = "UNDISCLOSED";
  const track = spineFont * 0.12;
  ctx.save();
  ctx.font = `800 ${spineFont}px Outfit, "Segoe UI", sans-serif`;
  let spineTextW = 0;
  for (const ch of spineWord) spineTextW += ctx.measureText(ch).width + track;
  spineTextW -= track;
  ctx.translate(spineW * 0.48, bodyH * 0.44);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  let sx = -spineTextW / 2;
  for (const ch of spineWord) {
    const cw = ctx.measureText(ch).width;
    ctx.fillText(ch, sx + cw / 2, 0);
    sx += cw + track;
  }
  ctx.restore();

  const markR = Math.min(spineW * 0.32, bodyH * 0.082);
  const spineCy = bodyH * 0.44;
  const textBottom = spineCy + spineTextW / 2;
  const markCy = Math.min(bodyH - markR * 1.2, textBottom + markR * 1.45);
  drawLabelSpineMark(ctx, spineW * 0.48, markCy, markR);

  // Hairline between mid panel and QR column
  ctx.strokeStyle = "rgba(0,0,0,0.28)";
  ctx.lineWidth = hair;
  ctx.beginPath();
  ctx.moveTo(rightX, bodyH * 0.05);
  ctx.lineTo(rightX, bodyH * 0.95);
  ctx.stroke();

  // — UNDISCLOSED — (bold + larger)
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const brandHeaderPx = Math.max(14, bodyH * 0.067);
  ctx.font = `800 ${brandHeaderPx}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("— UNDISCLOSED —", midCx, yHeader);

  if (!blank) {
    const product = String(name || "PEPTIDE")
      .replace(/\(.*?\)/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toUpperCase();
    const nameFamily = 'Outfit, "Segoe UI", "Arial Black", sans-serif';
    const nameSize = fitCenteredText(
      ctx,
      product,
      contentW * 0.98,
      Math.max(22, bodyH * 0.2),
      nameFamily
    );
    ctx.font = `800 ${nameSize}px ${nameFamily}`;
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.fillText(product, midCx, yName);
  }

  const massNum =
    !blank && mass !== "" && mass != null ? String(mass).trim() : "";
  const massUnit = String(unit || "mg").toUpperCase();

  if (isCatalog) {
    // Catalog template: black amount bar + form + storage (no dosage block)
    if (massNum) {
      const barH = Math.max(28, bodyH * 0.145);
      const barY = yMass - barH * 0.55;
      const barW = contentW * 0.92;
      const barX = midCx - barW / 2;
      ctx.fillStyle = ink;
      roundRect(ctx, barX, barY, barW, barH, Math.max(3, barH * 0.08));
      ctx.fill();
      const numSize = Math.max(18, bodyH * 0.12);
      const unitSize = Math.max(11, bodyH * 0.055);
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `800 ${numSize}px Outfit, "Segoe UI", sans-serif`;
      const numW = ctx.measureText(massNum).width;
      ctx.font = `800 ${unitSize}px Outfit, "Segoe UI", sans-serif`;
      const unitLabel = ` ${massUnit}`;
      const unitW = ctx.measureText(unitLabel).width;
      const startX = midCx - (numW + unitW) / 2;
      ctx.font = `800 ${numSize}px Outfit, "Segoe UI", sans-serif`;
      ctx.fillText(massNum, startX, yMass);
      ctx.font = `800 ${unitSize}px Outfit, "Segoe UI", sans-serif`;
      ctx.fillText(unitLabel, startX + numW, yMass + unitSize * 0.02);
    }
    const form = String(formText || "LYOPHILIZED POWDER").toUpperCase();
    const store = `STORE AT ${String(storageTemp || "36–46°F")}`.toUpperCase();
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${Math.max(11, bodyH * 0.05)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(form, midCx, bodyH * 0.78);
    ctx.font = `700 ${Math.max(10, bodyH * 0.045)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(store, midCx, bodyH * 0.9);
  } else {
    // Calculator template: mass line + diluent / concentration / dose grid
    ctx.fillStyle = ink;
    ctx.fillRect(ruleX, yRule2, contentW, hair);
    ctx.fillRect(ruleX, yRule3, contentW, hair);

    if (massNum) {
      const numSize = Math.max(22, bodyH * 0.14);
      const unitSize = Math.max(12, bodyH * 0.07);
      ctx.font = `800 ${numSize}px Outfit, "Segoe UI", sans-serif`;
      const numW = ctx.measureText(massNum).width;
      ctx.font = `800 ${unitSize}px Outfit, "Segoe UI", sans-serif`;
      const unitLabel = ` ${massUnit}`;
      const unitW = ctx.measureText(unitLabel).width;
      const startX = midCx - (numW + unitW) / 2;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = ink;
      ctx.font = `800 ${numSize}px Outfit, "Segoe UI", sans-serif`;
      ctx.fillText(massNum, startX, yMass);
      ctx.font = `800 ${unitSize}px Outfit, "Segoe UI", sans-serif`;
      ctx.fillText(unitLabel, startX + numW, yMass + unitSize * 0.02);
    }

    const colW = contentW / 3;
    const gridLeft = ruleX;
    const cells = blank
      ? [
          { label: "DILUENT", value: "" },
          { label: "CONCENTRATION", value: "" },
          { label: "DOSE RANGE", value: "" },
        ]
      : [
          { label: "DILUENT", value: formatBacForLabel(bacWater) },
          { label: "CONCENTRATION", value: String(concentration || "—") },
          { label: "DOSE RANGE", value: String(doseRange || "—") },
        ];

    cells.forEach((cell, i) => {
      const cellCx = gridLeft + colW * (i + 0.5);
      if (i > 0) {
        ctx.strokeStyle = "rgba(0,0,0,0.28)";
        ctx.lineWidth = hair;
        ctx.beginPath();
        ctx.moveTo(gridLeft + colW * i, gridTop + gridH * 0.1);
        ctx.lineTo(gridLeft + colW * i, gridTop + gridH * 0.9);
        ctx.stroke();
      }
      const headerY = yRule3 + bodyH * 0.048;
      ctx.fillStyle = ink;
      ctx.font = `800 ${Math.max(10, bodyH * 0.046)}px Outfit, "Segoe UI", sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(cell.label, cellCx, headerY);

      const rawVal = String(cell.value ?? "");
      if (!rawVal) return;
      const valueBandTop = headerY + bodyH * 0.04;
      const valueBandBot = bodyH * 0.96;
      const valueMid = (valueBandTop + valueBandBot) / 2;
      const split = rawVal.match(/^(.*?)\s*(\([^)]+\))\s*$/);
      if (split) {
        const line1 = split[1].trim();
        const line2 = split[2].trim();
        const v1 = fitCenteredText(
          ctx,
          line1,
          colW * 0.92,
          Math.max(14, bodyH * 0.068),
          'Outfit, "Segoe UI", sans-serif'
        );
        ctx.font = `700 ${v1}px Outfit, "Segoe UI", sans-serif`;
        ctx.fillStyle = ink;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(line1, cellCx, valueMid - bodyH * 0.032);
        const v2 = fitCenteredText(
          ctx,
          line2,
          colW * 0.92,
          Math.max(11, bodyH * 0.05),
          'Outfit, "Segoe UI", sans-serif'
        );
        ctx.font = `600 ${v2}px Outfit, "Segoe UI", sans-serif`;
        ctx.fillStyle = muted;
        ctx.fillText(line2, cellCx, valueMid + bodyH * 0.038);
      } else {
        const valueSize = fitCenteredText(
          ctx,
          rawVal,
          colW * 0.92,
          Math.max(14, bodyH * 0.07),
          'Outfit, "Segoe UI", sans-serif'
        );
        ctx.font = `700 ${valueSize}px Outfit, "Segoe UI", sans-serif`;
        ctx.fillStyle = ink;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(rawVal, cellCx, valueMid);
      }
    });
  }
  // QR + research disclaimer — QR top aligns with the upper write-in rule
  const discLines = ["RESEARCH USE", "NOT FOR HUMAN", "CONSUMPTION"];
  const discPx = Math.max(8, bodyH * 0.04);
  const discLead = discPx * 1.35;
  const discBlockH = discPx * 3.4;
  let qrBox = Math.max(
    46,
    Math.min(rightW * 0.96, bodyH * 0.618)
  );
  // Align with the two mid rules: top near upper rule, nudged up 9%
  const qrY = yRule2 - bodyH * 0.09;
  const maxBox = bodyH * 0.98 - qrY - discLead - discBlockH;
  if (qrBox > maxBox) qrBox = Math.max(28, maxBox);
  const qrX = rightX + (rightW - qrBox) / 2;

  ctx.fillStyle = paper;
  ctx.fillRect(qrX, qrY, qrBox, qrBox);

  {
    const qrInset = qrBox * 0.08;
    const payload = forceSiteQr
      ? SITE_QR_URL
      : qrPayloadFromOptions({
          qrPayload: blank ? SITE_QR_URL : qrPayload,
          coaUrl: blank ? "" : coaUrl,
        });
    drawQrCode(
      ctx,
      qrX + qrInset,
      qrY + qrInset,
      qrBox - qrInset * 2,
      "site",
      false,
      payload
    );
  }

  const discX = rightX + rightW / 2;
  let discY = qrY + qrBox + discPx * 1.35;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  ctx.font = `700 ${discPx}px Outfit, "Segoe UI", sans-serif`;
  for (const line of discLines) {
    ctx.fillText(line, discX, discY);
    discY += discPx * 1.15;
  }

  if (footerH > 0) {
    ctx.fillStyle = ink;
    ctx.fillRect(0, dims.h - footerH, dims.w, footerH);
    ctx.fillStyle = "#ffffff";
    ctx.font = `600 ${Math.max(9, footerH * 0.38)}px Outfit, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(footerTrim.toUpperCase(), dims.w / 2, dims.h - footerH / 2);
  }

  void sku;
  ctx.restore();
}

/**
 * Insert/replace PNG pHYs so printers treat the file as `dpi` (e.g. 600 →
 * 945×472 px prints as 40×20 mm).
 */
export function embedPngDpi(dataUrl, dpi = LABEL_PRINT_DPI) {
  if (!dataUrl || typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/png")) {
    return dataUrl;
  }
  try {
    const b64 = dataUrl.split(",")[1];
    if (!b64) return dataUrl;
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

    const ppm = Math.round(dpi * (100 / 2.54)); // dots per meter
    const phys = new Uint8Array(9);
    const view = new DataView(phys.buffer);
    view.setUint32(0, ppm);
    view.setUint32(4, ppm);
    phys[8] = 1; // meters

    const chunkType = [0x70, 0x48, 0x59, 0x73]; // pHYs
    const crcInput = new Uint8Array(4 + phys.length);
    crcInput.set(chunkType, 0);
    crcInput.set(phys, 4);
    const crc = crc32(crcInput);

    // Strip any existing pHYs, then insert after IHDR.
    const cleaned = stripPngChunk(bytes, "pHYs");
    const ihdrEnd = 8 + 4 + 4 + 13 + 4; // sig + len + IHDR + data + crc
    const chunk = new Uint8Array(4 + 4 + phys.length + 4);
    const cv = new DataView(chunk.buffer);
    cv.setUint32(0, phys.length);
    chunk.set(chunkType, 4);
    chunk.set(phys, 8);
    cv.setUint32(8 + phys.length, crc);

    const out = new Uint8Array(cleaned.length + chunk.length);
    out.set(cleaned.subarray(0, ihdrEnd), 0);
    out.set(chunk, ihdrEnd);
    out.set(cleaned.subarray(ihdrEnd), ihdrEnd + chunk.length);

    let s = "";
    const chunkSize = 0x8000;
    for (let i = 0; i < out.length; i += chunkSize) {
      s += String.fromCharCode(...out.subarray(i, i + chunkSize));
    }
    return `data:image/png;base64,${btoa(s)}`;
  } catch {
    return dataUrl;
  }
}

function stripPngChunk(bytes, typeName) {
  const type = [...typeName].map((c) => c.charCodeAt(0));
  const out = [];
  out.push(...bytes.subarray(0, 8));
  let i = 8;
  while (i + 8 <= bytes.length) {
    const len =
      (bytes[i] << 24) | (bytes[i + 1] << 16) | (bytes[i + 2] << 8) | bytes[i + 3];
    const t0 = bytes[i + 4];
    const t1 = bytes[i + 5];
    const t2 = bytes[i + 6];
    const t3 = bytes[i + 7];
    const chunkTotal = 12 + len;
    const match =
      t0 === type[0] && t1 === type[1] && t2 === type[2] && t3 === type[3];
    if (!match) {
      for (let j = 0; j < chunkTotal && i + j < bytes.length; j++) {
        out.push(bytes[i + j]);
      }
    }
    i += chunkTotal;
    if (t0 === 0x49 && t1 === 0x45 && t2 === 0x4e && t3 === 0x44) break; // IEND
  }
  return Uint8Array.from(out);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

export function downloadVialPng(
  dataUrl,
  filename = "wellpept-vial.png",
  { dpi = LABEL_PRINT_DPI } = {}
) {
  const link = document.createElement("a");
  link.href = embedPngDpi(dataUrl, dpi);
  link.download = filename;
  link.click();
}
