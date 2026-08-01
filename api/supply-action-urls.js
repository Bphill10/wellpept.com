/**
 * POST { order, siteOrigin? } → { yesUrl, noUrl, adminUrl }
 * Lets the SPA append one-tap links even when falling back to mailto.
 */

import { readJson, sendJson } from "./email-lib.js";
import {
  buildSupplyActionUrls,
  siteOriginFrom,
} from "./lib/supply-actions.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return;
  }
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method not allowed" });
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const order = body?.order && typeof body.order === "object" ? body.order : null;
  if (!order?.orderId) {
    sendJson(res, 400, { error: "Missing order" });
    return;
  }

  const origin =
    String(body.siteOrigin || "")
      .trim()
      .replace(/\/$/, "") || siteOriginFrom(req, "https://www.wellpept.com");
  const safeOrigin =
    !origin ||
    /localhost|127\.0\.0\.1|\.vercel\.app$/i.test(
      origin.replace(/^https?:\/\//, "")
    )
      ? "https://www.wellpept.com"
      : origin;

  try {
    const urls = buildSupplyActionUrls(safeOrigin, order);
    sendJson(res, 200, { ok: true, ...urls, origin: safeOrigin });
  } catch (err) {
    sendJson(res, err.status || 500, {
      error: err.message || "Could not build action links",
    });
  }
}
