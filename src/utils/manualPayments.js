/**
 * Manual payout rails for pay-after-supply: Venmo, Zelle, crypto.
 * Env defaults + localStorage overrides (Admin → Payment methods).
 */

const STORAGE_KEY = "wellpept-manual-pay-v1";

export const EMPTY_MANUAL_PAY = {
  venmoHandle: "",
  /** Full Venmo QR/code link, e.g. https://venmo.com/code?user_id=... */
  venmoCodeUrl: "",
  /** Path or URL to Venmo QR image, e.g. /venmo-qr.png */
  venmoQrUrl: "",
  zelleContact: "",
  zelleName: "",
  /** Path or URL to Zelle QR image, e.g. /zelle-qr.png */
  zelleQrUrl: "",
  solanaUsdc: "",
  ethUsdc: "",
  note: "Include your order ID in the payment memo. Crypto: USDC or USDT only — do not send SOL, ETH, or other tokens.",
};

function envDefaults() {
  return {
    venmoHandle: String(import.meta.env.VITE_VENMO_HANDLE || "").replace(/^@/, ""),
    venmoCodeUrl: String(import.meta.env.VITE_VENMO_CODE_URL || "").trim(),
    venmoQrUrl: String(import.meta.env.VITE_VENMO_QR_URL || "").trim(),
    zelleContact: String(import.meta.env.VITE_ZELLE_CONTACT || ""),
    zelleName: String(import.meta.env.VITE_ZELLE_NAME || "WellPept"),
    zelleQrUrl: String(import.meta.env.VITE_ZELLE_QR_URL || "").trim(),
    solanaUsdc: String(import.meta.env.VITE_CRYPTO_SOLANA_USDC || ""),
    ethUsdc: String(import.meta.env.VITE_CRYPTO_ETH_USDC || ""),
    note: String(
      import.meta.env.VITE_MANUAL_PAY_NOTE ||
        "Include your order ID in the payment memo. Crypto: USDC or USDT only — do not send SOL, ETH, or other tokens."
    ),
  };
}

export function loadManualPayConfig() {
  const base = { ...EMPTY_MANUAL_PAY, ...envDefaults() };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return base;
    return { ...base, ...JSON.parse(raw) };
  } catch {
    return base;
  }
}

export function saveManualPayConfig(patch = {}) {
  const next = { ...loadManualPayConfig(), ...patch };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export function manualPayConfigured(config = loadManualPayConfig()) {
  return Boolean(
    config.venmoHandle ||
      config.venmoCodeUrl ||
      config.venmoQrUrl ||
      config.zelleContact ||
      config.solanaUsdc ||
      config.ethUsdc
  );
}

export function hasVenmo(config = loadManualPayConfig()) {
  return Boolean(config.venmoCodeUrl || config.venmoHandle || config.venmoQrUrl);
}

/** Username-style Venmo deep link. */
export function venmoHandleUrl({ handle, amount, note }) {
  const user = String(handle || "").replace(/^@/, "").trim();
  if (!user) return "";
  const params = new URLSearchParams();
  params.set("txn", "pay");
  if (amount > 0) params.set("amount", Number(amount).toFixed(2));
  if (note) params.set("note", String(note).slice(0, 240));
  return `https://venmo.com/${encodeURIComponent(user)}?${params.toString()}`;
}

/**
 * Prefer Venmo QR/code URL when set; otherwise username pay link.
 * Amount/note are appended as query params when possible.
 */
export function venmoPayUrl({
  handle,
  codeUrl,
  amount,
  note,
  config = null,
} = {}) {
  const cfg = config || {};
  const code = String(codeUrl || cfg.venmoCodeUrl || "").trim();
  const user = String(handle || cfg.venmoHandle || "").replace(/^@/, "").trim();

  if (code && /^https?:\/\/(www\.)?venmo\.com\//i.test(code)) {
    try {
      const url = new URL(code);
      if (amount > 0) url.searchParams.set("amount", Number(amount).toFixed(2));
      if (note) url.searchParams.set("note", String(note).slice(0, 240));
      if (!url.searchParams.has("txn")) url.searchParams.set("txn", "pay");
      return url.toString();
    } catch {
      return code;
    }
  }

  return venmoHandleUrl({ handle: user, amount, note });
}

export function formatManualPayText({
  orderId,
  total,
  config = loadManualPayConfig(),
}) {
  const lines = [
    `WellPept payment for order ${orderId}`,
    `Amount due: $${Number(total || 0).toFixed(2)}`,
    "",
  ];
  if (hasVenmo(config)) {
    if (config.venmoHandle) {
      lines.push(`Venmo: @${String(config.venmoHandle).replace(/^@/, "")}`);
    } else {
      lines.push("Venmo: use the payment link / QR below");
    }
    const link = venmoPayUrl({
      handle: config.venmoHandle,
      codeUrl: config.venmoCodeUrl,
      amount: total,
      note: orderId,
    });
    if (link) lines.push(`  Link: ${link}`);
  }
  if (config.zelleContact) {
    lines.push(
      `Zelle: ${config.zelleContact}${config.zelleName ? ` (${config.zelleName})` : ""}`
    );
    lines.push(`  Memo / note: ${orderId}`);
  }
  if (config.solanaUsdc) {
    lines.push(`Solana — USDC or USDT only (not SOL): ${config.solanaUsdc}`);
    lines.push(`  Network: Solana · Memo: ${orderId}`);
  }
  if (config.ethUsdc) {
    lines.push(`Ethereum — USDC or USDT only (not ETH): ${config.ethUsdc}`);
    lines.push(`  Network: Ethereum · Memo: ${orderId}`);
  }
  if (config.note) {
    lines.push("", config.note);
  }
  lines.push(
    "",
    "After you send payment, tap “I’ve paid” on the pay page or reply to your order email."
  );
  return lines.join("\n");
}
