/**
 * TA-1 rendering diagnostic only. No design or pipeline fixes.
 *
 * Replays the current website-card path to capture intermediates and
 * measure every raster/resize. Does not change fonts, layout, or photos.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  cropLockedLabelSvgToWindow,
  masterPath,
  renderLockedLabelArtwork,
  renderLockedLabelArtworkWindow,
  resolveLabelPlacementKey,
  resolvePhotoMasterKey,
  resolvePlacementRect,
} from "./composite-label-on-photo-master.mjs";
import { fillLockedLabelSvg } from "./render-locked-label.mjs";
import { applyWebsiteCardTypography, websiteCardLayoutLarger } from "./website-card-typography.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(systemRoot, "..");

const CATALOG_PATH = path.join(systemRoot, "data/catalog.json");
const PLACEMENT_PATH = path.join(systemRoot, "config/vial-photo-placement.json");
const REVIEW_DIR = path.join(systemRoot, "review");
const OUT_DIR = path.join(REVIEW_DIR, "v2-front-diag-ta1");
const CURRENT_COMPOSITE = path.join(REVIEW_DIR, "v2-front-scale-ta1/B_larger_name_dose.png");
const CURRENT_BLURRY = path.join(REVIEW_DIR, "v2-front-scale-ta1/B_larger_name_dose_200.png");
const FRONT_B = { u0: 0, u1: 918 / 1200, v0: 0, v1: 1 };

async function inspect(filePath) {
  const buf = await fs.readFile(filePath);
  const meta = await sharp(buf).metadata();
  return {
    path: path.relative(repoRoot, filePath),
    bytes: buf.length,
    width: meta.width,
    height: meta.height,
    format: meta.format,
    space: meta.space,
    channels: meta.channels,
    density: meta.density,
    hasAlpha: Boolean(meta.hasAlpha),
    compressionLevel: meta.compressionLevel ?? null,
  };
}

async function measureSvgRaster(svg, density) {
  const img = sharp(Buffer.from(svg), { density });
  const meta = await img.metadata();
  const { info } = await sharp(Buffer.from(svg), { density })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return {
    requestedDensity: density,
    metadataWidth: meta.width,
    metadataHeight: meta.height,
    rawWidth: info.width,
    rawHeight: info.height,
  };
}

function flagResize(fromW, fromH, toW, toH, label) {
  const wr = toW / fromW;
  const hr = toH / fromH;
  let kind = "identity";
  if (wr < 0.99 || hr < 0.99) kind = wr > 1.01 || hr > 1.01 ? "stretch-mixed" : "downsample";
  else if (wr > 1.01 || hr > 1.01) kind = wr < 0.99 || hr < 0.99 ? "stretch-mixed" : "upsample";
  return {
    label,
    from: `${fromW}×${fromH}`,
    to: `${toW}×${toH}`,
    scaleX: Number(wr.toFixed(4)),
    scaleY: Number(hr.toFixed(4)),
    kind,
    reduceThenWouldEnlargeLater: kind === "downsample",
    enlargeAfterSmallRaster: kind === "upsample",
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
  await fs.access(CURRENT_COMPOSITE);
  await fs.access(CURRENT_BLURRY);
  await fs.mkdir(OUT_DIR, { recursive: true });

  const masterKey = resolvePhotoMasterKey(product, placement);
  const placementKey = resolveLabelPlacementKey(product, placement);
  const profile = resolvePlacementRect(placement, placementKey);
  const masterFile = masterPath(masterKey, placement);
  const ssCurrent = Number(placement.compositor?.sharpnessSupersample) || 16;
  const ssOriginalB = Number(placement.compositor?.labelArtworkSupersample) || 8;
  const targetArtW = profile.labelWidth * ssCurrent;
  const targetArtH = profile.labelHeight * ssCurrent;
  const typography = websiteCardLayoutLarger();

  const filled = await fillLockedLabelSvg(product, catalog.defaults || {}, {
    heavierSecondaryText: true,
  });
  const typed = applyWebsiteCardTypography(filled.svg, typography);
  const cropped = cropLockedLabelSvgToWindow(typed, FRONT_B);
  const densityWindow = Math.max(72, 72 * Math.max(targetArtW / cropped.w, targetArtH / cropped.h));
  const nativeWindow = await measureSvgRaster(cropped.svg, densityWindow);

  const originalDensity = Math.max(72, (profile.labelWidth * ssOriginalB) / 1200 * 72);
  const nativeOriginal = await measureSvgRaster(filled.svg, originalDensity);
  const nativeOriginalDefault = await measureSvgRaster(filled.svg, 72);

  const label = await renderLockedLabelArtworkWindow(product, catalog.defaults || {}, {
    width: targetArtW,
    height: targetArtH,
    artworkWindow: FRONT_B,
    heavierSecondaryText: true,
    websiteCardTypography: typography,
  });
  const artworkPath = path.join(OUT_DIR, "2_label_artwork_full.png");
  await fs.writeFile(artworkPath, label.png);

  const masterCopy = path.join(OUT_DIR, "1_photo_master_untouched.png");
  await fs.copyFile(masterFile, masterCopy);

  const compositeCopy = path.join(OUT_DIR, "3_composite_full_before_website.png");
  await fs.copyFile(CURRENT_COMPOSITE, compositeCopy);

  const once400 = path.join(OUT_DIR, "4_composite_once_400x600.png");
  await sharp(CURRENT_COMPOSITE)
    .resize(400, 600, { fit: "contain", background: "#0a0a0a", kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toFile(once400);

  const once200 = path.join(OUT_DIR, "5_composite_once_200x300.png");
  await sharp(CURRENT_COMPOSITE)
    .resize(200, 300, { fit: "contain", background: "#0a0a0a", kernel: "lanczos3" })
    .png({ compressionLevel: 9 })
    .toFile(once200);

  const blurryCopy = path.join(OUT_DIR, "6_current_blurry_test_200.png");
  await fs.copyFile(CURRENT_BLURRY, blurryCopy);

  const files = {
    photoMaster: await inspect(masterCopy),
    labelArtwork: await inspect(artworkPath),
    compositeFull: await inspect(compositeCopy),
    once400: await inspect(once400),
    once200: await inspect(once200),
    currentBlurry: await inspect(blurryCopy),
  };

  const productionWebp = path.join(
    repoRoot,
    "public/ud-labels/catalog/UD_0277_TA_1_5MG_3mL_Website.webp"
  );
  let production = null;
  try {
    production = await inspect(productionWebp);
  } catch {
    production = { missing: true, path: path.relative(repoRoot, productionWebp) };
  }

  const originalBLabel = await renderLockedLabelArtwork(product, catalog.defaults || {}, {
    width: profile.labelWidth * ssOriginalB,
    height: profile.labelHeight * ssOriginalB,
    heavierSecondaryText: true,
  });

  const steps = [
    {
      step: 1,
      name: "fillLockedLabelSvg",
      file: "ud-label-system/scripts/render-locked-label.mjs",
      action: "Replace text/QR in locked 40×20 mm SVG. Vector. No raster.",
      size: "viewBox 1200×600, width=40mm height=20mm",
    },
    {
      step: 2,
      name: "applyWebsiteCardTypography",
      file: "ud-label-system/scripts/website-card-typography.mjs",
      action: "In-memory font-size/y only. Vector. No raster. Not used by original Current B.",
      size: "still 1200×600 user units",
    },
    {
      step: 3,
      name: "cropLockedLabelSvgToWindow",
      file: "ud-label-system/scripts/composite-label-on-photo-master.mjs",
      action: "Runtime viewBox crop to B window. Sets width/height to 918×600 user units.",
      size: `viewBox ${cropped.w}×${cropped.h}`,
    },
    {
      step: 4,
      name: "librsvg via sharp({ density })",
      file: "renderLockedLabelArtworkWindow",
      action: "First rasterization of the SVG.",
      requestedDensity: densityWindow,
      measuredNative: nativeWindow,
      targetAfterResize: `${targetArtW}×${targetArtH}`,
      flag: flagResize(
        nativeWindow.rawWidth,
        nativeWindow.rawHeight,
        targetArtW,
        targetArtH,
        "SVG native raster → artwork buffer"
      ),
    },
    {
      step: 5,
      name: "sharp.resize fit:fill lanczos3",
      file: "renderLockedLabelArtworkWindow",
      action: "Force artwork to face aspect at ss=16 (362×16 by 412×16).",
      from: `${nativeWindow.rawWidth}×${nativeWindow.rawHeight}`,
      to: `${label.width}×${label.height}`,
    },
    {
      step: 6,
      name: "knockoutLabelPageBackground",
      file: "composite-label-on-photo-master.mjs",
      action: "Flood-fill page white to alpha. Same pixel size. No resize.",
    },
    {
      step: 7,
      name: "compositeLabelOnPhotoMaster bicubic sample",
      file: "composite-label-on-photo-master.mjs",
      action: "Sample artwork onto the 362×412 placement on the 1122×1402 photo. Ink is written at photo resolution, not artwork resolution.",
      artwork: `${label.width}×${label.height}`,
      face: `${profile.labelWidth}×${profile.labelHeight}`,
      canvas: "1122×1402",
      flag: flagResize(label.width, label.height, profile.labelWidth, profile.labelHeight, "artwork → face pixels"),
    },
    {
      step: 8,
      name: "website card resize",
      file: "generate-vial-system-v2-front-scale-ta1.mjs card200()",
      action: "One Lanczos contain 1122×1402 → 200×300.",
      flag: flagResize(1122, 1402, 200, 300, "full composite → 200×300"),
    },
  ];

  const originalBPath = {
    name: "Original Current B (B_front_focused.png) — different raster path",
    function: "renderLockedLabelArtwork",
    svgWidthAttr: "40mm",
    density: originalDensity,
    measuredNative: nativeOriginal,
    defaultDensity72: nativeOriginalDefault,
    thenResizeTo: `${profile.labelWidth * ssOriginalB}×${profile.labelHeight * ssOriginalB}`,
    flag: flagResize(
      nativeOriginal.rawWidth,
      nativeOriginal.rawHeight,
      profile.labelWidth * ssOriginalB,
      profile.labelHeight * ssOriginalB,
      "original B: 40mm SVG raster → ss=8 face buffer"
    ),
    default72Flag: flagResize(
      nativeOriginalDefault.rawWidth,
      nativeOriginalDefault.rawHeight,
      1800,
      900,
      "production renderLockedLabelPng: default density 72 → 1800×900"
    ),
    producedArtwork: `${originalBLabel.width}×${originalBLabel.height}`,
  };

  const faceScale = 412 / 600;
  const websiteScale200 = 200 / 1122;
  const websiteScale400 = 400 / 1122;
  const textPx = {
    headerOnFace: Number((typography.header.size * faceScale).toFixed(2)),
    nameOnFace: Number((typography.name.size * faceScale).toFixed(2)),
    doseOnFace: Number((typography.amount.size * faceScale).toFixed(2)),
    formOnFace: Number((typography.form.size * faceScale).toFixed(2)),
    headerAt200: Number((typography.header.size * faceScale * websiteScale200).toFixed(2)),
    nameAt200: Number((typography.name.size * faceScale * websiteScale200).toFixed(2)),
    doseAt200: Number((typography.amount.size * faceScale * websiteScale200).toFixed(2)),
    formAt200: Number((typography.form.size * faceScale * websiteScale200).toFixed(2)),
    headerAt400: Number((typography.header.size * faceScale * websiteScale400).toFixed(2)),
    nameAt400: Number((typography.name.size * faceScale * websiteScale400).toFixed(2)),
  };

  const reduceThenEnlarge = [
    originalBPath.flag.enlargeAfterSmallRaster
      ? "ORIGINAL CURRENT B: librsvg emits a small 40mm raster, then sharp.resize enlarges it to the ss=8 face buffer."
      : null,
    originalBPath.default72Flag.enlargeAfterSmallRaster
      ? "PRODUCTION renderLockedLabelPng: default density 72 rasters 40mm small, then enlarges to 1800×900."
      : null,
    steps[3].flag.enlargeAfterSmallRaster
      ? "CURRENT WINDOW PATH: librsvg native raster is smaller than the 16× artwork target, then enlarged."
      : null,
  ].filter(Boolean);

  const report = {
    ok: true,
    note: "Diagnostic only. No design or pipeline changes.",
    files,
    productionCatalogWebp: production,
    currentPipeline: {
      window: FRONT_B,
      sharpnessSupersample: ssCurrent,
      artworkTarget: `${targetArtW}×${targetArtH}`,
      face: `${profile.labelWidth}×${profile.labelHeight}`,
      canvas: "1122×1402",
      sampleFilter: "bicubic",
      cylinderMaxThetaRad: 0.012,
      centerLinearFrac: 0.76,
      inkHardness: 0.12,
      inkSharpenAmount: 0,
    },
    steps,
    originalCurrentBPath: originalBPath,
    textPixelBudgetAfterComposite: textPx,
    reduceThenEnlargeFlags: reduceThenEnlarge,
    identicalOnce200VsBlurry:
      files.once200.width === files.currentBlurry.width &&
      files.once200.height === files.currentBlurry.height &&
      files.once200.bytes === files.currentBlurry.bytes,
  };
  await fs.writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));

  const captions = [
    [`1 Photo master`, `${files.photoMaster.width}×${files.photoMaster.height} ${files.photoMaster.format} ${files.photoMaster.bytes} B`],
    [`2 Label artwork`, `${files.labelArtwork.width}×${files.labelArtwork.height} ${files.labelArtwork.format} ${files.labelArtwork.bytes} B`],
    [`3 Full composite`, `${files.compositeFull.width}×${files.compositeFull.height} ${files.compositeFull.format} ${files.compositeFull.bytes} B`],
    [`4 Once → 400×600`, `${files.once400.width}×${files.once400.height} ${files.once400.format} ${files.once400.bytes} B`],
    [`5 Once → 200×300`, `${files.once200.width}×${files.once200.height} ${files.once200.format} ${files.once200.bytes} B`],
    [`6 Current blurry test`, `${files.currentBlurry.width}×${files.currentBlurry.height} ${files.currentBlurry.format} ${files.currentBlurry.bytes} B`],
  ];
  const previews = await Promise.all(
    [masterCopy, artworkPath, compositeCopy, once400, once200, blurryCopy].map((file) =>
      sharp(file)
        .resize(220, 280, { fit: "contain", background: "#111", kernel: "lanczos3" })
        .png()
        .toBuffer()
    )
  );
  const cellW = 220;
  const cellH = 280;
  const gutter = 16;
  const top = 72;
  const captionH = 52;
  const width = gutter + 6 * (cellW + gutter);
  const height = top + cellH + captionH + 36;
  const header = captions
    .map((pair, i) => {
      const x = gutter + i * (cellW + gutter) + cellW / 2;
      return `<text x="${x}" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#111">${pair[0]}</text>
        <text x="${x}" y="48" text-anchor="middle" font-family="Arial,sans-serif" font-size="11" fill="#333">${pair[1]}</text>`;
    })
    .join("\n");
  const footer = `<text x="${width / 2}" y="${height - 14}" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" fill="#444">TA-1 diagnostic — sheet cells are previews. True bitmap sizes are in the captions and report.json. No pipeline fix applied.</text>`;
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f4f4f4"/>
      ${header}
      ${footer}
    </svg>`
  );
  const sheet = path.join(REVIEW_DIR, "vial-system-v2-front-diag-ta1.png");
  await sharp(svg)
    .composite(previews.map((input, i) => ({
      input,
      left: gutter + i * (cellW + gutter),
      top,
    })))
    .png({ compressionLevel: 9 })
    .toFile(sheet);

  console.log(JSON.stringify({ ok: true, sheet: path.relative(repoRoot, sheet), report: path.relative(repoRoot, path.join(OUT_DIR, "report.json")), reduceThenEnlarge, files }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
