/**
 * TA-1 B Front-focused rendering-pipeline comparison only.
 *
 * 1 = existing Current B (not regenerated)
 * 2 = same B window, vector-window raster + center-linear composite
 * 3 = #2 + very light ink-coverage sharpen before compositing
 *
 * Printable SVG, production catalog, and other products are not touched.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  compositeLabelOnPhotoMaster,
  masterPath,
  renderLockedLabelArtworkWindow,
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
const CURRENT_B = path.join(REVIEW_DIR, "v2-front-ta1/B_front_focused.png");
const OUT_DIR = path.join(REVIEW_DIR, "v2-front-sharp-ta1");

// Approved B Front-focused window. 3 mL catalog SVG is 1200×600.
const FRONT_B = { u0: 0, u1: 918 / 1200, v0: 0, v1: 1 };

const IMPROVED = {
  cylinderMaxThetaRad: 0.012,
  centerLinearFrac: 0.76,
  sampleFilter: "bicubic",
  optimizeText: false,
};

async function renderImproved(product, defaults, placement, stem, inkSharpenAmount) {
  const masterKey = resolvePhotoMasterKey(product, placement);
  const placementKey = resolveLabelPlacementKey(product, placement);
  const profile = resolvePlacementRect(placement, placementKey);
  const ss = Number(placement.compositor?.sharpnessSupersample) || 16;
  const label = await renderLockedLabelArtworkWindow(product, defaults, {
    width: profile.labelWidth * ss,
    artworkWindow: FRONT_B,
    heavierSecondaryText: true,
  });
  const pngPath = path.join(OUT_DIR, `${stem}.png`);
  const result = await compositeLabelOnPhotoMaster({
    masterPhotoPath: masterPath(masterKey, placement),
    labelArtwork: label.png,
    placementProfile: profile,
    outputPath: pngPath,
    edgeInsetPx: placement.compositor?.edgeInsetPx,
    cylinderMaxThetaRad: IMPROVED.cylinderMaxThetaRad,
    labelInkColor: placement.compositor?.labelInkColor,
    optimizeText: IMPROVED.optimizeText,
    sampleFilter: IMPROVED.sampleFilter,
    artworkAlreadyWindowed: true,
    centerLinearFrac: IMPROVED.centerLinearFrac,
    inkSharpenAmount,
  });
  return { pngPath, result, artwork: { width: label.width, height: label.height } };
}

async function card(inputPath, width, height) {
  return sharp(inputPath)
    .resize(width, height, {
      fit: "contain",
      background: "#0a0a0a",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();
}

async function main() {
  const [catalog, placement] = await Promise.all([
    fs.readFile(CATALOG_PATH, "utf8").then(JSON.parse),
    fs.readFile(PLACEMENT_PATH, "utf8").then(JSON.parse),
  ]);
  const product = {
    ...catalog.products.find((row) => String(row.catalogId).toUpperCase() === "UD-0277"),
    labelType: "CATALOG",
  };
  if (!product?.catalogId) throw new Error("Missing UD-0277");
  await fs.access(CURRENT_B);
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("improved vector/single-pass B");
  const improved = await renderImproved(
    product,
    catalog.defaults || {},
    placement,
    "2_vector_single_pass",
    0
  );
  console.log("improved + ink-only sharpen B");
  const sharpened = await renderImproved(
    product,
    catalog.defaults || {},
    placement,
    "3_vector_ink_sharpen",
    0.24
  );

  const a200 = await card(CURRENT_B, 200, 300);
  const b200 = await card(improved.pngPath, 200, 300);
  const c200 = await card(sharpened.pngPath, 200, 300);
  const c400 = await card(sharpened.pngPath, 400, 600);

  await fs.writeFile(path.join(OUT_DIR, "1_current_B_200.png"), a200);
  await fs.writeFile(path.join(OUT_DIR, "2_vector_single_pass_200.png"), b200);
  await fs.writeFile(path.join(OUT_DIR, "3_vector_ink_sharpen_200.png"), c200);
  await fs.writeFile(path.join(OUT_DIR, "3_vector_ink_sharpen_400.png"), c400);

  const titles = ["1 Current B", "2 Vector / single-pass", "3 + ink-only sharpen"];
  const cellW = 200;
  const cellH = 300;
  const gutter = 20;
  const topGutter = 64;
  const width = gutter + 3 * (cellW + gutter);
  const height = topGutter + cellH + 52;
  const header = titles
    .map((title, i) => {
      const x = gutter + i * (cellW + gutter) + cellW / 2;
      return `<text x="${x}" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#111">${title}</text>`;
    })
    .join("\n");
  const footer = `<text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#444">TA-1 B Front-focused 200×300 — same window; vector raster + one Lanczos. #3 also saved at 400×600.</text>`;
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f4f4f4"/>
      ${header}
      ${footer}
    </svg>`
  );
  const sheet = path.join(REVIEW_DIR, "vial-system-v2-front-sharp-ta1-200.png");
  await sharp(svg)
    .composite([
      { input: a200, left: gutter, top: topGutter },
      { input: b200, left: gutter + cellW + gutter, top: topGutter },
      { input: c200, left: gutter + 2 * (cellW + gutter), top: topGutter },
    ])
    .png({ compressionLevel: 9 })
    .toFile(sheet);

  console.log(
    JSON.stringify(
      {
        ok: true,
        sheet: path.relative(repoRoot, sheet),
        currentB: path.relative(repoRoot, CURRENT_B),
        window: FRONT_B,
        improved: IMPROVED,
        artwork: improved.artwork,
        canvas: {
          improved: `${improved.result.canvasWidth}×${improved.result.canvasHeight}`,
          sharpened: `${sharpened.result.canvasWidth}×${sharpened.result.canvasHeight}`,
        },
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
