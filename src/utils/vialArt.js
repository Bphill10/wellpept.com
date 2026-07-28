/** Undisclosed brand vial art — photoreal glass + clinical label + QR. */

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
    accent: "#111111",
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

/**
 * Deterministic faux QR that reads as a real code: finder patterns,
 * separators, timing, and seeded data modules (Version-1 style 21×21).
 */
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

  // Separators (white ring around finders)
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

  // Timing patterns
  for (let i = 8; i < n - 8; i += 1) {
    if (m[6][i] == null) m[6][i] = i % 2 === 0;
    if (m[i][6] == null) m[i][6] = i % 2 === 0;
  }

  // Dark module (QR spec-ish)
  m[n - 8][8] = true;

  // Alignment-ish blob for visual density (center-ish)
  const ax = n - 9;
  const ay = n - 9;
  if (ax > 8 && ay > 8) {
    for (let r = 0; r < 5; r += 1) {
      for (let c = 0; c < 5; c += 1) {
        const border = r === 0 || r === 4 || c === 0 || c === 4;
        const core = r === 2 && c === 2;
        if (m[ay + r][ax + c] == null) m[ay + r][ax + c] = border || core;
      }
    }
  }

  // Fill remaining with seeded "data"
  for (let r = 0; r < n; r += 1) {
    for (let c = 0; c < n; c += 1) {
      if (m[r][c] == null) m[r][c] = rand() > 0.48;
    }
  }
  return m;
}

function drawQrCode(ctx, x, y, size, seedStr) {
  const n = 21;
  const quiet = Math.max(1, Math.floor(size * 0.06));
  const inner = size - quiet * 2;
  const mod = inner / n;
  const matrix = buildQrMatrix(seedStr, n);

  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, size, size, Math.max(1, size * 0.04));
  ctx.fill();

  ctx.fillStyle = "#0a0a0a";
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

  // Soft print inset
  ctx.strokeStyle = "rgba(0,0,0,0.12)";
  ctx.lineWidth = 1;
  roundRect(ctx, x + 0.5, y + 0.5, size - 1, size - 1, Math.max(1, size * 0.04));
  ctx.stroke();
}

function drawBrandLabel(ctx, w, h, options) {
  const {
    name = "PEPTIDE",
    massLabel = "",
    bacWater = "",
    concentration = "",
    doseRange = "",
    vialMl = 3,
    sku = "",
  } = options;

  ctx.fillStyle = "#fbfbfb";
  ctx.fillRect(0, 0, w, h);

  // Paper fiber noise
  const rand = mulberry32(hashString(name + massLabel) || 1);
  ctx.fillStyle = "rgba(0,0,0,0.015)";
  for (let i = 0; i < 120; i += 1) {
    ctx.fillRect(rand() * w, rand() * h, 1.2, 1.2);
  }

  const rail = Math.max(22, w * 0.115);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, rail, h);

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
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "#0a0a0a";
  ctx.font = `800 ${Math.max(7, hr * 0.72)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("UD", hx, hy + 0.5);

  const qrSize = Math.min(w * 0.2, h * 0.34);
  const rightBoxX = w - qrSize - w * 0.035;
  const contentX = rail + w * 0.035;
  const contentW = rightBoxX - contentX - w * 0.03;

  ctx.fillStyle = "#111111";
  ctx.font = `600 ${Math.max(7, h * 0.036)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
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
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(contentX, ruleY);
  ctx.lineTo(contentX + contentW, ruleY);
  ctx.stroke();

  const massSize = Math.max(14, h * 0.115);
  ctx.font = `800 ${massSize}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText(massLabel || `${vialMl} mL`, contentX + contentW / 2, ruleY + massSize * 0.95);

  const colTop = ruleY + massSize * 1.2;
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
      ctx.strokeStyle = "#111111";
    }
    ctx.fillStyle = "#666666";
    ctx.font = `700 ${Math.max(6, h * 0.026)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(col.title, cx, colY + h * 0.028);
    ctx.fillStyle = "#111111";
    ctx.font = `800 ${Math.max(8, h * 0.042)}px Outfit, "Segoe UI", sans-serif`;
    wrapLines(ctx, col.value, colW * 0.9, 2).forEach((line, li) => {
      ctx.fillText(line, cx, colY + h * 0.09 + li * h * 0.05);
    });
  });

  drawQrCode(
    ctx,
    rightBoxX,
    h * 0.12,
    qrSize,
    `UD|${name}|${massLabel}|${sku}|${vialMl}`
  );

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

  // Rim light across paper
  const gloss = ctx.createLinearGradient(drawX, labelY, drawX + drawW, labelY);
  gloss.addColorStop(0, "rgba(255,255,255,0)");
  gloss.addColorStop(0.35, "rgba(255,255,255,0.14)");
  gloss.addColorStop(0.5, "rgba(255,255,255,0.22)");
  gloss.addColorStop(0.65, "rgba(255,255,255,0.08)");
  gloss.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gloss;
  ctx.fillRect(drawX, labelY, drawW, labelH * 0.35);

  // Edge occlusion
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

  // Studio backdrop
  const bg = ctx.createLinearGradient(0, 0, 0, dims.h);
  bg.addColorStop(0, "#eef2f6");
  bg.addColorStop(0.55, "#f7f8fa");
  bg.addColorStop(1, "#e6ebf1");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, dims.w, dims.h);

  // Proportions — pharma 3 mL vs 10 mL
  const bodyW = dims.w * (isTen ? 0.38 : 0.28);
  const bodyH = dims.h * (isTen ? 0.48 : 0.52);
  const neckW = bodyW * (isTen ? 0.42 : 0.38);
  const neckH = bodyH * 0.11;
  const shoulderH = bodyH * 0.08;
  const capH = bodyH * 0.085;
  const sealH = bodyH * 0.055;

  const bodyX = cx - bodyW / 2;
  const bodyBottom = dims.h * 0.78;
  const bodyY = bodyBottom - bodyH;
  const shoulderY = bodyY;
  const neckY = shoulderY - neckH;
  const sealY = neckY - sealH * 0.35;
  const capY = sealY - capH * 0.85;

  // Contact shadow
  ellipse(ctx, cx, bodyBottom + dims.h * 0.012, bodyW * 0.62, bodyW * 0.1);
  const shadow = ctx.createRadialGradient(cx, bodyBottom, 2, cx, bodyBottom, bodyW * 0.7);
  shadow.addColorStop(0, "rgba(20, 30, 45, 0.28)");
  shadow.addColorStop(0.55, "rgba(20, 30, 45, 0.08)");
  shadow.addColorStop(1, "rgba(20, 30, 45, 0)");
  ctx.fillStyle = shadow;
  ctx.fill();

  // —— Flip-off cap (plastic) ——
  const capW = neckW * 1.15;
  // side
  const capSide = ctx.createLinearGradient(cx - capW / 2, 0, cx + capW / 2, 0);
  capSide.addColorStop(0, "#1c1c1c");
  capSide.addColorStop(0.35, "#3d3d3d");
  capSide.addColorStop(0.55, "#2a2a2a");
  capSide.addColorStop(1, "#121212");
  ctx.fillStyle = capSide;
  roundRect(ctx, cx - capW / 2, capY + capH * 0.25, capW, capH * 0.75, 3);
  ctx.fill();
  // top disc (ellipse)
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
  // gloss on cap
  ctx.fillStyle = "rgba(255,255,255,0.2)";
  ellipse(ctx, cx - capW * 0.12, capY + capH * 0.2, capW * 0.16, capH * 0.06);
  ctx.fill();

  // —— Aluminum crimp seal ——
  const sealW = neckW * 1.08;
  const sealGrad = ctx.createLinearGradient(cx - sealW / 2, 0, cx + sealW / 2, 0);
  sealGrad.addColorStop(0, "#6a7076");
  sealGrad.addColorStop(0.25, "#d5d9de");
  sealGrad.addColorStop(0.5, "#f2f4f6");
  sealGrad.addColorStop(0.75, "#a8AEB4");
  sealGrad.addColorStop(1, "#5c636a");
  ctx.fillStyle = sealGrad;
  roundRect(ctx, cx - sealW / 2, sealY, sealW, sealH, 2);
  ctx.fill();
  // crimp ridges
  ctx.strokeStyle = "rgba(40,45,50,0.25)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i += 1) {
    const y = sealY + (sealH * i) / 4;
    ctx.beginPath();
    ctx.moveTo(cx - sealW * 0.42, y);
    ctx.lineTo(cx + sealW * 0.42, y);
    ctx.stroke();
  }

  // —— Rubber stopper peek ——
  const stopGrad = ctx.createLinearGradient(cx - neckW / 2, 0, cx + neckW / 2, 0);
  stopGrad.addColorStop(0, "#4a4f54");
  stopGrad.addColorStop(0.5, "#8b9198");
  stopGrad.addColorStop(1, "#3f4449");
  ctx.fillStyle = stopGrad;
  roundRect(ctx, cx - neckW * 0.42, neckY, neckW * 0.84, neckH * 0.35, 2);
  ctx.fill();

  // —— Glass neck ——
  const neckGrad = ctx.createLinearGradient(cx - neckW / 2, 0, cx + neckW / 2, 0);
  neckGrad.addColorStop(0, "rgba(150, 170, 190, 0.55)");
  neckGrad.addColorStop(0.2, "rgba(255,255,255,0.35)");
  neckGrad.addColorStop(0.5, "rgba(230, 240, 250, 0.12)");
  neckGrad.addColorStop(0.8, "rgba(255,255,255,0.3)");
  neckGrad.addColorStop(1, "rgba(140, 160, 180, 0.5)");
  ctx.fillStyle = neckGrad;
  roundRect(ctx, cx - neckW / 2, neckY + neckH * 0.25, neckW, neckH * 0.85, neckW * 0.12);
  ctx.fill();

  // —— Shoulders (glass flare into body) ——
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

  // —— Glass body ——
  const radius = bodyW * 0.12;
  // Outer glass shell
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

  // Inner cavity (slightly inset — glass thickness)
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

  // Interior ambient
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
    // meniscus
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(bodyX + inset, liquidTop);
    ctx.quadraticCurveTo(cx, liquidTop - 4, bodyX + bodyW - inset, liquidTop);
    ctx.stroke();
    // refraction darken at sides
    const sideDark = ctx.createLinearGradient(bodyX, 0, bodyX + bodyW, 0);
    sideDark.addColorStop(0, "rgba(40,60,80,0.18)");
    sideDark.addColorStop(0.15, "rgba(40,60,80,0)");
    sideDark.addColorStop(0.85, "rgba(40,60,80,0)");
    sideDark.addColorStop(1, "rgba(40,60,80,0.18)");
    ctx.fillStyle = sideDark;
    ctx.fillRect(bodyX, liquidTop, bodyW, bodyBottom - liquidTop);
  } else {
    // Lyophilized white cake with depth
    const cakeH = bodyH * 0.13;
    const cakeY = bodyBottom - cakeH - radius * 0.55;
    const cake = ctx.createLinearGradient(bodyX, cakeY, bodyX + bodyW, cakeY + cakeH);
    cake.addColorStop(0, "#f0f1f3");
    cake.addColorStop(0.35, "#ffffff");
    cake.addColorStop(0.7, "#e8eaee");
    cake.addColorStop(1, "#d5d8de");
    ctx.fillStyle = cake;
    roundRect(ctx, bodyX + inset + 1, cakeY, bodyW - inset * 2 - 2, cakeH, 3);
    ctx.fill();
    // top surface ellipse hint
    ctx.fillStyle = "rgba(255,255,255,0.7)";
    ellipse(ctx, cx, cakeY + 2, (bodyW - inset * 2) * 0.42, 3);
    ctx.fill();
    // cake crumb texture
    const rand = mulberry32(hashString(name) || 1);
    ctx.fillStyle = "rgba(180, 185, 195, 0.45)";
    for (let i = 0; i < 18; i += 1) {
      ctx.beginPath();
      ctx.arc(
        bodyX + inset + 4 + rand() * (bodyW - inset * 2 - 8),
        cakeY + 3 + rand() * (cakeH - 6),
        0.6 + rand() * 1.2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
  ctx.restore();

  // Outer glass stroke / rim light
  ctx.strokeStyle = "rgba(50, 70, 95, 0.4)";
  ctx.lineWidth = 1.4;
  roundRect(ctx, bodyX, bodyY + shoulderH * 0.85, bodyW, bodyH - shoulderH * 0.85, radius);
  ctx.stroke();

  // Primary specular (left)
  const spec = ctx.createLinearGradient(bodyX, bodyY, bodyX + bodyW * 0.35, bodyY);
  spec.addColorStop(0, "rgba(255,255,255,0)");
  spec.addColorStop(0.4, "rgba(255,255,255,0.55)");
  spec.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spec;
  ctx.fillRect(bodyX + bodyW * 0.08, bodyY + shoulderH, bodyW * 0.14, bodyH * 0.72);

  // Secondary specular (right thin)
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(bodyX + bodyW * 0.78, bodyY + shoulderH * 1.2, bodyW * 0.05, bodyH * 0.55);

  // —— Label ——
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

  const labelW = Math.round(bodyW * 3.2);
  const labelHflat = Math.round(bodyH * 0.95);
  const labelCanvas = makeCanvas(labelW, labelHflat);
  const lctx = labelCanvas.getContext("2d");
  drawBrandLabel(lctx, labelW, labelHflat, {
    name,
    massLabel,
    bacWater: bac,
    concentration: conc,
    doseRange: dose,
    vialMl,
    sku,
  });

  const labelDrawH = bodyH * 0.52;
  const labelDrawY = bodyY + shoulderH + bodyH * 0.12;
  mapLabelOntoCylinder(ctx, labelCanvas, bodyX, bodyW, labelDrawY, labelDrawH);

  // Label top/bottom paper edges (thickness)
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

  // Glass highlight OVER label (sits on glass)
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bodyX + bodyW * 0.16, bodyY + shoulderH + bodyH * 0.05);
  ctx.lineTo(bodyX + bodyW * 0.16, bodyBottom - bodyH * 0.08);
  ctx.stroke();

  // Bottom glass curve shading
  const bottomShade = ctx.createLinearGradient(0, bodyBottom - radius * 2, 0, bodyBottom);
  bottomShade.addColorStop(0, "rgba(80,100,120,0)");
  bottomShade.addColorStop(1, "rgba(60,80,100,0.2)");
  ctx.fillStyle = bottomShade;
  roundRect(ctx, bodyX, bodyBottom - radius * 2.2, bodyW, radius * 2.2, radius);
  ctx.fill();

  // Caption
  ctx.fillStyle = "#3a4a5c";
  ctx.font = `700 ${Math.max(11, dims.w * 0.034)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(`${vialMl} mL research vial`, cx, bodyBottom + dims.h * 0.05);
  if (sku) {
    ctx.fillStyle = "#6b7c8e";
    ctx.font = `600 ${Math.max(9, dims.w * 0.028)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(sku, cx, bodyBottom + dims.h * 0.085);
  }

  return canvas.toDataURL("image/png");
}

export function downloadVialPng(dataUrl, filename = "undisclosed-vial.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
