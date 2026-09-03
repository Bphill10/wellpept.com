/**
 * Keep production unlabeled stocks in sync with locked masters.
 *
 * When blender/PUBLISHED.json is present, copy the four Blender plates.
 * The two 3 mL files are scene twins — identical geometry, cake color only.
 *
 * Otherwise keep the legacy path: derive the 3 mL white plate from the clean
 * cobalt locked master so the rectangular matte on the old white lock is never
 * shipped. Locked masters are not rewritten here.
 */
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const systemRoot = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(systemRoot, "..");

const COPIES = [
  {
    from: "locked-masters/vials/01_3mL_White_Powder_LOCKED.png",
    assets: ["assets/vials/UD_3mL_White_Peptide_Black_Cap_Unlabeled.png"],
    publicName: "UD_3mL_White_Peptide_Black_Cap_Unlabeled.png",
  },
  {
    from: "locked-masters/vials/02_3mL_Cobalt_Blue_Powder_LOCKED.png",
    assets: ["assets/vials/UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png"],
    publicName: "UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png",
  },
  {
    from: "locked-masters/vials/03_10mL_White_Powder_LOCKED.png",
    assets: ["assets/vials/UD_10mL_White_Peptide_Black_Cap_Unlabeled.png"],
    publicName: "UD_10mL_White_Peptide_Black_Cap_Unlabeled.png",
  },
];

async function writePng(buffer, outputPath) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.unlink(outputPath).catch((error) => {
    if (error?.code !== "ENOENT") throw error;
  });
  await fs.writeFile(outputPath, buffer);
}

async function copyLocked(rel, destRels, publicName) {
  const sourcePath = path.join(systemRoot, rel);
  const png = await sharp(sourcePath).png({ compressionLevel: 9, adaptiveFiltering: true }).toBuffer();
  for (const dest of destRels) {
    await writePng(png, path.join(systemRoot, dest));
  }
  await writePng(
    png,
    path.join(repoRoot, "public/ud-labels/vials", publicName)
  );
  return {
    sourcePath,
    sha256: crypto.createHash("sha256").update(png).digest("hex"),
    bytes: png.length,
  };
}

async function neutralizeBlueToWhite() {
  const sourcePath = path.join(
    systemRoot,
    "locked-masters/vials/02_3mL_Cobalt_Blue_Powder_LOCKED.png"
  );
  const assetPath = path.join(
    systemRoot,
    "assets/vials/UD_3mL_White_Peptide_Black_Cap_Unlabeled.png"
  );
  const publicPath = path.join(
    repoRoot,
    "public/ud-labels/vials/UD_3mL_White_Peptide_Black_Cap_Unlabeled.png"
  );

  const { data, info } = await sharp(sourcePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let changed = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      const index = (y * info.width + x) * info.channels;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const inCakeRegion =
        x >= info.width * 0.2 &&
        x <= info.width * 0.94 &&
        y >= info.height * 0.7 &&
        y <= info.height * 0.91;
      const cobalt = b > 40 && b > r + 12 && b > g + 4;
      if (!inCakeRegion || !cobalt) continue;
      const gray = Math.max(145, Math.min(255, Math.round(118 + b * 0.58)));
      data[index] = gray;
      data[index + 1] = gray;
      data[index + 2] = gray;
      changed += 1;
    }
  }

  const png = await sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: info.channels,
    },
  })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  await writePng(png, assetPath);
  await writePng(png, publicPath);
  return {
    mode: "legacy-neutralize-blue",
    sourcePath,
    assetPath,
    publicPath,
    width: info.width,
    height: info.height,
    neutralizedCakePixels: changed,
  };
}

const publishedPath = path.join(systemRoot, "blender/PUBLISHED.json");
let published = null;
try {
  published = JSON.parse(await fs.readFile(publishedPath, "utf8"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

if (published?.plates?.length) {
  const copies = [];
  for (const plate of COPIES) {
    copies.push({
      ...plate,
      ...(await copyLocked(plate.from, plate.assets, plate.publicName)),
    });
  }
  console.log(JSON.stringify({ mode: "blender-published", copies }, null, 2));
} else {
  const blue = await copyLocked(
    "locked-masters/vials/02_3mL_Cobalt_Blue_Powder_LOCKED.png",
    ["assets/vials/UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png"],
    "UD_3mL_Blue_Peptide_Black_Cap_Unlabeled.png"
  );
  const ten = await copyLocked(
    "locked-masters/vials/03_10mL_White_Powder_LOCKED.png",
    ["assets/vials/UD_10mL_White_Peptide_Black_Cap_Unlabeled.png"],
    "UD_10mL_White_Peptide_Black_Cap_Unlabeled.png"
  );
  const white = await neutralizeBlueToWhite();
  console.log(JSON.stringify({ mode: "legacy-neutralize-blue", blue, ten, white }, null, 2));
}
