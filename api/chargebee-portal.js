/**
 * Create a Chargebee customer portal session.
 */

import { getChargebeeClient, originFromReq } from "./chargebee-lib.js";

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

  const customerId = String(body.customerId || "").trim();
  const email = String(body.email || "").trim();
  if (!customerId && !email) {
    send(res, 400, { error: "Provide customerId or email" });
    return;
  }

  try {
    let id = customerId;
    if (!id && email) {
      const listed = await chargebee.customer.list({
        email: { is: email },
        limit: 1,
      });
      const rows = listed?.list || [];
      id = rows[0]?.customer?.id;
    }
    if (!id) {
      send(res, 404, { error: "Customer not found in Chargebee" });
      return;
    }

    const origin = originFromReq(req);
    const result = await chargebee.portalSession.create({
      customer: { id },
      redirect_url: String(body.redirectUrl || `${origin}/`).slice(0, 500),
    });
    const session = result?.portal_session || result?.portalSession || result;
    send(res, 200, {
      id: session.id,
      accessUrl: session.access_url || session.accessUrl,
      token: session.token,
    });
  } catch (err) {
    console.error("chargebee-portal failed", err);
    send(res, 502, {
      error: "Could not open portal",
      detail: err?.message || "Chargebee error",
    });
  }
}
