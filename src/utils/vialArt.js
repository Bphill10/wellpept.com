const CATEGORY_PALETTES = {
  Recovery: { liquid: ["#1f6b52", "#0f3f32"], accent: "#7ec8a8" },
  Growth: { liquid: ["#b8862d", "#7a5518"], accent: "#f0c96b" },
  Cognitive: { liquid: ["#3d5a80", "#243447"], accent: "#8eb4d9" },
  Metabolic: { liquid: ["#c9832a", "#8a5610"], accent: "#f0b35a" },
  Cellular: { liquid: ["#2a7a62", "#164a3a"], accent: "#8fd6b8" },
  Longevity: { liquid: ["#4a5d52", "#2a3a32"], accent: "#a8c4b0" },
  Research: { liquid: ["#5d7268", "#3a4a42"], accent: "#b8ccc2" },
};

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function getVialPalette(seed = "", category = "Research") {
  const base = CATEGORY_PALETTES[category] || CATEGORY_PALETTES.Research;
  const h = hashString(seed || category);
  const shift = (h % 24) - 12;
  return {
    ...base,
    seed: h,
    labelTint: `hsl(${(145 + shift) % 360} 18% 94%)`,
  };
}

function wrapLines(ctx, text, maxWidth, maxLines = 3) {
  const words = String(text || "").trim().split(/\s+/).filter(Boolean);
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
  if (words.length > lines.join(" ").split(/\s+/).length) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] =
      last.length > 3 ? `${last.slice(0, Math.max(0, last.length - 1))}…` : last;
  }
  return lines;
}

export function drawGeneratedVial(canvas, options = {}) {
  const {
    name = "Peptide",
    subtitle = "",
    sku = "",
    mass = "",
    category = "Research",
    mixText = "",
    doseRef = "",
    size = "md",
    reconstituted = false,
  } = options;

  const dims = {
    sm: { w: 160, h: 260, scale: 1 },
    md: { w: 280, h: 420, scale: 1 },
    lg: { w: 420, h: 630, scale: 1 },
  }[size] || { w: 280, h: 420, scale: 1 };

  const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 2;
  canvas.width = dims.w * dpr;
  canvas.height = dims.h * dpr;
  canvas.style.width = `${dims.w}px`;
  canvas.style.height = `${dims.h}px`;

  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, dims.w, dims.h);

  const palette = getVialPalette(`${name}-${sku}`, category);
  const cx = dims.w / 2;
  const vialW = dims.w * 0.34;
  const vialTop = dims.h * 0.16;
  const vialH = dims.h * 0.62;
  const radius = vialW * 0.18;

  // Background glow
  const bg = ctx.createRadialGradient(cx, vialTop + vialH * 0.45, 10, cx, vialTop + vialH * 0.45, dims.w * 0.55);
  bg.addColorStop(0, "rgba(31, 107, 82, 0.12)");
  bg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, dims.w, dims.h);

  // Cap
  const capW = vialW * 0.72;
  const capH = vialH * 0.08;
  const capX = cx - capW / 2;
  const capY = vialTop - capH * 0.55;
  ctx.fillStyle = "#0f3f32";
  roundRect(ctx, capX, capY, capW, capH, 4);
  ctx.fill();
  ctx.fillStyle = "#1f6b52";
  roundRect(ctx, capX + capW * 0.08, capY + capH * 0.15, capW * 0.84, capH * 0.55, 3);
  ctx.fill();

  // Glass body
  const bodyX = cx - vialW / 2;
  const bodyY = vialTop;
  const glass = ctx.createLinearGradient(bodyX, bodyY, bodyX + vialW, bodyY + vialH);
  glass.addColorStop(0, "rgba(255,255,255,0.55)");
  glass.addColorStop(0.45, "rgba(255,255,255,0.12)");
  glass.addColorStop(1, "rgba(255,255,255,0.35)");
  ctx.fillStyle = glass;
  roundRect(ctx, bodyX, bodyY, vialW, vialH, radius);
  ctx.fill();
  ctx.strokeStyle = "rgba(16, 33, 28, 0.22)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, bodyX, bodyY, vialW, vialH, radius);
  ctx.stroke();

  // Liquid
  const liquidTop = bodyY + vialH * (reconstituted ? 0.42 : 0.58);
  const liquidH = bodyY + vialH - liquidTop - radius * 0.35;
  const liquidGrad = ctx.createLinearGradient(0, liquidTop, 0, liquidTop + liquidH);
  liquidGrad.addColorStop(0, palette.liquid[0]);
  liquidGrad.addColorStop(1, palette.liquid[1]);
  ctx.save();
  roundRect(ctx, bodyX + 3, liquidTop, vialW - 6, liquidH, radius * 0.7);
  ctx.clip();
  ctx.fillStyle = liquidGrad;
  ctx.fillRect(bodyX, liquidTop, vialW, liquidH);
  ctx.restore();

  // Glass highlight
  ctx.strokeStyle = "rgba(255,255,255,0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bodyX + vialW * 0.18, bodyY + vialH * 0.12);
  ctx.lineTo(bodyX + vialW * 0.18, bodyY + vialH * 0.78);
  ctx.stroke();

  // Label
  const labelW = vialW * 0.88;
  const labelH = vialH * 0.36;
  const labelX = cx - labelW / 2;
  const labelY = bodyY + vialH * 0.2;
  ctx.fillStyle = palette.labelTint;
  roundRect(ctx, labelX, labelY, labelW, labelH, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(16, 33, 28, 0.12)";
  ctx.lineWidth = 1;
  roundRect(ctx, labelX, labelY, labelW, labelH, 6);
  ctx.stroke();

  const pad = labelW * 0.1;
  let y = labelY + pad + 4;
  const textW = labelW - pad * 2;

  ctx.textAlign = "center";
  ctx.fillStyle = "#10211c";
  ctx.font = `800 ${Math.max(11, labelH * 0.16)}px Manrope, Arial, sans-serif`;
  const titleSize = Math.max(11, labelH * 0.16);
  ctx.font = `800 ${titleSize}px Manrope, Arial, sans-serif`;
  const titleLines = wrapLines(ctx, name.toUpperCase(), textW, 2);
  titleLines.forEach((line) => {
    ctx.fillText(line, cx, y);
    y += titleSize * 1.15;
  });

  ctx.fillStyle = "#2a4038";
  ctx.font = `600 ${Math.max(9, labelH * 0.11)}px Manrope, Arial, sans-serif`;
  const subSize = Math.max(9, labelH * 0.11);
  const sub = mass ? `${mass} mg` : subtitle;
  if (sub) {
    ctx.fillText(sub, cx, y + 2);
    y += subSize * 1.2;
  }
  if (sku) {
    ctx.fillStyle = "#5d7268";
    ctx.font = `600 ${Math.max(8, labelH * 0.09)}px Manrope, Arial, sans-serif`;
    ctx.fillText(sku, cx, y + 2);
    y += subSize;
  }

  ctx.fillStyle = palette.accent;
  ctx.font = `700 ${Math.max(7, labelH * 0.08)}px Fraunces, Georgia, serif`;
  ctx.fillText("UNDISCLOSED", cx, labelY + labelH - pad * 0.7);

  // Footer mix / dose text below vial
  const footer = mixText || doseRef;
  if (footer) {
    ctx.fillStyle = "#5d7268";
    ctx.font = `600 ${Math.max(10, dims.w * 0.034)}px Manrope, Arial, sans-serif`;
    const footerLines = wrapLines(ctx, footer, dims.w * 0.82, 2);
    let fy = bodyY + vialH + dims.h * 0.05;
    footerLines.forEach((line) => {
      ctx.fillText(line, cx, fy);
      fy += 14;
    });
  }

  return canvas.toDataURL("image/png");
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

export function downloadVialPng(dataUrl, filename = "undisclosed-vial.png") {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}
