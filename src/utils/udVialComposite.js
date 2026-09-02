/**
 * Live label-on-vial composite (browser). Places the approved silver label onto a clean,
 * photoreal glass vial as an opaque paper sticker with cylinder shading, leaving real glass
 * on the inset sides. The base photos are transparent-background glass on a dark studio, so
 * the label reads as a bright sticker and the uncovered sides read as clear glass.
 *
 * The label is centered on its middle section so the QR/edges wrap away naturally.
 * Base photos are same-origin so pixels read without tainting the canvas.
 */
import { silverLabelDims } from "./udSilverLabel";

// Label sticker band on the (consistent) vial silhouette, as fractions of its full height.
const BAND = {
  3: { top: 0.42, bot: 0.735 },
  10: { top: 0.40, bot: 0.78 },
};

const BASE = {
  "3-white": "/ud-labels/vials/UD_Clean_3mL_White.webp",
  "3-blue": "/ud-labels/vials/UD_Clean_3mL_Blue.webp",
  "10-white": "/ud-labels/vials/UD_Clean_10mL_White.webp",
  "10-red": "/ud-labels/vials/UD_Clean_10mL_Red.webp",
};

/** Pick the base vial photo by size + peptide (blue for GHK-Cu/KLOW, red liquid for B12). */
export function silverVialBaseSrc(name, vialMl) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const n = String(name || "").toUpperCase();
  if (ml === 3 && /(KLOW|GLOW|GHK)/.test(n)) return BASE["3-blue"];
  if (ml === 10 && /B\s*12|B12/.test(n)) return BASE["10-red"];
  return ml === 10 ? BASE["10-white"] : BASE["3-white"];
}

// Rotation range (label-u offset) kept for future turn support. 0 = default front.
export const ROT_MIN = -0.34;
export const ROT_MAX = 0.62;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Cache decoded base vials + their pixel data (keyed by src).
const baseCache = new Map();
async function getBase(src) {
  if (baseCache.has(src)) return baseCache.get(src);
  const img = await loadImage(src);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const entry = { W: c.width, H: c.height, data: ctx.getImageData(0, 0, c.width, c.height).data };
  baseCache.set(src, entry);
  return entry;
}

function vbbox(d, W, H) {
  let a = W, b = H, c = 0, e = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (d[(y * W + x) * 4 + 3] > 128) { if (x < a) a = x; if (x > c) c = x; if (y < b) b = y; if (y > e) e = y; }
  }
  return { minX: a, minY: b, maxX: c, maxY: e, w: c - a + 1, h: e - b + 1 };
}

function footprint(d, W, H, topF, botF) {
  const v = vbbox(d, W, H);
  const top = Math.round(v.minY + v.h * topF), bot = Math.round(v.minY + v.h * botF);
  const mask = new Uint8Array(W * H);
  let left = W, right = 0;
  for (let y = top; y <= bot; y++) {
    let lo = -1, hi = -1;
    for (let x = v.minX; x <= v.maxX; x++) if (d[(y * W + x) * 4 + 3] > 128) { if (lo < 0) lo = x; hi = x; }
    if (lo < 0) continue;
    for (let x = lo; x <= hi; x++) mask[y * W + x] = 1;
    if (lo < left) left = lo; if (hi > right) right = hi;
  }
  return { mask, left, right, top, bot, w: right - left + 1, h: bot - top + 1 };
}

async function renderLabelPixels(svg, LW, LH) {
  const img = await loadImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
  const c = document.createElement("canvas");
  c.width = LW; c.height = LH;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, LW, LH);
  return ctx.getImageData(0, 0, LW, LH).data;
}

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

export async function prepareVialCompositor({ svg, vialMl, baseSrc }) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const dims = silverLabelDims(ml);
  const base = await getBase(baseSrc);
  const fp = footprint(base.data, base.W, base.H, BAND[ml].top, BAND[ml].bot);
  const ld = await renderLabelPixels(svg, dims.w, dims.h);
  return { base, fp, ld, lw: dims.w, lh: dims.h };
}

/**
 * Paint the prepared vial to `canvas`. The label is an opaque sticker; the inset sides and
 * any turned-past-edge areas keep the real glass. `rot` shifts which part of the label faces
 * front (0 = default).
 */
export function composeVial(canvas, prepared, rot = 0) {
  const { base, fp, ld, lw, lh } = prepared;
  const { W, H, data: src } = base;
  const out = new Uint8ClampedArray(src); // copy (glass, cap, powder, transparency preserved)
  const uc = 0.34, half = 0.33, B = 1.05, sB = Math.sin(B);
  const SIDE = 0.05; // fraction of the front left as clear glass on each side
  for (let y = fp.top; y <= fp.bot; y++) for (let x = fp.left; x <= fp.right; x++) {
    if (!fp.mask[y * W + x]) continue;
    const uo = (x - fp.left) / (fp.w - 1);
    if (uo < SIDE || uo > 1 - SIDE) continue; // clear glass margin
    const uo2 = (uo - SIDE) / (1 - 2 * SIDE);
    const f = Math.asin(Math.max(-1, Math.min(1, (2 * uo2 - 1) * sB))) / B;
    const uSrc = uc + rot + half * f;
    if (uSrc < 0 || uSrc > 1) continue; // past the sticker → glass
    const vi = (y * W + x) * 4;
    const lx = Math.round(uSrc * (lw - 1));
    const ly = Math.min(lh - 1, Math.round(((y - fp.top) / (fp.h - 1)) * (lh - 1)));
    const li = (ly * lw + lx) * 4;
    // Opaque paper sticker with cylinder shading (dimmer toward the curved edges) plus a
    // soft specular sheen left-of-centre, matching the vial's studio highlight.
    const shade = 1 - 0.17 * Math.abs(f);
    const sheen = 1 + 0.06 * Math.exp(-((f + 0.35) * (f + 0.35)) / 0.05);
    const k = shade * sheen;
    out[vi] = clamp(ld[li] * k);
    out[vi + 1] = clamp(ld[li + 1] * k);
    out[vi + 2] = clamp(ld[li + 2] * k);
  }
  canvas.width = W; canvas.height = H;
  canvas.getContext("2d").putImageData(new ImageData(out, W, H), 0, 0);
  return true;
}

/** Convenience: prepare + compose at a single rotation. */
export async function drawSilverLabelVial(canvas, { svg, vialMl, baseSrc, rot = 0 }) {
  const prepared = await prepareVialCompositor({ svg, vialMl, baseSrc });
  return composeVial(canvas, prepared, rot);
}
