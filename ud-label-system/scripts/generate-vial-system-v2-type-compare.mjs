/**
 * Typography-quality comparison only.
 *
 * CURRENT OPTIMIZED | TYPOGRAPHY FIX 2X | TYPOGRAPHY FIX 3X
 * All three displayed at the same 200×300 CSS-equivalent size.
 *
 * Does not change placement, photography, or production assets.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  compositeLabelOnPhotoMaster,
  masterPath,
  renderLockedLabelArtworkNative,
  resolveLabelPlacementKey,
  resolvePhotoMasterKey,
  resolvePlacementRect,
} from "./composite-label-on-photo-master.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(systemRoot, "..");

const CATALOG_PATH = path.join(systemRoot, "data/catalog.json");
const PLACEMENT_PATH = path.join(systemRoot, "config/vial-photo-placement.json");
const REVIEW_DIR = path.join(systemRoot, "review");
const CURRENT_DIR = path.join(REVIEW_DIR, "v2-ink-optimized");
const TYPE_DIR = path.join(REVIEW_DIR, "v2-type-fix");

const CARDS = [
  { title: "TA-1", id: "UD-0277", current: "UD_0277_TA_1_5MG_3mL.png" },
  { title: "KLOW", id: "UD-0161", current: "UD_0161_KLOW_80MG_3mL.png" },
  { title: "NAD+", id: "UD-0204", current: "UD_0204_NAD_1000MG_10mL.png" },
  { title: "B12", id: "UD-0037", current: "UD_0037_B12_10MG_10mL.png" },
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

async function renderTypographyFix(product, defaults, placement) {
  const masterKey = resolvePhotoMasterKey(product, placement);
  const placementKey = resolveLabelPlacementKey(product, placement);
  const profile = resolvePlacementRect(placement, placementKey);
  const label = await renderLockedLabelArtworkNative(product, defaults, {
    minWidth: placement.compositor?.typographyRasterMinWidth || 7200,
    heavierSecondaryText: true,
  });
  const stem = fileStem(product);
  const fullPath = path.join(TYPE_DIR, `${stem}.png`);
  const path2x = path.join(TYPE_DIR, `${stem}_400x600.png`);
  const path3x = path.join(TYPE_DIR, `${stem}_600x900.png`);
  await compositeLabelOnPhotoMaster({
    masterPhotoPath: masterPath(masterKey, placement),
    labelArtwork: label.png,
    placementProfile: profile,
    outputPath: fullPath,
    edgeInsetPx: placement.compositor?.edgeInsetPx,
    cylinderMaxThetaRad: placement.compositor?.typographyCylinderMaxThetaRad ?? 0.016,
    labelInkColor: placement.compositor?.labelInkColor,
    typographyFix: true,
    centerReadabilityFrac: placement.compositor?.centerReadabilityFrac ?? 0.7,
    inkSharpen: placement.compositor?.inkSharpen,
    websiteOutput: [
      { path: path2x, width: 400, height: 600 },
      { path: path3x, width: 600, height: 900 },
    ],
  });
  return { fullPath, path2x, path3x };
}

async function cssDisplay(inputPath) {
  return sharp(inputPath)
    .resize(200, 300, {
      fit: "contain",
      background: "#0a0a0a",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();
}

async function buildSheet(rows) {
  const methods = [
    { key: "current", title: "Current optimized" },
    { key: "fix2x", title: "Typography fix 2×" },
    { key: "fix3x", title: "Typography fix 3×" },
  ];
  const cellW = 200;
  const cellH = 300;
  const gutter = 20;
  const leftGutter = 88;
  const topGutter = 72;
  const width = leftGutter + methods.length * (cellW + gutter) + gutter;
  const height = topGutter + rows.length * (cellH + gutter) + 44;
  const header = methods
    .map((method, i) => {
      const x = leftGutter + i * (cellW + gutter) + cellW / 2;
      return `<text x="${x}" y="44" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#111">${method.title}</text>`;
    })
    .join("\n");
  const rowLabels = rows
    .map((row, i) => {
      const cy = topGutter + i * (cellH + gutter) + cellH / 2;
      return `<text x="16" y="${cy}" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#111">${row.title}</text>`;
    })
    .join("\n");
  const footer = `<text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#444">All cards displayed at 200×300 CSS size — 2× from 400×600, 3× from 600×900</text>`;
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
      composites.push({
        input: await cssDisplay(rows[r][methods[c].key]),
        left: leftGutter + c * (cellW + gutter),
        top: y,
      });
    }
  }
  const out = path.join(REVIEW_DIR, "vial-system-v2-type-compare-200.png");
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

  await fs.mkdir(TYPE_DIR, { recursive: true });

  const rows = [];
  for (const card of CARDS) {
    const product = { ...byId.get(card.id), labelType: "CATALOG" };
    if (!product?.catalogId) throw new Error(`Missing product ${card.id}`);
    const current = path.join(CURRENT_DIR, card.current);
    await fs.access(current);
    console.log("typography-fix", card.id);
    const rendered = await renderTypographyFix(product, defaults, placement);
    rows.push({
      title: card.title,
      current,
      fix2x: rendered.path2x,
      fix3x: rendered.path3x,
    });
  }

  const sheet = await buildSheet(rows);
  console.log(
    JSON.stringify(
      {
        ok: true,
        sheet: path.relative(repoRoot, sheet),
        typeDir: path.relative(repoRoot, TYPE_DIR),
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
