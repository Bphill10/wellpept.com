/** Undisclosed brand vial art — matches /undisclosed-brand.png (gold cap, black sleeve, keyhole). */

export const BRAND_IMAGE_SRC = "/undisclosed-brand.png";

let brandImageCache = null;
let brandImagePromise = null;

/** Prefetch the brand PNG for canvas compositing. */
export function loadBrandImage() {
  if (typeof Image === "undefined") return Promise.resolve(null);
  if (brandImageCache) return Promise.resolve(brandImageCache);
  if (brandImagePromise) return brandImagePromise;
  brandImagePromise = new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      brandImageCache = img;
      resolve(img);
    };
    img.onerror = () => resolve(null);
    img.src = BRAND_IMAGE_SRC;
  });
  return brandImagePromise;
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

/** Gold circular seal with keyhole — Undisclosed mark from brand image. */
function drawKeyholeSeal(ctx, cx, cy, r) {
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

  // Inner brushed ring
  ellipse(ctx, cx, cy, r * 0.78, r * 0.78);
  ctx.strokeStyle = "rgba(255, 230, 160, 0.35)";
  ctx.lineWidth = Math.max(1, r * 0.03);
  ctx.stroke();

  // Keyhole
  ctx.fillStyle = "#0a0a0a";
  ellipse(ctx, cx, cy - r * 0.12, r * 0.18, r * 0.18);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(cx - r * 0.1, cy - r * 0.02);
  ctx.lineTo(cx + r * 0.1, cy - r * 0.02);
  ctx.lineTo(cx + r * 0.14, cy + r * 0.42);
  ctx.lineTo(cx - r * 0.14, cy + r * 0.42);
  ctx.closePath();
  ctx.fill();
}

function drawBrandWordmark(ctx, cx, y, maxW) {
  ctx.fillStyle = "#f5f5f5";
  ctx.font = `600 ${Math.max(11, maxW * 0.11)}px "Cormorant Garamond", "Times New Roman", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("UNDISCLOSED", cx, y);

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
 * 3 mL vial matching the Undisclosed brand image:
 * brushed gold cap · clear glass · lyophilized cake · matte black V-sleeve · gold keyhole seal.
 */
function drawBrandThreeMl(ctx, dims, options) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    sku = "",
    reconstituted = false,
    brandImage = null,
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

  // Gold keyhole seal — prefer compositing from brand image if loaded
  const sealR = bodyW * 0.28;
  const sealCy = sleeveTop + sleeveH * 0.32;
  if (brandImage && brandImage.width) {
    // Crop the seal region from the brand plate (approx center of vial sleeve)
    const iw = brandImage.width;
    const ih = brandImage.height;
    const crop = Math.min(iw, ih) * 0.22;
    const sx = iw * 0.5 - crop / 2;
    const sy = ih * 0.42 - crop / 2;
    ctx.save();
    ellipse(ctx, cx, sealCy, sealR, sealR);
    ctx.clip();
    ctx.drawImage(brandImage, sx, sy, crop, crop, cx - sealR, sealCy - sealR, sealR * 2, sealR * 2);
    ctx.restore();
    ellipse(ctx, cx, sealCy, sealR, sealR);
    ctx.strokeStyle = "rgba(212, 175, 55, 0.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else {
    drawKeyholeSeal(ctx, cx, sealCy, sealR);
  }

  // Product name + strength on sleeve
  const massNum = mass !== "" && mass != null ? mass : "";
  const unitLabel = String(unit || "mg").toUpperCase();
  const massLabel = massNum !== "" ? `${massNum} ${unitLabel}` : "";

  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.max(10, bodyW * 0.13)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const titleY = sealCy + sealR + sleeveH * 0.18;
  const titleLines = wrapLines(ctx, String(name).toUpperCase(), bodyW * 0.88, 2);
  titleLines.forEach((line, i) => {
    ctx.fillText(line, cx, titleY + i * bodyW * 0.14);
  });

  if (massLabel) {
    ctx.fillStyle = "#d4af37";
    ctx.font = `700 ${Math.max(11, bodyW * 0.16)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(massLabel, cx, titleY + titleLines.length * bodyW * 0.14 + bodyW * 0.08);
  }

  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `600 ${Math.max(7, bodyW * 0.08)}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("Reference Material", cx, bodyBottom - bodyW * 0.12);

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

  return canvas.toDataURL("image/png");
}

/** 10 mL — same brand language, taller bottle. */
function drawBrandTenMl(ctx, dims, options) {
  const {
    name = "Peptide",
    mass = "",
    unit = "mg",
    sku = "",
    reconstituted = false,
    brandImage = null,
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
  if (brandImage && brandImage.width) {
    const iw = brandImage.width;
    const ih = brandImage.height;
    const crop = Math.min(iw, ih) * 0.22;
    ctx.save();
    ellipse(ctx, cx, sealCy, sealR, sealR);
    ctx.clip();
    ctx.drawImage(
      brandImage,
      iw * 0.5 - crop / 2,
      ih * 0.42 - crop / 2,
      crop,
      crop,
      cx - sealR,
      sealCy - sealR,
      sealR * 2,
      sealR * 2
    );
    ctx.restore();
  } else {
    drawKeyholeSeal(ctx, cx, sealCy, sealR);
  }

  const massNum = mass !== "" && mass != null ? mass : "";
  const massLabel = massNum !== "" ? `${massNum} ${String(unit || "mg").toUpperCase()}` : "";
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${Math.max(11, bodyW * 0.11)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  wrapLines(ctx, String(name).toUpperCase(), bodyW * 0.88, 2).forEach((line, i) => {
    ctx.fillText(line, cx, sealCy + sealR + bodyW * 0.16 + i * bodyW * 0.12);
  });
  if (massLabel) {
    ctx.fillStyle = "#d4af37";
    ctx.font = `700 ${Math.max(12, bodyW * 0.14)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(massLabel, cx, bodyBottom - bodyW * 0.18);
  }

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `600 ${Math.max(8, bodyW * 0.07)}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText("10 mL · Reference Material", cx, bodyBottom - bodyW * 0.06);

  drawBrandWordmark(ctx, cx, bodyBottom + dims.h * 0.05, dims.w * 0.7);
  if (sku) {
    ctx.fillStyle = "rgba(200,200,200,0.4)";
    ctx.font = `500 ${Math.max(8, dims.w * 0.024)}px Outfit, sans-serif`;
    ctx.fillText(sku, cx, bodyBottom + dims.h * 0.09);
  }

  return canvas.toDataURL("image/png");
}

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
    brandImage = null,
  } = options;

  const vialMl = resolveVialMl({ form: form || subtitle, vialMl: vialMlOpt });
  const isTen = vialMl >= 10;

  const dims = {
    sm: { w: 180, h: 280 },
    md: { w: 320, h: 480 },
    lg: { w: 460, h: 690 },
  }[size] || { w: 320, h: 480 };

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

  const drawOpts = {
    name,
    mass,
    unit,
    sku,
    reconstituted,
    brandImage: brandImage || brandImageCache,
  };

  if (isTen) return drawBrandTenMl(ctx, dims, drawOpts);
  return drawBrandThreeMl(ctx, dims, drawOpts);
}

export function downloadVialPng(dataUrl, filename = "undisclosed-vial.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
