/**
 * TA-1 locked native-height wrap, nudged so a rail sliver shows.
 *
 * Same scale, height, sharpness, and name/dose centering as the
 * rotated proof. Only wrapOffsetPx changes. Production untouched.
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
const OUT_DIR = path.join(systemRoot, "review/v2-front-rail-sliver-ta1");

const SVG_W = 1200;
const SVG_H = 600;
const NAME_CENTER_SVG_X = 514;
const RAIL_SVG_W = 108;
const RAIL_VISIBLE_FRAC = 0.125;

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
  const centeredDestLeft = Math.round(
    profile.labelLeft + profile.labelWidth / 2 - wrapCenterU * destW
  );
  const visibleSvgLeft = RAIL_SVG_W * (1 - RAIL_VISIBLE_FRAC);
  const sliverDestLeft = Math.round(profile.labelLeft - (visibleSvgLeft / SVG_W) * destW);
  const wrapOffsetPx = sliverDestLeft - centeredDestLeft;

  const label = await renderLockedLabelArtworkNative(product, catalog.defaults || {}, {
    minWidth: destW * ss,
  });

  await fs.mkdir(OUT_DIR, { recursive: true });
  const pngPath = path.join(OUT_DIR, "TA1_native_height_rail_sliver.png");
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
    wrapOffsetPx,
  });

  const faceCrop = {
    left: profile.labelLeft,
    top: profile.labelTop,
    width: profile.labelWidth,
    height: profile.labelHeight,
  };
  const cropPath = path.join(OUT_DIR, "TA1_label_native_crop.png");
  await sharp(pngPath).extract(faceCrop).png().toFile(cropPath);

  const visibleLeftSvg = ((faceCrop.left - result.destLeft) / result.destW) * SVG_W;
  const visibleRightSvg = visibleLeftSvg + (faceCrop.width / result.destW) * SVG_W;
  const railVisibleSvg = Math.max(0, RAIL_SVG_W - visibleLeftSvg);
  const report = {
    mapping: "locked native-height wrap; offset so ~12.5% of the rail sliver is on-camera",
    svgViewBox: { width: SVG_W, height: SVG_H, aspect: SVG_W / SVG_H },
    wrapCenterSvgX: NAME_CENTER_SVG_X,
    wrapCenterU,
    wrapOffsetPx,
    rail: {
      svgWidth: RAIL_SVG_W,
      targetVisibleFrac: RAIL_VISIBLE_FRAC,
      visibleSvg: railVisibleSvg,
      visibleFrac: railVisibleSvg / RAIL_SVG_W,
      visiblePx: (railVisibleSvg / SVG_W) * destW,
    },
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
      x0: visibleLeftSvg,
      x1: visibleRightSvg,
      width: visibleRightSvg - visibleLeftSvg,
    },
    result,
  };
  await fs.writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));

  const compositeMeta = await sharp(pngPath).metadata();
  if (compositeMeta.width !== 1122 || compositeMeta.height !== 1402) {
    throw new Error(`Expected 1122×1402, got ${compositeMeta.width}×${compositeMeta.height}`);
  }
  if (result.destH !== destH || result.destW !== destW) {
    throw new Error(`dest ${result.destW}×${result.destH} != ${destW}×${destH}`);
  }
  if (result.destTop !== faceCrop.top) {
    throw new Error(`destTop moved: ${result.destTop}`);
  }
  if (Math.abs(result.scaleX - result.scaleY) > 1e-6) {
    throw new Error(`Non-uniform scale: ${result.scaleX} vs ${result.scaleY}`);
  }
  if (report.rail.visibleFrac < 0.1 || report.rail.visibleFrac > 0.16) {
    throw new Error(`Rail visible frac ${report.rail.visibleFrac} outside 10–15%`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        composite: path.relative(repoRoot, pngPath),
        crop: path.relative(repoRoot, cropPath),
        dest: report.dest,
        scale: { x: report.scaleX, y: report.scaleY },
        wrapOffsetPx,
        railVisible: {
          frac: `${(report.rail.visibleFrac * 100).toFixed(1)}%`,
          px: Number(report.rail.visiblePx.toFixed(1)),
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
