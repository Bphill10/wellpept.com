/**
 * TA-1 website-facing wrap treatments only.
 *
 * The printable SVG is not edited. QR/legal stay in the artwork; they are
 * simply off-camera on the website-facing side of the wrap.
 *
 * A = current optimized full-label view (existing file)
 * B = front-focused: rail + name + dose + form
 * C = minimal luxury: rail + large name + dose
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
const OUT_DIR = path.join(REVIEW_DIR, "v2-front-ta1");

// 3 mL catalog SVG is 1200×600. QR begins at x=940. Amount bar ends at 883.
const WINDOWS = {
  front: { u0: 0, u1: 918 / 1200, v0: 0, v1: 1 },
  luxury: { u0: 0, u1: 888 / 1200, v0: 60 / 600, v1: 384 / 600 },
};

async function renderWindow(product, defaults, placement, stem, artworkWindow) {
  const masterKey = resolvePhotoMasterKey(product, placement);
  const placementKey = resolveLabelPlacementKey(product, placement);
  const profile = resolvePlacementRect(placement, placementKey);
  const ss = Number(placement.compositor?.labelArtworkSupersample) || 8;
  const label = await renderLockedLabelArtwork(product, defaults, {
    width: profile.labelWidth * ss,
    height: profile.labelHeight * ss,
    heavierSecondaryText: true,
  });
  const pngPath = path.join(OUT_DIR, `${stem}.png`);
  await compositeLabelOnPhotoMaster({
    masterPhotoPath: masterPath(masterKey, placement),
    labelArtwork: label.png,
    placementProfile: profile,
    outputPath: pngPath,
    edgeInsetPx: placement.compositor?.edgeInsetPx,
    cylinderMaxThetaRad: placement.compositor?.optimizedCylinderMaxThetaRad,
    labelInkColor: placement.compositor?.labelInkColor,
    optimizeText: true,
    artworkWindow,
  });
  return pngPath;
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
  await fs.access(CURRENT);
  await fs.mkdir(OUT_DIR, { recursive: true });

  console.log("front-focused TA-1");
  const front = await renderWindow(product, catalog.defaults || {}, placement, "B_front_focused", WINDOWS.front);
  console.log("minimal-luxury TA-1");
  const luxury = await renderWindow(product, catalog.defaults || {}, placement, "C_minimal_luxury", WINDOWS.luxury);

  const a = await card200(CURRENT);
  const b = await card200(front);
  const c = await card200(luxury);
  await fs.writeFile(path.join(OUT_DIR, "A_current_200.png"), a);
  await fs.writeFile(path.join(OUT_DIR, "B_front_200.png"), b);
  await fs.writeFile(path.join(OUT_DIR, "C_luxury_200.png"), c);

  const titles = ["A Current optimized", "B Front-focused", "C Minimal luxury"];
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
  const footer = `<text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#444">TA-1 website cards 200×300 — printable SVG unchanged; QR/legal remain on the wrap, off-camera</text>`;
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f4f4f4"/>
      ${header}
      ${footer}
    </svg>`
  );
  const out = path.join(REVIEW_DIR, "vial-system-v2-front-ta1-200.png");
  await sharp(svg)
    .composite([
      { input: a, left: gutter, top: topGutter },
      { input: b, left: gutter + cellW + gutter, top: topGutter },
      { input: c, left: gutter + 2 * (cellW + gutter), top: topGutter },
    ])
    .png({ compressionLevel: 9 })
    .toFile(out);

  console.log(
    JSON.stringify(
      {
        ok: true,
        sheet: path.relative(repoRoot, out),
        windows: WINDOWS,
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
