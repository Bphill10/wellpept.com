/**
 * Locked-master label renderer — content replacement only.
 *
 * Source of truth: locked-masters/labels/*_EDIT_CONTENT_ONLY.svg
 * Never reconstruct rails, panels, amount bar, dividers, or geometry.
 * Scale the complete SVG as one unit when placing on a vial.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { resolveLabelDisplayName } from "./resolve-label-display-name.mjs";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const mastersRoot = path.join(root, "locked-masters");

export const LOCKED_LABEL_MASTERS = Object.freeze({
  "40x20|CATALOG": "labels/01_3mL_Catalog_40x20_EDIT_CONTENT_ONLY.svg",
  "40x20|CALCULATOR": "labels/02_3mL_Calculator_40x20_EDIT_CONTENT_ONLY.svg",
  "50x30|CATALOG": "labels/03_10mL_Catalog_50x30_EDIT_CONTENT_ONLY.svg",
  "50x30|CALCULATOR": "labels/04_10mL_Calculator_50x30_EDIT_CONTENT_ONLY.svg",
});

export const LOCKED_VIAL_STOCKS = Object.freeze({
  "3ML_WHITE": "vials/01_3mL_White_Powder_LOCKED.png",
  "3ML_BLUE": "vials/02_3mL_Cobalt_Blue_Powder_LOCKED.png",
  "10ML_WHITE": "vials/03_10mL_White_Powder_LOCKED.png",
  "10ML_B12_LIQUID": "vials/04_10mL_B12_Ruby_Red_Liquid_75pct_LOCKED.png",
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

function fitFontSize(text, maxWidth, preferred, minSize) {
  const estimate = estimatedTextWidth(text, preferred);
  if (estimate <= maxWidth) return preferred;
  return Math.max(minSize, Math.floor(preferred * (maxWidth / estimate)));
}

export function resolveLockedLabelRel(product = {}) {
  const size =
    Number(product.vialMl) >= 8 || String(product.labelSize || "") === "50x30"
      ? "50x30"
      : "40x20";
  const type =
    String(product.labelType || "CATALOG").toUpperCase() === "CALCULATOR"
      ? "CALCULATOR"
      : "CATALOG";
  return LOCKED_LABEL_MASTERS[`${size}|${type}`];
}

export function resolveLockedVialRel(profileName = "3ML_WHITE") {
  const key = String(profileName || "3ML_WHITE").toUpperCase();
  return LOCKED_VIAL_STOCKS[key] || LOCKED_VIAL_STOCKS["3ML_WHITE"];
}

function replaceTextField(svg, field, value) {
  const safe = xml(value);
  // Replace {{FIELD}} placeholders and existing text content inside data-field nodes.
  let out = svg.replaceAll(`{{${field}}}`, safe);
  out = out.replace(
    new RegExp(
      `(<(?:text|tspan)[^>]*data-field="${field}"[^>]*>)([\\s\\S]*?)(</(?:text|tspan)>)`,
      "g"
    ),
    (_, open, _old, close) => `${open}${safe}${close}`
  );
  return out;
}

function replaceAmountUnit(svg, amount, unit) {
  const amountSafe = xml(amount);
  const unitSafe = xml(unit);
  let out = svg.replaceAll("{{TOTAL_AMOUNT}}", amountSafe).replaceAll("{{UNIT}}", unitSafe);
  // Combined amount node with nested unit tspan
  out = out.replace(
    /(<text[^>]*data-field="TOTAL_AMOUNT"[^>]*>)([\s\S]*?)(<\/text>)/g,
    (match, open, inner, close) => {
      if (/data-field="UNIT"/.test(inner)) {
        const nextInner = inner
          .replace(/^[^<]+/, `${amountSafe} `)
          .replace(
            /(<tspan[^>]*data-field="UNIT"[^>]*>)([\s\S]*?)(<\/tspan>)/,
            `$1${unitSafe}$3`
          );
        return `${open}${nextInner}${close}`;
      }
      return `${open}${amountSafe} <tspan data-field="UNIT" font-size="39">${unitSafe}</tspan>${close}`;
    }
  );
  return out;
}

async function buildQrSvgGroup({ value, x, y, size, cornerRadius = 14, strokeWidth = 5 }) {
  const qr = QRCode.create(String(value || "UD"), { errorCorrectionLevel: "M" });
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
  return `<g id="qr-slot" data-field="QR_IMAGE" data-replaceable="true" data-enabled="true">
  <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${cornerRadius}" fill="#fff" stroke="#000" stroke-width="${strokeWidth}"/>
  <path d="${modules.join("")}" fill="#000" shape-rendering="crispEdges"/>
</g>`;
}

function applyAutoFit(svg, field, text, defaults = {}) {
  const re = new RegExp(
    `<text([^>]*data-field="${field}"[^>]*)>([\\s\\S]*?)</text>`,
    "g"
  );
  return svg.replace(re, (full, attrs, content) => {
    const maxWidth = Number(
      /data-max-width="(\d+)"/.exec(attrs)?.[1] || defaults.maxWidth || 700
    );
    const minSize = Number(
      /data-min-font-size="(\d+)"/.exec(attrs)?.[1] || defaults.minSize || 38
    );
    const preferred = Number(/font-size="([\d.]+)"/.exec(attrs)?.[1] || 96);
    if (!/data-auto-fit="true"/.test(attrs)) {
      return full;
    }
    const nextSize = fitFontSize(text, maxWidth, preferred, minSize);
    const nextAttrs = attrs.replace(
      /font-size="[\d.]+"/,
      `font-size="${nextSize}"`
    );
    return `<text${nextAttrs}>${content}</text>`;
  });
}

/**
 * Fill locked SVG template — text + QR only. Geometry untouched.
 */
export async function fillLockedLabelSvg(product = {}, defaults = {}) {
  const rel = resolveLockedLabelRel(product);
  if (!rel) throw new Error("No locked label master for product");
  const svgPath = path.join(mastersRoot, rel);
  let svg = await fs.readFile(svgPath, "utf8");

  const fullName = String(product.labelName ?? "PEPTIDE").toUpperCase();
  const nameAttrs =
    /<text[^>]*data-field="PRODUCT_NAME"[^>]*>/.exec(svg)?.[0] || "";
  const lockedNameSize = Number(/font-size="([\d.]+)"/.exec(nameAttrs)?.[1] || 96);
  const lockedNameMax = Number(
    /data-max-width="([\d.]+)"/.exec(nameAttrs)?.[1] || 700
  );
  const peptide = resolveLabelDisplayName(product, {
    fontSize: lockedNameSize,
    maxWidth: lockedNameMax,
  });
  const amount = product.amount
  const unit = String(product.unit ?? "MG").toUpperCase();
  const company = String(
    product.companyName ?? defaults.COMPANY_NAME ?? "UNDISCLOSED"
  ).toUpperCase();
  const header = String(
    product.headerCompanyName ?? defaults.HEADER_COMPANY_NAME ?? "UNDISCLOSED"
  ).toUpperCase();
  const form = String(
    product.formText ?? defaults.FORM_TEXT ?? "LYOPHILIZED POWDER"
  ).toUpperCase();
  const storagePrefix = String(defaults.STORAGE_PREFIX ?? "STORE AT");
  const storageTemp = String(
    product.storageTemp ?? defaults.STORAGE_TEMP ?? "36–46°F"
  );
  const legal1 = String(
    product.legalLine1 ?? defaults.LEGAL_LINE_1 ?? "RESEARCH USE"
  );
  const legal2 = String(
    product.legalLine2 ?? defaults.LEGAL_LINE_2 ?? "NOT FOR HUMAN"
  );
  const legal3 = String(
    product.legalLine3 ?? defaults.LEGAL_LINE_3 ?? "CONSUMPTION"
  );
  const diluent = String(product.diluent ?? "");
  const concentration = String(product.concentration ?? "");
  const doseRange = String(product.doseRange ?? "");
  const doseUnits = String(product.doseUnits ?? "");
  const qrEnabled = bool(product.qrEnabled, bool(defaults.QR_ENABLED, true));
  const qrValue = String(
    product.coaUrl ||
      product.qrUrlOverride ||
      product.qrValue ||
      "https://www.wellpept.com"
  );

  svg = replaceTextField(svg, "COMPANY_NAME", company);
  svg = replaceTextField(svg, "HEADER_COMPANY_NAME", header);
  svg = replaceTextField(svg, "PRODUCT_NAME", peptide);
  svg = replaceTextField(svg, "PEPTIDE_NAME", peptide);
  svg = replaceAmountUnit(svg, amount, unit);
  svg = replaceTextField(svg, "FORM_TEXT", form);
  svg = replaceTextField(svg, "STORAGE_TEMP", `${storagePrefix} ${storageTemp}`);
  svg = replaceTextField(svg, "STORAGE_PREFIX", storagePrefix);
  svg = replaceTextField(svg, "LEGAL_LINE_1", legal1);
  svg = replaceTextField(svg, "LEGAL_LINE_2", legal2);
  svg = replaceTextField(svg, "LEGAL_LINE_3", legal3);
  svg = replaceTextField(svg, "DILUENT", diluent);
  svg = replaceTextField(svg, "CONCENTRATION", concentration);
  svg = replaceTextField(svg, "DOSE_RANGE", doseRange);
  svg = replaceTextField(svg, "DOSE_UNITS", doseUnits);

  // Never shrink fonts — catalog abbrev used when full name won't fit.

  // Replace QR placeholder group in-place (locked x/y/size from template)
  const qrMatch = svg.match(
    /<g id="qr-slot"[^>]*>[\s\S]*?<\/g>/
  );
  if (qrMatch && qrEnabled) {
    const slot = qrMatch[0];
    const x = Number(/<rect[^>]*\sx="([\d.]+)"/.exec(slot)?.[1] || 940);
    const y = Number(/<rect[^>]*\sy="([\d.]+)"/.exec(slot)?.[1] || 176);
    const size = Number(/<rect[^>]*\swidth="([\d.]+)"/.exec(slot)?.[1] || 210);
    const rx = Number(/rx="([\d.]+)"/.exec(slot)?.[1] || 14);
    const sw = Number(/stroke-width="([\d.]+)"/.exec(slot)?.[1] || 5);
    const qrGroup = await buildQrSvgGroup({
      value: qrValue,
      x,
      y,
      size,
      cornerRadius: rx,
      strokeWidth: sw,
    });
    svg = svg.replace(slot, qrGroup);
  } else if (!qrEnabled) {
    svg = svg.replace(/<g id="qr-slot"[^>]*>[\s\S]*?<\/g>/, "");
  }

  return { svg, masterRel: rel, svgPath };
}

/**
 * Rasterize filled locked SVG at native aspect (never distort).
 */
export async function renderLockedLabelPng(product = {}, defaults = {}) {
  const { svg, masterRel } = await fillLockedLabelSvg(product, defaults);
  const widthMatch = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const vbW = Number(widthMatch?.[1] || 1200);
  const vbH = Number(widthMatch?.[2] || 600);
  // High-res raster matching locked PNG masters (~1800 wide)
  const outW = vbW >= 1400 ? Math.round(vbW) : 1800;
  const outH = Math.round((outW * vbH) / vbW);
  const png = await sharp(Buffer.from(svg))
    .resize(outW, outH, { fit: "fill", kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toBuffer();
  return { png, width: outW, height: outH, masterRel, aspect: outW / outH };
}

/**
 * Place locked label on locked vial stock.
 * Mount the COMPLETE filled SVG as one unit into:
 *   width  = full straight-body width (both visible sides / wrap look)
 *   height = 57–60% of straight body (≈20% glass above & below)
 * Content fields only were replaced earlier — no per-section resize.
 */
export async function placeLockedLabelOnVial({
  labelPng,
  labelWidth,
  labelHeight,
  profile,
  profileName,
  outputPath,
  alsoSaveFullPng = null,
  basePathOverride = null,
  transparentBackground = false,
}) {
  const body = profile.bodyBoundsPx;
  const bodyW = body.right - body.left;
  const bodyH = body.bottom - body.top;

  const topClearFrac = Number(profile.topClearFraction ?? 0.20);
  const labelFrac = Number(profile.labelFraction ?? 0.60);
  const bottomClearFrac = Number(profile.bottomClearFraction ?? 0.20);
  const fractionTotal = topClearFrac + labelFrac + bottomClearFrac;
  if (Math.abs(fractionTotal - 1) > 0.0001) {
    throw new Error(
      `${profileName}: placement fractions must total 1.0; received ${fractionTotal}`
    );
  }

  // Every vial size uses the same body-relative rule. A profile defines only
  // the usable straight body; the label rectangle is always derived 20/60/20.
  const faceW = bodyW;
  const faceH = Math.max(1, Math.round(bodyH * labelFrac));
  const left = body.left;
  const top = body.top + Math.round(bodyH * topClearFrac);

  // Trim anti-aliased empty rim so the black rail sits on the physical left edge.
  const trimmed = await sharp(labelPng)
    .trim({ threshold: 8 })
    .ensureAlpha()
    .png()
    .toBuffer();

  // One-unit mount into the placement rectangle (same for every product).
  const face = await sharp(trimmed)
    .resize(faceW, faceH, { fit: "fill", kernel: "lanczos3" })
    .ensureAlpha()
    .png()
    .toBuffer();

  const curve = Math.max(6, Math.round(faceH * 0.014));
  const mid = Math.round(faceW / 2);
  const clipPathD =
    `M0 ${curve} Q${mid} 0 ${faceW} ${curve} L${faceW} ${faceH - curve} Q${mid} ${faceH} 0 ${faceH - curve} Z`;

  const mask = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${faceW}" height="${faceH}" viewBox="0 0 ${faceW} ${faceH}">
      <path d="${clipPathD}" fill="white"/>
    </svg>
  `);
  const shade = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${faceW}" height="${faceH}" viewBox="0 0 ${faceW} ${faceH}">
      <defs>
        <clipPath id="clip"><path d="${clipPathD}"/></clipPath>
        <linearGradient id="cylinder" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#606060" stop-opacity="0.30"/>
          <stop offset="0.12" stop-color="#ffffff" stop-opacity="0.06"/>
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="0.88" stop-color="#ffffff" stop-opacity="0.06"/>
          <stop offset="1" stop-color="#606060" stop-opacity="0.30"/>
        </linearGradient>
      </defs>
      <g clip-path="url(#clip)">
        <rect width="${faceW}" height="${faceH}" fill="url(#cylinder)"/>
      </g>
    </svg>
  `);

  const wrapped = await sharp(face)
    .ensureAlpha()
    .composite([
      { input: mask, blend: "dest-in" },
      { input: shade, blend: "multiply" },
    ])
    .png()
    .toBuffer();

  const vialRel = resolveLockedVialRel(profileName);
  const basePath = basePathOverride || path.join(mastersRoot, vialRel);
  let full = await sharp(basePath)
    .composite([{ input: wrapped, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  if (transparentBackground) {
    const source = await sharp(full)
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    const alpha = Buffer.alloc(source.info.width * source.info.height);
    const capProfiles = {
      "3ML_WHITE": [
        { left: 0.23, right: 0.765, top: 0.118, bottom: 0.177, radius: 0.018 },
        { left: 0.248, right: 0.741, top: 0.177, bottom: 0.254, radius: 0.012 },
      ],
      "3ML_BLUE": [
        { left: 0.23, right: 0.765, top: 0.118, bottom: 0.177, radius: 0.018 },
        { left: 0.248, right: 0.741, top: 0.177, bottom: 0.254, radius: 0.012 },
      ],
      "10ML_WHITE": [
        { left: 0.278, right: 0.79, top: 0.083, bottom: 0.149, radius: 0.018 },
        { left: 0.302, right: 0.767, top: 0.149, bottom: 0.21, radius: 0.012 },
      ],
      "10ML_B12_LIQUID": [
        { left: 0.278, right: 0.79, top: 0.083, bottom: 0.149, radius: 0.018 },
        { left: 0.302, right: 0.767, top: 0.149, bottom: 0.21, radius: 0.012 },
      ],
    };
    const capSegments =
      capProfiles[String(profileName).toUpperCase()] || capProfiles["3ML_WHITE"];
    const inRoundedCap = (x, y) => {
      return capSegments.some((segment) => {
        const segmentLeft = segment.left * source.info.width;
        const segmentRight = segment.right * source.info.width;
        const segmentTop = segment.top * source.info.height;
        const segmentBottom = segment.bottom * source.info.height;
        const radius = segment.radius * source.info.width;
        if (
          x < segmentLeft ||
          x > segmentRight ||
          y < segmentTop ||
          y > segmentBottom
        ) {
          return false;
        }
        const nx = Math.min(x - segmentLeft, segmentRight - x);
        const ny = Math.min(y - segmentTop, segmentBottom - y);
        if (nx >= radius || ny >= radius) return true;
        const dx = radius - nx;
        const dy = radius - ny;
        return dx * dx + dy * dy <= radius * radius;
      });
    };

    for (let y = 0; y < source.info.height; y += 1) {
      for (let x = 0; x < source.info.width; x += 1) {
        const pixel = y * source.info.width + x;
        const offset = pixel * source.info.channels;
        const r = source.data[offset];
        const g = source.data[offset + 1];
        const b = source.data[offset + 2];
        const brightest = Math.max(r, g, b);
        const darkest = Math.min(r, g, b);
        const chroma = brightest - darkest;
        let value = Math.max(0, Math.min(255, Math.round((brightest - 3) * 2.35 + chroma * 0.45)));

        const insideLabel =
          x >= left &&
          x <= left + faceW &&
          y >= top &&
          y <= top + faceH;
        if (insideLabel) value = 255;
        else if (inRoundedCap(x, y) && brightest > 4) {
          value = Math.max(value, Math.min(245, brightest * 22));
        }

        alpha[pixel] = value;
      }
    }

    full = await sharp(source.data, {
      raw: {
        width: source.info.width,
        height: source.info.height,
        channels: source.info.channels,
      },
    })
      .joinChannel(alpha, {
        raw: {
          width: source.info.width,
          height: source.info.height,
          channels: 1,
        },
      })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const webp = await sharp(full)
    .webp({
      quality: 96,
      alphaQuality: 100,
      effort: 6,
      smartSubsample: true,
      preset: "picture",
    })
    .toBuffer();
  await fs.unlink(outputPath).catch((error) => {
    if (error?.code !== "ENOENT") throw error;
  });
  await fs.writeFile(outputPath, webp);
  if (alsoSaveFullPng) {
    await fs.mkdir(path.dirname(alsoSaveFullPng), { recursive: true });
    await fs.writeFile(alsoSaveFullPng, full);
  }
  return {
    outputPath,
    basePath,
    vialRel,
    faceW,
    faceH,
    left,
    top,
    labelFrac,
    sourceWidth: labelWidth,
    sourceHeight: labelHeight,
  };
}
