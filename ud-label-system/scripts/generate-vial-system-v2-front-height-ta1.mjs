/**
 * TA-1 height-only native-proportion mapping.
 *
 * Scale from photographed label height. Width follows the SVG aspect
 * ratio and is never altered. Overflow is clipped. No warp, no sharpen,
 * no 200×300, no comparison sheet. Production untouched.
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
const OUT_DIR = path.join(systemRoot, "review/v2-front-height-ta1");

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

  const masterKey = resolvePhotoMasterKey(product, placement);
  const placementKey = resolveLabelPlacementKey(product, placement);
  const profile = resolvePlacementRect(placement, placementKey);
  const ss = Number(placement.compositor?.sharpnessSupersample) || 16;
  const destH = profile.labelHeight;
  const destW = Math.max(1, Math.round((destH * 1200) / 600));
  const label = await renderLockedLabelArtworkNative(product, catalog.defaults || {}, {
    minWidth: destW * ss,
  });

  await fs.mkdir(OUT_DIR, { recursive: true });
  const pngPath = path.join(OUT_DIR, "TA1_native_height_scale.png");
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
    fitMode: "height",
  });

  const faceCrop = {
    left: profile.labelLeft,
    top: profile.labelTop,
    width: profile.labelWidth,
    height: profile.labelHeight,
  };
  const cropPath = path.join(OUT_DIR, "TA1_label_native_crop.png");
  await sharp(pngPath).extract(faceCrop).png().toFile(cropPath);

  const report = {
    mapping: "height-only native SVG aspect; clip overflow to photographed face",
    svgViewBox: { width: 1200, height: 600, aspect: 2 },
    face: faceCrop,
    dest: {
      width: result.destW,
      height: result.destH,
      left: result.destLeft,
      top: result.destTop,
    },
    scaleX: result.destW / 1200,
    scaleY: result.destH / 600,
    artwork: { width: label.width, height: label.height, aspect: label.width / label.height },
    visibleSvgUnits: {
      u0: 0,
      u1: faceCrop.width / result.destW,
      width: (faceCrop.width / result.destW) * 1200,
    },
    result,
  };
  await fs.writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));

  const compositeMeta = await sharp(pngPath).metadata();
  const cropMeta = await sharp(cropPath).metadata();
  if (compositeMeta.width !== 1122 || compositeMeta.height !== 1402) {
    throw new Error(`Expected 1122×1402, got ${compositeMeta.width}×${compositeMeta.height}`);
  }
  if (cropMeta.width !== faceCrop.width || cropMeta.height !== faceCrop.height) {
    throw new Error(`Crop size mismatch: ${cropMeta.width}×${cropMeta.height}`);
  }
  if (Math.abs(result.scaleX - result.scaleY) > 1e-6) {
    throw new Error(`Non-uniform scale: ${result.scaleX} vs ${result.scaleY}`);
  }
  if (result.destH !== faceCrop.height) {
    throw new Error(`destH ${result.destH} != face height ${faceCrop.height}`);
  }
  if (result.destW !== destW) {
    throw new Error(`destW ${result.destW} != height-derived ${destW}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        composite: path.relative(repoRoot, pngPath),
        crop: path.relative(repoRoot, cropPath),
        dest: report.dest,
        scale: { x: report.scaleX, y: report.scaleY },
        visibleSvgWidth: Number(report.visibleSvgUnits.width.toFixed(1)),
        artwork: report.artwork,
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
