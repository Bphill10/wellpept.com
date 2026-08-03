import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode");
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

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

function safeStem(value) {
  return String(value)
    .replace(/\+/g, " PLUS ")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function qrGroup(value, slot) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const count = qr.modules.size;
  const quiet = slot.quietModules ?? 4;
  const moduleSize = Math.min(10, slot.size / (count + quiet * 2));
  const totalSize = (count + quiet * 2) * moduleSize;
  const originX = slot.x + (slot.size - totalSize) / 2 + quiet * moduleSize;
  const originY = slot.y + (slot.size - totalSize) / 2 + quiet * moduleSize;
  const modules = [];
  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.modules.get(row, col)) continue;
      const x = originX + col * moduleSize;
      const y = originY + row * moduleSize;
      modules.push(`M${x.toFixed(3)} ${y.toFixed(3)}h${moduleSize.toFixed(3)}v${moduleSize.toFixed(3)}h-${moduleSize.toFixed(3)}z`);
    }
  }
  return `<g id="qr-slot" data-field="QR_CODE" data-replaceable="true" data-enabled="true" data-qr-value="${xml(value)}"><rect x="${slot.x}" y="${slot.y}" width="${slot.size}" height="${slot.size}" rx="${slot.cornerRadius}" fill="#fff" stroke="#000" stroke-width="${slot.strokeWidth}"/><path d="${modules.join("")}" fill="#000" shape-rendering="crispEdges"/></g>`;
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

function fitText(svg, id, text) {
  const pattern = new RegExp(`(<text id="${id}"[^>]*)(>)([\\s\\S]*?<\\/text>)`);
  return svg.replace(pattern, (whole, open, close, content) => {
    const current = Number((open.match(/font-size="([0-9.]+)"/) || [])[1]);
    const maxWidth = Number((open.match(/data-max-width="([0-9.]+)"/) || [])[1]);
    const minSize = Number((open.match(/data-min-font-size="([0-9.]+)"/) || [])[1] || current);
    if (!current || !maxWidth) return whole;
    const estimate = estimatedTextWidth(text, current);
    const fitted = estimate > maxWidth ? Math.max(minSize, Math.floor(current * (maxWidth / estimate))) : current;
    return `${open.replace(/font-size="[0-9.]+"/, `font-size="${fitted}"`)}${close}${content}`;
  });
}

function applyBrandGap(svg, gapChars) {
  const clamped = Math.max(0, Math.min(4, Number(gapChars) || 0));
  return svg.replace(/<(g|image) id="brand-logo"([^>]*)>/, (whole, tag, attrs) => {
    const baseY = Number((attrs.match(/data-base-y="([0-9.]+)"/) || [])[1]);
    const step = Number((attrs.match(/data-gap-step="([0-9.]+)"/) || [])[1]);
    if (!baseY || !step) return whole.replace(/data-brand-gap-chars="[^"]*"/, `data-brand-gap-chars="${clamped}"`);
    const targetY = baseY + (clamped - 1) * step;
    let updated = attrs.replace(/data-brand-gap-chars="[^"]*"/, `data-brand-gap-chars="${clamped}"`);
    if (tag === "image") updated = updated.replace(/\sy="[0-9.-]+"/, ` y="${targetY}"`);
    else updated = updated.replace(/transform="translate\(([0-9.-]+)\s+[0-9.-]+\)/, `transform="translate($1 ${targetY})`);
    return `<${tag} id="brand-logo"${updated}>`;
  });
}

function hideElement(svg, id) {
  const pattern = new RegExp(`(<(?:image|g) id="${id}"[^>]*)(/?>)`);
  return svg.replace(pattern, (whole, open, end) => `${open} style="display:none"${end}`);
}

export async function generateLabel(product, overrides = {}) {
  const system = JSON.parse(await fs.readFile(path.join(root, "config/label-system.json"), "utf8"));
  const catalog = JSON.parse(await fs.readFile(path.join(root, "data/catalog.json"), "utf8"));
  const defaults = catalog.defaults;
  const labelType = String(overrides.labelType ?? product.labelType ?? "CATALOG").toUpperCase();
  const labelSize = String(overrides.labelSize ?? product.labelSize ?? (product.vialMl >= 10 ? "50x30" : "40x20"));
  const templateKey = `${labelType}_${labelSize}`;
  const templatePath = path.join(root, system.templates[templateKey]);
  let svg = await fs.readFile(templatePath, "utf8");

  const values = {
    COMPANY_NAME: overrides.COMPANY_NAME ?? product.companyName ?? defaults.COMPANY_NAME,
    HEADER_COMPANY_NAME: overrides.HEADER_COMPANY_NAME ?? product.headerCompanyName ?? defaults.HEADER_COMPANY_NAME,
    PEPTIDE_NAME: overrides.PEPTIDE_NAME ?? product.labelName,
    TOTAL_AMOUNT: overrides.TOTAL_AMOUNT ?? product.amount,
    UNIT: String(overrides.UNIT ?? product.unit).toUpperCase(),
    FORM_TEXT: overrides.FORM_TEXT ?? product.formText ?? defaults.FORM_TEXT,
    STORAGE_PREFIX: overrides.STORAGE_PREFIX ?? defaults.STORAGE_PREFIX,
    STORAGE_TEMP: overrides.STORAGE_TEMP ?? product.storageTemp ?? defaults.STORAGE_TEMP,
    DILUENT_HEADER: overrides.DILUENT_HEADER ?? defaults.DILUENT_HEADER,
    DILUENT: overrides.DILUENT ?? product.diluent ?? "",
    CONCENTRATION_HEADER: overrides.CONCENTRATION_HEADER ?? defaults.CONCENTRATION_HEADER,
    CONCENTRATION: overrides.CONCENTRATION ?? product.concentration ?? "",
    DOSE_RANGE_HEADER: overrides.DOSE_RANGE_HEADER ?? defaults.DOSE_RANGE_HEADER,
    DOSE_RANGE: overrides.DOSE_RANGE ?? product.doseRange ?? "",
    DOSE_UNITS: overrides.DOSE_UNITS ?? product.doseUnits ?? "",
    LEGAL_LINE_1: overrides.LEGAL_LINE_1 ?? product.legalLine1 ?? defaults.LEGAL_LINE_1,
    LEGAL_LINE_2: overrides.LEGAL_LINE_2 ?? product.legalLine2 ?? defaults.LEGAL_LINE_2,
    LEGAL_LINE_3: overrides.LEGAL_LINE_3 ?? product.legalLine3 ?? defaults.LEGAL_LINE_3,
  };

  for (const [field, value] of Object.entries(values)) svg = svg.replaceAll(`{{${field}}}`, xml(value));
  svg = fitText(svg, "peptide-name", values.PEPTIDE_NAME);
  svg = fitText(svg, "total-amount", `${values.TOTAL_AMOUNT} ${values.UNIT}`);

  const qrEnabled = bool(overrides.QR_ENABLED ?? product.qrEnabled, bool(defaults.QR_ENABLED, true));
  const mascotEnabled = bool(overrides.MASCOT_ENABLED ?? product.mascotEnabled, bool(defaults.MASCOT_ENABLED, true));
  const qrValue = String(overrides.QR_VALUE || product.qrUrlOverride || product.qrValue || `UD|${values.PEPTIDE_NAME}|${values.TOTAL_AMOUNT}${values.UNIT}|${labelType}`);
  if (qrEnabled) svg = svg.replace(/<g id="qr-slot"[\s\S]*?<\/g>/, qrGroup(qrValue, system.qrSlots[labelSize]));
  else svg = hideElement(svg, "qr-slot");
  if (!mascotEnabled) svg = hideElement(svg, "mascot-icon");
  svg = applyBrandGap(svg, overrides.BRAND_GAP_CHARS ?? product.brandGapChars ?? defaults.BRAND_GAP_CHARS ?? 1);

  const profile = system.print.profiles[labelSize];
  if (!profile) throw new Error(`Unsupported label size: ${labelSize}`);
  const outputDir = path.resolve(root, overrides.outputDir ?? "output/labels");
  await fs.mkdir(outputDir, { recursive: true });
  const stem = safeStem(overrides.outputStem ?? product.labelOutputStem ?? `${values.PEPTIDE_NAME}_${values.TOTAL_AMOUNT}${values.UNIT}_${labelSize}_${labelType}`);
  const svgPath = path.join(outputDir, `${stem}.svg`);
  const previewPath = path.join(outputDir, `${stem}_Preview.png`);
  const printPath = path.join(outputDir, `${stem}_M2_300dpi_1bit.png`);
  await fs.writeFile(svgPath, svg);

  const previewWidth = 1800;
  const previewHeight = Math.round(previewWidth * profile.heightPx / profile.widthPx);
  await sharp(Buffer.from(svg))
    .resize(previewWidth, previewHeight, { fit: "fill" })
    .flatten({ background: "#FFFFFF" })
    .png({ compressionLevel: 9 })
    .toFile(previewPath);

  await sharp(Buffer.from(svg))
    .resize(profile.widthPx, profile.heightPx, { fit: "fill" })
    .flatten({ background: "#FFFFFF" })
    .grayscale()
    .threshold(180)
    .png({ palette: true, colours: 2, dither: 0, compressionLevel: 9, resolution: 300 })
    .toFile(printPath);

  const metadata = await sharp(printPath).metadata();
  if (metadata.width !== profile.widthPx || metadata.height !== profile.heightPx) {
    throw new Error(`Bad print dimensions for ${stem}: ${metadata.width}x${metadata.height}`);
  }
  return { product: product.catalogId, labelType, labelSize, svgPath, previewPath, printPath, qrValue };
}

function parseArgs(argv) {
  const args = { sets: {} };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--set") {
      const [field, ...parts] = String(argv[++i] ?? "").split("=");
      args.sets[field] = parts.join("=");
    } else if (token.startsWith("--")) {
      const key = token.slice(2);
      args[key] = argv[++i];
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const catalog = JSON.parse(await fs.readFile(path.join(root, "data/catalog.json"), "utf8"));
  let product = null;
  if (args.id) product = catalog.products.find((item) => item.catalogId.toLowerCase() === String(args.id).toLowerCase());
  if (!product && args.name) {
    product = catalog.products.find((item) => item.labelName.toLowerCase() === String(args.name).toLowerCase() && (!args.amount || String(item.amount) === String(args.amount)));
  }
  if (!product) throw new Error("Product not found. Use --id UD-#### or --name NAME [--amount N].");
  const result = await generateLabel(product, {
    ...args.sets,
    labelType: args.type,
    labelSize: args.size,
    outputDir: args.output,
  });
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch((error) => {
    console.error(error.stack || error.message);
    process.exitCode = 1;
  });
}
