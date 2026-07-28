/**
 * Public Chargebee config for the SPA.
 * Never returns the API key.
 */

import { chargebeeConfigured } from "./chargebee-lib.js";

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

  const site =
    process.env.VITE_CHARGEBEE_SITE || process.env.CHARGEBEE_SITE || "";
  const publishableKey =
    process.env.VITE_CHARGEBEE_PUBLISHABLE_KEY ||
    process.env.CHARGEBEE_PUBLISHABLE_KEY ||
    "";
  const skincarePlanPriceId =
    process.env.VITE_CHARGEBEE_SKINCARE_PLAN_PRICE_ID ||
    process.env.CHARGEBEE_SKINCARE_PLAN_PRICE_ID ||
    "";

  send(res, 200, {
    enabled: Boolean(site && publishableKey && chargebeeConfigured()),
    site: site || null,
    publishableKey: publishableKey || null,
    skincarePlanPriceId: skincarePlanPriceId || null,
    currency: String(process.env.CHARGEBEE_CURRENCY || "USD").toUpperCase(),
  });
}
