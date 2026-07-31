import QRCode from "qrcode";

/** Wellpept / Undisclosed vial art — photoreal glass vial + compact clinical sticker. */

/** Undisclosed brand plate (labeled vial with UD hex mark). */
export const BRAND_IMAGE_SRC = "/undisclosed-brand.webp";
export const BRAND_IMAGE_FALLBACK_SRC = "/undisclosed-brand.jpg";
/** Photoreal unlabeled 3 mL research vial (studio photo). */
export const BRAND_VIAL_SRC = "/real-vial-3ml.webp";
/** Compact plate for catalog cards / phone grids. */
export const BRAND_VIAL_CARD_SRC = "/real-vial-3ml-card.webp";
/** Photoreal unlabeled 10 mL research vial (studio photo). */
export const BRAND_VIAL_10_SRC = "/real-vial-10ml.webp";
export const BRAND_VIAL_10_CARD_SRC = "/real-vial-10ml-card.webp";
/** Blank clinical wrap (peptide fields cleared, UD spine mark). */
export const BLANK_LABEL_SRC = "/undisclosed-label-blank.webp";
/** Hex UD seal / monogram for Undisclosed. */
export const UD_MARK_SRC = "/ud-monogram.svg";
/** @deprecated use UD_MARK_SRC */
export const WP_MARK_SRC = UD_MARK_SRC;
/** @deprecated use UD_MARK_SRC */
export const WP_MONOGRAM_SRC = UD_MARK_SRC;

/**
 * Physical wrap label size by vial bottle (rounded sticker).
 * 3 mL → 40×20 · 5 mL → 40×25 · 10 mL → 50×30 · 30 mL → 70×40
 * @type {Record<number, { widthMm: number, heightMm: number, src?: string }>}
 */
export const LABEL_SPEC_BY_VIAL_ML = {
  3: { widthMm: 40, heightMm: 20, src: BLANK_LABEL_SRC },
  5: { widthMm: 40, heightMm: 25 },
  10: { widthMm: 50, heightMm: 30 },
  30: { widthMm: 70, heightMm: 40 },
};

export const LABEL_BOTTLE_SIZES_ML = [3, 5, 10, 30];

export function labelSpecForVialMl(vialMl = 3) {
  const ml = Number(vialMl) || 3;
  if (LABEL_SPEC_BY_VIAL_ML[ml]) return LABEL_SPEC_BY_VIAL_ML[ml];
  // Nearest known bottle size
  if (ml >= 20) return LABEL_SPEC_BY_VIAL_ML[30];
  if (ml >= 8) return LABEL_SPEC_BY_VIAL_ML[10];
  if (ml >= 4) return LABEL_SPEC_BY_VIAL_ML[5];
  return LABEL_SPEC_BY_VIAL_ML[3];
}

/** Print pixels + on-screen preview size for a physical wrap label. */
export function physicalLabelCanvasSize(vialMl = 3, size = "md") {
  const spec = labelSpecForVialMl(vialMl);
  // 600 DPI keeps type + QR crisp for download and retina previews.
  const dpi = 600;
  const printW = Math.round((spec.widthMm / 25.4) * dpi);
  const printH = Math.round((spec.heightMm / 25.4) * dpi);
  // Larger on-screen preview so text stays readable in the 50/50 calc column.
  const pxPerMm = { sm: 14, md: 20, lg: 28 }[size] || 20;
  // ~2 mm corner radius — reads as a die-cut sticker, not a sharp card.
  const cornerR = Math.max(14, Math.round((2 / 25.4) * dpi));
  return {
    spec,
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
let blankLabelCache = null;
let blankLabelPromise = null;
let udMarkCache = null;
let udMarkPromise = null;

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
    const jpg = await loadImage("/undisclosed-label-blank.jpg");
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

/** Lyophilized cake — white for most kits, bright blue for KLOW. */
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

/** True for NAD / Glutathione — the only 10 mL bottles. */
export function isTenMlCompound(name = "", form = "") {
  const text = `${name || ""} ${form || ""}`;
  return (
    /\bglutathione\b/i.test(text) ||
    /\bgluta\b/i.test(text) ||
    /\bnad\+?\b/i.test(text)
  );
}

/** True for HGH lines — the only IU products. */
export function isHghCompound(name = "", form = "") {
  const text = `${name || ""} ${form || ""}`;
  return /\bhgh\b/i.test(text) || /\bgrowth hormone\b/i.test(text);
}

/** KLOW is the only blue lyophilized powder; everything else is white. */
export function isKlowCompound(name = "", form = "") {
  const text = `${name || ""} ${form || ""}`;
  return /\bklow\b/i.test(text);
}

/** Powder fill color for kit vials. */
export function resolvePowderColor({ name = "", form = "" } = {}) {
  return isKlowCompound(name, form) ? "blue" : "white";
}

/**
 * Vial volume: default 3 mL. Only NAD and Glutathione are 10 mL.
 * Ignores stale form text / vialMl on other compounds.
 */
export function resolveVialMl({ form = "", name = "", vialMl } = {}) {
  void vialMl;
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
 * Draw a photoreal unlabeled vial on black marble.
 * Async — waits for the studio vial image to load.
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
  } = options;

  // Catalog hero always uses the same 3 mL bottle plate for identical framing
  const vialMl = catalogTemplate
    ? 3
    : resolveVialMl({
        name,
        form: form || subtitle,
        vialMl: vialMlOpt,
      });
  const isTen = !catalogTemplate && vialMl >= 10;

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

  const dprCap = catalogTemplate || size === "sm" ? 1.5 : 2;
  const dpr =
    typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio || 1.5, dprCap)
      : 1.5;
  canvas.width = Math.round(dims.w * dpr);
  canvas.height = Math.round(dims.h * dpr);
  canvas.style.width = `${dims.w}px`;
  canvas.style.height = `${dims.h}px`;

  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, dims.w, dims.h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = catalogTemplate ? "medium" : "high";

  const photo = isTen
    ? await (catalogTemplate || size !== "lg"
        ? loadBrandVial10Card()
        : loadBrandVial10())
    : await (catalogTemplate || size !== "lg"
        ? loadBrandVialCard()
        : loadBrandVial());
  if (photo && photo.width) {
    drawPhotorealVial(ctx, dims, {
      photo,
      name,
      mass,
      unit,
      sku,
      bacWater,
      concentration,
      doseRange,
      qrPayload,
      coaUrl,
      isTen,
      reconstituted: catalogTemplate ? false : reconstituted,
      catalogTemplate,
      showLabel,
    });
  } else {
    // Fallback if photos fail to load
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
      reconstituted: catalogTemplate ? false : reconstituted,
      showLabel,
    };
    if (isTen) drawLabeledTenMl(ctx, dims, fallbackOpts);
    else drawLabeledThreeMl(ctx, dims, fallbackOpts);
  }

  // Skip expensive PNG encode unless the caller wants a downloadable URL
  if (options.exportPng) {
    return canvas.toDataURL("image/png");
  }
  return "";
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

/** Shared storefront label defaults (footer / QR). Mass & dosage come per product. */
export const CATALOG_VIAL_TEMPLATE = {
  mass: "80",
  unit: "mg",
  bacWater: "3.2 mL",
  concentration: "25 mg/mL",
  doseRange: "2.5 – 5 mg (10 – 20 u)",
  footerText: "Made in China",
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
  // Same bottle framing for every SKU (3 mL plate is the catalog hero)
  drawZoomedVialPhoto(ctx, photo, dims.w, dims.h, isTen ? 1.38 : 1.52);

  if (!showLabel) return;

  // Align to outer glass rims (studio plate is slightly left of center)
  const glassCx = dims.w * (isTen ? 0.496 : 0.489);
  const bodyW = dims.w * (isTen ? 0.64 : 0.655);
  const bodyX = glassCx - bodyW / 2;
  // Reference mid-band, lowered 5%, stretched down to cover half the peptide
  const vialTop = dims.h * (isTen ? 0.14 : 0.12);
  const vialBot = dims.h * (isTen ? 0.96 : 0.98);
  const baseH = (vialBot - vialTop) * 0.4;
  const gap = (vialBot - vialTop - baseH) / 2;
  const sleeveTop = vialTop + gap + dims.h * 0.05;
  const cakeTop = dims.h * (isTen ? 0.748 : 0.835);
  const cakeBottom = dims.h * (isTen ? 0.96 : 0.98);
  const sleeveBottom = cakeTop + (cakeBottom - cakeTop) * 0.5;
  const sleeveHClamped = sleeveBottom - sleeveTop;

  const wrapBmp = createWrapLabelBitmap({
    name,
    mass,
    unit,
    bacWater,
    concentration,
    doseRange,
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

/**
 * Front-of-vial clinical sticker — tall portrait so name / mass / QR stay sharp
 * on product cards (full wrap remains on the printable flat label).
 */
function createBottleFaceLabel(options = {}) {
  return createWrapLabelBitmap(options);
}

/** Build an offscreen flat wrap-label for the printable template / vial face. */
function createWrapLabelBitmap(options) {
  // 2:1 matches the 40×20 mm clinical wrap — avoids vertical stretch on vials.
  const dims = {
    w: 1000,
    h: 500,
    cornerR: Math.round(500 * 0.07),
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
  const { bodyX, bodyW, sleeveTop, sleeveH } = geom;
  const cx = bodyX + bodyW / 2;
  const R = bodyW / 2;
  const lw = labelCanvas.width;
  const lh = labelCanvas.height;
  const slices = 260;
  // Turn so the product panel sits squarely on the front of the glass
  // Bias past mid-panel center so name/mass read dead-center (spine left, QR wraps right)
  const visibleArc = Math.PI * 0.9;
  const yaw = (0.5 - 0.355) * visibleArc;
  const uStart = 0;
  const uEnd = 1;

  ctx.save();

  // Hairline contact into the glass (flush wrap, not a floating card)
  ctx.fillStyle = "rgba(0,0,0,0.14)";
  ctx.beginPath();
  ctx.ellipse(cx, sleeveTop + 0.5, R * 0.98, 2.2, 0, Math.PI, 0, true);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(cx, sleeveTop + sleeveH - 0.5, R * 0.98, 2.4, 0, 0, Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.rect(bodyX - 0.5, sleeveTop, bodyW + 1, sleeveH);
  ctx.clip();

  // Opaque paper kills glass speculars under the sleeve
  ctx.fillStyle = "#f2f3f5";
  ctx.fillRect(bodyX - 1, sleeveTop, bodyW + 2, sleeveH);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  for (let i = 0; i < slices; i += 1) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;
    const theta0 = (t0 - 0.5) * visibleArc + yaw;
    const theta1 = (t1 - 0.5) * visibleArc + yaw;
    const cos = (Math.cos(theta0) + Math.cos(theta1)) / 2;
    if (cos < 0.03) continue;

    const x0 = cx + R * Math.sin(theta0);
    const x1 = cx + R * Math.sin(theta1);
    const destX = Math.min(x0, x1);
    const destW = Math.max(0.85, Math.abs(x1 - x0) + 0.55);

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

    // Soft wrap shade — darker only as paper turns the rim
    const shadeAmt = Math.pow(1 - Math.max(0, cos), 1.35);
    if (shadeAmt > 0.015) {
      ctx.fillStyle = `rgba(8,10,14,${(shadeAmt * 0.48).toFixed(3)})`;
      ctx.fillRect(destX, sleeveTop, destW, sleeveH);
    }
  }
  ctx.globalAlpha = 1;

  // Gentle cylinder occlusion matching studio light
  const occ = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  occ.addColorStop(0, "rgba(0,0,0,0.28)");
  occ.addColorStop(0.12, "rgba(0,0,0,0.06)");
  occ.addColorStop(0.38, "rgba(0,0,0,0)");
  occ.addColorStop(0.62, "rgba(0,0,0,0)");
  occ.addColorStop(0.88, "rgba(0,0,0,0.05)");
  occ.addColorStop(1, "rgba(0,0,0,0.26)");
  ctx.fillStyle = occ;
  ctx.fillRect(bodyX, sleeveTop, bodyW, sleeveH);

  // Thin laminate catch-light (same side as glass highlight)
  const spec = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  spec.addColorStop(0, "rgba(255,255,255,0)");
  spec.addColorStop(0.14, "rgba(255,255,255,0)");
  spec.addColorStop(0.2, "rgba(255,255,255,0.12)");
  spec.addColorStop(0.26, "rgba(255,255,255,0)");
  spec.addColorStop(0.82, "rgba(255,255,255,0)");
  spec.addColorStop(0.9, "rgba(255,255,255,0.05)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spec;
  ctx.fillRect(bodyX, sleeveTop, bodyW, sleeveH);

  // Flush paper edges
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(bodyX + R * 0.1, sleeveTop + 0.35);
  ctx.lineTo(bodyX + bodyW - R * 0.1, sleeveTop + 0.35);
  ctx.stroke();
  ctx.strokeStyle = "rgba(0,0,0,0.18)";
  ctx.beginPath();
  ctx.moveTo(bodyX + R * 0.1, sleeveTop + sleeveH - 0.35);
  ctx.lineTo(bodyX + bodyW - R * 0.1, sleeveTop + sleeveH - 0.35);
  ctx.stroke();

  ctx.restore();
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

/** White hexagon with bold UD letters (Undisclosed print mark). */
function drawLabelSpineMark(ctx, cx, cy, r) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 30);
    const x = cx + r * Math.cos(a);
    const y = cy + r * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const inner = r * 0.82;
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 180) * (60 * i - 30);
    const x = cx + inner * Math.cos(a);
    const y = cy + inner * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = "#0a0a0a";
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${Math.max(11, r * 0.85)}px Outfit, "Arial Black", sans-serif`;
  ctx.fillText("UD", cx, cy + r * 0.04);
  ctx.restore();
}

/**
 * Draw a wrap label at the vial’s physical size with a clean die-cut round.
 * QR always encodes https://www.wellpept.com.
 */
export function drawBlankLabelFromImage(canvas, options = {}) {
  return drawPhysicalLabel(canvas, { ...options, blank: true });
}

export function drawPhysicalLabel(canvas, options = {}) {
  const { vialMl = 3, size = "md", blank = false } = options;
  const { printW, printH, cssW, cssH, cornerR, spec } = physicalLabelCanvasSize(
    vialMl,
    size
  );

  // Buffer matches print pixels exactly (600 DPI). Display fills the parent
  // column (50/50 calc layout) while keeping the print aspect ratio.
  canvas.width = printW;
  canvas.height = printH;
  canvas.style.width = "100%";
  canvas.style.height = "auto";
  canvas.style.maxWidth = cssW;
  canvas.dataset.labelMm = `${spec.widthMm}x${spec.heightMm}`;

  const ctx = canvas.getContext("2d", { alpha: true });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, printW, printH);
  // Vector fills / text — keep smoothing off so edges stay crisp when
  // the high-res canvas is downscaled to the CSS preview size.
  ctx.imageSmoothingEnabled = false;

  // Soft contact shadow under the sticker
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.07)";
  roundRect(ctx, 2, 4, printW - 3, printH - 3, cornerR);
  ctx.fill();
  ctx.restore();

  ctx.save();
  roundRect(ctx, 0, 0, printW, printH, cornerR);
  ctx.clip();

  paintLabelTemplate(
    ctx,
    { w: printW, h: printH, cornerR },
    {
      ...options,
      blank,
      forceSiteQr: true,
      qrPayload: SITE_QR_URL,
      coaUrl: "",
    }
  );

  ctx.restore();

  // Crisp die-cut outline
  ctx.save();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = Math.max(2, printH * 0.004);
  roundRect(ctx, 1, 1, printW - 2, printH - 2, cornerR);
  ctx.stroke();
  ctx.restore();

  return canvas.toDataURL("image/png");
}

export function drawLabelTemplate(canvas, options = {}) {
  const { size = "md", vialMl = 3 } = options;
  return drawPhysicalLabel(canvas, {
    ...options,
    vialMl,
    size,
    forceSiteQr: true,
    qrPayload: SITE_QR_URL,
    coaUrl: "",
  });
}

/** Paint a monochrome clinical wrap (single-color print friendly). */
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
    footerText = "Made in China",
    blank = false,
    forceSiteQr = false,
  } = options;

  const cornerR =
    dims.cornerR ?? Math.max(8, Math.round(Math.min(dims.w, dims.h) * 0.07));
  const spineW = Math.round(dims.w * 0.1);
  const rightW = Math.round(dims.w * 0.255);
  const midX = spineW;
  const midW = dims.w - spineW - rightW;
  const rightX = spineW + midW;
  const ink = "#000000";
  const muted = "#444444";
  const paper = "#ffffff";
  const hair = Math.max(1, dims.h * 0.0038);
  const footerH = Math.round(dims.h * 0.11);
  const bodyH = dims.h - footerH;
  const padX = midW * 0.06;
  const contentW = midW - padX * 2;
  const ruleX = midX + padX;
  const midCx = midX + midW / 2;

  const yHeader = bodyH * 0.075;
  const yAccent = bodyH * 0.125;
  const yName = bodyH * 0.255;
  const yRule2 = bodyH * 0.375;
  const yMass = bodyH * 0.5;
  const yRule3 = bodyH * 0.625;
  const gridTop = bodyH * 0.67;
  const gridBottom = bodyH * 0.955;
  const gridH = Math.max(18, gridBottom - gridTop);

  // White body — pure B/W for single-color label printers
  ctx.fillStyle = paper;
  roundRect(ctx, 0, 0, dims.w, dims.h, cornerR);
  ctx.fill();

  ctx.save();
  roundRect(ctx, 0, 0, dims.w, dims.h, cornerR);
  ctx.clip();

  // Black spine
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, spineW, dims.h);

  // Thin white rail (reads in mono without a second ink)
  const railW = Math.max(1.5, spineW * 0.07);
  ctx.fillStyle = paper;
  ctx.fillRect(spineW - railW, 0, railW, dims.h);

  ctx.save();
  ctx.translate(spineW * 0.48, bodyH * 0.4);
  ctx.rotate(Math.PI / 2);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const spineFont = Math.max(10, Math.min(bodyH * 0.062, spineW * 0.32));
  ctx.font = `700 ${spineFont}px Outfit, "Segoe UI", sans-serif`;
  const spineWord = "UNDISCLOSED";
  const track = spineFont * 0.18;
  let totalW = 0;
  for (const ch of spineWord) totalW += ctx.measureText(ch).width + track;
  totalW -= track;
  let sx = -totalW / 2;
  for (const ch of spineWord) {
    const cw = ctx.measureText(ch).width;
    ctx.fillText(ch, sx + cw / 2, 0);
    sx += cw + track;
  }
  ctx.restore();

  const markR = Math.min(spineW * 0.26, bodyH * 0.07);
  drawLabelSpineMark(ctx, spineW * 0.48, bodyH - markR * 1.35, markR);

  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = hair;
  ctx.beginPath();
  ctx.moveTo(rightX, bodyH * 0.06);
  ctx.lineTo(rightX, bodyH * 0.94);
  ctx.stroke();

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const brandHeaderPx = Math.max(7, bodyH * 0.038);
  ctx.font = `700 ${brandHeaderPx}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("UNDISCLOSED", midCx, yHeader);

  const accentW = Math.min(contentW * 0.28, dims.w * 0.12);
  ctx.fillStyle = ink;
  ctx.fillRect(midCx - accentW / 2, yAccent, accentW, Math.max(1.5, hair * 1.4));

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
      contentW * 0.96,
      Math.max(20, bodyH * 0.135),
      nameFamily
    );
    ctx.font = `800 ${nameSize}px ${nameFamily}`;
    ctx.fillStyle = ink;
    ctx.textAlign = "center";
    ctx.fillText(product, midCx, yName);
  }

  ctx.fillStyle = ink;
  ctx.fillRect(ruleX, yRule2, contentW, hair);
  ctx.fillRect(ruleX, yRule3, contentW, hair);

  const massNum =
    !blank && mass !== "" && mass != null ? String(mass).trim() : "";
  const massUnit = String(unit || "mg").toUpperCase();
  if (massNum) {
    const numSize = Math.max(22, bodyH * 0.125);
    const unitSize = Math.max(11, bodyH * 0.052);
    ctx.font = `800 ${numSize}px Outfit, "Segoe UI", sans-serif`;
    const numW = ctx.measureText(massNum).width;
    ctx.font = `600 ${unitSize}px Outfit, "Segoe UI", sans-serif`;
    const unitLabel = ` ${massUnit}`;
    const unitW = ctx.measureText(unitLabel).width;
    const startX = midCx - (numW + unitW) / 2;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = ink;
    ctx.font = `800 ${numSize}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(massNum, startX, yMass);
    ctx.font = `600 ${unitSize}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillStyle = muted;
    ctx.fillText(unitLabel, startX + numW, yMass + unitSize * 0.04);
  }

  const colW = contentW / 3;
  const gridLeft = ruleX;
  const cells = blank
    ? [
        { label: "BAC WATER", value: "" },
        { label: "CONCENTRATION", value: "" },
        { label: "DOSE RANGE", value: "" },
      ]
    : [
        { label: "BAC WATER", value: formatBacForLabel(bacWater) },
        { label: "CONCENTRATION", value: String(concentration || "—") },
        { label: "DOSE RANGE", value: String(doseRange || "—") },
      ];

  // Light gray panel (still one ink when dithered / B&W print)
  ctx.fillStyle = "rgba(0,0,0,0.05)";
  roundRect(
    ctx,
    ruleX - padX * 0.15,
    gridTop - gridH * 0.08,
    contentW + padX * 0.3,
    gridH + gridH * 0.12,
    Math.max(4, dims.h * 0.02)
  );
  ctx.fill();

  cells.forEach((cell, i) => {
    const cellCx = gridLeft + colW * (i + 0.5);
    if (i > 0) {
      ctx.strokeStyle = "rgba(0,0,0,0.2)";
      ctx.lineWidth = hair;
      ctx.beginPath();
      ctx.moveTo(gridLeft + colW * i, gridTop + gridH * 0.12);
      ctx.lineTo(gridLeft + colW * i, gridTop + gridH * 0.9);
      ctx.stroke();
    }
    ctx.fillStyle = muted;
    ctx.font = `700 ${Math.max(5.5, bodyH * 0.024)}px Outfit, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cell.label, cellCx, gridTop + gridH * 0.2);

    const rawVal = String(cell.value ?? "");
    if (!rawVal) return;
    const split = rawVal.match(/^(.*?)\s*(\([^)]+\))\s*$/);
    if (split) {
      const line1 = split[1].trim();
      const line2 = split[2].trim();
      const v1 = fitCenteredText(
        ctx,
        line1,
        colW * 0.88,
        Math.max(9, bodyH * 0.04),
        'Outfit, "Segoe UI", sans-serif'
      );
      ctx.font = `700 ${v1}px Outfit, "Segoe UI", sans-serif`;
      ctx.fillStyle = ink;
      ctx.fillText(line1, cellCx, gridTop + gridH * 0.52);
      const v2 = fitCenteredText(
        ctx,
        line2,
        colW * 0.88,
        Math.max(7, bodyH * 0.03),
        'Outfit, "Segoe UI", sans-serif'
      );
      ctx.font = `600 ${v2}px Outfit, "Segoe UI", sans-serif`;
      ctx.fillStyle = muted;
      ctx.fillText(line2, cellCx, gridTop + gridH * 0.76);
    } else {
      const valueSize = fitCenteredText(
        ctx,
        rawVal,
        colW * 0.88,
        Math.max(9, bodyH * 0.042),
        'Outfit, "Segoe UI", sans-serif'
      );
      ctx.font = `700 ${valueSize}px Outfit, "Segoe UI", sans-serif`;
      ctx.fillStyle = ink;
      ctx.fillText(rawVal, cellCx, gridTop + gridH * 0.62);
    }
  });

  const discPx = Math.max(5.5, bodyH * 0.026);
  const discGap = discPx * 2.55;
  const qrBox = Math.max(30, Math.min(rightW * 0.68, bodyH * 0.4));
  const qrX = rightX + (rightW - qrBox) / 2;
  let qrY = (bodyH - qrBox) / 2 - discGap * 0.32;
  qrY = Math.max(bodyH * 0.07, Math.min(qrY, bodyH - qrBox - discGap - bodyH * 0.04));
  const qrRadius = Math.max(5, qrBox * 0.09);

  ctx.fillStyle = "rgba(0,0,0,0.06)";
  roundRect(ctx, qrX + 1.5, qrY + 2, qrBox, qrBox, qrRadius);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, qrX, qrY, qrBox, qrBox, qrRadius);
  ctx.fill();
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1.25, hair);
  roundRect(ctx, qrX, qrY, qrBox, qrBox, qrRadius);
  ctx.stroke();

  const tick = Math.max(3, qrBox * 0.08);
  ctx.strokeStyle = ink;
  ctx.lineWidth = Math.max(1.5, hair * 1.2);
  ctx.beginPath();
  ctx.moveTo(qrX + tick, qrY);
  ctx.lineTo(qrX, qrY);
  ctx.lineTo(qrX, qrY + tick);
  ctx.moveTo(qrX + qrBox - tick, qrY);
  ctx.lineTo(qrX + qrBox, qrY);
  ctx.lineTo(qrX + qrBox, qrY + tick);
  ctx.moveTo(qrX + tick, qrY + qrBox);
  ctx.lineTo(qrX, qrY + qrBox);
  ctx.lineTo(qrX, qrY + qrBox - tick);
  ctx.moveTo(qrX + qrBox - tick, qrY + qrBox);
  ctx.lineTo(qrX + qrBox, qrY + qrBox);
  ctx.lineTo(qrX + qrBox, qrY + qrBox - tick);
  ctx.stroke();

  {
    const qrInset = qrBox * 0.12;
    const payload = forceSiteQr
      ? SITE_QR_URL
      : qrPayloadFromOptions({
          qrPayload: blank ? qrPayload || SITE_QR_URL : qrPayload,
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
  const discBase = qrY + qrBox + discPx * 1.2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = ink;
  ctx.font = `700 ${discPx}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("RESEARCH ONLY", discX, discBase);
  ctx.fillStyle = muted;
  ctx.font = `500 ${discPx * 0.88}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("Not for human consumption", discX, discBase + discPx * 1.2);

  // Solid black footer
  ctx.fillStyle = ink;
  ctx.fillRect(0, dims.h - footerH, dims.w, footerH);
  ctx.fillStyle = "#ffffff";
  ctx.font = `600 ${Math.max(9, footerH * 0.38)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(
    String(footerText || "Made in China").toUpperCase(),
    dims.w / 2,
    dims.h - footerH / 2
  );

  void sku;
  ctx.restore();
}

export function downloadVialPng(dataUrl, filename = "wellpept-vial.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
