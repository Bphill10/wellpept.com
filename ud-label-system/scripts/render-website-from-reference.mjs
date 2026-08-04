/**
 * Website vial renderer — content replace on locked labeled website references.
 *
 * NEVER stretches the flat Niimbot print SVG onto a vial.
 * NEVER rebuilds the website label with HTML/CSS layout.
 *
 * White powder products: edit text/QR on the locked labeled website reference.
 * Blue / B12: edit on the matching labeled reference, then transfer only the
 * label paper (difference mask vs unlabeled white) onto the target stock.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { resolveLabelDisplayName } from "./resolve-label-display-name.mjs";

const require = createRequire(import.meta.url);
const QRCode = require("qrcode");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

const placement = JSON.parse(
  await fs.readFile(
    path.join(root, "config", "website-reference-placement.json"),
    "utf8"
  )
);

const CANVAS_W = placement.canvas.widthPx;
const CANVAS_H = placement.canvas.heightPx;

function xml(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function bool(v, fallback = false) {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return /^(true|yes|1|on)$/i.test(v.trim());
  return fallback;
}

export function resolveWebsiteProfileName(product = {}) {
  const name = String(product.labelName || product.fullProductName || "").toUpperCase();
  const material = String(product.materialColor || product.visualType || "").toUpperCase();
  const contents = String(product.contentsType || "").toUpperCase();
  const explicit = String(product.placementProfile || "").toUpperCase();
  const isB12 =
    (/\bB12\b/.test(name) || name.includes("METHYLCOBALAMIN")) &&
    !name.includes("LIPO") &&
    !name.includes("MIC");
  if (explicit && placement.profiles[explicit]) return explicit;
  if (isB12 || (contents === "LIQUID" && isB12)) return "10ML_B12_LIQUID";
  if (Number(product.vialMl) >= 8) return "10ML_WHITE";
  if (material.includes("BLUE") || /\bKLOW\b|\bGLOW\b|GHK-?CU|AHK-?CU/.test(name)) {
    return "3ML_BLUE";
  }
  return "3ML_WHITE";
}

async function buildQrPng(value, size) {
  const png = await QRCode.toBuffer(String(value || "UD"), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: size,
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  return sharp(png)
    .resize(size, size, { fit: "fill", kernel: "nearest" })
    .png()
    .toBuffer();
}

/** Sample median-ish paper white inside a clear box on the labeled canvas. */
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
      if (v > 190) samples.push([data[i], data[i + 1], data[i + 2]]);
    }
  }
  if (!samples.length) return [245, 245, 245];
  samples.sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  return samples[Math.floor(samples.length / 2)];
}

function fillRect(data, W, H, C, box, rgb) {
  const x0 = Math.max(0, Math.floor(box.x));
  const y0 = Math.max(0, Math.floor(box.y));
  const x1 = Math.min(W, Math.ceil(box.x + box.w));
  const y1 = Math.min(H, Math.ceil(box.y + box.h));
  for (let y = y0; y < y1; y += 1) {
    for (let x = x0; x < x1; x += 1) {
      const i = (y * W + x) * C;
      data[i] = rgb[0];
      data[i + 1] = rgb[1];
      data[i + 2] = rgb[2];
      if (C === 4) data[i + 3] = 255;
    }
  }
}

/**
 * Clear editable slots on the full labeled reference and redraw fields.
 * Coordinates in profile.fields are relative to the label face; convert with left/top.
 */
async function editLabeledReference(profile, product, defaults = {}) {
  const refRel = placement.references[profile.sizeKey];
  const refAbs = path.join(root, refRel);
  const { data, info } = await sharp(refAbs)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const C = info.channels;
  if (W !== CANVAS_W || H !== CANVAS_H) {
    throw new Error(`Labeled reference must be ${CANVAS_W}x${CANVAS_H}, got ${W}x${H}`);
  }

  const L = profile.left;
  const T = profile.top;
  const f = profile.fields;
  const bar = profile.amountBar;
  const qr = profile.qr;

  const toAbs = (box) => ({
    x: L + box.x,
    y: T + box.y,
    w: box.w,
    h: box.h,
  });

  const paperBoxes = [
    toAbs(f.header.clear),
    toAbs(f.name.clear),
    toAbs(f.form.clear),
    toAbs(f.storage.clear),
    toAbs(f.legal1.clear),
  ];
  // Opaque paper fill in editable slots — only way to fully kill TA-1 / NAD+ ghosts.
  for (const box of paperBoxes) {
    const sampled = samplePaperColor(data, W, H, C, box);
    // Prefer true paper white; fall back to a clean plate if sample is dirty
    const rgb =
      sampled[0] + sampled[1] + sampled[2] > 600
        ? sampled
        : [242, 242, 242];
    fillRect(data, W, H, C, box, rgb);
  }

  // Amount bar interior: solid black plate, then redraw amount text
  fillRect(
    data,
    W,
    H,
    C,
    toAbs({
      x: bar.x + 6,
      y: bar.y + 6,
      w: bar.w - 12,
      h: bar.h - 12,
    }),
    [0, 0, 0]
  );

  const peptide = resolveLabelDisplayName(product, {
    fontSize: f.name.fontSize,
    maxWidth: Math.round((profile.dividerX - profile.railRight) * 0.92),
  });
  const amount = String(product.amount ?? "");
  const unit = String(product.unit ?? "MG").toUpperCase();
  const header = String(
    product.headerCompanyName ?? defaults.HEADER_COMPANY_NAME ?? "UNDISCLOSED"
  ).toUpperCase();
  const form = String(
    product.formText ?? defaults.FORM_TEXT ?? "LYOPHILIZED POWDER"
  ).toUpperCase();
  const storagePrefix = String(defaults.STORAGE_PREFIX ?? "STORE AT");
  const storageTemp = String(
    product.storageTemp ?? defaults.STORAGE_TEMP ?? "36–46°F"
  );
  const storage = `${storagePrefix} ${storageTemp}`.toUpperCase();
  const legal1 = String(product.legalLine1 ?? defaults.LEGAL_LINE_1 ?? "RESEARCH USE");
  const legal2 = String(product.legalLine2 ?? defaults.LEGAL_LINE_2 ?? "NOT FOR HUMAN");
  const legal3 = String(product.legalLine3 ?? defaults.LEGAL_LINE_3 ?? "CONSUMPTION");
  const qrEnabled = bool(product.qrEnabled, bool(defaults.QR_ENABLED, true));
  const fullName = String(product.labelName ?? "PEPTIDE").toUpperCase();
  const qrValue = String(
    product.qrUrlOverride ||
      product.qrValue ||
      `UD|${fullName}|${amount}${unit}|${String(product.labelType || "CATALOG").toUpperCase()}`
  );

  const textSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <text x="${L + f.header.cx}" y="${T + f.header.baseline}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${f.header.fontSize}" font-weight="800"
    fill="#000">— ${xml(header)} —</text>
  <text x="${L + f.name.cx}" y="${T + f.name.baseline}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${f.name.fontSize}" font-weight="800"
    fill="#000">${xml(peptide)}</text>
  <text x="${L + f.amount.cx}" y="${T + f.amount.baseline}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${f.amount.fontSize}" font-weight="800"
    fill="#fff">${xml(amount)} <tspan font-size="${f.amount.unitSize}">${xml(unit)}</tspan></text>
  <text x="${L + f.form.cx}" y="${T + f.form.baseline}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${f.form.fontSize}" font-weight="800"
    fill="#000">${xml(form)}</text>
  <text x="${L + f.storage.cx}" y="${T + f.storage.baseline}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${f.storage.fontSize}" font-weight="800"
    fill="#000">${xml(storage)}</text>
  <text x="${L + f.legal1.cx}" y="${T + f.legal1.baseline}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${f.legal1.fontSize}" font-weight="800"
    fill="#000">${xml(legal1)}</text>
  <text x="${L + f.legal2.cx}" y="${T + f.legal2.baseline}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${f.legal2.fontSize}" font-weight="800"
    fill="#000">${xml(legal2)}</text>
  <text x="${L + f.legal3.cx}" y="${T + f.legal3.baseline}" text-anchor="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${f.legal3.fontSize}" font-weight="800"
    fill="#000">${xml(legal3)}</text>
</svg>`;

  let edited = await sharp(data, { raw: { width: W, height: H, channels: C } })
    .composite([{ input: Buffer.from(textSvg), blend: "over" }])
    .png()
    .toBuffer();

  if (qrEnabled && qr?.size) {
    const pad = 6;
    const inner = Math.max(16, qr.size - pad * 2);
    const qrPng = await buildQrPng(qrValue, inner);
    const plate = await sharp({
      create: {
        width: qr.size - 4,
        height: qr.size - 4,
        channels: 3,
        background: "#ffffff",
      },
    })
      .png()
      .toBuffer();
    edited = await sharp(edited)
      .composite([
        { input: plate, left: L + qr.x + 2, top: T + qr.y + 2 },
        {
          input: qrPng,
          left: L + qr.x + Math.round((qr.size - inner) / 2),
          top: T + qr.y + Math.round((qr.size - inner) / 2),
        },
      ])
      .png()
      .toBuffer();
  }

  return { edited, peptide };
}

/**
 * Flood-fill label paper silhouette on the face crop, then composite onto target stock.
 * Excludes powder/glass below the paper edge so B12 stays liquid-only.
 */
async function transferLabelOntoStock(editedPng, profile) {
  const stockAbs = path.join(root, profile.unlabeled);
  const L = profile.left;
  const T = profile.top;
  const faceW = profile.width;
  const faceH = profile.height;
  // Cut above powder bleed; measured paper edge minus safety
  const paperBottom = Math.min(
    faceH,
    Math.max(8, (Number(profile.paperBottom) || faceH) - 10)
  );

  const face = await sharp(editedPng)
    .extract({ left: L, top: T, width: faceW, height: faceH })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const W = face.info.width;
  const H = face.info.height;
  const C = 4;
  const src = face.data;
  const alpha = Buffer.alloc(W * H, 0);

  const isLabelPixel = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= paperBottom) return false;
    const i = (y * W + x) * C;
    const r = src[i];
    const g = src[i + 1];
    const b = src[i + 2];
    const v = (r + g + b) / 3;
    const sat = Math.max(r, g, b) - Math.min(r, g, b);
    if (x < profile.railRight && v < 70) return true; // rail
    if (v < 80 && sat < 30) return true; // ink / bar / divider / QR
    // Paper only — never treat textured cake (high local contrast) as paper near bottom
    if (v > 188 && sat < 28) {
      if (y > paperBottom * 0.78) {
        // near bottom edge: require neighborhood to look flat paper, not cake
        let spread = 0;
        let count = 0;
        for (let dy = -2; dy <= 2; dy += 2) {
          for (let dx = -2; dx <= 2; dx += 2) {
            const xx = x + dx;
            const yy = y + dy;
            if (xx < 0 || yy < 0 || xx >= W || yy >= paperBottom) continue;
            const j = (yy * W + xx) * C;
            const vv = (src[j] + src[j + 1] + src[j + 2]) / 3;
            spread += Math.abs(vv - v);
            count += 1;
          }
        }
        if (count && spread / count > 18) return false;
      }
      return true;
    }
    if (v > 140 && v < 188 && sat < 25 && y < paperBottom * 0.75) return true;
    return false;
  };

  // Seed inside known paper (center column, upper half)
  const stack = [];
  const seedX = Math.round((profile.railRight + profile.dividerX) / 2);
  const seedY = Math.round(paperBottom * 0.35);
  for (let dy = -20; dy <= 20; dy += 4) {
    for (let dx = -30; dx <= 30; dx += 4) {
      const x = seedX + dx;
      const y = seedY + dy;
      if (isLabelPixel(x, y)) stack.push([x, y]);
    }
  }
  // Also seed rail
  for (let y = 10; y < paperBottom - 10; y += 6) {
    stack.push([Math.max(2, Math.floor(profile.railRight / 2)), y]);
  }

  while (stack.length) {
    const [x, y] = stack.pop();
    const idx = y * W + x;
    if (alpha[idx]) continue;
    if (!isLabelPixel(x, y)) continue;
    alpha[idx] = 255;
    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  // Hard-cut anything at/below paper bottom
  for (let y = paperBottom; y < H; y += 1) {
    alpha.fill(0, y * W, y * W + W);
  }

  // Apply alpha to face pixels
  const rgba = Buffer.from(src);
  for (let i = 0; i < W * H; i += 1) {
    rgba[i * C + 3] = alpha[i];
  }
  const facePng = await sharp(rgba, {
    raw: { width: W, height: H, channels: C },
  })
    .png()
    .toBuffer();

  return sharp(stockAbs)
    .composite([{ input: facePng, left: L, top: T }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * Render one website vial at locked 1024×1536 (2:3). Uniform only afterward.
 */
export async function renderWebsiteVialFromReference(
  product = {},
  defaults = {},
  { outputPath = null, alsoSaveFullPng = null } = {}
) {
  const profileName = resolveWebsiteProfileName(product);
  const profile = placement.profiles[profileName];
  if (!profile) throw new Error(`Unknown website profile ${profileName}`);

  const { edited, peptide } = await editLabeledReference(profile, product, defaults);

  // Always transfer onto locked unlabeled stock so white/blue geometry stays pixel-identical
  const full = await transferLabelOntoStock(edited, profile);

  const meta = await sharp(full).metadata();
  if (meta.width !== CANVAS_W || meta.height !== CANVAS_H) {
    throw new Error(`Canvas must stay ${CANVAS_W}x${CANVAS_H}, got ${meta.width}x${meta.height}`);
  }

  if (outputPath) {
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await sharp(full).webp({ quality: 88, effort: 4 }).toFile(outputPath);
  }
  if (alsoSaveFullPng) {
    await fs.mkdir(path.dirname(alsoSaveFullPng), { recursive: true });
    await fs.writeFile(alsoSaveFullPng, full);
  }

  return { full, profileName, peptide, profile };
}
