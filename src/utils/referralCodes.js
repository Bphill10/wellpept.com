/**
 * VIP friend-code program (allowlist only).
 *
 * Benjamin adds emails to the allowlist. Those members get:
 *   - personalCode → 20% off their own orders
 *   - shareCode → friends get 10% off; member gets the other 10% of
 *     merchandise as cash once the order is fulfilled (delivered)
 *
 * Payout method (Venmo / Zelle / crypto) is collected at signup for
 * allowlisted emails only.
 */

import { getOrderById, saveOrder } from "./automation";

const STORAGE_KEY = "wellpept-referrals-v1";

export const DEFAULT_REFERRAL_SETTINGS = {
  /** VIP’s own checkout code */
  personalDiscountPercent: 20,
  /** Half of 20% → buyer discount when using a share code */
  shareBuyerPercent: 10,
  /** Other half → cash to referrer after goods are delivered */
  shareReferrerPercent: 10,
  /** Soft cap per order (USD); 0 = no cap */
  maxCommissionPerOrder: 0,
  active: true,
  /** Emails Benjamin has approved for the dual-code + payout program */
  allowlist: [],
};

function shortHash(str) {
  let h = 2166136261;
  const s = String(str || "").toLowerCase();
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36).toUpperCase().padStart(4, "0").slice(0, 4);
}

export function normalizeEmail(email = "") {
  return String(email || "")
    .trim()
    .toLowerCase();
}

function emailBase(email) {
  const e = normalizeEmail(email);
  const local = e
    .split("@")[0]
    .replace(/[^a-z0-9]/gi, "")
    .toUpperCase()
    .slice(0, 10);
  return local.length >= 3 ? local : `WP${local || "USER"}`;
}

/** Share code friends enter — e.g. BENJAMIN-A1B2 */
export function emailToShareCode(email) {
  const e = normalizeEmail(email);
  if (!e || !e.includes("@")) return "";
  return `${emailBase(e)}-${shortHash(e)}`;
}

/** Personal 20% code — e.g. BENJAMIN20-A1B2 */
export function emailToPersonalCode(email) {
  const e = normalizeEmail(email);
  if (!e || !e.includes("@")) return "";
  return `${emailBase(e)}20-${shortHash(e)}`;
}

/** @deprecated use emailToShareCode */
export function emailToReferralCode(email) {
  return emailToShareCode(email);
}

function emptyPayout() {
  return {
    method: "venmo", // venmo | zelle | crypto
    venmo: "",
    zelle: "",
    crypto: "",
    note: "",
  };
}

function loadRaw() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveRaw(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  return state;
}

function migrateRow(row) {
  if (!row || !row.email) return null;
  const email = normalizeEmail(row.email);
  const shareCode = String(row.shareCode || row.code || "").toUpperCase();
  const personalCode = String(
    row.personalCode || emailToPersonalCode(email)
  ).toUpperCase();
  return {
    email,
    code: shareCode || emailToShareCode(email),
    shareCode: shareCode || emailToShareCode(email),
    personalCode: personalCode || emailToPersonalCode(email),
    allowlisted: row.allowlisted !== false,
    createdAt: row.createdAt || new Date().toISOString(),
    active: row.active !== false,
    payout: { ...emptyPayout(), ...(row.payout || {}) },
  };
}

export function loadReferralState() {
  const raw = loadRaw();
  const allowlist = Array.isArray(raw.settings?.allowlist)
    ? raw.settings.allowlist.map(normalizeEmail).filter(Boolean)
    : Array.isArray(raw.allowlist)
      ? raw.allowlist.map(normalizeEmail).filter(Boolean)
      : [];
  return {
    settings: {
      ...DEFAULT_REFERRAL_SETTINGS,
      ...(raw.settings || {}),
      allowlist,
      personalDiscountPercent: Math.min(
        50,
        Math.max(
          0,
          Number(
            raw.settings?.personalDiscountPercent ??
              DEFAULT_REFERRAL_SETTINGS.personalDiscountPercent
          ) || 20
        )
      ),
      shareBuyerPercent: Math.min(
        50,
        Math.max(
          0,
          Number(
            raw.settings?.shareBuyerPercent ??
              DEFAULT_REFERRAL_SETTINGS.shareBuyerPercent
          ) || 10
        )
      ),
      shareReferrerPercent: Math.min(
        50,
        Math.max(
          0,
          Number(
            raw.settings?.shareReferrerPercent ??
              raw.settings?.commissionPercent ??
              DEFAULT_REFERRAL_SETTINGS.shareReferrerPercent
          ) || 10
        )
      ),
      // keep legacy field in sync for old UI bits
      commissionPercent: Math.min(
        50,
        Math.max(
          0,
          Number(
            raw.settings?.shareReferrerPercent ??
              raw.settings?.commissionPercent ??
              10
          ) || 10
        )
      ),
    },
    codes: (Array.isArray(raw.codes) ? raw.codes : [])
      .map(migrateRow)
      .filter(Boolean),
    commissions: Array.isArray(raw.commissions) ? raw.commissions : [],
  };
}

export function saveReferralSettings(patch = {}) {
  const state = loadReferralState();
  const allowlist = Array.isArray(patch.allowlist)
    ? patch.allowlist.map(normalizeEmail).filter(Boolean)
    : state.settings.allowlist;
  const settings = {
    ...state.settings,
    personalDiscountPercent: Math.min(
      50,
      Math.max(
        0,
        Number(
          patch.personalDiscountPercent ??
            state.settings.personalDiscountPercent
        ) || 0
      )
    ),
    shareBuyerPercent: Math.min(
      50,
      Math.max(
        0,
        Number(patch.shareBuyerPercent ?? state.settings.shareBuyerPercent) || 0
      )
    ),
    shareReferrerPercent: Math.min(
      50,
      Math.max(
        0,
        Number(
          patch.shareReferrerPercent ??
            patch.commissionPercent ??
            state.settings.shareReferrerPercent
        ) || 0
      )
    ),
    maxCommissionPerOrder: Math.max(
      0,
      Number(
        patch.maxCommissionPerOrder ?? state.settings.maxCommissionPerOrder
      ) || 0
    ),
    active:
      patch.active !== undefined
        ? Boolean(patch.active)
        : state.settings.active !== false,
    allowlist,
  };
  settings.commissionPercent = settings.shareReferrerPercent;
  return saveRaw({ ...state, settings });
}

export function isAllowlisted(email, state = loadReferralState()) {
  const e = normalizeEmail(email);
  if (!e) return false;
  return (state.settings.allowlist || []).includes(e);
}

/** Add email to VIP allowlist and mint dual codes. */
export function addAllowlistEmail(email) {
  const e = normalizeEmail(email);
  if (!e || !e.includes("@")) return { ok: false, error: "Enter a valid email" };
  const state = loadReferralState();
  if (!state.settings.allowlist.includes(e)) {
    state.settings.allowlist = [...state.settings.allowlist, e];
  }
  saveRaw(state);
  const row = ensureVipMember(e);
  return { ok: true, row, state: loadReferralState() };
}

export function removeAllowlistEmail(email) {
  const e = normalizeEmail(email);
  const state = loadReferralState();
  state.settings.allowlist = (state.settings.allowlist || []).filter(
    (x) => x !== e
  );
  state.codes = state.codes.map((c) =>
    normalizeEmail(c.email) === e ? { ...c, allowlisted: false, active: false } : c
  );
  saveRaw(state);
  return loadReferralState();
}

function uniqueCode(candidate, state, email) {
  let unique = candidate;
  let n = 0;
  const e = normalizeEmail(email);
  while (
    state.codes.some(
      (c) =>
        normalizeEmail(c.email) !== e &&
        (c.shareCode === unique ||
          c.personalCode === unique ||
          c.code === unique)
    )
  ) {
    n += 1;
    unique = `${candidate}${n}`;
  }
  return unique;
}

/**
 * Mint / return VIP dual codes — only for allowlisted emails.
 */
export function ensureVipMember(email) {
  const e = normalizeEmail(email);
  if (!e || !e.includes("@")) return null;
  if (!isAllowlisted(e)) return null;

  const state = loadReferralState();
  let row = state.codes.find((c) => normalizeEmail(c.email) === e);
  if (row) {
    const next = migrateRow({ ...row, allowlisted: true, active: true });
    state.codes = state.codes.map((c) =>
      normalizeEmail(c.email) === e ? next : c
    );
    saveRaw(state);
    return next;
  }

  const shareCode = uniqueCode(emailToShareCode(e), state, e);
  const personalCode = uniqueCode(emailToPersonalCode(e), state, e);
  row = {
    email: e,
    code: shareCode,
    shareCode,
    personalCode,
    allowlisted: true,
    createdAt: new Date().toISOString(),
    active: true,
    payout: emptyPayout(),
  };
  state.codes = [row, ...state.codes];
  saveRaw(state);
  return row;
}

/** @deprecated — only mints for allowlisted VIP emails now */
export function ensureReferralCode(email) {
  return ensureVipMember(email);
}

export function saveReferralPayout(email, payout = {}) {
  const e = normalizeEmail(email);
  if (!e) return null;
  if (!isAllowlisted(e)) return null;
  const row = ensureVipMember(e);
  if (!row) return null;
  const nextState = loadReferralState();
  nextState.codes = nextState.codes.map((c) => {
    if (normalizeEmail(c.email) !== e) return c;
    return {
      ...c,
      payout: {
        ...emptyPayout(),
        ...(c.payout || {}),
        method: ["venmo", "zelle", "crypto"].includes(payout.method)
          ? payout.method
          : c.payout?.method || "venmo",
        venmo: String(payout.venmo ?? c.payout?.venmo ?? "")
          .trim()
          .replace(/^@/, ""),
        zelle: String(payout.zelle ?? c.payout?.zelle ?? "").trim(),
        crypto: String(payout.crypto ?? c.payout?.crypto ?? "").trim(),
        note: String(payout.note ?? c.payout?.note ?? "").trim(),
      },
    };
  });
  saveRaw(nextState);
  return nextState.codes.find((c) => normalizeEmail(c.email) === e) || null;
}

export function payoutDestinationSummary(payout = {}) {
  if (!payout) return "No payout method on file";
  if (payout.method === "venmo" && payout.venmo) return `Venmo @${payout.venmo}`;
  if (payout.method === "zelle" && payout.zelle) return `Zelle ${payout.zelle}`;
  if (payout.method === "crypto" && payout.crypto)
    return `Crypto ${payout.crypto}`;
  if (payout.venmo) return `Venmo @${payout.venmo}`;
  if (payout.zelle) return `Zelle ${payout.zelle}`;
  if (payout.crypto) return `Crypto ${payout.crypto}`;
  return "No payout method on file — add Venmo / Zelle / crypto";
}

export function hasPayoutDestination(payout = {}) {
  return Boolean(
    (payout.method === "venmo" && payout.venmo) ||
      (payout.method === "zelle" && payout.zelle) ||
      (payout.method === "crypto" && payout.crypto) ||
      payout.venmo ||
      payout.zelle ||
      payout.crypto
  );
}

export function venmoPayLink({ handle, amount, note }) {
  const recipients = String(handle || "").replace(/^@/, "");
  if (!recipients) return "";
  const params = new URLSearchParams({
    txn: "pay",
    audience: "private",
    recipients,
    amount: Number(amount || 0).toFixed(2),
    note: String(note || "WellPept referral").slice(0, 60),
  });
  return `https://venmo.com/?${params.toString()}`;
}

export function findByShareCode(input, state = loadReferralState()) {
  const needle = String(input || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!needle) return null;
  return (
    state.codes.find(
      (c) =>
        c.active !== false &&
        c.allowlisted !== false &&
        (c.shareCode === needle || c.code === needle)
    ) || null
  );
}

export function findByPersonalCode(input, state = loadReferralState()) {
  const needle = String(input || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!needle) return null;
  return (
    state.codes.find(
      (c) =>
        c.active !== false &&
        c.allowlisted !== false &&
        c.personalCode === needle
    ) || null
  );
}

/** @deprecated */
export function findReferralByCode(input, state = loadReferralState()) {
  return findByShareCode(input, state);
}

export function findReferralByEmail(email, state = loadReferralState()) {
  const e = normalizeEmail(email);
  if (!e) return null;
  return state.codes.find((c) => normalizeEmail(c.email) === e) || null;
}

export function orderMerchandise(order) {
  const fromTotals = Number(order?.totals?.subtotal);
  if (fromTotals > 0) return Math.round(fromTotals * 100) / 100;
  let total = 0;
  for (const ship of order?.shipments || []) {
    total += Number(ship.merchandise) || 0;
  }
  return Math.round(total * 100) / 100;
}

export function calcSharePayout(merchandise, settings = loadReferralState().settings) {
  const base = Math.max(0, Number(merchandise) || 0);
  const rate = Math.min(
    50,
    Math.max(0, Number(settings.shareReferrerPercent) || 0)
  );
  let amount = Math.round(base * (rate / 100) * 100) / 100;
  const cap = Number(settings.maxCommissionPerOrder) || 0;
  if (cap > 0) amount = Math.min(cap, amount);
  return { amount, rate, merchandise: base };
}

/**
 * Apply a VIP / friend code at checkout.
 * Returns discount + optional referral payout snapshot.
 *
 * kinds: "personal" | "share" | null
 */
export function applyVipCheckoutCode(subtotal, input, buyerEmail = "") {
  const state = loadReferralState();
  const base = Math.max(0, Number(subtotal) || 0);
  const needle = String(input || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
  if (!needle) {
    return {
      ok: false,
      kind: null,
      amount: 0,
      label: "",
      entry: null,
      referral: null,
      message: "",
    };
  }
  if (!state.settings.active) {
    return {
      ok: false,
      kind: null,
      amount: 0,
      label: "",
      entry: null,
      referral: null,
      message: "Friend-code program is paused",
    };
  }

  const buyer = normalizeEmail(buyerEmail);
  const personal = findByPersonalCode(needle, state);
  if (personal) {
    if (!buyer || buyer !== normalizeEmail(personal.email)) {
      return {
        ok: false,
        kind: "personal",
        amount: 0,
        label: "",
        entry: null,
        referral: null,
        message: "That 20% code is only for its owner — use their share code instead",
      };
    }
    const pct = state.settings.personalDiscountPercent;
    const amount = Math.round(base * (pct / 100) * 100) / 100;
    return {
      ok: true,
      kind: "personal",
      amount,
      label: `${personal.personalCode} (−${pct}% yours)`,
      entry: {
        code: personal.personalCode,
        type: "percent",
        value: pct,
        active: true,
        note: "VIP personal discount",
      },
      referral: null,
      message: `Your personal ${pct}% off code applied`,
    };
  }

  const share = findByShareCode(needle, state);
  if (share) {
    if (buyer && buyer === normalizeEmail(share.email)) {
      return {
        ok: false,
        kind: "share",
        amount: 0,
        label: "",
        entry: null,
        referral: null,
        message: `Use your personal code ${share.personalCode} for ${state.settings.personalDiscountPercent}% off — share codes are for friends`,
      };
    }
    const buyerPct = state.settings.shareBuyerPercent;
    const amount = Math.round(base * (buyerPct / 100) * 100) / 100;
    const { amount: commission, rate } = calcSharePayout(base, state.settings);
    return {
      ok: true,
      kind: "share",
      amount,
      label: `${share.shareCode} (−${buyerPct}% friend)`,
      entry: {
        code: share.shareCode,
        type: "percent",
        value: buyerPct,
        active: true,
        note: "VIP share discount",
      },
      referral: {
        ok: true,
        code: share.shareCode,
        email: share.email,
        rate,
        merchandise: base,
        profit: base,
        commission,
        message: `Friend code ${share.shareCode} — you get ${buyerPct}% off; they get ${rate}% ($${commission.toFixed(2)}) after delivery`,
      },
      message: `Friend code applied · ${buyerPct}% off · referrer earns ${rate}% after delivery`,
    };
  }

  return {
    ok: false,
    kind: null,
    amount: 0,
    label: "",
    entry: null,
    referral: null,
    message: "",
  };
}

/**
 * Legacy friend-code apply — now maps to share-code half discount + payout.
 */
export function applyReferralCode(input, cart, buyerEmail = "") {
  const subtotal = (cart || []).reduce(
    (sum, line) =>
      sum + (Number(line.price ?? line.unitPrice) || 0) * (Number(line.qty) || 1),
    0
  );
  const result = applyVipCheckoutCode(subtotal, input, buyerEmail);
  if (!result.ok || result.kind !== "share" || !result.referral) {
    return {
      ok: false,
      message: result.message || (String(input || "").trim() ? "That friend code isn’t valid" : ""),
      code: "",
      email: "",
      profit: 0,
      commission: 0,
      rate: 0,
      discountAmount: 0,
      discountPercent: 0,
    };
  }
  const r = result.referral;
  return {
    ok: true,
    code: r.code,
    email: r.email,
    profit: r.merchandise,
    commission: r.commission,
    rate: r.rate,
    discountAmount: result.amount,
    discountPercent: result.entry?.value || 0,
    message: r.message,
  };
}

export function attachReferralToOrder(order, referralApply) {
  if (!order || !referralApply?.ok) return order;
  return {
    ...order,
    referral: {
      code: referralApply.code,
      email: referralApply.email,
      rate: referralApply.rate,
      estimatedProfit: referralApply.profit,
      estimatedMerchandise: referralApply.profit,
      estimatedCommission: referralApply.commission,
      payWhen: "fulfilled",
    },
  };
}

/**
 * Lock commission when goods are delivered (order status → fulfilled).
 */
export function accrueReferralCommission(orderId) {
  const order = getOrderById(orderId);
  if (!order?.referral?.code) return null;
  if (order.referral.commissionId) return order;

  // Only after delivery / fulfill
  if (order.status !== "fulfilled") {
    return order;
  }

  const state = loadReferralState();
  const merchandise = orderMerchandise(order);
  const { amount, rate } = calcSharePayout(merchandise, state.settings);
  if (!(amount > 0)) {
    const next = {
      ...order,
      referral: {
        ...order.referral,
        merchandise,
        commission: 0,
        accruedAt: new Date().toISOString(),
        status: "zero",
      },
    };
    saveOrder(next);
    return next;
  }

  const commission = {
    id: `rc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    orderId: order.orderId,
    code: order.referral.code,
    email: order.referral.email,
    profit: merchandise,
    merchandise,
    rate,
    amount,
    status: "pending",
    createdAt: new Date().toISOString(),
    paidAt: null,
    payWhen: "fulfilled",
  };

  const referrer = findByShareCode(order.referral.code, state);
  commission.payout = referrer?.payout || emptyPayout();
  commission.payoutSummary = payoutDestinationSummary(commission.payout);

  state.commissions = [commission, ...state.commissions];
  saveRaw(state);

  const next = {
    ...order,
    referral: {
      ...order.referral,
      merchandise,
      commission: amount,
      rate,
      commissionId: commission.id,
      status: "pending",
      accruedAt: commission.createdAt,
      payoutSummary: commission.payoutSummary,
    },
  };
  saveOrder(next);

  void notifyReferralPayoutDirect(commission, next).catch(() => {});

  return next;
}

export async function notifyReferralPayoutDirect(commission, order = null) {
  const { sendTransactionalEmail } = await import("./emailClient.js");
  const amount = Number(commission.amount) || 0;
  const to = normalizeEmail(commission.email);
  if (!to || !(amount > 0)) {
    return { ok: false, error: "Missing referrer email or amount" };
  }

  const payout = commission.payout || emptyPayout();
  const dest = payoutDestinationSummary(payout);
  const venmoUrl =
    payout.method === "venmo" || payout.venmo
      ? venmoPayLink({
          handle: payout.venmo,
          amount,
          note: `WellPept referral ${commission.orderId}`,
        })
      : "";

  const subject = `You earned $${amount.toFixed(2)} · order delivered`;
  const text = [
    `Your friend’s order was delivered — your share is ready.`,
    "",
    `Amount: $${amount.toFixed(2)} USD`,
    `Order: ${commission.orderId}`,
    `Your share code: ${commission.code}`,
    `Rate: ${commission.rate}% of merchandise ($${Number(
      commission.merchandise ?? commission.profit
    ).toFixed(2)})`,
    "",
    `Payout destination on file: ${dest}`,
    payout.venmo ? `Venmo: @${payout.venmo}` : "",
    payout.zelle ? `Zelle: ${payout.zelle}` : "",
    payout.crypto ? `Crypto: ${payout.crypto}` : "",
    "",
    dest.includes("No payout")
      ? "Add Venmo, Zelle, or crypto when you create/sign in (allowlisted accounts) so we can send this directly."
      : "We’re sending this to the payout method on your account. Reply if that destination is wrong.",
    "",
    "— WellPept",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await sendTransactionalEmail({
      type: "referral_payout",
      to,
      subject,
      text,
      amount,
      orderId: commission.orderId,
      code: commission.code,
      payoutSummary: dest,
      venmoUrl,
      payout,
    });

    const state = loadReferralState();
    state.commissions = state.commissions.map((c) =>
      c.id === commission.id
        ? {
            ...c,
            emailedAt: new Date().toISOString(),
            emailStatus: "sent",
          }
        : c
    );
    saveRaw(state);

    return { ok: true, via: "resend", to };
  } catch (err) {
    const state = loadReferralState();
    state.commissions = state.commissions.map((c) =>
      c.id === commission.id
        ? {
            ...c,
            emailStatus: "failed",
            emailError: err?.message || "send failed",
          }
        : c
    );
    saveRaw(state);
    return { ok: false, error: err?.message || "send failed" };
  }
}

export function markCommissionPaid(commissionId) {
  const state = loadReferralState();
  const now = new Date().toISOString();
  let found = null;
  state.commissions = state.commissions.map((c) => {
    if (c.id !== commissionId) return c;
    found = { ...c, status: "paid", paidAt: now };
    return found;
  });
  if (!found) return null;
  saveRaw(state);

  const order = getOrderById(found.orderId);
  if (order?.referral) {
    saveOrder({
      ...order,
      referral: { ...order.referral, status: "paid", paidAt: now },
    });
  }
  return found;
}

export function commissionTotals(state = loadReferralState()) {
  let pending = 0;
  let paid = 0;
  for (const c of state.commissions || []) {
    const n = Number(c.amount) || 0;
    if (c.status === "paid") paid += n;
    else if (c.status === "pending") pending += n;
  }
  return {
    pending: Math.round(pending * 100) / 100,
    paid: Math.round(paid * 100) / 100,
  };
}

export function maskEmail(email = "") {
  const e = normalizeEmail(email);
  const [user, domain] = e.split("@");
  if (!user || !domain) return e;
  const shown = user.slice(0, 2);
  return `${shown}${"*".repeat(Math.max(1, user.length - 2))}@${domain}`;
}
