/**
 * Copy Blender vial-studio plates into locked masters and production assets,
 * then write measured straight-body bounds into config/vial-placement.json.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(systemRoot, "..");
const outputDir = path.join(scriptDir, "output");
const placementPath = path.join(systemRoot, "config/vial-placement.json");

const PLATES = [
  {
    file: "01_3mL_White_Powder_LOCKED.png",
    locked: "locked-masters/vials/01_3mL_White_Powder_LOCKED.png",
    assets: ["assets/vials/UD_3mL_White_Peptide_Black_Cap_Unlabeled.png"],
    publicName: "UD_3mL_White_Peptide_Black_Cap_Unlabeled.png",
    profiles: ["3ML_WHITE"],
  },
  {
    file: "02_3mL_Cobalt_Blue_Powder_LOCKED.png",
    locked: "locked-masters/vials/02_3mL_Cobalt_Blue_Powder_LOCKED.png",
    assets: ["assets/vials/UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png"],
    publicName: "UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png",
    profiles: ["3ML_BLUE"],
  },
  {
    file: "03_10mL_White_Powder_LOCKED.png",
    locked: "locked-masters/vials/03_10mL_White_Powder_LOCKED.png",
    assets: ["assets/vials/UD_10mL_White_Peptide_Black_Cap_Unlabeled.png"],
    publicName: "UD_10mL_White_Peptide_Black_Cap_Unlabeled.png",
    profiles: ["10ML_WHITE"],
  },
  {
    file: "04_10mL_B12_Ruby_Red_Liquid_75pct_LOCKED.png",
    locked: "locked-masters/vials/04_10mL_B12_Ruby_Red_Liquid_75pct_LOCKED.png",
    assets: [
      "assets/vials/UD_10mL_B12_Red_Liquid_Black_Cap_Unlabeled.png",
      "assets/vials/UD_10mL_Red_Liquid_75pct_Black_Cap_Unlabeled.png",
    ],
    publicName: "UD_10mL_B12_Red_Liquid_Black_Cap_Unlabeled.png",
    extraPublic: ["UD_10mL_Red_Liquid_75pct_Black_Cap_Unlabeled.png"],
    profiles: ["10ML_B12_LIQUID"],
  },
];

async function measureStraightBody(filePath) {
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const luminance = (i) =>
    0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];

  const rowWidth = (y, threshold) => {
    let left = width;
    let right = 0;
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * channels;
      if (luminance(i) > threshold) {
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
    return right >= left ? { left, right, span: right - left } : null;
  };

  const samples = [];
  for (let y = Math.round(height * 0.28); y < Math.round(height * 0.88); y += 1) {
    const row = rowWidth(y, 8);
    if (row && row.span > width * 0.28) samples.push({ y, ...row });
  }
  if (samples.length < 20) {
    throw new Error(`Could not find a straight glass body in ${filePath}`);
  }

  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  };
  const target = median(samples.map((row) => row.span));
  const straight = samples.filter((row) => Math.abs(row.span - target) <= target * 0.045);
  if (straight.length < 10) {
    throw new Error(`Straight-body band too short in ${filePath}`);
  }

  return {
    left: Math.min(...straight.map((row) => row.left)),
    right: Math.max(...straight.map((row) => row.right)) + 1,
    top: straight[0].y,
    bottom: straight[straight.length - 1].y + 1,
    width,
    height,
  };
}

async function copyPng(fromPath, toPath) {
  const meta = await sharp(fromPath).metadata();
  if (meta.width !== 1024 || meta.height !== 1536) {
    throw new Error(
      `${fromPath} is ${meta.width}x${meta.height}; expected 1024x1536 final plates (not previews)`
    );
  }
  await fs.mkdir(path.dirname(toPath), { recursive: true });
  const png = await sharp(fromPath)
    .removeAlpha()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();
  await fs.writeFile(toPath, png);
  return crypto.createHash("sha256").update(png).digest("hex");
}

const placement = JSON.parse(await fs.readFile(placementPath, "utf8"));
const report = [];

for (const plate of PLATES) {
  const source = path.join(outputDir, plate.file);
  await fs.access(source);
  const bounds = await measureStraightBody(source);
  const lockedPath = path.join(systemRoot, plate.locked);
  const hash = await copyPng(source, lockedPath);
  for (const rel of plate.assets) {
    await copyPng(source, path.join(systemRoot, rel));
  }
  const publicDir = path.join(repoRoot, "public/ud-labels/vials");
  await copyPng(source, path.join(publicDir, plate.publicName));
  for (const extra of plate.extraPublic || []) {
    await copyPng(source, path.join(publicDir, extra));
  }
  for (const name of plate.profiles) {
    placement.profiles[name].bodyBoundsPx = {
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
      bottom: bounds.bottom,
    };
    placement.profiles[name].baseAsset = plate.locked;
  }
  report.push({
    file: plate.file,
    hash,
    bodyBoundsPx: placement.profiles[plate.profiles[0]].bodyBoundsPx,
  });
}

placement.generatedBy = "ud-label-system/blender";
await fs.writeFile(placementPath, `${JSON.stringify(placement, null, 2)}\n`);
const published = {
  version: 1,
  renderer: "blender-cycles",
  canvas: { widthPx: 1024, heightPx: 1536 },
  plates: report,
};
await fs.writeFile(
  path.join(systemRoot, "blender/PUBLISHED.json"),
  `${JSON.stringify(published, null, 2)}\n`
);
console.log(JSON.stringify({ ok: true, plates: report }, null, 2));
