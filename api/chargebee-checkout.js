/**
 * Create Chargebee hosted checkout (one-time cart or subscription).
 */

import {
  getChargebeeClient,
  originFromReq,
  dollarsToCents,
} from "./chargebee-lib.js";

function readJson(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") {
      resolve(req.body);
      return;
    }
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error("Payload too large"));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function buildCustomer(customer = {}, shipping = {}) {
  const out = {};
  const email = customer.email || shipping.email;
  if (email) out.email = email;
  const name = String(customer.firstName || customer.name || shipping.name || "").trim();
  if (name) {
    const parts = name.split(/\s+/);
    out.first_name = parts[0] || name;
    if (parts.length > 1) out.last_name = parts.slice(1).join(" ");
  }
  if (customer.lastName) out.last_name = customer.lastName;
  const phone = shipping.phone || customer.phone;
  if (phone) out.phone = phone;
  return out;
}

function buildShippingAddress(shipping = {}, customer = {}) {
  const line1 = shipping.line1 || shipping.address1 || customer.address1;
  const city = shipping.city || customer.city;
  if (!line1 && !city) return undefined;
  const name = String(shipping.name || customer.name || "").trim();
  const parts = name.split(/\s+/);
  return {
    first_name: parts[0] || undefined,
    last_name: parts.length > 1 ? parts.slice(1).join(" ") : undefined,
    line1,
    line2: shipping.line2 || shipping.address2 || customer.address2 || undefined,
    city,
    state: shipping.state || customer.state,
    zip: shipping.postal || shipping.zip || customer.zip,
    country: shipping.country || customer.country || "US",
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    send(res, 405, { error: "Method not allowed" });
    return;
  }

  const chargebee = getChargebeeClient();
  if (!chargebee) {
    send(res, 503, { error: "Chargebee not configured" });
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    send(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const mode = body.mode === "subscription" ? "subscription" : "cart";
  const origin = originFromReq(req);
  const redirectUrl =
    body.redirectUrl ||
    process.env.CHARGEBEE_REDIRECT_URL ||
    `${origin}/?view=cart&cb=success`;
  const cancelUrl =
    body.cancelUrl || `${origin}/?view=cart&cb=cancel`;
  const customer = buildCustomer(body.customer, body.shipping);
  const shippingAddress = buildShippingAddress(body.shipping, body.customer);

  try {
    let result;

    if (mode === "subscription") {
      const itemPriceId =
        body.itemPriceId ||
        process.env.CHARGEBEE_SKINCARE_PLAN_PRICE_ID?.trim() ||
        process.env.VITE_CHARGEBEE_SKINCARE_PLAN_PRICE_ID?.trim();
      if (!itemPriceId) {
        send(res, 400, {
          error: "Missing Chargebee item price id for subscription checkout.",
        });
        return;
      }

      const params = {
        subscription_items: [{ item_price_id: itemPriceId, quantity: 1 }],
        customer,
        redirect_url: redirectUrl,
        cancel_url: cancelUrl,
      };
      if (shippingAddress) params.shipping_address = shippingAddress;
      result = await chargebee.hostedPage.checkoutNewForItems(params);
    } else {
      const items = Array.isArray(body.items)
        ? body.items
        : Array.isArray(body.lines)
          ? body.lines
          : [];
      if (!items.length) {
        send(res, 400, { error: "Cart is empty." });
        return;
      }

      const charges = items.map((item) => {
        const unit = Number(item.unitPrice ?? item.price);
        const qty = Math.max(1, Number(item.quantity ?? item.qty) || 1);
        if (!Number.isFinite(unit) || unit <= 0) {
          const err = new Error("Invalid line item amount.");
          err.statusCode = 400;
          throw err;
        }
        return {
          amount: dollarsToCents(unit) * qty,
          description: String(item.name || "WellPept item").slice(0, 250),
        };
      });

      // Optional shipping as its own charge line
      const shippingCents = Number(body.shippingCents) || 0;
      if (shippingCents > 0) {
        charges.push({
          amount: Math.round(shippingCents),
          description: "US shipping",
        });
      }

      const params = {
        charges,
        customer,
        redirect_url: redirectUrl,
        cancel_url: cancelUrl,
      };
      if (shippingAddress) params.shipping_address = shippingAddress;
      if (body.orderId) {
        params.invoice_note = `WellPept order ${body.orderId}`;
      }
      result = await chargebee.hostedPage.checkoutOneTime(params);
    }

    const page = result?.hosted_page || result?.hostedPage || result;
    if (!page?.url || !page?.id) {
      send(res, 502, { error: "Chargebee did not return a hosted checkout URL." });
      return;
    }

    send(res, 200, {
      provider: "chargebee",
      id: page.id,
      hostedPageId: page.id,
      url: page.url,
      mode,
    });
  } catch (err) {
    console.error("chargebee-checkout failed", err);
    send(res, err.statusCode || 502, {
      error: err.message || "Unable to start Chargebee checkout.",
      detail: err.message,
    });
  }
}
