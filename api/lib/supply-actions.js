/**
 * Server-side supply decision helpers (Node).
 * Powers one-tap Yes/No links in the ops order-request email.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import { deflateSync, inflateSync } from "node:zlib";
import {
  formatPublicLineLabel,
  formatOrderDecodeAppendix,
  orderPublicLines,
} from "./public-labels.js";

function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function actionSecret() {
  return (
    String(process.env.ORDER_ACTION_SECRET || "").trim() ||
    String(process.env.RESEND_API_KEY || "").trim() ||
    String(process.env.STRIPE_SECRET_KEY || "").trim() ||
    ""
  );
}

export function siteOriginFrom(req, fallback = "") {
  const env =
    String(process.env.VITE_SITE_URL || process.env.SITE_URL || "").trim() ||
    fallback;
  if (env) return env.replace(/\/$/, "");
  const host = req?.headers?.["x-forwarded-host"] || req?.headers?.host || "";
  const proto = req?.headers?.["x-forwarded-proto"] || "https";
  if (host) return `${proto}://${String(host).split(",")[0].trim()}`.replace(
    /\/$/,
    ""
  );
  return "https://www.wellpept.com";
}

function b64url(buf) {
  return Buffer.from(buf)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromB64url(str) {
  const s = String(str || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  return Buffer.from(s + pad, "base64");
}

function signRaw(raw) {
  const secret = actionSecret();
  if (!secret) {
    const err = new Error(
      "Missing ORDER_ACTION_SECRET (or RESEND_API_KEY / STRIPE_SECRET_KEY)"
    );
    err.status = 503;
    throw err;
  }
  return createHmac("sha256", secret).update(raw).digest("base64url");
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  if (aa.length !== bb.length) return false;
  return timingSafeEqual(aa, bb);
}

/** Pack order into a compact signed action token (URL-safe). */
export function makeSupplyToken(order, decision, ttlSec = 60 * 60 * 24 * 14) {
  const exp = Math.floor(Date.now() / 1000) + ttlSec;
  const body = {
    v: 1,
    d: decision === "no" ? "no" : "yes",
    exp,
    order,
  };
  const payload = b64url(deflateSync(Buffer.from(JSON.stringify(body), "utf8")));
  const sig = signRaw(`${payload}.${body.d}.${exp}`);
  return { payload, sig, exp, decision: body.d };
}

export function verifySupplyToken(payload, sig, decision) {
  const p = String(payload || "").trim();
  const s = String(sig || "").trim();
  const d = decision === "no" ? "no" : "yes";
  if (!p || !s) {
    const err = new Error("Missing token");
    err.status = 400;
    throw err;
  }
  let body;
  try {
    body = JSON.parse(inflateSync(fromB64url(p)).toString("utf8"));
  } catch {
    const err = new Error("Invalid token payload");
    err.status = 400;
    throw err;
  }
  if (!body?.order?.orderId || !body.exp) {
    const err = new Error("Incomplete token");
    err.status = 400;
    throw err;
  }
  if (Number(body.exp) < Math.floor(Date.now() / 1000)) {
    const err = new Error("This supply link expired. Use Admin or ask for a new email.");
    err.status = 410;
    throw err;
  }
  const tokenDecision = body.d === "no" ? "no" : "yes";
  if (tokenDecision !== d) {
    const err = new Error("Decision mismatch");
    err.status = 400;
    throw err;
  }
  const expect = signRaw(`${p}.${tokenDecision}.${body.exp}`);
  if (!safeEqual(expect, s)) {
    const err = new Error("Invalid signature");
    err.status = 403;
    throw err;
  }
  return { order: body.order, decision: tokenDecision, exp: body.exp };
}

export function buildSupplyActionUrls(origin, order) {
  const base = String(origin || "").replace(/\/$/, "");
  const yes = makeSupplyToken(order, "yes");
  const no = makeSupplyToken(order, "no");
  const mk = (tok) =>
    `${base}/api/supply-decide?d=${encodeURIComponent(tok.decision)}&p=${encodeURIComponent(tok.payload)}&s=${encodeURIComponent(tok.sig)}`;
  return {
    yesUrl: mk(yes),
    noUrl: mk(no),
    adminUrl: `${base}/undisclosed?ops=1`,
  };
}

function flattenOrderLines(order) {
  const rows = [];
  (order?.shipments || []).forEach((ship, si) => {
    (ship.lines || []).forEach((line, li) => {
      rows.push({
        key: `${si}:${li}:${line.sku || line.name || li}`,
        shipmentIndex: si,
        lineIndex: li,
        sku: line.sku || "",
        name: line.name || "",
        supplyLabel: line.supplyLabel || line.name || "",
        publicLabel: line.publicLabel || "",
        publicCode: line.publicCode || "",
        mg: line.mg,
        qty: line.qty,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        warehouseLabel: ship.warehouseLabel || ship.vendorLabel || "",
      });
    });
  });
  return rows;
}

function formatLineLabel(line) {
  return formatPublicLineLabel(line);
}

export function applySupplyDecision(
  order,
  { decision = "yes", keepKeys = null, comment = "" } = {}
) {
  if (!order?.orderId) return null;
  const note = String(comment || "").trim();
  const all = flattenOrderLines(order);
  const decidedAt = new Date().toISOString();

  if (decision === "no") {
    return {
      ...order,
      status: "declined",
      paymentDue: null,
      supplyDecision: {
        decision: "no",
        decidedAt,
        comment: note,
        via: "email_action",
        dropped: all.map((r) => ({
          key: r.key,
          label: formatLineLabel(r),
        })),
      },
      notes: note
        ? `DECLINED. Ops note: ${note}`
        : "DECLINED. Could not fulfill this request.",
    };
  }

  const keepSet =
    keepKeys == null
      ? new Set(all.map((r) => r.key))
      : new Set((keepKeys || []).map(String));
  const kept = all.filter((r) => keepSet.has(r.key));
  const dropped = all.filter((r) => !keepSet.has(r.key));
  if (!kept.length) return null;

  const isPartial = dropped.length > 0;
  const nextShipments = (order.shipments || [])
    .map((ship, si) => {
      const lines = (ship.lines || []).filter((line, li) =>
        keepSet.has(`${si}:${li}:${line.sku || line.name || li}`)
      );
      if (!lines.length) return null;
      const merchandise = money(
        lines.reduce((sum, line) => sum + (Number(line.lineTotal) || 0), 0)
      );
      return {
        ...ship,
        lines,
        merchandise,
        shippingFee: Number(ship.shippingFee) || Number(ship.shippingFlat) || 0,
        shippingFree: Boolean(ship.shippingFree),
      };
    })
    .filter(Boolean);

  const subtotal = money(
    nextShipments.reduce((sum, s) => sum + (Number(s.merchandise) || 0), 0)
  );
  const shipping = money(
    nextShipments.reduce((sum, s) => {
      if (s.shippingFree) return sum;
      return sum + (Number(s.shippingFee) || Number(s.shippingFlat) || 0);
    }, 0)
  );

  let discountAmount = 0;
  let discount = order.discount || null;
  if (discount?.code) {
    const type = String(discount.type || "").toLowerCase();
    const value = Number(discount.value);
    if (type === "percent" && value > 0) {
      discountAmount = money(subtotal * (value / 100));
    } else if (type === "fixed" && value > 0) {
      discountAmount = money(Math.min(subtotal, value));
    } else if (Number(discount.amount) > 0 && !isPartial) {
      discountAmount = money(discount.amount);
    } else if (Number(discount.amount) > 0 && isPartial) {
      const origSub = Number(order.totals?.subtotal) || subtotal;
      const ratio = origSub > 0 ? subtotal / origSub : 1;
      discountAmount = money((Number(discount.amount) || 0) * ratio);
    }
    discount = { ...discount, amount: discountAmount };
  }

  const taxable = Math.max(0, subtotal - discountAmount);
  let taxAmount = 0;
  let tax = order.tax || null;
  if (tax?.rate != null && Number(tax.rate) > 0) {
    taxAmount = money(taxable * Number(tax.rate));
    tax = { ...tax, amount: taxAmount };
  } else if (!isPartial && Number(order.totals?.tax) > 0) {
    taxAmount = money(order.totals.tax);
  }

  const total = money(taxable + taxAmount + shipping);

  return {
    ...order,
    status: "awaiting_payment",
    paymentDue: "after_supply_check",
    shipments: nextShipments,
    discount,
    tax,
    totals: {
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      shipping,
      total,
    },
    originalTotals: order.originalTotals || order.totals,
    supplyDecision: {
      decision: isPartial ? "partial" : "yes",
      decidedAt,
      comment: note,
      via: "email_action",
      kept: kept.map((r) => ({ key: r.key, label: formatLineLabel(r) })),
      dropped: dropped.map((r) => ({
        key: r.key,
        label: formatLineLabel(r),
      })),
    },
    notes: [
      isPartial
        ? "PARTIAL FULFILL. Unavailable lines removed; customer emailed updated total + pay link."
        : "SUPPLY CONFIRMED. Customer emailed pay link.",
      note ? `Ops note: ${note}` : "",
      "(via email Yes/No link)",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export function buildStripePayUrl(order, origin) {
  if (!order?.orderId) return "";
  const payload = {
    orderId: order.orderId,
    total: Number(order.totals?.total) || 0,
    customer: {
      name: order.customer?.name || "",
      email: order.customer?.email || "",
      phone: order.customer?.phone || "",
      address1: order.shipments?.[0]?.shipTo?.address1 || "",
      address2: order.shipments?.[0]?.shipTo?.address2 || "",
      city: order.shipments?.[0]?.shipTo?.city || "",
      state: order.shipments?.[0]?.shipTo?.state || "",
      zip: order.shipments?.[0]?.shipTo?.zip || "",
    },
  };
  const encoded = Buffer.from(JSON.stringify(payload), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  const base = String(origin || "").replace(/\/$/, "");
  return `${base}/?view=cart&pay=${encodeURIComponent(encoded)}`;
}

export function formatManualPayTextFromEnv({ orderId, total }) {
  const venmo = String(process.env.VITE_VENMO_HANDLE || "").replace(/^@/, "");
  const zelle = String(process.env.VITE_ZELLE_CONTACT || "").trim();
  const zelleName = String(process.env.VITE_ZELLE_NAME || "WellPept").trim();
  const sol = String(process.env.VITE_CRYPTO_SOLANA_USDC || "").trim();
  const eth = String(process.env.VITE_CRYPTO_ETH_USDC || "").trim();
  const note = String(
    process.env.VITE_MANUAL_PAY_NOTE ||
      "Include your order ID in the payment memo. Crypto: USDC or USDT only."
  ).trim();
  const amt = Number(total) || 0;
  const lines = [
    `Order ${orderId} · $${amt.toFixed(2)} due`,
    "",
  ];
  if (venmo) lines.push(`Venmo: @${venmo}`);
  if (zelle) lines.push(`Zelle: ${zelle}${zelleName ? ` (${zelleName})` : ""}`);
  if (sol) lines.push(`Solana USDC/USDT: ${sol} (5% off)`);
  if (eth) lines.push(`Ethereum USDC/USDT: ${eth} (5% off)`);
  if (note) lines.push("", note);
  return lines.join("\n");
}

export function formatCustomerDecisionEmail(order, { payUrl = "", payText = "" } = {}) {
  const decision = order?.supplyDecision?.decision || "yes";
  const comment = String(order?.supplyDecision?.comment || "").trim();
  const name = order?.customer?.name || "there";
  const lines = [
    `Hi ${name},`,
    "",
    `Re: WellPept order ${order.orderId}`,
    "",
  ];

  if (decision === "no") {
    lines.push(
      "We checked supply and unfortunately we cannot fulfill this request right now."
    );
    if (comment) lines.push("", comment);
    lines.push(
      "",
      "No payment is due. Reply to this email if you want help picking alternatives.",
      "",
      "— WellPept"
    );
    return {
      subject: `WellPept order ${order.orderId}: unable to fulfill`,
      text: lines.join("\n"),
    };
  }

  if (decision === "partial") {
    lines.push(
      "We can fulfill part of your request. Unavailable items were removed and your total was updated."
    );
    const dropped = order.supplyDecision?.dropped || [];
    if (dropped.length) {
      lines.push("", "Unavailable:");
      dropped.forEach((d) => lines.push(`  • ${d.label}`));
    }
    lines.push("", "Your order (as charged / invoiced):");
    (order.supplyDecision?.kept || []).forEach((k) =>
      lines.push(`  • ${k.label}`)
    );
  } else {
    lines.push("Good news — we confirmed supply for your order.");
    lines.push("", "Your order (as charged / invoiced):");
    orderPublicLines(order).forEach((row) =>
      lines.push(`  • ${formatPublicLineLabel(row)}`)
    );
  }

  if (comment) lines.push("", comment);

  const decode = formatOrderDecodeAppendix(order);
  if (decode) {
    lines.push("", "── After-order confirmation (please save) ──", decode);
  }

  lines.push(
    "",
    `Amount due: $${Number(order.totals?.total || 0).toFixed(2)}`,
    ""
  );
  if (payUrl) lines.push("Pay here:", payUrl, "");
  if (payText) lines.push(payText, "");
  lines.push(
    "After you pay, tap “I’ve paid” on the pay page or reply to this email.",
    "Delivery remains 2–3 weeks from payment (as accepted at checkout).",
    "",
    "— WellPept"
  );

  return {
    subject:
      decision === "partial"
        ? `WellPept order ${order.orderId}: partial confirm · pay link`
        : `WellPept order ${order.orderId}: confirmed · pay link`,
    text: lines.join("\n"),
  };
}
