/**
 * Generate the photographic-master V2 TEST set only.
 *
 * Does not touch public/ud-labels/catalog/ or the production manifest.
 * Does not regenerate all 303 products.
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
const TEST_DIR = path.join(repoRoot, "public/ud-labels/catalog-v2-test");
const CALC_DIR = path.join(repoRoot, "public/ud-labels/calculator-v2-test");
const REVIEW_DIR = path.join(systemRoot, "review");
const OLD_CATALOG = path.join(repoRoot, "public/ud-labels/catalog");

const CATALOG_TEST_IDS = [
  "UD-0277",
  "UD-0221",
  "UD-0161",
  "UD-0122",
  "UD-0204",
  "UD-0037",
];

const FIVE_ML_DEMO = {
  enabled: true,
  catalogId: "UD-5ML-DEMO",
  fullProductName: "5 mL DEMO",
  labelName: "5 mL DEMO",
  amount: 10,
  unit: "MG",
  vialMl: 5,
  labelType: "CATALOG",
  labelSize: "40x20",
  formText: "LYOPHILIZED POWDER",
  storageTemp: "36–46°F",
  materialColor: "WHITE",
  visualType: "WHITE CAKE",
  placementProfile: "5ML_WHITE",
  labelPlacement: "5ML_LABEL_PLACEMENT",
  qrValue: "https://www.wellpept.com",
  qrEnabled: true,
  companyName: "UNDISCLOSED",
  headerCompanyName: "UNDISCLOSED",
  legalLine1: "RESEARCH USE",
  legalLine2: "NOT FOR HUMAN",
  legalLine3: "CONSUMPTION",
  websiteOutputStem: "5ML_DEMO_SAMPLE_5mL_Website",
};

const CALCULATOR_TESTS = [
  { id: "UD-0277", labelType: "CALCULATOR", stem: "calculator-TA1-5mg-3ml-white" },
  { id: "UD-0161", labelType: "CALCULATOR", stem: "calculator-KLOW-80mg-3ml-cobalt" },
  { id: "UD-0204", labelType: "CALCULATOR", stem: "calculator-NAD-1000mg-10ml-white" },
  { id: "UD-0037", labelType: "CALCULATOR", stem: "calculator-B12-10mg-10ml-red" },
];

function fileStem(product) {
  const id = String(product.catalogId).replace(/-/g, "_");
  const name = String(product.labelName || "PRODUCT")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
  const amount = `${product.amount}${String(product.unit || "MG").toUpperCase()}`;
  return `${id}_${name}_${amount}_${product.vialMl}mL_v2`;
}

async function renderProduct(product, defaults, placement, outputDir, extra = {}) {
  const masterKey = extra.masterKey || resolvePhotoMasterKey(product, placement);
  const placementKey = extra.placementKey || resolveLabelPlacementKey(product, placement);
  const profile = resolvePlacementRect(placement, placementKey);
  const ss = Number(placement.compositor?.labelArtworkSupersample) || 8;
  const label = await renderLockedLabelArtwork(product, defaults, {
    width: profile.labelWidth * ss,
    height: profile.labelHeight * ss,
    heavierSecondaryText: Boolean(extra.optimizeText),
  });
  const stem = extra.stem || fileStem(product);
  const pngPath = path.join(outputDir, `${stem}.png`);
  await compositeLabelOnPhotoMaster({
    masterPhotoPath: masterPath(masterKey, placement),
    labelArtwork: label.png,
    placementProfile: profile,
    outputPath: pngPath,
    edgeInsetPx: placement.compositor?.edgeInsetPx,
    cylinderMaxThetaRad:
      extra.optimizeText && placement.compositor?.optimizedCylinderMaxThetaRad != null
        ? placement.compositor.optimizedCylinderMaxThetaRad
        : placement.compositor?.cylinderMaxThetaRad,
    labelInkColor: placement.compositor?.labelInkColor,
    optimizeText: Boolean(extra.optimizeText),
  });
  return {
    catalogId: product.catalogId,
    labelName: product.labelName,
    amount: product.amount,
    unit: product.unit,
    vialMl: product.vialMl,
    labelType: product.labelType,
    masterKey,
    placementKey,
    output: path.relative(repoRoot, pngPath),
    labelMaster: label.masterRel,
    labelRaster: `${label.width}x${label.height}`,
  };
}

async function buildMastersSheet(placement) {
  const keys = ["3ml-white", "3ml-cobalt", "5ml-white", "10ml-white", "10ml-red"];
  const cellW = 280;
  const cellH = 350;
  const pad = 28;
  const labelH = 36;
  const width = pad + keys.length * (cellW + pad);
  const height = pad + labelH + cellH + pad;
  const composites = [];
  const labels = [];
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    const file = path.join(systemRoot, placement.photos[key].file);
    const x = pad + i * (cellW + pad);
    const y = pad + labelH;
    const fitted = await sharp(file)
      .resize(cellW, cellH, { fit: "contain", background: "#111111", kernel: "lanczos3" })
      .png()
      .toBuffer();
    composites.push({ input: fitted, left: x, top: y });
    labels.push(
      `<text x="${x + cellW / 2}" y="${pad + 24}" text-anchor="middle" font-family="Arial,sans-serif" font-size="18" font-weight="700" fill="#111">${key}</text>`
    );
  }
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f3f3f3"/>
      ${labels.join("\n")}
    </svg>`
  );
  const out = path.join(REVIEW_DIR, "vial-system-v2-masters.png");
  await sharp(svg)
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

async function buildComparisonSheet(results) {
  const pairs = [
    {
      title: "3 mL white",
      old: path.join(OLD_CATALOG, "UD_0277_TA_1_5MG_3mL_Website.webp"),
      neu: path.join(repoRoot, results.find((r) => r.catalogId === "UD-0277").output),
    },
    {
      title: "3 mL cobalt",
      old: path.join(OLD_CATALOG, "UD_0161_KLOW_80MG_3mL_Website.webp"),
      neu: path.join(repoRoot, results.find((r) => r.catalogId === "UD-0161").output),
    },
    {
      title: "10 mL white",
      old: path.join(OLD_CATALOG, "UD_0204_NAD_1000MG_10mL_Website.webp"),
      neu: path.join(repoRoot, results.find((r) => r.catalogId === "UD-0204").output),
    },
    {
      title: "10 mL red",
      old: path.join(OLD_CATALOG, "UD_0037_B12_10MG_10mL_Website.webp"),
      neu: path.join(repoRoot, results.find((r) => r.catalogId === "UD-0037").output),
    },
  ];

  const cellW = 320;
  const cellH = 400;
  const gutter = 28;
  const leftGutter = 150;
  const topGutter = 72;
  const width = leftGutter + cellW * 2 + gutter * 3;
  const height = topGutter + pairs.length * (cellH + gutter) + gutter;

  const header = `
    <text x="${leftGutter + cellW / 2}" y="44" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#111">OLD</text>
    <text x="${leftGutter + cellW + gutter + cellW / 2}" y="44" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#111">NEW</text>
  `;
  const rowLabels = pairs
    .map((pair, i) => {
      const cy = topGutter + i * (cellH + gutter) + cellH / 2;
      return `<text x="24" y="${cy}" font-family="Arial,sans-serif" font-size="20" font-weight="700" fill="#111">${pair.title}</text>`;
    })
    .join("\n");

  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#efefef"/>
      ${header}
      ${rowLabels}
    </svg>`
  );

  const composites = [];
  for (let i = 0; i < pairs.length; i += 1) {
    const y = topGutter + i * (cellH + gutter);
    const oldFit = await sharp(pairs[i].old)
      .resize(cellW, cellH, { fit: "contain", background: "#0a0a0a", kernel: "lanczos3" })
      .png()
      .toBuffer();
    const newFit = await sharp(pairs[i].neu)
      .resize(cellW, cellH, { fit: "contain", background: "#0a0a0a", kernel: "lanczos3" })
      .png()
      .toBuffer();
    composites.push({ input: oldFit, left: leftGutter, top: y });
    composites.push({
      input: newFit,
      left: leftGutter + cellW + gutter,
      top: y,
    });
  }

  const out = path.join(REVIEW_DIR, "vial-system-v2-comparison.png");
  await sharp(svg)
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

async function buildNewOnlySheet(results) {
  const cards = [
    { title: "3 mL white", id: "UD-0277" },
    { title: "3 mL cobalt", id: "UD-0161" },
    { title: "5 mL demo", id: "UD-5ML-DEMO" },
    { title: "10 mL white", id: "UD-0204" },
    { title: "10 mL red", id: "UD-0037" },
  ];
  const cellW = 200;
  const cellH = 300;
  const gutter = 20;
  const topGutter = 64;
  const width = gutter + cards.length * (cellW + gutter);
  const height = topGutter + cellH + 48;
  const labels = cards
    .map((card, i) => {
      const x = gutter + i * (cellW + gutter) + cellW / 2;
      return `<text x="${x}" y="36" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" font-weight="700" fill="#111">${card.title}</text>`;
    })
    .join("\n");
  const caption = `<text x="${width / 2}" y="${height - 16}" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" fill="#444">Website card size 200×300 — NEW only</text>`;
  const svg = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="#f4f4f4"/>
      ${labels}
      ${caption}
    </svg>`
  );
  const composites = [];
  for (let i = 0; i < cards.length; i += 1) {
    const row = results.find((item) => item.catalogId === cards[i].id);
    if (!row) throw new Error(`Missing new-only card ${cards[i].id}`);
    const fitted = await sharp(path.join(repoRoot, row.output))
      .resize(cellW, cellH, { fit: "contain", background: "#0a0a0a", kernel: "lanczos3" })
      .png()
      .toBuffer();
    composites.push({
      input: fitted,
      left: gutter + i * (cellW + gutter),
      top: topGutter,
    });
  }
  const out = path.join(REVIEW_DIR, "vial-system-v2-new-only.png");
  await sharp(svg)
    .composite(composites)
    .png({ compressionLevel: 9 })
    .toFile(out);
  return out;
}

async function main() {
  const [catalog, placement] = await Promise.all([
    fs.readFile(CATALOG_PATH, "utf8").then(JSON.parse),
    fs.readFile(PLACEMENT_PATH, "utf8").then(JSON.parse),
  ]);
  const defaults = catalog.defaults || {};
  const byId = new Map(
    catalog.products.map((product) => [String(product.catalogId).toUpperCase(), product])
  );

  await fs.mkdir(TEST_DIR, { recursive: true });
  await fs.mkdir(CALC_DIR, { recursive: true });
  await fs.mkdir(REVIEW_DIR, { recursive: true });

  const catalogResults = [];
  for (const id of CATALOG_TEST_IDS) {
    const product = byId.get(id);
    if (!product) throw new Error(`Missing catalog product ${id}`);
    catalogResults.push(await renderProduct({ ...product, labelType: "CATALOG" }, defaults, placement, TEST_DIR));
    console.log("catalog", id, catalogResults.at(-1).output);
  }
  catalogResults.push(
    await renderProduct({ ...FIVE_ML_DEMO }, defaults, placement, TEST_DIR, {
      masterKey: "5ml-white",
    })
  );
  console.log("catalog", "UD-5ML-DEMO", catalogResults.at(-1).output);

  const calculatorResults = [];
  for (const row of CALCULATOR_TESTS) {
    const product = byId.get(row.id);
    if (!product) throw new Error(`Missing catalog product ${row.id}`);
    const calcProduct = {
      ...product,
      labelType: "CALCULATOR",
      diluent: product.diluent || (Number(product.vialMl) >= 8 ? "5 mL" : "2 mL"),
      concentration: product.concentration || "—",
      doseRange: product.doseRange || "—",
      doseUnits: product.doseUnits || "",
    };
    calculatorResults.push(
      await renderProduct(calcProduct, defaults, placement, CALC_DIR, { stem: row.stem })
    );
    console.log("calculator", row.id, calculatorResults.at(-1).output);
  }

  const mastersSheet = await buildMastersSheet(placement);
  const comparisonSheet = await buildComparisonSheet(catalogResults);
  const newOnlySheet = await buildNewOnlySheet(catalogResults);

  const manifest = {
    status: "TEST_ONLY_AWAITING_VISUAL_APPROVAL",
    productionUntouched: {
      catalog: "public/ud-labels/catalog/",
      manifest: "public/ud-labels/catalog-manifest.json",
      calculator: "src/utils/vialArt.js drawGeneratedVial",
    },
    catalogTest: catalogResults,
    calculatorTest: calculatorResults,
    review: {
      comparison: path.relative(repoRoot, comparisonSheet),
      masters: path.relative(repoRoot, mastersSheet),
      newOnly: path.relative(repoRoot, newOnlySheet),
    },
    placements: placement.placements,
  };
  await fs.writeFile(
    path.join(TEST_DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`
  );
  console.log(JSON.stringify({ ok: true, catalog: catalogResults.length, calculator: calculatorResults.length }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
