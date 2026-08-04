/**
 * Front-facing website label compositor.
 *
 * NEVER stretches the NIIMBOT 40×20 / 50×30 print bitmap onto the vial face.
 * Rebuilds catalog fields into a dedicated projection matched to placement
 * labelBoundsPx. Geometry is locked per vial size — product name never
 * resizes or repositions the label chrome.
 *
 * Columns (locked): left rail 9% · center 66% · right QR 25%.
 * No scaleX/scaleY on text, logo, mascot, or QR.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

/** Locked column fractions — identical for every product on a given face. */
const COL = Object.freeze({
  rail: 0.09,
  center: 0.66,
  right: 0.25,
});

/**
 * Absolute type locks for the website face at master 1024×1536 placement.
 * 3 mL face ≈ 526×512 · 10 mL face ≈ 484×608 (from vial-placement.json).
 */
const TYPE_3ML = Object.freeze({
  header: 24,
  namePreferred: 60,
  nameMin: 46,
  nameMax: 68,
  amount: 60,
  amountMin: 58,
  amountMax: 64,
  unit: 28,
  form: 24,
  storage: 24,
  legal: 18,
  company: 18,
  qr: 112,
  mascot: 70,
  barH: 72,
  barWidthFrac: 0.96,
});

const TYPE_10ML = Object.freeze({
  header: 26,
  namePreferred: 64,
  nameMin: 46,
  nameMax: 72,
  amount: 62,
  amountMin: 58,
  amountMax: 66,
  unit: 28,
  form: 25,
  storage: 24,
  legal: 18,
  company: 20,
  qr: 120,
  mascot: 72,
  barH: 78,
  barWidthFrac: 0.96,
});

function xml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function bool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return /^(true|yes|1|on)$/i.test(value.trim());
  return fallback;
}

function estimatedTextWidth(text, fontSize) {
  let units = 0;
  for (const character of String(text)) {
    if (/[MW@#%]/.test(character)) units += 0.88;
    else if (/[I1il.,'|]/.test(character)) units += 0.33;
    else if (/\s/.test(character)) units += 0.34;
    else units += 0.61;
  }
  return units * fontSize;
}

/** Shrink only — never stretch. Clamped to [minSize, maxSize]. */
function fitFontSize(text, maxWidth, preferred, minSize, maxSize = preferred) {
  const pref = Math.min(maxSize, Math.max(minSize, preferred));
  const estimate = estimatedTextWidth(text, pref);
  if (estimate <= maxWidth) return pref;
  return Math.max(minSize, Math.floor(pref * (maxWidth / estimate)));
}

function fileHref(relPath) {
  return pathToFileURL(path.join(root, relPath)).href;
}

async function dataUriPng(relPath) {
  const buf = await fs.readFile(path.join(root, relPath));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

function qrPathGroup({ value, x, y, size, cornerRadius = 8, strokeWidth = 3 }) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const count = qr.modules.size;
  const quiet = 4;
  const moduleSize = size / (count + quiet * 2);
  const totalSize = (count + quiet * 2) * moduleSize;
  const originX = x + (size - totalSize) / 2 + quiet * moduleSize;
  const originY = y + (size - totalSize) / 2 + quiet * moduleSize;
  const modules = [];
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.modules.get(row, col)) continue;
      const mx = originX + col * moduleSize;
      const my = originY + row * moduleSize;
      modules.push(
        `M${mx.toFixed(3)} ${my.toFixed(3)}h${moduleSize.toFixed(3)}v${moduleSize.toFixed(3)}h-${moduleSize.toFixed(3)}z`
      );
    }
  }
  return `<g id="qr-slot" data-field="QR_CODE">
  <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${cornerRadius}" fill="#fff" stroke="#000" stroke-width="${strokeWidth}"/>
  <path d="${modules.join("")}" fill="#000" shape-rendering="crispEdges"/>
</g>`;
}

function typeLocksForFace(width, height) {
  // 10 mL face is taller (≈484×608); 3 mL is nearly square (≈526×512).
  if (height >= 560 || width < 500) return TYPE_10ML;
  return TYPE_3ML;
}

/**
 * Build a website-only catalog label SVG sized exactly to vial face bounds.
 * Geometry is identical for every product on the same face size.
 */
export function buildWebsiteLabelSvg(product, geometry, defaults = {}) {
  const W = geometry.width;
  const H = geometry.height;
  const T = typeLocksForFace(W, H);
  const gapChars = Math.max(
    0,
    Math.min(
      4,
      Number(
        geometry.brandGapChars ??
          product.brandGapChars ??
          defaults.BRAND_GAP_CHARS ??
          1
      )
    )
  );

  const labelType =
    String(product.labelType || "CATALOG").toUpperCase() === "CALCULATOR"
      ? "CALCULATOR"
      : "CATALOG";
  const isCalculator = labelType === "CALCULATOR";
  const company = String(
    product.companyName ?? defaults.COMPANY_NAME ?? "UNDISCLOSED"
  ).toUpperCase();
  const header = String(
    product.headerCompanyName ?? defaults.HEADER_COMPANY_NAME ?? "UNDISCLOSED"
  ).toUpperCase();
  const peptide = String(product.labelName ?? "PEPTIDE").toUpperCase();
  const amount = product.amount;
  const unit = String(product.unit ?? "MG").toUpperCase();
  const form = String(
    product.formText ?? defaults.FORM_TEXT ?? "LYOPHILIZED POWDER"
  ).toUpperCase();
  const storagePrefix = String(defaults.STORAGE_PREFIX ?? "STORE AT");
  const storageTemp = String(
    product.storageTemp ?? defaults.STORAGE_TEMP ?? "36–46°F"
  );
  const storageLine = `${storagePrefix} ${storageTemp}`.toUpperCase();
  const diluentHeader = String(defaults.DILUENT_HEADER ?? "DILUENT").toUpperCase();
  const concHeader = String(
    defaults.CONCENTRATION_HEADER ?? "CONCENTRATION"
  ).toUpperCase();
  const doseHeader = String(
    defaults.DOSE_RANGE_HEADER ?? "DOSE RANGE"
  ).toUpperCase();
  const diluent = String(product.diluent ?? "");
  const concentration = String(product.concentration ?? "");
  const doseRange = String(product.doseRange ?? "");
  const doseUnits = String(product.doseUnits ?? "");
  const legal1 = String(
    product.legalLine1 ?? defaults.LEGAL_LINE_1 ?? "RESEARCH USE"
  );
  const legal2 = String(
    product.legalLine2 ?? defaults.LEGAL_LINE_2 ?? "NOT FOR HUMAN"
  );
  const legal3 = String(
    product.legalLine3 ?? defaults.LEGAL_LINE_3 ?? "CONSUMPTION"
  );
  const qrEnabled = bool(product.qrEnabled, bool(defaults.QR_ENABLED, true));
  const mascotEnabled = bool(
    product.mascotEnabled,
    bool(defaults.MASCOT_ENABLED, true)
  );
  const qrValue = String(
    product.qrUrlOverride ||
      product.qrValue ||
      `UD|${peptide}|${amount}${unit}|${labelType}`
  );

  // ---- Locked three-column geometry (name never moves these) ----
  const railW = Math.round(W * COL.rail);
  const rightW = Math.round(W * COL.right);
  const centerL = railW;
  const centerR = W - rightW;
  const centerW = centerR - centerL;
  const centerCx = centerL + centerW / 2;
  const rightCx = W - rightW / 2;

  // Shared vertical window — rail / center / QR share identical top & bottom.
  const padY = Math.max(12, Math.round(H * 0.03));
  const contentTop = padY;
  const contentBottom = H - padY;
  const contentH = contentBottom - contentTop;

  // ---- Left rail ----
  const companySize = T.company;
  const logoSize = Math.min(
    Math.round(railW * 0.82),
    Math.round(T.mascot * 0.85)
  );
  const logoY =
    contentBottom -
    logoSize -
    Math.round(H * 0.018) -
    (gapChars - 1) * Math.round(companySize * 0.55);
  const companyX = Math.round(railW * 0.55);
  const companyY = contentTop + contentH * 0.4;

  // ---- Center panel typography (locked sizes; name only shrinks to min) ----
  const headerSize = T.header;
  const peptideSize = fitFontSize(
    peptide,
    centerW * 0.94,
    T.namePreferred,
    T.nameMin,
    T.nameMax
  );
  const amountDigits = String(amount);
  const amountSize = fitFontSize(
    `${amountDigits} ${unit}`,
    centerW * T.barWidthFrac * 0.9,
    T.amount,
    T.amountMin,
    T.amountMax
  );
  const unitSize = Math.min(
    T.unit,
    Math.max(26, Math.round(amountSize * 0.46))
  );
  const formSize = T.form;
  const storageSize = T.storage;
  const barH = T.barH;
  const barW = Math.round(centerW * T.barWidthFrac);
  const barX = centerCx - barW / 2;

  // Locked vertical rhythm — identical for every product on this face
  const headerY = contentTop + Math.round(contentH * 0.1);
  const peptideY = contentTop + Math.round(contentH * 0.3);
  const barY = contentTop + Math.round(contentH * 0.38);
  const amountY = barY + Math.round(barH * 0.7);
  const formY = contentTop + Math.round(contentH * 0.68);
  const storageY = contentTop + Math.round(contentH * 0.84);

  // ---- Right QR panel — square QR, locked mascot ----
  const qrSize = Math.max(
    T.qr,
    Math.min(Math.round(rightW * 0.86), Math.round(contentH * 0.36))
  );
  const qrX = Math.round(rightCx - qrSize / 2);
  const qrY = contentTop + Math.round(contentH * 0.38);
  const mascotSize = T.mascot;
  const mascotX = Math.round(rightCx - mascotSize / 2);
  const mascotY = Math.max(
    contentTop + 4,
    qrY - mascotSize - Math.round(H * 0.016)
  );
  const legalSize = T.legal;
  const legalY1 = qrY + qrSize + Math.round(contentH * 0.06);
  const legalY2 = legalY1 + Math.round(legalSize * 1.35);
  const legalY3 = legalY2 + Math.round(legalSize * 1.35);

  const brandHref =
    geometry.brandDataUri ||
    fileHref("assets/brand/UD_Brand_Mark_White_Transparent_Cropped.png");
  const mascotHref =
    geometry.mascotDataUri ||
    fileHref("assets/brand/UD_Sentinel_Mascot_Black_Transparent.png");

  const qrMarkup = qrEnabled
    ? qrPathGroup({ value: qrValue, x: qrX, y: qrY, size: qrSize })
    : "";
  const mascotBlock = mascotEnabled
    ? `<image id="mascot-icon" href="${mascotHref}" xlink:href="${mascotHref}" x="${mascotX}" y="${mascotY}" width="${mascotSize}" height="${mascotSize}" preserveAspectRatio="xMidYMid meet"/>`
    : "";

  let centerLower = "";
  if (isCalculator) {
    const gridTop = contentTop + Math.round(contentH * 0.6);
    const gridBottom = contentBottom - Math.round(contentH * 0.02);
    const colW = centerW / 3;
    const headerPx = Math.max(12, Math.round(T.form * 0.75));
    const valuePx = Math.max(16, Math.round(T.form * 1.05));
    const unitsPx = Math.max(13, Math.round(valuePx * 0.78));
    const cells = [
      { header: diluentHeader, value: diluent, x: centerL + colW * 0.5 },
      { header: concHeader, value: concentration, x: centerL + colW * 1.5 },
      {
        header: doseHeader,
        value: doseRange,
        units: doseUnits,
        x: centerL + colW * 2.5,
      },
    ];
    const dividers = [1, 2]
      .map(
        (i) =>
          `<line x1="${centerL + colW * i}" y1="${gridTop}" x2="${centerL + colW * i}" y2="${gridBottom}" stroke="#000" stroke-width="1.5"/>`
      )
      .join("\n");
    const cellMarkup = cells
      .map((cell) => {
        const valueY = cell.units
          ? gridTop + (gridBottom - gridTop) * 0.48
          : gridTop + (gridBottom - gridTop) * 0.58;
        const unitsLine = cell.units
          ? `<text text-anchor="middle" x="${cell.x}" y="${valueY + unitsPx * 1.25}"
              font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-size="${unitsPx}"
              font-weight="800">${xml(cell.units)}</text>`
          : "";
        return `<text text-anchor="middle" x="${cell.x}" y="${gridTop + headerPx}"
            font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-size="${headerPx}"
            font-weight="900">${xml(cell.header)}</text>
          <text text-anchor="middle" x="${cell.x}" y="${valueY}"
            font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-size="${valuePx}"
            font-weight="900">${xml(cell.value || "—")}</text>
          ${unitsLine}`;
      })
      .join("\n");
    centerLower = `
  <line x1="${centerL + centerW * 0.02}" y1="${contentTop + Math.round(contentH * 0.56)}" x2="${centerR - centerW * 0.02}" y2="${contentTop + Math.round(contentH * 0.56)}" stroke="#000" stroke-width="2"/>
  ${dividers}
  ${cellMarkup}`;
  } else {
    centerLower = `
  <text id="form-text" x="${centerCx}" y="${formY}" text-anchor="middle"
    font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-size="${formSize}"
    font-weight="900" letter-spacing="0.4">${xml(form)}</text>
  <text id="storage-temp" x="${centerCx}" y="${storageY}" text-anchor="middle"
    font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-size="${storageSize}"
    font-weight="800">${xml(storageLine)}</text>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
  width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"
  data-renderer="website-front-facing" data-print-stretched="false"
  data-label-type="${labelType}"
  data-cols="rail:${COL.rail},center:${COL.center},right:${COL.right}">
  <defs>
    <style>
      text { fill: #000; text-rendering: geometricPrecision; }
      #company-name { fill: #fff; }
      #total-amount, #total-amount tspan { fill: #fff; }
      path, rect, line { shape-rendering: geometricPrecision; }
    </style>
  </defs>
  <!-- Rectangular face; ONE shared curved clip applied at vial placement -->
  <rect x="0" y="0" width="${W}" height="${H}" fill="#fff"/>

  <!-- Left brand rail: full-bleed to left edge, shared top/bottom with face -->
  <rect id="left-brand-rail" x="0" y="0" width="${railW}" height="${H}" fill="#000"/>
  <text id="company-name" text-anchor="middle" dominant-baseline="middle"
    fill="#fff" font-family="Arial Narrow,Arial,Helvetica,sans-serif"
    font-size="${companySize}" font-weight="900" letter-spacing="2"
    transform="translate(${companyX} ${companyY}) rotate(-90)">${xml(company)}</text>
  <image id="brand-logo" href="${brandHref}" xlink:href="${brandHref}"
    x="${Math.round((railW - logoSize) / 2)}" y="${logoY}"
    width="${logoSize}" height="${logoSize}"
    preserveAspectRatio="xMidYMid meet" data-brand-gap-chars="${gapChars}"/>

  <!-- Center panel -->
  <text id="header-company-name" x="${centerCx}" y="${headerY}" text-anchor="middle"
    font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-size="${headerSize}"
    font-weight="900" letter-spacing="1.5">— ${xml(header)} —</text>
  <text id="peptide-name" x="${centerCx}" y="${peptideY}" text-anchor="middle"
    font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-size="${peptideSize}"
    font-weight="900" letter-spacing="-0.5">${xml(peptide)}</text>
  <rect id="amount-bar" x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="4" fill="#000"/>
  <text id="total-amount" x="${centerCx}" y="${amountY}" text-anchor="middle" fill="#fff"
    font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-size="${amountSize}" font-weight="900">
    ${xml(amountDigits)} <tspan font-size="${unitSize}">${xml(unit)}</tspan>
  </text>
  ${centerLower}

  <!-- Right divider spans FULL face height so panels share identical edges -->
  <line id="panel-divider" x1="${centerR}" y1="0" x2="${centerR}" y2="${H}"
    stroke="#000" stroke-width="2"/>
  ${mascotBlock}
  ${qrMarkup}
  <text id="legal-line-1" x="${rightCx}" y="${legalY1}" text-anchor="middle"
    font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-size="${legalSize}"
    font-weight="900">${xml(legal1)}</text>
  <text id="legal-line-2" x="${rightCx}" y="${legalY2}" text-anchor="middle"
    font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-size="${legalSize}"
    font-weight="900">${xml(legal2)}</text>
  <text id="legal-line-3" x="${rightCx}" y="${legalY3}" text-anchor="middle"
    font-family="Arial Narrow,Arial,Helvetica,sans-serif" font-size="${legalSize}"
    font-weight="900">${xml(legal3)}</text>
</svg>`;
}

/**
 * Rasterize website label at exact vial-face pixel size (no print stretch).
 */
export async function renderWebsiteLabelPng(
  product,
  geometry,
  defaults = {},
  assetCache = null
) {
  const cache = assetCache || {};
  if (!cache.brandDataUri) {
    cache.brandDataUri = await dataUriPng(
      "assets/brand/UD_Brand_Mark_White_Transparent_Cropped.png"
    );
  }
  if (!cache.mascotDataUri) {
    cache.mascotDataUri = await dataUriPng(
      "assets/brand/UD_Sentinel_Mascot_Black_Transparent.png"
    );
  }
  const svg = buildWebsiteLabelSvg(
    product,
    {
      ...geometry,
      brandDataUri: cache.brandDataUri,
      mascotDataUri: cache.mascotDataUri,
    },
    defaults
  );

  // Render at 2× then downscale for crisp type/QR — preserveAspect, never distort
  const scale = 2;
  const hiW = geometry.width * scale;
  const hiH = geometry.height * scale;
  const png = await sharp(Buffer.from(svg))
    .resize(hiW, hiH, {
      fit: "fill",
      kernel: "lanczos3",
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return sharp(png)
    .resize(geometry.width, geometry.height, {
      fit: "fill",
      kernel: "lanczos3",
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

export function geometryFromProfile(profile) {
  const bounds = profile.labelBoundsPx;
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  const clipPathD =
    profile.websiteClipPathD ||
    (width === 526 && height === 512
      ? "M0 7 Q263 0 526 7 L526 505 Q263 512 0 505 Z"
      : (() => {
          const curve = Math.max(6, Math.round(height * 0.014));
          return `M0 ${curve} Q${Math.round(width / 2)} 0 ${width} ${curve} L${width} ${height - curve} Q${Math.round(width / 2)} ${height} 0 ${height - curve} Z`;
        })());
  return {
    width,
    height,
    clipPathD,
    left: bounds.left,
    top: bounds.top,
  };
}
