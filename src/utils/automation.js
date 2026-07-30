/** Marketplace automation helpers. keep human gates only where required. */

import {
  isHghCompound,
  resolveVialMl,
  resolveVialUnit,
} from "./vialArt";

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
  const byVendor = new Map();
  for (const line of cart) {
    if (!byVendor.has(line.vendorId)) {
      byVendor.set(line.vendorId, {
        vendorId: line.vendorId,
        vendor: line.vendor,
        shippingFlat: line.shippingFlat,
        minOrder: line.minOrder,
        shippingNote: line.shippingNote || "",
        lines: [],
        merchandise: 0,
      });
    }
    const group = byVendor.get(line.vendorId);
    group.lines.push({
      sku: line.sku,
      name: line.name,
      mg: line.mg,
      form: line.form,
      qty: line.qty,
      unitPrice: line.price,
      lineTotal: line.price * line.qty,
    });
    group.merchandise += line.price * line.qty;
  }

  const shipments = [...byVendor.values()].map((g) => ({
    ...g,
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
      shipping,
      total,
    },
    shipments,
    notes:
      "ORDER REQUEST. Check supply first. Do not charge until confirmed. Reply to customer within 24 hours with payment instructions. Delivery takes 2-3 weeks. Drop-ship via Wellpept only. Do not share supply storefront links with the customer.",
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
    lines.push(
      `Wait consent: YES. Customer accepts 2-3 weeks delivery`
    );
  }
  lines.push("");
  for (const ship of packet.shipments) {
    lines.push(`── Shipment ──`);
    lines.push(
      `Ship to: ${ship.shipTo.name}, ${ship.shipTo.address1}${
        ship.shipTo.address2 ? `, ${ship.shipTo.address2}` : ""
      }, ${ship.shipTo.city}, ${ship.shipTo.state} ${ship.shipTo.zip}`
    );
    if (ship.shippingNote) lines.push(`Note: ${ship.shippingNote}`);
    for (const line of ship.lines) {
      const strength =
        line.mg != null && Number(line.mg) > 0 ? ` (${line.mg}mg)` : "";
      lines.push(
        `  ${line.qty}× ${line.sku} ${line.name}${strength} @ $${line.unitPrice.toFixed(2)} = $${line.lineTotal.toFixed(2)}`
      );
    }
    lines.push(
      `  Merchandise $${ship.merchandise.toFixed(2)} · Flat ship $${Number(ship.shippingFlat).toFixed(2)}`
    );
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
    };
  } catch {
    return null;
  }
}
