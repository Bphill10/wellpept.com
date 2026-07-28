/**
 * Vercel / local serverless — create a Stripe PaymentIntent for
 * cards + Affirm (enable Affirm in Stripe Dashboard → Payment methods).
 *
 * Env:
 *   STRIPE_SECRET_KEY=sk_...
 *   STRIPE_CURRENCY=usd (optional)
 */

import Stripe from "stripe";

function readJson(req) {
  return new Promise((resolve, reject) => {
    if (req.body && typeof req.body === "object") {
      resolve(req.body);
      return;
    }
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
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

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    send(res, 405, { error: "Method not allowed" });
    return;
  }

  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    send(res, 503, {
      error: "Payments not configured",
      detail: "Set STRIPE_SECRET_KEY on the server.",
    });
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    send(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const amountCents = Math.round(Number(body.amountCents));
  if (!Number.isFinite(amountCents) || amountCents < 50) {
    send(res, 400, { error: "Amount must be at least $0.50" });
    return;
  }

  // Affirm on Stripe is typically $50–$30,000. Cards still work below $50.
  const currency = String(process.env.STRIPE_CURRENCY || "usd").toLowerCase();
  const orderId = String(body.orderId || "").slice(0, 64);
  const email = String(body.email || "").slice(0, 200);
  const customerName = String(body.name || "").slice(0, 200);
  const shipping = body.shipping || null;

  const stripe = new Stripe(secret);

  try {
    const intent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency,
      // Cards + Affirm (and any other methods enabled in the Dashboard).
      automatic_payment_methods: { enabled: true },
      receipt_email: email || undefined,
      description: orderId
        ? `Undisclosed order ${orderId}`
        : "Undisclosed research marketplace order",
      metadata: {
        orderId: orderId || "",
        channel: "undisclosed",
        customerName: customerName || "",
      },
      shipping: shipping
        ? {
            name: String(shipping.name || customerName || "Customer").slice(0, 200),
            phone: shipping.phone ? String(shipping.phone).slice(0, 40) : undefined,
            address: {
              line1: String(shipping.address1 || "").slice(0, 200),
              line2: shipping.address2
                ? String(shipping.address2).slice(0, 200)
                : undefined,
              city: String(shipping.city || "").slice(0, 100),
              state: String(shipping.state || "").slice(0, 40),
              postal_code: String(shipping.zip || "").slice(0, 20),
              country: "US",
            },
          }
        : undefined,
    });

    send(res, 200, {
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amountCents: intent.amount,
      currency: intent.currency,
    });
  } catch (err) {
    console.error("create-payment-intent failed", err);
    send(res, 502, {
      error: "Could not start payment",
      detail: err?.message || "Stripe error",
    });
  }
}
