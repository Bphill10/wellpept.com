/**
 * Promo / discount codes for order requests.
 * Configured in Admin → Discount codes (localStorage) or VITE_DISCOUNT_CODES.
 *
 * Env format (comma-separated): CODE:10%  or  CODE:25
 *   SAVE10:10%   → 10% off merchandise
 *   FLAT25:25    → $25 off merchandise
 */

const STORAGE_KEY = "wellpept-discount-codes-v1";

export const EMPTY_DISCOUNT = {
  code: "",
  /** "percent" | "fixed" */
  type: "percent",
  value: 0,
  active: true,
  note: "",
};

/** Parse "SAVE10:10%,FLAT25:25" into code records. */
export function parseDiscountEnv(raw = "") {
  const text = String(raw || import.meta.env.VITE_DISCOUNT_CODES || "").trim();
  if (!text) return [];
  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [codeRaw, valRaw = ""] = part.split(":");
      const code = String(codeRaw || "")
        .trim()
        .toUpperCase()
        .replace(/\s+/g, "");
      if (!code) return null;
      const val = String(valRaw).trim();
      if (val.endsWith("%")) {
        const n = Number(val.slice(0, -1));
        if (!(n > 0)) return null;
        return {
          ...EMPTY_DISCOUNT,
          code,
          type: "percent",
          value: Math.min(100, n),
          active: true,
        };
      }
      const n = Number(val);
      if (!(n > 0)) return null;
      return {
        ...EMPTY_DISCOUNT,
        code,
        type: "fixed",
        value: n,
        active: true,
      };
    })
    .filter(Boolean);
}

export function loadDiscountCodes() {
  const fromEnv = parseDiscountEnv();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fromEnv;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return fromEnv;
    const cleaned = parsed
      .map((row) => normalizeCode(row))
      .filter(Boolean);
    // Admin list wins when present; else env defaults
    return cleaned.length ? cleaned : fromEnv;
  } catch {
    return fromEnv;
  }
}

export function saveDiscountCodes(list = []) {
  const cleaned = (Array.isArray(list) ? list : [])
    .map((row) => normalizeCode(row))
    .filter(Boolean);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
  } catch {
    /* ignore */
  }
  return cleaned;
}

export function normalizeCode(row = {}) {
  const code = String(row.code || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!code) return null;
  const type = row.type === "fixed" ? "fixed" : "percent";
  let value = Number(row.value) || 0;
  if (!(value > 0)) return null;
  if (type === "percent") value = Math.min(100, value);
  return {
    code,
    type,
    value,
    active: row.active !== false,
    note: String(row.note || "").trim(),
  };
}

export function findDiscountCode(input, codes = loadDiscountCodes()) {
  const needle = String(input || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!needle) return null;
  return (
    codes.find((c) => c.active && c.code === needle) || null
  );
}

/**
 * Apply a code to merchandise subtotal (shipping not discounted).
 * Returns { ok, amount, label, entry, message }
 */
export function applyDiscountCode(subtotal, input, codes = loadDiscountCodes()) {
  const entry = findDiscountCode(input, codes);
  const base = Math.max(0, Number(subtotal) || 0);
  if (!String(input || "").trim()) {
    return { ok: false, amount: 0, label: "", entry: null, message: "" };
  }
  if (!entry) {
    return {
      ok: false,
      amount: 0,
      label: "",
      entry: null,
      message: "That code isn’t valid",
    };
  }
  let amount = 0;
  let label = "";
  if (entry.type === "percent") {
    amount = Math.round(base * (entry.value / 100) * 100) / 100;
    label = `${entry.code} (−${entry.value}%)`;
  } else {
    amount = Math.min(base, entry.value);
    label = `${entry.code} (−$${amount.toFixed(2)})`;
  }
  amount = Math.min(base, Math.max(0, amount));
  // Round money-ish
  amount = Math.round(amount * 100) / 100;
  return {
    ok: true,
    amount,
    label,
    entry,
    message: `Applied ${label}`,
  };
}

export function formatDiscountRule(entry) {
  if (!entry) return "";
  if (entry.type === "percent") return `${entry.value}% off`;
  return `$${Number(entry.value).toFixed(2)} off`;
}
