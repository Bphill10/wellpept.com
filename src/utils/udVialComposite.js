/**
 * Live label-on-vial composite (browser). Wraps the approved silver label onto a real
 * vial photo with cylinder foreshortening + multiply blend — the same technique used to
 * build the storefront product photos, but rendered live from the calculator's fields.
 *
 * The label is centered on its middle section so the QR/edges wrap away naturally
 * (matching the storefront vials). Base photos are same-origin so pixels read without
 * tainting the canvas.
 *
 * Two resolutions share the same math:
 *  - the crisp at-rest render uses BASE_SS=2 (razor-sharp type on hi-DPI),
 *  - the live rotation ("spinning label") uses a small `ss` so a full frame composites in
 *    a couple of milliseconds — smooth at 60fps. A per-column asin LUT (precomputed in
 *    `prepareVialCompositor`) keeps the hot loop to array lookups.
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

// Cylinder-wrap constants (shared by the composite and the LUT).
const UC = 0.34, HALF = 0.33, B = 1.05, SB = Math.sin(B);

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

// Supersample factor for the crisp composed vial. The base photos are 700 px wide; compositing
// at 2x keeps the vector label text razor-sharp on hi-DPI / large displays. The live spin passes
// a smaller ss so a frame composites fast enough to animate.
const BASE_SS = 2;

// Cache decoded base vials + their pixel data (keyed by src + ss).
const baseCache = new Map();
async function getBase(src, ss = BASE_SS) {
  const key = `${src}@${ss}`;
  if (baseCache.has(key)) return baseCache.get(key);
  const img = await loadImage(src);
  const W = Math.max(1, Math.round(img.naturalWidth * ss));
  const H = Math.max(1, Math.round(img.naturalHeight * ss));
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, W, H);
  const entry = { W, H, data: ctx.getImageData(0, 0, W, H).data };
  baseCache.set(key, entry);
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
 * the SVG (keeps dragging/spinning smooth). Returns a prepared compositor. `ss` sets the
 * base resolution: BASE_SS (2) for the crisp still, a smaller value for the live spin.
 * Precomputes a per-column wrap LUT (`fcol`) and per-row label-row map (`rowBase`) so the
 * compose hot loop is pure array lookups.
 */
export async function prepareVialCompositor({ svg, vialMl, baseSrc, ss = BASE_SS }) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const dims = silverLabelDims(ml);
  const base = await getBase(baseSrc, ss);
  const fp = footprint(base.data, base.W, base.H, BAND[ml].top, BAND[ml].bot, BAND[ml].fill);
  const ld = await renderLabelPixels(svg, dims.w, dims.h);

  // Per-column wrap offset (HALF * asin term) — depends only on the column, not on rot or y.
  const fcol = new Float32Array(fp.w);
  for (let i = 0; i < fp.w; i++) {
    const uo = i / (fp.w - 1);
    const f = Math.asin(Math.max(-1, Math.min(1, (2 * uo - 1) * SB))) / B;
    fcol[i] = HALF * f;
  }
  // Per-row label row start (in label pixels) for band rows; fill rows use the label's last row.
  const rowBase = new Int32Array(base.H);
  for (let y = fp.top; y <= fp.bot; y++) {
    const ly = Math.min(dims.h - 1, Math.round(((y - fp.top) / (fp.h - 1)) * (dims.h - 1)));
    rowBase[y] = ly * dims.w;
  }
  return { base, fp, ld, lw: dims.w, lh: dims.h, fcol, rowBase };
}

/**
 * Paint the prepared vial to `canvas` at rotation `rot` (label-u offset; 0 = default front).
 * With `wrap` the label tiles around the cylinder (its two ends meet at a back seam) so a full
 * revolution reads continuously; without it the wrap clamps at the label edges (drag preview).
 */
export function composeVial(canvas, prepared, rot = 0, opts = {}) {
  const wrap = !!opts.wrap;
  const { base, fp, ld, lw, lh, fcol, rowBase } = prepared;
  const { W, H, data: src } = base;
  const out = new Uint8ClampedArray(src); // copy (keeps cap/glass/alpha outside the band)
  const lwm = lw - 1, left = fp.left;
  for (let y = fp.top; y <= fp.bot; y++) {
    const rowOff = y * W, rb = rowBase[y];
    for (let x = left; x <= fp.right; x++) {
      if (!fp.mask[rowOff + x]) continue;
      const vi = (rowOff + x) * 4;
      let u = UC + rot + fcol[x - left];
      u = wrap ? u - Math.floor(u) : (u < 0 ? 0 : u > 1 ? 1 : u);
      const li = (rb + ((u * lwm) | 0)) * 4;
      out[vi] = ld[li]; out[vi + 1] = ld[li + 1]; out[vi + 2] = ld[li + 2];
    }
  }
  // Extend the label's blank bottom edge (rail + paper) down toward the powder so no empty
  // glass strip shows — but STOP as soon as the row is the powder/liquid (textured or
  // coloured), so the contents stay visible below the label.
  const rbFill = (lh - 1) * lw;
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
    for (let x = Math.max(left, lo); x <= Math.min(fp.right, hi); x++) {
      const vi = (y * W + x) * 4;
      let u = UC + rot + fcol[x - left];
      u = wrap ? u - Math.floor(u) : (u < 0 ? 0 : u > 1 ? 1 : u);
      const li = (rbFill + ((u * lwm) | 0)) * 4;
      out[vi] = ld[li]; out[vi + 1] = ld[li + 1]; out[vi + 2] = ld[li + 2];
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

// Tight alpha bbox of a composed vial (the glass silhouette is constant across rotations).
function alphaBBox(canvas) {
  const W = canvas.width, H = canvas.height;
  const d = canvas.getContext("2d").getImageData(0, 0, W, H).data;
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    if (d[(y * W + x) * 4 + 3] > 24) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, w: Math.max(1, maxX - minX + 1), h: Math.max(1, maxY - minY + 1) };
}

/**
 * Prepare everything needed to paint the vial on the black-marble scene repeatedly (spin):
 * the compositor, a pre-baked background (scene + contact shadow at the output size), the
 * constant vial crop bbox, placement, and reusable offscreen canvases so frames allocate
 * nothing. Pass a small `ss` (base res) + `maxOut` (output cap in px) for a smooth live spin,
 * or the defaults (BASE_SS, native scene size) for the crisp still. `paintVialScene` paints.
 */
export async function prepareVialScene({ svg, vialMl, baseSrc, sceneSrc, ss = BASE_SS, maxOut = 0 }) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const prepared = await prepareVialCompositor({ svg, vialMl: ml, baseSrc, ss });
  const scene = await loadImage(sceneSrc);
  const off = document.createElement("canvas");
  composeVial(off, prepared, 0, { wrap: true });
  const bbox = alphaBBox(off);

  // Output size (cap for live spin; native for the crisp still).
  const sw = scene.naturalWidth, sh = scene.naturalHeight;
  const scl = maxOut ? Math.min(1, maxOut / Math.max(sw, sh)) : 1;
  const W = Math.max(1, Math.round(sw * scl)), H = Math.max(1, Math.round(sh * scl));

  // Placement (constant across rotations).
  const floorY = Math.round(H * 0.80);
  const targetH = Math.round(H * (ml === 10 ? 0.73 : 0.66));
  const s = targetH / bbox.h;
  const dw = Math.round(bbox.w * s), dh = targetH;
  const cx = Math.round(W / 2), dx = Math.round(cx - dw / 2), topY = floorY - dh;

  // Pre-bake the static ground: scene + contact shadow (vial + reflection are drawn per frame).
  const bg = document.createElement("canvas");
  bg.width = W; bg.height = H;
  const bctx = bg.getContext("2d");
  bctx.imageSmoothingQuality = "high";
  bctx.drawImage(scene, 0, 0, W, H);
  bctx.save();
  bctx.filter = `blur(${Math.max(2, Math.round(dw * 0.05))}px)`;
  bctx.fillStyle = "rgba(0,0,0,0.55)";
  bctx.beginPath();
  bctx.ellipse(cx, floorY, dw * 0.42, dh * 0.05, 0, 0, Math.PI * 2);
  bctx.fill();
  bctx.restore();

  // Reusable offscreen canvases (crop = tight vial, refl = flipped faded copy).
  const crop = document.createElement("canvas");
  crop.width = dw; crop.height = dh;
  const refl = document.createElement("canvas");
  refl.width = dw; refl.height = dh;

  return { prepared, off, bbox, bg, crop, refl, place: { W, H, dw, dh, dx, topY, floorY } };
}

/**
 * Paint one scene frame at rotation `rot`. Reuses the pre-baked background + crop bbox +
 * offscreen canvases from `prepareVialScene`, so a frame is one composite + a few drawImages
 * with no per-frame allocation — fast enough to animate a live spin.
 */
export function paintVialScene(canvas, state, rot = 0, opts = {}) {
  const wrap = opts.wrap !== undefined ? opts.wrap : true;
  const { prepared, off, bbox, bg, crop, refl, place } = state;
  const { W, H, dw, dh, dx, topY, floorY } = place;
  composeVial(off, prepared, rot, { wrap });

  // Crop the vial tightly (constant silhouette) into the reusable crop canvas, scaled to dw×dh.
  const cctx = crop.getContext("2d");
  cctx.clearRect(0, 0, dw, dh);
  cctx.drawImage(off, bbox.minX, bbox.minY, bbox.w, bbox.h, 0, 0, dw, dh);

  // Reflection: flipped, faded copy on the polished floor.
  const rctx = refl.getContext("2d");
  rctx.setTransform(1, 0, 0, 1, 0, 0);
  rctx.clearRect(0, 0, dw, dh);
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
  rctx.globalCompositeOperation = "source-over";

  // Composite: ground → reflection → vial.
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bg, 0, 0);
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.drawImage(refl, dx, floorY);
  ctx.restore();
  ctx.drawImage(crop, dx, topY, dw, dh);
  return true;
}

/**
 * Compose the vial onto the black-marble studio scene (charcoal wall + light beams + polished
 * floor) with a soft reflection and contact shadow — the "product photo on marble" look. The
 * vial base is planted on the floor line; 10 mL vials are drawn taller than 3 mL so the size
 * difference reads true. Output is an opaque scene canvas sized to `sceneSrc`.
 */
export async function drawVialScene(canvas, { svg, vialMl, baseSrc, sceneSrc, rot = 0 }) {
  const state = await prepareVialScene({ svg, vialMl, baseSrc, sceneSrc });
  return paintVialScene(canvas, state, rot, { wrap: rot !== 0 });
}
