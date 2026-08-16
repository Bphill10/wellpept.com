/**
 * Composite locked SVG label artwork onto a locked photographic vial master.
 *
 * The photograph — including the blank white label paper — is never
 * recolored, tinted, brightened, or replaced. Only printed ink is added.
 * This does not replace placeLockedLabelOnVial().
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
const DEFAULT_THETA = 0.05;
const DEFAULT_INK = "#0A0A0A";
const DEFAULT_SUPERSAMPLE = 8;

/** Configurable printed-ink color. Paper color is never derived from this. */
export const LABEL_INK_COLOR = DEFAULT_INK;

function lum(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function parseCssColor(value, fallback = DEFAULT_INK) {
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
  minWidthOrOptions = DEFAULT_RASTER_MIN_WIDTH
) {
  const options =
    typeof minWidthOrOptions === "number"
      ? { minWidth: minWidthOrOptions }
      : { minWidth: DEFAULT_RASTER_MIN_WIDTH, ...minWidthOrOptions };
  const { svg, masterRel } = await fillLockedLabelSvg(product, defaults, {
    heavierSecondaryText: Boolean(options.heavierSecondaryText),
  });
  const widthMatch = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const vbW = Number(widthMatch?.[1] || 1200);
  const vbH = Number(widthMatch?.[2] || 600);
  const outW = Math.max(options.minWidth || DEFAULT_RASTER_MIN_WIDTH, Math.round(vbW));
  const outH = Math.round((outW * vbH) / vbW);
  const density = Math.max(72, Math.round((outW / vbW) * 72));
  const png = await sharp(Buffer.from(svg), { density })
    .resize(outW, outH, { fit: "fill", kernel: "lanczos3" })
    .png({ compressionLevel: 6 })
    .toBuffer();
  return { png, width: outW, height: outH, masterRel, aspect: outW / outH, svg };
}

/**
 * Rasterize the locked SVG once to a supersampled face-aspect buffer.
 * One vector raster + one aspect-correct Lanczos. No extra downsamples.
 */
export async function renderLockedLabelArtwork(product = {}, defaults = {}, options = {}) {
  const width = Math.max(1, Math.round(options.width));
  const height = Math.max(1, Math.round(options.height));
  const { svg, masterRel } = await fillLockedLabelSvg(product, defaults, {
    heavierSecondaryText: Boolean(options.heavierSecondaryText),
  });
  const widthMatch = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const vbW = Number(widthMatch?.[1] || 1200);
  const density = Math.max(72, (width / vbW) * 72);
  const png = await sharp(Buffer.from(svg), { density })
    .resize(width, height, { fit: "fill", kernel: "lanczos3" })
    .ensureAlpha()
    .png({ compressionLevel: 6 })
    .toBuffer();
  return { png, width, height, masterRel, svg };
}

/**
 * Rasterize the locked SVG at native aspect for the master-photo composite.
 * Density is chosen so the vector raster is already the output size.
 */
export async function renderLockedLabelArtworkNative(product = {}, defaults = {}, options = {}) {
  const { svg, masterRel } = await fillLockedLabelSvg(product, defaults, {
    heavierSecondaryText: Boolean(options.heavierSecondaryText),
  });
  const widthMatch = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const vbW = Number(widthMatch?.[1] || 1200);
  const vbH = Number(widthMatch?.[2] || 600);
  const outW = Math.max(1, Math.round(options.minWidth || 7200));
  const outH = Math.max(1, Math.round((outW * vbH) / vbW));
  const density = Math.max(72, (outW / vbW) * 72);
  const png = await sharp(Buffer.from(svg), { density })
    .resize(outW, outH, { fit: "fill", kernel: "lanczos3" })
    .ensureAlpha()
    .png({ compressionLevel: 6 })
    .toBuffer();
  return { png, width: outW, height: outH, masterRel, svg, viewBoxWidth: vbW, viewBoxHeight: vbH };
}

/**
 * Runtime-only crop of the filled locked SVG. The locked file is not edited.
 * The rounded clip stays in original user units so a tighter viewBox does
 * not invent a new right-edge corner.
 */
export function cropLockedLabelSvgToWindow(svg, artworkWindow = null) {
  const match = /viewBox="([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)[,\s]+([-\d.]+)"/.exec(svg);
  if (!match) throw new Error("Locked label SVG missing viewBox");
  const vx = Number(match[1]);
  const vy = Number(match[2]);
  const vbW = Number(match[3]);
  const vbH = Number(match[4]);
  const u0 = Number(artworkWindow?.u0) || 0;
  const u1 = artworkWindow?.u1 == null ? 1 : Number(artworkWindow.u1);
  const v0 = Number(artworkWindow?.v0) || 0;
  const v1 = artworkWindow?.v1 == null ? 1 : Number(artworkWindow.v1);
  const x = vx + u0 * vbW;
  const y = vy + v0 * vbH;
  const w = (u1 - u0) * vbW;
  const h = (v1 - v0) * vbH;
  let cropped = svg.replace(/viewBox="[^"]+"/, `viewBox="${x} ${y} ${w} ${h}"`);
  cropped = cropped.replace(/(<svg\b[^>]*?)\swidth="[^"]+"/, `$1 width="${w}"`);
  cropped = cropped.replace(/(<svg\b[^>]*?)\sheight="[^"]+"/, `$1 height="${h}"`);
  cropped = cropped.replace(
    /<clipPath id="rounded"><rect width="100%" height="100%" rx="([\d.]+)"\s*\/>\s*<\/clipPath>/,
    `<clipPath id="rounded"><rect width="${vbW}" height="${vbH}" rx="$1"/></clipPath>`
  );
  return { svg: cropped, x, y, w, h, sourceViewBox: { vx, vy, vbW, vbH } };
}

/**
 * Rasterize only the website-facing SVG window at native aspect.
 * Density is chosen so librsvg emits the target pixel size from vectors.
 * No small-bitmap enlarge, and no full-wrap raster that is later cropped.
 */
export async function renderLockedLabelArtworkWindow(product = {}, defaults = {}, options = {}) {
  const { svg, masterRel } = await fillLockedLabelSvg(product, defaults, {
    heavierSecondaryText: Boolean(options.heavierSecondaryText),
  });
  const cropped = cropLockedLabelSvgToWindow(svg, options.artworkWindow);
  const outW = Math.max(1, Math.round(options.width));
  const outH = Math.max(
    1,
    Math.round(options.height == null ? (outW * cropped.h) / cropped.w : options.height)
  );
  const density = Math.max(72, 72 * Math.max(outW / cropped.w, outH / cropped.h));
  const png = await sharp(Buffer.from(cropped.svg), { density })
    .resize(outW, outH, { fit: "fill", kernel: "lanczos3" })
    .ensureAlpha()
    .png({ compressionLevel: 6 })
    .toBuffer();
  return {
    png,
    width: outW,
    height: outH,
    masterRel,
    svg: cropped.svg,
    viewBoxWidth: cropped.w,
    viewBoxHeight: cropped.h,
  };
}

/**
 * Knock out the flat white page background. Printed white (amount-bar
 * text) stays because it is not connected to the edges.
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

function clamp255(value) {
  return Math.max(0, Math.min(255, value));
}

function cubicHermite(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3);
}

function sampleCatmullRom(src, width, height, u, v) {
  const x = Math.max(0, Math.min(width - 1.001, u * (width - 1)));
  const y = Math.max(0, Math.min(height - 1.001, v * (height - 1)));
  const x1 = Math.floor(x);
  const y1 = Math.floor(y);
  const tx = x - x1;
  const ty = y - y1;
  const out = [0, 0, 0, 0];
  for (let c = 0; c < 4; c += 1) {
    const col = [];
    for (let j = -1; j <= 2; j += 1) {
      const row = [];
      const sy = Math.max(0, Math.min(height - 1, y1 + j));
      for (let i = -1; i <= 2; i += 1) {
        const sx = Math.max(0, Math.min(width - 1, x1 + i));
        row.push(src[(sy * width + sx) * 4 + c]);
      }
      col.push(cubicHermite(row[0], row[1], row[2], row[3], tx));
    }
    out[c] = clamp255(cubicHermite(col[0], col[1], col[2], col[3], ty));
  }
  return out;
}

function sampleArea(src, width, height, u, v, srcPerDstX, srcPerDstY) {
  const cx = u * (width - 1);
  const cy = v * (height - 1);
  const halfX = Math.max(0.5, srcPerDstX / 2);
  const halfY = Math.max(0.5, srcPerDstY / 2);
  const x0 = Math.max(0, Math.floor(cx - halfX));
  const x1 = Math.min(width - 1, Math.ceil(cx + halfX));
  const y0 = Math.max(0, Math.floor(cy - halfY));
  const y1 = Math.min(height - 1, Math.ceil(cy + halfY));
  let r = 0;
  let g = 0;
  let b = 0;
  let a = 0;
  let n = 0;
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      const i = (y * width + x) * 4;
      r += src[i];
      g += src[i + 1];
      b += src[i + 2];
      a += src[i + 3];
      n += 1;
    }
  }
  if (!n) return [0, 0, 0, 0];
  return [r / n, g / n, b / n, a / n];
}

function hardenCoverage(amount, hardness) {
  if (!hardness) return amount;
  const t = Math.max(0, Math.min(1, (amount - hardness) / (1 - hardness)));
  return t * t * (3 - 2 * t);
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
 * 1px anti-aliased coverage inside the placement rectangle.
 * 1 at the interior, 0 at the outer edge. No halo color is introduced.
 */
function rectClipCoverage(x, y, w, h) {
  const dx = Math.min(x + 0.5, w - x - 0.5);
  const dy = Math.min(y + 0.5, h - y - 0.5);
  return Math.max(0, Math.min(1, Math.min(dx, dy)));
}

/**
 * Near the rect edge, refuse ink on non-paper (glass / powder / marble).
 * Interior pixels are not gated so shaded paper and the black rail stay intact.
 */
function edgePaperGate(r, g, b, x, y, w, h) {
  const border = Math.min(x + 0.5, y + 0.5, w - x - 0.5, h - y - 0.5);
  if (border >= 2) return 1;
  const paperLum = lum(r, g, b);
  const chroma = Math.max(r, g, b) - Math.min(r, g, b);
  if (paperLum >= 88 && chroma <= 85) return 1;
  if (paperLum >= 70 && chroma <= 40) return 1;
  return Math.max(0, (paperLum - 40) / 48);
}

function cylinderMapU(u, maxTheta) {
  if (!maxTheta) return u;
  const nx = u * 2 - 1;
  const theta = nx * maxTheta;
  const sinMax = Math.sin(maxTheta) || 1;
  return (Math.sin(theta) / sinMax + 1) / 2;
}

/**
 * Linear U across the center band so product name / MG are not squeezed.
 * A very small cylinder is applied only outside that band.
 */
export function mapFaceU(u, maxTheta, centerLinearFrac = 0) {
  if (centerLinearFrac <= 0) return cylinderMapU(u, maxTheta);
  const linearStart = (1 - centerLinearFrac) / 2;
  const linearEnd = 1 - linearStart;
  if (u >= linearStart && u <= linearEnd) {
    const u0 = cylinderMapU(linearStart, maxTheta);
    const u1 = cylinderMapU(linearEnd, maxTheta);
    const t = (u - linearStart) / (linearEnd - linearStart);
    return u0 + t * (u1 - u0);
  }
  return cylinderMapU(u, maxTheta);
}

/**
 * Light unsharp on ink coverage only. Near-zero paper stays untouched
 * so the filter cannot draw a halo ring around glyphs.
 */
function sharpenArtworkInkLayer(src, width, height, amount) {
  const strength = Number(amount);
  if (!src || !strength) return src;
  const ink = new Float32Array(width * height);
  const white = new Float32Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    const a = src[o + 3] / 255;
    if (a < 0.04) continue;
    const L = lum(src[o], src[o + 1], src[o + 2]);
    if (L >= 200) white[i] = a;
    else ink[i] = a * (1 - L / 255);
  }
  sharpenInkCoverage(ink, width, height, strength);
  sharpenInkCoverage(white, width, height, strength * 0.65);
  for (let i = 0; i < width * height; i += 1) {
    const o = i * 4;
    if (white[i] > 0.002) {
      src[o + 3] = Math.round(Math.min(1, white[i]) * 255);
      continue;
    }
    if (ink[i] <= 0.002) continue;
    const amt = Math.min(1, ink[i]);
    src[o] = 10;
    src[o + 1] = 10;
    src[o + 2] = 10;
    src[o + 3] = Math.round(amt * 255);
  }
  return src;
}

export function sharpenInkCoverage(cover, width, height, amount) {
  const strength = Number(amount);
  if (!cover || !strength) return cover;
  const out = new Float32Array(cover.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = y * width + x;
      const c = cover[i];
      if (c < 0.08) {
        out[i] = c;
        continue;
      }
      let sum = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const sx = x + dx;
          const sy = y + dy;
          if (sx < 0 || sy < 0 || sx >= width || sy >= height) continue;
          sum += cover[sy * width + sx];
          n += 1;
        }
      }
      const blur = n ? sum / n : c;
      out[i] = Math.max(0, Math.min(1, c + strength * (c - blur)));
    }
  }
  cover.set(out);
  return cover;
}

/**
 * @param {object} options
 * @param {string} options.masterPhotoPath
 * @param {Buffer} options.labelArtwork
 * @param {object} options.placementProfile
 * @param {string} options.outputPath
 * @param {string} [options.labelInkColor]
 * @param {number} [options.cylinderMaxThetaRad]
 * @param {boolean} [options.optimizeText]
 * @param {boolean} [options.artworkAlreadyWindowed]
 * @param {number} [options.centerLinearFrac]
 * @param {number} [options.inkSharpenAmount]
 * @param {number} [options.inkHardness]
 * @param {number} [options.masterScale]
 * @param {{width:number,height:number}|Array<{width:number,height:number,path:string}>} [options.websiteOutput]
 */
export async function compositeLabelOnPhotoMaster({
  masterPhotoPath,
  labelArtwork,
  placementProfile,
  outputPath,
  edgeInsetPx = DEFAULT_INSET,
  cylinderMaxThetaRad = DEFAULT_THETA,
  labelInkColor = LABEL_INK_COLOR,
  optimizeText = false,
  sampleFilter = "bilinear",
  artworkWindow = null,
  artworkAlreadyWindowed = false,
  centerLinearFrac = 0,
  inkSharpenAmount = 0,
  inkHardness = 0,
  masterScale = 1,
  websiteOutput = null,
  alsoSavePng = null,
}) {
  if (!placementProfile) throw new Error("placementProfile is required");
  const inset = Number(edgeInsetPx) || 0;
  const scale = Math.max(1, Number(masterScale) || 1);
  const left = Math.round((placementProfile.labelLeft + inset) * scale);
  const top = Math.round((placementProfile.labelTop + inset) * scale);
  const faceW = Math.max(1, Math.round((placementProfile.labelWidth - inset * 2) * scale));
  const faceH = Math.max(1, Math.round((placementProfile.labelHeight - inset * 2) * scale));
  const maxTheta = Number(cylinderMaxThetaRad);
  const linearFrac = Math.max(0, Math.min(1, Number(centerLinearFrac) || 0));
  const ink = parseCssColor(labelInkColor, LABEL_INK_COLOR);
  const inkContrast = optimizeText ? 0.82 : 1;
  const hardness = Math.max(0, Math.min(0.45, Number(inkHardness) || 0));
  const win = artworkAlreadyWindowed
    ? { u0: 0, u1: 1, v0: 0, v1: 1 }
    : {
        u0: Number(artworkWindow?.u0) || 0,
        u1: artworkWindow?.u1 == null ? 1 : Number(artworkWindow.u1),
        v0: Number(artworkWindow?.v0) || 0,
        v1: artworkWindow?.v1 == null ? 1 : Number(artworkWindow.v1),
      };
  const sharpenAmt = Number(inkSharpenAmount) || 0;
  const useInkBuffer = false;

  const knocked = await knockoutLabelPageBackground(labelArtwork);
  const art = await sharp(knocked)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let master = await sharp(masterPhotoPath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (scale !== 1) {
    master = await sharp(master.data, {
      raw: { width: master.info.width, height: master.info.height, channels: 4 },
    })
      .resize(Math.round(master.info.width * scale), Math.round(master.info.height * scale), {
        kernel: "lanczos3",
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
  }

  const { width: mw, height: mh } = master.info;
  const src = art.data;
  const artW = art.info.width;
  const artH = art.info.height;
  if (sharpenAmt > 0) sharpenArtworkInkLayer(src, artW, artH, sharpenAmt);
  const dest = master.data;
  const srcPerDstX = artW / faceW;
  const srcPerDstY = artH / faceH;
  const samplePixel = (u, v) => {
    if (sampleFilter === "area") return sampleArea(src, artW, artH, u, v, srcPerDstX, srcPerDstY);
    if (sampleFilter === "bicubic") return sampleCatmullRom(src, artW, artH, u, v);
    return sampleBilinear(src, artW, artH, u, v);
  };
  const inkCover = useInkBuffer ? new Float32Array(faceW * faceH) : null;
  const whiteCover = useInkBuffer ? new Float32Array(faceW * faceH) : null;

  for (let y = 0; y < faceH; y += 1) {
    const v = faceH === 1 ? 0 : y / (faceH - 1);
    const clipY = rectClipCoverage(0, y, faceW, faceH);
    if (clipY <= 0) continue;
    for (let x = 0; x < faceW; x += 1) {
      const clip = rectClipCoverage(x, y, faceW, faceH);
      if (clip <= 0.001) continue;

      const dx = left + x;
      const dy = top + y;
      if (dx < 0 || dy < 0 || dx >= mw || dy >= mh) continue;
      const di = (dy * mw + dx) * 4;
      const pr = dest[di];
      const pg = dest[di + 1];
      const pb = dest[di + 2];
      const paper = edgePaperGate(pr, pg, pb, x, y, faceW, faceH);
      if (paper <= 0.001) continue;

      const uFace = mapFaceU(faceW === 1 ? 0 : x / (faceW - 1), maxTheta, linearFrac);
      const u = win.u0 + uFace * (win.u1 - win.u0);
      const vArt = win.v0 + v * (win.v1 - win.v0);
      const [ar, ag, ab, aa] = samplePixel(u, vArt);
      if (aa < 10) continue;

      const cover = hardenCoverage(Math.min(1, (aa / 255) * clip * paper), hardness);
      const artLum = lum(ar, ag, ab);
      const srcX = Math.round(u * (artW - 1));
      const srcY = Math.round(vArt * (artH - 1));

      if (artLum >= 200) {
        if (!isLightOnDark(src, artW, artH, srcX, srcY)) continue;
        if (useInkBuffer) {
          whiteCover[y * faceW + x] = cover;
          continue;
        }
        dest[di] = Math.round(pr * (1 - cover) + 250 * cover);
        dest[di + 1] = Math.round(pg * (1 - cover) + 250 * cover);
        dest[di + 2] = Math.round(pb * (1 - cover) + 250 * cover);
        continue;
      }

      let inkAmt = Math.min(1, (1 - artLum / 255) * cover);
      if (inkContrast !== 1) inkAmt = Math.min(1, inkAmt ** inkContrast);
      if (inkAmt <= 0.002) continue;
      if (useInkBuffer) {
        inkCover[y * faceW + x] = inkAmt;
        continue;
      }
      dest[di] = Math.max(0, Math.min(255, Math.round(pr * (1 - inkAmt) + ink.r * inkAmt)));
      dest[di + 1] = Math.max(0, Math.min(255, Math.round(pg * (1 - inkAmt) + ink.g * inkAmt)));
      dest[di + 2] = Math.max(0, Math.min(255, Math.round(pb * (1 - inkAmt) + ink.b * inkAmt)));
    }
  }

  if (useInkBuffer) {
    sharpenInkCoverage(inkCover, faceW, faceH, sharpenAmt);
    for (let y = 0; y < faceH; y += 1) {
      for (let x = 0; x < faceW; x += 1) {
        const fi = y * faceW + x;
        const white = whiteCover[fi];
        const inkAmt = inkCover[fi];
        if (white <= 0.002 && inkAmt <= 0.002) continue;
        const dx = left + x;
        const dy = top + y;
        if (dx < 0 || dy < 0 || dx >= mw || dy >= mh) continue;
        const di = (dy * mw + dx) * 4;
        let pr = dest[di];
        let pg = dest[di + 1];
        let pb = dest[di + 2];
        if (white > 0.002) {
          pr = Math.round(pr * (1 - white) + 250 * white);
          pg = Math.round(pg * (1 - white) + 250 * white);
          pb = Math.round(pb * (1 - white) + 250 * white);
        }
        if (inkAmt > 0.002) {
          pr = Math.max(0, Math.min(255, Math.round(pr * (1 - inkAmt) + ink.r * inkAmt)));
          pg = Math.max(0, Math.min(255, Math.round(pg * (1 - inkAmt) + ink.g * inkAmt)));
          pb = Math.max(0, Math.min(255, Math.round(pb * (1 - inkAmt) + ink.b * inkAmt)));
        }
        dest[di] = pr;
        dest[di + 1] = pg;
        dest[di + 2] = pb;
      }
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

  const websiteTargets = Array.isArray(websiteOutput)
    ? websiteOutput
    : websiteOutput
      ? [websiteOutput]
      : [];
  for (const target of websiteTargets) {
    if (!target?.path || !target.width || !target.height) continue;
    await fs.mkdir(path.dirname(target.path), { recursive: true });
    await sharp(composed)
      .resize(target.width, target.height, {
        fit: "contain",
        background: "#0a0a0a",
        kernel: "lanczos3",
      })
      .png({ compressionLevel: 9 })
      .toFile(target.path);
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
    labelInkColor,
    optimizeText,
    sampleFilter,
    artworkAlreadyWindowed,
    centerLinearFrac: linearFrac,
    inkSharpenAmount: sharpenAmt,
    inkHardness: hardness,
    masterScale: scale,
  };
}

export function masterPath(masterKey, placement) {
  const entry = placement.photos?.[masterKey] || placement.masters?.[masterKey];
  if (!entry) throw new Error(`Unknown photo master: ${masterKey}`);
  return path.join(systemRoot, entry.file);
}

export { DEFAULT_SUPERSAMPLE };
