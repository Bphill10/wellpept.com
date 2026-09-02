/**
 * Live label-on-vial composite (browser). Wraps the approved silver label onto a real
 * vial photo with cylinder foreshortening + multiply blend — the same technique used to
 * build the storefront product photos, but rendered live from the calculator's fields.
 *
 * The label is centered on its middle section so the QR/edges wrap away naturally
 * (matching the storefront vials). Base photos are same-origin so pixels read without
 * tainting the canvas.
 */
import { silverLabelDims } from "./udSilverLabel";

// Label footprint band on the (consistent) vial silhouette, as fractions of its height.
const BAND = {
  3: { top: 0.434, bot: 0.820 },
  10: { top: 0.385, bot: 0.790 },
};

const BASE = {
  "3-white": "/ud-labels/vials/UD_Base_3mL_White.png",
  "3-blue": "/ud-labels/vials/UD_Base_3mL_Blue.png",
  "10-white": "/ud-labels/vials/UD_Base_10mL_White.png",
  "10-red": "/ud-labels/vials/UD_Base_10mL_Red.png",
};

/** Pick the base vial photo by size + peptide (blue for GHK-Cu/KLOW, red liquid for B12). */
export function silverVialBaseSrc(name, vialMl) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const n = String(name || "").toUpperCase();
  if (ml === 3 && /(KLOW|GLOW|GHK)/.test(n)) return BASE["3-blue"];
  if (ml === 10 && /B\s*12|B12/.test(n)) return BASE["10-red"];
  return ml === 10 ? BASE["10-white"] : BASE["3-white"];
}

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
    const inset = Math.round((hi - lo) * 0.004); lo += inset; hi -= inset;
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

// Rotation range (in label-u space) so a drag turns the vial from its left edge/band
// across the middle to the QR side. 0 = the approved default (band + middle 60%).
export const ROT_MIN = -0.34;
export const ROT_MAX = 0.62;

/**
 * Load the base vial + render the label once, so rotation can re-wrap without re-rendering
 * the SVG (keeps dragging smooth). Returns a prepared compositor.
 */
export async function prepareVialCompositor({ svg, vialMl, baseSrc }) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const dims = silverLabelDims(ml);
  const base = await getBase(baseSrc);
  const fp = footprint(base.data, base.W, base.H, BAND[ml].top, BAND[ml].bot);
  const ld = await renderLabelPixels(svg, dims.w, dims.h);
  return { base, fp, ld, lw: dims.w, lh: dims.h };
}

/**
 * Paint the prepared vial to `canvas` at rotation `rot` (label-u offset; 0 = default front).
 * Pixels whose wrap falls outside the label show the bare vial (turning reveals the sides).
 */
export function composeVial(canvas, prepared, rot = 0) {
  const { base, fp, ld, lw, lh } = prepared;
  const { W, H, data: src } = base;
  const out = new Uint8ClampedArray(src); // copy (keeps cap/glass/alpha outside the band)
  const uc = 0.34, half = 0.33, B = 1.05, sB = Math.sin(B);
  // The sticker sits inset from the vial's silhouette so clear glass shows on both sides
  // (a real label, not a full wrap). SIDE is the fraction of the front left bare each side.
  const SIDE = 0.085;
  // The base photo has a blank white label patch over the mid-body, so bare-vial pixels in
  // the band are white, not glass. Borrow real glass from just above the label patch and
  // extend it down the column so the uncovered sides read as clear glass.
  const bandH = fp.bot - fp.top;
  const yGlass = Math.max(0, fp.top - Math.round(bandH * 0.09));
  const setGlass = (vi, x) => {
    const gi = (yGlass * W + x) * 4;
    if (src[gi + 3] > 128) { out[vi] = src[gi]; out[vi + 1] = src[gi + 1]; out[vi + 2] = src[gi + 2]; }
  };
  for (let y = fp.top; y <= fp.bot; y++) for (let x = fp.left; x <= fp.right; x++) {
    if (!fp.mask[y * W + x]) continue;
    const vi = (y * W + x) * 4;
    const uo = (x - fp.left) / (fp.w - 1);
    if (uo < SIDE || uo > 1 - SIDE) { setGlass(vi, x); continue; } // glass margin where the label ends
    const uo2 = (uo - SIDE) / (1 - 2 * SIDE); // re-span the label across the inset window
    const f = Math.asin(Math.max(-1, Math.min(1, (2 * uo2 - 1) * sB))) / B;
    const uSrc = uc + rot + half * f;
    if (uSrc < 0 || uSrc > 1) { setGlass(vi, x); continue; } // turned past the sticker → glass
    const lx = Math.round(uSrc * (lw - 1));
    const ly = Math.min(lh - 1, Math.round(((y - fp.top) / (fp.h - 1)) * (lh - 1)));
    const li = (ly * lw + lx) * 4;
    const r = src[vi], g = src[vi + 1], b = src[vi + 2];
    const baseB = 235 + (0.299 * r + 0.587 * g + 0.114 * b - 210) * 0.15;
    out[vi] = clamp(baseB * (ld[li] / 255));
    out[vi + 1] = clamp(baseB * (ld[li + 1] / 255));
    out[vi + 2] = clamp(baseB * (ld[li + 2] / 255));
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
