import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { generateLabel } from "./generate-label.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const catalog = JSON.parse(await fs.readFile(path.join(root, "data/catalog.json"), "utf8"));
const outputDir = "examples/generated";

function find(labelName, amount, vialMl) {
  const match = catalog.products.find((product) =>
    product.labelName.toUpperCase() === labelName.toUpperCase()
    && Number(product.amount) === Number(amount)
    && Number(product.vialMl) === Number(vialMl)
  );
  if (!match) throw new Error(`Example product not found: ${labelName} ${amount}, ${vialMl} mL`);
  return match;
}

const ta1 = find("TA-1", 5, 3);
const klow = find("KLOW", 80, 3);
const nad = find("NAD+", 1000, 10);
const results = [];

results.push(await generateLabel(ta1, { outputDir, outputStem: "TA1_5MG_Catalog_40x20", labelType: "CATALOG", labelSize: "40x20" }));
results.push(await generateLabel(klow, { outputDir, outputStem: "KLOW_80MG_Catalog_40x20", labelType: "CATALOG", labelSize: "40x20" }));
results.push(await generateLabel(klow, {
  outputDir,
  outputStem: "KLOW_80MG_Calculator_40x20",
  labelType: "CALCULATOR",
  labelSize: "40x20",
  DILUENT: "3.2 mL",
  CONCENTRATION: "25 mg/mL",
  DOSE_RANGE: "2.5–5 mg",
  DOSE_UNITS: "10–20 u"
}));
results.push(await generateLabel(klow, { outputDir, outputStem: "KLOW_80MG_Catalog_50x30", labelType: "CATALOG", labelSize: "50x30" }));
results.push(await generateLabel(klow, {
  outputDir,
  outputStem: "KLOW_80MG_Calculator_50x30",
  labelType: "CALCULATOR",
  labelSize: "50x30",
  DILUENT: "3.2 mL",
  CONCENTRATION: "25 mg/mL",
  DOSE_RANGE: "2.5–5 mg",
  DOSE_UNITS: "10–20 u"
}));
results.push(await generateLabel(nad, { outputDir, outputStem: "NAD_PLUS_1000MG_Catalog_50x30", labelType: "CATALOG", labelSize: "50x30" }));

console.log(JSON.stringify({ examples: results.length, results }, null, 2));
