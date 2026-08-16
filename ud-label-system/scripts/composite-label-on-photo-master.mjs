/**
 * Composite locked SVG label artwork onto a locked photographic vial master.
 *
 * The photograph is never redrawn. Artwork is mapped into the existing
 * blank-white wrap and blended so photographed paper lighting remains.
 * This is a NEW path — it does not replace placeLockedLabelOnVial().
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { fillLockedLabelSvg } from "./render-locked-label.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");

const DEFAULT_RASTER_MIN_WIDTH = 3600;
const DEFAULT_INSET = 3;
const DEFAULT_THETA = 0.16;

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function sat(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

function isPhotographedPaper(r, g, b) {
  const L = lum(r, g, b);
  const S = sat(r, g, b);
  return S <= 0.28 && L >= 88 && Math.min(r, g, b) >= 70;
}

export function resolvePhotoMasterKey(product = {}, placement) {
  const requested = String(product.placementProfile || "").toUpperCase();
  if (placement?.profileToMaster?.[requested]) {
    return placement.profileToMaster[requested];
  }
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
    return r >= 246 && g >= 246 && b >= 246;
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
  alsoSavePng = null,
}) {
  if (!placementProfile) throw new Error("placementProfile is required");
  const inset = Number(edgeInsetPx);
  const left = placementProfile.labelLeft + inset;
  const top = placementProfile.labelTop + inset;
  const faceW = Math.max(1, placementProfile.labelWidth - inset * 2);
  const faceH = Math.max(1, placementProfile.labelHeight - inset * 2);
  const maxTheta = Number(cylinderMaxThetaRad);

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

      if (!isPhotographedPaper(pr, pg, pb)) continue;

      const paperLum = lum(pr, pg, pb);
      const shade = Math.min(1.12, Math.max(0.58, paperLum / 210));
      const artLum = lum(ar, ag, ab);
      const cover = Math.min(1, aa / 255);

      let outR;
      let outG;
      let outB;
      if (artLum < 208) {
        outR = pr * (ar / 255);
        outG = pg * (ag / 255);
        outB = pb * (ab / 255);
        const ink = (1 - artLum / 255) * cover;
        outR = outR * (0.55 + 0.45 * shade) * ink + pr * (1 - ink);
        outG = outG * (0.55 + 0.45 * shade) * ink + pg * (1 - ink);
        outB = outB * (0.55 + 0.45 * shade) * ink + pb * (1 - ink);
      } else {
        outR = ar * shade;
        outG = ag * shade;
        outB = ab * shade;
        outR = outR * cover + pr * (1 - cover);
        outG = outG * cover + pg * (1 - cover);
        outB = outB * cover + pb * (1 - cover);
      }

      dest[di] = Math.max(0, Math.min(255, Math.round(outR)));
      dest[di + 1] = Math.max(0, Math.min(255, Math.round(outG)));
      dest[di + 2] = Math.max(0, Math.min(255, Math.round(outB)));
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
  const entry = placement.masters[masterKey];
  if (!entry) throw new Error(`Unknown photo master: ${masterKey}`);
  return path.join(systemRoot, entry.file);
}
