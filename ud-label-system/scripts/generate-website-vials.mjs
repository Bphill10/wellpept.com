/**
 * Generate CATALOG labels from the Excel/catalog map and place them on the
 * matching unlabeled stock vial templates for website product photos.
 *
 * Usage (from ud-label-system/):
 *   node scripts/generate-website-vials.mjs
 *   node scripts/generate-website-vials.mjs --limit 10
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { generateLabel } from "./generate-label.mjs";

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

async function placeLabelOnVial({ labelPath, profileName, outputPath }) {
  const profile = placement.profiles[profileName];
  if (!profile) throw new Error(`Unknown placement profile: ${profileName}`);
  const basePath = path.join(root, profile.baseAsset);
  const bounds = profile.labelBoundsPx;
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  const curve = Math.max(4, Math.round(height * 0.014));

  const label = await sharp(labelPath)
    .resize(width, height, { fit: "fill", kernel: "lanczos3" })
    .removeAlpha()
    .png()
    .toBuffer();

  const mask = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <path d="M0 ${curve} Q${width / 2} 0 ${width} ${curve} L${width} ${height - curve} Q${width / 2} ${height} 0 ${height - curve} Z" fill="white"/>
    </svg>
  `);
  const shade = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="cylinder" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#707070" stop-opacity="0.28"/>
          <stop offset="0.13" stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="0.87" stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="1" stop-color="#707070" stop-opacity="0.28"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#cylinder)"/>
    </svg>
  `);

  const wrappedLabel = await sharp(label)
    .ensureAlpha()
    .composite([
      { input: mask, blend: "dest-in" },
      { input: shade, blend: "multiply" },
    ])
    .png()
    .toBuffer();

  const full = await sharp(basePath)
    .composite([{ input: wrappedLabel, left: bounds.left, top: bounds.top }])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  // Web card size — keep aspect, shrink for deploy weight
  await sharp(full)
    .resize({ width: 640, height: 960, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toFile(outputPath);

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
    version: "2.0",
    generatedAt: new Date().toISOString(),
    source: "data/UD_Peptide_Label_Catalog.xlsx → catalog.json",
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
        generatedAt: new Date().toISOString(),
        byCatalogId: { ...(prev.byCatalogId || {}) },
        byKey: { ...(prev.byKey || {}) },
        products: [...(prev.products || [])],
      };
    } catch {
      /* fresh manifest */
    }
  }

  let ok = 0;
  let fail = 0;
  const errors = [];

  for (let i = 0; i < products.length; i += 1) {
    const product = products[i];
    const profile = String(product.placementProfile || "3ML_WHITE").toUpperCase();
    const stem = safeStem(
      `${product.catalogId}_${product.websiteOutputStem || product.labelOutputStem || product.labelName}`
    );
    const webRel = `ud-labels/catalog/${stem}.webp`;
    const webAbs = path.join(siteRoot, "public", webRel.replace(/\//g, path.sep));

    process.stdout.write(
      `[${i + 1}/${products.length}] ${product.catalogId} ${product.labelName} ${product.amount}${product.unit}… `
    );

    try {
      const label = await generateLabel(product, {
        labelType: "CATALOG",
        labelSize: product.labelSize || (Number(product.vialMl) >= 10 ? "50x30" : "40x20"),
        outputDir: tempLabelDir,
        outputStem: stem,
      });

      await placeLabelOnVial({
        labelPath: label.previewPath,
        profileName: profile,
        outputPath: webAbs,
      });

      const entry = {
        catalogId: product.catalogId,
        labelName: product.labelName,
        amount: product.amount,
        unit: product.unit,
        vialMl: product.vialMl,
        placementProfile: profile,
        visualType: product.visualType,
        image: `/${webRel.replace(/\\/g, "/")}`,
      };
      if (idFilter.length) {
        manifest.products = manifest.products.filter(
          (row) => row.catalogId !== product.catalogId
        );
        // Drop stale CI keys when renaming labelName
        for (const key of Object.keys(manifest.byKey)) {
          if (manifest.byCatalogId[product.catalogId] &&
              manifest.byKey[key] === manifest.byCatalogId[product.catalogId]) {
            delete manifest.byKey[key];
          }
        }
      }
      manifest.products.push(entry);
      manifest.byCatalogId[product.catalogId] = entry.image;
      const key = `${String(product.labelName).toUpperCase()}|${product.amount}|${String(product.unit).toUpperCase()}|${product.vialMl}`;
      manifest.byKey[key] = entry.image;
      // Also name+amount without unit for looser site matching
      const loose = `${String(product.labelName).toUpperCase()}|${product.amount}`;
      if (!manifest.byKey[loose]) manifest.byKey[loose] = entry.image;
      // Full shop name aliases for CJC/IPA blends
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

  const manifestPath = path.join(siteRoot, "public", "ud-labels", "catalog-manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  // Convenience copy for src import fallbacks
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
