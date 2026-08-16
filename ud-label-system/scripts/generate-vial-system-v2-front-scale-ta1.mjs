/**
 * TA-1 B Front-focused website-card text-scale test only.
 *
 * A = existing Current B (not regenerated)
 * B = +35% name, +25% dosage, +10% header UNDISCLOSED
 * C = largest natural TA-1 / proportional 5 MG
 *
 * Vector/single-pass pipeline. No sharpening. Locked print SVG unchanged.
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
import {
  websiteCardLayoutLarger,
  websiteCardLayoutMax,
} from "./website-card-typography.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(systemRoot, "..");

const CATALOG_PATH = path.join(systemRoot, "data/catalog.json");
const PLACEMENT_PATH = path.join(systemRoot, "config/vial-photo-placement.json");
const REVIEW_DIR = path.join(systemRoot, "review");
const CURRENT_B = path.join(REVIEW_DIR, "v2-front-ta1/B_front_focused.png");
const OUT_DIR = path.join(REVIEW_DIR, "v2-front-scale-ta1");

const FRONT_B = { u0: 0, u1: 918 / 1200, v0: 0, v1: 1 };

const PIPELINE = {
  cylinderMaxThetaRad: 0.012,
  centerLinearFrac: 0.76,
  sampleFilter: "bicubic",
  optimizeText: false,
  inkHardness: 0.12,
  inkSharpenAmount: 0,
};

async function renderCard(product, defaults, placement, stem, typography) {
  const masterKey = resolvePhotoMasterKey(product, placement);
  const placementKey = resolveLabelPlacementKey(product, placement);
  const profile = resolvePlacementRect(placement, placementKey);
  const ss = Number(placement.compositor?.sharpnessSupersample) || 16;
  const label = await renderLockedLabelArtworkWindow(product, defaults, {
    width: profile.labelWidth * ss,
    height: profile.labelHeight * ss,
    artworkWindow: FRONT_B,
    heavierSecondaryText: true,
    websiteCardTypography: typography,
  });
  const pngPath = path.join(OUT_DIR, `${stem}.png`);
  const result = await compositeLabelOnPhotoMaster({
    masterPhotoPath: masterPath(masterKey, placement),
    labelArtwork: label.png,
    placementProfile: profile,
    outputPath: pngPath,
    edgeInsetPx: placement.compositor?.edgeInsetPx,
    cylinderMaxThetaRad: PIPELINE.cylinderMaxThetaRad,
    labelInkColor: placement.compositor?.labelInkColor,
    optimizeText: PIPELINE.optimizeText,
    sampleFilter: PIPELINE.sampleFilter,
    artworkAlreadyWindowed: true,
    centerLinearFrac: PIPELINE.centerLinearFrac,
    inkSharpenAmount: PIPELINE.inkSharpenAmount,
    inkHardness: PIPELINE.inkHardness,
  });
  return { pngPath, result, typography };
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

  const larger = websiteCardLayoutLarger();
  const max = websiteCardLayoutMax();

  console.log("B larger name + dosage");
  const b = await renderCard(
    product,
    catalog.defaults || {},
    placement,
    "B_larger_name_dose",
    larger
  );
  console.log("C maximum readable");
  const c = await renderCard(
    product,
    catalog.defaults || {},
    placement,
    "C_maximum_readable",
    max
  );

  const a200 = await card200(CURRENT_B);
  const b200 = await card200(b.pngPath);
  const c200 = await card200(c.pngPath);
  await fs.writeFile(path.join(OUT_DIR, "A_current_B_200.png"), a200);
  await fs.writeFile(path.join(OUT_DIR, "B_larger_name_dose_200.png"), b200);
  await fs.writeFile(path.join(OUT_DIR, "C_maximum_readable_200.png"), c200);

  const titles = ["A Current B", "B Larger name + dosage", "C Maximum readable"];
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
  const footer = `<text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#444">TA-1 B Front-focused 200×300 — website text scale only. Vector/single-pass. No sharpening.</text>`;
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f4f4f4"/>
      ${header}
      ${footer}
    </svg>`
  );
  const sheet = path.join(REVIEW_DIR, "vial-system-v2-front-scale-ta1-200.png");
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
        window: FRONT_B,
        pipeline: PIPELINE,
        larger: {
          name: larger.name.size,
          dose: larger.amount.size,
          header: larger.header.size,
        },
        max: {
          name: max.name.size,
          dose: max.amount.size,
          nameScale: Number(max.nameScale.toFixed(2)),
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
