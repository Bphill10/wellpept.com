import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";
import { ERP_SUBMISSIONS } from "../../src/data/erpPeptide.js";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const workbookPath = path.join(root, "data/UD_Peptide_Label_Catalog.xlsx");
const workbook = XLSX.readFile(workbookPath, { cellDates: false, raw: true });

function rows(sheetName) {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Missing workbook sheet: ${sheetName}`);
  return XLSX.utils.sheet_to_json(sheet, { defval: "", raw: true });
}

function bool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return /^(true|yes|1)$/i.test(value.trim());
  return fallback;
}

function text(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function number(value, fallback = null) {
  const parsed = Number.parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function slug(value) {
  return text(value)
    .replace(/\+/g, " PLUS ")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function compoundKey(value) {
  return text(value)
    .replace(/\([^)]*\)/g, " ")
    .toUpperCase()
    .replace(/\+/g, " PLUS ")
    .replace(/[^A-Z0-9]+/g, "");
}

function isB12Row(row, labelName) {
  const name = `${labelName} ${text(row["Full Product Name"])}`;
  return (
    /^B12$/i.test(labelName) ||
    /\bVITAMIN\s*B\s*12\b/i.test(name) ||
    (/\bMETHYLCOBALAMIN\b/i.test(name) && /\bB12\b/i.test(name))
  );
}

function submissionUnit(submission) {
  if (text(submission.unit)) return text(submission.unit).toUpperCase();
  const form = text(submission.form).toUpperCase();
  if (/\bIU\b/.test(form)) return "IU";
  return "MG";
}

const vendorCoas = ERP_SUBMISSIONS.filter((submission) =>
  text(submission.coaUrl)
);

function findVendorCoa({ labelName, fullProductName, amount, unit }) {
  const names = [labelName, fullProductName].map(compoundKey).filter(Boolean);
  const match = vendorCoas.find((submission) => {
    const candidate = compoundKey(submission.name);
    const nameMatches = names.some(
      (name) => name === candidate || name.startsWith(candidate) || candidate.startsWith(name)
    );
    return (
      nameMatches &&
      Number(submission.mg) === Number(amount) &&
      submissionUnit(submission) === unit
    );
  });
  return text(match?.coaUrl);
}

const defaults = Object.fromEntries(rows("Text Defaults").map((row) => [text(row.Field), row["Default Value"]]));
const placement = JSON.parse(await fs.readFile(path.join(root, "config/vial-placement.json"), "utf8"));
const productRows = rows("Product Catalog");

const products = productRows.map((row) => {
  const vialMl = number(row["Vial mL"], 3);
  const labelSize = text(row["Label Size"]) || (vialMl >= 10 ? "50x30" : "40x20");
  const labelType = (text(row["Label Type"]) || "CATALOG").toUpperCase();
  const labelName = text(row["Label Name"]);
  const amount = number(row.Amount, row.Amount);
  const unit = (text(row.Unit) || "MG").toUpperCase();
  const coaUrl =
    text(row["COA URL"]) ||
    findVendorCoa({
      labelName,
      fullProductName: row["Full Product Name"],
      amount,
      unit,
    });
  const qrOverride = text(row["QR URL Override"]);
  const qrValue =
    coaUrl ||
    qrOverride ||
    text(row["QR Value"]) ||
    `UD|${labelName}|${amount}${unit}|${labelType}`;
  const materialColor = (text(row["Material Color"]) || "WHITE").toUpperCase();
  const isB12Liquid =
    vialMl >= 10 &&
    isB12Row(row, labelName) &&
    (materialColor === "RED" || /\bLIQUID\b/i.test(text(row["Form Text"])));
  const profile = isB12Liquid
    ? "10ML_B12_LIQUID"
    : vialMl >= 10
      ? "10ML_WHITE"
      : materialColor === "COBALT BLUE"
        ? "3ML_BLUE"
        : "3ML_WHITE";
  const outputSeed = `${labelName}_${amount}${unit}`;
  return {
    enabled: bool(row.Enabled, true),
    catalogId: text(row["Catalog ID"]),
    fullProductName: text(row["Full Product Name"]),
    labelName,
    amount,
    unit,
    vialMl,
    labelType,
    labelSize,
    templateFile: text(row["Template File"]) || `UD_${labelType === "CALCULATOR" ? "Calculator" : "Catalog"}_${labelSize}mm_M2.svg`,
    formText: text(row["Form Text"]) || text(defaults.FORM_TEXT),
    storageTemp: text(row["Storage Temp"]) || text(defaults.STORAGE_TEMP),
    materialColor,
    visualType: text(row["Visual Type"]),
    baseVialAsset: text(row["Base Vial Asset"]) || placement.profiles[profile].baseAsset,
    placementProfile: profile,
    diluent: text(row.Diluent),
    concentration: text(row.Concentration),
    doseRange: text(row["Dose Range"]),
    doseUnits: text(row["Dose Units"]),
    coaUrl,
    qrUrlOverride: qrOverride,
    qrValue,
    qrEnabled: bool(row["QR Enabled"], bool(defaults.QR_ENABLED, true)),
    mascotEnabled: bool(row["Mascot Enabled"], bool(defaults.MASCOT_ENABLED, true)),
    brandGapChars: number(row["Brand Gap Chars"], number(defaults.BRAND_GAP_CHARS, 1)),
    companyName: text(row["Company Name"]) || text(defaults.COMPANY_NAME),
    headerCompanyName: text(row["Header Company"]) || text(defaults.HEADER_COMPANY_NAME),
    legalLine1: text(row["Legal Line 1"]) || text(defaults.LEGAL_LINE_1),
    legalLine2: text(row["Legal Line 2"]) || text(defaults.LEGAL_LINE_2),
    legalLine3: text(row["Legal Line 3"]) || text(defaults.LEGAL_LINE_3),
    labelOutputStem: text(row["Label Output Stem"]) || `${slug(outputSeed)}_${labelSize}_${labelType}`,
    websiteOutputStem: text(row["Website Output Stem"]) || `${slug(outputSeed)}_${vialMl}mL_Website`,
    source: text(row.Source),
    notes: text(row.Notes),
  };
});

const required = ["catalogId", "labelName", "amount", "unit", "vialMl", "labelType", "labelSize", "templateFile"];
const errors = [];
for (const product of products) {
  for (const field of required) {
    if (product[field] === "" || product[field] == null) errors.push(`${product.catalogId || "unknown"}: missing ${field}`);
  }
  if (!["MG", "MCG", "G", "IU", "ML"].includes(product.unit)) errors.push(`${product.catalogId}: unsupported unit ${product.unit}`);
  if (!["40x20", "50x30"].includes(product.labelSize)) errors.push(`${product.catalogId}: unsupported label size ${product.labelSize}`);
}
if (errors.length) throw new Error(`Workbook validation failed:\n${errors.slice(0, 30).join("\n")}`);

const payload = {
  version: "2.0",
  generatedFrom: "data/UD_Peptide_Label_Catalog.xlsx",
  generatedAt: new Date().toISOString(),
  productCount: products.length,
  defaults,
  products,
};

await fs.writeFile(path.join(root, "data/catalog.json"), `${JSON.stringify(payload, null, 2)}\n`);
await fs.writeFile(path.join(root, "data/catalog.csv"), XLSX.utils.sheet_to_csv(workbook.Sheets["Product Catalog"]));
console.log(JSON.stringify({ productCount: products.length, json: "data/catalog.json", csv: "data/catalog.csv" }, null, 2));
