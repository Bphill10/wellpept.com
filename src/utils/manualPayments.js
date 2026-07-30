/**
 * Manual payout rails for pay-after-supply: Venmo, Zelle, crypto.
 * Env defaults + localStorage overrides (Admin → Payment methods).
 */

const STORAGE_KEY = "wellpept-manual-pay-v1";

/** 5% off when paying with USDC/USDT on Solana or Ethereum. */
export const CRYPTO_PAY_DISCOUNT_RATE = 0.05;

export function cryptoPayTotal(total) {
  const base = Math.max(0, Number(total) || 0);
  return Math.round(base * (1 - CRYPTO_PAY_DISCOUNT_RATE) * 100) / 100;
}

export function cryptoPaySavings(total) {
  const base = Math.max(0, Number(total) || 0);
  return Math.round((base - cryptoPayTotal(base)) * 100) / 100;
}

export function isCryptoPayProvider(provider = "") {
  return String(provider || "").startsWith("crypto");
}

export const EMPTY_MANUAL_PAY = {
  venmoHandle: "",
  /** Full Venmo QR/code link, e.g. https://venmo.com/code?user_id=... */
  venmoCodeUrl: "",
  /** Path or URL to Venmo QR image, e.g. /venmo-qr-display.png */
  venmoQrUrl: "",
  zelleContact: "",
  zelleName: "",
  /** Path or URL to Zelle QR image, e.g. /zelle-qr.webp */
  zelleQrUrl: "",
  solanaUsdc: "",
  /** Path or URL to Solana receive QR, e.g. /solana-qr.png */
  solanaQrUrl: "",
  ethUsdc: "",
  /** Path or URL to Ethereum receive QR, e.g. /eth-qr.png */
  ethQrUrl: "",
  note: "Include your order ID in the payment memo. Crypto: USDC or USDT only. Do not send SOL, ETH, or other tokens.",
};

function envDefaults() {
  return {
    venmoHandle: String(import.meta.env.VITE_VENMO_HANDLE || "").replace(/^@/, ""),
    venmoCodeUrl: String(import.meta.env.VITE_VENMO_CODE_URL || "").trim(),
    venmoQrUrl: String(
      import.meta.env.VITE_VENMO_QR_URL || "/venmo-qr-display.png"
    ).trim() || "/venmo-qr-display.png",
    zelleContact: String(import.meta.env.VITE_ZELLE_CONTACT || ""),
    zelleName: String(import.meta.env.VITE_ZELLE_NAME || "WellPept"),
    zelleQrUrl: String(
      import.meta.env.VITE_ZELLE_QR_URL || "/zelle-qr.webp"
    ).trim() || "/zelle-qr.webp",
    solanaUsdc: String(import.meta.env.VITE_CRYPTO_SOLANA_USDC || ""),
    solanaQrUrl: String(import.meta.env.VITE_CRYPTO_SOLANA_QR_URL || "").trim(),
    ethUsdc: String(import.meta.env.VITE_CRYPTO_ETH_USDC || ""),
    ethQrUrl: String(import.meta.env.VITE_CRYPTO_ETH_QR_URL || "").trim(),
    note: String(
      import.meta.env.VITE_MANUAL_PAY_NOTE ||
        "Include your order ID in the payment memo. Crypto: USDC or USDT only. Do not send SOL, ETH, or other tokens."
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
  const amount = Number(total) || 0;
  const cryptoAmount = cryptoPayTotal(amount);
  const savings = cryptoPaySavings(amount);
  const lines = [
    `WellPept payment for order ${orderId}`,
    `Amount due (Venmo / Zelle): $${amount.toFixed(2)}`,
    `Crypto (USDC/USDT) amount: $${cryptoAmount.toFixed(2)} (5% off · save $${savings.toFixed(2)})`,
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
      amount,
      note: orderId,
    });
    if (link) lines.push(`  Link: ${link}`);
    lines.push(`  Amount: $${amount.toFixed(2)}`);
  }
  if (config.zelleContact) {
    lines.push(
      `Zelle: ${config.zelleContact}${config.zelleName ? ` (${config.zelleName})` : ""}`
    );
    lines.push(`  Memo / note: ${orderId}`);
    lines.push(`  Amount: $${amount.toFixed(2)}`);
  }
  if (config.solanaUsdc) {
    lines.push(`Solana (USDC or USDT only) (not SOL): ${config.solanaUsdc}`);
    lines.push(`  Network: Solana · Memo: ${orderId}`);
    lines.push(`  Amount: $${cryptoAmount.toFixed(2)} (5% crypto discount)`);
  }
  if (config.ethUsdc) {
    lines.push(`Ethereum (USDC or USDT only) (not ETH): ${config.ethUsdc}`);
    lines.push(`  Network: Ethereum · Memo: ${orderId}`);
    lines.push(`  Amount: $${cryptoAmount.toFixed(2)} (5% crypto discount)`);
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
