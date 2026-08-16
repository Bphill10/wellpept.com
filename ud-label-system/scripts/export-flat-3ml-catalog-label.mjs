/**
 * Export the locked 3 mL catalog SVG as a flat native 2:1 PNG.
 * Field fill only. No crop, warp, vial map, or typography edits.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { fillLockedLabelSvg } from "./render-locked-label.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(systemRoot, "..");
const MASTER_REL = "locked-masters/labels/01_3mL_Catalog_40x20_EDIT_CONTENT_ONLY.svg";
const OUT_DIR = path.join(systemRoot, "review/v2-flat-3ml-catalog-source");

async function main() {
  const [catalog, masterSvg] = await Promise.all([
    fs.readFile(path.join(systemRoot, "data/catalog.json"), "utf8").then(JSON.parse),
    fs.readFile(path.join(systemRoot, MASTER_REL), "utf8"),
  ]);
  const product = {
    ...catalog.products.find((row) => String(row.catalogId).toUpperCase() === "UD-0277"),
    labelType: "CATALOG",
  };
  if (!product?.catalogId) throw new Error("Missing UD-0277");

  const widthAttr = /<svg\b[^>]*\swidth="([^"]+)"/.exec(masterSvg)?.[1] || "";
  const heightAttr = /<svg\b[^>]*\sheight="([^"]+)"/.exec(masterSvg)?.[1] || "";
  const viewBox = /viewBox="([^"]+)"/.exec(masterSvg)?.[1] || "";
  const [vbX, vbY, vbW, vbH] = viewBox.split(/[\s,]+/).map(Number);
  const outW = Math.round(vbW);
  const outH = Math.round(vbH);

  const filled = await fillLockedLabelSvg(product, catalog.defaults || {});
  let svg = filled.svg;
  svg = svg.replace(/(<svg\b[^>]*?)\swidth="[^"]+"/, `$1 width="${outW}"`);
  svg = svg.replace(/(<svg\b[^>]*?)\sheight="[^"]+"/, `$1 height="${outH}"`);

  const density = 72;
  const png = await sharp(Buffer.from(svg), { density }).png({ compressionLevel: 6 }).toBuffer();

  await fs.mkdir(OUT_DIR, { recursive: true });
  const pngPath = path.join(OUT_DIR, "TA1_3mL_catalog_40x20_flat_native.png");
  const svgPath = path.join(OUT_DIR, "TA1_3mL_catalog_40x20_flat_filled.svg");
  await fs.writeFile(pngPath, png);
  await fs.writeFile(svgPath, filled.svg);

  const meta = await sharp(pngPath).metadata();
  if (meta.width !== outW || meta.height !== outH) {
    throw new Error(`PNG ${meta.width}×${meta.height} != viewBox ${outW}×${outH}`);
  }
  if (Math.abs(meta.width / meta.height - vbW / vbH) > 1e-9) {
    throw new Error("PNG aspect does not match SVG viewBox");
  }

  const report = {
    master: MASTER_REL,
    svgAttributes: {
      width: widthAttr,
      height: heightAttr,
      viewBox,
      viewBoxX: vbX,
      viewBoxY: vbY,
      viewBoxWidth: vbW,
      viewBoxHeight: vbH,
      aspect: vbW / vbH,
    },
    png: {
      path: path.relative(repoRoot, pngPath),
      width: meta.width,
      height: meta.height,
      aspect: meta.width / meta.height,
      format: meta.format,
    },
    fill: {
      catalogId: product.catalogId,
      labelName: product.labelName,
      amount: product.amount,
      unit: product.unit,
      typographyModified: false,
      heavierSecondaryText: false,
    },
  };
  await fs.writeFile(path.join(OUT_DIR, "report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ ok: true, ...report }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
