/**
 * TA-1 aspect-preserving front-window mapping test.
 *
 * A = native-aspect full label artwork
 * B = current fill-stretch composite (independent X/Y)
 * C = front-window crop, uniform scale, zero cylindrical warp
 *
 * Original locked typography. No 200×300 resize. Production untouched.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  compositeLabelOnPhotoMaster,
  cropLockedLabelSvgToWindow,
  masterPath,
  renderLockedLabelArtworkWindow,
  resolveLabelPlacementKey,
  resolvePhotoMasterKey,
  resolvePlacementRect,
} from "./composite-label-on-photo-master.mjs";
import { fillLockedLabelSvg } from "./render-locked-label.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(systemRoot, "..");

const CATALOG_PATH = path.join(systemRoot, "data/catalog.json");
const PLACEMENT_PATH = path.join(systemRoot, "config/vial-photo-placement.json");
const REVIEW_DIR = path.join(systemRoot, "review");
const OUT_DIR = path.join(REVIEW_DIR, "v2-front-aspect-ta1");

const FRONT_B = { u0: 0, u1: 918 / 1200, v0: 0, v1: 1 };
const FULL_ART_W = 7200;

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
  await fs.mkdir(OUT_DIR, { recursive: true });

  const masterKey = resolvePhotoMasterKey(product, placement);
  const placementKey = resolveLabelPlacementKey(product, placement);
  const profile = resolvePlacementRect(placement, placementKey);
  const ss = Number(placement.compositor?.sharpnessSupersample) || 16;
  const defaults = catalog.defaults || {};
  const masterPhotoPath = masterPath(masterKey, placement);

  const filled = await fillLockedLabelSvg(product, defaults, { heavierSecondaryText: true });
  const fullCrop = cropLockedLabelSvgToWindow(filled.svg, { u0: 0, u1: 1, v0: 0, v1: 1 });
  const winCrop = cropLockedLabelSvgToWindow(filled.svg, FRONT_B);
  const fullArtH = Math.round((FULL_ART_W * fullCrop.h) / fullCrop.w);
  const density = Math.max(72, 72 * (FULL_ART_W / fullCrop.w));
  const artworkA = await sharp(Buffer.from(fullCrop.svg), { density })
    .resize(FULL_ART_W, fullArtH, { fit: "fill", kernel: "lanczos3" })
    .ensureAlpha()
    .png({ compressionLevel: 6 })
    .toBuffer();
  const artworkPath = path.join(OUT_DIR, "A_label_artwork_native.png");
  await fs.writeFile(artworkPath, artworkA);

  const stretched = await renderLockedLabelArtworkWindow(product, defaults, {
    width: profile.labelWidth * ss,
    height: profile.labelHeight * ss,
    artworkWindow: FRONT_B,
    heavierSecondaryText: true,
  });
  const b = await compositeLabelOnPhotoMaster({
    masterPhotoPath,
    labelArtwork: stretched.png,
    placementProfile: profile,
    outputPath: path.join(OUT_DIR, "B_current_stretch_composite.png"),
    edgeInsetPx: placement.compositor?.edgeInsetPx,
    cylinderMaxThetaRad: placement.compositor?.optimizedCylinderMaxThetaRad,
    labelInkColor: placement.compositor?.labelInkColor,
    optimizeText: true,
    sampleFilter: "bicubic",
    artworkAlreadyWindowed: true,
    fitMode: "fill",
  });

  const uniform = Math.min(profile.labelWidth / winCrop.w, profile.labelHeight / winCrop.h);
  const destW = Math.max(1, Math.round(winCrop.w * uniform));
  const destH = Math.max(1, Math.round(winCrop.h * uniform));
  const windowArt = await renderLockedLabelArtworkWindow(product, defaults, {
    width: destW * ss,
    height: destH * ss,
    artworkWindow: FRONT_B,
    heavierSecondaryText: true,
  });
  const c = await compositeLabelOnPhotoMaster({
    masterPhotoPath,
    labelArtwork: windowArt.png,
    placementProfile: profile,
    outputPath: path.join(OUT_DIR, "C_front_window_contain.png"),
    edgeInsetPx: placement.compositor?.edgeInsetPx,
    cylinderMaxThetaRad: 0,
    labelInkColor: placement.compositor?.labelInkColor,
    optimizeText: false,
    sampleFilter: "bicubic",
    artworkAlreadyWindowed: true,
    fitMode: "contain",
  });

  const nameSvgX = 514;
  const nameSvgY = 205;
  const nameSvgH = 96;
  const bCrop = {
    left: Math.round(profile.labelLeft + ((nameSvgX - 160) / winCrop.w) * profile.labelWidth),
    top: Math.round(profile.labelTop + ((nameSvgY - nameSvgH - 16) / winCrop.h) * profile.labelHeight),
    width: 280,
    height: 140,
  };
  const cCrop = {
    left: Math.round(c.destLeft + ((nameSvgX - winCrop.x - 160) / winCrop.w) * c.destW),
    top: Math.round(c.destTop + ((nameSvgY - nameSvgH - 16) / winCrop.h) * c.destH),
    width: 280,
    height: 140,
  };
  const bCropPath = path.join(OUT_DIR, "B_TA1_native_crop.png");
  const cCropPath = path.join(OUT_DIR, "C_TA1_native_crop.png");
  await sharp(path.join(OUT_DIR, "B_current_stretch_composite.png")).extract(bCrop).png().toFile(bCropPath);
  await sharp(path.join(OUT_DIR, "C_front_window_contain.png")).extract(cCrop).png().toFile(cCropPath);

  const report = {
    sourceArtwork: { width: FULL_ART_W, height: fullArtH, aspect: FULL_ART_W / fullArtH, svgViewBox: `${fullCrop.w}×${fullCrop.h}` },
    sourceFrontWindow: {
      svg: { x: winCrop.x, y: winCrop.y, width: winCrop.w, height: winCrop.h, aspect: winCrop.w / winCrop.h },
      raster: { width: windowArt.width, height: windowArt.height, aspect: windowArt.width / windowArt.height },
    },
    destinationLabelFace: {
      left: profile.labelLeft,
      top: profile.labelTop,
      width: profile.labelWidth,
      height: profile.labelHeight,
      aspect: profile.labelWidth / profile.labelHeight,
    },
    B_currentStretch: {
      dest: { width: b.destW, height: b.destH },
      scaleX: profile.labelWidth / winCrop.w,
      scaleY: profile.labelHeight / winCrop.h,
      independentXY: true,
      cylinderMaxThetaRad: placement.compositor?.optimizedCylinderMaxThetaRad,
    },
    C_frontWindowContain: {
      dest: { left: c.destLeft, top: c.destTop, width: c.destW, height: c.destH },
      scaleX: c.destW / winCrop.w,
      scaleY: c.destH / winCrop.h,
      uniform: uniform,
      independentXY: false,
      cylinderMaxThetaRad: 0,
    },
    nativeCrops: { B: bCrop, C: cCrop },
  };
  await fs.writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));

  const aPrev = await sharp(artworkPath)
    .resize(480, 240, { fit: "contain", background: "#111", kernel: "lanczos3" })
    .png()
    .toBuffer();
  const bPrev = await sharp(path.join(OUT_DIR, "B_current_stretch_composite.png"))
    .resize(240, 300, { fit: "contain", background: "#111", kernel: "lanczos3" })
    .png()
    .toBuffer();
  const cPrev = await sharp(path.join(OUT_DIR, "C_front_window_contain.png"))
    .resize(240, 300, { fit: "contain", background: "#111", kernel: "lanczos3" })
    .png()
    .toBuffer();
  const bCropBuf = await fs.readFile(bCropPath);
  const cCropBuf = await fs.readFile(cCropPath);

  const width = 16 + 480 + 16 + 240 + 16 + 240 + 16;
  const height = 64 + 300 + 24 + 140 + 72;
  const svg = Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="#f4f4f4"/>
    <text x="${16 + 240}" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#111">A Native artwork</text>
    <text x="${16 + 480 + 16 + 120}" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#111">B Current stretch</text>
    <text x="${16 + 480 + 16 + 240 + 16 + 120}" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#111">C Front window</text>
    <text x="${16 + 480 + 16 + 120}" y="${64 + 300 + 20}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#111">B TA-1 native crop</text>
    <text x="${16 + 480 + 16 + 240 + 16 + 120}" y="${64 + 300 + 20}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#111">C TA-1 native crop</text>
    <text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#444">TA-1 1122×1402 — C uniform scale, zero warp. Crops are 1:1 pixels from the composites. Sheet previews of A/B/C are for layout only.</text>
  </svg>`);
  const sheet = path.join(REVIEW_DIR, "vial-system-v2-front-aspect-ta1.png");
  await sharp(svg)
    .composite([
      { input: aPrev, left: 16, top: 64 + 30 },
      { input: bPrev, left: 16 + 480 + 16, top: 64 },
      { input: cPrev, left: 16 + 480 + 16 + 240 + 16, top: 64 },
      { input: bCropBuf, left: 16 + 480 + 16, top: 64 + 300 + 28 },
      { input: cCropBuf, left: 16 + 480 + 16 + 240 + 16, top: 64 + 300 + 28 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(sheet);

  console.log(JSON.stringify({ ok: true, sheet: path.relative(repoRoot, sheet), report }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
