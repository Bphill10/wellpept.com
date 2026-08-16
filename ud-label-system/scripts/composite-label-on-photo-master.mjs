/**
 * Composite locked SVG label artwork onto a locked photographic vial master.
 *
 * The photograph is never redrawn. The full placement rectangle is
 * recolored as one label-stock surface (luminance/texture preserved),
 * then black artwork is printed on top. This does not replace
 * placeLockedLabelOnVial().
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { fillLockedLabelSvg } from "./render-locked-label.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");

const DEFAULT_RASTER_MIN_WIDTH = 3600;
const DEFAULT_INSET = 0;
const DEFAULT_THETA = 0.1;
const DEFAULT_STOCK = "#D4D8DE";
const DEFAULT_STOCK_REF_LUM = 214;

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function parseCssColor(value, fallback = DEFAULT_STOCK) {
  const raw = String(value || fallback).trim();
  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i.exec(raw);
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
    };
  }
  return parseCssColor(fallback);
}

export function resolvePhotoMasterKey(product = {}, placement) {
  const requested = String(product.placementProfile || "").toUpperCase();
  const photoMap = placement?.photoByCatalogProfile || placement?.profileToMaster || {};
  if (photoMap[requested]) return photoMap[requested];
  const vialMl = Number(product.vialMl) || 3;
  if (vialMl >= 8) {
    return /RED|B12|LIQUID/i.test(
      String(product.materialColor || product.visualType || product.formText || "")
    )
      ? "10ml-red"
      : "10ml-white";
  }
  if (vialMl >= 4.5 && vialMl < 8) return "5ml-white";
  return /BLUE|COBALT/i.test(String(product.materialColor || product.visualType || ""))
    ? "3ml-cobalt"
    : "3ml-white";
}

/**
 * Size-only placement. Content color never changes the rectangle.
 */
export function resolveLabelPlacementKey(product = {}, placement = {}) {
  const photoKey = resolvePhotoMasterKey(product, placement);
  const fromPhoto = placement?.photos?.[photoKey]?.placement;
  if (fromPhoto && placement?.placements?.[fromPhoto]) return fromPhoto;
  const vialMl = Number(product.vialMl) || 3;
  if (vialMl >= 8) return "10ML_LABEL_PLACEMENT";
  if (vialMl >= 4.5 && vialMl < 8) return "5ML_LABEL_PLACEMENT";
  return "3ML_LABEL_PLACEMENT";
}

export function resolvePlacementRect(placement, placementKey) {
  const rect = placement?.placements?.[placementKey];
  if (!rect) throw new Error(`Unknown label placement profile: ${placementKey}`);
  return rect;
}

export async function renderLockedLabelPngHiRes(
  product = {},
  defaults = {},
  minWidth = DEFAULT_RASTER_MIN_WIDTH
) {
  const { svg, masterRel } = await fillLockedLabelSvg(product, defaults);
  const widthMatch = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const vbW = Number(widthMatch?.[1] || 1200);
  const vbH = Number(widthMatch?.[2] || 600);
  const outW = Math.max(minWidth, Math.round(vbW));
  const outH = Math.round((outW * vbH) / vbW);
  const density = Math.max(600, Math.round((outW / vbW) * 96 * 4));
  const png = await sharp(Buffer.from(svg), { density })
    .resize(outW, outH, { fit: "fill", kernel: "lanczos3" })
    .png({ compressionLevel: 6 })
    .toBuffer();
  return { png, width: outW, height: outH, masterRel, aspect: outW / outH };
}

/**
 * Knock out the flat white page background. Printed white (amount-bar
 * text, QR quiet zone) stays because it is not connected to the edges.
 */
export async function knockoutLabelPageBackground(pngBuffer) {
  const { data, info } = await sharp(pngBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const visited = new Uint8Array(width * height);
  const stack = [];

  const isPageWhite = (offset) => {
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    return lum(r, g, b) >= 236 && Math.max(r, g, b) - Math.min(r, g, b) <= 18;
  };

  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    if (!isPageWhite(p * 4)) return;
    visited[p] = 1;
    stack.push(p);
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const p = stack.pop();
    const x = p % width;
    const y = (p / width) | 0;
    data[p * 4 + 3] = 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }

  return sharp(data, {
    raw: { width, height, channels: 4 },
  })
    .png()
    .toBuffer();
}

function isLightOnDark(src, width, height, x, y) {
  let dark = 0;
  let total = 0;
  for (let dy = -5; dy <= 5; dy += 1) {
    for (let dx = -5; dx <= 5; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const sx = x + dx;
      const sy = y + dy;
      if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
      const i = (sy * width + sx) * 4;
      if (src[i + 3] < 20) continue;
      total += 1;
      if (lum(src[i], src[i + 1], src[i + 2]) < 165) dark += 1;
    }
  }
  return total > 8 && dark / total >= 0.55;
}

function sampleBilinear(src, width, height, u, v) {
  const x = Math.max(0, Math.min(width - 1.001, u * (width - 1)));
  const y = Math.max(0, Math.min(height - 1.001, v * (height - 1)));
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const i00 = (y0 * width + x0) * 4;
  const i10 = (y0 * width + x1) * 4;
  const i01 = (y1 * width + x0) * 4;
  const i11 = (y1 * width + x1) * 4;
  const out = [0, 0, 0, 0];
  for (let c = 0; c < 4; c += 1) {
    const a = src[i00 + c] * (1 - tx) + src[i10 + c] * tx;
    const b = src[i01 + c] * (1 - tx) + src[i11 + c] * tx;
    out[c] = a * (1 - ty) + b * ty;
  }
  return out;
}

/**
 * @param {object} options
 * @param {string} options.masterPhotoPath
 * @param {Buffer} options.labelArtwork
 * @param {object} options.placementProfile  master entry from vial-photo-placement.json
 * @param {string} options.outputPath
 * @param {number} [options.edgeInsetPx]
 * @param {number} [options.cylinderMaxThetaRad]
 */
export async function compositeLabelOnPhotoMaster({
  masterPhotoPath,
  labelArtwork,
  placementProfile,
  outputPath,
  edgeInsetPx = DEFAULT_INSET,
  cylinderMaxThetaRad = DEFAULT_THETA,
  labelStockColor = DEFAULT_STOCK,
  labelStockReferenceLum = DEFAULT_STOCK_REF_LUM,
  alsoSavePng = null,
}) {
  if (!placementProfile) throw new Error("placementProfile is required");
  const inset = Number(edgeInsetPx) || 0;
  const left = placementProfile.labelLeft + inset;
  const top = placementProfile.labelTop + inset;
  const faceW = Math.max(1, placementProfile.labelWidth - inset * 2);
  const faceH = Math.max(1, placementProfile.labelHeight - inset * 2);
  const maxTheta = Number(cylinderMaxThetaRad);
  const stock = parseCssColor(labelStockColor);
  const refLum = Number(labelStockReferenceLum) || DEFAULT_STOCK_REF_LUM;

  const knocked = await knockoutLabelPageBackground(labelArtwork);
  const face = await sharp(knocked)
    .resize(faceW, faceH, { fit: "fill", kernel: "lanczos3" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const master = await sharp(masterPhotoPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width: mw, height: mh } = master.info;
  const src = face.data;
  const dest = master.data;
  const sinMax = Math.sin(maxTheta) || 1;

  for (let y = 0; y < faceH; y += 1) {
    for (let x = 0; x < faceW; x += 1) {
      const dx = left + x;
      const dy = top + y;
      if (dx < 0 || dy < 0 || dx >= mw || dy >= mh) continue;
      const di = (dy * mw + dx) * 4;
      const paperLum = lum(dest[di], dest[di + 1], dest[di + 2]);
      const shade = Math.min(1.18, Math.max(0.52, paperLum / refLum));
      dest[di] = Math.max(0, Math.min(255, Math.round(stock.r * shade)));
      dest[di + 1] = Math.max(0, Math.min(255, Math.round(stock.g * shade)));
      dest[di + 2] = Math.max(0, Math.min(255, Math.round(stock.b * shade)));
    }
  }

  for (let y = 0; y < faceH; y += 1) {
    const v = faceH === 1 ? 0 : y / (faceH - 1);
    for (let x = 0; x < faceW; x += 1) {
      const nx = faceW === 1 ? 0 : (x / (faceW - 1)) * 2 - 1;
      const theta = nx * maxTheta;
      const u = (Math.sin(theta) / sinMax + 1) / 2;
      const [ar, ag, ab, aa] = sampleBilinear(src, faceW, faceH, u, v);
      if (aa < 10) continue;

      const dx = left + x;
      const dy = top + y;
      if (dx < 0 || dy < 0 || dx >= mw || dy >= mh) continue;
      const di = (dy * mw + dx) * 4;
      const pr = dest[di];
      const pg = dest[di + 1];
      const pb = dest[di + 2];
      const paperLum = lum(pr, pg, pb);
      const shade = Math.min(1.12, Math.max(0.58, paperLum / refLum));
      const artLum = lum(ar, ag, ab);
      const cover = Math.min(1, aa / 255);
      const srcX = Math.round(u * (faceW - 1));
      const srcY = Math.round(v * (faceH - 1));

      if (artLum >= 200) {
        if (!isLightOnDark(src, faceW, faceH, srcX, srcY)) continue;
        dest[di] = Math.max(0, Math.min(255, Math.round(248 * shade * cover + pr * (1 - cover))));
        dest[di + 1] = Math.max(0, Math.min(255, Math.round(248 * shade * cover + pg * (1 - cover))));
        dest[di + 2] = Math.max(0, Math.min(255, Math.round(248 * shade * cover + pb * (1 - cover))));
        continue;
      }

      const ink = (1 - artLum / 255) * cover;
      dest[di] = Math.max(0, Math.min(255, Math.round(pr * (1 - ink) + ar * shade * ink)));
      dest[di + 1] = Math.max(0, Math.min(255, Math.round(pg * (1 - ink) + ag * shade * ink)));
      dest[di + 2] = Math.max(0, Math.min(255, Math.round(pb * (1 - ink) + ab * shade * ink)));
    }
  }

  const composed = await sharp(dest, {
    raw: { width: mw, height: mh, channels: 4 },
  })
    .png({ compressionLevel: 9 })
    .toBuffer();

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  const ext = path.extname(outputPath).toLowerCase();
  if (ext === ".webp") {
    const webp = await sharp(composed)
      .webp({
        quality: 96,
        alphaQuality: 100,
        effort: 6,
        smartSubsample: true,
        preset: "picture",
      })
      .toBuffer();
    await fs.writeFile(outputPath, webp);
  } else {
    await fs.writeFile(outputPath, composed);
  }
  if (alsoSavePng && alsoSavePng !== outputPath) {
    await fs.mkdir(path.dirname(alsoSavePng), { recursive: true });
    await fs.writeFile(alsoSavePng, composed);
  }

  return {
    outputPath,
    masterPhotoPath,
    left,
    top,
    faceW,
    faceH,
    canvasWidth: mw,
    canvasHeight: mh,
  };
}

export function masterPath(masterKey, placement) {
  const entry = placement.photos?.[masterKey] || placement.masters?.[masterKey];
  if (!entry) throw new Error(`Unknown photo master: ${masterKey}`);
  return path.join(systemRoot, entry.file);
}
