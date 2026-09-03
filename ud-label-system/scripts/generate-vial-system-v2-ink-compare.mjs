/**
 * Five-product website-card comparison only.
 *
 * Columns:
 *   1. current V2 (existing recolored catalog-v2-test renders — not regenerated)
 *   2. untouched photographed label + black ink
 *   3. untouched photographed label + optimized text rendering
 *
 * Sheets: 200×300 and 400×600. Each card is one Lanczos from the full master.
 * Does not touch production catalog or regenerate 303 products.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  compositeLabelOnPhotoMaster,
  masterPath,
  renderLockedLabelArtwork,
  resolveLabelPlacementKey,
  resolvePhotoMasterKey,
  resolvePlacementRect,
} from "./composite-label-on-photo-master.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(systemRoot, "..");

const CATALOG_PATH = path.join(systemRoot, "data/catalog.json");
const PLACEMENT_PATH = path.join(systemRoot, "config/vial-photo-placement.json");
const CURRENT_V2_DIR = path.join(repoRoot, "public/ud-labels/catalog-v2-test");
const REVIEW_DIR = path.join(systemRoot, "review");
const INK_DIR = path.join(REVIEW_DIR, "v2-ink-only");
const OPT_DIR = path.join(REVIEW_DIR, "v2-ink-optimized");

const FIVE_ML_DEMO = {
  enabled: true,
  catalogId: "UD-5ML-DEMO",
  fullProductName: "5 mL DEMO",
  labelName: "5 mL DEMO",
  amount: 10,
  unit: "MG",
  vialMl: 5,
  labelType: "CATALOG",
  labelSize: "40x20",
  formText: "LYOPHILIZED POWDER",
  storageTemp: "36–46°F",
  materialColor: "WHITE",
  visualType: "WHITE CAKE",
  placementProfile: "5ML_WHITE",
  qrValue: "https://www.wellpept.com",
  qrEnabled: true,
  companyName: "UNDISCLOSED",
  headerCompanyName: "UNDISCLOSED",
  legalLine1: "RESEARCH USE",
  legalLine2: "NOT FOR HUMAN",
  legalLine3: "CONSUMPTION",
};

const CARDS = [
  { title: "3 mL white", id: "UD-0277", current: "UD_0277_TA_1_5MG_3mL_v2.png" },
  { title: "3 mL cobalt", id: "UD-0161", current: "UD_0161_KLOW_80MG_3mL_v2.png" },
  { title: "5 mL demo", id: "UD-5ML-DEMO", current: "UD_5ML_DEMO_5_ML_DEMO_10MG_5mL_v2.png" },
  { title: "10 mL white", id: "UD-0204", current: "UD_0204_NAD_1000MG_10mL_v2.png" },
  { title: "10 mL red", id: "UD-0037", current: "UD_0037_B12_10MG_10mL_v2.png" },
];

function fileStem(product) {
  const id = String(product.catalogId).replace(/-/g, "_");
  const name = String(product.labelName || "PRODUCT")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const amount = `${product.amount}${String(product.unit || "MG").toUpperCase()}`;
  return `${id}_${name}_${amount}_${product.vialMl}mL`;
}

async function renderInkVariant(product, defaults, placement, outputDir, { optimizeText }) {
  const masterKey = resolvePhotoMasterKey(product, placement);
  const placementKey = resolveLabelPlacementKey(product, placement);
  const profile = resolvePlacementRect(placement, placementKey);
  const ss = Number(placement.compositor?.labelArtworkSupersample) || 8;
  const label = await renderLockedLabelArtwork(product, defaults, {
    width: profile.labelWidth * ss,
    height: profile.labelHeight * ss,
    heavierSecondaryText: optimizeText,
  });
  const stem = fileStem(product);
  const pngPath = path.join(outputDir, `${stem}.png`);
  await compositeLabelOnPhotoMaster({
    masterPhotoPath: masterPath(masterKey, placement),
    labelArtwork: label.png,
    placementProfile: profile,
    outputPath: pngPath,
    edgeInsetPx: placement.compositor?.edgeInsetPx,
    cylinderMaxThetaRad: optimizeText
      ? placement.compositor?.optimizedCylinderMaxThetaRad
      : placement.compositor?.cylinderMaxThetaRad,
    labelInkColor: placement.compositor?.labelInkColor,
    optimizeText,
  });
  return pngPath;
}

async function fitCard(inputPath, width, height) {
  return sharp(inputPath)
    .resize(width, height, {
      fit: "contain",
      background: "#0a0a0a",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();
}

async function buildSheet(rows, cellW, cellH, outName, caption) {
  const methods = [
    { key: "current", title: "Current V2" },
    { key: "ink", title: "Photo + black ink" },
    { key: "optimized", title: "Photo + optimized text" },
  ];
  const gutter = 20;
  const leftGutter = 132;
  const topGutter = 72;
  const width = leftGutter + methods.length * (cellW + gutter) + gutter;
  const height = topGutter + rows.length * (cellH + gutter) + 40;
  const header = methods
    .map((method, i) => {
      const x = leftGutter + i * (cellW + gutter) + cellW / 2;
      return `<text x="${x}" y="44" text-anchor="middle" font-family="Arial,sans-serif" font-size="20" font-weight="700" fill="#111">${method.title}</text>`;
    })
    .join("\n");
  const rowLabels = rows
    .map((row, i) => {
      const cy = topGutter + i * (cellH + gutter) + cellH / 2;
      return `<text x="16" y="${cy}" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#111">${row.title}</text>`;
    })
    .join("\n");
  const footer = `<text x="${width / 2}" y="${height - 14}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#444">${caption}</text>`;
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f4f4f4"/>
      ${header}
      ${rowLabels}
      ${footer}
    </svg>`
  );
  const composites = [];
  for (let r = 0; r < rows.length; r += 1) {
    const y = topGutter + r * (cellH + gutter);
    for (let c = 0; c < methods.length; c += 1) {
      const fitted = await fitCard(rows[r][methods[c].key], cellW, cellH);
      composites.push({
        input: fitted,
        left: leftGutter + c * (cellW + gutter),
        top: y,
      });
    }
  }
  const out = path.join(REVIEW_DIR, outName);
  await sharp(svg)
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

async function main() {
  const [catalog, placement] = await Promise.all([
    fs.readFile(CATALOG_PATH, "utf8").then(JSON.parse),
    fs.readFile(PLACEMENT_PATH, "utf8").then(JSON.parse),
  ]);
  const defaults = catalog.defaults || {};
  const byId = new Map(
    catalog.products.map((product) => [String(product.catalogId).toUpperCase(), product])
  );

  await fs.mkdir(INK_DIR, { recursive: true });
  await fs.mkdir(OPT_DIR, { recursive: true });
  await fs.mkdir(REVIEW_DIR, { recursive: true });

  const rows = [];
  for (const card of CARDS) {
    const product =
      card.id === "UD-5ML-DEMO"
        ? { ...FIVE_ML_DEMO }
        : { ...byId.get(card.id), labelType: "CATALOG" };
    if (!product?.catalogId) throw new Error(`Missing product ${card.id}`);
    const current = path.join(CURRENT_V2_DIR, card.current);
    await fs.access(current);
    console.log("ink", card.id);
    const ink = await renderInkVariant(product, defaults, placement, INK_DIR, {
      optimizeText: false,
    });
    console.log("optimized", card.id);
    const optimized = await renderInkVariant(product, defaults, placement, OPT_DIR, {
      optimizeText: true,
    });
    rows.push({ title: card.title, current, ink, optimized });
  }

  const sheet200 = await buildSheet(
    rows,
    200,
    300,
    "vial-system-v2-ink-compare-200.png",
    "Website card size 200×300 — each card is one Lanczos from the full-resolution composite"
  );
  const sheet400 = await buildSheet(
    rows,
    400,
    600,
    "vial-system-v2-ink-compare-400.png",
    "2× website size 400×600 — resized from the same full-resolution composite, not from 200×300"
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        sheet200: path.relative(repoRoot, sheet200),
        sheet400: path.relative(repoRoot, sheet400),
        inkDir: path.relative(repoRoot, INK_DIR),
        optimizedDir: path.relative(repoRoot, OPT_DIR),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
