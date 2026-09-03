/**
 * Vial content renderers — LIQUID vs POWDER are separate paths.
 * Never recolor a peptide-cake stock to imitate liquid.
 *
 * B12: wipe every cake pixel from the full glass ID, then paint a dedicated
 * translucent ruby liquid volume (75% fill, curved meniscus). Glass speculars
 * are composited back on top — never a recolored powder cake.
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

/** Full inner glass ID — used to wipe cake (wider than liquid paint). */
const BODY = Object.freeze({
  left: 258,
  right: 766,
  top: 470,
  bottom: 1372,
});

/** Liquid paint cylinder — clipped inside the clear chamber. */
const CHAMBER = Object.freeze({
  left: 286,
  right: 738,
  top: 490,
  bottom: 1370,
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

function cylinderHit(x, y, box, rxScale = 1) {
  const cx = (box.left + box.right) / 2;
  const rx = ((box.right - box.left) / 2) * rxScale;
  const t = (y - box.top) / Math.max(1, box.bottom - box.top);
  // Follow the rounded heel — gentle taper only in the last 4%
  const taper = t > 0.96 ? 1 - (t - 0.96) * 2.2 : 1;
  const dx = (x - cx) / Math.max(1, rx * Math.max(0.55, taper));
  if (dx * dx > 1) return null;
  return {
    dx,
    edge: Math.sqrt(Math.max(0, 1 - dx * dx)),
    t,
    cx,
    rx: rx * Math.max(0.55, taper),
  };
}

function isCakePixel(r, g, b) {
  const lum = (r + g + b) / 3;
  const sat = Math.max(r, g, b) - Math.min(r, g, b);
  if (lum > 48 && sat < 52 && Math.abs(r - g) < 40 && Math.abs(g - b) < 40) {
    return true;
  }
  if (lum > 32 && sat < 22 && Math.abs(r - g) < 18 && Math.abs(g - b) < 18) {
    return true;
  }
  return false;
}

/**
 * Remove every lyophilized cake / powder pixel from the glass ID.
 * Replace with clear-glass samples from the empty upper chamber.
 */
function emptyChamber(out, width, box) {
  const sampleY0 = box.top + Math.round((box.bottom - box.top) * 0.06);
  const sampleY1 = box.top + Math.round((box.bottom - box.top) * 0.32);

  for (let y = box.top; y <= box.bottom; y += 1) {
    for (let x = box.left; x <= box.right; x += 1) {
      const hit = cylinderHit(x, y, box, 1.04);
      if (!hit) continue;

      const i = (y * width + x) * 4;
      if (!isCakePixel(out[i], out[i + 1], out[i + 2])) continue;

      let sr = 0;
      let sg = 0;
      let sb = 0;
      let n = 0;
      for (let sy = sampleY0; sy <= sampleY1; sy += 2) {
        const si = (sy * width + x) * 4;
        const sl = (out[si] + out[si + 1] + out[si + 2]) / 3;
        if (sl > 100) continue;
        sr += out[si];
        sg += out[si + 1];
        sb += out[si + 2];
        n += 1;
      }
      if (n < 2) {
        const glass = 10 + hit.edge * 16;
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
 * Paint a dedicated translucent ruby volume (not an alpha rectangle on black).
 * Glass speculars from the original plate are restored on top of the liquid.
 */
function paintLiquid(out, cleared, source, width, chamber, body, opts) {
  const fill = Number(opts.fillFraction) || 0.75;
  const rgb = hexToRgb(opts.liquidColor || "#A50018");
  const chamberH = chamber.bottom - chamber.top;
  const liquidTopFlat = chamber.bottom - chamberH * fill;
  const meniscusAmp = Math.max(36, Math.round(chamberH * 0.055));

  for (let y = chamber.top; y <= chamber.bottom; y += 1) {
    for (let x = chamber.left; x <= chamber.right; x += 1) {
      const hit = cylinderHit(x, y, chamber, 1);
      if (!hit) continue;

      // Concave meniscus: surface climbs the glass walls (aqueous)
      const meniscusY = liquidTopFlat + hit.edge * meniscusAmp;
      if (y < meniscusY) continue;

      const i = (y * width + x) * 4;
      const depth =
        (y - meniscusY) / Math.max(1, chamber.bottom - meniscusY);

      // Dye volume: center more see-through (shows dark glass), walls denser.
      const radial = 1 - hit.edge; // 0 center → 1 wall
      const open = hit.edge * hit.edge;
      let lr = Math.round(rgb.r * (0.28 + open * 0.62) + radial * 22);
      let lg = Math.round(rgb.g * (0.16 + open * 0.35) + depth * 2);
      let lb = Math.round(rgb.b * (0.28 + open * 0.48) + radial * 5 + 3);

      // Richer heel, softer near meniscus — keep surface ruby readable
      const heel = 0.78 + depth * 0.32;
      lr = Math.min(255, Math.round(lr * heel));
      lg = Math.min(255, Math.round(lg * heel));
      lb = Math.min(255, Math.round(lb * heel));

      // Blend toward cleared dark glass so the volume reads translucent
      const cr = cleared[i];
      const cg = cleared[i + 1];
      const cb = cleared[i + 2];
      // Stronger near the free surface so the meniscus doesn't vanish in the center
      const surfaceBoost = Math.max(0, 1 - Math.min(1, (y - meniscusY) / 28)) * 0.18;
      let alpha = 0.5 + radial * 0.26 + depth * 0.16 + surfaceBoost;
      alpha = Math.min(0.9, Math.max(0.36, alpha));

      let r = Math.round(cr * (1 - alpha) + lr * alpha);
      let g = Math.round(cg * (1 - alpha) + lg * alpha);
      let b = Math.round(cb * (1 - alpha) + lb * alpha);

      // Soft meniscus fade (top 3 px) so the surface isn't a hard cut
      const fade = Math.max(0, Math.min(1, (y - meniscusY) / 3));
      if (fade < 1) {
        r = Math.round(cr * (1 - fade) + r * fade);
        g = Math.round(cg * (1 - fade) + g * fade);
        b = Math.round(cb * (1 - fade) + b * fade);
      }

      out[i] = r;
      out[i + 1] = g;
      out[i + 2] = b;
    }
  }

  // Restore original glass speculars over liquid (wall highlight columns)
  for (let y = chamber.top; y <= chamber.bottom; y += 1) {
    for (let x = body.left; x <= body.right; x += 1) {
      const hit = cylinderHit(x, y, chamber, 1.02);
      if (!hit) continue;
      const meniscusY = liquidTopFlat + hit.edge * meniscusAmp;
      if (y < meniscusY) continue;

      const i = (y * width + x) * 4;
      const sr0 = source[i];
      const sg0 = source[i + 1];
      const sb0 = source[i + 2];
      const lum = (sr0 + sg0 + sb0) / 3;
      const sat = Math.max(sr0, sg0, sb0) - Math.min(sr0, sg0, sb0);
      const nearWall = x < body.left + 58 || x > body.right - 58;
      // Never reintroduce cake / powder as a "specular"
      if (isCakePixel(sr0, sg0, sb0)) continue;
      if (lum < 65) continue;
      // Skip chalky mid-body leftovers
      if (!nearWall && sat < 28 && lum > 100 && Math.abs(sr0 - sg0) < 24) {
        continue;
      }

      let spec = 0;
      if (lum > 200) spec = nearWall ? 0.85 : 0.45;
      else if (lum > 150) spec = nearWall ? 0.62 : 0.28;
      else if (lum > 110) spec = nearWall ? 0.38 : 0.14;
      else if (lum > 65) spec = nearWall ? 0.18 : 0.06;

      if (spec <= 0) continue;
      out[i] = Math.min(255, Math.round(out[i] * (1 - spec) + sr0 * spec));
      out[i + 1] = Math.min(
        255,
        Math.round(out[i + 1] * (1 - spec) + sg0 * spec)
      );
      out[i + 2] = Math.min(
        255,
        Math.round(out[i + 2] * (1 - spec) + sb0 * spec)
      );
    }
  }

  // Curved meniscus highlight
  const cx = (chamber.left + chamber.right) / 2;
  const rx = (chamber.right - chamber.left) / 2;
  for (let x = chamber.left; x <= chamber.right; x += 1) {
    const dx = (x - cx) / rx;
    if (dx * dx > 1) continue;
    const edge = Math.sqrt(Math.max(0, 1 - dx * dx));
    const my = Math.round(liquidTopFlat + edge * meniscusAmp);
    for (let dy = -1; dy <= 2; dy += 1) {
      const y = my + dy;
      if (y < chamber.top || y > chamber.bottom) continue;
      if (!cylinderHit(x, y, chamber, 1)) continue;
      const i = (y * width + x) * 4;
      const boost = dy < 0 ? 14 : dy === 0 ? 48 : dy === 1 ? 24 : 10;
      out[i] = Math.min(255, out[i] + boost);
      out[i + 1] = Math.min(255, out[i + 1] + Math.round(boost * 0.2));
      out[i + 2] = Math.min(255, out[i + 2] + Math.round(boost * 0.26));
    }
  }
}

/**
 * Dedicated B12 liquid stock — not a recolored powder plate.
 */
export async function renderLiquidVial(options = {}) {
  const liquidColor = options.liquidColor || B12_LIQUID.liquidColor;
  const fillFraction = options.fillFraction ?? B12_LIQUID.fillFraction;
  const outRel = options.assetRel || B12_LIQUID.assetRel;
  const assetPath = path.join(root, outRel);
  const publicPath = path.join(
    siteRoot,
    "public",
    "ud-labels",
    "vials",
    path.basename(outRel)
  );
  const lockedLiquid = path.join(
    root,
    "locked-masters/vials/04_10mL_B12_Ruby_Red_Liquid_75pct_LOCKED.png"
  );
  const publishedPath = path.join(root, "blender/PUBLISHED.json");
  let published = null;
  try {
    published = JSON.parse(await fs.readFile(publishedPath, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  let png;
  let width;
  let height;
  if (published?.plates?.length) {
    const meta = await sharp(lockedLiquid).metadata();
    width = meta.width;
    height = meta.height;
    png = await sharp(lockedLiquid).png({ compressionLevel: 9 }).toBuffer();
  } else {
    const sourcePath = path.join(root, options.sourceRel || B12_LIQUID.sourceRel);
    const { data, info } = await sharp(sourcePath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    width = info.width;
    height = info.height;
    const source = Buffer.from(data);
    const out = Buffer.from(data);

    emptyChamber(out, width, BODY);
    emptyChamber(out, width, BODY);
    const cleared = Buffer.from(out);
    paintLiquid(out, cleared, source, width, CHAMBER, BODY, {
      liquidColor,
      fillFraction,
    });

    png = await sharp(out, { raw: { width, height, channels: 4 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  await fs.mkdir(path.dirname(assetPath), { recursive: true });
  await fs.mkdir(path.dirname(publicPath), { recursive: true });
  await fs.writeFile(assetPath, png);
  await fs.writeFile(publicPath, png);

  const altName = "UD_10mL_Red_Liquid_75pct_Black_Cap_Unlabeled.png";
  if (path.basename(outRel) !== altName) {
    await fs.writeFile(path.join(root, "assets", "vials", altName), png);
    await fs.writeFile(
      path.join(siteRoot, "public", "ud-labels", "vials", altName),
      png
    );
  }

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

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
