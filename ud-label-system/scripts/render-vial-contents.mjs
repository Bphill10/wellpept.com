/**
 * Vial content renderers — LIQUID vs POWDER are separate paths.
 * Never recolor a peptide-cake stock to imitate liquid.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const siteRoot = path.resolve(root, "..");

export const B12_LIQUID = Object.freeze({
  contentsType: "LIQUID",
  liquidColor: "#A50018",
  fillFraction: 0.75,
  vialProfile: "10ML",
  formText: "LIQUID",
  assetRel: "assets/vials/UD_10mL_B12_Red_Liquid_Black_Cap_Unlabeled.png",
  sourceRel: "assets/vials/UD_10mL_White_Peptide_Black_Cap_Unlabeled.png",
});

/** Inner usable chamber on the 1024×1536 10 mL plate (not full canvas). */
const CHAMBER = Object.freeze({
  left: 300,
  right: 724,
  top: 470,
  bottom: 1355,
});

function hexToRgb(hex) {
  const h = String(hex || "").replace("#", "");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

export function isB12Product(product = {}) {
  if (String(product.contentsType || "").toUpperCase() === "LIQUID") {
    const name = `${product.labelName || ""} ${product.fullProductName || ""}`;
    if (/\bb12\b/i.test(name) || /\bmethylcobalamin\b/i.test(name)) return true;
  }
  const text = `${product.labelName || ""} ${product.fullProductName || ""}`;
  if (/^B12$/i.test(String(product.labelName || "").trim())) return true;
  if (/\bvitamin\s*b\s*12\b/i.test(text)) return true;
  if (/\bmethylcobalamin\b/i.test(text) && /\bb12\b/i.test(text)) return true;
  if (/^B12\b/i.test(String(product.fullProductName || "").trim())) return true;
  return false;
}

export function applyB12LiquidFields(product) {
  if (!isB12Product(product)) return product;
  return {
    ...product,
    contentsType: B12_LIQUID.contentsType,
    liquidColor: B12_LIQUID.liquidColor,
    fillFraction: B12_LIQUID.fillFraction,
    vialProfile: B12_LIQUID.vialProfile,
    formText: B12_LIQUID.formText,
    materialColor: "RED",
    visualType: "RED LIQUID 75%",
    baseVialAsset: path.basename(B12_LIQUID.assetRel),
    placementProfile: "10ML_B12_LIQUID",
  };
}

/**
 * Empty the inner chamber: wipe peptide cake with vertically sampled clear glass.
 * No powder/granule texture remains.
 */
function emptyChamber(out, width, height, chamber) {
  const cx = (chamber.left + chamber.right) / 2;
  const rx = (chamber.right - chamber.left) * 0.495;
  const sampleY0 = chamber.top + Math.round((chamber.bottom - chamber.top) * 0.12);
  const sampleY1 = chamber.top + Math.round((chamber.bottom - chamber.top) * 0.28);

  for (let y = chamber.top; y <= chamber.bottom; y += 1) {
    for (let x = chamber.left; x <= chamber.right; x += 1) {
      const dx = (x - cx) / rx;
      if (dx * dx > 1) continue;

      const i = (y * width + x) * 4;
      const r0 = out[i];
      const g0 = out[i + 1];
      const b0 = out[i + 2];
      const lum = (r0 + g0 + b0) / 3;
      const sat = Math.max(r0, g0, b0) - Math.min(r0, g0, b0);

      // Pale cake / milky sediment — replace with clear-glass sample from same column
      const looksCake =
        lum > 70 && sat < 55 && Math.abs(r0 - g0) < 40 && Math.abs(g0 - b0) < 40;
      if (!looksCake) continue;

      // Average a few pixels from the empty upper chamber in this column
      let sr = 0;
      let sg = 0;
      let sb = 0;
      let n = 0;
      for (let sy = sampleY0; sy <= sampleY1; sy += 3) {
        const si = (sy * width + x) * 4;
        const sl = (out[si] + out[si + 1] + out[si + 2]) / 3;
        if (sl > 120) continue; // skip specular spikes
        sr += out[si];
        sg += out[si + 1];
        sb += out[si + 2];
        n += 1;
      }
      if (n < 2) {
        const edge = Math.sqrt(Math.max(0, 1 - dx * dx));
        const glass = 18 + edge * 10;
        out[i] = glass;
        out[i + 1] = glass;
        out[i + 2] = Math.min(255, glass + 2);
      } else {
        out[i] = Math.round(sr / n);
        out[i + 1] = Math.round(sg / n);
        out[i + 2] = Math.round(sb / n);
      }
    }
  }
}

/**
 * Smooth ruby liquid inside the chamber only. Center translucent, edges/bottom darker.
 * Subtle curved meniscus. Never a rectangle; never red outside the inner mask.
 */
function paintLiquid(out, width, chamber, opts) {
  const fill = Number(opts.fillFraction) || 0.75;
  const rgb = hexToRgb(opts.liquidColor || "#A50018");
  const cx = (chamber.left + chamber.right) / 2;
  const rx = (chamber.right - chamber.left) * 0.495;
  const chamberH = chamber.bottom - chamber.top;
  const liquidTopFlat = chamber.bottom - chamberH * fill;

  for (let y = chamber.top; y <= chamber.bottom; y += 1) {
    for (let x = chamber.left; x <= chamber.right; x += 1) {
      const dx = (x - cx) / rx;
      if (dx * dx > 1) continue;

      // Path length through cylinder (1 at center, 0 at wall)
      const edge = Math.sqrt(Math.max(0, 1 - dx * dx));
      // Meniscus: slightly higher near walls (concave)
      const meniscusY = liquidTopFlat + (1 - edge) * 10;
      if (y < meniscusY) continue;

      const i = (y * width + x) * 4;
      const r0 = out[i];
      const g0 = out[i + 1];
      const b0 = out[i + 2];
      const lum = (r0 + g0 + b0) / 3;

      const depth =
        (y - meniscusY) / Math.max(1, chamber.bottom - meniscusY);

      // Optical path: darker/side walls, brighter center (more see-through)
      let alpha = 0.28 + depth * 0.34 + (1 - edge) * 0.18;
      // Keep strong glass speculars
      if (lum > 210) alpha *= 0.18;
      else if (lum > 165) alpha *= 0.4;
      alpha = Math.min(0.72, Math.max(0.12, alpha));

      out[i] = Math.min(255, Math.round(r0 * (1 - alpha) + rgb.r * alpha));
      out[i + 1] = Math.min(255, Math.round(g0 * (1 - alpha) + rgb.g * alpha));
      out[i + 2] = Math.min(255, Math.round(b0 * (1 - alpha) + rgb.b * alpha));
    }
  }

  // Soft bright meniscus rim (1–2 px) — curved, not a flat strip
  for (let x = chamber.left; x <= chamber.right; x += 1) {
    const dx = (x - cx) / rx;
    if (dx * dx > 1) continue;
    const edge = Math.sqrt(Math.max(0, 1 - dx * dx));
    const my = Math.round(liquidTopFlat + (1 - edge) * 10);
    for (let dy = 0; dy <= 1; dy += 1) {
      const y = my + dy;
      if (y < chamber.top || y > chamber.bottom) continue;
      const i = (y * width + x) * 4;
      out[i] = Math.min(255, out[i] + 28);
      out[i + 1] = Math.min(255, out[i + 1] + 8);
      out[i + 2] = Math.min(255, out[i + 2] + 10);
    }
  }
}

/**
 * Dedicated B12 liquid stock — not a recolored powder plate.
 */
export async function renderLiquidVial(options = {}) {
  const liquidColor = options.liquidColor || B12_LIQUID.liquidColor;
  const fillFraction = options.fillFraction ?? B12_LIQUID.fillFraction;
  const sourcePath = path.join(root, options.sourceRel || B12_LIQUID.sourceRel);
  const outRel = options.assetRel || B12_LIQUID.assetRel;
  const assetPath = path.join(root, outRel);
  const publicPath = path.join(siteRoot, "public", "ud-labels", "vials", path.basename(outRel));

  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const out = Buffer.from(data);

  emptyChamber(out, width, height, CHAMBER);
  paintLiquid(out, width, CHAMBER, { liquidColor, fillFraction });

  const png = await sharp(out, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await fs.mkdir(path.dirname(assetPath), { recursive: true });
  await fs.mkdir(path.dirname(publicPath), { recursive: true });
  await fs.writeFile(assetPath, png);
  await fs.writeFile(publicPath, png);

  return { assetPath, publicPath, width, height, fillFraction, liquidColor };
}

/** Powder path — existing white/blue stocks are authoritative; no recolor. */
export async function renderPowderVial({ profile } = {}) {
  if (!profile?.baseAsset) {
    throw new Error("renderPowderVial requires a placement profile with baseAsset");
  }
  const assetPath = path.join(root, profile.baseAsset);
  await fs.access(assetPath);
  return { assetPath, contentsType: "POWDER" };
}

export async function renderVialContents(product, profile) {
  const normalized = applyB12LiquidFields(product);
  if (
    String(normalized.contentsType || "").toUpperCase() === "LIQUID" ||
    isB12Product(normalized)
  ) {
    return renderLiquidVial({
      liquidColor: normalized.liquidColor || B12_LIQUID.liquidColor,
      fillFraction: normalized.fillFraction ?? B12_LIQUID.fillFraction,
    });
  }
  return renderPowderVial({ profile });
}

async function main() {
  const result = await renderLiquidVial();
  console.log(JSON.stringify(result, null, 2));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
