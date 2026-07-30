/**
 * Manual payout rails for pay-after-supply: Venmo, Zelle, crypto.
 * Env defaults + localStorage overrides (Admin → Payment methods).
 */

const STORAGE_KEY = "wellpept-manual-pay-v1";

export const EMPTY_MANUAL_PAY = {
  venmoHandle: "",
  zelleContact: "",
  zelleName: "",
  solanaUsdc: "",
  ethUsdc: "",
  note: "Include your order ID in the payment memo.",
};

function envDefaults() {
  return {
    venmoHandle: String(import.meta.env.VITE_VENMO_HANDLE || "").replace(/^@/, ""),
    zelleContact: String(import.meta.env.VITE_ZELLE_CONTACT || ""),
    zelleName: String(import.meta.env.VITE_ZELLE_NAME || "WellPept"),
    solanaUsdc: String(import.meta.env.VITE_CRYPTO_SOLANA_USDC || ""),
    ethUsdc: String(import.meta.env.VITE_CRYPTO_ETH_USDC || ""),
    note: String(
      import.meta.env.VITE_MANUAL_PAY_NOTE ||
        "Include your order ID in the payment memo."
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
      config.zelleContact ||
      config.solanaUsdc ||
      config.ethUsdc
  );
}

export function venmoPayUrl({ handle, amount, note }) {
  const user = String(handle || "").replace(/^@/, "").trim();
  if (!user) return "";
  const params = new URLSearchParams();
  params.set("txn", "pay");
  if (amount > 0) params.set("amount", Number(amount).toFixed(2));
  if (note) params.set("note", String(note).slice(0, 240));
  return `https://venmo.com/${encodeURIComponent(user)}?${params.toString()}`;
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
  if (config.venmoHandle) {
    lines.push(`Venmo: @${String(config.venmoHandle).replace(/^@/, "")}`);
    lines.push(`  Link: ${venmoPayUrl({ handle: config.venmoHandle, amount: total, note: orderId })}`);
  }
  if (config.zelleContact) {
    lines.push(
      `Zelle: ${config.zelleContact}${config.zelleName ? ` (${config.zelleName})` : ""}`
    );
    lines.push(`  Memo / note: ${orderId}`);
  }
  if (config.solanaUsdc) {
    lines.push(`Solana USDC: ${config.solanaUsdc}`);
    lines.push(`  Network: Solana · Memo: ${orderId}`);
  }
  if (config.ethUsdc) {
    lines.push(`Ethereum USDC: ${config.ethUsdc}`);
    lines.push(`  Network: Ethereum · Memo: ${orderId}`);
  }
  if (config.note) {
    lines.push("", config.note);
  }
  lines.push("", "After you send payment, tap “I’ve paid” on the pay page or reply to your order email.");
  return lines.join("\n");
}
