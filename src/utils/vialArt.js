/** Undisclosed brand vial art — clinical monochrome label on realistic glass. */

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
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
    if (ctx.measureText(next).width <= maxWidth) {
      current = next;
    } else {
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

function drawBrandLabel(ctx, w, h, options) {
  const {
    name = "PEPTIDE",
    massLabel = "",
    bacWater = "",
    concentration = "",
    doseRange = "",
    vialMl = 3,
  } = options;

  // White face
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);

  // Left black brand rail
  const rail = Math.max(18, w * 0.11);
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, rail, h);

  // Vertical UNDISCLOSED
  ctx.save();
  ctx.translate(rail / 2, h * 0.42);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 ${Math.max(9, h * 0.055)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("UNDISCLOSED", 0, 0);
  ctx.restore();

  // UD hex mark
  const hx = rail / 2;
  const hy = h - rail * 0.72;
  const hr = rail * 0.32;
  hexagonPath(ctx, hx, hy, hr);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "#0a0a0a";
  ctx.font = `800 ${Math.max(7, hr * 0.7)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("UD", hx, hy + 0.5);

  const contentX = rail + w * 0.04;
  const contentW = w - rail - w * 0.04 - w * 0.22;
  const rightBoxX = w - w * 0.2;
  const rightBoxW = w * 0.16;

  // Top brand lockup
  ctx.fillStyle = "#111111";
  ctx.font = `600 ${Math.max(7, h * 0.038)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillText("— UNDISCLOSED —", contentX + contentW / 2, h * 0.11);

  // Product name — athletic block
  const titleSize = Math.max(14, Math.min(h * 0.16, contentW * 0.22));
  ctx.font = `800 ${titleSize}px Outfit, "Segoe UI", sans-serif`;
  const titleLines = wrapLines(ctx, String(name).toUpperCase(), contentW * 0.95, 2);
  let ty = h * 0.2;
  titleLines.forEach((line) => {
    ctx.fillText(line, contentX + contentW / 2, ty);
    ty += titleSize * 0.95;
  });

  // Rule + mass
  const ruleY = Math.max(ty + h * 0.02, h * 0.38);
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 1.25;
  ctx.beginPath();
  ctx.moveTo(contentX, ruleY);
  ctx.lineTo(contentX + contentW, ruleY);
  ctx.stroke();

  const massSize = Math.max(13, h * 0.12);
  ctx.font = `800 ${massSize}px Outfit, "Segoe UI", sans-serif`;
  ctx.fillText(massLabel || `${vialMl} mL`, contentX + contentW / 2, ruleY + massSize * 0.95);

  // Second rule + three columns
  const colTop = ruleY + massSize * 1.25;
  ctx.beginPath();
  ctx.moveTo(contentX, colTop);
  ctx.lineTo(contentX + contentW, colTop);
  ctx.stroke();

  const colH = h * 0.28;
  const colY = colTop + h * 0.04;
  const cols = [
    {
      title: "BAC WATER",
      value: bacWater || `${vialMl} mL vial`,
    },
    {
      title: "CONCENTRATION",
      value: concentration || "See COA",
    },
    {
      title: "DOSE RANGE",
      value: doseRange || "Lab protocol",
    },
  ];
  const colW = contentW / 3;
  cols.forEach((col, i) => {
    const cx = contentX + colW * i + colW / 2;
    if (i > 0) {
      ctx.beginPath();
      ctx.moveTo(contentX + colW * i, colY);
      ctx.lineTo(contentX + colW * i, colY + colH * 0.7);
      ctx.strokeStyle = "#cccccc";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = "#111111";
    }
    ctx.fillStyle = "#666666";
    ctx.font = `700 ${Math.max(6, h * 0.028)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(col.title, cx, colY + h * 0.03);
    ctx.fillStyle = "#111111";
    ctx.font = `800 ${Math.max(8, h * 0.045)}px Outfit, "Segoe UI", sans-serif`;
    const valueLines = wrapLines(ctx, col.value, colW * 0.9, 2);
    valueLines.forEach((line, li) => {
      ctx.fillText(line, cx, colY + h * 0.1 + li * h * 0.055);
    });
  });

  // QR / code placeholder
  roundRect(ctx, rightBoxX, h * 0.14, rightBoxW, rightBoxW, 4);
  ctx.strokeStyle = "#c8c8c8";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // faux QR grid
  ctx.fillStyle = "#111111";
  const cells = 5;
  const pad = rightBoxW * 0.14;
  const cell = (rightBoxW - pad * 2) / cells;
  const seed = hashString(String(name) + massLabel);
  for (let r = 0; r < cells; r += 1) {
    for (let c = 0; c < cells; c += 1) {
      if ((seed + r * 7 + c * 3) % 3 === 0) continue;
      ctx.fillRect(
        rightBoxX + pad + c * cell,
        h * 0.14 + pad + r * cell,
        cell * 0.85,
        cell * 0.85
      );
    }
  }

  // Disclaimer
  ctx.fillStyle = "#333333";
  ctx.font = `600 ${Math.max(5.5, h * 0.026)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "right";
  const disc = "RESEARCH ONLY. NOT FOR HUMAN CONSUMPTION.";
  const discLines = wrapLines(ctx, disc, rightBoxW + contentW * 0.35, 2);
  discLines.forEach((line, i) => {
    ctx.fillText(line, w - w * 0.03, h * 0.92 + i * h * 0.035);
  });
}

function mapLabelOntoCylinder(ctx, labelCanvas, vialX, vialY, vialW, vialH, labelY, labelH) {
  const slices = Math.max(48, Math.floor(vialW * 1.5));
  const labelW = labelCanvas.width;
  const labelHpx = labelCanvas.height;
  const drawW = vialW * 0.92;
  const drawX = vialX + (vialW - drawW) / 2;

  for (let i = 0; i < slices; i += 1) {
    const t = i / (slices - 1); // 0..1 across front face
    // Map front 180° of cylinder: edges foreshorten
    const theta = (t - 0.5) * Math.PI * 0.92;
    const cos = Math.cos(theta);
    if (cos <= 0.05) continue;
    const srcX = Math.floor(t * (labelW - 1));
    const destX = drawX + t * drawW;
    const sliceW = Math.max(1.1, (drawW / slices) * (0.55 + cos * 0.55));
    const shade = 0.72 + cos * 0.28;

    ctx.save();
    ctx.globalAlpha = shade;
    ctx.drawImage(
      labelCanvas,
      srcX,
      0,
      1,
      labelHpx,
      destX,
      labelY,
      sliceW,
      labelH
    );
    ctx.restore();
  }

  // Soft paper edge shadow
  const edge = ctx.createLinearGradient(drawX, 0, drawX + drawW, 0);
  edge.addColorStop(0, "rgba(0,0,0,0.22)");
  edge.addColorStop(0.12, "rgba(0,0,0,0)");
  edge.addColorStop(0.88, "rgba(0,0,0,0)");
  edge.addColorStop(1, "rgba(0,0,0,0.2)");
  ctx.fillStyle = edge;
  ctx.fillRect(drawX, labelY, drawW, labelH);
}

export function drawGeneratedVial(canvas, options = {}) {
  const {
    name = "Peptide",
    subtitle = "",
    sku = "",
    mass = "",
    unit = "mg",
    category = "Research",
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
    sm: { w: 160, h: 260 },
    md: { w: 280, h: 420 },
    lg: { w: 420, h: 630 },
  }[size] || { w: 280, h: 420 };

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 2;
  canvas.width = dims.w * dpr;
  canvas.height = dims.h * dpr;
  canvas.style.width = `${dims.w}px`;
  canvas.style.height = `${dims.h}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, dims.w, dims.h);

  const cx = dims.w / 2;
  // 3 mL = slender; 10 mL = wider / slightly shorter neck ratio
  const vialW = dims.w * (isTen ? 0.42 : 0.32);
  const vialTop = dims.h * (isTen ? 0.14 : 0.15);
  const vialH = dims.h * (isTen ? 0.58 : 0.64);
  const radius = vialW * (isTen ? 0.14 : 0.16);

  // Soft studio ground
  const floor = ctx.createRadialGradient(
    cx,
    dims.h * 0.88,
    4,
    cx,
    dims.h * 0.88,
    dims.w * 0.42
  );
  floor.addColorStop(0, "rgba(12, 27, 42, 0.12)");
  floor.addColorStop(1, "rgba(12, 27, 42, 0)");
  ctx.fillStyle = floor;
  ctx.fillRect(0, 0, dims.w, dims.h);

  const ambient = ctx.createRadialGradient(
    cx,
    vialTop + vialH * 0.4,
    8,
    cx,
    vialTop + vialH * 0.4,
    dims.w * 0.5
  );
  ambient.addColorStop(0, "rgba(255,255,255,0.55)");
  ambient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = ambient;
  ctx.fillRect(0, 0, dims.w, dims.h);

  // Cap (black flip-off)
  const capW = vialW * 0.7;
  const capH = vialH * 0.07;
  const capX = cx - capW / 2;
  const capY = vialTop - capH * 0.85;
  const capGrad = ctx.createLinearGradient(capX, capY, capX + capW, capY);
  capGrad.addColorStop(0, "#1a1a1a");
  capGrad.addColorStop(0.5, "#3a3a3a");
  capGrad.addColorStop(1, "#111111");
  ctx.fillStyle = capGrad;
  roundRect(ctx, capX, capY, capW, capH, 3);
  ctx.fill();
  // Top disc
  ctx.fillStyle = "#0d0d0d";
  roundRect(ctx, capX + capW * 0.12, capY + capH * 0.15, capW * 0.76, capH * 0.45, 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  roundRect(ctx, capX + capW * 0.2, capY + capH * 0.2, capW * 0.22, capH * 0.2, 1);
  ctx.fill();

  // Grey rubber stopper / neck
  const neckW = vialW * 0.55;
  const neckH = vialH * 0.06;
  const neckX = cx - neckW / 2;
  const neckY = vialTop;
  const neckGrad = ctx.createLinearGradient(neckX, 0, neckX + neckW, 0);
  neckGrad.addColorStop(0, "#6e7378");
  neckGrad.addColorStop(0.5, "#b0b5ba");
  neckGrad.addColorStop(1, "#5c6166");
  ctx.fillStyle = neckGrad;
  roundRect(ctx, neckX, neckY, neckW, neckH, 2);
  ctx.fill();

  // Aluminum collar
  ctx.fillStyle = "#9aa0a6";
  roundRect(ctx, cx - vialW * 0.38, neckY + neckH * 0.55, vialW * 0.76, neckH * 0.7, 2);
  ctx.fill();

  const bodyX = cx - vialW / 2;
  const bodyY = vialTop + neckH * 0.85;
  const bodyH = vialH - neckH * 0.5;

  // Glass body fill (clear)
  const glass = ctx.createLinearGradient(bodyX, bodyY, bodyX + vialW, bodyY);
  glass.addColorStop(0, "rgba(210, 220, 230, 0.55)");
  glass.addColorStop(0.22, "rgba(255, 255, 255, 0.2)");
  glass.addColorStop(0.5, "rgba(245, 248, 252, 0.12)");
  glass.addColorStop(0.78, "rgba(255, 255, 255, 0.22)");
  glass.addColorStop(1, "rgba(180, 195, 210, 0.5)");
  ctx.fillStyle = glass;
  roundRect(ctx, bodyX, bodyY, vialW, bodyH, radius);
  ctx.fill();

  // Inner contents — powder cake or liquid
  ctx.save();
  roundRect(ctx, bodyX + 2, bodyY + 2, vialW - 4, bodyH - 4, radius * 0.85);
  ctx.clip();
  if (reconstituted) {
    const liquidTop = bodyY + bodyH * 0.45;
    const liq = ctx.createLinearGradient(0, liquidTop, 0, bodyY + bodyH);
    liq.addColorStop(0, "rgba(230, 236, 242, 0.55)");
    liq.addColorStop(1, "rgba(190, 205, 220, 0.75)");
    ctx.fillStyle = liq;
    ctx.fillRect(bodyX, liquidTop, vialW, bodyY + bodyH - liquidTop);
    // meniscus
    ctx.strokeStyle = "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(bodyX + 4, liquidTop);
    ctx.quadraticCurveTo(cx, liquidTop - 3, bodyX + vialW - 4, liquidTop);
    ctx.stroke();
  } else {
    // Lyophilized cake
    const cakeH = bodyH * 0.14;
    const cakeY = bodyY + bodyH - cakeH - radius * 0.35;
    const cake = ctx.createLinearGradient(0, cakeY, 0, cakeY + cakeH);
    cake.addColorStop(0, "rgba(255,255,255,0.95)");
    cake.addColorStop(1, "rgba(230, 232, 236, 0.95)");
    ctx.fillStyle = cake;
    ctx.fillRect(bodyX + 4, cakeY, vialW - 8, cakeH);
    ctx.fillStyle = "rgba(200, 204, 210, 0.5)";
    for (let i = 0; i < 6; i += 1) {
      const px = bodyX + 8 + ((hashString(name + i) % 80) / 100) * (vialW - 20);
      const py = cakeY + 2 + (i % 3) * 3;
      ctx.fillRect(px, py, 2, 2);
    }
  }
  ctx.restore();

  // Glass stroke
  ctx.strokeStyle = "rgba(40, 55, 70, 0.35)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, bodyX, bodyY, vialW, bodyH, radius);
  ctx.stroke();

  // Specular highlight
  ctx.strokeStyle = "rgba(255,255,255,0.65)";
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(bodyX + vialW * 0.18, bodyY + bodyH * 0.08);
  ctx.lineTo(bodyX + vialW * 0.18, bodyY + bodyH * 0.82);
  ctx.stroke();
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(bodyX + vialW * 0.82, bodyY + bodyH * 0.15);
  ctx.lineTo(bodyX + vialW * 0.82, bodyY + bodyH * 0.7);
  ctx.stroke();

  // Build flat label then wrap
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

  const labelW = Math.round(vialW * 2.4);
  const labelHflat = Math.round(bodyH * 0.72);
  const labelCanvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(labelW, labelHflat)
      : Object.assign(document.createElement("canvas"), {
          width: labelW,
          height: labelHflat,
        });
  if (!(labelCanvas instanceof OffscreenCanvas)) {
    labelCanvas.width = labelW;
    labelCanvas.height = labelHflat;
  }
  const lctx = labelCanvas.getContext("2d");
  drawBrandLabel(lctx, labelW, labelHflat, {
    name,
    massLabel,
    bacWater: bac,
    concentration: conc,
    doseRange: dose,
    vialMl,
  });

  const labelDrawH = bodyH * 0.48;
  const labelDrawY = bodyY + bodyH * 0.18;
  mapLabelOntoCylinder(
    ctx,
    labelCanvas,
    bodyX,
    bodyY,
    vialW,
    bodyH,
    labelDrawY,
    labelDrawH
  );

  // Contact shadow under label wrap (paper thickness)
  ctx.fillStyle = "rgba(0,0,0,0.08)";
  ctx.fillRect(bodyX + vialW * 0.06, labelDrawY + labelDrawH, vialW * 0.88, 2);

  // Footer: vial size callout
  ctx.fillStyle = "#3a4a5c";
  ctx.font = `700 ${Math.max(10, dims.w * 0.036)}px Outfit, "Segoe UI", sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(`${vialMl} mL research vial`, cx, bodyY + bodyH + dims.h * 0.055);
  if (sku) {
    ctx.fillStyle = "#6b7c8e";
    ctx.font = `600 ${Math.max(9, dims.w * 0.03)}px Outfit, "Segoe UI", sans-serif`;
    ctx.fillText(sku, cx, bodyY + bodyH + dims.h * 0.09);
  }

  return canvas.toDataURL("image/png");
}

export function downloadVialPng(dataUrl, filename = "undisclosed-vial.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
