import fs from "node:fs";

const catalogPath = new URL("../data/catalog.json", import.meta.url);
const c = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

function isB12(p) {
  const label = String(p.labelName || "").trim();
  const full = String(p.fullProductName || "");
  const text = `${label} ${full}`;
  if (/^B12$/i.test(label)) return true;
  if (/vitamin\s*b\s*12/i.test(text)) return true;
  if (/methylcobalamin/i.test(text) && /b12/i.test(text)) return true;
  if (/^B12\b/i.test(full.trim())) return true;
  return false;
}

for (const p of c.products) {
  if (!isB12(p)) continue;
  p.contentsType = "LIQUID";
  p.liquidColor = "#A50018";
  p.fillFraction = 0.75;
  p.vialProfile = "10ML";
  p.formText = "LIQUID";
  p.materialColor = "RED";
  p.visualType = "RED LIQUID 75%";
  p.baseVialAsset = "UD_10mL_B12_Red_Liquid_Black_Cap_Unlabeled.png";
  p.placementProfile = "10ML_B12_LIQUID";
  delete p.powderColor;
  delete p.cakeColor;
}

fs.writeFileSync(catalogPath, JSON.stringify(c, null, 2));
const hits = c.products.filter(isB12);
console.log(hits.map((p) => `${p.catalogId}\t${p.labelName}\t${p.fullProductName}`).join("\n"));
console.log("updated", hits.length);
