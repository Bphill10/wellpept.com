/**
 * Dropship relay helpers for @OrdersQSCbot.
 *
 * Customers pay WellPept. Ops pays the Telegram bot and places the order
 * under the ops ship-to profile. We cannot drive a third-party Telegram
 * commerce bot via API — this prepares the exact order text + deep link.
 */

export const QSC_BOT_USERNAME = "OrdersQSCbot";
export const QSC_BOT_URL = "https://t.me/OrdersQSCbot";

/** Customer retail = bot/vendor cost × 1.5 (50% markup), round up to $5. */
export const QSC_MARKUP_MULTIPLIER = 1.5;

const PROFILE_KEY = "wellpept-qsc-dropship-v1";

export const DEFAULT_DROPSHIP_PROFILE = {
  enabled: true,
  botUsername: QSC_BOT_USERNAME,
  /** 50% markup on what you pay the bot */
  markupMultiplier: QSC_MARKUP_MULTIPLIER,
  /** When true, catalog retail uses markupMultiplier (e.g. ×1.5) instead of ×2 */
  useMarkupForCatalog: false,
  shipName: "",
  shipPhone: "",
  shipEmail: "",
  shipAddress1: "",
  shipAddress2: "",
  shipCity: "",
  shipState: "",
  shipZip: "",
  shipCountry: "US",
  telegramNote: "Research use only. Confirm kit of 10 vials per line.",
};

export function loadDropshipProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...DEFAULT_DROPSHIP_PROFILE };
    return { ...DEFAULT_DROPSHIP_PROFILE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_DROPSHIP_PROFILE };
  }
}

export function saveDropshipProfile(patch) {
  const next = { ...loadDropshipProfile(), ...patch };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

export function retailFromBotCost(
  botCost,
  multiplier = QSC_MARKUP_MULTIPLIER
) {
  const marked = Math.round(Number(botCost) * Number(multiplier) * 100) / 100;
  if (!Number.isFinite(marked) || marked <= 0) return 0;
  return Math.ceil(marked / 5) * 5;
}

/** Implied bot cost from a customer retail line (inverse of 50% markup). */
export function impliedBotCost(
  retailPrice,
  multiplier = QSC_MARKUP_MULTIPLIER
) {
  const m = Number(multiplier) || QSC_MARKUP_MULTIPLIER;
  const n = Number(retailPrice) / m;
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.round(n * 100) / 100;
}

function money(n) {
  return `$${Number(n || 0).toFixed(2)}`;
}

/**
 * Build the text Benjamin pastes / sends into @OrdersQSCbot.
 * Uses ops ship-to (not the customer address).
 */
export function formatQscBotOrderText(order, profile = loadDropshipProfile()) {
  const p = profile || loadDropshipProfile();
  const mult = Number(p.markupMultiplier) || QSC_MARKUP_MULTIPLIER;
  const lines = [];

  lines.push(`ORDER RELAY ${order.orderId}`);
  lines.push(`Source: WellPept (customer already paid site)`);
  lines.push(`Bot: @${p.botUsername || QSC_BOT_USERNAME}`);
  lines.push("");
  lines.push("SHIP TO (ops — do not use customer address on bot):");
  lines.push(p.shipName || "[set your name in Admin → QSC Telegram relay]");
  if (p.shipPhone) lines.push(`Phone: ${p.shipPhone}`);
  if (p.shipEmail) lines.push(`Email: ${p.shipEmail}`);
  lines.push(
    [p.shipAddress1, p.shipAddress2].filter(Boolean).join(", ") ||
      "[set address in Admin]"
  );
  lines.push(
    `${p.shipCity || "[city]"}, ${p.shipState || "[ST]"} ${p.shipZip || "[ZIP]"}`
  );
  lines.push(p.shipCountry || "US");
  lines.push("");
  lines.push("ITEMS (kit of 10 unless noted):");

  let botTotal = 0;
  let retailTotal = 0;
  const itemRows = [];

  for (const ship of order.shipments || []) {
    for (const line of ship.lines || []) {
      const qty = Number(line.qty) || 1;
      const retail = Number(line.unitPrice) || 0;
      // Prefer stored vendorCost if present on raw cart; else invert markup
      const unitBot =
        line.vendorCost != null && Number(line.vendorCost) > 0
          ? Number(line.vendorCost)
          : impliedBotCost(retail, mult);
      const lineBot = unitBot * qty;
      botTotal += lineBot;
      retailTotal += retail * qty;
      const strength =
        line.mg != null && Number(line.mg) > 0 ? ` ${line.mg}mg` : "";
      itemRows.push(
        `• ${qty}× ${line.name}${strength} (SKU ${line.sku}) — pay bot ~${money(lineBot)} · customer paid ${money(retail * qty)}`
      );
    }
  }

  lines.push(...itemRows);
  lines.push("");
  lines.push(`Est. pay @${p.botUsername || QSC_BOT_USERNAME}: ${money(botTotal)}`);
  lines.push(
    `Customer paid (merchandise): ${money(
      order.totals?.subtotal ?? retailTotal
    )}`
  );
  lines.push(
    `Your markup target: ${Math.round((mult - 1) * 100)}% on bot cost`
  );
  if (order.totals?.shipping) {
    lines.push(
      `Customer shipping collected: ${money(order.totals.shipping)} (keep / cover bot ship separately)`
    );
  }
  lines.push("");
  if (p.telegramNote) lines.push(`Note: ${p.telegramNote}`);
  lines.push(
    "Place this order on the bot under YOUR info, then ship/forward to the customer after it arrives."
  );

  return {
    text: lines.join("\n"),
    botTotal,
    retailMerchandise: order.totals?.subtotal ?? retailTotal,
    multiplier: mult,
  };
}

export function qscBotOpenUrl(profile = loadDropshipProfile()) {
  const user = String(profile?.botUsername || QSC_BOT_USERNAME).replace(
    /^@/,
    ""
  );
  return `https://t.me/${user}`;
}

export async function copyAndOpenQscBot(order, profile = loadDropshipProfile()) {
  const formatted = formatQscBotOrderText(order, profile);
  try {
    await navigator.clipboard.writeText(formatted.text);
  } catch {
    window.prompt("Copy this into the Telegram bot chat", formatted.text);
  }
  window.open(qscBotOpenUrl(profile), "_blank", "noopener,noreferrer");
  return formatted;
}
