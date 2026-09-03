/**
 * TA-1 sharpness-only comparison.
 *
 * A = current optimized (existing file, not regenerated)
 * B = same geometry, single-pass higher-res raster + bicubic sample
 * C = B + very light sharpen on the final displayed outputs only
 *
 * Does not change typography, placement, or production assets.
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
const REVIEW_DIR = path.join(systemRoot, "review");
const CURRENT = path.join(REVIEW_DIR, "v2-ink-optimized/UD_0277_TA_1_5MG_3mL.png");
const OUT_DIR = path.join(REVIEW_DIR, "v2-sharp-ta1");

const LIGHT_SHARPEN = { sigma: 0.35, m1: 0.1, m2: 0.08, x1: 2, y2: 10 };
const DETAIL_CROP = { left: 358, top: 513, width: 400, height: 600 };

async function renderSinglePass(product, defaults, placement) {
  const masterKey = resolvePhotoMasterKey(product, placement);
  const placementKey = resolveLabelPlacementKey(product, placement);
  const profile = resolvePlacementRect(placement, placementKey);
  const ss = Number(placement.compositor?.sharpnessSupersample) || 16;
  const label = await renderLockedLabelArtwork(product, defaults, {
    width: profile.labelWidth * ss,
    height: profile.labelHeight * ss,
    heavierSecondaryText: true,
  });
  const fullPath = path.join(OUT_DIR, "B_single_pass.png");
  await compositeLabelOnPhotoMaster({
    masterPhotoPath: masterPath(masterKey, placement),
    labelArtwork: label.png,
    placementProfile: profile,
    outputPath: fullPath,
    edgeInsetPx: placement.compositor?.edgeInsetPx,
    cylinderMaxThetaRad: placement.compositor?.optimizedCylinderMaxThetaRad,
    labelInkColor: placement.compositor?.labelInkColor,
    optimizeText: true,
    sampleFilter: "bicubic",
  });
  return fullPath;
}

async function card200(inputPath) {
  return sharp(inputPath)
    .resize(200, 300, {
      fit: "contain",
      background: "#0a0a0a",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer();
}

async function detail400(inputPath) {
  return sharp(inputPath)
    .extract(DETAIL_CROP)
    .png()
    .toBuffer();
}

async function lightSharpen(buffer) {
  return sharp(buffer).sharpen(LIGHT_SHARPEN).png().toBuffer();
}

async function buildSheet(cells, cellW, cellH, titles, caption, outName) {
  const gutter = 20;
  const topGutter = 64;
  const width = gutter + cells.length * (cellW + gutter);
  const height = topGutter + cellH + 48;
  const header = titles
    .map((title, i) => {
      const x = gutter + i * (cellW + gutter) + cellW / 2;
      return `<text x="${x}" y="38" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#111">${title}</text>`;
    })
    .join("\n");
  const footer = `<text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#444">${caption}</text>`;
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f4f4f4"/>
      ${header}
      ${footer}
    </svg>`
  );
  const composites = cells.map((input, i) => ({
    input,
    left: gutter + i * (cellW + gutter),
    top: topGutter,
  }));
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
  const product = {
    ...catalog.products.find((row) => String(row.catalogId).toUpperCase() === "UD-0277"),
    labelType: "CATALOG",
  };
  if (!product?.catalogId) throw new Error("Missing UD-0277");
  await fs.access(CURRENT);
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("single-pass TA-1");
  const singlePass = await renderSinglePass(product, catalog.defaults || {}, placement);

  const a200 = await card200(CURRENT);
  const b200 = await card200(singlePass);
  const c200 = await lightSharpen(b200);
  const a400 = await detail400(CURRENT);
  const b400 = await detail400(singlePass);
  const c400 = await lightSharpen(b400);

  await fs.writeFile(path.join(OUT_DIR, "A_current_200.png"), a200);
  await fs.writeFile(path.join(OUT_DIR, "B_single_pass_200.png"), b200);
  await fs.writeFile(path.join(OUT_DIR, "C_light_sharpen_200.png"), c200);
  await fs.writeFile(path.join(OUT_DIR, "A_current_detail400.png"), a400);
  await fs.writeFile(path.join(OUT_DIR, "B_single_pass_detail400.png"), b400);
  await fs.writeFile(path.join(OUT_DIR, "C_light_sharpen_detail400.png"), c400);

  const sheet200 = await buildSheet(
    [a200, b200, c200],
    200,
    300,
    ["A Current optimized", "B Single-pass", "C Light output sharpen"],
    "TA-1 only — all cards 200×300 from one Lanczos of the full master. Geometry unchanged.",
    "vial-system-v2-sharp-ta1-200.png"
  );
  const sheet400 = await buildSheet(
    [a400, b400, c400],
    400,
    600,
    ["A Current optimized", "B Single-pass", "C Light output sharpen"],
    "TA-1 label-area crop 400×600 at 1:1 from the full master. Same crop window for A/B/C.",
    "vial-system-v2-sharp-ta1-400.png"
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        sheet200: path.relative(repoRoot, sheet200),
        sheet400: path.relative(repoRoot, sheet400),
        crop: DETAIL_CROP,
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
