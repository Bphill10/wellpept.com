/** Marketplace automation helpers. keep human gates only where required. */

import {
  isHghCompound,
  resolveVialMl,
  resolveVialUnit,
} from "./vialArt";
import {
  WAREHOUSES,
  warehouseForVendorId,
  cartShippingBreakdown,
} from "../data/warehouses";
import {
  resolvePublicLabels,
  formatPublicLineLabel,
  formatOrderDecodeAppendix,
  orderPublicLines,
} from "../data/publicLabels";

const SETTINGS_KEY = "wellpept-automation-v1";

export const DEFAULT_AUTOMATION = {
  /** Already-approved vendors: new price-list lines publish immediately. */
  autoApproveTrustedUpdates: true,
  /** Approving a vendor also approves their pending lines. */
  approveVendorPublishesLines: true,
  /** Auto-suggest BAC water when opening calculator from a product. */
  autoSuggestBacFromProduct: true,
};

export function loadAutomationSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_AUTOMATION };
    return { ...DEFAULT_AUTOMATION, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_AUTOMATION };
  }
}

export function saveAutomationSettings(settings) {
  const next = { ...DEFAULT_AUTOMATION, ...settings };
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

/** US ZIP / ZIP+4 only. */
export function isValidUsZip(zip) {
  return /^\d{5}(-\d{4})?$/.test(String(zip || "").trim());
}

/** Public dose units: mg, or IU for HGH only. Legacy mcg/ug → mg. */
export function normalizeDoseUnit(dose, doseUnit, name = "") {
  const raw = String(doseUnit || "mg").trim();
  if (/^(mcg|ug|µg)$/i.test(raw)) {
    return { dose: Number(dose) / 1000, doseUnit: "mg" };
  }
  if (/^iu$/i.test(raw)) {
    // IU only for HGH; empty name trusts an already-resolved IU from catalog
    if (!name || isHghCompound(name)) {
      return { dose: Number(dose), doseUnit: "IU" };
    }
    return { dose: Number(dose), doseUnit: "mg" };
  }
  return { dose: Number(dose), doseUnit: "mg" };
}

export function defaultResearchDose(mass, unit = "mg", name = "") {
  const massN = Number(mass) || 0;
  const resolved = resolveVialUnit({ name, unit });
  const n = String(name || "")
    .toLowerCase()
    .replace(/[·•]/g, ".")
    .replace(/\s+/g, " ")
    .trim();

  if (resolved === "IU") {
    return { dose: massN >= 100 ? 5 : 2, doseUnit: "IU" };
  }

  // Peptide + vial-size aware research dose defaults (mg)
  let dose = 0.25;
  if (n.includes("retatrutide") || n === "reta") {
    dose = massN >= 30 ? 2 : 1;
  } else if (n.includes("tirzepatide") || n.startsWith("triz")) {
    dose = massN >= 10 ? 2.5 : 1;
  } else if (n.includes("wolverine") || (n.includes("bpc") && n.includes("tb"))) {
    dose = 0.25;
  } else if (n.includes("bpc")) {
    dose = 0.25;
  } else if (
    n.includes("tb-4") ||
    n.includes("tb4") ||
    n.includes("tb-500") ||
    n.includes("tb500") ||
    n.includes("thymosin")
  ) {
    dose = 0.25;
  } else if (n.includes("ipamorelin") || n.includes("cjc")) {
    dose = 0.1;
  } else if (n.includes("tesamorelin") || n.startsWith("tesa")) {
    dose = 1;
  } else if (n.includes("nad")) {
    dose = massN >= 500 ? 100 : massN >= 100 ? 50 : Math.min(50, Math.max(0.25, massN));
  } else if (n.includes("glutathione") || n.includes("gluta")) {
    dose = massN >= 600 ? 200 : 100;
  } else if (n.includes("klow")) {
    // Reference KLOW label: 2.5 mg @ 10 u → 3.2 mL BAC on 80 mg vial
    dose = 2.5;
  } else if (n.includes("semax") || n.includes("selank")) {
    dose = 0.3;
  } else if (n.includes("mots")) {
    dose = 5;
  } else if (n.includes("epithalon") || n.includes("epitalon")) {
    dose = 0.5;
  } else if (n.includes("ghk")) {
    dose = 1;
  } else if (n.includes("pt-141") || n.includes("pt141") || n.includes("pt 141")) {
    dose = 1;
  } else if (n.includes("ss-31") || n.includes("ss.31") || n.includes("ss31")) {
    dose = 5;
  } else if (massN >= 10) {
    dose = 1;
  } else {
    dose = 0.25;
  }

  if (massN > 0 && dose > massN) dose = massN;
  return { dose: Number(parseFloat(dose.toFixed(4))), doseUnit: "mg" };
}

/**
 * All calculator / label defaults from the chosen peptide + available dosage.
 * Unit, vial mL, research dose, BAC, concentration, and dose range.
 */
export function defaultsFromCatalogSelection({
  name = "",
  mass = "",
  unit = "mg",
  vialMl,
  form = "",
  desiredUnits = 10,
  dose: seedDose,
  doseUnit: seedDoseUnit,
  solution: seedSolution,
} = {}) {
  const massN = Number(mass) || 0;
  const resolvedUnit = resolveVialUnit({ name, unit, form });
  const resolvedMl = resolveVialMl({ name, form, vialMl });
  const research =
    seedDose != null && String(seedDose) !== ""
      ? normalizeDoseUnit(seedDose, seedDoseUnit || resolvedUnit, name)
      : defaultResearchDose(massN, resolvedUnit, name);

  // Force dose unit to match vial unit rules
  const doseUnit = resolvedUnit === "IU" ? "IU" : "mg";
  const dose =
    doseUnit === research.doseUnit
      ? research.dose
      : defaultResearchDose(massN, resolvedUnit, name).dose;

  const bac =
    seedSolution != null && String(seedSolution) !== ""
      ? Number(seedSolution)
      : suggestedBacMl(massN, dose, doseUnit, desiredUnits, name);
  const bacNum =
    bac != null && Number.isFinite(Number(bac))
      ? Number(Number(bac).toFixed(2))
      : null;
  const bacWater = bacNum != null ? `${bacNum} mL` : "";
  const concentration =
    bacNum > 0
      ? resolvedUnit === "IU"
        ? `${Number((massN / bacNum).toFixed(2))} IU/mL`
        : `${Number((massN / bacNum).toFixed(2))} mg/mL`
      : "";
  const doseRange = formatDoseRangeLabel(dose, doseUnit, desiredUnits);

  return {
    name,
    mass: massN,
    unit: resolvedUnit,
    vialMl: resolvedMl,
    dose,
    doseUnit,
    solution: bacNum != null ? String(bacNum) : "",
    bacWater,
    concentration,
    doseRange,
    desiredUnits,
  };
}

/** Label-style dose range: "2.5 - 5 mg (10 - 20 u)" */
export function formatDoseRangeLabel(dose, doseUnit, units = 10) {
  const low = Number(dose);
  if (!(low > 0)) return "—";
  const high = low * 2;
  const uHigh = Number(units) * 2;
  const fmt = (n) => parseFloat(Number(n).toFixed(2)).toString();
  const unit = doseUnit === "IU" ? "IU" : "mg";
  // Same " - " spacing on both lines so dashes can stack-align on the label
  return `${fmt(low)} - ${fmt(high)} ${unit} (${units} - ${uHigh} u)`;
}

export function buildCalculatorShareUrl({
  origin = typeof window !== "undefined" ? window.location.origin : "",
  pathname = typeof window !== "undefined" ? window.location.pathname : "/",
  name = "",
  mass = "",
  solution = "",
  dose = "",
  doseUnit = "mg",
  unit = "",
} = {}) {
  const normalized = normalizeDoseUnit(dose, doseUnit, name);
  const resolvedUnit = resolveVialUnit({ name, unit });
  const params = new URLSearchParams({
    view: "calculator",
    name: String(name || ""),
    mass: String(mass || ""),
    solution: String(solution || ""),
    dose: String(normalized.dose ?? ""),
    doseUnit: normalized.doseUnit,
  });
  if (resolvedUnit) params.set("unit", resolvedUnit);
  return `${origin}${pathname}?${params.toString()}`;
}

/** Suggested BAC / concentration / dose fields. same math as the calculator. */
export function resolveCalculatorLabelFields({
  name = "",
  mass = "",
  unit = "mg",
  sku = "",
  bacWater = "",
  concentration = "",
  doseRange = "",
  qrPayload = "",
  vialMl,
  form = "",
} = {}) {
  const defaults = defaultsFromCatalogSelection({
    name,
    mass,
    unit,
    vialMl,
    form,
  });

  return {
    bacWater: bacWater || defaults.bacWater,
    concentration: concentration || defaults.concentration,
    doseRange: doseRange || defaults.doseRange,
    dose: defaults.dose,
    doseUnit: defaults.doseUnit,
    solution: defaults.solution,
    unit: defaults.unit,
    vialMl: defaults.vialMl,
    qrPayload:
      qrPayload ||
      buildCalculatorShareUrl({
        name,
        mass,
        solution: defaults.solution,
        dose: defaults.dose,
        doseUnit: defaults.doseUnit,
        unit: defaults.unit,
      }),
  };
}

/** Suggested BAC so dose lands on `units` on a U-100 syringe. */
export function suggestedBacMl(massMg, dose, doseUnit, units = 10, name = "") {
  const massN = Number(massMg);
  const unitsN = Number(units);
  const { dose: doseN, doseUnit: unit } = normalizeDoseUnit(
    dose,
    doseUnit,
    name
  );
  if (!(massN > 0 && doseN > 0 && unitsN > 0)) return null;

  // IU vials: mass and dose are both in IU (e.g. HGH).
  if (unit === "IU") {
    const iuPerUnit = doseN / unitsN;
    if (!(iuPerUnit > 0)) return null;
    return massN / iuPerUnit / 100;
  }

  const doseMcg = doseN * 1000;
  if (!(doseMcg > 0)) return null;
  const mcgPerUnit = doseMcg / unitsN;
  const totalUnits = (massN * 1000) / mcgPerUnit;
  return totalUnits / 100;
}

export function createOrderId() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `WP-${t}-${r}`;
}

export const ORDER_NOTIFY_EMAIL = "info@wellpept.com";

/**
 * Build a drop-ship order packet grouped by vendor.
 * Never includes vendor storefront URLs. admin/ops relay only.
 * Default status is awaiting_supply_review (no payment yet).
 */
export function buildOrderPacket({
  orderId,
  customer,
  cart,
  subtotal,
  shipping,
  total,
  discount = null,
  tax = null,
  status = "awaiting_supply_review",
  waitConsent = false,
}) {
  const shipBreak = cartShippingBreakdown(cart);
  const feeByWarehouse = new Map(
    (shipBreak.lines || []).map((row) => [row.warehouseId, row])
  );

  // Group by customer warehouse (A/B). Ops still get vendorId internally.
  const byWarehouse = new Map();
  for (const line of cart) {
    const wh =
      (line.warehouseId && WAREHOUSES[line.warehouseId]) ||
      warehouseForVendorId(line.vendorId);
    const groupKey = wh?.id || line.vendorId || "other";
    if (!byWarehouse.has(groupKey)) {
      const feeRow = feeByWarehouse.get(groupKey);
      byWarehouse.set(groupKey, {
        warehouseId: wh?.id || groupKey,
        warehouseLabel: wh?.label || "US shipping",
        vendorId: line.vendorId,
        vendor: "",
        shippingFlat: feeRow?.flat ?? (Number(line.shippingFlat) || 0),
        shippingFee: feeRow?.fee ?? (Number(line.shippingFlat) || 0),
        shippingFree: Boolean(feeRow?.free),
        minOrder: wh?.minOrder ?? (Number(line.minOrder) || 0),
        shippingNote: wh?.shippingNote || line.shippingNote || "",
        delivery: wh?.delivery || feeRow?.delivery || "",
        lines: [],
        merchandise: 0,
      });
    }
    const group = byWarehouse.get(groupKey);
    const labels = resolvePublicLabels(line);
    group.lines.push({
      sku: line.sku,
      name: line.name,
      supplyLabel: line.supplyLabel || labels.supplyLabel,
      publicLabel: line.publicLabel || labels.publicLabel,
      publicCode: line.publicCode || labels.publicCode,
      mg: line.mg,
      form: line.form,
      qty: line.qty,
      unitPrice: line.price,
      lineTotal: line.price * line.qty,
      warehouseId: wh?.id || "",
      warehouseLabel: wh?.label || "",
      // Ops-only cost basis (what you pay supply / Telegram bot)
      vendorCost:
        line.vendorCost != null && Number(line.vendorCost) > 0
          ? Number(line.vendorCost)
          : null,
      // Ops-only: warehouse lane / fallback marker
      supplyLane: line.supplyLane || (wh ? `warehouse-${wh.id.toLowerCase()}` : "primary"),
      replacedSku: line.replacedSku || "",
    });
    group.merchandise += line.price * line.qty;
    if (String(line.supplyLane || "").includes("fallback")) {
      group.supplyLane = line.supplyLane;
    }
  }

  const shipments = [...byWarehouse.values()]
    .sort((a, b) => {
      const ra = WAREHOUSES[a.warehouseId]?.rank ?? 50;
      const rb = WAREHOUSES[b.warehouseId]?.rank ?? 50;
      return ra - rb;
    })
    .map((g) => ({
      ...g,
      supplyLane: g.supplyLane || `warehouse-${String(g.warehouseId || "").toLowerCase()}`,
      vendorLabel: g.warehouseLabel || "Warehouse",
      shipTo: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone || "",
        address1: customer.address1,
        address2: customer.address2 || "",
        city: customer.city,
        state: customer.state,
        zip: customer.zip,
        country: "US",
      },
    }));

  const discountAmount = Number(discount?.amount) || 0;
  const discountCode = discount?.code || "";
  const taxAmount = Number(tax?.amount) || 0;
  const shippingTotal =
    shipping != null && Number.isFinite(Number(shipping))
      ? Number(shipping)
      : shipBreak.total;

  return {
    orderId,
    createdAt: new Date().toISOString(),
    status,
    channel: "wellpept",
    shipCountry: "US",
    waitConsent: Boolean(waitConsent),
    waitConsentAt: waitConsent ? new Date().toISOString() : null,
    paymentDue: status === "awaiting_supply_review" ? "after_supply_check" : null,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
      userId: customer.userId || "",
    },
    discount: discountCode
      ? {
          code: discountCode,
          amount: discountAmount,
          label: discount?.label || discountCode,
          type: discount?.type || "",
          value: discount?.value ?? null,
        }
      : null,
    tax: tax?.state
      ? {
          state: tax.state,
          rate: tax.rate || 0,
          amount: taxAmount,
          label: tax.label || `${tax.state} sales tax`,
        }
      : null,
    totals: {
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      shipping: shippingTotal,
      total,
    },
    shippingBreakdown: shipBreak.lines,
    shipments,
    notes:
      "ORDER REQUEST. Check supply first. Do not charge until confirmed. Reply to customer within 24 hours with payment instructions. Shipping is per warehouse (A: 7–10 days; B: 2–4 weeks). Drop-ship via Wellpept only. Do not share supply storefront links or supplier names with the customer.",
  };
}

export function formatOrderPacketText(packet) {
  const lines = [
    `WELLPEPT ORDER REQUEST ${packet.orderId}`,
    `Status: ${packet.status || "awaiting_supply_review"}`,
    `Created ${packet.createdAt}`,
    `Customer: ${packet.customer.name} <${packet.customer.email}>`,
  ];
  if (packet.customer?.userId) {
    lines.push(`User ID: ${packet.customer.userId}`);
  }
  lines.push(`Ship: US only`);
  const disc = Number(packet.totals?.discount) || 0;
  const taxAmt = Number(packet.totals?.tax) || 0;
  if (disc > 0 || packet.discount?.code) {
    lines.push(
      `Discount: ${packet.discount?.label || packet.discount?.code || "code"} (−$${disc.toFixed(2)})`
    );
  }
  if (taxAmt > 0 || packet.tax?.state) {
    lines.push(
      `Sales tax (${packet.tax?.label || packet.tax?.state || "state"}): $${taxAmt.toFixed(2)}`
    );
  }
  lines.push(
    `Quoted: subtotal $${Number(packet.totals.subtotal || 0).toFixed(2)}` +
      (disc > 0 ? ` − discount $${disc.toFixed(2)}` : "") +
      (taxAmt > 0 ? ` + tax $${taxAmt.toFixed(2)}` : "") +
      ` + ship $${Number(packet.totals.shipping || 0).toFixed(2)}` +
      ` = $${Number(packet.totals.total || 0).toFixed(2)} (NOT paid yet unless status is paid)`
  );
  if (packet.waitConsent) {
    const windows =
      (packet.shippingBreakdown || [])
        .map((r) => `${r.label}: ${r.delivery}`)
        .join(" · ") || "Warehouse A: 7–10 days · B: 2–4 weeks";
    lines.push(`Wait consent: YES. Customer accepts ${windows}`);
  }
  lines.push("");
  for (const ship of packet.shipments) {
    lines.push(
      `── ${ship.warehouseLabel || ship.vendorLabel || "Shipment"} ──`
    );
    if (ship.delivery) {
      lines.push(`Delivery: ${ship.delivery}`);
    }
    if (ship.supplyLane) {
      lines.push(`Ops lane: ${ship.supplyLane} · vendorId ${ship.vendorId || "—"}`);
    }
    lines.push(
      `Ship to: ${ship.shipTo.name}, ${ship.shipTo.address1}${
        ship.shipTo.address2 ? `, ${ship.shipTo.address2}` : ""
      }, ${ship.shipTo.city}, ${ship.shipTo.state} ${ship.shipTo.zip}`
    );
    if (ship.shippingNote) lines.push(`Note: ${ship.shippingNote}`);
    for (const line of ship.lines) {
      const strength =
        line.mg != null && Number(line.mg) > 0 ? ` (${line.mg}mg)` : "";
      const replaced = line.replacedSku ? ` (was ${line.replacedSku})` : "";
      const supplyName = line.supplyLabel || line.name;
      const publicBit =
        line.publicLabel && line.publicLabel !== supplyName
          ? ` · public: ${line.publicLabel}${
              line.publicCode ? ` [${line.publicCode}]` : ""
            }`
          : "";
      lines.push(
        `  ${line.qty}× ${line.sku} ${supplyName}${strength}${replaced} @ $${line.unitPrice.toFixed(2)} = $${line.lineTotal.toFixed(2)}${publicBit}`
      );
    }
    const shipFee =
      ship.shippingFee != null ? Number(ship.shippingFee) : Number(ship.shippingFlat) || 0;
    lines.push(
      `  Merchandise $${ship.merchandise.toFixed(2)} · Ship $${shipFee.toFixed(2)}${
        ship.shippingFree ? " (free)" : ""
      }`
    );
    lines.push("");
  }

  const decode = formatOrderDecodeAppendix(packet);
  if (decode) {
    lines.push("── DECODE (customer invoice ↔ supply) ──");
    lines.push(decode);
    lines.push("");
  }

  lines.push(packet.notes);
  if (packet.payment?.paymentIntentId) {
    lines.push(
      `Payment: ${packet.payment.provider || "Stripe"} ${packet.payment.paymentIntentId} (${packet.payment.status})`
    );
  } else {
    lines.push(
      "Payment: PENDING. Email customer within 24h after supply check."
    );
  }
  return lines.join("\n");
}

  /** Notify ops at info@wellpept.com. Resend when configured, else mailto. */
export async function notifyOrderRequest(packet) {
  const body = formatOrderPacketText(packet);
  const subject = `WellPept order request ${packet.orderId}: supply check`;
  const siteOrigin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : "";

  try {
    const { fetchEmailConfig, sendTransactionalEmail, openMailto } = await import(
      "./emailClient"
    );
    const cfg = await fetchEmailConfig();
    if (cfg?.enabled) {
      await sendTransactionalEmail({
        type: "order_request",
        subject,
        text: body,
        replyTo: packet?.customer?.email || undefined,
        order: packet,
        siteOrigin:
          siteOrigin ||
          String(import.meta.env.VITE_SITE_URL || "").replace(/\/$/, "") ||
          "https://www.wellpept.com",
      });
      return { ok: true, via: "resend" };
    }
    const mailto = openMailto({
      to: ORDER_NOTIFY_EMAIL,
      subject,
      body,
    });
    return { ok: true, via: "mailto", mailto };
  } catch (err) {
    try {
      const { openMailto } = await import("./emailClient");
      const mailto = openMailto({
        to: ORDER_NOTIFY_EMAIL,
        subject,
        body,
      });
      return { ok: false, via: "mailto", mailto, error: err?.message };
    } catch {
      return { ok: false, error: err?.message || "notify failed" };
    }
  }
}

const ORDERS_KEY = "wellpept-orders-v1";

export function loadOrders() {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrder(packet) {
  const prev = loadOrders();
  const next = [packet, ...prev.filter((o) => o.orderId !== packet.orderId)].slice(
    0,
    50
  );
  localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
  return next;
}

export function getOrderById(orderId) {
  const id = String(orderId || "").trim();
  if (!id) return null;
  return loadOrders().find((o) => o.orderId === id) || null;
}

/** Mark an existing order paid after Stripe confirms. */
export function markOrderPaid(orderId, payment = {}) {
  const existing = getOrderById(orderId);
  if (!existing) return null;
  const next = {
    ...existing,
    status: "paid",
    paymentDue: null,
    paidAt: new Date().toISOString(),
    payment: {
      provider: payment.provider || "stripe",
      paymentIntentId: payment.id || payment.paymentIntentId || "",
      status: payment.status || "succeeded",
      amountCents: payment.amount || payment.amountCents || null,
      methods: payment.methods || "card_or_affirm",
    },
  };
  saveOrder(next);
  return next;
}

/**
 * Shareable Stripe pay link for after supply check.
 * Embeds amount + customer so the buyer can pay on any device.
 */
export function buildStripePayUrl(order, origin = window.location.origin) {
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
    // Compact public + decode lines for the pay page (CC-safe names).
    lines: orderPublicLines(order).map((row) => ({
      q: row.qty,
      p: row.publicLabel,
      c: row.publicCode,
      s: row.supplyLabel,
      m: row.mg != null && Number(row.mg) > 0 ? Number(row.mg) : null,
    })),
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `${origin}/?view=cart&pay=${encodeURIComponent(encoded)}`;
}

export function parseStripePayPayload(raw) {
  try {
    const value = String(raw || "").trim();
    if (!value) return null;
    const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const json = decodeURIComponent(escape(atob(b64 + pad)));
    const data = JSON.parse(json);
    if (!data?.orderId || !(Number(data.total) > 0)) return null;
    return {
      orderId: String(data.orderId),
      total: Number(data.total),
      customer: {
        name: data.customer?.name || "",
        email: data.customer?.email || "",
        phone: data.customer?.phone || "",
        address1: data.customer?.address1 || "",
        address2: data.customer?.address2 || "",
        city: data.customer?.city || "",
        state: data.customer?.state || "",
        zip: data.customer?.zip || "",
      },
      lines: Array.isArray(data.lines)
        ? data.lines.map((row) => ({
            qty: row.q ?? row.qty ?? 1,
            publicLabel: row.p || row.publicLabel || "",
            publicCode: row.c || row.publicCode || "",
            supplyLabel: row.s || row.supplyLabel || "",
            mg: row.m ?? row.mg ?? null,
          }))
        : [],
    };
  } catch {
    return null;
  }
}

function money(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

/** Flat line list with stable keys for Admin supply checkboxes. */
export function flattenOrderLines(order) {
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
  // Customer-facing kept/dropped labels use public Renew names.
  return formatPublicLineLabel(line);
}

/**
 * Apply Yes / No / Partial supply decision.
 * keepKeys = line keys to fulfill (ignored for "no").
 */
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
    discount = {
      ...discount,
      amount: discountAmount,
    };
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
      kept: kept.map((r) => ({ key: r.key, label: formatLineLabel(r) })),
      dropped: dropped.map((r) => ({ key: r.key, label: formatLineLabel(r) })),
    },
    notes: [
      isPartial
        ? "PARTIAL FULFILL. Unavailable lines removed; customer emailed updated total + pay link."
        : "SUPPLY CONFIRMED. Customer emailed pay link.",
      note ? `Ops note: ${note}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
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
    if (comment) {
      lines.push("", comment);
    }
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

  if (comment) {
    lines.push("", comment);
  }

  const decode = formatOrderDecodeAppendix(order);
  if (decode) {
    lines.push("", decode);
  }

  lines.push(
    "",
    `Amount due: $${Number(order.totals?.total || 0).toFixed(2)}`,
    ""
  );
  if (payUrl) {
    lines.push("Pay here:", payUrl, "");
  }
  if (payText) {
    lines.push(payText, "");
  }
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

/** Email the customer the supply decision (Resend, else mailto draft). */
export async function notifyCustomerOrderDecision(
  order,
  { payUrl = "", payText = "" } = {}
) {
  const to = String(order?.customer?.email || "").trim();
  if (!to) return { ok: false, error: "Missing customer email" };
  const { subject, text } = formatCustomerDecisionEmail(order, {
    payUrl,
    payText,
  });

  try {
    const { fetchEmailConfig, sendTransactionalEmail, openMailto } =
      await import("./emailClient");
    const cfg = await fetchEmailConfig();
    if (cfg?.enabled) {
      await sendTransactionalEmail({
        type: "order_customer",
        to,
        subject,
        text,
        payUrl: payUrl || undefined,
      });
      return { ok: true, via: "resend", subject };
    }
    const mailto = openMailto({ to, subject, body: text });
    return { ok: true, via: "mailto", mailto, subject };
  } catch (err) {
    try {
      const { openMailto } = await import("./emailClient");
      const mailto = openMailto({ to, subject, body: text });
      return {
        ok: false,
        via: "mailto",
        mailto,
        subject,
        error: err?.message,
      };
    } catch {
      return { ok: false, error: err?.message || "notify failed" };
    }
  }
}
