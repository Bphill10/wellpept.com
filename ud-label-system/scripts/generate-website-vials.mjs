/**
 * Generate CATALOG website vials by compositing a front-facing web label
 * (never stretch NIIMBOT print PNGs) onto unlabeled stock vial templates.
 *
 * Usage (from ud-label-system/):
 *   node scripts/generate-website-vials.mjs
 *   node scripts/generate-website-vials.mjs --limit 10
 *   node scripts/generate-website-vials.mjs --id UD-0160
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  buildWebsiteLabelSvg,
  geometryFromProfile,
  renderWebsiteLabelPng,
} from "./render-website-label.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const siteRoot = path.resolve(root, "..");
const publicCatalogDir = path.join(siteRoot, "public", "ud-labels", "catalog");
const tempLabelDir = path.join(root, "output", "website-labels");
const placement = JSON.parse(
  await fs.readFile(path.join(root, "config", "vial-placement.json"), "utf8")
);
const catalog = JSON.parse(
  await fs.readFile(path.join(root, "data", "catalog.json"), "utf8")
);

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    args[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--")
      ? argv[++i]
      : true;
  }
  return args;
}

function safeStem(value) {
  return String(value || "")
    .replace(/\+/g, " PLUS ")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

/**
 * Place a already-sized website label PNG (exact bounds W×H) onto the stock
 * vial with one shared curved clip + light cylinder shade. No label stretch.
 */
async function placeWebsiteLabelOnVial({
  labelPng,
  profileName,
  outputPath,
  alsoSaveFullPng = null,
}) {
  const profile = placement.profiles[profileName];
  if (!profile) throw new Error(`Unknown placement profile: ${profileName}`);
  const basePath = path.join(root, profile.baseAsset);
  const geometry = geometryFromProfile(profile);
  const { width, height, clipPathD, left, top } = geometry;

  const meta = await sharp(labelPng).metadata();
  if (meta.width !== width || meta.height !== height) {
    throw new Error(
      `Website label must be ${width}x${height}, got ${meta.width}x${meta.height}`
    );
  }

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

  const full = await sharp(basePath)
    .composite([{ input: wrappedLabel, left, top }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  const fullMeta = await sharp(full).metadata();
  if (
    fullMeta.width !== placement.canvas.widthPx ||
    fullMeta.height !== placement.canvas.heightPx
  ) {
    throw new Error(
      `Unexpected vial canvas: ${fullMeta.width}x${fullMeta.height}`
    );
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  // Full-resolution website output remains 1024×1536
  await sharp(full)
    .webp({ quality: 88, effort: 4 })
    .toFile(outputPath);

  if (alsoSaveFullPng) {
    await fs.mkdir(path.dirname(alsoSaveFullPng), { recursive: true });
    await fs.writeFile(alsoSaveFullPng, full);
  }

  return outputPath;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const limit = Number(args.limit) || 0;
  const idFilter = String(args.id || "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);
  let products = catalog.products.filter((p) => p.enabled !== false);
  if (idFilter.length) {
    products = products.filter((p) =>
      idFilter.includes(String(p.catalogId || "").toUpperCase())
    );
    if (!products.length) {
      throw new Error(`No products matched --id ${idFilter.join(",")}`);
    }
  }
  if (limit > 0) products = products.slice(0, limit);

  await fs.mkdir(publicCatalogDir, { recursive: true });
  await fs.mkdir(tempLabelDir, { recursive: true });

  const existingManifestPath = path.join(
    siteRoot,
    "public",
    "ud-labels",
    "catalog-manifest.json"
  );
  let manifest = {
    version: "2.1",
    generatedAt: new Date().toISOString(),
    source: "data/UD_Peptide_Label_Catalog.xlsx → catalog.json",
    renderer: "website-front-facing-reflow",
    canvas: placement.canvas,
    count: 0,
    byCatalogId: {},
    byKey: {},
    products: [],
  };
  if (idFilter.length) {
    try {
      const prev = JSON.parse(await fs.readFile(existingManifestPath, "utf8"));
      manifest = {
        ...prev,
        version: "2.1",
        generatedAt: new Date().toISOString(),
        renderer: "website-front-facing-reflow",
        byCatalogId: { ...(prev.byCatalogId || {}) },
        byKey: { ...(prev.byKey || {}) },
        products: [...(prev.products || [])],
      };
    } catch {
      /* fresh */
    }
  }

  const defaults = catalog.defaults || {};
  const assetCache = {};
  let ok = 0;
  let fail = 0;
  const errors = [];

  for (let i = 0; i < products.length; i += 1) {
    const product = products[i];
    const profileName = String(
      product.placementProfile || "3ML_WHITE"
    ).toUpperCase();
    const profile = placement.profiles[profileName];
    if (!profile) {
      fail += 1;
      errors.push({
        catalogId: product.catalogId,
        error: `Unknown profile ${profileName}`,
      });
      console.log(
        `[${i + 1}/${products.length}] ${product.catalogId} FAIL unknown profile`
      );
      continue;
    }

    const stem = safeStem(
      `${product.catalogId}_${product.websiteOutputStem || product.labelOutputStem || product.labelName}`
    );
    const webRel = `ud-labels/catalog/${stem}.webp`;
    const webAbs = path.join(siteRoot, "public", webRel.replace(/\//g, path.sep));
    const labelSvgPath = path.join(tempLabelDir, `${stem}_WebsiteFace.svg`);
    const labelPngPath = path.join(tempLabelDir, `${stem}_WebsiteFace.png`);

    process.stdout.write(
      `[${i + 1}/${products.length}] ${product.catalogId} ${product.labelName} ${product.amount}${product.unit}… `
    );

    try {
      const geometry = geometryFromProfile(profile);
      geometry.brandGapChars =
        product.brandGapChars ?? defaults.BRAND_GAP_CHARS ?? 1;

      const svg = buildWebsiteLabelSvg(product, geometry, defaults);
      await fs.writeFile(labelSvgPath, svg);

      const labelPng = await renderWebsiteLabelPng(
        product,
        geometry,
        defaults,
        assetCache
      );
      await fs.writeFile(labelPngPath, labelPng);

      await placeWebsiteLabelOnVial({
        labelPng,
        profileName,
        outputPath: webAbs,
      });

      const entry = {
        catalogId: product.catalogId,
        labelName: product.labelName,
        amount: product.amount,
        unit: product.unit,
        vialMl: product.vialMl,
        placementProfile: profileName,
        visualType: product.visualType,
        image: `/${webRel.replace(/\\/g, "/")}`,
        renderer: "website-front-facing-reflow",
      };
      if (idFilter.length) {
        manifest.products = manifest.products.filter(
          (row) => row.catalogId !== product.catalogId
        );
        for (const key of Object.keys(manifest.byKey)) {
          if (
            manifest.byCatalogId[product.catalogId] &&
            manifest.byKey[key] === manifest.byCatalogId[product.catalogId]
          ) {
            delete manifest.byKey[key];
          }
        }
      }
      manifest.products.push(entry);
      manifest.byCatalogId[product.catalogId] = entry.image;
      const key = `${String(product.labelName).toUpperCase()}|${product.amount}|${String(product.unit).toUpperCase()}|${product.vialMl}`;
      manifest.byKey[key] = entry.image;
      const loose = `${String(product.labelName).toUpperCase()}|${product.amount}`;
      if (!manifest.byKey[loose]) manifest.byKey[loose] = entry.image;
      const full = String(product.fullProductName || "").toUpperCase();
      if (full) {
        const fullKey = `${full}|${product.amount}|${String(product.unit).toUpperCase()}|${product.vialMl}`;
        const fullLoose = `${full}|${product.amount}`;
        manifest.byKey[fullKey] = entry.image;
        if (!manifest.byKey[fullLoose]) manifest.byKey[fullLoose] = entry.image;
      }

      ok += 1;
      console.log("ok");
    } catch (err) {
      fail += 1;
      const message = err?.message || String(err);
      errors.push({ catalogId: product.catalogId, error: message });
      console.log(`FAIL ${message}`);
    }
  }

  manifest.count = Object.keys(manifest.byCatalogId).length;
  manifest.fail = fail;
  manifest.errors = errors;

  const manifestPath = path.join(
    siteRoot,
    "public",
    "ud-labels",
    "catalog-manifest.json"
  );
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  await fs.writeFile(
    path.join(siteRoot, "src", "data", "udCatalogVialManifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(
    JSON.stringify(
      {
        ok,
        fail,
        publicCatalogDir,
        manifestPath,
        sample: manifest.products.slice(0, 3),
      },
      null,
      2
    )
  );
  if (fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
