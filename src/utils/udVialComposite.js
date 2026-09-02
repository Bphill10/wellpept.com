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
// `top`/`bot` hold the aspect-correct label; `fill` extends the label's blank bottom paper
// down toward the powder so no empty glass strip shows below the label.
const BAND = {
  3: { top: 0.432, bot: 0.845, fill: 0.915 },
  10: { top: 0.383, bot: 0.812, fill: 0.900 },
};

const BASE = {
  "3-white": "/ud-labels/vials/UD_Base_3mL_White.png",
  "3-blue": "/ud-labels/vials/UD_Base_3mL_Blue.png",
  "10-white": "/ud-labels/vials/UD_Base_10mL_White.png",
  "10-red": "/ud-labels/vials/UD_Base_10mL_Red.png",
};

/**
 * Pick the base vial photo by contents colour + size. Prefers an explicit `powderColor`
 * ("blue", "liquid-red", …) from the product; otherwise infers from the name (GHK-Cu/KLOW
 * → blue, B12 → red). Blue stock is 3 mL and red liquid is 10 mL; anything else is white.
 */
export function silverVialBaseSrc(name, vialMl, powderColor = "") {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const n = String(name || "").toUpperCase();
  const pc = String(powderColor || "").toLowerCase();
  const isBlue = pc.includes("blue") || /(KLOW|GLOW|GHK)/.test(n);
  const isRed = pc.includes("red") || pc.includes("liquid") || /\bB\s*12\b|VITAMIN\s*B12/.test(n);
  if (isRed) return BASE["10-red"];
  if (isBlue && ml === 3) return BASE["3-blue"];
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

// Supersample factor for the composed vial. The base photos are ~700 px wide; compositing
// at 2x keeps the vector label text razor-sharp on hi-DPI / large displays (the glass photo
// is only mildly upscaled, but crisp type is what the eye reads). Bumps the output canvas to
// ~1400x2100 — still light for a lazily-rendered grid.
const BASE_SS = 2;

// Cache decoded base vials + their pixel data (keyed by src).
const baseCache = new Map();
async function getBase(src) {
  if (baseCache.has(src)) return baseCache.get(src);
  const img = await loadImage(src);
  const W = Math.round(img.naturalWidth * BASE_SS);
  const H = Math.round(img.naturalHeight * BASE_SS);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, W, H);
  const entry = { W, H, data: ctx.getImageData(0, 0, W, H).data };
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

function footprint(d, W, H, topF, botF, fillF) {
  const v = vbbox(d, W, H);
  const top = Math.round(v.minY + v.h * topF), bot = Math.round(v.minY + v.h * botF);
  const fill = fillF ? Math.round(v.minY + v.h * fillF) : bot;
  const mask = new Uint8Array(W * H);
  const rowLo = new Int32Array(H).fill(-1), rowHi = new Int32Array(H).fill(-1);
  let left = W, right = 0;
  for (let y = top; y <= Math.max(bot, fill); y++) {
    let lo = -1, hi = -1;
    for (let x = v.minX; x <= v.maxX; x++) if (d[(y * W + x) * 4 + 3] > 128) { if (lo < 0) lo = x; hi = x; }
    if (lo < 0) continue;
    const inset = Math.round((hi - lo) * 0.004); lo += inset; hi -= inset;
    rowLo[y] = lo; rowHi[y] = hi;
    if (y <= bot) { for (let x = lo; x <= hi; x++) mask[y * W + x] = 1; if (lo < left) left = lo; if (hi > right) right = hi; }
  }
  return { mask, left, right, top, bot, fill, rowLo, rowHi, w: right - left + 1, h: bot - top + 1 };
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
  const fp = footprint(base.data, base.W, base.H, BAND[ml].top, BAND[ml].bot, BAND[ml].fill);
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
  for (let y = fp.top; y <= fp.bot; y++) for (let x = fp.left; x <= fp.right; x++) {
    if (!fp.mask[y * W + x]) continue;
    const vi = (y * W + x) * 4;
    const uo = (x - fp.left) / (fp.w - 1);
    const f = Math.asin(Math.max(-1, Math.min(1, (2 * uo - 1) * sB))) / B;
    const uSrc = Math.max(0, Math.min(1, uc + rot + half * f));
    const lx = Math.round(uSrc * (lw - 1));
    const ly = Math.min(lh - 1, Math.round(((y - fp.top) / (fp.h - 1)) * (lh - 1)));
    const li = (ly * lw + lx) * 4;
    const shade = 1; // gentle cylinder curvature only
    out[vi] = clamp(ld[li] * shade);
    out[vi + 1] = clamp(ld[li + 1] * shade);
    out[vi + 2] = clamp(ld[li + 2] * shade);
  }
  // Extend the label's blank bottom edge (rail + paper) down toward the powder so no empty
  // glass strip shows — but STOP as soon as the row is the powder/liquid (textured or
  // coloured), so the contents stay visible below the label.
  for (let y = fp.bot + 1; y <= fp.fill; y++) {
    const lo = fp.rowLo[y], hi = fp.rowHi[y];
    if (lo < 0) continue;
    let sum = 0, sq = 0, csum = 0, n = 0;
    const x0 = Math.round(lo + (hi - lo) * 0.28), x1 = Math.round(lo + (hi - lo) * 0.72);
    for (let x = x0; x <= x1; x++) {
      const i = (y * W + x) * 4, l = 0.299 * src[i] + 0.587 * src[i + 1] + 0.114 * src[i + 2];
      sum += l; sq += l * l;
      csum += Math.max(src[i], src[i + 1], src[i + 2]) - Math.min(src[i], src[i + 1], src[i + 2]);
      n++;
    }
    const std = Math.sqrt(Math.max(0, sq / n - (sum / n) * (sum / n)));
    if (std > 17 || csum / n > 26) break; // granular powder (texture) or coloured liquid → stop
    for (let x = Math.max(fp.left, lo); x <= Math.min(fp.right, hi); x++) {
      const vi = (y * W + x) * 4;
      const uo = (x - fp.left) / (fp.w - 1);
      const f = Math.asin(Math.max(-1, Math.min(1, (2 * uo - 1) * sB))) / B;
      const uSrc = Math.max(0, Math.min(1, uc + rot + half * f));
      const lx = Math.round(uSrc * (lw - 1));
      const li = ((lh - 1) * lw + lx) * 4;
      const shade = 1;
      out[vi] = clamp(ld[li] * shade);
      out[vi + 1] = clamp(ld[li + 1] * shade);
      out[vi + 2] = clamp(ld[li + 2] * shade);
    }
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

/**
 * Compose the vial onto the black-marble studio scene (charcoal wall + light beams + polished
 * floor) with a soft reflection and contact shadow — the "product photo on marble" look. The
 * vial base is planted on the floor line; 10 mL vials are drawn taller than 3 mL so the size
 * difference reads true. Output is an opaque scene canvas sized to `sceneSrc`.
 */
export async function drawVialScene(canvas, { svg, vialMl, baseSrc, sceneSrc, rot = 0 }) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const prepared = await prepareVialCompositor({ svg, vialMl: ml, baseSrc });

  // 1) Render the vial on a transparent surround, then tightly crop it.
  const off = document.createElement("canvas");
  composeVial(off, prepared, rot);
  const W0 = off.width, H0 = off.height;
  const od = off.getContext("2d").getImageData(0, 0, W0, H0).data;
  let minX = W0, minY = H0, maxX = 0, maxY = 0;
  for (let y = 0; y < H0; y++) for (let x = 0; x < W0; x++) {
    if (od[(y * W0 + x) * 4 + 3] > 24) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  const vw = Math.max(1, maxX - minX + 1), vh = Math.max(1, maxY - minY + 1);
  const crop = document.createElement("canvas");
  crop.width = vw; crop.height = vh;
  crop.getContext("2d").drawImage(off, minX, minY, vw, vh, 0, 0, vw, vh);

  // 2) Draw the marble scene as the ground.
  const scene = await loadImage(sceneSrc);
  const W = scene.naturalWidth, H = scene.naturalHeight;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(scene, 0, 0, W, H);

  // 3) Place the vial: base on the floor line, sized by volume.
  const floorY = Math.round(H * 0.80);
  const targetH = Math.round(H * (ml === 10 ? 0.80 : 0.68));
  const s = targetH / vh;
  const dw = Math.round(vw * s), dh = targetH;
  const cx = Math.round(W / 2), dx = Math.round(cx - dw / 2);
  const topY = floorY - dh;

  // 4) Contact shadow under the base.
  ctx.save();
  ctx.filter = `blur(${Math.max(2, Math.round(dw * 0.05))}px)`;
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  ctx.beginPath();
  ctx.ellipse(cx, floorY, dw * 0.42, dh * 0.05, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 5) Reflection: flipped, faded copy on the polished floor.
  const rc = document.createElement("canvas");
  rc.width = dw; rc.height = dh;
  const rctx = rc.getContext("2d");
  rctx.translate(0, dh);
  rctx.scale(1, -1);
  rctx.drawImage(crop, 0, 0, dw, dh);
  rctx.setTransform(1, 0, 0, 1, 0, 0);
  rctx.globalCompositeOperation = "destination-in";
  const g = rctx.createLinearGradient(0, 0, 0, dh);
  g.addColorStop(0, "rgba(0,0,0,0.42)");
  g.addColorStop(0.45, "rgba(0,0,0,0)");
  rctx.fillStyle = g;
  rctx.fillRect(0, 0, dw, dh);
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.drawImage(rc, dx, floorY);
  ctx.restore();

  // 6) The vial itself.
  ctx.drawImage(crop, dx, topY, dw, dh);
  return true;
}
