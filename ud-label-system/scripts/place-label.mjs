import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (!argv[i].startsWith("--")) continue;
    args[argv[i].slice(2)] = argv[++i];
  }
  return args;
}

function resolveInsideRoot(value) {
  return path.isAbsolute(value) ? value : path.join(root, value);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.label) throw new Error("Missing --label path to a generated label PNG.");
  const placement = JSON.parse(await fs.readFile(path.join(root, "config/vial-placement.json"), "utf8"));
  const profileName = String(args.profile || "3ML_WHITE").toUpperCase();
  const profile = placement.profiles[profileName];
  if (!profile) throw new Error(`Unknown placement profile: ${profileName}`);

  const basePath = resolveInsideRoot(args.vial || profile.baseAsset);
  const labelPath = resolveInsideRoot(args.label);
  const bounds = profile.labelBoundsPx;
  const width = bounds.right - bounds.left;
  const height = bounds.bottom - bounds.top;
  const curve = Math.max(4, Math.round(height * 0.014));

  const label = await sharp(labelPath)
    .resize(width, height, { fit: "fill", kernel: "lanczos3" })
    .removeAlpha()
    .png()
    .toBuffer();

  const mask = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <path d="M0 ${curve} Q${width / 2} 0 ${width} ${curve} L${width} ${height - curve} Q${width / 2} ${height} 0 ${height - curve} Z" fill="white"/>
    </svg>
  `);
  const shade = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="cylinder" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#707070" stop-opacity="0.28"/>
          <stop offset="0.13" stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0"/>
          <stop offset="0.87" stop-color="#ffffff" stop-opacity="0.04"/>
          <stop offset="1" stop-color="#707070" stop-opacity="0.28"/>
        </linearGradient>
      </defs>
      <rect width="${width}" height="${height}" fill="url(#cylinder)"/>
    </svg>
  `);

  const wrappedLabel = await sharp(label)
    .ensureAlpha()
    .composite([
      { input: mask, blend: "dest-in" },
      { input: shade, blend: "multiply" }
    ])
    .png()
    .toBuffer();

  const outputPath = resolveInsideRoot(args.output || `output/vials/${profileName}_Labeled.png`);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await sharp(basePath)
    .composite([{ input: wrappedLabel, left: bounds.left, top: bounds.top }])
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  const meta = await sharp(outputPath).metadata();
  if (meta.width !== placement.canvas.widthPx || meta.height !== placement.canvas.heightPx) {
    throw new Error(`Unexpected vial canvas: ${meta.width}x${meta.height}`);
  }
  console.log(JSON.stringify({ profile: profileName, basePath, labelPath, outputPath, bounds }, null, 2));
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
