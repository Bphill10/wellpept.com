import QRCode from "qrcode";

/** Wellpept brand vial art — gold cap, black V-sleeve, WP monogram seal (P in front of W). */

export const BRAND_IMAGE_SRC = "/wellpept-brand.png";
/** Real studio vial photo cropped from the brand plate. */
export const BRAND_VIAL_SRC = "/wellpept-vial.png";
/** Circular WP seal / monogram. */
export const WP_MARK_SRC = "/wp-monogram.svg";
/** Vector WP monogram — P layered in front of W. */
export const WP_MONOGRAM_SRC = "/wp-monogram.svg";

let brandImageCache = null;
let brandImagePromise = null;
let brandVialCache = null;
let brandVialPromise = null;
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

/** Prefetch the real studio vial photo. */
export function loadBrandVial() {
  if (brandVialCache) return Promise.resolve(brandVialCache);
  if (brandVialPromise) return brandVialPromise;
  brandVialPromise = loadImage(BRAND_VIAL_SRC).then(async (img) => {
    if (img) {
      brandVialCache = img;
      return img;
    }
    // Fall back to full brand plate
    const plate = await loadBrandImage();
    brandVialCache = plate;
    return plate;
  });
  return brandVialPromise;
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

/** Parse vial volume from vendor form text. Default 3 mL; 10 mL when listed. */
export function resolveVialMl({ form = "", vialMl } = {}) {
  if (vialMl != null && Number(vialMl) > 0) return Number(vialMl);
  const text = String(form || "");
  if (/\b10\s*ml\b/i.test(text) || /\b10ml\b/i.test(text)) return 10;
  if (/\blarge bottle\b/i.test(text)) return 10;
  return 3;
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
 * Gold circular WP monogram — letter W behind, letter P in front (centered).
 * Used when the brand seal image is not yet loaded.
 */
function drawWpMonogramSeal(ctx, cx, cy, r) {
  const gold = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.3, 1, cx, cy, r);
  gold.addColorStop(0, "#f0d78c");
  gold.addColorStop(0.35, "#d4af37");
  gold.addColorStop(0.7, "#a67c1a");
  gold.addColorStop(1, "#6b4e0e");
  ellipse(ctx, cx, cy, r, r);
  ctx.fillStyle = gold;
  ctx.fill();

  ellipse(ctx, cx, cy, r * 0.92, r * 0.92);
  ctx.strokeStyle = "rgba(40, 28, 6, 0.45)";
  ctx.lineWidth = Math.max(1, r * 0.04);
  ctx.stroke();

  ellipse(ctx, cx, cy, r * 0.78, r * 0.78);
  ctx.strokeStyle = "rgba(255, 230, 160, 0.35)";
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.stroke();

  // W (behind), centered
  ctx.strokeStyle = "#0a0a0a";
  ctx.lineWidth = Math.max(2, r * 0.18);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.52, cy - r * 0.42);
  ctx.lineTo(cx - r * 0.28, cy + r * 0.48);
  ctx.lineTo(cx, cy - r * 0.12);
  ctx.lineTo(cx + r * 0.28, cy + r * 0.48);
  ctx.lineTo(cx + r * 0.52, cy - r * 0.42);
  ctx.stroke();

  // P (in front of W), centered on the seal
  const pLeft = cx - r * 0.28;
  const pTop = cy - r * 0.48;
  const pBottom = cy + r * 0.48;
  const pSpine = cx - r * 0.06;
  const bowlBottom = cy + r * 0.08;
  const pRight = cx + r * 0.36;
  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.moveTo(pLeft, pTop);
  ctx.lineTo(pSpine, pTop);
  ctx.bezierCurveTo(pRight, pTop, pRight, bowlBottom, pSpine, bowlBottom);
  ctx.lineTo(pLeft + r * 0.18, bowlBottom);
  ctx.lineTo(pLeft + r * 0.18, pBottom);
  ctx.lineTo(pLeft, pBottom);
  ctx.closePath();
  ctx.fill();

  // P counter
  const cLeft = cx - r * 0.08;
  const cTop = cy - r * 0.3;
  const cBottom = cy - r * 0.02;
  const cSpine = cx - r * 0.02;
  const cRight = cx + r * 0.2;
  ctx.beginPath();
  ctx.moveTo(cLeft, cTop);
  ctx.lineTo(cSpine, cTop);
  ctx.bezierCurveTo(cRight, cTop, cRight, cBottom, cSpine, cBottom);
  ctx.lineTo(cLeft, cBottom);
  ctx.closePath();
  ctx.fillStyle = gold;
  ctx.fill();
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
  if (options.qrPayload) return String(options.qrPayload);
  return "";
}

function drawBrandWordmark(ctx, cx, y, maxW) {
  ctx.fillStyle = "#f5f5f5";
  ctx.font = `600 ${Math.max(11, maxW * 0.11)}px "Cormorant Garamond", "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("WELLPEPT", cx, y);

  const lineW = maxW * 0.42;
  const grad = ctx.createLinearGradient(cx - lineW, 0, cx + lineW, 0);
  grad.addColorStop(0, "rgba(201,162,39,0)");
  grad.addColorStop(0.5, "#d4af37");
  grad.addColorStop(1, "rgba(201,162,39,0)");
  ctx.strokeStyle = grad;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(cx - lineW, y + maxW * 0.055);
  ctx.lineTo(cx + lineW, y + maxW * 0.055);
  ctx.stroke();
  ellipse(ctx, cx, y + maxW * 0.055, 3.2, 3.2);
  ctx.strokeStyle = "#d4af37";
  ctx.lineWidth = 1;
  ctx.stroke();
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
  const goldSide = ctx.createLinearGradient(cx - capW / 2, 0, cx + capW / 2, 0);
  goldSide.addColorStop(0, "#6b4e0e");
  goldSide.addColorStop(0.25, "#d4af37");
  goldSide.addColorStop(0.5, "#f0d78c");
  goldSide.addColorStop(0.75, "#b8922a");
  goldSide.addColorStop(1, "#5a4010");
  ctx.fillStyle = goldSide;
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
  goldTop.addColorStop(0, "#f5e6b8");
  goldTop.addColorStop(0.45, "#d4af37");
  goldTop.addColorStop(1, "#7a5a12");
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
    const cake = ctx.createLinearGradient(bodyX, cakeY, bodyX + bodyW, cakeY + cakeH);
    cake.addColorStop(0, "#e8eaee");
    cake.addColorStop(0.4, "#ffffff");
    cake.addColorStop(1, "#cfd3d9");
    ctx.fillStyle = cake;
    roundRect(ctx, bodyX + inset + 1, cakeY, bodyW - inset * 2 - 2, cakeH, 3);
    ctx.fill();
    const rand = mulberry32(hashString(name) || 1);
    ctx.fillStyle = "rgba(160, 165, 175, 0.45)";
    for (let i = 0; i < 20; i += 1) {
      ctx.beginPath();
      ctx.arc(
        bodyX + inset + 4 + rand() * (bodyW - inset * 2 - 8),
        cakeY + 3 + rand() * (cakeH - 6),
        0.5 + rand() * 1.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
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
    ctx.fillStyle = "#d4af37";
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

  if (sku) {
    ctx.fillStyle = "rgba(200,200,200,0.45)";
    ctx.font = `500 ${Math.max(8, dims.w * 0.025)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(sku, cx, bodyBottom + dims.h * 0.095);
  }
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
  const goldSide = ctx.createLinearGradient(cx - capW / 2, 0, cx + capW / 2, 0);
  goldSide.addColorStop(0, "#6b4e0e");
  goldSide.addColorStop(0.5, "#f0d78c");
  goldSide.addColorStop(1, "#5a4010");
  ctx.fillStyle = goldSide;
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
    ctx.fillStyle = "#f0f2f5";
    roundRect(ctx, bodyX + inset + 1, cakeY, bodyW - inset * 2 - 2, cakeH, 3);
    ctx.fill();
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
    ctx.fillStyle = "#d4af37";
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
  if (sku) {
    ctx.fillStyle = "rgba(200,200,200,0.4)";
    ctx.font = `500 ${Math.max(8, dims.w * 0.024)}px Outfit, sans-serif`;
    ctx.fillText(sku, cx, bodyBottom + dims.h * 0.09);
  }
}

/**
 * Draw the real brand vial photo, then overlay product / calc label data.
 * Falls back to procedural 3 mL / 10 mL drawing if the photo is unavailable.
 */
export function drawGeneratedVial(canvas, options = {}) {
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
    wpMark = null,
    brandImage = null,
    brandVial = null,
    bacWater = "",
    concentration = "",
    doseRange = "",
    qrPayload = "",
  } = options;

  const vialMl = resolveVialMl({ form: form || subtitle, vialMl: vialMlOpt });
  const isTen = vialMl >= 10;

  const dims = {
    sm: { w: 160, h: 240 },
    md: { w: 280, h: 420 },
    lg: { w: 360, h: 560 },
  }[size] || { w: 280, h: 420 };

  const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 2, 3) : 2;
  canvas.width = dims.w * dpr;
  canvas.height = dims.h * dpr;
  canvas.style.width = `${dims.w}px`;
  canvas.style.height = `${dims.h}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, dims.w, dims.h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const photo = brandVial || brandVialCache || brandImage || brandImageCache;
  if (photo && photo.width) {
    drawPhotoVial(ctx, dims, {
      photo,
      name,
      mass,
      unit,
      sku,
      bacWater,
      concentration,
      doseRange,
      qrPayload,
      vialMl,
      isTen,
      wpMark: wpMark || wpMarkCache,
    });
    return canvas.toDataURL("image/png");
  }

  const drawOpts = {
    name,
    mass,
    unit,
    sku,
    reconstituted,
    wpMark: wpMark || wpMarkCache || brandImage || brandImageCache,
    bacWater,
    concentration,
    doseRange,
    qrPayload,
  };

  if (isTen) drawBrandTenMl(ctx, dims, drawOpts);
  else drawBrandThreeMl(ctx, dims, drawOpts);

  return canvas.toDataURL("image/png");
}

/** Cover-fit the studio vial photo, then stamp product data on the sleeve. */
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
    wpMark = null,
  } = options;

  // Match brand studio black
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

  // Soft bottom vignette so overlay text stays readable
  const veil = ctx.createLinearGradient(0, dims.h * 0.55, 0, dims.h);
  veil.addColorStop(0, "rgba(0,0,0,0)");
  veil.addColorStop(0.4, "rgba(0,0,0,0.4)");
  veil.addColorStop(1, "rgba(0,0,0,0.82)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, dims.h * 0.52, dims.w, dims.h * 0.48);

  const cx = dims.w / 2;
  const massNum = mass !== "" && mass != null ? mass : "";
  const massLabel =
    massNum !== "" ? `${massNum} ${String(unit || "mg").toUpperCase()}` : "";

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let y = dims.h * 0.7;
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.max(11, dims.w * 0.065)}px Outfit, "Segoe UI", sans-serif`;
  const titleLines = wrapLines(ctx, String(name).toUpperCase(), dims.w * 0.82, 2);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, cx, y + i * dims.w * 0.075);
  });
  y += titleLines.length * dims.w * 0.075 + dims.w * 0.02;

  if (massLabel) {
    ctx.fillStyle = "#d4af37";
    ctx.font = `700 ${Math.max(12, dims.w * 0.08)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(massLabel, cx, y);
    y += dims.w * 0.09;
  }

  const metaBits = [
    isTen || vialMl >= 10 ? "10 mL vial" : "3 mL vial",
    bacWater,
    concentration,
    doseRange,
  ].filter(Boolean);
  if (metaBits.length) {
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = `600 ${Math.max(8, dims.w * 0.042)}px Outfit, "Segoe UI", sans-serif`;
    metaBits.slice(0, 3).forEach((bit, i) => {
      ctx.fillText(bit, cx, y + i * dims.w * 0.055);
    });
    y += metaBits.slice(0, 3).length * dims.w * 0.055;
  }

  if (qrPayload || bacWater || concentration || doseRange) {
    const qrSize = Math.min(dims.w * 0.28, dims.h * 0.16);
    const qrY = Math.min(dims.h - qrSize - dims.w * 0.06, y + dims.w * 0.04);
    drawQrCode(
      ctx,
      cx - qrSize / 2,
      qrY,
      qrSize,
      qrSeedFromOptions({ name, mass, unit, bacWater, concentration, doseRange, sku }),
      true,
      qrPayload
    );
  } else if (sku) {
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    ctx.font = `500 ${Math.max(8, dims.w * 0.038)}px Outfit, sans-serif`;
    ctx.fillText(sku, cx, dims.h - dims.w * 0.06);
  }
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

/** White hexagon WP mark for the black brand spine (matches print-label mockup). */
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

  const inner = r * 0.78;
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

  // White WP monogram — P layered over W, matching brand hierarchy
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = Math.max(1.5, r * 0.14);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.42, cy - r * 0.38);
  ctx.lineTo(cx - r * 0.2, cy + r * 0.4);
  ctx.lineTo(cx, cy - r * 0.08);
  ctx.lineTo(cx + r * 0.2, cy + r * 0.4);
  ctx.lineTo(cx + r * 0.42, cy - r * 0.38);
  ctx.stroke();

  // P bowl in front
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.12, cy - r * 0.42);
  ctx.lineTo(cx - r * 0.12, cy + r * 0.42);
  ctx.moveTo(cx - r * 0.12, cy - r * 0.42);
  ctx.lineTo(cx + r * 0.06, cy - r * 0.42);
  ctx.arc(cx + r * 0.06, cy - r * 0.12, r * 0.3, -Math.PI / 2, Math.PI / 2, false);
  ctx.lineTo(cx - r * 0.12, cy + r * 0.18);
  ctx.stroke();
  ctx.restore();
}

/**
 * Flat printable Wellpept label — black spine + white data panel + QR,
 * matching the clinical wrap-label layout.
 */
export function drawLabelTemplate(canvas, options = {}) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    bacWater = "",
    concentration = "",
    doseRange = "",
    sku = "",
    wpMark = null,
    brandImage = null,
    size = "md",
    qrPayload = "",
  } = options;

  // Landscape wrap proportions (~2.7:1) like the print mockup
  const dims = {
    sm: { w: 480, h: 180 },
    md: { w: 700, h: 260 },
    lg: { w: 920, h: 340 },
  }[size] || { w: 700, h: 260 };

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

  const spineW = Math.round(dims.w * 0.115);
  const rightW = Math.round(dims.w * 0.22);
  const midX = spineW;
  const midW = dims.w - spineW - rightW;
  const rightX = spineW + midW;
  const ink = "#0a0a0a";
  const line = "#1a1a1a";
  const muted = "#6a6a6a";

  // Outer white plate
  roundRect(ctx, 0, 0, dims.w, dims.h, Math.max(6, dims.h * 0.04));
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.save();
  roundRect(ctx, 0, 0, dims.w, dims.h, Math.max(6, dims.h * 0.04));
  ctx.clip();

  // —— Left black brand spine ——
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, spineW, dims.h);

  // Vertical WELLPEPT — whole word rotated so it reads up the spine
  ctx.save();
  ctx.translate(spineW * 0.52, dims.h * 0.44);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const spineFont = Math.max(13, Math.min(dims.h * 0.1, spineW * 0.4));
  ctx.font = `700 ${spineFont}px Outfit, "Segoe UI", sans-serif`;
  const spineWord = "WELLPEPT";
  const track = spineFont * 0.22;
  let totalW = 0;
  for (const ch of spineWord) {
    totalW += ctx.measureText(ch).width + track;
  }
  totalW -= track;
  let x = -totalW / 2;
  for (const ch of spineWord) {
    ctx.fillText(ch, x + ctx.measureText(ch).width / 2, 0);
    x += ctx.measureText(ch).width + track;
  }
  ctx.restore();

  const markR = Math.min(spineW * 0.32, dims.h * 0.1);
  drawLabelSpineMark(ctx, spineW * 0.5, dims.h - markR * 1.55, markR);

  // —— Center data panel ——
  ctx.strokeStyle = line;
  ctx.lineWidth = Math.max(1, dims.h * 0.004);
  ctx.beginPath();
  ctx.moveTo(rightX, dims.h * 0.08);
  ctx.lineTo(rightX, dims.h * 0.92);
  ctx.stroke();

  const midCx = midX + midW / 2;
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const brandHeaderPx = Math.max(9, dims.h * 0.045);
  ctx.font = `600 ${brandHeaderPx}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("—  WELLPEPT  —", midCx, dims.h * 0.12);

  const product = String(name || "PEPTIDE").toUpperCase();
  const nameFamily = '"Bebas Neue", "Arial Black", Impact, sans-serif';
  const nameSize = fitCenteredText(
    ctx,
    product,
    midW * 0.88,
    Math.max(28, dims.h * 0.22),
    nameFamily
  );
  ctx.font = `400 ${nameSize}px ${nameFamily}`;
  ctx.fillStyle = ink;
  ctx.fillText(product, midCx, dims.h * 0.34);

  // Thick rule under name
  const ruleY = dims.h * 0.46;
  const ruleW = midW * 0.72;
  ctx.fillStyle = ink;
  ctx.fillRect(midCx - ruleW / 2, ruleY, ruleW, Math.max(2.5, dims.h * 0.012));

  const massLabel =
    mass !== "" && mass != null
      ? `${String(mass).trim()} ${String(unit || "mg").toUpperCase()}`
      : "";
  if (massLabel) {
    const massSize = fitCenteredText(
      ctx,
      massLabel,
      midW * 0.85,
      Math.max(22, dims.h * 0.145),
      'Outfit, "Segoe UI", sans-serif'
    );
    ctx.font = `800 ${massSize}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillStyle = ink;
    ctx.fillText(massLabel, midCx, dims.h * 0.58);
  }

  // Spec grid
  const gridTop = dims.h * 0.7;
  const gridH = dims.h * 0.24;
  const colW = midW / 3;
  const cells = [
    { label: "BAC WATER", value: formatBacForLabel(bacWater) },
    { label: "CONCENTRATION", value: String(concentration || "—") },
    { label: "DOSE RANGE", value: String(doseRange || "—") },
  ];

  cells.forEach((cell, i) => {
    const cx = midX + colW * (i + 0.5);
    if (i > 0) {
      ctx.strokeStyle = "rgba(10,10,10,0.35)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(midX + colW * i, gridTop + gridH * 0.12);
      ctx.lineTo(midX + colW * i, gridTop + gridH * 0.88);
      ctx.stroke();
    }
    ctx.fillStyle = muted;
    ctx.font = `700 ${Math.max(7, dims.h * 0.032)}px Outfit, "Segoe UI", sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(cell.label, cx, gridTop + gridH * 0.28);

    const valueSize = fitCenteredText(
      ctx,
      cell.value,
      colW * 0.9,
      Math.max(11, dims.h * 0.055),
      'Outfit, "Segoe UI", sans-serif'
    );
    ctx.font = `800 ${valueSize}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillStyle = ink;
    ctx.fillText(cell.value, cx, gridTop + gridH * 0.68);
  });

  // —— Right QR + disclaimer ——
  const qrPad = Math.max(10, rightW * 0.12);
  const qrBox = Math.min(rightW - qrPad * 2, dims.h * 0.52);
  const qrX = rightX + (rightW - qrBox) / 2;
  const qrY = dims.h * 0.12;

  roundRect(ctx, qrX, qrY, qrBox, qrBox, Math.max(4, qrBox * 0.06));
  ctx.strokeStyle = "rgba(10,10,10,0.35)";
  ctx.lineWidth = Math.max(1, dims.h * 0.005);
  ctx.stroke();

  const qrInset = qrBox * 0.08;
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
    qrPayloadFromOptions({ qrPayload })
  );

  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const discPx = Math.max(7, dims.h * 0.032);
  ctx.font = `700 ${discPx}px Outfit, "Segoe UI", sans-serif`;
  const discX = rightX + rightW / 2;
  const discY = qrY + qrBox + dims.h * 0.12;
  ctx.fillText("RESEARCH ONLY.", discX, discY);
  ctx.fillText("NOT FOR HUMAN", discX, discY + discPx * 1.35);
  ctx.fillText("CONSUMPTION.", discX, discY + discPx * 2.7);

  ctx.restore();
  return canvas.toDataURL("image/png");
}

export function downloadVialPng(dataUrl, filename = "wellpept-vial.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
