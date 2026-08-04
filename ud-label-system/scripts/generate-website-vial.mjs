/**
 * Single build-time Undisclosed website vial generator.
 *
 * - Starts from locked 1024×1536 vial / labeled website masters
 * - Preserves vial + powder pixels outside editable text boxes
 * - Replaces only PRODUCT_NAME + TOTAL_AMOUNT (+ unit) for catalog proofs
 * - Never stretches flat 40×20 / 50×30 print SVGs onto the vial
 * - Never uses textLength, lengthAdjust, scaleX/scaleY, object-fit fill
 *
 * Current CLI: RETA 10 MG 3 mL white powder only (stop for approval).
 *
 * Usage: node scripts/generate-website-vial.mjs
 * Out:   ../public/ud-labels/website/RETA_10MG_3mL.png
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(root, "..");

const CANVAS_W = 1024;
const CANVAS_H = 1536;

const PATHS = {
  labeledRef: path.join(
    root,
    "locked-masters/reference/3mL_Labeled_Website_Reference.png"
  ),
  unlabeled: path.join(
    root,
    "locked-masters/vials/01_3mL_White_Powder_LOCKED.png"
  ),
  outPng: path.join(repoRoot, "public/ud-labels/website/RETA_10MG_3mL.png"),
  outProof: path.join(repoRoot, "tmp-proof-RETA_10mg_3mL-web.png"),
};

/** Fixed native label face on the labeled website reference. */
const FACE = {
  left: 205,
  top: 707,
  width: 526,
  height: 512,
  amountBar: { x: 56, y: 213, w: 352, h: 88 },
  name: {
    cx: 236,
    baseline: 168,
    fontSize: 54,
    // Tight clear so we do not leave a flat gray band across the panel
    clear: { x: 70, y: 118, w: 330, h: 62 },
  },
  amount: { cx: 232, baseline: 274, fontSize: 56 },
};

const PRODUCT = {
  displayName: "RETA",
  amountLine: "10 MG",
};

function xml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function samplePaperColor(data, W, H, C, box) {
  const samples = [];
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(W, Math.ceil(box.x + box.w));
  const y1 = Math.min(H, Math.ceil(box.y + box.h));
  for (let y = y0; y < y1; y += 2) {
    for (let x = x0; x < x1; x += 2) {
      const i = (y * W + x) * C;
      const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
      if (v > 200) samples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  if (!samples.length) return [248, 248, 248];
  samples.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  return samples[Math.floor(samples.length / 2)];
}

function fillRect(data, W, H, C, box, rgb) {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(W, Math.ceil(box.x + box.w));
  const y1 = Math.min(H, Math.ceil(box.y + box.h));
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * W + x) * C;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
      if (C === 4) data[i + 3] = 255;
    }
  }
}

async function renderReta() {
  const { left: L, top: T, width: W, height: H } = FACE;

  // White-powder catalog: edit labeled website reference in place so vial /
  // powder / rail / QR / mascot stay pixel-identical outside text clears.
  const face = await sharp(PATHS.labeledRef)
    .extract({ left: L, top: T, width: W, height: H })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = face;
  const C = info.channels;
  // Use pure paper white — mid-gray fills read as a strip under studio lighting.
  fillRect(data, info.width, info.height, C, FACE.name.clear, [255, 255, 255]);
  fillRect(data, info.width, info.height, C, FACE.amountBar, [0, 0, 0]);

  const clearedFace = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: C },
  })
    .png()
    .toBuffer();

  const textSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
  <text x="${FACE.name.cx}" y="${FACE.name.baseline}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${FACE.name.fontSize}"
    font-weight="800" fill="#000000">${xml(PRODUCT.displayName)}</text>
  <text x="${FACE.amount.cx}" y="${FACE.amount.baseline}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${FACE.amount.fontSize}"
    font-weight="800" fill="#FFFFFF">${xml(PRODUCT.amountLine)}</text>
</svg>`);

  const textPng = await sharp(textSvg, { density: 72 }).png().toBuffer();
  const editedFace = await sharp(clearedFace)
    .composite([{ input: textPng, blend: "over" }])
    .png()
    .toBuffer();

  const result = await sharp(PATHS.labeledRef)
    .removeAlpha()
    .composite([{ input: editedFace, left: L, top: T }])
    .png()
    .toBuffer();

  const meta = await sharp(result).metadata();
  if (meta.width !== CANVAS_W || meta.height !== CANVAS_H) {
    throw new Error(
      `Canvas must be ${CANVAS_W}x${CANVAS_H}, got ${meta.width}x${meta.height}`
    );
  }

  // Outside editable boxes must match labeled reference (vial/powder locked).
  const [outRaw, refRaw] = await Promise.all([
    sharp(result).raw().toBuffer({ resolveWithObject: true }),
    sharp(PATHS.labeledRef).removeAlpha().raw().toBuffer({ resolveWithObject: true }),
  ]);
  const ch = outRaw.info.channels;
  let changed = 0;
  let total = 0;
  const nameClear = FACE.name.clear;
  const bar = FACE.amountBar;
  for (let y = 0; y < CANVAS_H; y++) {
    for (let x = 0; x < CANVAS_W; x++) {
      const fx = x - L;
      const fy = y - T;
      const inFace = fx >= 0 && fy >= 0 && fx < W && fy < H;
      const inName =
        inFace &&
        fx >= nameClear.x &&
        fx < nameClear.x + nameClear.w &&
        fy >= nameClear.y &&
        fy < nameClear.y + nameClear.h;
      const inBar =
        inFace &&
        fx >= bar.x &&
        fx < bar.x + bar.w &&
        fy >= bar.y &&
        fy < bar.y + bar.h;
      if (inName || inBar) continue;
      total++;
      const i = (y * CANVAS_W + x) * ch;
      const d =
        Math.abs(outRaw.data[i] - refRaw.data[i]) +
        Math.abs(outRaw.data[i + 1] - refRaw.data[i + 1]) +
        Math.abs(outRaw.data[i + 2] - refRaw.data[i + 2]);
      if (d > 2) changed++;
    }
  }

  await fs.mkdir(path.dirname(PATHS.outPng), { recursive: true });
  await fs.writeFile(PATHS.outPng, result);
  await fs.writeFile(PATHS.outProof, result);

  return {
    ok: true,
    product: PRODUCT.displayName,
    amount: PRODUCT.amountLine,
    vial: "3 mL white powder",
    canvas: `${meta.width}x${meta.height}`,
    outsideEditableDiffPct: Number(((100 * changed) / total).toFixed(4)),
    out: PATHS.outPng,
    proof: PATHS.outProof,
  };
}

const report = await renderReta();
console.log(JSON.stringify(report, null, 2));
if (report.outsideEditableDiffPct > 0.05) {
  console.error("FAIL: vial/powder pixels changed outside editable boxes");
  process.exit(1);
}
