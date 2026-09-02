/**
 * Undisclosed silver label — browser SVG generator.
 *
 * Single source of truth for the print-ready / on-vial label the storefront and the
 * calculator both use. Renders the exact approved design: black rail (10%) with the
 * real UD brand mark + vertical brand name, middle block (60%) with brand header,
 * product name, silver dose bar, and either a catalog (form / storage) or calculator
 * (diluent / conc / dose) footer, and a right block (30%) with QR + legal text.
 *
 * Custom private-label: pass `brandName` + `brandImage` to replace UNDISCLOSED and the
 * UD mark with a customer's own name and logo. Everything else stays identical.
 */
import QRCode from "qrcode";
import { UD_MARK_DATA_URI } from "./udBrandMarkDataUri";
import { UD_LABEL_FONT_FACE_CSS } from "./udLabelFontsDataUri";

/** Default QR target when no COA / link is provided. */
export const DEFAULT_QR_URL = "https://www.wellpept.com";

// Short display codes for products whose full name is too long to sit on one uniform line.
// Every code is <= 8 characters so it renders at the SAME name size on every vial (see
// `nameSize` below). Order matters: blends and specific variants are matched before the
// generic single-compound patterns. Names already <= 8 chars (BPC-157, GHK-Cu, NAD+, KPV,
// MOTS-c, PT-141, …) need no entry and pass through unchanged.
const NAME_SHORT = [
  // Blends / specific variants first
  [/CJC.*IPA|IPA.*CJC|CJC.*IPAMOREL|IPAMOREL.*CJC/, "CJC/IPA"],
  [/TESA.*IPA|IPA.*TESA/, "TESA/IPA"],
  [/WOLVERINE|BPC.*TB|TB.*BPC/, "BPC/TB"],
  [/CJC.*WITH.*DAC|CJC.*\bDAC\b/, "CJC-DAC"],
  [/\bCJC\b/, "CJC"],
  [/HGH.*(FRAG|176)|\b176-?191\b/, "HGH FRAG"],
  // Metabolic / incretins
  [/SEMAGLUTIDE|^SEMA$/, "SEMA"],
  [/RETATRUTIDE|^RETA\b/, "RETA"],
  [/TIRZEPATIDE|^TIRZ/, "TIRZ"],
  [/LIRAGLUTIDE/, "LIRA"],
  [/CAGRILINTIDE|^CAGRI/, "CAGRI"],
  [/SURVODUTIDE/, "SURVO"],
  [/MAZDUTIDE/, "MAZD"],
  // Growth / GH secretagogues
  [/TESAMORELIN/, "TESA"],
  [/SERMORELIN/, "SERM"],
  [/HEXARELIN/, "HEXA"],
  [/IPAMORELIN/, "IPA"],
  [/IGF/, "IGF-1"],
  // Melanocortin
  [/MELANOTAN.*2|\bMT-?2\b/, "MT-2"],
  [/MELANOTAN.*1|\bMT-?1\b/, "MT-1"],
  // Longevity / cellular / cognitive
  [/EPITHALON|EPITALON/, "EPI"],
  [/GLUTATHIONE/, "GLUTA"],
  [/CEREBROLYSIN/, "CEREBRO"],
  [/GONADORELIN/, "GONAD"],
  [/FOLLISTATIN/, "FOLLI"],
  [/KISSPEPTIN/, "KISS-10"],
  [/MELATONIN/, "MELA"],
  [/5-?AMINO|1MQ/, "5-AMINO"],
  [/SLU-?PP/, "SLU-PP"],
  [/THYMOSIN\s*ALPHA|THYMOSIN\s*ALFA|^TA-?1\b/, "TA-1"],
  [/FOX0?4|FOXO4/, "FOX04"],
  // Vitamins / diluent
  [/VITAMIN\s*B\s*12|METHYLCOBALAMIN|\bB-?12\b/, "B12"],
  [/VITAMIN\s*B\b/, "VIT-B"],
  [/BACTERIOSTATIC|BAC\s*WATER|\bBAC\b/, "BAC"],
];

/** Map a long product name to its short label code (or return it unchanged if it already fits). */
export function shortLabelName(name) {
  const n = String(name || "").toUpperCase();
  for (const [re, code] of NAME_SHORT) if (re.test(n)) return code;
  return name;
}

// accent presets: line=hairlines/dividers/brackets, mark=elements on the black band,
// bar=dose bar, barText=dose text, head=small headers/top line
export const LABEL_ACCENTS = {
  silver: { line: "url(#silver)", mark: "url(#silver)", bar: "url(#silverbar)", barText: "#181818", head: "#565b62" },
  gold: { line: "url(#gold)", mark: "url(#gold)", bar: "url(#goldbar)", barText: "#ffffff", head: "#8a6410" },
  charcoal: { line: "#2a2a2a", mark: "#f2f2f2", bar: "#1d1d1d", barText: "#ffffff", head: "#242424" },
};

/** 3 mL → 40×20 mm (2:1); 10 mL and up → 50×30 mm (5:3). Master renders at 1800 px wide. */
export function silverLabelDims(vialMl = 3) {
  const ml = Number(vialMl) >= 8 ? 10 : 3;
  return ml === 10
    ? { w: 1800, h: 1080, widthMm: 50, heightMm: 30, ml }
    : { w: 1800, h: 900, widthMm: 40, heightMm: 20, ml };
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[<>&]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;" }[c]));
}

// Perceived luminance (0–255) of a #rrggbb colour — used to pick contrasting dose-bar text.
function hexLum(hex) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex || ""));
  if (!m) return 200;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Real, scannable QR encoding the COA / link payload. Falls back to a placeholder pattern
// only if encoding fails, so the label always renders.
function qr(x, y, size, payload) {
  try {
    const m = QRCode.create(String(payload || DEFAULT_QR_URL), { errorCorrectionLevel: "M" }).modules;
    const n = m.size, c = size / n;
    let s = "";
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if (m.get(i, j)) s += `<rect x="${(x + j * c).toFixed(2)}" y="${(y + i * c).toFixed(2)}" width="${(c + 0.4).toFixed(2)}" height="${(c + 0.4).toFixed(2)}" fill="#111"/>`;
    }
    return s;
  } catch {
    const n = 21, c = size / n; let s = "", r = 7;
    const rnd = () => (r = (r * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const finder = (i < 7 && j < 7) || (i < 7 && j > n - 8) || (i > n - 8 && j < 7);
      const on = finder ? ((i === 0 || i === 6 || j === 0 || j === 6 || (i > 1 && i < 5 && j > 1 && j < 5)) ? 1 : 0) : (rnd() > 0.5 ? 1 : 0);
      if (on) s += `<rect x="${(x + j * c).toFixed(1)}" y="${(y + i * c).toFixed(1)}" width="${c.toFixed(1)}" height="${c.toFixed(1)}" fill="#111"/>`;
    }
    return s;
  }
}

/**
 * Build the label SVG string.
 * @param {object} o
 * @param {string} o.name      Product name (e.g. "RETA")
 * @param {string} o.mg        Strength shown in the bar (e.g. "10 MG")
 * @param {"catalog"|"calculator"} o.type
 * @param {string} [o.accent]  Accent preset name (default "silver")
 * @param {number} o.w, o.h    Master pixel size (use silverLabelDims)
 * @param {string} [o.line1]   Catalog: form (e.g. "LYOPHILIZED POWDER")
 * @param {string} [o.line2]   Catalog: storage (e.g. "STORE AT 36–46°F")
 * @param {string} [o.diluent] Calculator: e.g. "2.00 mL"
 * @param {string} [o.concentration] Calculator: e.g. "5.00 MG/mL"
 * @param {string} [o.doseValue]     Calculator: dose amount incl. unit (e.g. "0.25 – 0.50 MG")
 * @param {string} [o.doseUnits]     Calculator: syringe units below (e.g. "5 – 10 U")
 * @param {string} [o.brandName]     Custom brand name (default "UNDISCLOSED")
 * @param {string} [o.brandImage]    Custom logo data URI (default UD mark)
 */
export function buildSilverLabelSVG(o = {}) {
  const {
    name = "PEPTIDE", mg = "", type = "catalog", accent = "silver", w, h,
    line1 = "", line2 = "", diluent = "", concentration = "", doseValue = "", doseUnits = "",
    brandName = "UNDISCLOSED", brandImage = UD_MARK_DATA_URI, qrPayload = DEFAULT_QR_URL,
    accentColor = "",
  } = o;
  // A single custom accent colour (used by the landing showcase to colour-code the label to
  // match a coloured crimp cap): tints the dividers, brand mark, dose bar and small headers,
  // with the dose text flipped to white/ink for contrast. Everything else stays as designed.
  const A = accentColor
    ? { line: accentColor, mark: accentColor, bar: accentColor, barText: hexLum(accentColor) < 150 ? "#ffffff" : "#141414", head: accentColor }
    : LABEL_ACCENTS[accent] || LABEL_ACCENTS.silver;
  const BN = String(brandName || "UNDISCLOSED").toUpperCase();
  const NM = String(shortLabelName(name) || "PEPTIDE").toUpperCase();
  // Typefaces: Playfair Display (serif) for the product name + vertical brand — the luxury
  // hero — and Inter (sans) for every body / legal / dose line. Both are embedded in the SVG
  // (see the <style> in <defs>) so they render through <img>/canvas. Real font stacks kept as
  // fallbacks in case the embedded face ever fails to load.
  const SERIF = "'UD Serif', Georgia, 'Times New Roman', serif";
  const SANS = "'UD Sans', Arial, Helvetica, sans-serif";

  const band = Math.round(w * 0.10);
  const mainL = band, mainR = w * 0.70, mainC = (mainL + mainR) / 2, mainW = mainR - mainL;
  const divX = w * 0.70, rightSafe = w * 0.965, rightC = (divX + rightSafe) / 2, rightUsable = (rightSafe - divX) * 0.80;
  const fit = (s, cap, k = 0.56) => Math.min(cap, rightUsable / (Math.max(1, String(s).length) * k));
  // Uniform product-name size: every short code (<= 8 chars) lands on the width cap, so the
  // name is the SAME size on every vial. The divide only shrinks an unexpectedly long custom
  // name so it still fits on one line.
  const nameSize = Math.min(mainW * 0.194, (mainW * 0.95) / (Math.max(1, NM.length) * 0.60));
  const barW = mainW * 0.80, barX = mainC - barW / 2, barH = h * 0.135, barY = h * 0.455;
  const qs = Math.min(h * 0.40, rightUsable), qx = rightC - qs / 2, qy = h * 0.14, br = h * 0.05, t = 5;

  let bottom;
  if (type === "calculator") {
    const cols = [
      ["DILUENT", diluent || "—", ""],
      ["CONC.", concentration || "—", ""],
      ["DOSE", doseValue || "—", doseUnits || ""],
    ];
    const cy = h * 0.70, vy = h * 0.805, sy = h * 0.90;
    const colUsable = mainW * 0.305;
    bottom = cols.map(([head, val, sub], i) => {
      const cxc = mainL + mainW * (0.17 + 0.33 * i);
      const vf = Math.min(h * 0.060, colUsable / (String(val).length * 0.55));
      const uf = Math.min(h * 0.055, colUsable / (String(sub || " ").length * 0.55));
      let s = `<text x="${cxc}" y="${cy}" fill="${A.head}" font-family="${SANS}" font-weight="800" font-size="${h * 0.048}" letter-spacing="0.5" text-anchor="middle">${esc(head)}</text>
        <text x="${cxc}" y="${vy}" fill="#0f0f0f" font-family="${SANS}" font-weight="800" font-size="${vf}" text-anchor="middle">${esc(val)}</text>`;
      if (sub) s += `<text x="${cxc}" y="${sy}" fill="#1a1a1a" font-family="${SANS}" font-weight="500" font-size="${uf}" text-anchor="middle">${esc(sub)}</text>`;
      return s;
    }).join("") +
      [0.335, 0.665].map((f) => `<rect x="${mainL + mainW * f}" y="${h * 0.68}" width="2" height="${h * 0.245}" fill="${A.line}"/>`).join("");
  } else {
    bottom = `<text x="${mainC}" y="${h * 0.755}" fill="#0f0f0f" font-family="${SANS}" font-weight="800" font-size="${h * 0.066}" letter-spacing="3" text-anchor="middle">${esc(line1)}</text>
      <text x="${mainC}" y="${h * 0.865}" fill="#0f0f0f" font-family="${SANS}" font-weight="800" font-size="${h * 0.056}" letter-spacing="2" text-anchor="middle">${esc(line2)}</text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <style>${UD_LABEL_FONT_FACE_CSS}</style>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f9ecbe"/><stop offset="0.34" stop-color="#caa14a"/><stop offset="0.54" stop-color="#8a6a24"/><stop offset="0.72" stop-color="#e4c877"/><stop offset="1" stop-color="#a67f2e"/></linearGradient>
    <linearGradient id="goldbar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ecd390"/><stop offset="0.5" stop-color="#b7893a"/><stop offset="1" stop-color="#8f6a26"/></linearGradient>
    <linearGradient id="silver" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef1f3"/><stop offset="0.4" stop-color="#aab0b8"/><stop offset="0.6" stop-color="#7d838c"/><stop offset="1" stop-color="#c2c8ce"/></linearGradient>
    <linearGradient id="silverbar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#dfe3e7"/><stop offset="0.5" stop-color="#aeb4bc"/><stop offset="1" stop-color="#878d95"/></linearGradient>
  </defs>
  <rect x="0" y="0" width="${w}" height="${h}" fill="#ffffff"/>
  <rect x="0" y="0" width="${band}" height="${h}" fill="#111"/>
  <rect x="${band}" y="0" width="4" height="${h}" fill="${A.line}"/>
  <text x="${band * 0.50}" y="${h * 0.455}" fill="${A.mark}" font-family="${SERIF}" font-weight="700" font-size="${Math.min(h * 0.071, (h * 0.74) / (Math.max(6, BN.length) * 0.62))}" letter-spacing="${h * 0.009}" text-anchor="middle" dominant-baseline="central" transform="rotate(-90 ${band * 0.50} ${h * 0.455})">${esc(BN)}</text>
  <image href="${brandImage}" x="${band * 0.5 - band * 0.40}" y="${h * 0.90 - band * 0.40}" width="${band * 0.80}" height="${band * 0.80}" preserveAspectRatio="xMidYMid meet"/>
  <text x="${mainC}" y="${h * 0.135}" fill="${A.head}" font-family="${SANS}" font-weight="800" font-size="${Math.min(h * 0.056, (mainW * 0.82) / (Math.max(6, BN.length + 4) * 0.60))}" letter-spacing="${w * 0.006}" text-anchor="middle">— ${esc(BN)} —</text>
  <text x="${mainC}" y="${h * 0.33}" fill="#141414" font-family="${SERIF}" font-weight="800" font-size="${nameSize}" letter-spacing="2" text-anchor="middle" dominant-baseline="middle">${esc(NM)}</text>
  <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="${h * 0.02}" fill="${A.bar}"/>
  <text x="${mainC}" y="${barY + barH / 2 + h * 0.005}" fill="${A.barText}" font-family="${SANS}" font-weight="800" font-size="${h * 0.082}" letter-spacing="2" text-anchor="middle" dominant-baseline="middle">${esc(mg)}</text>
  <rect x="${barX}" y="${h * 0.655}" width="${barW}" height="2" fill="${A.line}"/>
  ${bottom}
  <rect x="${divX}" y="${h * 0.10}" width="2" height="${h * 0.80}" fill="${A.line}"/>
  ${qr(qx, qy, qs, qrPayload)}
  <path d="M${qx - 12} ${qy - 12 + br} V${qy - 12} H${qx - 12 + br}" stroke="${A.line}" stroke-width="${t}" fill="none"/>
  <path d="M${qx + qs + 12 - br} ${qy - 12} H${qx + qs + 12} V${qy - 12 + br}" stroke="${A.line}" stroke-width="${t}" fill="none"/>
  <path d="M${qx - 12} ${qy + qs + 12 - br} V${qy + qs + 12} H${qx - 12 + br}" stroke="${A.line}" stroke-width="${t}" fill="none"/>
  <path d="M${qx + qs + 12 - br} ${qy + qs + 12} H${qx + qs + 12} V${qy + qs + 12 - br}" stroke="${A.line}" stroke-width="${t}" fill="none"/>
  <text x="${rightC}" y="${h * 0.71}" fill="#0f0f0f" font-family="${SANS}" font-weight="800" font-size="${fit("RESEARCH ONLY.", h * 0.054)}" letter-spacing="0.5" text-anchor="middle">RESEARCH ONLY.</text>
  <text x="${rightC}" y="${h * 0.812}" fill="#0f0f0f" font-family="${SANS}" font-weight="800" font-size="${fit("NOT FOR HUMAN", h * 0.046)}" text-anchor="middle">NOT FOR HUMAN</text>
  <text x="${rightC}" y="${h * 0.882}" fill="#0f0f0f" font-family="${SANS}" font-weight="800" font-size="${fit("NOT FOR HUMAN", h * 0.046)}" text-anchor="middle">CONSUMPTION.</text>
</svg>`;
}

/**
 * Map friendly calculator/catalog fields to a label SVG. Single source of truth so the
 * flat printable label and the on-vial composite always render identically.
 */
export function labelSVGFromFields(fields = {}) {
  const {
    name = "Peptide", mass = "", unit = "mg", labelType = "CALCULATOR",
    formText = "LYOPHILIZED POWDER", storageTemp = "36–46°F",
    diluent = "", concentration = "", doseValue = "", doseUnits = "",
    brandName = "UNDISCLOSED", brandImage = "", vialMl = 3, blank = false,
    qrPayload = DEFAULT_QR_URL, accentColor = "",
  } = fields;
  const dims = silverLabelDims(vialMl);
  const type = String(labelType || "CALCULATOR").toUpperCase() === "CATALOG" ? "catalog" : "calculator";
  const mg = !blank && mass ? `${mass} ${String(unit || "mg").toUpperCase()}` : "";
  const svg = buildSilverLabelSVG({
    name: blank ? "" : name,
    mg,
    type,
    accent: "silver",
    w: dims.w,
    h: dims.h,
    line1: blank ? "" : formText,
    line2: blank ? "" : `STORE AT ${storageTemp}`,
    diluent: blank ? "" : diluent,
    concentration: blank ? "" : concentration,
    doseValue: blank ? "" : doseValue,
    doseUnits: blank ? "" : doseUnits,
    brandName: brandName || "UNDISCLOSED",
    brandImage: brandImage || undefined,
    qrPayload: qrPayload || DEFAULT_QR_URL,
    accentColor,
  });
  return { svg, dims, type };
}

/** SVG string → data URL for an <img> preview (crisp vector, scales with CSS). */
export function svgToImageSrc(svg) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

/**
 * Rasterize the SVG to a PNG data URL at a print DPI. 3 mL 40×20 → 945×472 @600dpi.
 * Browser-only (uses Image + canvas). Returns "" on failure.
 */
export function rasterizeLabelPng(svg, { widthMm, heightMm, dpi = 600 } = {}) {
  return new Promise((resolve) => {
    try {
      const pxW = Math.round((widthMm / 25.4) * dpi);
      const pxH = Math.round((heightMm / 25.4) * dpi);
      const img = new Image();
      img.decoding = "async";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = pxW; canvas.height = pxH;
          const ctx = canvas.getContext("2d");
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.drawImage(img, 0, 0, pxW, pxH);
          resolve(canvas.toDataURL("image/png"));
        } catch (err) {
          console.error("Label rasterize failed", err);
          resolve("");
        }
      };
      img.onerror = () => resolve("");
      img.src = svgToImageSrc(svg);
    } catch (err) {
      console.error("Label rasterize setup failed", err);
      resolve("");
    }
  });
}
