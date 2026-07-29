/** Marketplace automation helpers — keep human gates only where required. */

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

export function buildCalculatorShareUrl({
  origin = typeof window !== "undefined" ? window.location.origin : "",
  pathname = typeof window !== "undefined" ? window.location.pathname : "/",
  name = "",
  mass = "",
  solution = "",
  dose = "",
  doseUnit = "mcg",
  unit = "",
} = {}) {
  const params = new URLSearchParams({
    view: "calculator",
    name: String(name || ""),
    mass: String(mass || ""),
    solution: String(solution || ""),
    dose: String(dose || ""),
    doseUnit:
      doseUnit === "mg" ? "mg" : doseUnit === "IU" ? "IU" : "mcg",
  });
  if (unit) params.set("unit", String(unit));
  return `${origin}${pathname}?${params.toString()}`;
}

/** Suggested BAC / concentration / dose fields — same math as the calculator. */
export function resolveCalculatorLabelFields({
  name = "",
  mass = "",
  unit = "mg",
  sku = "",
  bacWater = "",
  concentration = "",
  doseRange = "",
  qrPayload = "",
} = {}) {
  const massN = Number(mass);
  const vialUnit = unit || "mg";
  let dose;
  let doseUnit;
  if (vialUnit === "IU") {
    dose = massN >= 100 ? 5 : 2;
    doseUnit = "IU";
  } else if (massN >= 10) {
    dose = 1;
    doseUnit = "mg";
  } else {
    dose = 250;
    doseUnit = "mcg";
  }

  const bac = suggestedBacMl(massN, dose, doseUnit, 10);
  const bacNum = bac != null ? Number(bac.toFixed(2)) : null;
  const bacStr = bacNum != null ? `${bacNum} mL` : "";
  const conc =
    bacNum > 0
      ? vialUnit === "IU"
        ? `${Number((massN / bacNum).toFixed(2))} IU/mL`
        : `${Number((massN / bacNum).toFixed(2))} mg/mL`
      : "";
  const doseText =
    doseUnit === "mcg" ? `${dose} mcg (10 u)` : `${dose} ${doseUnit} (10 u)`;

  return {
    bacWater: bacWater || bacStr,
    concentration: concentration || conc,
    doseRange: doseRange || doseText,
    dose,
    doseUnit,
    solution: bacNum != null ? String(bacNum) : "",
    qrPayload:
      qrPayload ||
      buildCalculatorShareUrl({
        name,
        mass,
        solution: bacNum != null ? String(bacNum) : "",
        dose,
        doseUnit,
        unit: vialUnit,
      }),
  };
}

/** Suggested BAC so dose lands on `units` on a U-100 syringe. */
export function suggestedBacMl(massMg, dose, doseUnit, units = 10) {
  const massN = Number(massMg);
  const doseN = Number(dose);
  const unitsN = Number(units);
  if (!(massN > 0 && doseN > 0 && unitsN > 0)) return null;

  // IU vials: mass and dose are both in IU (e.g. HGH).
  if (doseUnit === "IU") {
    const iuPerUnit = doseN / unitsN;
    if (!(iuPerUnit > 0)) return null;
    return massN / iuPerUnit / 100;
  }

  const doseMcg = doseUnit === "mg" ? doseN * 1000 : doseN;
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
 * Never includes vendor storefront URLs — admin/ops relay only.
 * Default status is awaiting_supply_review (no payment yet).
 */
export function buildOrderPacket({
  orderId,
  customer,
  cart,
  subtotal,
  shipping,
  total,
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
    totals: { subtotal, shipping, total },
    shipments,
    notes:
      "ORDER REQUEST — check supply first. Do not charge until confirmed. Reply to customer within 24 hours with payment instructions. Fulfillment can take up to 4 weeks / until inventory replenishes. Drop-ship via Wellpept only. Do not share vendor storefront links with the customer.",
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
  lines.push(
    `Quoted total $${packet.totals.subtotal.toFixed(2)} + ship $${packet.totals.shipping.toFixed(2)} = $${packet.totals.total.toFixed(2)} (NOT paid yet unless status is paid)`
  );
  if (packet.waitConsent) {
    lines.push(
      `Wait consent: YES — customer accepts up to 4 weeks / until inventory replenishes`
    );
  }
  lines.push("");
  for (const ship of packet.shipments) {
    lines.push(`── Vendor: ${ship.vendor} ──`);
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
      "Payment: PENDING — email customer within 24h after supply check."
    );
  }
  return lines.join("\n");
}

  /** Open a mailto so Ben gets the request at info@wellpept.com. */
export function notifyOrderRequest(packet) {
  const body = formatOrderPacketText(packet);
  const subject = encodeURIComponent(
    `WellPept order request ${packet.orderId} — supply check`
  );
  const mailto = `mailto:${ORDER_NOTIFY_EMAIL}?subject=${subject}&body=${encodeURIComponent(body)}`;
  try {
    const a = document.createElement("a");
    a.href = mailto;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    /* ignore if blocked */
  }
  return mailto;
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
  const next = [packet, ...prev].slice(0, 50);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
  return next;
}
