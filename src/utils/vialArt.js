/** Undisclosed vial art — 3 mL matches clinical wrap-label mockups (B/W/gold). */

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
    labelTint: "#ffffff",
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

function hexagonPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Parse vial volume from vendor form text. Default 3 mL; 10 mL when listed. */
export function resolveVialMl({ form = "", vialMl } = {}) {
  if (vialMl != null && Number(vialMl) > 0) return Number(vialMl);
  const text = String(form || "");
  if (/\b10\s*ml\b/i.test(text) || /\b10ml\b/i.test(text)) return 10;
  if (/\blarge bottle\b/i.test(text)) return 10;
  return 3;
}

function makeCanvas(w, h) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(w, h);
  }
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
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
    if (i < n) {
      if (m[7][i] == null) m[7][i] = false;
      if (m[i][7] == null) m[i][7] = false;
      if (m[7][n - 1 - i] == null) m[7][n - 1 - i] = false;
      if (m[i][n - 8] == null) m[i][n - 8] = false;
      if (m[n - 8][i] == null) m[n - 8][i] = false;
      if (m[n - 1 - i][7] == null) m[n - 1 - i][7] = false;
    }
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

function drawQrCode(ctx, x, y, size, seedStr, inverted = false) {
  const n = 21;
  const quiet = Math.max(1, Math.floor(size * 0.08));
  const inner = size - quiet * 2;
  const mod = inner / n;
  const matrix = buildQrMatrix(seedStr, n);

  ctx.fillStyle = inverted ? "#0a0a0a" : "#ffffff";
  roundRect(ctx, x, y, size, size, Math.max(1, size * 0.05));
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
}

/**
 * 3 mL wrap label — matches clinical vial mockup layout:
 * white brand header → framed product name → solid band with large mg + Reference Material.
 * Brand colors: black / white / gold (not competitor red/blue).
 */
function drawThreeMlLabel(ctx, w, h, options) {
  const { name = "PEPTIDE", massLabel = "", sku = "" } = options;
  const gold = "#c9a227";
  const ink = "#0a0a0a";

  // Paper base
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  const rand = mulberry32(hashString(name + massLabel) || 1);
  ctx.fillStyle = "rgba(0,0,0,0.012)";
  for (let i = 0; i < 90; i += 1) {
    ctx.fillRect(rand() * w, rand() * h, 1.1, 1.1);
  }

  const padX = w * 0.06;
  const topH = h * 0.34;
  const midH = h * 0.28;
  const botH = h - topH - midH;

  // —— Top: brand lockup ——
  const markR = Math.min(w, h) * 0.07;
  const markCx = padX + markR * 1.15;
  const markCy = topH * 0.48;
  hexagonPath(ctx, markCx, markCy, markR);
  ctx.fillStyle = ink;
  ctx.fill();
  hexagonPath(ctx, markCx, markCy, markR * 0.72);
  ctx.strokeStyle = gold;
  ctx.lineWidth = Math.max(1.2, markR * 0.12);
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${Math.max(8, markR * 0.7)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("UD", markCx, markCy + 0.5);

  const brandX = markCx + markR * 1.55;
  ctx.fillStyle = ink;
  ctx.font = `800 ${Math.max(14, h * 0.095)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("UNDISCLOSED", brandX, topH * 0.42);
  ctx.fillStyle = gold;
  ctx.font = `700 ${Math.max(9, h * 0.048)}px Outfit, "Segoe UI", sans-serif`;
  const pep = "PEPTIDES";
  const pepGap = Math.max(2, h * 0.012);
  let pepX = brandX;
  for (let i = 0; i < pep.length; i += 1) {
    ctx.fillText(pep[i], pepX, topH * 0.62);
    pepX += ctx.measureText(pep[i]).width + pepGap;
  }

  // Gold hairline under brand
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padX, topH - 2);
  ctx.lineTo(w - padX, topH - 2);
  ctx.stroke();

  // —— Middle: framed product name ——
  const midY = topH;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(padX, midY + midH * 0.18);
  ctx.lineTo(w - padX, midY + midH * 0.18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(padX, midY + midH * 0.82);
  ctx.lineTo(w - padX, midY + midH * 0.82);
  ctx.stroke();

  // Soft gold inner rules
  ctx.strokeStyle = "rgba(201,162,39,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padX, midY + midH * 0.26);
  ctx.lineTo(w - padX, midY + midH * 0.26);
  ctx.moveTo(padX, midY + midH * 0.74);
  ctx.lineTo(w - padX, midY + midH * 0.74);
  ctx.stroke();

  const titleMaxW = w - padX * 2;
  const titleSize = Math.max(16, Math.min(h * 0.14, titleMaxW * 0.2));
  ctx.fillStyle = ink;
  ctx.font = `800 ${titleSize}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const titleLines = wrapLines(ctx, String(name).toUpperCase(), titleMaxW * 0.98, 2);
  const lineGap = titleSize * 0.95;
  const titleBlockH = titleLines.length * lineGap;
  let ty = midY + midH / 2 - titleBlockH / 2 + lineGap * 0.35;
  titleLines.forEach((line) => {
    ctx.fillText(line, w / 2, ty);
    ty += lineGap;
  });

  // —— Bottom: solid band + large strength ——
  const botY = topH + midH;
  ctx.fillStyle = ink;
  ctx.fillRect(0, botY, w, botH);

  // Gold top edge on band
  ctx.fillStyle = gold;
  ctx.fillRect(0, botY, w, Math.max(2, h * 0.012));

  const doseSize = Math.max(22, botH * 0.42);
  ctx.fillStyle = "#ffffff";
  ctx.font = `800 ${doseSize}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(massLabel || "—", w / 2, botY + botH * 0.38);

  // Small mark + QR row
  const rowY = botY + botH * 0.68;
  const miniR = Math.max(6, botH * 0.12);
  hexagonPath(ctx, w * 0.22, rowY, miniR);
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.font = `800 ${Math.max(5, miniR * 0.7)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("UD", w * 0.22, rowY + 0.4);

  const qrSize = Math.min(botH * 0.38, w * 0.14);
  drawQrCode(
    ctx,
    w * 0.78 - qrSize / 2,
    rowY - qrSize / 2,
    qrSize,
    `UD|3ml|${name}|${massLabel}|${sku}`,
    true
  );

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = `600 ${Math.max(8, botH * 0.14)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Reference Material", w / 2, botY + botH * 0.88);
}

/** Taller 10 mL label — more data columns, same brand language. */
function drawTenMlLabel(ctx, w, h, options) {
  const {
    name = "PEPTIDE",
    massLabel = "",
    bacWater = "",
    concentration = "",
    doseRange = "",
    vialMl = 10,
    sku = "",
  } = options;
  const gold = "#c9a227";
  const ink = "#0a0a0a";

  ctx.fillStyle = "#fbfbfb";
  ctx.fillRect(0, 0, w, h);

  const rand = mulberry32(hashString(name + massLabel) || 1);
  ctx.fillStyle = "rgba(0,0,0,0.015)";
  for (let i = 0; i < 120; i += 1) {
    ctx.fillRect(rand() * w, rand() * h, 1.2, 1.2);
  }

  const rail = Math.max(22, w * 0.115);
  ctx.fillStyle = ink;
  ctx.fillRect(0, 0, rail, h);
  ctx.fillStyle = gold;
  ctx.fillRect(rail - 3, 0, 3, h);

  ctx.save();
  ctx.translate(rail / 2, h * 0.4);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.max(10, h * 0.052)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("UNDISCLOSED", 0, 0);
  ctx.restore();

  const hx = rail / 2;
  const hy = h - rail * 0.7;
  const hr = rail * 0.3;
  hexagonPath(ctx, hx, hy, hr);
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.fillStyle = ink;
  ctx.font = `800 ${Math.max(7, hr * 0.72)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("UD", hx, hy + 0.5);

  const qrSize = Math.min(w * 0.2, h * 0.34);
  const rightBoxX = w - qrSize - w * 0.035;
  const contentX = rail + w * 0.035;
  const contentW = rightBoxX - contentX - w * 0.03;

  ctx.fillStyle = ink;
  ctx.font = `600 ${Math.max(7, h * 0.036)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("— UNDISCLOSED —", contentX + contentW / 2, h * 0.1);

  const titleSize = Math.max(15, Math.min(h * 0.155, contentW * 0.24));
  ctx.font = `800 ${titleSize}px Outfit, "Segoe UI", sans-serif`;
  const titleLines = wrapLines(ctx, String(name).toUpperCase(), contentW * 0.98, 2);
  let ty = h * 0.185;
  titleLines.forEach((line) => {
    ctx.fillText(line, contentX + contentW / 2, ty);
    ty += titleSize * 0.92;
  });

  const ruleY = Math.max(ty + h * 0.015, h * 0.36);
  ctx.strokeStyle = gold;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(contentX, ruleY);
  ctx.lineTo(contentX + contentW, ruleY);
  ctx.stroke();

  const massSize = Math.max(14, h * 0.115);
  ctx.fillStyle = ink;
  ctx.font = `800 ${massSize}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText(massLabel || `${vialMl} mL`, contentX + contentW / 2, ruleY + massSize * 0.95);

  const colTop = ruleY + massSize * 1.2;
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(contentX, colTop);
  ctx.lineTo(contentX + contentW, colTop);
  ctx.stroke();

  const colY = colTop + h * 0.035;
  const cols = [
    { title: "BAC WATER", value: bacWater || `${vialMl} mL vial` },
    { title: "CONCENTRATION", value: concentration || "See COA" },
    { title: "DOSE RANGE", value: doseRange || "Lab protocol" },
  ];
  const colW = contentW / 3;
  cols.forEach((col, i) => {
    const cx = contentX + colW * i + colW / 2;
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(contentX + colW * i, colY);
      ctx.lineTo(contentX + colW * i, colY + h * 0.18);
      ctx.strokeStyle = "#d0d0d0";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = ink;
    }
    ctx.fillStyle = "#666666";
    ctx.font = `700 ${Math.max(6, h * 0.026)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(col.title, cx, colY + h * 0.028);
    ctx.fillStyle = ink;
    ctx.font = `800 ${Math.max(8, h * 0.042)}px Outfit, "Segoe UI", sans-serif`;
    wrapLines(ctx, col.value, colW * 0.9, 2).forEach((line, li) => {
      ctx.fillText(line, cx, colY + h * 0.09 + li * h * 0.05);
    });
  });

  drawQrCode(ctx, rightBoxX, h * 0.12, qrSize, `UD|${name}|${massLabel}|${sku}|${vialMl}`);

  ctx.fillStyle = "#333333";
  ctx.font = `600 ${Math.max(5.5, h * 0.024)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "right";
  wrapLines(
    ctx,
    "RESEARCH ONLY. NOT FOR HUMAN CONSUMPTION.",
    qrSize + contentW * 0.4,
    2
  ).forEach((line, i) => {
    ctx.fillText(line, w - w * 0.03, h * 0.9 + i * h * 0.032);
  });
}

function mapLabelOntoCylinder(ctx, labelCanvas, vialX, vialW, labelY, labelH) {
  const slices = Math.max(96, Math.floor(vialW * 2.8));
  const srcW = labelCanvas.width;
  const srcH = labelCanvas.height;
  const drawW = vialW * 0.94;
  const drawX = vialX + (vialW - drawW) / 2;

  for (let i = 0; i < slices; i += 1) {
    const t = i / (slices - 1);
    const theta = (t - 0.5) * Math.PI * 0.98;
    const cos = Math.cos(theta);
    if (cos <= 0.04) continue;
    const srcX = Math.min(srcW - 1, Math.floor(t * (srcW - 1)));
    const destX = drawX + ((Math.sin(theta) + 1) / 2) * drawW;
    const sliceW = Math.max(1.15, (drawW / slices) * (0.35 + cos * 0.9));
    const shade = 0.55 + cos * 0.45;

    ctx.save();
    ctx.globalAlpha = shade;
    ctx.drawImage(labelCanvas, srcX, 0, 1, srcH, destX, labelY, sliceW, labelH);
    ctx.restore();
  }

  const gloss = ctx.createLinearGradient(drawX, labelY, drawX + drawW, labelY);
  gloss.addColorStop(0, "rgba(255,255,255,0)");
  gloss.addColorStop(0.35, "rgba(255,255,255,0.14)");
  gloss.addColorStop(0.5, "rgba(255,255,255,0.22)");
  gloss.addColorStop(0.65, "rgba(255,255,255,0.08)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(drawX, labelY, drawW, labelH * 0.35);

  const edge = ctx.createLinearGradient(drawX, 0, drawX + drawW, 0);
  edge.addColorStop(0, "rgba(0,0,0,0.28)");
  edge.addColorStop(0.1, "rgba(0,0,0,0)");
  edge.addColorStop(0.9, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.26)");
  ctx.fillStyle = edge;
  ctx.fillRect(drawX, labelY, drawW, labelH);
}

function ellipse(ctx, cx, cy, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
}

export function drawGeneratedVial(canvas, options = {}) {
  const {
    name = "Peptide",
    subtitle = "",
    sku = "",
    mass = "",
    unit = "mg",
    mixText = "",
    doseRef = "",
    bacWater = "",
    concentration = "",
    doseRange = "",
    size = "md",
    reconstituted = false,
    vialMl: vialMlOpt,
    form = "",
  } = options;

  const vialMl = resolveVialMl({ form: form || subtitle, vialMl: vialMlOpt });
  const isTen = vialMl >= 10;
  const isThree = !isTen;

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

  const cx = dims.w / 2;

  // Soft studio gray (matches product-photo mockups)
  const bg = ctx.createLinearGradient(0, 0, 0, dims.h);
  bg.addColorStop(0, "#e8eaed");
  bg.addColorStop(0.5, "#f4f5f7");
  bg.addColorStop(1, "#d9dce1");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, dims.w, dims.h);

  // 3 mL: short, stout pharma vial. 10 mL: taller bottle.
  const bodyW = dims.w * (isTen ? 0.38 : 0.34);
  const bodyH = dims.h * (isTen ? 0.48 : 0.42);
  const neckW = bodyW * (isTen ? 0.42 : 0.4);
  const neckH = bodyH * (isThree ? 0.14 : 0.11);
  const shoulderH = bodyH * (isThree ? 0.1 : 0.08);
  const capH = bodyH * (isThree ? 0.12 : 0.085);
  const sealH = bodyH * (isThree ? 0.07 : 0.055);

  const bodyX = cx - bodyW / 2;
  const bodyBottom = dims.h * (isThree ? 0.76 : 0.78);
  const bodyY = bodyBottom - bodyH;
  const shoulderY = bodyY;
  const neckY = shoulderY - neckH;
  const sealY = neckY - sealH * 0.35;
  const capY = sealY - capH * 0.85;

  // Soft contact shadow
  ellipse(ctx, cx, bodyBottom + dims.h * 0.01, bodyW * 0.7, bodyW * 0.12);
  const shadow = ctx.createRadialGradient(cx, bodyBottom, 2, cx, bodyBottom, bodyW * 0.85);
  shadow.addColorStop(0, "rgba(40, 45, 55, 0.32)");
  shadow.addColorStop(0.5, "rgba(40, 45, 55, 0.1)");
  shadow.addColorStop(1, "rgba(40, 45, 55, 0)");
  ctx.fillStyle = shadow;
  ctx.fill();

  // —— Flip-off cap (black + gold ring for Undisclosed) ——
  const capW = neckW * 1.18;
  const capSide = ctx.createLinearGradient(cx - capW / 2, 0, cx + capW / 2, 0);
  capSide.addColorStop(0, "#1a1a1a");
  capSide.addColorStop(0.35, "#3a3a3a");
  capSide.addColorStop(0.55, "#2a2a2a");
  capSide.addColorStop(1, "#101010");
  ctx.fillStyle = capSide;
  roundRect(ctx, cx - capW / 2, capY + capH * 0.25, capW, capH * 0.75, 3);
  ctx.fill();
  // gold accent ring under cap disc
  ctx.fillStyle = "#c9a227";
  roundRect(ctx, cx - capW / 2, capY + capH * 0.72, capW, capH * 0.12, 1);
  ctx.fill();

  ellipse(ctx, cx, capY + capH * 0.28, capW / 2, capH * 0.22);
  const capTop = ctx.createRadialGradient(
    cx - capW * 0.15,
    capY + capH * 0.15,
    2,
    cx,
    capY + capH * 0.28,
    capW * 0.55
  );
  capTop.addColorStop(0, "#555555");
  capTop.addColorStop(0.45, "#2b2b2b");
  capTop.addColorStop(1, "#0e0e0e");
  ctx.fillStyle = capTop;
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ellipse(ctx, cx - capW * 0.12, capY + capH * 0.2, capW * 0.16, capH * 0.06);
  ctx.fill();

  // —— Aluminum crimp ——
  const sealW = neckW * 1.1;
  const sealGrad = ctx.createLinearGradient(cx - sealW / 2, 0, cx + sealW / 2, 0);
  sealGrad.addColorStop(0, "#6a7076");
  sealGrad.addColorStop(0.25, "#d5d9de");
  sealGrad.addColorStop(0.5, "#f2f4f6");
  sealGrad.addColorStop(0.75, "#a8aeb4");
  sealGrad.addColorStop(1, "#5c636a");
  ctx.fillStyle = sealGrad;
  roundRect(ctx, cx - sealW / 2, sealY, sealW, sealH, 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(40,45,50,0.28)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    const y = sealY + (sealH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(cx - sealW * 0.42, y);
    ctx.lineTo(cx + sealW * 0.42, y);
    ctx.stroke();
  }

  // Rubber stopper
  const stopGrad = ctx.createLinearGradient(cx - neckW / 2, 0, cx + neckW / 2, 0);
  stopGrad.addColorStop(0, "#4a4f54");
  stopGrad.addColorStop(0.5, "#8b9198");
  stopGrad.addColorStop(1, "#3f4449");
  ctx.fillStyle = stopGrad;
  roundRect(ctx, cx - neckW * 0.42, neckY, neckW * 0.84, neckH * 0.35, 2);
  ctx.fill();

  // Glass neck
  const neckGrad = ctx.createLinearGradient(cx - neckW / 2, 0, cx + neckW / 2, 0);
  neckGrad.addColorStop(0, "rgba(150, 170, 190, 0.55)");
  neckGrad.addColorStop(0.2, "rgba(255,255,255,0.35)");
  neckGrad.addColorStop(0.5, "rgba(230, 240, 250, 0.12)");
  neckGrad.addColorStop(0.8, "rgba(255,255,255,0.3)");
  neckGrad.addColorStop(1, "rgba(140, 160, 180, 0.5)");
  ctx.fillStyle = neckGrad;
  roundRect(ctx, cx - neckW / 2, neckY + neckH * 0.25, neckW, neckH * 0.85, neckW * 0.12);
  ctx.fill();

  // Shoulders
  ctx.beginPath();
  ctx.moveTo(cx - neckW / 2, neckY + neckH);
  ctx.bezierCurveTo(
    cx - neckW / 2,
    shoulderY + shoulderH * 0.2,
    cx - bodyW / 2,
    shoulderY + shoulderH * 0.35,
    cx - bodyW / 2,
    shoulderY + shoulderH
  );
  ctx.lineTo(cx + bodyW / 2, shoulderY + shoulderH);
  ctx.bezierCurveTo(
    cx + bodyW / 2,
    shoulderY + shoulderH * 0.35,
    cx + neckW / 2,
    shoulderY + shoulderH * 0.2,
    cx + neckW / 2,
    neckY + neckH
  );
  ctx.closePath();
  const shoulderGrad = ctx.createLinearGradient(cx - bodyW / 2, 0, cx + bodyW / 2, 0);
  shoulderGrad.addColorStop(0, "rgba(130, 150, 170, 0.5)");
  shoulderGrad.addColorStop(0.22, "rgba(255,255,255,0.4)");
  shoulderGrad.addColorStop(0.5, "rgba(245,248,252,0.15)");
  shoulderGrad.addColorStop(0.78, "rgba(255,255,255,0.35)");
  shoulderGrad.addColorStop(1, "rgba(120, 140, 160, 0.48)");
  ctx.fillStyle = shoulderGrad;
  ctx.fill();

  // Glass body
  const radius = bodyW * (isThree ? 0.14 : 0.12);
  const glass = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
  glass.addColorStop(0, "rgba(110, 130, 150, 0.55)");
  glass.addColorStop(0.12, "rgba(255,255,255,0.55)");
  glass.addColorStop(0.28, "rgba(255,255,255,0.12)");
  glass.addColorStop(0.5, "rgba(240, 246, 252, 0.06)");
  glass.addColorStop(0.72, "rgba(255,255,255,0.14)");
  glass.addColorStop(0.88, "rgba(255,255,255,0.48)");
  glass.addColorStop(1, "rgba(100, 120, 145, 0.55)");
  ctx.fillStyle = glass;
  roundRect(ctx, bodyX, bodyY + shoulderH * 0.85, bodyW, bodyH - shoulderH * 0.85, radius);
  ctx.fill();

  const inset = Math.max(2.5, bodyW * 0.045);
  ctx.save();
  roundRect(
    ctx,
    bodyX + inset,
    bodyY + shoulderH * 0.85 + inset,
    bodyW - inset * 2,
    bodyH - shoulderH * 0.85 - inset * 2,
    radius * 0.75
  );
  ctx.clip();

  ctx.fillStyle = "rgba(248, 250, 252, 0.35)";
  ctx.fillRect(bodyX, bodyY, bodyW, bodyH);

  if (reconstituted) {
    const liquidTop = bodyY + bodyH * 0.42;
    const liq = ctx.createLinearGradient(bodyX, liquidTop, bodyX + bodyW, liquidTop);
    liq.addColorStop(0, "rgba(170, 190, 210, 0.55)");
    liq.addColorStop(0.35, "rgba(225, 235, 245, 0.45)");
    liq.addColorStop(0.65, "rgba(210, 225, 238, 0.42)");
    liq.addColorStop(1, "rgba(160, 180, 200, 0.58)");
    ctx.fillStyle = liq;
    ctx.fillRect(bodyX, liquidTop, bodyW, bodyBottom - liquidTop);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(bodyX + inset, liquidTop);
    ctx.quadraticCurveTo(cx, liquidTop - 4, bodyX + bodyW - inset, liquidTop);
    ctx.stroke();
  } else {
    // Lyophilized cake — clearly visible under label (esp. 3 mL)
    const cakeH = bodyH * (isThree ? 0.16 : 0.13);
    const cakeY = bodyBottom - cakeH - radius * 0.45;
    const cake = ctx.createLinearGradient(bodyX, cakeY, bodyX + bodyW, cakeY + cakeH);
    cake.addColorStop(0, "#eceef1");
    cake.addColorStop(0.35, "#ffffff");
    cake.addColorStop(0.7, "#e4e6ea");
    cake.addColorStop(1, "#cfd2d8");
    ctx.fillStyle = cake;
    roundRect(ctx, bodyX + inset + 1, cakeY, bodyW - inset * 2 - 2, cakeH, 3);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ellipse(ctx, cx, cakeY + 2, (bodyW - inset * 2) * 0.42, 3.5);
    ctx.fill();
    const rand = mulberry32(hashString(name) || 1);
    ctx.fillStyle = "rgba(170, 175, 185, 0.5)";
    for (let i = 0; i < 22; i += 1) {
      ctx.beginPath();
      ctx.arc(
        bodyX + inset + 4 + rand() * (bodyW - inset * 2 - 8),
        cakeY + 3 + rand() * (cakeH - 6),
        0.6 + rand() * 1.3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  ctx.restore();

  ctx.strokeStyle = "rgba(50, 70, 95, 0.4)";
  ctx.lineWidth = 1.4;
  roundRect(ctx, bodyX, bodyY + shoulderH * 0.85, bodyW, bodyH - shoulderH * 0.85, radius);
  ctx.stroke();

  const spec = ctx.createLinearGradient(bodyX, bodyY, bodyX + bodyW * 0.35, bodyY);
  spec.addColorStop(0, "rgba(255,255,255,0)");
  spec.addColorStop(0.4, "rgba(255,255,255,0.55)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spec;
  ctx.fillRect(bodyX + bodyW * 0.08, bodyY + shoulderH, bodyW * 0.14, bodyH * 0.72);

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(bodyX + bodyW * 0.78, bodyY + shoulderH * 1.2, bodyW * 0.05, bodyH * 0.55);

  const massNum = mass !== "" && mass != null ? mass : "";
  const unitLabel = String(unit || "mg").toUpperCase();
  const massLabel = massNum !== "" ? `${massNum} ${unitLabel}` : "";

  let bac = bacWater;
  let conc = concentration;
  let dose = doseRange || doseRef;
  if (!bac && mixText) {
    const m = String(mixText).match(/([\d.]+)\s*mL/i);
    if (m) bac = `${m[1]} mL`;
  }
  if (!conc && mixText) {
    const m = String(mixText).match(/([\d.]+)\s*mg\/mL/i);
    if (m) conc = `${m[1]} mg/mL`;
  }

  const labelW = Math.round(bodyW * 3.4);
  const labelHflat = Math.round(bodyH * (isThree ? 1.05 : 0.95));
  const labelCanvas = makeCanvas(labelW, labelHflat);
  const lctx = labelCanvas.getContext("2d");
  if (isThree) {
    drawThreeMlLabel(lctx, labelW, labelHflat, { name, massLabel, sku });
  } else {
    drawTenMlLabel(lctx, labelW, labelHflat, {
      name,
      massLabel,
      bacWater: bac,
      concentration: conc,
      doseRange: dose,
      vialMl,
      sku,
    });
  }

  // 3 mL: leave clear glass + cake under the wrap (like the reference photo)
  const labelDrawH = bodyH * (isThree ? 0.48 : 0.52);
  const labelDrawY = bodyY + shoulderH + bodyH * (isThree ? 0.08 : 0.12);
  mapLabelOntoCylinder(ctx, labelCanvas, bodyX, bodyW, labelDrawY, labelDrawH);

  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bodyX + bodyW * 0.05, labelDrawY);
  ctx.lineTo(bodyX + bodyW * 0.95, labelDrawY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bodyX + bodyW * 0.05, labelDrawY + labelDrawH);
  ctx.lineTo(bodyX + bodyW * 0.95, labelDrawY + labelDrawH);
  ctx.stroke();

  // Specular over glass (and label)
  ctx.strokeStyle = "rgba(255,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bodyX + bodyW * 0.16, bodyY + shoulderH + bodyH * 0.05);
  ctx.lineTo(bodyX + bodyW * 0.16, bodyBottom - bodyH * 0.08);
  ctx.stroke();

  const bottomShade = ctx.createLinearGradient(0, bodyBottom - radius * 2, 0, bodyBottom);
  bottomShade.addColorStop(0, "rgba(80,100,120,0)");
  bottomShade.addColorStop(1, "rgba(60,80,100,0.22)");
  ctx.fillStyle = bottomShade;
  roundRect(ctx, bodyX, bodyBottom - radius * 2.2, bodyW, radius * 2.2, radius);
  ctx.fill();

  ctx.fillStyle = "#4a5563";
  ctx.font = `700 ${Math.max(11, dims.w * 0.034)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${vialMl} mL research vial`, cx, bodyBottom + dims.h * 0.055);
  if (sku) {
    ctx.fillStyle = "#6b7280";
    ctx.font = `600 ${Math.max(9, dims.w * 0.028)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(sku, cx, bodyBottom + dims.h * 0.09);
  }

  return canvas.toDataURL("image/png");
}

export function downloadVialPng(dataUrl, filename = "undisclosed-vial.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
