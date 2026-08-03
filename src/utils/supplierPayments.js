/**
 * Ops: pay peptide suppliers (wire / USDT) after the customer pays WellPept.
 * Stripe Connect is not used — China / Telegram suppliers take crypto or wire.
 */

import { RETAIL_MULTIPLIER } from "../data/products";
import { WAREHOUSES } from "../data/warehouses";
import { getOrderById, saveOrder } from "./automation";
import { accrueReferralCommission } from "./referralCodes";

const SUPPLIER_PAY_KEY = "wellpept-supplier-pay-v1";

export const DEFAULT_SUPPLIER_PAY = {
  /** Warehouse A (JEC US) */
  A: {
    label: "Warehouse A (JEC)",
    method: "usdt_trc20",
    usdtTrc20: "",
    usdtSolana: "",
    usdtEth: "",
    wireNote: "",
    contact: "",
    telegram: "",
  },
  /** Warehouse B (Changsha / STG) */
  B: {
    label: "Warehouse B (Changsha / STG)",
    method: "usdt_trc20",
    usdtTrc20: "",
    usdtSolana: "",
    usdtEth: "",
    wireNote: "",
    contact: "",
    telegram: "",
  },
  note: "Pay supplier cost as soon as the customer pays — then place the PO.",
};

function env(name) {
  try {
    return String(import.meta.env?.[name] || "").trim();
  } catch {
    return "";
  }
}

export function loadSupplierPayConfig() {
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem(SUPPLIER_PAY_KEY) || "{}") || {};
  } catch {
    saved = {};
  }
  return {
    ...DEFAULT_SUPPLIER_PAY,
    ...saved,
    A: {
      ...DEFAULT_SUPPLIER_PAY.A,
      ...(saved.A || {}),
      usdtTrc20:
        saved.A?.usdtTrc20 || env("VITE_SUPPLIER_A_USDT_TRC20") || "",
      usdtSolana:
        saved.A?.usdtSolana || env("VITE_SUPPLIER_A_USDT_SOL") || "",
      contact: saved.A?.contact || env("VITE_SUPPLIER_A_CONTACT") || "",
      telegram: saved.A?.telegram || env("VITE_SUPPLIER_A_TELEGRAM") || "",
    },
    B: {
      ...DEFAULT_SUPPLIER_PAY.B,
      ...(saved.B || {}),
      usdtTrc20:
        saved.B?.usdtTrc20 || env("VITE_SUPPLIER_B_USDT_TRC20") || "",
      usdtSolana:
        saved.B?.usdtSolana || env("VITE_SUPPLIER_B_USDT_SOL") || "",
      contact: saved.B?.contact || env("VITE_SUPPLIER_B_CONTACT") || "",
      telegram: saved.B?.telegram || env("VITE_SUPPLIER_B_TELEGRAM") || "",
    },
    note: saved.note || DEFAULT_SUPPLIER_PAY.note,
  };
}

export function saveSupplierPayConfig(config) {
  const next = {
    ...DEFAULT_SUPPLIER_PAY,
    ...config,
    A: { ...DEFAULT_SUPPLIER_PAY.A, ...(config?.A || {}) },
    B: { ...DEFAULT_SUPPLIER_PAY.B, ...(config?.B || {}) },
  };
  localStorage.setItem(SUPPLIER_PAY_KEY, JSON.stringify(next));
  return next;
}

export function supplierPayConfigured(config = loadSupplierPayConfig()) {
  return ["A", "B"].some((id) => {
    const c = config[id] || {};
    return Boolean(
      c.usdtTrc20 || c.usdtSolana || c.usdtEth || c.wireNote || c.contact
    );
  });
}

/** Estimate vendor cost if missing from the line (retail ÷ multiplier). */
export function estimateVendorCost(line) {
  const explicit = Number(line?.vendorCost);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  const unit = Number(line?.unitPrice ?? line?.price);
  if (Number.isFinite(unit) && unit > 0 && RETAIL_MULTIPLIER > 0) {
    return Math.round((unit / RETAIL_MULTIPLIER) * 100) / 100;
  }
  return 0;
}

/**
 * Build purchase-order lanes for an order (what you owe each warehouse).
 */
export function buildSupplierPo(order) {
  const lanes = new Map();

  for (const ship of order?.shipments || []) {
    const whId = ship.warehouseId || "B";
    if (!lanes.has(whId)) {
      lanes.set(whId, {
        warehouseId: whId,
        warehouseLabel:
          ship.warehouseLabel || WAREHOUSES[whId]?.label || `Warehouse ${whId}`,
        vendorId: ship.vendorId || WAREHOUSES[whId]?.vendorId || "",
        lines: [],
        costTotal: 0,
        estimated: false,
      });
    }
    const lane = lanes.get(whId);
    for (const line of ship.lines || []) {
      const qty = Number(line.qty) || 1;
      const unitCost = estimateVendorCost(line);
      const estimated =
        !(Number(line.vendorCost) > 0) && Number(line.unitPrice) > 0;
      const lineCost = Math.round(unitCost * qty * 100) / 100;
      lane.lines.push({
        sku: line.sku,
        name: line.name || line.supplyLabel || line.publicLabel,
        qty,
        unitCost,
        lineCost,
        estimated,
      });
      lane.costTotal = Math.round((lane.costTotal + lineCost) * 100) / 100;
      if (estimated) lane.estimated = true;
    }
  }

  return [...lanes.values()].filter((l) => l.lines.length > 0);
}

export function supplierLaneStatus(order, warehouseId) {
  return order?.supplierPay?.[warehouseId]?.status || "unpaid";
}

export function allSuppliersPaid(order) {
  const po = buildSupplierPo(order);
  if (!po.length) return false;
  return po.every((lane) => {
    const st = supplierLaneStatus(order, lane.warehouseId);
    return st === "paid" || st === "ordered";
  });
}

export function formatSupplierPayInstructions({
  lane,
  config = loadSupplierPayConfig(),
  orderId = "",
}) {
  const wh = config[lane.warehouseId] || {};
  const amount = Number(lane.costTotal) || 0;
  const lines = [
    `SUPPLIER PAY · ${lane.warehouseLabel}`,
    orderId ? `Order: ${orderId}` : "",
    `Amount: $${amount.toFixed(2)} USD` +
      (lane.estimated ? " (estimated from retail)" : ""),
    "",
    ...lane.lines.map(
      (l) =>
        `• ${l.qty}× ${l.name} (${l.sku || "—"}) @ $${Number(l.unitCost).toFixed(2)} = $${Number(l.lineCost).toFixed(2)}`
    ),
    "",
  ].filter(Boolean);

  if (wh.usdtTrc20) lines.push(`USDT (TRC20): ${wh.usdtTrc20}`);
  if (wh.usdtSolana) lines.push(`USDT (Solana): ${wh.usdtSolana}`);
  if (wh.usdtEth) lines.push(`USDT (ETH/ERC20): ${wh.usdtEth}`);
  if (wh.wireNote) lines.push(`Wire: ${wh.wireNote}`);
  if (wh.contact) lines.push(`Contact: ${wh.contact}`);
  if (wh.telegram) lines.push(`Telegram: ${wh.telegram}`);
  if (config.note) {
    lines.push("", config.note);
  }
  lines.push("", `Memo / reference: ${orderId || "WP order"}`);
  return lines.join("\n");
}

/**
 * Mark one warehouse lane paid to supplier (funds sent).
 * When every lane is paid → order status becomes `ordered`.
 */
export function markSupplierLanePaid(
  orderId,
  warehouseId,
  { method = "", txRef = "", note = "", amount = null } = {}
) {
  const existing = getOrderById(orderId);
  if (!existing) return null;

  const po = buildSupplierPo(existing);
  const lane = po.find((l) => l.warehouseId === warehouseId);
  const payAmount =
    amount != null && Number(amount) > 0
      ? Number(amount)
      : lane?.costTotal || 0;

  const supplierPay = {
    ...(existing.supplierPay || {}),
    [warehouseId]: {
      status: "paid",
      amount: payAmount,
      method: method || "usdt",
      txRef: String(txRef || "").trim(),
      note: String(note || "").trim(),
      paidAt: new Date().toISOString(),
    },
  };

  const next = {
    ...existing,
    supplierPay,
  };

  const allPaid = buildSupplierPo(next).every((l) => {
    const st = next.supplierPay?.[l.warehouseId]?.status;
    return st === "paid" || st === "ordered";
  });

  if (allPaid) {
    next.status = "ordered";
    next.orderedAt = new Date().toISOString();
    // Promote all lanes to ordered
    for (const l of buildSupplierPo(next)) {
      next.supplierPay[l.warehouseId] = {
        ...next.supplierPay[l.warehouseId],
        status: "ordered",
        orderedAt: next.orderedAt,
      };
    }
  }

  saveOrder(next);
  return next;
}

export function markOrderFulfilled(orderId) {
  const existing = getOrderById(orderId);
  if (!existing) return null;
  const next = {
    ...existing,
    status: "fulfilled",
    fulfilledAt: new Date().toISOString(),
  };
  saveOrder(next);
  // VIP share payout: send referrer their half once goods are delivered
  return accrueReferralCommission(orderId) || next;
}
