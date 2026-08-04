/**
 * Resolve on-label product display name from abbreviation workbook/CSV.
 * Use catalog abbreviation only when the full name will not fit at the
 * locked font size. Never shrink fonts or resize the label to fit.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const siteRoot = path.resolve(root, "..");

const ABBREV_CANDIDATES = [
  path.join(siteRoot, "peptide-abbreviations.xlsx"),
  path.join(siteRoot, "peptide-abbreviations.csv"),
  path.join(root, "data", "peptide-abbreviations.xlsx"),
  path.join(root, "data", "peptide-abbreviations.csv"),
];

function normKey(value = "") {
  return String(value || "")
    .toUpperCase()
    .replace(/\+/g, " PLUS ")
    .replace(/[^A-Z0-9]+/g, "")
    .trim();
}

function pickAbbrev(row = {}) {
  return (
    row["Short Abrivated Name"] ||
    row["Short Abbreviated Name"] ||
    row["Short Name"] ||
    row["Abbreviation"] ||
    row.shortName ||
    row.abbreviation ||
    ""
  );
}

function pickName(row = {}) {
  return row.Name || row.name || row["Full Product Name"] || row["Label Name"] || "";
}

let cachedMap = null;

export function loadAbbreviationMap() {
  if (cachedMap) return cachedMap;
  const map = new Map();

  for (const filePath of ABBREV_CANDIDATES) {
    if (!fs.existsSync(filePath)) continue;
    try {
      const wb = XLSX.readFile(filePath);
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      for (const row of rows) {
        const name = pickName(row);
        const abbrev = String(pickAbbrev(row) || "").trim();
        if (!name || !abbrev) continue;
        const key = normKey(name);
        if (key && !map.has(key)) map.set(key, abbrev.toUpperCase());
        const abbrevKey = normKey(abbrev);
        if (abbrevKey && !map.has(abbrevKey)) map.set(abbrevKey, abbrev.toUpperCase());
      }
      cachedMap = map;
      map.sourceFile = filePath;
      return map;
    } catch (err) {
      console.warn(`[abbrev] failed reading ${filePath}: ${err.message}`);
    }
  }

  cachedMap = map;
  return map;
}

export function estimatedTextWidth(text, fontSize) {
  let units = 0;
  for (const character of String(text)) {
    if (/[MW@#%]/.test(character)) units += 0.88;
    else if (/[I1il.,'|+]/.test(character)) units += 0.33;
    else if (/\s/.test(character)) units += 0.34;
    else units += 0.61;
  }
  return units * fontSize;
}

function preservePlus(abbrev, candidate, product = {}) {
  const out = String(abbrev || "").toUpperCase();
  const source = String(
    candidate || product.labelName || product.fullProductName || ""
  );
  if (/^NAD\+?$/i.test(out) && /NAD\+/i.test(source)) return "NAD+";
  if (out === "NAD" && /\bNAD\b/i.test(source) && source.includes("+")) return "NAD+";
  return out;
}

/**
 * Best-guess short label when the workbook has no row.
 * Prefer known peptide shorts; otherwise compress long names (never leave a
 * name that won't fit at the locked font size).
 */
function bestGuessAbbrev(fullName = "") {
  const raw = String(fullName || "").trim().toUpperCase();
  if (!raw) return "UD";
  const n = normKey(raw);
  if (!n) return "UD";

  // Already short enough for the face
  if (n.length <= 6 && !/[\s/]/.test(raw)) {
    return preservePlus(raw.includes("+") && n === "NAD" ? "NAD+" : raw, raw);
  }

  const known = [
    [/RETATRUTIDE|^RETA$/, "RETA"],
    [/GLUTATHIONE|^GLUTA$|^GSH$/, "GLUTA"],
    [/SEMAGLUTIDE|^SEMA$/, "SEMA"],
    [/TIRZEPATIDE|^TIRZ$|^TRIZ$|^TZP$/, "TIRZ"],
    [/CAGRILINTIDE|^CARGI$|^CAGRI$/, "CARGI"],
    [/TESAMORELIN|^TESA$/, "TESA"],
    [/IPAMORELIN|^IPA$/, "IPA"],
    [/THYMOSINALPHA|^TA1$/, "TA-1"],
    [/THYMOSINBETA|TB500|TB5$/, "TB500"],
    [/BPC157|^BPC$/, "BPC157"],
    [/EPITHALON|EPITALON|^EPIT$/, "EPIT"],
    [/^NAD(PLUS)?$/, "NAD+"],
    [/^KLOW$/, "KLOW"],
    [/^GLOW$/, "GLOW"],
    [/GHKCU|GHK$/, "GHK-CU"],
    [/AHKCU|AHK$/, "AHK-CU"],
    [/FOXO?4|FOX04/, "FOX4"],
    [/CJC.*IPA|IPA.*CJC/, "CJC/IPA"],
    [/^CJC/, "CJC"],
    [/METHYLCOBALAMIN|^B12$/, "B12"],
    [/MOTS?C/, "MOTS-C"],
    [/SS31|ELAMIPRETIDE/, "SS-31"],
    [/PT141|BREMELANOTIDE/, "PT-141"],
    [/MELANOTAN/, "MT"],
    [/HEXARELIN/, "HEXA"],
    [/GHRP/, "GHRP"],
    [/SERMORELIN/, "SERMO"],
    [/CJC1295|CJCWITHDAC|CJCWITHOUTDAC/, "CJC"],
    [/AOD9604|^AOD$/, "AOD"],
    [/5AMINO1MQ|^1MQ$/, "1MQ"],
    [/PINEALON/, "PIN"],
    [/SELANK/, "SELANK"],
    [/SEMAX/, "SEMAX"],
    [/DIHEXA/, "DIHEXA"],
    [/LARAZOTIDE/, "LARA"],
    [/VIP\b|VASOACTIVE/, "VIP"],
    [/THYMOSIN/, "TA-1"],
  ];
  for (const [re, value] of known) {
    if (re.test(n) || re.test(raw)) return value;
  }

  // Strip common peptide suffixes, then take a compact stem
  let stem = n
    .replace(/(UTRIDE|ATIDE|OTIDE|TIDE|ULIN|ALIN|ORELIN|AMIDE|AMINE|ACID)$/g, "")
    .replace(/^(HUMAN|RECOMBINANT|SYNTHETIC)/, "");
  if (stem.length >= 4 && stem.length <= 6) return stem;
  if (stem.length > 6) {
    // Keep leading consonants/vowels mix — first 4–5 chars of stem
    return stem.slice(0, stem.length >= 10 ? 5 : 4);
  }

  // Multi-word / blend: initials or first token
  const parts = raw.split(/[^A-Z0-9+]+/).filter(Boolean);
  if (parts.length >= 2) {
    const initials = parts.map((p) => p[0]).join("");
    if (initials.length >= 2 && initials.length <= 6) return initials;
    return parts[0].replace(/[^A-Z0-9+]/g, "").slice(0, 5) || "UD";
  }

  return n.slice(0, 5) || "UD";
}

function lookupAbbrev(product = {}) {
  const map = loadAbbreviationMap();
  const candidates = [
    product.labelName,
    product.fullProductName,
    product.name,
    product.peptideName,
  ];
  for (const candidate of candidates) {
    const key = normKey(candidate);
    if (key && map.has(key)) {
      return preservePlus(map.get(key), candidate, product);
    }
  }

  const n = normKey(product.labelName || product.fullProductName || "");
  const fallbacks = [
    [/RETATRUTIDE|^RETA$/, "RETA"],
    [/GLUTATHIONE|^GLUTA$|^GSH$/, "GLUTA"],
    [/SEMAGLUTIDE|^SEMA$/, "SEMA"],
    [/TIRZEPATIDE|^TIRZ$|^TRIZ$/, "TIRZ"],
    [/CAGRILINTIDE|^CARGI$|^CAGRI$/, "CARGI"],
    [/TESAMORELIN|^TESA$/, "TESA"],
    [/IPAMORELIN|^IPA$/, "IPA"],
    [/THYMOSINALPHA|^TA1$/, "TA-1"],
    [/^NAD(PLUS)?$/, "NAD+"],
    [/^KLOW$/, "KLOW"],
    [/EPITHALON|EPITALON|^EPIT$/, "EPIT"],
  ];
  for (const [re, value] of fallbacks) {
    if (re.test(n)) return value;
  }
  return null;
}

function resolveAbbrevOrGuess(product = {}) {
  return lookupAbbrev(product) || bestGuessAbbrev(
    product.labelName || product.fullProductName || product.name || ""
  );
}

/**
 * Display name for PRODUCT_NAME.
 * Full name at locked font size when it fits; otherwise catalog abbreviation.
 * Never shrinks font. Abbreviation never changes label geometry.
 */
export function resolveLabelDisplayName(product = {}, options = {}) {
  const fullName = String(
    product.labelName || product.fullProductName || product.name || "PEPTIDE"
  ).toUpperCase();

  const explicit = String(
    product.shortName ||
      product.abbreviation ||
      product.labelShortName ||
      product.displayName ||
      ""
  ).trim();
  if (explicit) {
    return preservePlus(explicit, fullName, product);
  }

  const maxWidth = Number(options.maxWidth || 0);
  const fontSize = Number(options.fontSize || 0);
  const abbrev = resolveAbbrevOrGuess(product);
  const width = fontSize ? estimatedTextWidth(fullName, fontSize) : 0;
  const fits =
    !maxWidth ||
    !fontSize ||
    width <= maxWidth * 0.92;

  // Prefer abbrev (catalog or best guess) when full name is long / won't fit
  const compact = fullName.replace(/[^A-Z0-9+]/g, "");
  const longName = compact.length >= 8;
  if (!fits || longName) {
    return preservePlus(abbrev, fullName, product);
  }

  return preservePlus(fullName, fullName, product);
}
