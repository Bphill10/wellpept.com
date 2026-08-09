/**
 * Generate the static catalog vial photographs used by the website.
 *
 * One renderer owns every catalog image. It draws a label at the native
 * photographed face size; it never scales a 40x20 or 50x30 print label onto
 * the bottle. The bottle/powder/liquid pixels are copied from locked masters.
 *
 * Usage:
 *   node scripts/generate-catalog-vials.mjs --id UD-0221
 *   node scripts/generate-catalog-vials.mjs --all
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { resolveLabelDisplayName } from "./resolve-label-display-name.mjs";
import {
  placeLockedLabelOnVial,
  renderLockedLabelPng,
} from "./render-locked-label.mjs";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode");
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(systemRoot, "..");

const CATALOG_PATH = path.join(systemRoot, "data/catalog.json");
const MANIFEST_PATH = path.join(repoRoot, "public/ud-labels/catalog-manifest.json");
const PLACEMENT_PATH = path.join(systemRoot, "config/vial-placement.json");
const PUBLIC_CATALOG = path.join(repoRoot, "public/ud-labels/catalog");

const ASSETS = {
  white3:
    "assets/vials/UD_3mL_White_Peptide_Black_Cap_Unlabeled.png",
  blue3:
    "assets/vials/UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png",
  white10:
    "assets/vials/UD_10mL_White_Peptide_Black_Cap_Unlabeled.png",
  red10:
    "locked-masters/vials/04_10mL_B12_Ruby_Red_Liquid_75pct_LOCKED.png",
  logo:
    "assets/brand/UD_Brand_Mark_White_Transparent_Trimmed.png",
  mascot:
    "assets/brand/UD_Sentinel_Mascot_Black_Transparent.png",
};

// These are the photographed label faces, not the flat print dimensions.
const PROFILES = {
  "3ML_WHITE": { left: 194, top: 690, width: 550, height: 500, rail: 50, right: 116, base: "white3" },
  "3ML_BLUE": { left: 207, top: 624, width: 549, height: 530, rail: 49, right: 137, base: "blue3" },
  "10ML_WHITE": { left: 255, top: 544, width: 514, height: 530, rail: 44, right: 128, base: "white10" },
  "10ML_B12_LIQUID": { left: 255, top: 544, width: 514, height: 530, rail: 44, right: 128, base: "red10" },
};

function xml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function dataUri(buffer, mime = "image/png") {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

function parseArgs(argv) {
  const out = { ids: [] };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === "--all") out.all = true;
    else if (argv[i] === "--id") out.ids.push(String(argv[++i] || "").toUpperCase());
  }
  return out;
}

function storageLine(product, defaults) {
  const prefix = String(defaults.STORAGE_PREFIX || "STORE AT").trim();
  const temperature = String(product.storageTemp || defaults.STORAGE_TEMP || "36–46°F").trim();
  return `${prefix} ${temperature}`;
}

function pickProfile(product) {
  const requested = String(product.placementProfile || "").toUpperCase();
  if (PROFILES[requested]) return requested;
  if (Number(product.vialMl) >= 8) return "10ML_WHITE";
  return /BLUE/i.test(String(product.materialColor || product.visualType || ""))
    ? "3ML_BLUE"
    : "3ML_WHITE";
}

function imagePathFor(product, manifest) {
  const row = (manifest.products || []).find((item) => item.catalogId === product.catalogId);
  if (row?.image) return path.join(repoRoot, "public", row.image.replace(/^\//, ""));
  const stem = String(product.websiteOutputStem || `${product.catalogId}_Website`)
    .replace(/[^A-Za-z0-9_-]+/g, "_");
  return path.join(PUBLIC_CATALOG, `${product.catalogId.replace(/-/g, "_")}_${stem}.webp`);
}

async function buildLabelSvg(product, defaults, profile, buffers) {
  const { width: W, height: H, rail, right } = profile;
  const mainLeft = rail;
  const mainRight = W - right;
  const mainW = mainRight - mainLeft;
  const mainCx = mainLeft + mainW / 2;
  const rightCx = mainRight + right / 2;
  const isTen = Number(product.vialMl) >= 8;
  const isLiquid = String(product.formText || "").toUpperCase() === "LIQUID" ||
    String(product.placementProfile || "").toUpperCase() === "10ML_B12_LIQUID";
  const nameSize = isTen ? 58 : 55;
  const name = resolveLabelDisplayName(product, {
    fontSize: nameSize,
    maxWidth: mainW - 34,
  });
  const amount = xml(product.amount);
  const unit = xml(String(product.unit || "MG").toUpperCase());
  const company = xml(String(product.headerCompanyName || defaults.HEADER_COMPANY_NAME || "UNDISCLOSED").toUpperCase());
  const railCompany = xml(String(product.companyName || defaults.COMPANY_NAME || "UNDISCLOSED").toUpperCase());
  const form = xml(String(product.formText || defaults.FORM_TEXT || (isLiquid ? "LIQUID" : "LYOPHILIZED POWDER")).toUpperCase());
  const storage = xml(storageLine(product, defaults));
  const legal = [
    product.legalLine1 || defaults.LEGAL_LINE_1 || "RESEARCH USE",
    product.legalLine2 || defaults.LEGAL_LINE_2 || "NOT FOR HUMAN",
    product.legalLine3 || defaults.LEGAL_LINE_3 || "CONSUMPTION",
  ].map((line) => xml(String(line).toUpperCase()));

  const curve = isTen ? 14 : 16;
  const qrSize = isTen ? 91 : 82;
  const qrX = Math.round(rightCx - qrSize / 2);
  const qrY = isTen ? 164 : 162;
  const mascotSize = isTen ? 74 : 62;
  const mascotX = Math.round(rightCx - mascotSize / 2);
  const mascotY = qrY - mascotSize + 9;
  const logoSize = isTen ? 31 : 29;
  const headerY = isTen ? 83 : 78;
  const nameY = isTen ? 190 : 184;
  const barY = isTen ? 224 : 220;
  const barH = isTen ? 77 : 76;
  const formY = isTen ? 355 : 357;
  const storageY = isTen ? 421 : 425;
  const legalY = isTen ? 348 : 350;
  const family = "Nimbus Sans Narrow, Arial Narrow, Arial, sans-serif";

  const qrData = await QRCode.toDataURL(
    String(
      product.coaUrl ||
        product.qrUrlOverride ||
        product.qrValue ||
        "https://www.wellpept.com"
    ),
    { errorCorrectionLevel: "M", margin: 1, width: qrSize * 3, color: { dark: "#000000", light: "#ffffff" } }
  );

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <clipPath id="label-clip"><path d="M0 0 Q${W / 2} ${curve} ${W} 0 L${W} ${H - curve} Q${W / 2} ${H} 0 ${H - curve} Z"/></clipPath>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#ededed"/><stop offset="0.10" stop-color="#fafafa"/>
      <stop offset="0.50" stop-color="#f7f7f7"/><stop offset="0.90" stop-color="#fafafa"/>
      <stop offset="1" stop-color="#e8e8e8"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#label-clip)" shape-rendering="geometricPrecision">
    <rect width="${W}" height="${H}" fill="url(#paper)"/>
    <rect width="${rail}" height="${H}" fill="#000"/>
    <line x1="${mainRight}" y1="34" x2="${mainRight}" y2="${H - 28}" stroke="#000" stroke-width="2"/>
    <text x="${rail / 2}" y="${H / 2}" text-anchor="middle" dominant-baseline="middle"
      transform="rotate(-90 ${rail / 2} ${H / 2})" font-family="${family}" font-size="27" font-weight="700" letter-spacing="2.5" fill="#fff">${railCompany}</text>
    <image href="${dataUri(buffers.logo)}" x="${Math.round((rail - logoSize) / 2)}" y="${H - logoSize - 22}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>

    <text x="${mainCx}" y="${headerY}" text-anchor="middle" font-family="${family}" font-size="${isTen ? 25 : 23}" font-weight="700" letter-spacing="1.2" fill="#000">— ${company} —</text>
    <text x="${mainCx}" y="${nameY}" text-anchor="middle" font-family="${family}" font-size="${nameSize}" font-weight="700" letter-spacing="0.4" fill="#000">${xml(name)}</text>

    <rect x="${mainLeft + 13}" y="${barY}" width="${mainW - 26}" height="${barH}" rx="9" fill="#000"/>
    <text x="${mainCx}" y="${barY + Math.round(barH * 0.67)}" text-anchor="middle" font-family="${family}" font-size="${isTen ? 49 : 46}" font-weight="700" fill="#fff">${amount}<tspan font-size="${isTen ? 27 : 25}" dx="9">${unit}</tspan></text>

    <text x="${mainCx}" y="${formY}" text-anchor="middle" font-family="${family}" font-size="${isTen ? 23 : 21}" font-weight="700" fill="#000">${form}</text>
    <text x="${mainCx}" y="${storageY}" text-anchor="middle" font-family="${family}" font-size="${isTen ? 22 : 20}" font-weight="700" fill="#000">${storage}</text>

    <image href="${dataUri(buffers.mascot)}" x="${mascotX}" y="${mascotY}" width="${mascotSize}" height="${mascotSize}" preserveAspectRatio="xMidYMid meet"/>
    <rect x="${qrX - 4}" y="${qrY - 4}" width="${qrSize + 8}" height="${qrSize + 8}" rx="9" fill="#fff" stroke="#000" stroke-width="3"/>
    <image href="${qrData}" x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" image-rendering="pixelated"/>
    <text x="${rightCx}" y="${legalY}" text-anchor="middle" font-family="${family}" font-size="${isTen ? 17 : 15}" font-weight="700" fill="#000">
      <tspan x="${rightCx}" dy="0">${legal[0]}</tspan>
      <tspan x="${rightCx}" dy="${isTen ? 22 : 20}">${legal[1]}</tspan>
      <tspan x="${rightCx}" dy="${isTen ? 22 : 20}">${legal[2]}</tspan>
    </text>
  </g>
</svg>`);
}

async function renderOne(product, defaults, manifest, buffers) {
  const profileName = pickProfile(product);
  const placementProfile = buffers.placement.profiles[profileName];
  if (!placementProfile) {
    throw new Error(`Missing locked placement profile: ${profileName}`);
  }
  const basePath = path.join(
    systemRoot,
    ASSETS[PROFILES[profileName].base]
  );
  const label = await renderLockedLabelPng(product, defaults);
  const outputPath = imagePathFor(product, manifest);
  await placeLockedLabelOnVial({
    labelPng: label.png,
    labelWidth: label.width,
    labelHeight: label.height,
    profile: {
      ...placementProfile,
      topClearFraction: buffers.placement.globalRules.topClearFraction,
      labelFraction: buffers.placement.globalRules.labelFraction,
      bottomClearFraction: buffers.placement.globalRules.bottomClearFraction,
    },
    profileName,
    outputPath,
    basePathOverride: basePath,
    transparentBackground: true,
  });
  return { catalogId: product.catalogId, profile: profileName, outputPath };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.all && !args.ids.length) {
    throw new Error("Choose --all or at least one --id UD-####");
  }
  const [catalog, manifest, placement] = await Promise.all([
    fs.readFile(CATALOG_PATH, "utf8").then(JSON.parse),
    fs.readFile(MANIFEST_PATH, "utf8").then(JSON.parse),
    fs.readFile(PLACEMENT_PATH, "utf8").then(JSON.parse),
  ]);
  const selected = catalog.products.filter((product) =>
    product.enabled !== false && (args.all || args.ids.includes(String(product.catalogId).toUpperCase()))
  );
  if (!selected.length) throw new Error("No matching enabled catalog products");
  const results = [];
  const concurrency = 4;
  for (let index = 0; index < selected.length; index += concurrency) {
    const batch = selected.slice(index, index + concurrency);
    results.push(
      ...(await Promise.all(
        batch.map((product) =>
          renderOne(product, catalog.defaults || {}, manifest, { placement })
        )
      ))
    );
    if (results.length % 20 === 0 || results.length === selected.length) {
      console.log(`Rendered ${results.length}/${selected.length}`);
    }
  }
  console.log(JSON.stringify({ ok: true, count: results.length, results }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
