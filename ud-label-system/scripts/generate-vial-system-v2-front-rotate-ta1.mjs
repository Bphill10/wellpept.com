/**
 * TA-1 height-only native mapping, rotated so name/dose face the camera.
 *
 * Same scale, height, sharpness, and artwork as the height-only proof.
 * Only the horizontal wrap offset changes. Production untouched.
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
const OUT_DIR = path.join(systemRoot, "review/v2-front-rotate-ta1");

const SVG_W = 1200;
const SVG_H = 600;
const NAME_CENTER_SVG_X = 514;

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
  const destW = Math.max(1, Math.round((destH * SVG_W) / SVG_H));
  const wrapCenterU = NAME_CENTER_SVG_X / SVG_W;
  const label = await renderLockedLabelArtworkNative(product, catalog.defaults || {}, {
    minWidth: destW * ss,
  });

  await fs.mkdir(OUT_DIR, { recursive: true });
  const pngPath = path.join(OUT_DIR, "TA1_native_height_rotated.png");
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
    wrapCenterU,
  });

  const faceCrop = {
    left: profile.labelLeft,
    top: profile.labelTop,
    width: profile.labelWidth,
    height: profile.labelHeight,
  };
  const cropPath = path.join(OUT_DIR, "TA1_label_native_crop.png");
  await sharp(pngPath).extract(faceCrop).png().toFile(cropPath);

  const visibleLeftSvg =
    ((faceCrop.left - result.destLeft) / result.destW) * SVG_W;
  const visibleRightSvg = visibleLeftSvg + (faceCrop.width / result.destW) * SVG_W;
  const report = {
    mapping: "height-only native SVG aspect; wrap rotated so name/dose face the camera",
    svgViewBox: { width: SVG_W, height: SVG_H, aspect: SVG_W / SVG_H },
    wrapCenterSvgX: NAME_CENTER_SVG_X,
    wrapCenterU,
    face: faceCrop,
    dest: {
      width: result.destW,
      height: result.destH,
      left: result.destLeft,
      top: result.destTop,
    },
    scaleX: result.destW / SVG_W,
    scaleY: result.destH / SVG_H,
    artwork: { width: label.width, height: label.height, aspect: label.width / label.height },
    visibleSvgUnits: {
      u0: visibleLeftSvg / SVG_W,
      u1: visibleRightSvg / SVG_W,
      x0: visibleLeftSvg,
      x1: visibleRightSvg,
      width: visibleRightSvg - visibleLeftSvg,
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
  if (result.destH !== destH || result.destW !== destW) {
    throw new Error(`dest ${result.destW}×${result.destH} != ${destW}×${destH}`);
  }
  if (result.destTop !== faceCrop.top) {
    throw new Error(`destTop moved: ${result.destTop}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        composite: path.relative(repoRoot, pngPath),
        crop: path.relative(repoRoot, cropPath),
        dest: report.dest,
        scale: { x: report.scaleX, y: report.scaleY },
        visibleSvgX: {
          from: Number(visibleLeftSvg.toFixed(1)),
          to: Number(visibleRightSvg.toFixed(1)),
        },
        wrapShiftPx: result.destLeft - faceCrop.left,
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
