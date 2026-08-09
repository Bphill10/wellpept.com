import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const systemRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(systemRoot, "..");
const manifest = JSON.parse(
  await fs.readFile(path.join(repoRoot, "public/ud-labels/catalog-manifest.json"), "utf8")
);

const errors = [];
const rows = manifest.products || [];
for (const row of rows) {
  const filePath = path.join(repoRoot, "public", String(row.image || "").replace(/^\//, ""));
  try {
    const metadata = await sharp(filePath).metadata();
    if (metadata.width !== 1024 || metadata.height !== 1536) {
      errors.push(`${row.catalogId}: ${metadata.width}x${metadata.height}`);
    }
  } catch (error) {
    errors.push(`${row.catalogId}: ${error.message}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify({ status: "PASS", images: rows.length, dimensions: "1024x1536" }, null, 2));
