/**
 * Build side-by-side proof boards for website vial renderer review.
 * Full-res (1024×1536) and website card size (280×420).
 */
import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const siteRoot = path.resolve(root, "..");

const proofs = [
  {
    id: "RETA 10mg 3mL",
    file: path.join(siteRoot, "public/ud-labels/catalog/UD_0221_RETATRUTIDE_10MG_3mL_Website.webp"),
  },
  {
    id: "GLUTA 600mg 10mL",
    file: path.join(siteRoot, "public/ud-labels/catalog/UD_0124_GLUTATHIONE_600MG_10mL_Website.webp"),
  },
  {
    id: "KLOW 80mg 3mL blue",
    file: path.join(siteRoot, "public/ud-labels/catalog/UD_0160_KLOW_80MG_3mL_Website.webp"),
  },
  {
    id: "NAD+ 1000mg 10mL",
    file: path.join(siteRoot, "public/ud-labels/catalog/UD_0204_NAD_1000MG_10mL_Website.webp"),
  },
  {
    id: "B12 10mg 10mL liquid",
    file: path.join(siteRoot, "public/ud-labels/catalog/UD_0037_B12_10MG_10mL_Website.webp"),
  },
];

function captionSvg(text, width, height, fontSize) {
  const safe = String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <rect width="100%" height="100%" fill="#111"/>
  <text x="50%" y="${Math.round(height * 0.65)}" text-anchor="middle" fill="#fff"
    font-family="Arial,Helvetica,sans-serif" font-size="${fontSize}" font-weight="700">${safe}</text>
</svg>`);
}

async function main() {
  const gap = 24;
  const fulls = [];
  const webs = [];

  for (const p of proofs) {
    const stem = p.id.replace(/[^A-Za-z0-9]+/g, "_");
    const fullPng = await sharp(p.file).png().toBuffer();
    const webPng = await sharp(p.file)
      .resize(280, 420, { fit: "contain", background: "#000" })
      .png()
      .toBuffer();
    await sharp(fullPng).toFile(path.join(siteRoot, `tmp-proof-${stem}-full.png`));
    await sharp(webPng).toFile(path.join(siteRoot, `tmp-proof-${stem}-web.png`));
    fulls.push(fullPng);
    webs.push(webPng);
    console.log("saved", p.id);
  }

  const cellW = 1024;
  const cellH = 1536;
  const n = proofs.length;
  const boardW = cellW * n + gap * (n + 1);
  const boardH = cellH + gap * 2 + 80;
  const composites = [];
  for (let i = 0; i < n; i += 1) {
    const x = gap + i * (cellW + gap);
    composites.push({
      input: await sharp(captionSvg(proofs[i].id, cellW, 60, 28)).png().toBuffer(),
      left: x,
      top: gap,
    });
    composites.push({ input: fulls[i], left: x, top: gap + 60 });
  }
  await sharp({
    create: { width: boardW, height: boardH, channels: 3, background: "#0a0a0a" },
  })
    .composite(composites)
    .png()
    .toFile(path.join(siteRoot, "tmp-proof-board-full.png"));

  const wCell = 280;
  const wH = 420;
  const wBoardW = wCell * n + gap * (n + 1);
  const wBoardH = wH + gap * 2 + 60;
  const wComp = [];
  for (let i = 0; i < n; i += 1) {
    const x = gap + i * (wCell + gap);
    wComp.push({
      input: await sharp(captionSvg(proofs[i].id, wCell, 40, 13)).png().toBuffer(),
      left: x,
      top: gap,
    });
    wComp.push({ input: webs[i], left: x, top: gap + 40 });
  }
  await sharp({
    create: { width: wBoardW, height: wBoardH, channels: 3, background: "#0a0a0a" },
  })
    .composite(wComp)
    .png()
    .toFile(path.join(siteRoot, "tmp-proof-board-web.png"));

  console.log("boards written for", n, "products");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
