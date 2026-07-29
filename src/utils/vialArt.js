import QRCode from "qrcode";

/** Wellpept / Undisclosed vial art — photoreal glass vial + compact clinical sticker. */

export const BRAND_IMAGE_SRC = "/wellpept-brand.png";
/** Photoreal unlabeled 3 mL research vial (studio photo). */
export const BRAND_VIAL_SRC = "/real-vial-3ml.png";
/** Photoreal unlabeled 10 mL research vial (studio photo). */
export const BRAND_VIAL_10_SRC = "/real-vial-10ml.png";
/** Circular WP seal / monogram. */
export const WP_MARK_SRC = "/wp-monogram.svg";
/** Vector WP monogram — P layered in front of W. */
export const WP_MONOGRAM_SRC = "/wp-monogram.svg";

let brandImageCache = null;
let brandImagePromise = null;
let brandVialCache = null;
let brandVialPromise = null;
let brandVial10Cache = null;
let brandVial10Promise = null;
let wpMarkCache = null;
let wpMarkPromise = null;

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

/** Prefetch the full brand plate for canvas compositing. */
export function loadBrandImage() {
  if (brandImageCache) return Promise.resolve(brandImageCache);
  if (brandImagePromise) return brandImagePromise;
  brandImagePromise = loadImage(BRAND_IMAGE_SRC).then((img) => {
    brandImageCache = img;
    return img;
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

/** Prefetch the circular WP mark (preferred seal asset). */
export function loadWpMark() {
  if (wpMarkCache) return Promise.resolve(wpMarkCache);
  if (wpMarkPromise) return wpMarkPromise;
  wpMarkPromise = loadImage(WP_MONOGRAM_SRC).then(async (img) => {
    if (img) {
      wpMarkCache = img;
      return img;
    }
    const png = await loadImage(WP_MARK_SRC);
    wpMarkCache = png;
    return png;
  });
  return wpMarkPromise;
}

/** @deprecated use loadWpMark */
export const loadUdMark = loadWpMark;

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
    accent: "#c9a227",
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
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.38, 4, w * 0.5, h * 0.5, w * 0.85);
  bg.addColorStop(0, "#2a2a2a");
  bg.addColorStop(0.45, "#141414");
  bg.addColorStop(1, "#050505");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  const rand = mulberry32(42);
  ctx.fillStyle = "rgba(255,255,255,0.02)";
  for (let i = 0; i < 220; i += 1) {
    ctx.fillRect(rand() * w, rand() * h, 1.2, 1.2);
  }
}

/**
 * Cobalt circular WP monogram — side-by-side letters, no overlap.
 * Used when the brand seal image is not yet loaded.
 */
function drawWpMonogramSeal(ctx, cx, cy, r) {
  const cobalt = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, 1, cx, cy, r);
  cobalt.addColorStop(0, "#3d7fd6");
  cobalt.addColorStop(0.4, "#0047ab");
  cobalt.addColorStop(0.78, "#002f75");
  cobalt.addColorStop(1, "#001a45");
  ellipse(ctx, cx, cy, r, r);
  ctx.fillStyle = cobalt;
  ctx.fill();

  ellipse(ctx, cx, cy, r * 0.92, r * 0.92);
  ctx.strokeStyle = "rgba(158, 182, 255, 0.4)";
  ctx.lineWidth = Math.max(1, r * 0.035);
  ctx.stroke();

  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${Math.max(14, r * 0.72)}px Outfit, "Arial Black", sans-serif`;
  ctx.fillText("WP", cx, cy + r * 0.04);
}

/** Draw the circular WP brand mark image, or fall back to the monogram. */
function drawWpSeal(ctx, cx, cy, r, markImage) {
  if (markImage && markImage.width) {
    ctx.save();
    ellipse(ctx, cx, cy, r, r);
    ctx.clip();
    ctx.drawImage(markImage, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();
    ellipse(ctx, cx, cy, r, r);
    ctx.strokeStyle = "rgba(212, 175, 55, 0.55)";
    ctx.lineWidth = Math.max(1, r * 0.04);
    ctx.stroke();
    return;
  }
  drawWpMonogramSeal(ctx, cx, cy, r);
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

function qrPayloadFromOptions(options) {
  if (options.coaUrl) return String(options.coaUrl);
  if (options.qrPayload) return String(options.qrPayload);
  return "";
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
 * 3 mL vial matching the Wellpept brand image:
 * brushed gold cap · clear glass · lyophilized cake · matte black V-sleeve · gold WP seal.
 */
function drawBrandThreeMl(ctx, dims, options) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    sku = "",
    reconstituted = false,
    wpMark = null,
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

  // —— Brushed gold flat cap (brand) ——
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
  ctx.strokeStyle = "rgba(80, 55, 10, 0.2)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i += 1) {
    const x = cx - capW * 0.35 + (capW * 0.7 * i) / 7;
    ctx.beginPath();
    ctx.moveTo(x, capY + capH * 0.32);
    ctx.lineTo(x, capY + capH * 0.95);
    ctx.stroke();
  }
  ellipse(ctx, cx, capY + capH * 0.3, capW / 2, capH * 0.2);
  const goldTop = ctx.createRadialGradient(
    cx - capW * 0.15,
    capY + capH * 0.18,
    1,
    cx,
    capY + capH * 0.3,
    capW * 0.55
  );
  goldTop.addColorStop(0, "#ffffff");
  goldTop.addColorStop(0.45, "#c8d0d8");
  goldTop.addColorStop(1, "#5a616a");
  ctx.fillStyle = goldTop;
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

  // Gold WP seal — P in front of W, from brand mark image
  const sealR = bodyW * 0.28;
  const sealCy = sleeveTop + sleeveH * 0.32;
  drawWpSeal(ctx, cx, sealCy, sealR, wpMark || wpMarkCache);

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
    ctx.fillStyle = "#c8d0d8";
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

/** 10 mL — same brand language, taller bottle. */
function drawBrandTenMl(ctx, dims, options) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    sku = "",
    reconstituted = false,
    wpMark = null,
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
  drawWpSeal(ctx, cx, sealCy, sealR, wpMark || wpMarkCache);

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
    ctx.fillStyle = "#c8d0d8";
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
 * Draw a photoreal vial photo with a compact clinical sticker on the glass.
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
  } = options;

  const vialMl = resolveVialMl({
    name,
    form: form || subtitle,
    vialMl: vialMlOpt,
  });
  const isTen = vialMl >= 10;

  const dims = {
    sm: { w: 160, h: 240 },
    md: { w: 280, h: 420 },
    lg: { w: 360, h: 540 },
  }[size] || { w: 280, h: 420 };

  const dpr =
    typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 2, 3) : 2;
  canvas.width = dims.w * dpr;
  canvas.height = dims.h * dpr;
  canvas.style.width = `${dims.w}px`;
  canvas.style.height = `${dims.h}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, dims.w, dims.h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const photo = isTen ? await loadBrandVial10() : await loadBrandVial();
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
      reconstituted,
    });
  } else {
    // Fallback if photos fail to load
    if (isTen)
      drawLabeledTenMl(ctx, dims, {
        name,
        mass,
        unit,
        sku,
        reconstituted,
        bacWater,
        concentration,
        doseRange,
        qrPayload,
        coaUrl,
      });
    else
      drawLabeledThreeMl(ctx, dims, {
        name,
        mass,
        unit,
        sku,
        reconstituted,
        bacWater,
        concentration,
        doseRange,
        qrPayload,
        coaUrl,
      });
  }

  return canvas.toDataURL("image/png");
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

/**
 * Photoreal vial + front clinical sticker (readable at card size).
 * Full wrap art stays on the flat printable label template.
 */
function drawPhotorealVial(ctx, dims, options) {
  const {
    photo,
    name = "Peptide",
    mass = "",
    unit = "mg",
    sku = "",
    bacWater = "",
    concentration = "",
    doseRange = "",
    qrPayload = "",
    coaUrl = "",
    isTen = false,
    reconstituted = false,
  } = options;

  drawCoverImage(ctx, photo, dims.w, dims.h);

  // Geometry matched to studio vial photos (3 mL / 10 mL)
  const bodyW = dims.w * (isTen ? 0.3 : 0.28);
  const bodyX = dims.w / 2 - bodyW / 2;
  const glassBottom = dims.h * (isTen ? 0.78 : 0.76);
  const sleeveTop = dims.h * (isTen ? 0.34 : 0.33);
  const sleeveH = dims.h * (isTen ? 0.28 : 0.26);
  const powderColor = resolvePowderColor({ name });

  // Tint / replace cake on the raw photo before vignette / sticker
  if (!reconstituted && powderColor === "blue") {
    // Cover the full photo plug so no white cake peeks around KLOW blue
    const cakeTop = dims.h * (isTen ? 0.58 : 0.56);
    const cakeH = Math.max(14, glassBottom - cakeTop - dims.h * 0.008);
    drawPowderCake(
      ctx,
      bodyX + bodyW * 0.1,
      cakeTop,
      bodyW * 0.8,
      cakeH,
      bodyW * 0.2,
      "blue"
    );
  }

  const vignette = ctx.createRadialGradient(
    dims.w * 0.5,
    dims.h * 0.42,
    dims.w * 0.15,
    dims.w * 0.5,
    dims.h * 0.5,
    dims.w * 0.78
  );
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,0.22)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, dims.w, dims.h);

  const faceBmp = createBottleFaceLabel({
    name,
    mass,
    unit,
    bacWater,
    concentration,
    doseRange,
    sku,
    qrPayload,
    coaUrl,
  });
  drawFrontFaceLabel(ctx, faceBmp, {
    bodyX,
    bodyW,
    sleeveTop,
    sleeveH,
    radius: Math.max(3, bodyW * 0.05),
  });

  // Soft glass edge light over sticker
  const gloss = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  gloss.addColorStop(0, "rgba(255,255,255,0)");
  gloss.addColorStop(0.12, "rgba(255,255,255,0.16)");
  gloss.addColorStop(0.28, "rgba(255,255,255,0)");
  gloss.addColorStop(0.74, "rgba(255,255,255,0)");
  gloss.addColorStop(0.9, "rgba(255,255,255,0.1)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(bodyX, sleeveTop, bodyW, sleeveH);
}

/**
 * Front-of-vial clinical sticker — tall portrait so name / mass / QR stay sharp
 * on product cards (full wrap remains on the printable flat label).
 */
function createBottleFaceLabel(options = {}) {
  const dims = { w: 420, h: 560 };
  const c =
    typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (!c) return null;
  c.width = dims.w;
  c.height = dims.h;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  paintBottleFaceLabel(ctx, dims, options);
  return c;
}

/** Build an offscreen flat wrap-label for the printable template. */
function createWrapLabelBitmap(options) {
  const dims = { w: 920, h: 360 };
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

/** Portrait sticker artwork for the glass front. */
function paintBottleFaceLabel(ctx, dims, options = {}) {
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
    footerText = "PEPTIDE POWER | 20%",
  } = options;

  const ink = "#0a0a0a";
  const muted = "#3a3a3a";
  const spineW = Math.round(dims.w * 0.14);
  const footerH = Math.round(dims.h * 0.11);
  const pad = dims.w * 0.05;
  const contentX = spineW + pad;
  const contentW = dims.w - spineW - pad * 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dims.w, dims.h);

  // Black spine + UD mark
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, spineW, dims.h);
  ctx.save();
  ctx.translate(spineW * 0.52, dims.h * 0.42);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const spineFont = Math.max(14, Math.min(dims.h * 0.055, spineW * 0.42));
  ctx.font = `800 ${spineFont}px Outfit, "Segoe UI", sans-serif`;
  const spineWord = "UNDISCLOSED";
  const track = spineFont * 0.12;
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
  drawLabelSpineMark(
    ctx,
    spineW * 0.5,
    dims.h - footerH - spineW * 0.55,
    Math.min(spineW * 0.34, dims.h * 0.05)
  );

  const midCx = contentX + contentW / 2;
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `700 ${Math.max(10, dims.h * 0.032)}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("— UNDISCLOSED —", midCx, dims.h * 0.07);

  const rule = (y) => {
    ctx.fillStyle = ink;
    ctx.fillRect(contentX, y, contentW, Math.max(1.5, dims.h * 0.004));
  };
  rule(dims.h * 0.11);

  const product = String(name || "PEPTIDE")
    .replace(/\(.*?\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  const nameFamily = '"Bebas Neue", "Arial Black", Impact, sans-serif';
  const nameSize = fitCenteredText(
    ctx,
    product,
    contentW,
    Math.max(34, dims.h * 0.13),
    nameFamily
  );
  ctx.font = `400 ${nameSize}px ${nameFamily}`;
  ctx.fillStyle = ink;
  ctx.fillText(product, midCx, dims.h * 0.2);
  rule(dims.h * 0.275);

  const massNum = mass !== "" && mass != null ? String(mass).trim() : "";
  const massUnit = String(unit || "mg").toUpperCase();
  if (massNum) {
    const numSize = Math.max(28, dims.h * 0.1);
    const unitSize = Math.max(14, dims.h * 0.045);
    ctx.font = `800 ${numSize}px Outfit, "Segoe UI", sans-serif`;
    const numW = ctx.measureText(massNum).width;
    ctx.font = `800 ${unitSize}px Outfit, "Segoe UI", sans-serif`;
    const unitW = ctx.measureText(` ${massUnit}`).width;
    const startX = midCx - (numW + unitW) / 2;
    ctx.textAlign = "left";
    ctx.font = `800 ${numSize}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillStyle = ink;
    ctx.fillText(massNum, startX, dims.h * 0.35);
    ctx.font = `800 ${unitSize}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(` ${massUnit}`, startX + numW, dims.h * 0.35 + unitSize * 0.08);
  }
  rule(dims.h * 0.42);

  // Compact BAC / conc / dose stack (readable on narrow glass)
  const rows = [
    ["BAC", formatBacForLabel(bacWater)],
    ["CONC", String(concentration || "—")],
    ["DOSE", String(doseRange || "—")],
  ];
  rows.forEach((row, i) => {
    const y = dims.h * 0.48 + i * dims.h * 0.07;
    ctx.fillStyle = muted;
    ctx.textAlign = "left";
    ctx.font = `700 ${Math.max(9, dims.h * 0.024)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(row[0], contentX, y);
    ctx.fillStyle = ink;
    ctx.textAlign = "right";
    const valSize = fitCenteredText(
      ctx,
      row[1],
      contentW * 0.62,
      Math.max(11, dims.h * 0.032),
      'Outfit, "Segoe UI", sans-serif'
    );
    ctx.font = `800 ${valSize}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(row[1], contentX + contentW, y);
  });

  // QR
  const payload = qrPayloadFromOptions({ qrPayload, coaUrl });
  const qrBox = Math.min(contentW * 0.55, dims.h * 0.16);
  const qrX = midCx - qrBox / 2;
  const qrY = dims.h * 0.7;
  ctx.strokeStyle = "rgba(10,10,10,0.5)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, qrX, qrY, qrBox, qrBox, 4);
  ctx.stroke();
  const inset = qrBox * 0.08;
  drawQrCode(
    ctx,
    qrX + inset,
    qrY + inset,
    qrBox - inset * 2,
    qrSeedFromOptions({
      name,
      mass,
      unit,
      bacWater,
      concentration,
      doseRange,
      sku,
    }),
    false,
    payload
  );
  if (payload) {
    ctx.fillStyle = muted;
    ctx.textAlign = "center";
    ctx.font = `700 ${Math.max(8, dims.h * 0.02)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText("SCAN FOR COA", midCx, qrY + qrBox + dims.h * 0.025);
  }

  ctx.fillStyle = ink;
  ctx.fillRect(0, dims.h - footerH, dims.w, footerH);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `800 ${Math.max(11, dims.h * 0.034)}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText(String(footerText || "PEPTIDE POWER | 20%"), dims.w / 2, dims.h - footerH / 2);
}

/**
 * Draw the portrait face sticker onto the vial glass with light edge shade.
 */
function drawFrontFaceLabel(ctx, labelCanvas, geom) {
  if (!labelCanvas || !labelCanvas.width) return;
  const { bodyX, bodyW, sleeveTop, sleeveH, radius = 4 } = geom;
  const insetX = bodyW * 0.04;
  const destX = bodyX + insetX;
  const destW = bodyW - insetX * 2;

  ctx.save();
  roundRect(ctx, bodyX, sleeveTop, bodyW, sleeveH, radius);
  ctx.clip();

  // Slight paper lift behind sticker
  ctx.fillStyle = "rgba(0,0,0,0.18)";
  roundRect(ctx, destX + 1, sleeveTop + 2, destW, sleeveH - 2, Math.max(2, radius * 0.6));
  ctx.fill();

  ctx.drawImage(labelCanvas, destX, sleeveTop, destW, sleeveH);

  const shade = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  shade.addColorStop(0, "rgba(0,0,0,0.28)");
  shade.addColorStop(0.16, "rgba(0,0,0,0.05)");
  shade.addColorStop(0.5, "rgba(0,0,0,0)");
  shade.addColorStop(0.84, "rgba(0,0,0,0.05)");
  shade.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = shade;
  ctx.fillRect(bodyX, sleeveTop, bodyW, sleeveH);
  ctx.restore();
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

  // Clinical front label on mid body
  const sleeveTop = bodyY + bodyH * 0.34;
  const sleeveH = bodyBottom - sleeveTop - radius * 0.15;
  const labelBmp = createWrapLabelBitmap({
    name,
    mass,
    unit,
    bacWater,
    concentration,
    doseRange,
    sku,
    qrPayload,
    coaUrl,
  });
  drawCylindricalLabelWrap(ctx, labelBmp, {
    cx,
    bodyX,
    bodyW,
    sleeveTop,
    sleeveH,
    radius: radius * 0.6,
  });

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

  const sleeveTop = bodyY + bodyH * 0.28;
  const sleeveH = bodyBottom - sleeveTop - 4;
  const labelBmp = createWrapLabelBitmap({
    name,
    mass,
    unit,
    bacWater,
    concentration,
    doseRange,
    sku,
    qrPayload,
    coaUrl,
  });
  drawCylindricalLabelWrap(ctx, labelBmp, {
    cx,
    bodyX,
    bodyW,
    sleeveTop,
    sleeveH,
    radius: radius * 0.5,
  });

  drawBrandWordmark(ctx, cx, bodyBottom + dims.h * 0.05, dims.w * 0.72);
}

/** Cover-fit helper kept for any legacy photo paths (unused by default). */
function drawPhotoVial(ctx, dims, options) {
  const {
    photo,
    name = "Peptide",
    mass = "",
    unit = "mg",
    sku = "",
    bacWater = "",
    concentration = "",
    doseRange = "",
    qrPayload = "",
    vialMl = 3,
    isTen = false,
  } = options;

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

  // Prefer clinical wrap over photo sleeve text overlay
  const bodyW = dims.w * (isTen ? 0.36 : 0.3);
  const bodyX = dims.w / 2 - bodyW / 2;
  const sleeveTop = dims.h * 0.48;
  const sleeveH = dims.h * 0.28;
  const labelBmp = createWrapLabelBitmap({
    name,
    mass,
    unit,
    bacWater,
    concentration,
    doseRange,
    sku,
    qrPayload,
  });
  drawCylindricalLabelWrap(ctx, labelBmp, {
    cx: dims.w / 2,
    bodyX,
    bodyW,
    sleeveTop,
    sleeveH,
    radius: 6,
  });
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

/** White hexagon with bold WP letters (same treatment as the UD print mark). */
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
 * Flat printable Undisclosed wrap label — black spine + white data panel + QR.
 * Matching the clinical wrap-label mockup the customer receives.
 */
export function drawLabelTemplate(canvas, options = {}) {
  const { size = "md" } = options;

  const dims = {
    sm: { w: 520, h: 190 },
    md: { w: 760, h: 280 },
    lg: { w: 980, h: 360 },
  }[size] || { w: 760, h: 280 };

  const dpr =
    typeof window !== "undefined"
      ? Math.min(window.devicePixelRatio || 2, 3)
      : 2;
  canvas.width = dims.w * dpr;
  canvas.height = dims.h * dpr;
  canvas.style.width = `${dims.w}px`;
  canvas.style.height = `${dims.h}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, dims.w, dims.h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  paintLabelTemplate(ctx, dims, options);
  return canvas.toDataURL("image/png");
}

/** Paint the wrap-label artwork into an existing context at logical dims.
 *  Matches the Undisclosed clinical wrap (KLOW reference): spine · name ·
 *  mass between rules · BAC/conc/dose grid · COA QR · PEPTIDE POWER footer.
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
    footerText = "PEPTIDE POWER | 20%",
  } = options;

  const spineW = Math.round(dims.w * 0.1);
  const rightW = Math.round(dims.w * 0.26);
  const midX = spineW;
  const midW = dims.w - spineW - rightW;
  const rightX = spineW + midW;
  const ink = "#0a0a0a";
  const muted = "#444444";
  const hair = Math.max(1.25, dims.h * 0.005);
  const footerH = Math.round(dims.h * 0.11);

  // Sharp clinical card (reference is hard-edged white wrap)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, dims.w, dims.h);
  ctx.strokeStyle = "rgba(0,0,0,0.2)";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, dims.w - 1, dims.h - 1);

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, dims.w, dims.h);
  ctx.clip();

  // Left black spine
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, spineW, dims.h);

  ctx.save();
  ctx.translate(spineW * 0.52, dims.h * 0.4);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const spineFont = Math.max(11, Math.min(dims.h * 0.075, spineW * 0.38));
  ctx.font = `800 ${spineFont}px Outfit, "Segoe UI", sans-serif`;
  const spineWord = "UNDISCLOSED";
  const track = spineFont * 0.14;
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

  const markR = Math.min(spineW * 0.32, dims.h * 0.085);
  drawLabelSpineMark(
    ctx,
    spineW * 0.5,
    dims.h - footerH - markR * 1.25,
    markR
  );

  // Right column divider
  ctx.strokeStyle = ink;
  ctx.lineWidth = hair;
  ctx.beginPath();
  ctx.moveTo(rightX, dims.h * 0.05);
  ctx.lineTo(rightX, dims.h - footerH - dims.h * 0.02);
  ctx.stroke();

  const midCx = midX + midW / 2;
  const midPad = midW * 0.055;
  const contentW = midW - midPad * 2;
  const ruleW = contentW;
  const ruleX = midX + midPad;

  // Top brand header
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const brandHeaderPx = Math.max(8, dims.h * 0.038);
  ctx.font = `700 ${brandHeaderPx}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("— UNDISCLOSED —", midCx, dims.h * 0.075);

  // Rule under header
  const rule1Y = dims.h * 0.12;
  ctx.fillStyle = ink;
  ctx.fillRect(ruleX, rule1Y, ruleW, hair);

  // Product name — large block (KLOW)
  const product = String(name || "PEPTIDE")
    .replace(/\(.*?\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  const nameFamily = '"Bebas Neue", "Arial Black", Impact, sans-serif';
  const nameSize = fitCenteredText(
    ctx,
    product,
    contentW * 0.98,
    Math.max(36, dims.h * 0.22),
    nameFamily
  );
  ctx.font = `400 ${nameSize}px ${nameFamily}`;
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.fillText(product, midCx, dims.h * 0.245);

  // Rule under name
  const rule2Y = dims.h * 0.35;
  ctx.fillRect(ruleX, rule2Y, ruleW, hair);

  // Mass — large number + smaller unit (80 MG)
  const massNum =
    mass !== "" && mass != null ? String(mass).trim() : "";
  const massUnit = String(unit || "mg").toUpperCase();
  const massBandMid = (rule2Y + dims.h * 0.52) / 2;
  if (massNum) {
    const numSize = Math.max(28, dims.h * 0.145);
    const unitSize = Math.max(14, dims.h * 0.07);
    ctx.font = `800 ${numSize}px Outfit, "Segoe UI", sans-serif`;
    const numW = ctx.measureText(massNum).width;
    ctx.font = `800 ${unitSize}px Outfit, "Segoe UI", sans-serif`;
    const unitW = ctx.measureText(` ${massUnit}`).width;
    const startX = midCx - (numW + unitW) / 2;
    ctx.fillStyle = ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = `800 ${numSize}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(massNum, startX, massBandMid);
    ctx.font = `800 ${unitSize}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(` ${massUnit}`, startX + numW, massBandMid + unitSize * 0.08);
  }

  // Rule under mass
  const rule3Y = dims.h * 0.52;
  ctx.fillStyle = ink;
  ctx.fillRect(ruleX, rule3Y, ruleW, hair);

  // Three-column BAC / CONCENTRATION / DOSE RANGE (centered like reference)
  const gridTop = rule3Y + dims.h * 0.03;
  const gridBottom = dims.h - footerH - dims.h * 0.02;
  const gridH = Math.max(28, gridBottom - gridTop);
  const colW = contentW / 3;
  const gridLeft = ruleX;
  const cells = [
    { label: "BAC WATER", value: formatBacForLabel(bacWater) },
    { label: "CONCENTRATION", value: String(concentration || "—") },
    { label: "DOSE RANGE", value: String(doseRange || "—") },
  ];

  cells.forEach((cell, i) => {
    const cellCx = gridLeft + colW * (i + 0.5);
    if (i > 0) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = hair;
      ctx.beginPath();
      ctx.moveTo(gridLeft + colW * i, gridTop + gridH * 0.15);
      ctx.lineTo(gridLeft + colW * i, gridTop + gridH * 0.9);
      ctx.stroke();
    }
    ctx.fillStyle = muted;
    ctx.font = `700 ${Math.max(7, dims.h * 0.028)}px Outfit, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(cell.label, cellCx, gridTop + gridH * 0.28);

    const valueSize = fitCenteredText(
      ctx,
      cell.value,
      colW * 0.92,
      Math.max(11, dims.h * 0.048),
      'Outfit, "Segoe UI", sans-serif'
    );
    ctx.font = `800 ${valueSize}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillStyle = ink;
    ctx.fillText(cell.value, cellCx, gridTop + gridH * 0.68);
  });

  // QR — links to COA when available
  const qrPad = Math.max(10, rightW * 0.12);
  const qrBox = Math.min(rightW - qrPad * 2, dims.h * 0.48);
  const qrX = rightX + (rightW - qrBox) / 2;
  const qrY = dims.h * 0.08;

  ctx.strokeStyle = "rgba(10,10,10,0.55)";
  ctx.lineWidth = Math.max(1.25, hair);
  roundRect(ctx, qrX, qrY, qrBox, qrBox, Math.max(4, qrBox * 0.04));
  ctx.stroke();

  const qrInset = qrBox * 0.08;
  const payload = qrPayloadFromOptions({ qrPayload, coaUrl });
  drawQrCode(
    ctx,
    qrX + qrInset,
    qrY + qrInset,
    qrBox - qrInset * 2,
    qrSeedFromOptions({
      name,
      mass,
      unit,
      bacWater,
      concentration,
      doseRange,
      sku,
    }),
    false,
    payload
  );

  // Small COA caption under QR when linked
  if (payload) {
    ctx.fillStyle = muted;
    ctx.font = `700 ${Math.max(6, dims.h * 0.022)}px Outfit, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SCAN FOR COA", rightX + rightW / 2, qrY + qrBox + dims.h * 0.035);
  }

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const discPx = Math.max(6.5, dims.h * 0.026);
  ctx.font = `700 ${discPx}px Outfit, "Segoe UI", sans-serif`;
  const discX = rightX + rightW / 2;
  const discBase = dims.h - footerH - discPx * 2.6;
  ctx.fillText("RESEARCH ONLY.", discX, discBase);
  ctx.fillText("NOT FOR HUMAN CONSUMPTION.", discX, discBase + discPx * 1.35);

  // Bottom banner — reference: PEPTIDE POWER | 20%
  ctx.fillStyle = ink;
  ctx.fillRect(0, dims.h - footerH, dims.w, footerH);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.max(10, footerH * 0.42)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(footerText || "PEPTIDE POWER | 20%"), dims.w / 2, dims.h - footerH / 2);

  ctx.restore();
}

export function downloadVialPng(dataUrl, filename = "wellpept-vial.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
