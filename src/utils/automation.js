/** Marketplace automation helpers — keep human gates only where required. */

const SETTINGS_KEY = "undisclosed-automation-v1";

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
} = {}) {
  const params = new URLSearchParams({
    view: "calculator",
    name: String(name || ""),
    mass: String(mass || ""),
    solution: String(solution || ""),
    dose: String(dose || ""),
    doseUnit: doseUnit === "mg" ? "mg" : "mcg",
  });
  return `${origin}${pathname}?${params.toString()}`;
}

/** Suggested BAC so dose lands on `units` on a U-100 syringe. */
export function suggestedBacMl(massMg, dose, doseUnit, units = 10) {
  const massN = Number(massMg);
  const doseN = Number(dose);
  const unitsN = Number(units);
  if (!(massN > 0 && doseN > 0 && unitsN > 0)) return null;
  const doseMcg = doseUnit === "mg" ? doseN * 1000 : doseN;
  if (!(doseMcg > 0)) return null;
  const mcgPerUnit = doseMcg / unitsN;
  const totalUnits = (massN * 1000) / mcgPerUnit;
  return totalUnits / 100;
}

export function createOrderId() {
  const t = Date.now().toString(36).toUpperCase();
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `UD-${t}-${r}`;
}

/**
 * Build a drop-ship order packet grouped by vendor.
 * Never includes vendor storefront URLs — admin/ops relay only.
 */
export function buildOrderPacket({
  orderId,
  customer,
  cart,
  subtotal,
  shipping,
  total,
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
    status: "queued",
    channel: "undisclosed",
    shipCountry: "US",
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone || "",
    },
    totals: { subtotal, shipping, total },
    shipments,
    notes:
      "Drop-ship via Undisclosed only. Do not share vendor storefront links with the customer.",
  };
}

export function formatOrderPacketText(packet) {
  const lines = [
    `UNDISCLOSED ORDER ${packet.orderId}`,
    `Created ${packet.createdAt}`,
    `Customer: ${packet.customer.name} <${packet.customer.email}>`,
    `Ship: US only`,
    `Subtotal ${packet.totals.subtotal.toFixed(2)} · Shipping ${packet.totals.shipping.toFixed(2)} · Total ${packet.totals.total.toFixed(2)}`,
    "",
  ];
  for (const ship of packet.shipments) {
    lines.push(`── Vendor: ${ship.vendor} ──`);
    lines.push(
      `Ship to: ${ship.shipTo.name}, ${ship.shipTo.address1}${
        ship.shipTo.address2 ? `, ${ship.shipTo.address2}` : ""
      }, ${ship.shipTo.city}, ${ship.shipTo.state} ${ship.shipTo.zip}`
    );
    if (ship.shippingNote) lines.push(`Note: ${ship.shippingNote}`);
    for (const line of ship.lines) {
      lines.push(
        `  ${line.qty}× ${line.sku} ${line.name} (${line.mg}mg) @ $${line.unitPrice.toFixed(2)} = $${line.lineTotal.toFixed(2)}`
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
      `Payment: Stripe ${packet.payment.paymentIntentId} (${packet.payment.status})`
    );
  }
  return lines.join("\n");
}

const ORDERS_KEY = "undisclosed-orders-v1";

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
