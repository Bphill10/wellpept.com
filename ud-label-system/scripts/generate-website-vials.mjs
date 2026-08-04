/**
 * Generate CATALOG website vials from locked SVG masters.
 * Content replacement only — never reconstruct or stretch NIIMBOT geometry.
 *
 * Usage (from ud-label-system/):
 *   node scripts/generate-website-vials.mjs
 *   node scripts/generate-website-vials.mjs --limit 10
 *   node scripts/generate-website-vials.mjs --id UD-0160
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyB12LiquidFields } from "./render-vial-contents.mjs";
import {
  renderWebsiteVialFromReference,
  resolveWebsiteProfileName,
} from "./render-website-from-reference.mjs";

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
 * Powder cakes vs liquid stocks are separate assets.
 * Standalone B12 only → dedicated ruby liquid 10 mL plate (never recolored cake).
 */
function resolvePlacementProfile(product) {
  return resolveWebsiteProfileName(product);
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
    renderer: "website-reference-content-replace",
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
        renderer: "website-reference-content-replace",
        byCatalogId: { ...(prev.byCatalogId || {}) },
        byKey: { ...(prev.byKey || {}) },
        products: [...(prev.products || [])],
      };
    } catch {
      /* fresh */
    }
  }

  const defaults = catalog.defaults || {};
  let ok = 0;
  let fail = 0;
  const errors = [];

  for (let i = 0; i < products.length; i += 1) {
    const product = products[i];
    const profileName = resolvePlacementProfile(product);
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
    const labelPngPath = path.join(tempLabelDir, `${stem}_LockedFace.png`);
    const fullPngPath = path.join(tempLabelDir, `${stem}_Full.png`);

    process.stdout.write(
      `[${i + 1}/${products.length}] ${product.catalogId} ${product.labelName} ${product.amount}${product.unit}… `
    );

    try {
      const productForLabel = applyB12LiquidFields(product);
      const rendered = await renderWebsiteVialFromReference(productForLabel, defaults, {
        outputPath: webAbs,
        alsoSaveFullPng: fullPngPath,
      });
      await fs.writeFile(labelPngPath, rendered.full);

      const entry = {
        catalogId: productForLabel.catalogId,
        labelName: productForLabel.labelName,
        displayName: rendered.peptide,
        amount: productForLabel.amount,
        unit: productForLabel.unit,
        vialMl: productForLabel.vialMl,
        placementProfile: rendered.profileName || profileName,
        contentsType: productForLabel.contentsType || "POWDER",
        visualType: productForLabel.visualType,
        image: `/${webRel.replace(/\\/g, "/")}`,
        renderer: "website-reference-content-replace",
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
