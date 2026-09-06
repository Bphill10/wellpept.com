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

/**
 * The same four vials shot with NO LABEL ANYWHERE — identical camera, scale, lighting, cap,
 * crimp, contents and fill level, with genuine continuous clear glass right across the body.
 *
 * Where the wrap does not reach, these supply the glass directly. Nothing is reconstructed: the
 * uncovered stretch is the untouched pixels of the unlabelled vial. Reconstructing it from a
 * labelled base can only ever approximate glass the camera never saw, which is what kept it
 * reading as a panel.
 *
 * Optional. Any that are missing fall back to the reconstruction, so the catalog keeps working
 * while they are being shot.
 */
const CLEAN = {
  "3-white": "/ud-labels/vials/UD_Clean_3mL_White.png",
  "3-blue": "/ud-labels/vials/UD_Clean_3mL_Blue.png",
  "10-white": "/ud-labels/vials/UD_Clean_10mL_White.png",
  "10-red": "/ud-labels/vials/UD_Clean_10mL_Red.png",
};

// Cylinder-wrap constants (shared by the composite and the LUT).
const UC = 0.34, HALF = 0.33, B = 1.05, SB = Math.sin(B);

// A real vial label doesn't wrap all the way around — it covers most of the circumference and
// leaves a bare-glass gap where its two ends meet. GAP_UNITS is that gap as a fraction of the
// label's own width, so the label covers 1/(1+GAP_UNITS) of the turn (~0.25 → ~20% bare).
const GAP_UNITS = 0.25;

// The label's two cut ends stand a hair off the glass, so they catch a line of light along the
// fold — extremely subtle, just enough that the paper does not melt into the glass. How far in it
// reaches, in label-u, and how much brighter the paper goes at the fold itself.
const LABEL_EDGE_W = 0.012, LABEL_EDGE_LIFT = 0.11;
// How strongly the far side of the wrap shows through the uncovered glass.
//
// It is applied as a DARKENING keyed to the label's own artwork, never as a blend toward the
// label. Blending meant the label's blank white paper — which is most of it — was mixed in
// everywhere at a flat 24%, and a uniform light veil across the whole opening is precisely what
// reads as a frosted grey rectangle with its own left and right edges. Keying it to the artwork
// instead leaves bare paper doing nothing at all: the glass is untouched except where there is
// actually something printed to see, so the opening has no boundary of its own and the vial's own
// highlights carry through it at full strength. It multiplies, so it rides on whatever is behind
// the glass — clear glass, powder or red liquid — rather than sitting on top of it.
const FAR_INK = 0.13;
// Curved glass refracts whatever is behind it, so the far side arrives softened rather than sharp
// — and more so toward the silhouette, where the glass turns away and the path through it
// lengthens. Sampled as a short horizontal average across this much label-u instead of at a
// point. Reading it as a point made it look like text printed on a panel; but this was three
// times wider a moment ago, which stopped reading as refraction and just read as blur. Enough to
// take the edge off, not enough to lose the word.
const FAR_BLUR = 0.055;
// Its top and bottom edges are refracted too. Sampled hard they put a horizontal line across the
// opening — measured, a jump of 71 luminance in one row onto a dead-flat tone, which is exactly
// what reads as a rectangular pane. Feathered over this fraction of the label's height.
const FAR_FEATHER = 0.07;

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
  const isRed = pc.includes("red") || pc.includes("liquid") || /\bB\s*12\b|VITAMIN\s*B12/.test(n);
  if (isRed) return BASE["10-red"];
  // Blue compounds render off the white base with a tint (see powderTintFor). The blue photo is
  // still installed, but nothing routes to it: its cake was too dark to keep a highlight.
  return ml === 10 ? BASE["10-white"] : BASE["3-white"];
}

/**
 * Contents colours. Every base is shot with white powder, so a compound's cake colour is a tint
 * applied at composite time rather than a separate photo. Keep these bright: they are pivoted on
 * the cake's own mid-tone, so a dark tint loses the crown highlight that makes it read as powder.
 */
export const POWDER_TINTS = {
  blue: [12, 42, 150],
};

/** The tint for a compound's cake, or null to leave it the photographed white. */
export function powderTintFor(name, powderColor = "") {
  const n = String(name || "").toUpperCase();
  const pc = String(powderColor || "").toLowerCase();
  // The blue trio share one cake colour; they are told apart by their caps, not their contents.
  if (/\bKLOW\b|\bGLOW\b|GHK/.test(n) || pc.includes("blue")) return POWDER_TINTS.blue;
  return null;
}

/** The unlabelled twin of whatever silverVialBaseSrc would pick, or "" if none is installed. */
export function cleanVialBaseSrc(name, vialMl, powderColor = "") {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const n = String(name || "").toUpperCase();
  const pc = String(powderColor || "").toLowerCase();
  const isRed = pc.includes("red") || pc.includes("liquid") || /\bB\s*12\b|VITAMIN\s*B12/.test(n);
  if (isRed) return CLEAN["10-red"];
  // Blue compounds render off the white base with a tint (see powderTintFor). The blue photo is
  // still installed, but nothing routes to it: its cake was too dark to keep a highlight.
  return ml === 10 ? CLEAN["10-white"] : CLEAN["3-white"];
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
 * turns). The label band hides that glass, so it has to be borrowed from the clear regions the
 * label does not cover.
 *
 * A vial is a vertical extrusion, so one row of clear glass carried down the band is the right
 * reconstruction. What it must NOT be is a stretch: the old code sampled a slice a twentieth of
 * the image tall and scaled it over a band a third of it tall, a roughly sevenfold smear that
 * read as frosted rather than clear, then blurred it further to hide the seams.
 *
 * Powder vials read the glass above the label; liquid vials (B12) read the liquid below it.
 */
function buildBaseGlass(base, green, liquid, srcData) {
  const { W, H } = base;
  // Read from the SAME pixels the rest of the vial renders from — the normalised copy, not the
  // raw photo. Reading the raw photo here left the window on whatever brightness the base was
  // shot at while its own glass had been levelled, so the gap came out 51 darker than the vial
  // around it on the 3 mL and 15 brighter on the 10 mL.
  const data = srcData || base.data;
  const { rowLo, rowHi, top, bot } = green;
  const out = new Uint8ClampedArray(data);
  const margin = Math.round(H * 0.006);
  // Depth of each sampled band. A few rows averaged together kills sensor noise without pulling
  // in glass far enough away to have a different shape.
  const K = Math.max(3, Math.round(H * 0.012));

  // Average a band of rows into one row of colour, and record how wide the glass is there so
  // columns beyond its edge can clamp instead of reading background.
  const sampleBand = (y0) => {
    // Each row's own extent first. The vial narrows through the shoulder, so rows a few apart do
    // not line up — averaging them column-for-column smears the glass's vertical highlights
    // sideways and flattens the contrast right out of the result. Sampling each row at the same
    // RELATIVE position across its own width lines the highlights up, so the average keeps them.
    const ext = [];
    let lo = W, hi = -1;
    for (let k = 0; k < K; k++) {
      const yy = y0 + k;
      if (yy < 0 || yy >= H) { ext.push(null); continue; }
      let a = W, z = -1;
      for (let x = 0; x < W; x++) if (data[(yy * W + x) * 4 + 3] > 60) { if (x < a) a = x; z = x; }
      if (z >= a) { ext.push([a, z]); if (a < lo) lo = a; if (z > hi) hi = z; } else ext.push(null);
    }
    if (hi < lo) return null;
    const row = new Float32Array(W * 3);
    const hits = new Int32Array(W);
    const wid = Math.max(1, hi - lo);
    for (let k = 0; k < K; k++) {
      const e = ext[k]; if (!e) continue;
      const yy = y0 + k, ew = e[1] - e[0];
      for (let x = lo; x <= hi; x++) {
        const sx = e[0] + Math.round(((x - lo) / wid) * ew);
        const i = (yy * W + sx) * 4;
        // Match the alpha cut the rest of the file uses. Requiring near-opaque here skipped the
        // middle of a vial whose clear glass is genuinely semi-transparent in the source PNG —
        // 175 columns straight down the centre of the 10 mL had no sample at all and came out
        // black, which is the panel that showed through its window.
        if (data[i + 3] < 60) continue;
        row[x * 3] += data[i]; row[x * 3 + 1] += data[i + 1]; row[x * 3 + 2] += data[i + 2];
        hits[x]++;
      }
    }
    for (let x = 0; x < W; x++) if (hits[x]) { row[x * 3] /= hits[x]; row[x * 3 + 1] /= hits[x]; row[x * 3 + 2] /= hits[x]; }
    return { row, lo, hi };
  };

  const above = sampleBand(Math.max(0, top - margin - K));
  const below = sampleBand(Math.min(H - K, bot + margin));
  // A second band, further from the label, so the glass's own vertical trend can be measured and
  // carried on down the opening. Extruding one row alone left the band dead flat — measured, 100
  // luminance top to bottom with a spread of zero over its whole height — and a column with no
  // variation at all is what reads as a frosted panel rather than as glass, however well its
  // level matches. Real glass shades as the body falls away from the light.
  const far = sampleBand(Math.max(0, top - margin - K * 3));
  // A powder vial reads the clear glass ABOVE the label at both ends, so the band is one even
  // column of glass. Below the label is the powder itself, not glass — reading it turned the
  // bottom of KLOW's window blue.
  // A liquid vial reads the liquid below the label instead: there the band is full of red and
  // the headspace above the label is not.
  const A = liquid ? below : above;
  const B = liquid ? below : above;
  if (!A || !B) return out;

  const span = Math.max(1, bot - top);
  for (let y = top; y <= bot; y++) {
    const lo = rowLo[y]; if (lo < 0) continue;
    const hi = rowHi[y];
    const t = (y - top) / span;
    // Ease the trend in so the top of the opening still meets the real glass exactly.
    const g = liquid || !far ? 0 : t * t * (3 - 2 * t);
    for (let x = lo; x <= hi; x++) {
      const xa = (x < A.lo ? A.lo : x > A.hi ? A.hi : x) * 3;
      const xb = (x < B.lo ? B.lo : x > B.hi ? B.hi : x) * 3;
      const di = (y * W + x) * 4;
      let r0 = A.row[xa] + (B.row[xb] - A.row[xa]) * t;
      let g0 = A.row[xa + 1] + (B.row[xb + 1] - A.row[xa + 1]) * t;
      let b0 = A.row[xa + 2] + (B.row[xb + 2] - A.row[xa + 2]) * t;
      if (g > 0) {
        const xf = (x < far.lo ? far.lo : x > far.hi ? far.hi : x) * 3;
        // Change per band-depth, carried on and capped so it can never run away over a tall band.
        let dr = (A.row[xa] - far.row[xf]) * GLASS_DRIFT;
        let dg = (A.row[xa + 1] - far.row[xf + 1]) * GLASS_DRIFT;
        let db = (A.row[xa + 2] - far.row[xf + 2]) * GLASS_DRIFT;
        if (dr > GLASS_DRIFT_MAX) dr = GLASS_DRIFT_MAX; else if (dr < -GLASS_DRIFT_MAX) dr = -GLASS_DRIFT_MAX;
        if (dg > GLASS_DRIFT_MAX) dg = GLASS_DRIFT_MAX; else if (dg < -GLASS_DRIFT_MAX) dg = -GLASS_DRIFT_MAX;
        if (db > GLASS_DRIFT_MAX) db = GLASS_DRIFT_MAX; else if (db < -GLASS_DRIFT_MAX) db = -GLASS_DRIFT_MAX;
        r0 += dr * g; g0 += dg * g; b0 += db * g;
      }
      out[di] = r0; out[di + 1] = g0; out[di + 2] = b0;
    }
  }

  // Level the reconstruction to the vial's OWN glass — measured on the prepared pixels just above
  // the label, the same stock the reconstruction is borrowed from — rather than to a fixed
  // constant. Aiming both at the same nominal number was not enough: the body is levelled by a
  // gamma and this by a scale, so they landed 12 to 26 luminance apart and the uncovered stretch
  // read darker than the glass above it. Matching it to the measurement makes them agree by
  // construction. The two are both bare glass and have to match, but what gets
  // borrowed depends on how bright the rows beside the label happen to be in that photo — which
  // left the 3 mL gap reading as a dark panel while the 10 mL read brighter than its own vial.
  // Powder vials only: a liquid vial's window is full of red, not air.
  if (!liquid) {
    let sum = 0, n = 0;
    for (let y = top; y <= bot; y++) {
      const lo = rowLo[y]; if (lo < 0) continue;
      const hi = rowHi[y], inset = Math.round((hi - lo) * 0.2);
      for (let x = lo + inset; x <= hi - inset; x++) {
        const i = (y * W + x) * 4;
        // Measure on solid pixels only. A part-transparent pixel's RGB is not the colour that
        // ends up on screen, so letting those into an average skews the level it produces. They
        // are still SCALED below — measured on the solid glass, applied to all of it.
        if (data[i + 3] < 200) continue;
        const r = out[i], g = out[i + 1], b = out[i + 2];
        const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
        const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
        if (mx - mn > GLASS_CHROMA) continue;
        sum += 0.299 * r + 0.587 * g + 0.114 * b; n++;
      }
    }
    // What the vial's own glass measures, just above the label.
    let tSum = 0, tN = 0;
    for (let k2 = 0; k2 < K; k2++) {
      const yy = (A === below ? Math.min(H - K, bot + margin) : Math.max(0, top - margin - K)) + k2;
      if (yy < 0 || yy >= H) continue;
      let lo = W, hi = -1;
      for (let x = 0; x < W; x++) if (data[(yy * W + x) * 4 + 3] > 60) { if (x < lo) lo = x; hi = x; }
      if (hi < lo) continue;
      const ins = Math.round((hi - lo) * 0.2);
      for (let x = lo + ins; x <= hi - ins; x++) {
        const i = (yy * W + x) * 4;
        if (data[i + 3] < 200) continue;
        const r = data[i], g = data[i + 1], b = data[i + 2];
        const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
        const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
        if (mx - mn > GLASS_CHROMA) continue;
        tSum += 0.299 * r + 0.587 * g + 0.114 * b; tN++;
      }
    }
    const target = tN ? tSum / tN : GLASS_TARGET;
    if (n) {
      const k = Math.max(0.5, Math.min(2, target / Math.max(8, sum / n)));
      for (let y = top; y <= bot; y++) {
        const lo = rowLo[y]; if (lo < 0) continue;
        const hi = rowHi[y];
        for (let x = lo; x <= hi; x++) {
          const i = (y * W + x) * 4;
          out[i] *= k; out[i + 1] *= k; out[i + 2] *= k;
        }
      }
    }
  }
  return out;
}

// Making the glass read as glass. The base photographs are lit, so the clear body sits at a bright
// mid-grey; composited onto the dark marble that reads as frosted silver rather than as something
// you can see through. Real glass against a dark ground is mostly DARK with narrow bright
// speculars, so the midtones are pulled down and the highlights left alone.
// Every clear-glass vial should land on the same brightness whichever photo shoot its base came
// from, so the target is a brightness, not a curve. A fixed gamma cannot do that: the same curve
// applied to a bright photo and a dark one leaves them exactly as far apart as they started,
// which is why the 3 mL read smoky next to a 10 mL shot brighter than it.
const GLASS_TARGET = 138, GLASS_CHROMA = 34;
// How much of the glass's own vertical trend, measured between two bands above the label, is
// carried on down the uncovered opening — and the most it may shift by, so a steep trend near the
// shoulder cannot run away over a tall band.
const GLASS_DRIFT = 0.9, GLASS_DRIFT_MAX = 15;
const GLASS_GAMMA_MIN = 0.55, GLASS_GAMMA_MAX = 2.4;

/**
 * Bring the vial's clear glass to the brightness real glass has against a dark ground: mostly
 * dark, with narrow bright speculars left alone. Only LOW-CHROMA pixels are touched, so the
 * powder stays white, the liquid stays red and a coloured cap is untouched; and only below the
 * neck, so the crimp keeps its weight.
 *
 * The curve is derived per base rather than fixed. Each base is measured on its own EMPTY
 * SHOULDER — the band of bare glass between the neck and the top of the label, which holds no
 * powder and no paper — and gets the gamma that lands that band on GLASS_TARGET. So a base shot
 * bright and a base shot dark finish at the same glass instead of staying as far apart as their
 * photos were.
 */
function transmitGlass(out, base, labelTop = -1) {
  const { W, H, data } = base;
  const rowL = new Int32Array(H).fill(-1), rowR = new Int32Array(H).fill(-1);
  let minY = H, maxY = 0;
  for (let y = 0; y < H; y++) {
    let xl = -1, xr = -1;
    for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 60) { if (xl < 0) xl = x; xr = x; }
    if (xl >= 0) { rowL[y] = xl; rowR[y] = xr; if (y < minY) minY = y; maxY = y; }
  }
  if (maxY <= minY) return;
  const vh = maxY - minY + 1;
  // The neck is the narrowest row in the upper third; everything above it is cap and crimp.
  let neck = minY, nw = 1 << 30;
  for (let y = minY + Math.round(vh * 0.06); y < minY + Math.round(vh * 0.34); y++) {
    const w = rowL[y] < 0 ? 0 : rowR[y] - rowL[y] + 1;
    if (w > 0 && w < nw) { nw = w; neck = y; }
  }

  // Measure the empty shoulder. Inset from the silhouette so the bright rim highlight — which is
  // specular, not transmission — does not drag the average up.
  const mTop = neck + Math.round(vh * 0.03);
  const mBot = labelTop > mTop + 4 ? labelTop - Math.round(vh * 0.012) : neck + Math.round(vh * 0.14);
  let sum = 0, n = 0;
  for (let y = mTop; y < mBot; y++) {
    const lo = rowL[y]; if (lo < 0) continue;
    const hi = rowR[y], inset = Math.round((hi - lo) * 0.25);
    for (let x = lo + inset; x <= hi - inset; x++) {
      const i = (y * W + x) * 4;
      // Solid pixels only — see the note in buildBaseGlass. Letting part-transparent glass into
      // this average read the 10 mL brighter than it looks and over-darkened the whole vial.
      if (data[i + 3] < 200) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
      if (mx - mn > GLASS_CHROMA) continue;
      sum += 0.299 * r + 0.587 * g + 0.114 * b; n++;
    }
  }
  if (!n) return;
  const mean = Math.max(8, Math.min(247, sum / n));
  let gamma = Math.log(GLASS_TARGET / 255) / Math.log(mean / 255);
  if (gamma < GLASS_GAMMA_MIN) gamma = GLASS_GAMMA_MIN;
  else if (gamma > GLASS_GAMMA_MAX) gamma = GLASS_GAMMA_MAX;
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) lut[v] = Math.round(255 * Math.pow(v / 255, gamma));

  for (let y = neck + Math.round(vh * 0.01); y <= maxY; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 60) continue;
      const r = out[i], g = out[i + 1], b = out[i + 2];
      const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
      if (mx - mn > GLASS_CHROMA) continue; // coloured contents or cap — leave alone
      out[i] = lut[r]; out[i + 1] = lut[g]; out[i + 2] = lut[b];
    }
  }
}


/**
 * Close the dark band the label leaves under itself.
 *
 * The chroma-key label does not end cleanly against the contents. On the blue base the twenty-odd
 * rows below it are the mask blending into the powder, and they land as a dark, washed-out strip:
 * measured on the composed vial it runs 18 to 46 luminance where the powder proper sits at 58.
 * That strip is the "blank space" between the label's trim and the contents. It is in the
 * photograph, not in the mask, so no amount of edge fitting removes it — those pixels are not
 * green enough for the compositor to touch in the first place.
 *
 * The contents are reflected up into it, anchored at the row where they first reach full
 * strength, so they meet the real powder exactly there and run continuously up to the label's
 * edge. Bases that have no such band (the white ones jump straight to full powder) are left
 * alone.
 */
function liftContents(out, base, green) {
  const { W, H, data } = base;
  const { bot0 } = green;
  const rowMean = (y) => {
    let lo = -1, hi = -1;
    for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 60) { if (lo < 0) lo = x; hi = x; }
    if (lo < 0) return -1;
    const ins = Math.round((hi - lo) * 0.28);
    let sum = 0, n = 0;
    for (let x = lo + ins; x <= hi - ins; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 60) continue;
      sum += 0.299 * out[i] + 0.587 * out[i + 1] + 0.114 * out[i + 2]; n++;
    }
    return n ? sum / n : -1;
  };
  const span = Math.round(H * 0.10);
  const limit = Math.min(H - 1, bot0 + span);
  // What the contents look like at full strength, a little way below the label.
  let plateau = 0;
  for (let y = bot0 + Math.round(span * 0.5); y <= limit; y++) { const m = rowMean(y); if (m > plateau) plateau = m; }
  if (plateau <= 0) return;
  // The first row that actually gets there.
  let anchor = -1;
  for (let y = bot0 + 1; y <= limit; y++) { const m = rowMean(y); if (m >= 0) { if (m >= plateau * 0.92) { anchor = y; break; } } }
  if (anchor < bot0 + 3) return; // no band worth closing
  // Lift the strip to full strength rather than replacing it. The grain in there IS the contents
  // — the camera saw them, the label just darkened them — so scaling each row back up to the
  // plateau keeps the real texture. Copying powder in from below instead left an obvious mirrored
  // pattern, because the strip is wide enough to see the symmetry.
  for (let y = bot0 + 1; y < anchor; y++) {
    const m = rowMean(y);
    if (m <= 4) continue;
    const gain = Math.min(3.4, plateau / m);
    if (gain <= 1.02) continue;
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < 60) continue;
      // The mask fades out through here too, so take its green with it on the way up.
      const r = out[i], b = out[i + 2], avg = (r + b) * 0.5;
      const g = out[i + 1] > avg ? avg : out[i + 1];
      // Hold the gain to whatever the brightest channel can still take. out[] clamps at 255, so
      // a flat multiply pins the dominant channel while the others keep climbing, which shifts
      // the hue: blue powder at [1,60,239] scaled 3.4x pins blue at 255 and lifts green to 204,
      // turning KLOW cyan. Matching the plateau exactly matters less than the colour being right.
      const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
      const gp = mx > 0 ? Math.min(gain, 255 / mx) : gain;
      out[i] = r * gp; out[i + 1] = g * gp; out[i + 2] = b * gp;
    }
  }
}

/**
 * Find the contents cake in an untouched base photo: the row range the powder or liquid occupies.
 *
 * Measured on the decoded photograph, never on a working buffer. transmitGlass and liftContents
 * both rewrite tone inside the vial, and reading the cake's edges off a levelled-and-lifted copy
 * put its bottom edge in the wrong place.
 *
 * The cake is found by opacity: it is the only solid thing inside glass that transmits at alpha
 * ~85 everywhere else, so scanning down, the first mostly-solid row is the fill line. It ends
 * where the row's grain jumps — a lyophilized cake is evenly lit and measures about 20-30, while
 * the vial's moulded base underneath is smooth glass cut by hard highlight rings and goes past 55.
 * Brightness cannot find that edge, because the base is bright too; reading it that way painted a
 * flat band of colour across the vial's foot.
 *
 * Both readings ignore the outer `WALL` of each row. Those pixels are the thick glass wall in
 * front of and behind the contents — in the blue master, the one shot with real blue powder, the
 * colour starts 7% of the row's width in from each edge — and they are far brighter and harder
 * edged than anything inside, so they swamp the grain measurement.
 */
const WALL = 0.07;

function cakeSpans(img) {
  const { W, H, data } = img;
  const SOLID = 230;
  const fullSpan = (y) => {
    let lo = -1, hi = -1;
    for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 60) { if (lo < 0) lo = x; hi = x; }
    return lo < 0 ? null : [lo, hi];
  };
  const inner = (y) => {
    const f = fullSpan(y);
    if (!f) return null;
    const inset = Math.round((f[1] - f[0] + 1) * WALL);
    return f[1] - f[0] > 2 * inset + 2 ? [f[0] + inset, f[1] - inset] : f;
  };
  const stat = (y) => {
    const f = fullSpan(y);
    if (!f) return null;
    let n = 0, solid = 0;
    for (let x = f[0]; x <= f[1]; x++) { n++; if (data[(y * W + x) * 4 + 3] >= SOLID) solid++; }
    const frac = n ? solid / n : 0;
    const iv = inner(y);
    if (!iv) return { frac, lum: 0, sd: 0 };
    let c = 0, lum = 0;
    for (let x = iv[0]; x <= iv[1]; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < SOLID) continue;
      c++; lum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }
    if (!c) return { frac, lum: 0, sd: 0 };
    const mean = lum / c;
    let v = 0;
    for (let x = iv[0]; x <= iv[1]; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < SOLID) continue;
      const L = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      v += (L - mean) * (L - mean);
    }
    return { frac, lum: mean, sd: Math.sqrt(v / c) };
  };
  return { inner, stat };
}

function findCakeBand(img, fromY) {
  const { H } = img;
  const { stat } = cakeSpans(img);
  let top = -1;
  for (let y = Math.max(0, fromY); y < H; y++) {
    const r = stat(y);
    if (r && r.frac >= 0.6) { top = y; break; }
  }
  if (top < 0) return null;
  let grain = 0, seen = 0;
  for (let y = top; y < H && seen < 14; y++) {
    const r = stat(y);
    if (r && r.frac >= 0.6) { grain += r.sd; seen++; }
  }
  if (!seen) return null;
  grain /= seen;
  // The cake's own grain measures ~23 here and spikes to the mid-40s on the odd row; the moulded
  // base below runs 65-93. Break on a run, not on one row — a single spike inside the cake was
  // enough to cut the colour short and leave a hard line of bare white powder under it.
  const roughLimit = Math.max(58, grain * 2.6);
  const RUN = 3;
  let bot = top, rough = 0;
  for (let y = top; y < H; y++) {
    const r = stat(y);
    if (!r || r.frac < 0.6) break;
    if (r.sd > roughLimit) {
      if (++rough >= RUN) break;
    } else {
      rough = 0;
      bot = y;
    }
  }
  return bot > top + 2 ? { top, bot } : null;
}

/**
 * Colour the cake between `top` and `bot`, in place.
 *
 * Every base is photographed with white powder, so a compound's cake colour is applied here rather
 * than shot separately: one base serves every compound, there is no second master to keep
 * pixel-aligned, and a new colour costs nothing. The blue base photo this replaces sat at mean
 * luminance 133 against the white one's 200 — its highlights were crushed in the photograph, which
 * is what made it read as painted on rather than as a cake.
 *
 * Colour lands as a pivot colorize on the cake's own tones, so the grain survives: dark grains stay
 * dark, the lit crown still climbs toward white. The pivot is the 75th percentile, not the mean —
 * a cake is bright and top-heavy (mean 201, median 220), so pivoting on the mean pushes three
 * quarters of it into the tint→white half and the colour washes out.
 *
 * Runs after liftContents, so the lift scales the darkened strip on neutral powder and can never
 * pin a saturated channel — the failure that turned KLOW cyan.
 */
function cakePivot(out, img, top, bot) {
  const { W, data } = img;
  const SOLID = 230;
  const { inner } = cakeSpans(img);
  const lums = [];
  for (let y = top; y <= bot; y++) {
    const iv = inner(y);
    if (!iv) continue;
    for (let x = iv[0]; x <= iv[1]; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < SOLID) continue;
      lums.push(0.299 * out[i] + 0.587 * out[i + 1] + 0.114 * out[i + 2]);
    }
  }
  if (!lums.length) return 0;
  lums.sort((a, b) => a - b);
  return Math.max(24, Math.min(244, lums[Math.floor((lums.length - 1) * 0.75)]));
}

function tintContents(out, img, tint, top, bot, pivot) {
  if (!pivot) return;
  const { W, data } = img;
  const SOLID = 230;
  const { inner } = cakeSpans(img);
  // How far the crown may blow out. Full white reads as a bald spot on a coloured cake.
  const CROWN = 0.72;
  // How much of the cake's own tonal range to keep. A lyophilized cake is one material under even
  // light — the shading across it is slight. Mapping its full range onto black→tint→white turned
  // that slight shading into heavy dark mottling that read as textured paint rather than powder.
  // Pulling the range in toward the tint keeps the grain legible and lets the colour stay the
  // colour, which is how the vial photographed with real blue powder actually looks.
  const RELIEF = 0.5;
  const [tr, tg, tb] = tint;
  for (let y = top; y <= bot; y++) {
    const iv = inner(y);
    if (!iv) continue;
    for (let x = iv[0]; x <= iv[1]; x++) {
      const i = (y * W + x) * 4;
      if (data[i + 3] < SOLID) continue;
      const L = 0.299 * out[i] + 0.587 * out[i + 1] + 0.114 * out[i + 2];
      let t = L <= pivot ? (L / pivot) * 0.5 : 0.5 + ((L - pivot) / (255 - pivot)) * 0.5;
      t = 0.5 + (t - 0.5) * RELIEF;
      if (t <= 0.5) {
        const k = t * 2;
        out[i] = tr * k; out[i + 1] = tg * k; out[i + 2] = tb * k;
      } else {
        const k = (t - 0.5) * 2 * CROWN;
        out[i] = tr + (255 - tr) * k; out[i + 1] = tg + (255 - tg) * k; out[i + 2] = tb + (255 - tb) * k;
      }
    }
  }
}

/**
 * How each dome finish maps the base plastic's tones.
 *
 *  - `solid` paints the dome: the colour lands on its mid-tone, shadows fall to black and
 *    speculars still blow out to white.
 *  - `tint` is clear plastic with colour in it. Looking through the thin middle of the barrel
 *    you get a pale, bright, high-contrast wash; at the silhouette edge the line of sight runs
 *    the long way through the wall, so it darkens and the colour goes full strength. That
 *    bright-centre/dark-saturated-rim gradient is the whole difference between reading as glass
 *    and reading as a coat of pastel paint.
 *  - `clear` is the same optics with almost all the colour taken out: the centre is water-clear
 *    and only the rim picks any up, the way plain plastic does sitting over a coloured collar.
 *    It keeps a trace rather than none, because four fully colourless tops would all look like
 *    the same cap.
 */
const CAP_FINISH_CURVE = {
  //        contrast  centre lift  paleness  rim shade  rim colour
  solid: { contrast: 1.00, lift: 0.00, pale: 0.00, edge: 0.00, edgeSat: 0.00 },
  tint:  { contrast: 1.34, lift: 0.09, pale: 0.46, edge: 0.60, edgeSat: 0.90 },
  clear: { contrast: 1.46, lift: 0.15, pale: 0.88, edge: 0.66, edgeSat: 0.62 },
};

/**
 * Recolour the vial's metal cap — the rounded flip-top DOME and the CRIMP collar below it — to
 * two coordinated tints (an [r,g,b] each), with the dome in one of three finishes.
 *
 * Colour is applied by pivoting the material on its OWN mid-tone: below the pivot the pixel
 * ramps down to black, above it up to white, with the tint sitting exactly at the middle. This
 * replaced a flat multiply, which could only ever darken — so a white cap came out grey metal
 * and a black one crushed to a flat silhouette with no gloss left. Pivoting keeps every
 * highlight and shadow, so anodised colour, painted black and bright white all read correctly.
 *
 * The cap bottom is found by width (the crimp collar is the widest metal near the top; the
 * glass neck narrows sharply just below it), so on the slimmer 10 mL the colour does not bleed
 * onto the neck.
 */
function tintCap(out, base, domeTint, crimpTint, domeFinish = "solid") {
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
  // A pixel counts as recolourable metal/plastic: bright enough not to be a crevice, and
  // neutral enough not to be glass or already-coloured contents.
  const paintable = (i) => {
    if (data[i + 3] < 60) return false;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const mx = r > g ? (r > b ? r : b) : g > b ? g : b;
    const mn = r < g ? (r < b ? r : b) : g < b ? g : b;
    if (mx - mn > 46) return false;
    return 0.299 * r + 0.587 * g + 0.114 * b >= 42;
  };

  // Dome above, crimp collar below. The dome is matte plastic and the collar is stamped metal, so
  // the seam between them is a hard step UP in brightness — find that step rather than assuming a
  // fixed fraction of the cap. The two sit at different heights in every photo, and a fixed 0.46
  // split painted collar colour over the bottom of the dome on some bases, which is what made
  // those collars look oversized next to others.
  const capH = capBot - minY;
  const rowMean = new Float32Array(capH + 1).fill(-1);
  for (let y = minY; y <= capBot; y++) {
    const lo = rowL[y]; if (lo < 0) continue;
    let sum = 0, n = 0;
    for (let x = lo, hi = rowR[y]; x <= hi; x++) {
      const i = (y * W + x) * 4;
      if (!paintable(i)) continue;
      sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; n++;
    }
    if (n) rowMean[y - minY] = sum / n;
  }
  const band = (a, b) => {
    let sum = 0, n = 0;
    for (let k = a; k <= b; k++) { const v = rowMean[k]; if (v >= 0) { sum += v; n++; } }
    return n ? sum / n : -1;
  };
  const win = Math.max(2, Math.round(capH * 0.06));
  let domeBot = minY + Math.round(capH * 0.46), bestStep = 0;
  for (let k = Math.round(capH * 0.30); k <= Math.round(capH * 0.80); k++) {
    const above = band(k - win, k - 1), below = band(k + 1, k + win);
    if (above < 0 || below < 0) continue;
    const step = below - above;
    if (step > bestStep) { bestStep = step; domeBot = minY + k; }
  }
  // Only trust a real step. A cap photographed with no contrast between the two parts keeps the
  // old proportional split rather than snapping the seam onto noise.
  if (bestStep < 18) domeBot = minY + Math.round(capH * 0.46);

  // Where the barrel starts turning away from us — inside this the wall is effectively thin.
  const EDGE_START = 0.52;

  const paint = (y0, y1, tint, finish) => {
    const { contrast, lift, pale, edge: edgeAmt, edgeSat } = CAP_FINISH_CURVE[finish] || CAP_FINISH_CURVE.solid;
    // Pale-shift the tint toward white for the see-through finishes (at pale = 1 the colour is
    // gone entirely and `clear` becomes a plain colourless ramp).
    const paleOf = (p) => [tint[0] + (255 - tint[0]) * p, tint[1] + (255 - tint[1]) * p, tint[2] + (255 - tint[2]) * p];
    const mid = paleOf(pale);
    // Pivot on this region's own mean brightness, so the dome (matte, dark) and the collar
    // (bright metal) each land their colour on their own mid-tone instead of a global guess.
    let sum = 0, n = 0;
    for (let y = y0; y <= y1; y++) {
      const lo = rowL[y]; if (lo < 0) continue;
      for (let x = lo, hi = rowR[y]; x <= hi; x++) {
        const i = (y * W + x) * 4;
        if (!paintable(i)) continue;
        sum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; n++;
      }
    }
    if (!n) return;
    const pivot = Math.max(24, Math.min(231, sum / n));
    for (let y = y0; y <= y1; y++) {
      const lo = rowL[y]; if (lo < 0) continue;
      const hi = rowR[y];
      const half = (hi - lo) * 0.5 || 1, cx = lo + half;
      for (let x = lo; x <= hi; x++) {
        const i = (y * W + x) * 4;
        if (!paintable(i)) continue;
        const L = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        // 0 = black, 0.5 = the tint itself, 1 = blown-out white.
        let t = L <= pivot ? (L / pivot) * 0.5 : 0.5 + ((L - pivot) / (255 - pivot)) * 0.5;
        t = 0.5 + (t - 0.5) * contrast;
        let cr = mid[0], cg = mid[1], cb = mid[2];
        if (edgeAmt > 0) {
          const nx = Math.abs(x - cx) / half;
          const e = nx <= EDGE_START ? 0 : (nx - EDGE_START) / (1 - EDGE_START);
          const edge = e * e * (3 - 2 * e); // smoothstep — no hard ring where the falloff starts
          t = t * (1 - edgeAmt * edge) + lift * (1 - edge);
          if (edgeSat > 0) { const c = paleOf(pale * (1 - edgeSat * edge)); cr = c[0]; cg = c[1]; cb = c[2]; }
        } else {
          t += lift;
        }
        if (t < 0) t = 0; else if (t > 1) t = 1;
        if (t <= 0.5) {
          const k = t * 2;
          out[i] = cr * k; out[i + 1] = cg * k; out[i + 2] = cb * k;
        } else {
          const k = (t - 0.5) * 2;
          out[i] = cr + (255 - cr) * k; out[i + 1] = cg + (255 - cg) * k; out[i + 2] = cb + (255 - cb) * k;
        }
      }
    }
  };
  paint(minY, domeBot, domeTint, domeFinish);
  paint(domeBot + 1, capBot, crimpTint, "solid");
}

async function renderLabelPixels(svg, LW, LH) {
  const img = await loadImage("data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg));
  const c = document.createElement("canvas");
  c.width = LW; c.height = LH;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0, LW, LH);
  return ctx.getImageData(0, 0, LW, LH).data;
}

/**
 * Resample the label raster to the width the wrap is actually going to read it at.
 *
 * The compose loop samples the label through the cylinder mapping, and that mapping compresses:
 * on a catalog card 2.2 label columns land on each output pixel at the vial's centre, rising to
 * about 4 at the silhouette edge. Sampling one column and ignoring the rest drops most of the
 * artwork, so strokes narrower than the stride hit some output pixels and miss others at random —
 * type looks soft and crawls while spinning.
 *
 * A fixed blur cannot fix that. A symmetric box is 1, 3, 5 … columns wide, so the smallest one
 * that filters at all is 3 where 2.2 is wanted: it over-softens the middle of the label, which is
 * exactly where the words are, and still under-filters the edges. Resampling hits the rate
 * exactly. Area-averaging down to ~1.3 columns per output pixel band-limits the artwork properly
 * and leaves a little headroom for the compression toward the edges; bilinear sampling then
 * carries it the rest of the way with no stair-stepping.
 *
 * It also shrinks the cached raster — a 1800px label is far more than any of these vials can show.
 */
function resampleLabel(ld, lw, lh, targetW) {
  if (targetW >= lw) return { ld, lw };
  const out = new Uint8ClampedArray(targetW * lh * 4);
  const step = lw / targetW;
  for (let y = 0; y < lh; y++) {
    const srow = y * lw, drow = y * targetW;
    for (let x = 0; x < targetW; x++) {
      const x0 = x * step, x1 = x0 + step;
      let a = 0, b = 0, c = 0, d = 0, wsum = 0;
      for (let sx = x0 | 0; sx < x1 && sx < lw; sx++) {
        // Partial weight for the two columns the window straddles, so the filter stays exact
        // rather than snapping to whole columns.
        const wgt = Math.min(sx + 1, x1) - Math.max(sx, x0);
        if (wgt <= 0) continue;
        const i = (srow + sx) * 4;
        a += ld[i] * wgt; b += ld[i + 1] * wgt; c += ld[i + 2] * wgt; d += ld[i + 3] * wgt;
        wsum += wgt;
      }
      const o = (drow + x) * 4;
      if (wsum > 0) { out[o] = a / wsum; out[o + 1] = b / wsum; out[o + 2] = c / wsum; out[o + 3] = d / wsum; }
    }
  }
  return { ld: out, lw: targetW };
}

/**
 * Label columns that land on one output pixel at the vial's centre, for a band `bandW` wide.
 * Comes straight out of the wrap: u advances by HALF·asin((2u₀−1)·sin B)/B across the face, whose
 * slope at the centre is 2·HALF·sin B / B.
 */
const WRAP_CENTRE_SLOPE = (2 * HALF * SB) / B;

const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);

// Rotation range (in label-u space) so a drag turns the vial from its left edge/band
// across the middle to the QR side. 0 = the approved default (band + middle 60%).
export const ROT_MIN = -0.34;
export const ROT_MAX = 0.62;

/** The vial's own silhouette within a base, from its alpha. */
function alphaBox(b) {
  const { W, H, data } = b;
  let x0 = W, x1 = -1, y0 = H, y1 = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data[(y * W + x) * 4 + 3] <= 60) continue;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x1 < x0 ? null : { x0, x1, y0, y1 };
}

/**
 * Why an unlabelled twin cannot be used with this base, or "" if it can.
 *
 * The two are composited pixel for pixel — the wrap comes from one and the bare glass from the
 * other — so the vial has to be in the same place in both. A twin that is close but shifted or
 * scaled would show up as the glass stepping sideways where the label ends, which is worse than
 * not using it at all. Nothing is ever resized or nudged to make it fit: a mismatch is refused
 * and named, and the base falls back to reconstruction.
 */
function twinMismatch(base, twin) {
  if (twin.W !== base.W || twin.H !== base.H) {
    return `it is ${twin.W}x${twin.H} but its labelled twin is ${base.W}x${base.H} — the canvases must match exactly`;
  }
  const a = alphaBox(base), b = alphaBox(twin);
  if (!a) return "";
  if (!b) return "it has no vial in it — the background may have been flattened instead of cut out";
  // A pixel or two of difference is anti-aliasing on the silhouette, not a misalignment.
  const tol = Math.max(2, Math.round(base.H * 0.004));
  const dx = Math.max(Math.abs(a.x0 - b.x0), Math.abs(a.x1 - b.x1));
  const dy = Math.max(Math.abs(a.y0 - b.y0), Math.abs(a.y1 - b.y1));
  if (dx > tol || dy > tol) {
    return `its vial sits at x ${b.x0}-${b.x1}, y ${b.y0}-${b.y1} but the labelled twin's is at ` +
      `x ${a.x0}-${a.x1}, y ${a.y0}-${a.y1} (out by ${dx}px across, ${dy}px down; tolerance ${tol}px) — ` +
      `same position and scale are required, and it will not be shifted to fit`;
  }
  return "";
}

/**
 * Load the base vial + render the label once, so rotation can re-wrap without re-rendering
 * the SVG (keeps dragging/spinning smooth). Returns a prepared compositor. `ss` sets the
 * base resolution: BASE_SS (2) for the crisp still, a smaller value for the live spin.
 * Precomputes a per-column wrap LUT (`fcol`) and per-row label-row map (`rowBase`) so the
 * compose hot loop is pure array lookups.
 */
export async function prepareVialCompositor({ svg, vialMl, baseSrc, cleanSrc = "", ss = BASE_SS, capTint = null, capFinish = "solid", crimpTint = null, powderTint = null }) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const dims = silverLabelDims(ml);
  const base = await getBase(baseSrc, ss);
  // The unlabelled twin, if one is installed. It is optional on purpose: until all four are shot
  // the catalog keeps working off the reconstruction, and each one starts being used the moment
  // it lands.
  let clean = null;
  if (cleanSrc) {
    try {
      const c = await getBase(cleanSrc, ss);
      const why = twinMismatch(base, c);
      if (!why) clean = c;
      else if (typeof console !== "undefined") console.warn(`[vial] ${cleanSrc} rejected: ${why}`);
    } catch { clean = null; }
  }
  let ld = await renderLabelPixels(svg, dims.w, dims.h);
  let labelW = dims.w;

  // Preferred path: a blank green label on the base → wrap the silver label onto exactly that
  // paper, shaded by the real photo.
  const green = detectGreenLabel(base.data, base.W, base.H);
  if (green) {
    // Widest row of the green band: the label's on-screen width, and where its detail matters
    // most. detectGreenLabel reports the band per row, not as a single box.
    let bandW = 0;
    for (let y = green.top0; y <= green.bot0; y++) {
      const wRow = green.rowHi[y] - green.rowLo[y] + 1;
      if (wRow > bandW) bandW = wRow;
    }
    // Aim for one label column per output pixel at the vial's centre.
    const targetW = Math.max(200, Math.min(dims.w, Math.round((bandW - 1) / WRAP_CENTRE_SLOPE)));
    ({ ld, lw: labelW } = resampleLabel(ld, dims.w, dims.h, targetW));
    // Liquid vials (B12) fill the label band; powder vials are empty glass there. `baseGlass`
    // (the bare-glass gap shown while spinning) is built lazily on first wrap use.
    // Match the red-liquid base by its filename token (…_Red.png), not a loose "red" — a base64
    // data-URL src would otherwise false-positive (no "_" or word breaks in standard base64).
    const liquid = /_red\b|\bliquid\b/i.test(String(baseSrc));
    // No pale reverse screened into the empty body any more. It fogged exactly the area that most
    // needs to look clear, and because it was skipped on 10 mL bases it also made the 3 mL vials
    // read milkier than the 10 mL ones — the glass now matches across every size.
    const baseBack = new Uint8ClampedArray(base.data);
    transmitGlass(baseBack, base, green.top);
    liftContents(baseBack, base, green);
    // The clean twin gets the same glass levelling so the two agree wherever they meet. It needs
    // no lift: there is no label on it to have darkened anything.
    let cleanBack = null;
    if (clean) {
      cleanBack = new Uint8ClampedArray(clean.data);
      transmitGlass(cleanBack, clean, green.top);
    }
    // Colour the contents. The cake's extent is a property of the photograph, so it is measured
    // once on the untouched twin — which has no label hiding the top of it — and both buffers
    // paint that same band. Tinting runs after liftContents, never before: the lift scales the
    // darkened strip back to full strength and does that on neutral powder, so it can no longer
    // pin a saturated channel and skew the hue.
    if (powderTint) {
      const cake = findCakeBand(clean || base, clean ? green.top : green.bot0 + 1);
      if (cake) {
        // One pivot for both buffers, taken over the whole cake. Deriving it separately gave the
        // strip below the label a different mid-tone from the stretch the opening reveals, so the
        // colour stepped across the label's edge on a vial that holds one powder.
        const src2 = cleanBack || baseBack;
        const img2 = clean || base;
        const pivot = cakePivot(src2, img2, cake.top, cake.bot);
        tintContents(baseBack, base, powderTint, Math.max(cake.top, green.bot0 + 1), cake.bot, pivot);
        if (cleanBack) tintContents(cleanBack, clean, powderTint, cake.top, cake.bot, pivot);
      }
    }
    if (cleanBack && capTint) tintCap(cleanBack, clean, capTint, crimpTint || capTint, capFinish);
    // Optional cap recolour (landing showcase) — dome + crimp collar in two coordinated tints.
    if (capTint) tintCap(baseBack, base, capTint, crimpTint || capTint, capFinish);
    return { base, ld, lw: labelW, lh: dims.h, green, liquid, baseBack, cleanBack };
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
 * Where the label's curved top and bottom rims actually sit, as a smooth fractional curve.
 *
 * Two things make the raw mask a poor edge. It is a binary test on very shallow curves — the
 * bottom rim rises only ~13px across the label's whole width — so it draws as a staircase. And
 * the photographed rim is not clean: measured per column, the bottom boundary on the blue base
 * wanders over 44 rows and steps by 0.44 rows per column on average, against 0.26 at the top.
 * Averaging neighbours only blurs that wander; it stays in the result, which is what made the
 * bottom edge look torn while the top looked fine.
 *
 * So the rims are FITTED instead of followed. A vial is a cylinder photographed square-on, so
 * each rim is a shallow arc — a quadratic in x describes it exactly, and least squares over the
 * whole width ignores the noise rather than smearing it. Columns that disagree with the fit are
 * dropped and it is refitted, so a stray green speck cannot bend the curve.
 *
 * Only the top and bottom rims are fitted. The left and right edges are the vial's own
 * silhouette, already anti-aliased in the photograph.
 */
// A pixel that is unmistakably label, not the mask's fade-out into whatever is behind it.
function coreGreenPix(r, g, b) {
  return g > 90 && g > r * 1.25 && g > b * 1.25;
}

/** Least-squares quadratic through (x, y) samples, with one robust refit. Returns [a,b,c] or null. */
function fitArc(xs, ys, W) {
  const solve = (idx) => {
    let n = 0, sx = 0, sx2 = 0, sx3 = 0, sx4 = 0, sy = 0, sxy = 0, sx2y = 0;
    for (const k of idx) {
      const t = (xs[k] / W) * 2 - 1, y = ys[k]; // normalise x to [-1,1] so the normal equations stay conditioned
      const t2 = t * t;
      n++; sx += t; sx2 += t2; sx3 += t2 * t; sx4 += t2 * t2;
      sy += y; sxy += t * y; sx2y += t2 * y;
    }
    if (n < 12) return null;
    // 3x3 Cramer
    const m = [[n, sx, sx2], [sx, sx2, sx3], [sx2, sx3, sx4]];
    const d = m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1])
            - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0])
            + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
    if (!isFinite(d) || Math.abs(d) < 1e-9) return null;
    const col = (j, v) => m.map((row, i) => row.map((val, k2) => (k2 === j ? v[i] : val)));
    const det3 = (q) => q[0][0] * (q[1][1] * q[2][2] - q[1][2] * q[2][1])
                      - q[0][1] * (q[1][0] * q[2][2] - q[1][2] * q[2][0])
                      + q[0][2] * (q[1][0] * q[2][1] - q[1][1] * q[2][0]);
    const v = [sy, sxy, sx2y];
    return [det3(col(0, v)) / d, det3(col(1, v)) / d, det3(col(2, v)) / d];
  };
  const all = xs.map((_, k) => k);
  let c = solve(all);
  if (!c) return null;
  const at = (k) => { const t = (xs[k] / W) * 2 - 1; return c[0] + c[1] * t + c[2] * t * t; };
  const res = all.map((k) => Math.abs(ys[k] - at(k))).sort((a, b) => a - b);
  const mad = Math.max(0.75, res[res.length >> 1]);
  const keep = all.filter((k) => Math.abs(ys[k] - at(k)) <= mad * 2.5);
  return solve(keep) || c;
}

function buildEdgeCoverage(base, green) {
  const { W, data } = base;
  const { rowLo, rowHi, top, bot } = green;
  const xs = [], tops = [], bots = [];
  for (let x = 0; x < W; x++) {
    let first = -1, last = -1;
    for (let y = top; y <= bot; y++) {
      const lo = rowLo[y];
      if (lo < 0 || x < lo || x > rowHi[y]) continue;
      const i = (y * W + x) * 4;
      if (!coreGreenPix(data[i], data[i + 1], data[i + 2])) continue;
      if (first < 0) first = y;
      last = y;
    }
    if (first >= 0) { xs.push(x); tops.push(first); bots.push(last); }
  }
  const sTop = new Float32Array(W).fill(-1);
  const sBot = new Float32Array(W).fill(-1);
  if (!xs.length) return { sTop, sBot };
  const ct = fitArc(xs, tops, W), cb = fitArc(xs, bots, W);
  for (let k = 0; k < xs.length; k++) {
    const x = xs[k], t = (x / W) * 2 - 1;
    sTop[x] = ct ? ct[0] + ct[1] * t + ct[2] * t * t : tops[k];
    sBot[x] = cb ? cb[0] + cb[1] * t + cb[2] * t * t : bots[k];
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
  // With an unlabelled twin installed there is nothing to reconstruct: the uncovered stretch is
  // the real vial's own pixels. The reconstruction only runs as a fallback for bases that have no
  // twin yet.
  if (wrap && !prepared.cleanBack && !prepared.baseGlass) {
    prepared.baseGlass = buildBaseGlass(base, green, prepared.liquid, prepared.baseBack);
  }
  const bare = prepared.cleanBack || prepared.baseGlass;
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
    // How much of the far side of the wrap is visible on this row: nothing past its top and
    // bottom edges, easing in over FAR_FEATHER so those edges do not draw a line across the
    // opening.
    const fEdge = Math.min(lyf, (lh - 1) - lyf) / Math.max(1, (lh - 1) * FAR_FEATHER);
    const fFade = fEdge <= 0 ? 0 : fEdge >= 1 ? 1 : fEdge * fEdge * (3 - 2 * fEdge);
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
        if (cov <= 0) {
          // Past the label's own edge the photo still carries the mask's soft green rim — about
          // 30 rows of it. That is the mask fading out, not paper; printing label onto it is what
          // made the bottom edge look torn. What the label was covering reads through instead.
          if (y < te && bare) {
            // ABOVE the label that is clear glass, so show the glass — not a desaturated version
            // of the mask. Taking the green out of these rows left a flat grey band between the
            // vial's real glass and the opening, reading as a second panel above the first.
            // baseGlass covers these rows and continues from the stock just above them, so the
            // shoulder now runs straight into the opening.
            out[i] = bare[i]; out[i + 1] = bare[i + 1]; out[i + 2] = bare[i + 2];
            continue;
          }
          // BELOW it the contents read through. Take the green out and keep the PREPARED base so
          // the lift applied at prepare time survives instead of reverting to the raw photo.
          const br = init[i], bb = init[i + 2], avg = (br + bb) * 0.5;
          out[i] = br;
          out[i + 1] = init[i + 1] > avg ? avg : init[i + 1];
          out[i + 2] = bb;
          continue;
        }
        if (cov > 1) cov = 1;
      }
      const uo = (x - lo) * invW;
      const dOff = ASIN_LUT[(uo * LN) | 0]; // this column's offset around the cylinder
      let u = UC + rr + dOff;
      if (wrap) {
        u -= Math.floor(u / T) * T; // wrap around the full strip (label + gap)
        if (u >= 1) {
          // No label here. The wrap is stuck to the outside of the glass and across this stretch
          // of the circumference there is simply none of it — nothing is applied, so what shows is
          // the vial's own bare glass, continuous with the rest of the bottle.
          //
          // With an unlabelled twin installed `bare` IS that vial, untouched: the glass here is
          // the pixels the camera saw, not an approximation of them. Without one it falls back to
          // the reconstruction. Either way it is used as-is — no shading, no panel, no contents
          // lifted into it. The powder sits where it physically sits, the same height right across
          // the vial.
          let gr = bare[i], gg = bare[i + 1], gb = bare[i + 2];
          // Glass is transparent, so the far side of the wrap is faintly there behind it — as it
          // is on a real vial, and as the reference shows. Mirroring this column's offset about
          // the half-turn finds where that side sits on the label, which is why the artwork comes
          // back the wrong way round. Kept deliberately faint: enough to register something behind
          // the glass, never enough to read as a second label or as a panel in front of it.
          const ub0 = UC + rr + T * 0.5 - dOff;
          if (fFade > 0) {
            // Smear the sample across the glass's curvature rather than reading one point, and
            // widen it toward the silhouette where the path through the glass is longest.
            const nx = Math.abs(x - (lo + hi) * 0.5) / Math.max(1, (hi - lo) * 0.5);
            const spread = FAR_BLUR * (0.6 + 1.6 * nx * nx);
            // Three taps, not five. Five put the worst frames at 16.6 ms against a 16.7 ms budget,
            // and this runs per pixel across the opening; three at a wider spread smears the same
            // amount for a third less work.
            let pr = 0, pg = 0, pb = 0, hit = 0;
            for (let k = 0; k < 3; k++) {
              let uu = ub0 + (k * 0.5 - 0.5) * spread;
              uu -= Math.floor(uu / T) * T;
              if (uu >= 1) continue; // this ray misses the wrap entirely and sees straight out
              const bi = (rb + ((uu * lwm) | 0)) * 4;
              const ba = ld[bi + 3] / 255, ip = PAPER * (1 - ba);
              pr += ld[bi] * ba + ip; pg += ld[bi + 1] * ba + ip; pb += ld[bi + 2] * ba + ip;
              hit++;
            }
            if (hit) {
              // How dark the far side is at this point RELATIVE TO ITS OWN PAPER. Blank paper
              // gives 1 and changes nothing; only printed areas come through.
              const t2 = (0.299 * pr + 0.587 * pg + 0.114 * pb) / (hit * PAPER);
              // Rays that missed the wrap saw straight out and carry no ink, so a partly covered
              // column eases off on its own.
              const k = 1 - FAR_INK * fFade * (hit / 3) * (1 - (t2 > 1 ? 1 : t2));
              gr *= k; gg *= k; gb *= k;
            }
          }
          if (cov >= 1) { out[i] = gr; out[i + 1] = gg; out[i + 2] = gb; }
          else {
            const br = init[i], bb = init[i + 2], ba2 = (br + bb) * 0.5;
            const bg2 = init[i + 1] > ba2 ? ba2 : init[i + 1];
            out[i] = br + (gr - br) * cov;
            out[i + 1] = bg2 + (gg - bg2) * cov;
            out[i + 2] = bb + (gb - bb) * cov;
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
      // The label's two cut ends stand a hair off the glass, so they catch a line of light along
      // the fold. Without it the ends read as printed onto the vial instead of wrapped around it.
      const eu = u < 0.5 ? u : 1 - u;
      if (eu < LABEL_EDGE_W) { const t2 = 1 - eu / LABEL_EDGE_W; sh *= 1 + LABEL_EDGE_LIFT * t2 * t2; }
      const pr = (ld[li] * la + ia) * sh;
      const pg = (ld[li + 1] * la + ia) * sh;
      const pb = (ld[li + 2] * la + ia) * sh;
      if (cov >= 1) {
        out[i] = clamp(pr); out[i + 1] = clamp(pg); out[i + 2] = clamp(pb);
      } else {
        // The rim pixel is the label fading into what is behind it, and what is behind it is
        // still the mask's green. Blending straight into that is what left a green hairline along
        // the label's top and bottom edges — a few hundred pixels, but a visible line. De-green
        // the backdrop first and the label fades into the contents instead.
        const br = init[i], bb = init[i + 2], ba2 = (br + bb) * 0.5;
        const bg2 = init[i + 1] > ba2 ? ba2 : init[i + 1];
        out[i] = clamp(br + (pr - br) * cov);
        out[i + 1] = clamp(bg2 + (pg - bg2) * cov);
        out[i + 2] = clamp(bb + (pb - bb) * cov);
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
export async function prepareVialScene({ svg, vialMl, baseSrc, cleanSrc = "", sceneSrc, ss = BASE_SS, maxOut = 0, capTint = null, capFinish = "solid", crimpTint = null, powderTint = null }) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  const prepared = await prepareVialCompositor({ svg, vialMl: ml, baseSrc, cleanSrc, ss, capTint, capFinish, crimpTint, powderTint });
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
  const H3 = 0.62, TEN_ML_SCALE = 1.13, GLASS_ASPECT_3ML = 0.4472; // 3 mL white base glass: 373×834
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
export async function drawVialScene(canvas, { svg, vialMl, baseSrc, cleanSrc = "", sceneSrc, rot = 0, ss, maxOut = 0, capTint = null, capFinish = "solid", crimpTint = null, powderTint = null }) {
  const state = await prepareVialScene({ svg, vialMl, baseSrc, cleanSrc, sceneSrc, ...(ss ? { ss } : {}), maxOut, capTint, capFinish, crimpTint, powderTint });
  return paintVialScene(canvas, state, rot, { wrap: rot !== 0 });
}
