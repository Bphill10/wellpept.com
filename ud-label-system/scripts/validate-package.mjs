import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const system = JSON.parse(await fs.readFile(path.join(root, "config/label-system.json"), "utf8"));
const placement = JSON.parse(await fs.readFile(path.join(root, "config/vial-placement.json"), "utf8"));
const catalog = JSON.parse(await fs.readFile(path.join(root, "data/catalog.json"), "utf8"));
const errors = [];
const checks = [];

async function exists(relativePath) {
  try {
    await fs.access(path.join(root, relativePath));
    checks.push({ check: "file", path: relativePath, status: "pass" });
    return true;
  } catch {
    errors.push(`Missing file: ${relativePath}`);
    return false;
  }
}

for (const relativePath of [
  "data/UD_Peptide_Label_Catalog.xlsx",
  "data/catalog.json",
  "assets/brand/UD_Brand_Mark_Latest_Original.png",
  "assets/brand/UD_Brand_Mark_Black_Transparent.png",
  "assets/brand/UD_Brand_Mark_White_Transparent.png",
  "assets/brand/UD_Sentinel_Mascot_Original.png",
  "assets/vials/UD_3mL_White_Peptide_Black_Cap_Unlabeled.png",
  "assets/vials/UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png",
  "assets/vials/UD_10mL_White_Peptide_Black_Cap_Unlabeled.png",
  "assets/approved-products/TA1_5mg_3mL_White_BlackCap_Website_Final.png",
  "assets/approved-products/KLOW_80mg_3mL_Blue_BlackCap_Website.png",
  "assets/approved-products/NAD_PLUS_1000mg_10mL_White_BlackCap_Website.png"
]) await exists(relativePath);

for (const [key, relativePath] of Object.entries(system.templates)) {
  if (!await exists(relativePath)) continue;
  const svg = await fs.readFile(path.join(root, relativePath), "utf8");
  const size = key.endsWith("40x20") ? "40x20" : "50x30";
  const physical = system.print.profiles[size];
  if (!svg.includes(`width="${physical.widthMm}mm"`) || !svg.includes(`height="${physical.heightMm}mm"`)) errors.push(`${key}: wrong physical dimensions`);
  if (!svg.includes('id="left-brand-rail"') || !svg.includes('data-full-bleed="true"') || !svg.includes('x="0" y="0"')) errors.push(`${key}: left rail is not full bleed`);
  if (/id="outer-border"|data-outer-border="true"/.test(svg)) errors.push(`${key}: outer border is forbidden`);
  for (const field of system.editableFields.shared) {
    if (["QR_VALUE", "QR_ENABLED", "MASCOT_ENABLED", "BRAND_GAP_CHARS"].includes(field)) continue;
    if (!svg.includes(`{{${field}}}`) && !svg.includes(`data-field="${field}"`)) errors.push(`${key}: missing shared field ${field}`);
  }
  const typeFields = key.startsWith("CATALOG") ? system.editableFields.catalog : system.editableFields.calculator;
  for (const field of typeFields) {
    if (!svg.includes(`{{${field}}}`) && !svg.includes(`data-field="${field}"`)) errors.push(`${key}: missing type field ${field}`);
  }
  if (!svg.includes("UD_Brand_Mark_Latest_Original.png")) errors.push(`${key}: latest brand source metadata missing`);
  if (!svg.includes("UD_Sentinel_Mascot_Original.png")) errors.push(`${key}: mascot source metadata missing`);
  checks.push({ check: "template", template: key, size, status: "pass" });
}

for (const [size, profile] of Object.entries(system.print.profiles)) {
  const generatedDir = path.join(root, "examples/generated");
  const files = (await fs.readdir(generatedDir)).filter((file) => file.includes(size) && file.endsWith("_M2_300dpi_1bit.png"));
  if (!files.length) errors.push(`No generated ${size} print proof`);
  for (const file of files) {
    const filePath = path.join(generatedDir, file);
    const meta = await sharp(filePath).metadata();
    if (meta.width !== profile.widthPx || meta.height !== profile.heightPx) errors.push(`${file}: ${meta.width}x${meta.height}, expected ${profile.widthPx}x${profile.heightPx}`);
    const { data, info } = await sharp(filePath).grayscale().raw().toBuffer({ resolveWithObject: true });
    const colors = new Set();
    for (let i = 0; i < data.length; i += info.channels) colors.add(data[i]);
    if (colors.size > 2) errors.push(`${file}: expected monochrome, found ${colors.size} gray levels`);
    checks.push({ check: "print", file: path.relative(root, filePath), dimensions: `${meta.width}x${meta.height}`, colors: colors.size, status: "pass" });
  }
}

if (catalog.productCount < 300) errors.push(`Expected at least 300 products; found ${catalog.productCount}`);
const hghRows = catalog.products.filter((product) => /(^|\b)HGH(\b|$)/i.test(product.labelName));
if (!hghRows.length || hghRows.some((product) => product.unit !== "IU")) errors.push("HGH catalog rows must use IU");
checks.push({ check: "catalog", products: catalog.productCount, hghUsesIU: true, status: "pass" });

for (const [name, profile] of Object.entries(placement.profiles)) {
  const fractions = placement.globalRules.topClearFraction + placement.globalRules.labelFraction + placement.globalRules.bottomClearFraction;
  if (Math.abs(fractions - 1) > 0.0001) errors.push(`${name}: vertical fractions do not equal 100%`);
  if (profile.vialMl === 3 && (profile.labelWidthMm !== 40 || profile.labelHeightMm !== 20)) errors.push(`${name}: 3 mL must use 40x20`);
  if (profile.vialMl === 10 && (profile.labelWidthMm !== 50 || profile.labelHeightMm !== 30)) errors.push(`${name}: 10 mL must use 50x30`);
  checks.push({ check: "placement", profile: name, coverage: "20/60/20", status: "pass" });
}

const assetPaths = [
  system.brand.brandMarkOriginal,
  system.brand.mascotOriginal,
  "assets/vials/UD_3mL_White_Peptide_Black_Cap_Unlabeled.png",
  "assets/vials/UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png",
  "assets/vials/UD_10mL_White_Peptide_Black_Cap_Unlabeled.png"
];
const hashes = {};
for (const relativePath of assetPaths) {
  const bytes = await fs.readFile(path.join(root, relativePath));
  hashes[relativePath] = crypto.createHash("sha256").update(bytes).digest("hex");
}

const report = {
  version: "2.0",
  status: errors.length ? "FAIL" : "PASS",
  printer: "NIIMBOT M2",
  productCount: catalog.productCount,
  brandMark: "latest supplied UD image",
  mascot: "UD Sentinel",
  checks,
  hashes,
  errors
};
await fs.writeFile(path.join(root, "validation-report.json"), `${JSON.stringify(report, null, 2)}\n`);
if (errors.length) throw new Error(`Package validation failed:\n${errors.join("\n")}`);
console.log(JSON.stringify({ status: report.status, productCount: report.productCount, checks: checks.length }, null, 2));
