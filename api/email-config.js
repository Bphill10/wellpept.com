/**
 * Public email config for the SPA.
 * Never returns the API key.
 */

import { emailConfigured, emailFrom, emailOpsTo, sendJson } from "./email-lib.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "GET" && req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  sendJson(res, 200, {
    enabled: emailConfigured(),
    from: emailConfigured() ? emailFrom() : null,
    opsTo: emailConfigured() ? emailOpsTo() : null,
  });
}
