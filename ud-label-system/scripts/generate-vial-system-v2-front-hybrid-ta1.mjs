/**
 * TA-1 hybrid mapping test.
 *
 * A = current B stretch (existing file)
 * B = B wrap geometry + native-proportion front window
 * C = same hybrid, TA-1 / 5 MG use ~12.5% more front-face width
 *
 * Uniform X/Y scale. Zero warp. No sharpening. No 200×300. Production untouched.
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
const OUT_DIR = path.join(REVIEW_DIR, "v2-front-hybrid-ta1");
const CURRENT_B = path.join(REVIEW_DIR, "v2-front-aspect-ta1/B_current_stretch_composite.png");

// Measured from native 7200×3600 artwork. Form is the widest required line.
const HYBRID_B = { u0: 0, u1: 748 / 1200, v0: 0, v1: 1 };
const HYBRID_C = { u0: 0, u1: 665 / 1200, v0: 0, v1: 1 };

async function renderHybrid(product, defaults, placement, stem, artworkWindow) {
  const masterKey = resolvePhotoMasterKey(product, placement);
  const placementKey = resolveLabelPlacementKey(product, placement);
  const profile = resolvePlacementRect(placement, placementKey);
  const ss = Number(placement.compositor?.sharpnessSupersample) || 16;
  const winW = (artworkWindow.u1 - artworkWindow.u0) * 1200;
  const winH = (artworkWindow.v1 - artworkWindow.v0) * 600;
  const destW = profile.labelWidth;
  const destH = Math.max(1, Math.round(winH * (destW / winW)));
  const label = await renderLockedLabelArtworkWindow(product, defaults, {
    width: destW * ss,
    height: destH * ss,
    artworkWindow,
    heavierSecondaryText: true,
  });
  const pngPath = path.join(OUT_DIR, `${stem}.png`);
  const result = await compositeLabelOnPhotoMaster({
    masterPhotoPath: masterPath(masterKey, placement),
    labelArtwork: label.png,
    placementProfile: profile,
    outputPath: pngPath,
    edgeInsetPx: placement.compositor?.edgeInsetPx,
    cylinderMaxThetaRad: 0,
    labelInkColor: placement.compositor?.labelInkColor,
    optimizeText: false,
    sampleFilter: "bicubic",
    artworkAlreadyWindowed: true,
    fitMode: "width",
  });
  return {
    pngPath,
    result,
    window: artworkWindow,
    svgWindow: { width: winW, height: winH },
    dest: { width: result.destW, height: result.destH, left: result.destLeft, top: result.destTop },
    scaleX: result.destW / winW,
    scaleY: result.destH / winH,
    artwork: { width: label.width, height: label.height },
  };
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

  const aPath = path.join(OUT_DIR, "A_current_B.png");
  await fs.copyFile(CURRENT_B, aPath);

  console.log("hybrid B");
  const hybridB = await renderHybrid(
    product,
    catalog.defaults || {},
    placement,
    "B_hybrid_native_proportion",
    HYBRID_B
  );
  console.log("hybrid C");
  const hybridC = await renderHybrid(
    product,
    catalog.defaults || {},
    placement,
    "C_hybrid_plus_width",
    HYBRID_C
  );

  const profile = resolvePlacementRect(placement, resolveLabelPlacementKey(product, placement));
  const faceCrop = {
    left: profile.labelLeft,
    top: profile.labelTop,
    width: profile.labelWidth,
    height: profile.labelHeight,
  };
  const aCrop = path.join(OUT_DIR, "A_label_native_crop.png");
  const bCrop = path.join(OUT_DIR, "B_label_native_crop.png");
  const cCrop = path.join(OUT_DIR, "C_label_native_crop.png");
  await sharp(aPath).extract(faceCrop).png().toFile(aCrop);
  await sharp(hybridB.pngPath).extract(faceCrop).png().toFile(bCrop);
  await sharp(hybridC.pngPath).extract(faceCrop).png().toFile(cCrop);

  const nameSvgW = 196.3;
  const report = {
    face: faceCrop,
    A_currentB: {
      file: path.relative(repoRoot, aPath),
      mapping: "fill-stretch independent X/Y",
      scaleX: profile.labelWidth / 918,
      scaleY: profile.labelHeight / 600,
    },
    B_hybrid: {
      ...hybridB,
      pngPath: path.relative(repoRoot, hybridB.pngPath),
      ta1FaceWidthPx: nameSvgW * (hybridB.dest.width / hybridB.svgWindow.width),
    },
    C_hybrid: {
      ...hybridC,
      pngPath: path.relative(repoRoot, hybridC.pngPath),
      ta1FaceWidthPx: nameSvgW * (hybridC.dest.width / hybridC.svgWindow.width),
    },
  };
  report.C_vs_B_ta1WidthGain =
    report.C_hybrid.ta1FaceWidthPx / report.B_hybrid.ta1FaceWidthPx - 1;
  await fs.writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));

  const previews = await Promise.all(
    [aPath, hybridB.pngPath, hybridC.pngPath].map((file) =>
      sharp(file)
        .resize(240, 300, { fit: "contain", background: "#111", kernel: "lanczos3" })
        .png()
        .toBuffer()
    )
  );
  const crops = await Promise.all([aCrop, bCrop, cCrop].map((file) => fs.readFile(file)));
  const titles = ["A Current B", "B Hybrid native proportion", "C Hybrid +12.5% name/dose width"];
  const cellW = 240;
  const cellH = 300;
  const cropW = 362;
  const cropH = 412;
  const gutter = 20;
  const width = gutter + 3 * (cropW + gutter);
  const height = 64 + cellH + 28 + cropH + 48;
  const header = titles
    .map((title, i) => {
      const x = gutter + i * (cropW + gutter) + cropW / 2;
      return `<text x="${x}" y="36" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#111">${title}</text>`;
    })
    .join("\n");
  const svg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#f4f4f4"/>
    ${header}
    <text x="${width / 2}" y="${64 + cellH + 20}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#111">Label face 362×412 at 1:1 native pixels</text>
    <text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#444">TA-1 1122×1402 — B wrap bounds + uniform type scale. No warp, no sharpen, no 200×300.</text>
  </svg>`);
  const sheet = path.join(REVIEW_DIR, "vial-system-v2-front-hybrid-ta1.png");
  const composites = [
    { input: previews[0], left: gutter + Math.round((cropW - 240) / 2), top: 64 },
    { input: previews[1], left: gutter + cropW + gutter + Math.round((cropW - 240) / 2), top: 64 },
    { input: previews[2], left: gutter + 2 * (cropW + gutter) + Math.round((cropW - 240) / 2), top: 64 },
    { input: crops[0], left: gutter, top: 64 + cellH + 28 },
    { input: crops[1], left: gutter + cropW + gutter, top: 64 + cellH + 28 },
    { input: crops[2], left: gutter + 2 * (cropW + gutter), top: 64 + cellH + 28 },
  ];
  await sharp(svg).composite(composites).png({ compressionLevel: 9 }).toFile(sheet);

  console.log(
    JSON.stringify(
      {
        ok: true,
        sheet: path.relative(repoRoot, sheet),
        ta1FaceWidth: {
          B: Number(report.B_hybrid.ta1FaceWidthPx.toFixed(1)),
          C: Number(report.C_hybrid.ta1FaceWidthPx.toFixed(1)),
          gain: `${(report.C_vs_B_ta1WidthGain * 100).toFixed(1)}%`,
        },
        scales: {
          B: { x: hybridB.scaleX, y: hybridB.scaleY, dest: hybridB.dest },
          C: { x: hybridC.scaleX, y: hybridC.scaleY, dest: hybridC.dest },
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
