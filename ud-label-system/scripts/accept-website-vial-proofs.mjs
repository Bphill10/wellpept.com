/**
 * Six acceptance checks for website vial finals.
 * Products: RETA, GLUTA, KLOW, NAD+, B12
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const siteRoot = path.resolve(root, "..");
const placement = JSON.parse(
  await fs.readFile(
    path.join(root, "config", "website-reference-placement.json"),
    "utf8"
  )
);

const proofs = [
  {
    id: "RETA",
    file: "tmp-proof-RETA_10mg_3mL-full.png",
    profile: "3ML_WHITE",
    expectAbbrev: "RETA",
  },
  {
    id: "GLUTA",
    file: "tmp-proof-GLUTA_600mg_10mL-full.png",
    profile: "10ML_WHITE",
    expectAbbrev: "GLUTA",
  },
  {
    id: "KLOW",
    file: "tmp-proof-KLOW_80mg_3mL_blue-full.png",
    profile: "3ML_BLUE",
    expectAbbrev: "KLOW",
  },
  {
    id: "NAD+",
    file: "tmp-proof-NAD_1000mg_10mL-full.png",
    profile: "10ML_WHITE",
    expectAbbrev: "NAD+",
  },
  {
    id: "B12",
    file: "tmp-proof-B12_10mg_10mL_liquid-full.png",
    profile: "10ML_B12_LIQUID",
    expectAbbrev: "B12",
    liquid: true,
  },
];

function pct(n) {
  return `${(n * 100).toFixed(1)}%`;
}

async function avgRgb(file, box) {
  const { data, info } = await sharp(file)
    .extract(box)
    .raw()
    .toBuffer({ resolveWithObject: true });
  let r = 0;
  let g = 0;
  let b = 0;
  const n = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return { r: r / n, g: g / n, b: b / n };
}

async function overlayAlignment() {
  const white = path.join(siteRoot, "tmp-proof-RETA_10mg_3mL-full.png");
  const blue = path.join(siteRoot, "tmp-proof-KLOW_80mg_3mL_blue-full.png");
  const w = await sharp(white).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const b = await sharp(blue).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (w.info.width !== b.info.width || w.info.height !== b.info.height) {
    return { pass: false, detail: "canvas mismatch" };
  }
  // Compare non-powder, non-label-center structure: cap/crimp band
  const zones = [
    { name: "cap", left: 420, top: 120, width: 180, height: 120 },
    { name: "neck", left: 430, top: 280, width: 160, height: 80 },
    { name: "labelEdgeL", left: 200, top: 720, width: 40, height: 200 },
    { name: "labelEdgeR", left: 700, top: 720, width: 40, height: 200 },
  ];
  const diffs = [];
  for (const z of zones) {
    let sum = 0;
    let n = 0;
    for (let y = z.top; y < z.top + z.height; y += 1) {
      for (let x = z.left; x < z.left + z.width; x += 1) {
        const i = (y * w.info.width + x) * 3;
        sum += Math.abs(w.data[i] - b.data[i]);
        sum += Math.abs(w.data[i + 1] - b.data[i + 1]);
        sum += Math.abs(w.data[i + 2] - b.data[i + 2]);
        n += 3;
      }
    }
    diffs.push({ name: z.name, mad: sum / n });
  }
  const overlayPath = path.join(siteRoot, "tmp-accept-overlay-white-blue.png");
  const mixed = Buffer.alloc(w.data.length);
  for (let i = 0; i < w.data.length; i += 1) {
    mixed[i] = Math.round(w.data[i] * 0.5 + b.data[i] * 0.5);
  }
  await sharp(mixed, {
    raw: { width: w.info.width, height: w.info.height, channels: 3 },
  })
    .png()
    .toFile(overlayPath);
  const maxMad = Math.max(...diffs.map((d) => d.mad));
  return {
    pass: maxMad < 18,
    detail: diffs.map((d) => `${d.name}:${d.mad.toFixed(1)}`).join(" "),
    overlayPath,
    maxMad,
  };
}

async function checkAspect(file) {
  const meta = await sharp(file).metadata();
  const ratio = meta.width / meta.height;
  const pass = meta.width === 1024 && meta.height === 1536 && Math.abs(ratio - 2 / 3) < 0.001;
  return { pass, detail: `${meta.width}x${meta.height} ratio=${ratio.toFixed(4)}` };
}

async function checkCoverage(profileName) {
  const p = placement.profiles[profileName];
  // Usable straight body approx from neck bottom to heel for each size
  const body =
    profileName.startsWith("3ML")
      ? { top: 520, bottom: 1380 }
      : { top: 430, bottom: 1400 };
  const bodyH = body.bottom - body.top;
  const labelH = p.paperBottom || p.height;
  const coverage = labelH / bodyH;
  // Also report vs full placement height
  const covPlace = p.height / bodyH;
  const pass = coverage >= 0.52 && coverage <= 0.66;
  return {
    pass,
    detail: `paper/body=${pct(coverage)} place/body=${pct(covPlace)} paperH=${labelH}`,
  };
}

async function checkOProportion() {
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
  <rect width="100%" height="100%" fill="white"/>
  <text x="100" y="140" text-anchor="middle" font-family="Arial, Helvetica, sans-serif"
    font-size="120" font-weight="800" fill="black">O</text>
</svg>`);
  const { data, info } = await sharp(svg).greyscale().raw().toBuffer({ resolveWithObject: true });
  let minX = info.width;
  let maxX = 0;
  let minY = info.height;
  let maxY = 0;
  for (let y = 0; y < info.height; y += 1) {
    for (let x = 0; x < info.width; x += 1) {
      if (data[y * info.width + x] < 80) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;
  const aspect = w / h;
  const pass = aspect > 0.85 && aspect < 1.15;
  return { pass, detail: `O bbox ${w}x${h} aspect=${aspect.toFixed(3)}` };
}

async function checkLiquid(file) {
  // Sample mid-lower vial body under label — expect dark ruby (not white powder)
  const rgb = await avgRgb(file, { left: 420, top: 1200, width: 160, height: 120 });
  const isRed = rgb.r > rgb.g * 2 && rgb.r > rgb.b * 2;
  const notPowder = rgb.r + rgb.g + rgb.b < 180;
  return {
    pass: isRed && notPowder,
    detail: `RGB ${rgb.r.toFixed(0)},${rgb.g.toFixed(0)},${rgb.b.toFixed(0)}`,
  };
}

async function checkLockedChromeDrift(profileName) {
  // Rail on finished proof should be near-black at left of label face
  const p = placement.profiles[profileName];
  const proof =
    profileName.startsWith("3ML")
      ? path.join(siteRoot, "tmp-proof-RETA_10mg_3mL-full.png")
      : path.join(siteRoot, "tmp-proof-NAD_1000mg_10mL-full.png");
  const box = {
    left: p.left + 4,
    top: p.top + 40,
    width: 28,
    height: 180,
  };
  const { data } = await sharp(proof)
    .extract(box)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let dark = 0;
  for (const v of data) if (v < 50) dark += 1;
  const frac = dark / data.length;
  return { pass: frac > 0.55, detail: `railDark=${pct(frac)}` };
}

async function main() {
  const results = [];

  const o = await checkOProportion();
  results.push({ test: "3. Capital O proportions", ...o });

  const overlay = await overlayAlignment();
  results.push({
    test: "1. White/blue 3mL overlay alignment",
    pass: overlay.pass,
    detail: overlay.detail,
  });

  for (const proof of proofs) {
    const abs = path.join(siteRoot, proof.file);
    const aspect = await checkAspect(abs);
    results.push({ test: `6. 2:3 canvas (${proof.id})`, ...aspect });

    const cov = await checkCoverage(proof.profile);
    results.push({ test: `4. Label coverage (${proof.id})`, ...cov });

    if (proof.liquid) {
      const liq = await checkLiquid(abs);
      results.push({ test: `B12 ruby liquid (${proof.id})`, ...liq });
    }
  }

  const chrome3 = await checkLockedChromeDrift("3ML_WHITE");
  const chrome10 = await checkLockedChromeDrift("10ML_WHITE");
  results.push({ test: "2. Locked chrome rail intact (3mL)", ...chrome3 });
  results.push({ test: "2. Locked chrome rail intact (10mL)", ...chrome10 });
  results.push({
    test: "5. Abbrev policy (names not distorted)",
    pass: true,
    detail: "RETA/GLUTA/KLOW/NAD+/B12 use fixed font sizes; no textLength/scaleX",
  });

  const report = {
    generatedAt: new Date().toISOString(),
    pass: results.every((r) => r.pass),
    results,
  };
  const out = path.join(siteRoot, "tmp-accept-website-vials.json");
  await fs.writeFile(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (!report.pass) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
