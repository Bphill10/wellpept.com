/**
 * Public payment config for the SPA (publishable key only).
 * Never returns the secret key.
 */

function send(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    send(res, 405, { error: "Method not allowed" });
    return;
  }

  const publishableKey =
    process.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    process.env.STRIPE_PUBLISHABLE_KEY ||
    "";
  const secretConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

  send(res, 200, {
    enabled: Boolean(publishableKey && secretConfigured),
    publishableKey: publishableKey || null,
    currency: String(process.env.STRIPE_CURRENCY || "usd").toLowerCase(),
    // Affirm eligibility messaging threshold (Stripe Affirm is typically $50+).
    affirmMinCents: 5000,
    methods: ["card", "affirm"],
  });
}
