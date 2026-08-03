/**
 * Canonical Undisclosed label renderer — one entry for all surfaces.
 *
 *   renderUDLabel({ product, labelType, labelSize, outputMode, overrides })
 *
 * outputMode:
 *   PRINT_FLAT    — exact NIIMBOT M2 SVG templates → print / preview PNG
 *   WEBSITE_FLAT  — front-facing reflow face PNG (never stretch print AR)
 *   WEBSITE_VIAL   — WEBSITE_FLAT placed on stock vial (1024×1536)
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { generateLabel } from "./generate-label.mjs";
import {
  buildWebsiteLabelSvg,
  geometryFromProfile,
  renderWebsiteLabelPng,
} from "./render-website-label.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

export const OUTPUT_MODES = Object.freeze([
  "PRINT_FLAT",
  "WEBSITE_FLAT",
  "WEBSITE_VIAL",
]);

const ASSET_VERSION = "v3";

function resolveRoot() {
  return root;
}

async function loadCatalog() {
  return JSON.parse(
    await fs.readFile(path.join(root, "data/catalog.json"), "utf8")
  );
}

async function loadPlacement() {
  return JSON.parse(
    await fs.readFile(path.join(root, "config/vial-placement.json"), "utf8")
  );
}

function normalizeLabelType(value) {
  return String(value || "CATALOG").toUpperCase() === "CALCULATOR"
    ? "CALCULATOR"
    : "CATALOG";
}

function normalizeLabelSize(value, vialMl) {
  const raw = String(value || "").toLowerCase();
  if (raw === "50x30" || raw === "40x20") return raw;
  return Number(vialMl) >= 8 ? "50x30" : "40x20";
}

function profileForProduct(product, labelSize) {
  const size = normalizeLabelSize(labelSize, product?.vialMl);
  const text = `${product?.labelName || ""} ${product?.fullProductName || ""}`;
  if (
    String(product?.contentsType || "").toUpperCase() === "LIQUID" ||
    /^B12$/i.test(String(product?.labelName || "").trim()) ||
    /\bvitamin\s*b\s*12\b/i.test(text) ||
    /\bmethylcobalamin\b/i.test(text)
  ) {
    return "10ML_B12_LIQUID";
  }
  if (size === "50x30") return "10ML_WHITE";
  const material = String(product?.materialColor || product?.visualType || "")
    .toUpperCase();
  if (material.includes("BLUE") || /KLOW|GLOW|GHK/.test(String(product?.labelName || ""))) {
    return "3ML_BLUE";
  }
  return product?.placementProfile || "3ML_WHITE";
}

function mergeProduct(product, overrides = {}, labelType, labelSize) {
  return {
    ...product,
    labelType,
    labelSize,
    labelName: overrides.PEPTIDE_NAME ?? overrides.labelName ?? product.labelName,
    amount: overrides.TOTAL_AMOUNT ?? overrides.amount ?? product.amount,
    unit: overrides.UNIT ?? overrides.unit ?? product.unit,
    formText: overrides.FORM_TEXT ?? product.formText,
    storageTemp: overrides.STORAGE_TEMP ?? product.storageTemp,
    diluent: overrides.DILUENT ?? product.diluent,
    concentration: overrides.CONCENTRATION ?? product.concentration,
    doseRange: overrides.DOSE_RANGE ?? product.doseRange,
    doseUnits: overrides.DOSE_UNITS ?? product.doseUnits,
    qrUrlOverride:
      overrides.QR_VALUE ?? overrides.qrUrlOverride ?? product.qrUrlOverride,
    qrValue: overrides.QR_VALUE ?? product.qrValue,
    qrEnabled: overrides.QR_ENABLED ?? product.qrEnabled,
    mascotEnabled: overrides.MASCOT_ENABLED ?? product.mascotEnabled,
    brandGapChars: overrides.BRAND_GAP_CHARS ?? product.brandGapChars,
    companyName: overrides.COMPANY_NAME ?? product.companyName,
    headerCompanyName:
      overrides.HEADER_COMPANY_NAME ?? product.headerCompanyName,
    legalLine1: overrides.LEGAL_LINE_1 ?? product.legalLine1,
    legalLine2: overrides.LEGAL_LINE_2 ?? product.legalLine2,
    legalLine3: overrides.LEGAL_LINE_3 ?? product.legalLine3,
  };
}

/**
 * Place a website-face PNG onto the stock vial with ONE shared curved clip.
 */
export async function placeWebsiteFaceOnVial({
  labelPng,
  profileName,
  outputPath = null,
  format = "png",
}) {
  const placement = await loadPlacement();
  const profile = placement.profiles[profileName];
  if (!profile) throw new Error(`Unknown placement profile: ${profileName}`);
  const basePath = path.join(root, profile.baseAsset);
  const geometry = geometryFromProfile(profile);
  const { width, height, clipPathD, left, top } = geometry;

  const meta = await sharp(labelPng).metadata();
  if (meta.width !== width || meta.height !== height) {
    throw new Error(
      `Website label must be ${width}x${height}, got ${meta.width}x${meta.height}`
    );
  }

  const mask = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <path d="${clipPathD}" fill="white"/>
    </svg>
  `);
  const shade = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <clipPath id="clip"><path d="${clipPathD}"/></clipPath>
        <linearGradient id="cylinder" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#707070" stop-opacity="0.22"/>
          <stop offset="0.13" stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="0.87" stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="1" stop-color="#707070" stop-opacity="0.22"/>
        </linearGradient>
      </defs>
      <g clip-path="url(#clip)">
        <rect width="${width}" height="${height}" fill="url(#cylinder)"/>
      </g>
    </svg>
  `);

  const wrappedLabel = await sharp(labelPng)
    .ensureAlpha()
    .composite([
      { input: mask, blend: "dest-in" },
      { input: shade, blend: "multiply" },
    ])
    .png()
    .toBuffer();

  const full = await sharp(basePath)
    .composite([{ input: wrappedLabel, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  if (outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    if (format === "webp") {
      await sharp(full).webp({ quality: 88, effort: 4 }).toFile(outputPath);
    } else {
      await fs.writeFile(outputPath, full);
    }
  }

  return {
    buffer: full,
    width: placement.canvas.widthPx,
    height: placement.canvas.heightPx,
    geometry,
    profileName,
  };
}

/**
 * @param {object} args
 * @param {object} args.product — workbook/catalog row (or free-form calc fields)
 * @param {"CATALOG"|"CALCULATOR"} [args.labelType]
 * @param {"40x20"|"50x30"} [args.labelSize]
 * @param {"PRINT_FLAT"|"WEBSITE_FLAT"|"WEBSITE_VIAL"} args.outputMode
 * @param {object} [args.overrides] — field overrides (DILUENT, QR_VALUE, …)
 * @param {string} [args.outputDir]
 * @param {string} [args.outputStem]
 * @param {boolean} [args.writeFiles=true]
 */
export async function renderUDLabel({
  product,
  labelType,
  labelSize,
  outputMode,
  overrides = {},
  outputDir,
  outputStem,
  writeFiles = true,
} = {}) {
  if (!product) throw new Error("renderUDLabel: product is required");
  const mode = String(outputMode || "").toUpperCase();
  if (!OUTPUT_MODES.includes(mode)) {
    throw new Error(
      `renderUDLabel: outputMode must be one of ${OUTPUT_MODES.join(", ")}`
    );
  }

  const catalog = await loadCatalog();
  const type = normalizeLabelType(labelType ?? product.labelType);
  const size = normalizeLabelSize(
    labelSize ?? product.labelSize,
    product.vialMl
  );
  const merged = mergeProduct(product, overrides, type, size);
  const defaults = catalog.defaults || {};

  if (mode === "PRINT_FLAT") {
    const result = await generateLabel(merged, {
      ...overrides,
      labelType: type,
      labelSize: size,
      outputDir:
        outputDir ||
        path.join(root, "output", "labels", ASSET_VERSION),
      outputStem:
        outputStem ||
        `${merged.labelOutputStem || "label"}_${ASSET_VERSION}`,
    });
    return {
      mode,
      labelType: type,
      labelSize: size,
      assetVersion: ASSET_VERSION,
      ...result,
      previewPng: writeFiles
        ? await fs.readFile(result.previewPath)
        : null,
      printPng: writeFiles ? await fs.readFile(result.printPath) : null,
      svg: writeFiles ? await fs.readFile(result.svgPath, "utf8") : null,
    };
  }

  const placement = await loadPlacement();
  const profileName = profileForProduct(merged, size);
  const profile = placement.profiles[profileName];
  const geometry = geometryFromProfile(profile);
  const facePng = await renderWebsiteLabelPng(
    {
      ...merged,
      labelType: type,
    },
    geometry,
    defaults
  );

  if (mode === "WEBSITE_FLAT") {
    let facePath = null;
    if (writeFiles) {
      const dir =
        outputDir || path.join(root, "output", "website-labels", ASSET_VERSION);
      await fs.mkdir(dir, { recursive: true });
      const stem =
        outputStem ||
        `${merged.websiteOutputStem || merged.labelName}_${ASSET_VERSION}_Face`;
      facePath = path.join(dir, `${stem}.png`);
      await fs.writeFile(facePath, facePng);
      const svg = buildWebsiteLabelSvg(merged, geometry, defaults);
      await fs.writeFile(path.join(dir, `${stem}.svg`), svg);
    }
    return {
      mode,
      labelType: type,
      labelSize: size,
      assetVersion: ASSET_VERSION,
      profileName,
      geometry,
      facePath,
      facePng,
      width: geometry.width,
      height: geometry.height,
    };
  }

  // WEBSITE_VIAL
  const vialStem =
    outputStem ||
    `${merged.websiteOutputStem || merged.labelName}_${ASSET_VERSION}`;
  const vialDir =
    outputDir || path.join(root, "output", "vials", ASSET_VERSION);
  const vialPath = writeFiles
    ? path.join(vialDir, `${vialStem}.png`)
    : null;
  const placed = await placeWebsiteFaceOnVial({
    labelPng: facePng,
    profileName,
    outputPath: vialPath,
    format: "png",
  });

  return {
    mode,
    labelType: type,
    labelSize: size,
    assetVersion: ASSET_VERSION,
    profileName,
    geometry: placed.geometry,
    facePng,
    vialPath,
    vialPng: placed.buffer,
    width: placed.width,
    height: placed.height,
  };
}

export function catalogAssetVersion() {
  return ASSET_VERSION;
}

export { resolveRoot as labelSystemRoot };
