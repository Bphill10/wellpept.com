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

// Base vial photos carry a blank GREEN label (an evenly-lit chroma key). The compositor
// detects the green paper precisely and wraps the silver label onto exactly that region,
// picking up the real paper's curvature/shading — cleaner and more realistic than guessing
// a band on a white vial.
const BASE = {
  "3-white": "/ud-labels/vials/UD_Green_3mL_White.png",
  "3-blue": "/ud-labels/vials/UD_Green_3mL_Blue.png",
  "10-white": "/ud-labels/vials/UD_Green_10mL_White.png",
  "10-red": "/ud-labels/vials/UD_Green_10mL_Red.png",
};

// Cylinder-wrap constants (shared by the composite and the LUT).
const UC = 0.34, HALF = 0.33, B = 1.05, SB = Math.sin(B);

// A real vial label doesn't wrap all the way around — it covers most of the circumference and
// leaves a bare-glass gap where its two ends meet. GAP_UNITS is that gap as a fraction of the
// label's own width, so the label covers 1/(1+GAP_UNITS) of the turn (~0.25 → ~20% bare).
const GAP_UNITS = 0.25;

// Seeing the far side of the label through the clear glass. It reads as a SHADOW of the label in
// its base tone — you register that something is there on the far wall, but no artwork and no
// reversed text. BACK_SHADOW is the label's paper darkened to shadow; BACK_MIX keeps it well under
// full so the glass's own shading and reflections still carry through it.
const BACK_SHADOW = 104, BACK_MIX = 0.2;

// How much light the window transmits on a POWDER vial. Behind the window is empty interior, so
// you are looking through to the dark behind the vial — the window has to sit darker than the lit
// front surface or it reads as a bright silver panel stuck on the glass rather than as something
// you can see through. Liquid vials are exempt: there the window is full of red, not air.
const WINDOW_TRANSMIT = 0.68;



// Screen-x → label-u foreshortening LUT (includes the HALF factor). Indexed by the visible
// column fraction 0..1 across the label run; lets the green path wrap per-row without an
// asin in the hot loop.
const ASIN_LUT = (() => {
  const N = 1024, t = new Float32Array(N);
  for (let k = 0; k < N; k++) {
    const uo = k / (N - 1);
    t[k] = (HALF * Math.asin(Math.max(-1, Math.min(1, (2 * uo - 1) * SB)))) / B;
  }
  return t;
})();

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

// Strict green paper (bright, clearly green) — used to anchor the label bounds + brightness.
function isGreenPix(r, g, b) {
  return g > 75 && g > r * 1.15 && g > b * 1.15 && (g - (r > b ? r : b)) > 24;
}

// Any green-label pixel to paint over, including the label's anti-aliased edge: bright green,
// faint/washed green, and the murky yellow-green transition tones at the curved top/bottom
// rim (green-looking but red-dominant). Excludes glass (grey), powder (white) and liquid (red),
// so it never bleeds onto the vial.
function maskGreenPix(r, g, b) {
  return (g > 75 && g > r * 1.15 && g > b * 1.15)
    || (g > 42 && g > r * 1.03 && g > b * 1.03)
    || (g > 90 && b < g * 0.62 && r < g * 1.28 && g - b > 40);
}

/**
 * Detect the blank green label on a chroma-key base vial. A strict pass anchors the label's
 * vertical mapping bounds (top0/bot0) and a brightness reference (for the paper's shading);
 * then a per-pixel pass records the FULL green extent per row — following the real curved
 * edges and including the anti-aliased rim — so the silver label covers every green pixel with
 * no fringe. Returns null if the base has no substantial green label (non-chroma → band).
 */
function detectGreenLabel(d, W, H) {
  const minRun = W * 0.06;
  let top0 = -1, bot0 = -1, rows = 0, gLeft = W, gRight = 0;
  const strictLo = new Int32Array(H).fill(-1), strictHi = new Int32Array(H).fill(-1);
  for (let y = 0; y < H; y++) {
    let bestLo = -1, bestHi = -2, curLo = -1;
    for (let x = 0; x < W; x++) {
      const green = isGreenPix(d[(y * W + x) * 4], d[(y * W + x) * 4 + 1], d[(y * W + x) * 4 + 2]);
      if (green && curLo < 0) curLo = x;
      if ((!green || x === W - 1) && curLo >= 0) {
        const curHi = green ? x : x - 1;
        if (curHi - curLo > bestHi - bestLo) { bestLo = curLo; bestHi = curHi; }
        curLo = -1;
      }
    }
    if (bestLo >= 0 && bestHi - bestLo > minRun) {
      strictLo[y] = bestLo; strictHi[y] = bestHi;
      if (top0 < 0) top0 = y;
      bot0 = y; rows++;
      if (bestLo < gLeft) gLeft = bestLo;
      if (bestHi > gRight) gRight = bestHi;
    }
  }
  if (rows < H * 0.02) return null;

  // Brightness reference (92nd percentile of green paper) for the shading multiply.
  const samples = [];
  for (let y = top0; y <= bot0; y += 2) {
    const lo = strictLo[y], hi = strictHi[y];
    if (lo < 0) continue;
    for (let x = lo; x <= hi; x += 2) {
      const i = (y * W + x) * 4;
      samples.push(0.25 * d[i] + 0.7 * d[i + 1] + 0.05 * d[i + 2]);
    }
  }
  samples.sort((a, b) => a - b);
  const ref = samples[Math.floor(samples.length * 0.92)] || 160;

  // Per-pixel green extent per row, searched a little beyond the strict band (to catch the
  // curved rim) and clamped near the label horizontally (so a stray green reflection can't
  // stretch a row). Records min/max green x; gaps between are skipped at paint time.
  const capY = Math.round(H * 0.03), padX = Math.round(W * 0.02);
  const y0 = Math.max(0, top0 - capY), y1 = Math.min(H - 1, bot0 + capY);
  const x0 = Math.max(0, gLeft - padX), x1 = Math.min(W - 1, gRight + padX);
  const rowLo = new Int32Array(H).fill(-1), rowHi = new Int32Array(H).fill(-1);
  let top = -1, bot = -1;
  for (let y = y0; y <= y1; y++) {
    let lo = -1, hi = -1;
    for (let x = x0; x <= x1; x++) {
      const i = (y * W + x) * 4;
      if (maskGreenPix(d[i], d[i + 1], d[i + 2])) { if (lo < 0) lo = x; hi = x; }
    }
    if (lo >= 0) { rowLo[y] = lo; rowHi[y] = hi; if (top < 0) top = y; bot = y; }
  }

  const rowInvW = new Float32Array(H);
  for (let y = top; y <= bot; y++) {
    const w = rowHi[y] - rowLo[y];
    rowInvW[y] = w > 0 ? 1 / w : 0;
  }
  return { rowLo, rowHi, rowInvW, top, bot, top0, bot0, ref };
}

/**
 * Reconstruct what the vial looks like UNDER the label (the bare-glass gap shown as the vial
 * turns). The label band itself is hidden by green, so we borrow the vial's own glass from an
 * adjacent clear region and tile it across the band: the liquid just below the label for a
 * liquid vial (B12), or the clear neck glass just above the label for a powder vial (where the
 * band is empty glass — the powder sits at the bottom). A vertical blur erases the tiling
 * seams while keeping the vertical glass highlights aligned, so it reads as the real vial.
 */
function buildBaseGlass(base, green, liquid) {
  const { W, H, data } = base;
  const { rowLo, rowHi, top, bot, top0, bot0 } = green;
  const out = new Uint8ClampedArray(data);
  const K = Math.max(4, Math.round(H * 0.05));
  const margin = Math.round(H * 0.006);
  // Sample clear of the label's FULL extent, not its strict edge. top0/bot0 are the strict green
  // bounds; the label's anti-aliased rim runs on for ~20px past them to top/bot. Starting at
  // bot0 + margin put the first sampled rows inside that pale rim, so the bottom of the window
  // came out washed out and grey instead of matching the liquid above it.
  const srcY0 = liquid
    ? Math.min(H - K - 1, bot + margin)
    : Math.max(0, top - margin - K);
  // Vial x-extent for each source row (to clamp samples to the glass).
  const sxl = new Int32Array(K), sxr = new Int32Array(K);
  for (let k = 0; k < K; k++) {
    const yy = srcY0 + k; let xl = W, xr = 0;
    for (let x = 0; x < W; x++) if (data[(yy * W + x) * 4 + 3] > 60) { if (x < xl) xl = x; if (x > xr) xr = x; }
    sxl[k] = xl; sxr[k] = xr;
  }
  const span = Math.max(1, bot - top);
  for (let y = top; y <= bot; y++) {
    const lo = rowLo[y]; if (lo < 0) continue;
    const hi = rowHi[y];
    // STRETCH the sampled rows across the band rather than tiling them. Reflect-tiling repeated
    // the sample every 2K rows, which showed through the bare-glass window as hard banding — a
    // grey corrugated panel on powder vials, and horizontal stripes in the liquid on B12. It was
    // only ever hidden by the frost that used to sit on top.
    //
    // The same mapping serves both: off runs K-1 → 0 down the band, so the END of the band that
    // touches the sampled region joins it continuously — the TOP for powder (sampled from the
    // clear glass above the label) and the BOTTOM for liquid (sampled from the liquid below it).
    const off = Math.round(((bot - y) / span) * (K - 1));
    const sy = srcY0 + off, kxl = sxl[off], kxr = sxr[off];
    for (let x = lo; x <= hi; x++) {
      const sx = x < kxl ? kxl : x > kxr ? kxr : x;
      const si = (sy * W + sx) * 4, di = (y * W + x) * 4;
      out[di] = data[si]; out[di + 1] = data[si + 1]; out[di + 2] = data[si + 2];
    }
  }
  // Vertical blur to erase the tiling seams (vertical highlights are per-column, so kept).
  const R = Math.max(2, Math.round(K * 0.8));
  const tmp = new Uint8ClampedArray(out);
  for (let y = top; y <= bot; y++) {
    const lo = rowLo[y]; if (lo < 0) continue;
    const hi = rowHi[y];
    for (let x = lo; x <= hi; x++) {
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let dy = -R; dy <= R; dy++) {
        const yy = y + dy; if (yy < top || yy > bot) continue;
        const l2 = rowLo[yy]; if (l2 < 0 || x < l2 || x > rowHi[yy]) continue;
        const j = (yy * W + x) * 4; sr += tmp[j]; sg += tmp[j + 1]; sb += tmp[j + 2]; n++;
      }
      if (n) { const di = (y * W + x) * 4; out[di] = (sr / n) | 0; out[di + 1] = (sg / n) | 0; out[di + 2] = (sb / n) | 0; }
    }
  }
  return out;
}

// Making the glass read as glass. The base photographs are lit, so the clear body sits at a bright
// mid-grey; composited onto the dark marble that reads as frosted silver rather than as something
// you can see through. Real glass against a dark ground is mostly DARK with narrow bright
// speculars, so the midtones are pulled down and the highlights left alone.
const GLASS_GAMMA = 1.75, GLASS_CHROMA = 34;
const GLASS_LUT = (() => {
  const t = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) t[v] = Math.round(255 * Math.pow(v / 255, GLASS_GAMMA));
  return t;
})();

/**
 * Pull the vial's clear glass down so it transmits instead of glowing. Only LOW-CHROMA pixels are
 * touched, so the powder stays white, the liquid stays red and a coloured cap is untouched; and
 * only below the neck, so the crimp keeps its weight. The curve leaves highlights nearly intact —
 * losing those would flatten the glass rather than clear it.
 */
function transmitGlass(out, base) {
  const { W, H, data } = base;
  const wid = new Int32Array(H);
  let minY = H, maxY = 0;
  for (let y = 0; y < H; y++) {
    let xl = -1, xr = -1;
    for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 60) { if (xl < 0) xl = x; xr = x; }
    wid[y] = xl < 0 ? 0 : xr - xl + 1;
    if (xl >= 0) { if (y < minY) minY = y; maxY = y; }
  }
  if (maxY <= minY) return;
  const vh = maxY - minY + 1;
  // The neck is the narrowest row in the upper third; everything above it is cap and crimp.
  let neck = minY, nw = 1 << 30;
  for (let y = minY + Math.round(vh * 0.06); y < minY + Math.round(vh * 0.34); y++) {
    if (wid[y] > 0 && wid[y] < nw) { nw = wid[y]; neck = y; }
  }
  for (let y = neck + Math.round(vh * 0.01); y <= maxY; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 60) continue;
      const r = out[i], g = out[i + 1], b = out[i + 2];
      const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
      if (mx - mn > GLASS_CHROMA) continue; // coloured contents or cap — leave alone
      out[i] = GLASS_LUT[r]; out[i + 1] = GLASS_LUT[g]; out[i + 2] = GLASS_LUT[b];
    }
  }
}


/**
 * Recolour the vial's metal cap — the rounded flip-top DOME and the CRIMP collar below it — to
 * two coordinated tints (an [r,g,b] each). Multiplying the neutral metal by a tint keeps every
 * highlight and shadow so it reads as anodised colour, not paint. The cap bottom is found by
 * width (the crimp collar is the widest metal near the top; the glass neck narrows sharply just
 * below it), so on the slimmer 10 mL the colour no longer bleeds onto the neck. The dome and
 * crimp take slightly different shades so they match without being identical. Pairs with a
 * matching label accent for a coordinated colour-coded set.
 */
function tintCap(out, base, domeTint, crimpTint) {
  const { W, H, data } = base;
  // Per-row horizontal extent + the vial's vertical span.
  const rowL = new Int32Array(H).fill(-1), rowR = new Int32Array(H).fill(-1);
  let minY = H, maxY = 0;
  for (let y = 0; y < H; y++) {
    let xl = W, xr = -1;
    for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 60) { if (x < xl) xl = x; xr = x; }
    if (xr >= xl) { rowL[y] = xl; rowR[y] = xr; if (y < minY) minY = y; maxY = y; }
  }
  if (maxY <= minY) return;
  const vh = maxY - minY;
  const wAt = (y) => (rowR[y] >= 0 ? rowR[y] - rowL[y] + 1 : 0);
  // The crimp collar is the widest metal in the top quarter (above the neck; the shoulder that
  // widens again lower down is excluded). Then the neck is the narrowest row just below it —
  // that pinch is where the glass begins, so the cap ends a hair above it (no bleed onto neck).
  const collarBot = minY + Math.round(vh * 0.24);
  let collarW = 0, collarY = minY;
  for (let y = minY; y <= collarBot && y <= maxY; y++) if (wAt(y) > collarW) { collarW = wAt(y); collarY = y; }
  const neckBot = Math.min(maxY, collarY + Math.round(vh * 0.16));
  let neckW = collarW, neckY = collarY;
  for (let y = collarY; y <= neckBot; y++) if (wAt(y) < neckW) { neckW = wAt(y); neckY = y; }
  let capBot = neckY - Math.round(vh * 0.008);
  if (capBot < collarY + 2) capBot = collarY + 2;
  // Dome above, crimp collar below. The split sits at the cap's plastic/metal seam — at 0.55 the
  // dome colour ran a hair too low and painted the collar's bright top rim, so the dome looked
  // like it bled into the crimp; 0.46 lands the rim on the crimp colour instead.
  const domeBot = minY + Math.round((capBot - minY) * 0.46);
  const paint = (y0, y1, tint) => {
    const tr = tint[0], tg = tint[1], tb = tint[2];
    for (let y = y0; y <= y1; y++) {
      const lo = rowL[y]; if (lo < 0) continue;
      const hi = rowR[y];
      for (let x = lo; x <= hi; x++) {
        const i = (y * W + x) * 4;
        if (data[i + 3] < 60) continue;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const mx = r > g ? (r > b ? r : b) : g > b ? g : b;
        const mn = r < g ? (r < b ? r : b) : g < b ? g : b;
        const L = 0.299 * r + 0.587 * g + 0.114 * b;
        if (L < 42 || mx - mn > 46) continue; // skip near-black crevices + coloured/glass pixels
        out[i]     = (r * tr) / 255;
        out[i + 1] = (g * tg) / 255;
        out[i + 2] = (b * tb) / 255;
      }
    }
  };
  paint(minY, domeBot, domeTint);
  paint(domeBot + 1, capBot, crimpTint);
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
export async function prepareVialCompositor({ svg, vialMl, baseSrc, ss = BASE_SS, capTint = null, crimpTint = null }) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const dims = silverLabelDims(ml);
  const base = await getBase(baseSrc, ss);
  const ld = await renderLabelPixels(svg, dims.w, dims.h);

  // Preferred path: a blank green label on the base → wrap the silver label onto exactly that
  // paper, shaded by the real photo.
  const green = detectGreenLabel(base.data, base.W, base.H);
  if (green) {
    // Liquid vials (B12) fill the label band; powder vials are empty glass there. `baseGlass`
    // (the bare-glass gap shown while spinning) is built lazily on first wrap use.
    // Match the red-liquid base by its filename token (…_Red.png), not a loose "red" — a base64
    // data-URL src would otherwise false-positive (no "_" or word breaks in standard base64).
    const liquid = /_red\b|\bliquid\b/i.test(String(baseSrc));
    // No pale reverse screened into the empty body any more. It fogged exactly the area that most
    // needs to look clear, and because it was skipped on 10 mL bases it also made the 3 mL vials
    // read milkier than the 10 mL ones — the glass now matches across every size.
    const baseBack = new Uint8ClampedArray(base.data);
    transmitGlass(baseBack, base);
    // Optional cap recolour (landing showcase) — dome + crimp collar in two coordinated tints.
    if (capTint) tintCap(baseBack, base, capTint, crimpTint || capTint);
    return { base, ld, lw: dims.w, lh: dims.h, green, liquid, baseBack };
  }

  // Fallback (non-chroma base): guess a band on the vial silhouette.
  const fp = footprint(base.data, base.W, base.H, BAND[ml].top, BAND[ml].bot, BAND[ml].fill);
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
 * Green-label (chroma-key) compose: wrap the silver label onto exactly the detected green
 * paper, multiplied by the real paper's brightness so it inherits the photo's curvature,
 * edge fall-off and paper texture. Everything outside the green (cap, glass, powder, liquid)
 * is the untouched photo. Per-row wrap via the shared asin LUT; `wrap` tiles for a full spin.
 */
/**
 * Sub-pixel coverage for the label's curved top and bottom rims.
 *
 * maskGreenPix is a binary test and the rims are very shallow curves — the bottom edge rises only
 * ~13px across the label's whole width — so a hard mask draws them as a staircase: ~28px of flat
 * run, then a 1px jump. That is plainly visible against the liquid. Here the boundary row is
 * measured per column and smoothed into a FRACTIONAL curve, so each pixel can take partial
 * coverage and the rim anti-aliases the way a drawn curve would.
 *
 * Only the top and bottom rims are softened. The left and right edges are the vial's own
 * silhouette, already anti-aliased in the photograph.
 */
function buildEdgeCoverage(base, green) {
  const { W, data } = base;
  const { rowLo, rowHi, top, bot } = green;
  const rawTop = new Float32Array(W).fill(-1);
  const rawBot = new Float32Array(W).fill(-1);
  for (let x = 0; x < W; x++) {
    let first = -1, last = -1;
    for (let y = top; y <= bot; y++) {
      const lo = rowLo[y];
      if (lo < 0 || x < lo || x > rowHi[y]) continue;
      const i = (y * W + x) * 4;
      if (!maskGreenPix(data[i], data[i + 1], data[i + 2])) continue;
      if (first < 0) first = y;
      last = y;
    }
    rawTop[x] = first; rawBot[x] = last;
  }
  // Average across neighbouring columns so the integer boundary becomes a smooth fractional one.
  const R = 6;
  const sTop = new Float32Array(W).fill(-1);
  const sBot = new Float32Array(W).fill(-1);
  for (let x = 0; x < W; x++) {
    if (rawTop[x] < 0) continue;
    let st = 0, sb = 0, n = 0;
    for (let d = -R; d <= R; d++) {
      const xx = x + d;
      if (xx < 0 || xx >= W || rawTop[xx] < 0) continue;
      st += rawTop[xx]; sb += rawBot[xx]; n++;
    }
    if (n) { sTop[x] = st / n; sBot[x] = sb / n; }
  }
  return { sTop, sBot };
}

function composeGreen(canvas, prepared, rot, wrap) {
  const { base, ld, lw, lh, green } = prepared;
  const { W, H, data: src } = base;
  const { rowLo, rowHi, rowInvW, top, bot, top0, bot0, ref } = green;
  // Bare-glass gap for the spin: the label wraps most of the way, and where it doesn't we show
  // the vial's own reconstructed glass (screen-fixed, so its highlights stay put).
  if (!prepared.edgeCov) prepared.edgeCov = buildEdgeCoverage(base, green);
  const { sTop, sBot } = prepared.edgeCov;
  if (wrap && !prepared.baseGlass) prepared.baseGlass = buildBaseGlass(base, green, prepared.liquid);
  const baseGlass = prepared.baseGlass;
  const T = 1 + GAP_UNITS;
  const rr = wrap ? rot * T : rot; // one component revolution (rot 0→1) spans the whole strip
  // Start from the base with the label's pale reverse already lit into the clear glass above.
  // The buffer is allocated ONCE per prepared vial and reused every frame: the set of pixels this
  // loop writes is fixed by `maskGreenPix` on the SOURCE pixels (never on `rot`), so it is
  // identical on every frame, and each written pixel is fully overwritten. Copying the whole base
  // per frame instead cost megabytes of allocation per frame, which is what capped the hero's
  // render resolution.
  const init = prepared.baseBack || src;
  let out = prepared.outBuf;
  if (!out || out.length !== init.length) {
    out = prepared.outBuf = new Uint8ClampedArray(init);
    prepared.outImg = null;
  }
  const lwm = lw - 1, fh = Math.max(1, bot0 - top0), LN = ASIN_LUT.length - 1;
  const PAPER = 236; // neutral paper shown through the label's transparent margins/corners
  for (let y = top; y <= bot; y++) {
    const lo = rowLo[y];
    if (lo < 0) continue;
    const hi = rowHi[y], invW = rowInvW[y];
    // Map to the label by the strict bounds; the curved rim rows clamp to the label's first/
    // last row so its edge paper — not stretched content — covers them.
    let lyf = ((y - top0) / fh) * (lh - 1);
    lyf = lyf < 0 ? 0 : lyf > lh - 1 ? lh - 1 : lyf;
    const rb = (lyf | 0) * lw;
    for (let x = lo; x <= hi; x++) {
      const i = (y * W + x) * 4;
      const r = src[i], g = src[i + 1], b = src[i + 2];
      if (!maskGreenPix(r, g, b)) continue; // follow the real curved edge; leave gaps as photo
      // Partial coverage at the curved rims so they anti-alias instead of stepping. This depends
      // only on x and y, never on rotation, so the set of pixels written stays identical every
      // frame and the reused output buffer stays valid.
      let cov = 1;
      const te = sTop[x];
      if (te >= 0) {
        const dTop = y - te + 0.5, dBot = sBot[x] - y + 0.5;
        cov = dTop < dBot ? dTop : dBot;
        if (cov <= 0) continue;
        if (cov > 1) cov = 1;
      }
      const uo = (x - lo) * invW;
      const dOff = ASIN_LUT[(uo * LN) | 0]; // this column's offset around the cylinder
      let u = UC + rr + dOff;
      if (wrap) {
        u -= Math.floor(u / T) * T; // wrap around the full strip (label + gap)
        if (u >= 1) {
          // The bare-glass window between the label's two ends. Plain transparent glass — never
          // frosted, never filled — so the contents read through at full strength.
          let gr = baseGlass[i], gg = baseGlass[i + 1], gb = baseGlass[i + 2];
          if (!prepared.liquid) { gr *= WINDOW_TRANSMIT; gg *= WINDOW_TRANSMIT; gb *= WINDOW_TRANSMIT; }
          // And because it IS transparent, you are looking clean through the vial here: the far
          // wall still carries the label, so it shadows the glass from behind. Mirror this
          // column's offset about the half-turn to find where the far surface sits on the label;
          // where it lands ON the label you get that shadow, and where it falls in the gap you see
          // straight out the other side. Only its EDGE and the way it slides the opposite way to
          // the front label as the vial turns carry the depth — no artwork, and no reversed text
          // to read, which looked like a second label rather than like glass.
          let ub = UC + rr + T * 0.5 - dOff;
          ub -= Math.floor(ub / T) * T;
          if (ub < 1) {
            gr += (BACK_SHADOW - gr) * BACK_MIX;
            gg += (BACK_SHADOW - gg) * BACK_MIX;
            gb += (BACK_SHADOW - gb) * BACK_MIX;
          }
          if (cov >= 1) { out[i] = gr; out[i + 1] = gg; out[i + 2] = gb; }
          else {
            out[i] = init[i] + (gr - init[i]) * cov;
            out[i + 1] = init[i + 1] + (gg - init[i + 1]) * cov;
            out[i + 2] = init[i + 2] + (gb - init[i + 2]) * cov;
          }
          continue;
        }
      } else {
        u = u < 0 ? 0 : u > 1 ? 1 : u;
      }
      const li = (rb + ((u * lwm) | 0)) * 4;
      // Composite the label over neutral paper by its own alpha (so transparent art reads as
      // paper, never black), then multiply by the real paper's brightness for curvature.
      const la = ld[li + 3] / 255, ia = PAPER * (1 - la);
      let sh = (0.25 * r + 0.7 * g + 0.05 * b) / ref;
      sh = sh < 0.5 ? 0.5 : sh > 1.08 ? 1.08 : sh;
      const pr = (ld[li] * la + ia) * sh;
      const pg = (ld[li + 1] * la + ia) * sh;
      const pb = (ld[li + 2] * la + ia) * sh;
      if (cov >= 1) {
        out[i] = clamp(pr); out[i + 1] = clamp(pg); out[i + 2] = clamp(pb);
      } else {
        out[i] = clamp(init[i] + (pr - init[i]) * cov);
        out[i + 1] = clamp(init[i + 1] + (pg - init[i + 1]) * cov);
        out[i + 2] = clamp(init[i + 2] + (pb - init[i + 2]) * cov);
      }
    }
  }
  // Only resize when it actually changes — assigning width/height reallocates and clears the
  // canvas, and putImageData rewrites every pixel anyway.
  if (canvas.width !== W) canvas.width = W;
  if (canvas.height !== H) canvas.height = H;
  if (!prepared.outImg) prepared.outImg = new ImageData(out, W, H);
  canvas.getContext("2d").putImageData(prepared.outImg, 0, 0);
  return true;
}

/**
 * Paint the prepared vial to `canvas` at rotation `rot` (label-u offset; 0 = default front).
 * With `wrap` the label tiles around the cylinder (its two ends meet at a back seam) so a full
 * revolution reads continuously; without it the wrap clamps at the label edges (drag preview).
 */
export function composeVial(canvas, prepared, rot = 0, opts = {}) {
  const wrap = !!opts.wrap;
  if (prepared.green) return composeGreen(canvas, prepared, rot, wrap);
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
export async function prepareVialScene({ svg, vialMl, baseSrc, sceneSrc, ss = BASE_SS, maxOut = 0, capTint = null, crimpTint = null }) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const prepared = await prepareVialCompositor({ svg, vialMl: ml, baseSrc, ss, capTint, crimpTint });
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
  // 3 mL vials fill 62% of the scene height. A 10 mL vial is drawn exactly 13% taller AND 13%
  // wider than the 3 mL's rendered box (a uniform ×1.13 of the 3 mL glass, whose measured aspect
  // is GLASS_ASPECT_3ML) — anchored to the 3 mL rather than to its own photo, because the 10 mL
  // base photo sits smaller and slimmer in its frame and would otherwise read shorter and fatter.
  const H3 = 0.62, TEN_ML_SCALE = 1.13, GLASS_ASPECT_3ML = 0.4225; // 3 mL white base glass: 387×916
  let dw, dh;
  if (ml === 10) {
    dh = Math.round(H * H3 * TEN_ML_SCALE);
    dw = Math.round(H * H3 * TEN_ML_SCALE * GLASS_ASPECT_3ML);
  } else {
    dh = Math.round(H * H3);
    dw = Math.round(bbox.w * (dh / bbox.h));
  }
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

  return { prepared, off, bbox, bg, crop, refl, place: { W, H, dw, dh, dx, topY, floorY, ml } };
}

/**
 * Paint one scene frame at rotation `rot`. Reuses the pre-baked background + crop bbox +
 * offscreen canvases from `prepareVialScene`, so a frame is one composite + a few drawImages
 * with no per-frame allocation — fast enough to animate a live spin.
 */
export function paintVialScene(canvas, state, rot = 0, opts = {}) {
  const wrap = opts.wrap !== undefined ? opts.wrap : true;
  const { prepared, off, bbox, bg, crop, refl, place } = state;
  const { W, H, dw, dh, dx, topY, floorY, ml } = place;
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
  g.addColorStop(0, "rgba(0,0,0,0.30)");
  g.addColorStop(0.30, "rgba(0,0,0,0)"); // fainter + fades faster → a subtle sheen, not a mirror
  rctx.fillStyle = g;
  rctx.fillRect(0, 0, dw, dh);
  rctx.globalCompositeOperation = "source-over";

  // Composite: ground → reflection → vial.
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bg, 0, 0);
  // No reflection under 10 mL vials: their tall base + heel reflected on the floor reads as a
  // smeared blob at the bottom of the card, so the 10 mL just plants on its contact shadow.
  if (ml !== 10) {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.drawImage(refl, dx, floorY);
    ctx.restore();
  }
  ctx.drawImage(crop, dx, topY, dw, dh);
  return true;
}

/**
 * Compose the vial onto the black-marble studio scene (charcoal wall + light beams + polished
 * floor) with a soft reflection and contact shadow — the "product photo on marble" look. The
 * vial base is planted on the floor line; 10 mL vials are drawn taller than 3 mL so the size
 * difference reads true. Output is an opaque scene canvas sized to `sceneSrc`.
 */
export async function drawVialScene(canvas, { svg, vialMl, baseSrc, sceneSrc, rot = 0, ss, maxOut = 0, capTint = null, crimpTint = null }) {
  const state = await prepareVialScene({ svg, vialMl, baseSrc, sceneSrc, ...(ss ? { ss } : {}), maxOut, capTint, crimpTint });
  return paintVialScene(canvas, state, rot, { wrap: rot !== 0 });
}
