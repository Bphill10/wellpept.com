/**
 * Place a website front-facing label onto a stock vial (or accept a
 * pre-rendered website face PNG). Never stretch a NIIMBOT print PNG.
 *
 * Usage:
 *   node scripts/place-label.mjs --label output/website-labels/foo_WebsiteFace.png --profile 3ML_WHITE
 *   node scripts/place-label.mjs --product UD-0160 --profile 3ML_BLUE
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  geometryFromProfile,
  renderWebsiteLabelPng,
} from "./render-website-label.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    args[argv[i].slice(2)] = argv[++i];
  }
  return args;
}

function resolveInsideRoot(value) {
  return path.isAbsolute(value) ? value : path.join(root, value);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const placement = JSON.parse(
    await fs.readFile(path.join(root, "config/vial-placement.json"), "utf8")
  );
  const catalog = JSON.parse(
    await fs.readFile(path.join(root, "data/catalog.json"), "utf8")
  );
  const profileName = String(args.profile || "3ML_WHITE").toUpperCase();
  const profile = placement.profiles[profileName];
  if (!profile) throw new Error(`Unknown placement profile: ${profileName}`);

  const geometry = geometryFromProfile(profile);
  let labelPng;

  if (args.product) {
    const product = catalog.products.find(
      (item) =>
        item.catalogId.toLowerCase() === String(args.product).toLowerCase()
    );
    if (!product) throw new Error(`Product not found: ${args.product}`);
    geometry.brandGapChars =
      product.brandGapChars ?? catalog.defaults?.BRAND_GAP_CHARS ?? 1;
    labelPng = await renderWebsiteLabelPng(
      product,
      geometry,
      catalog.defaults || {}
    );
  } else if (args.label) {
    labelPng = await fs.readFile(resolveInsideRoot(args.label));
    const meta = await sharp(labelPng).metadata();
    if (meta.width !== geometry.width || meta.height !== geometry.height) {
      throw new Error(
        `Label PNG must be ${geometry.width}x${geometry.height} (website face). Got ${meta.width}x${meta.height}. Do not pass a stretched NIIMBOT print.`
      );
    }
  } else {
    throw new Error("Provide --product UD-#### or --label path to website face PNG.");
  }

  const basePath = resolveInsideRoot(args.vial || profile.baseAsset);
  const { width, height, clipPathD, left, top } = geometry;

  const mask = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <path d="${clipPathD}" fill="white"/>
    </svg>
  `);
  const shade = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <clipPath id="clip"><path d="${clipPathD}"/></clipPath>
        <linearGradient id="cylinder" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#707070" stop-opacity="0.22"/>
          <stop offset="0.13" stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="0.87" stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="1" stop-color="#707070" stop-opacity="0.22"/>
        </linearGradient>
      </defs>
      <g clip-path="url(#clip)">
        <rect width="${width}" height="${height}" fill="url(#cylinder)"/>
      </g>
    </svg>
  `);

  const wrappedLabel = await sharp(labelPng)
    .ensureAlpha()
    .composite([
      { input: mask, blend: "dest-in" },
      { input: shade, blend: "multiply" },
    ])
    .png()
    .toBuffer();

  const outputPath = resolveInsideRoot(
    args.output || `output/vials/${profileName}_WebsiteLabeled.png`
  );
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(basePath)
    .composite([{ input: wrappedLabel, left, top }])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  const meta = await sharp(outputPath).metadata();
  if (
    meta.width !== placement.canvas.widthPx ||
    meta.height !== placement.canvas.heightPx
  ) {
    throw new Error(`Unexpected vial canvas: ${meta.width}x${meta.height}`);
  }
  console.log(
    JSON.stringify(
      {
        profile: profileName,
        basePath,
        outputPath,
        bounds: profile.labelBoundsPx,
        clipPathD,
        canvas: `${meta.width}x${meta.height}`,
        renderer: "website-front-facing-reflow",
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
