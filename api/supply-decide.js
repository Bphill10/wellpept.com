/**
 * One-tap supply decision from the ops email.
 *
 * GET /api/supply-decide?d=yes|no&p=...&s=...
 * Verifies signed token → emails customer (pay link on Yes) → HTML confirmation.
 */

import {
  emailConfigured,
  emailOpsTo,
  escapeHtml,
  sendWithResend,
  textToHtml,
} from "./email-lib.js";
import {
  applySupplyDecision,
  buildStripePayUrl,
  formatCustomerDecisionEmail,
  formatManualPayTextFromEnv,
  siteOriginFrom,
  verifySupplyToken,
} from "./lib/supply-actions.js";

function htmlPage({ title, body, ok = true }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escapeHtml(title)}</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#0b0b0c;color:#f2f2f2;margin:0;padding:2rem;}
    .card{max-width:34rem;margin:2rem auto;padding:1.5rem 1.35rem;border:1px solid #333;border-radius:12px;background:#141416;}
    h1{font-size:1.25rem;margin:0 0 .75rem;}
    p{line-height:1.5;color:#ccc;margin:.5rem 0;}
    .ok{color:#8fd98f;} .bad{color:#f0a0a0;}
    a{color:#9ecbff;}
    code{font-size:.85em;word-break:break-all;}
  </style>
</head>
<body>
  <div class="card">
    <h1 class="${ok ? "ok" : "bad"}">${escapeHtml(title)}</h1>
    ${body}
  </div>
</body>
</html>`;
}

function sendHtml(res, status, html) {
  res.statusCode = status;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(html);
}

function parseQuery(req) {
  try {
    const host = req.headers?.host || "localhost";
    const proto = req.headers?.["x-forwarded-proto"] || "http";
    const u = new URL(req.url || "/", `${proto}://${host}`);
    return Object.fromEntries(u.searchParams.entries());
  } catch {
    return {};
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    sendHtml(
      res,
      405,
      htmlPage({
        title: "Method not allowed",
        ok: false,
        body: "<p>Use the Yes / No links from the supply email.</p>",
      })
    );
    return;
  }

  const q = parseQuery(req);
  const decision = String(q.d || "").toLowerCase() === "no" ? "no" : "yes";

  let order;
  try {
    ({ order } = verifySupplyToken(q.p, q.s, decision));
  } catch (err) {
    sendHtml(
      res,
      err.status || 400,
      htmlPage({
        title: "Link invalid",
        ok: false,
        body: `<p>${escapeHtml(err.message || "Could not verify this link.")}</p>
          <p>Open <a href="/undisclosed?ops=1">Undisclosed Admin</a> on a browser that has the order, or ask for a fresh supply email.</p>`,
      })
    );
    return;
  }

  if (order.status && order.status !== "awaiting_supply_review") {
    sendHtml(
      res,
      200,
      htmlPage({
        title: "Already decided",
        ok: true,
        body: `<p>Order <code>${escapeHtml(order.orderId)}</code> status is already <strong>${escapeHtml(order.status)}</strong>.</p>
          <p>If the customer still needs a pay link, use Admin → Copy pay link.</p>`,
      })
    );
    return;
  }

  const updated = applySupplyDecision(order, { decision });
  if (!updated) {
    sendHtml(
      res,
      400,
      htmlPage({
        title: "Could not apply decision",
        ok: false,
        body: "<p>Order had no fulfillable lines.</p>",
      })
    );
    return;
  }

  const origin = siteOriginFrom(req);
  const payUrl =
    updated.status === "awaiting_payment"
      ? buildStripePayUrl(updated, origin)
      : "";
  const payText =
    updated.status === "awaiting_payment"
      ? formatManualPayTextFromEnv({
          orderId: updated.orderId,
          total: updated.totals?.total || 0,
        })
      : "";

  const { subject, text } = formatCustomerDecisionEmail(updated, {
    payUrl,
    payText,
  });
  const to = String(updated.customer?.email || "").trim();

  let emailed = false;
  let emailError = "";
  if (!emailConfigured()) {
    emailError = "Email not configured (RESEND_API_KEY).";
  } else if (!to) {
    emailError = "Order has no customer email.";
  } else {
    try {
      await sendWithResend({
        to,
        subject,
        text,
        html: textToHtml(text),
        replyTo: emailOpsTo(),
      });
      emailed = true;
    } catch (err) {
      emailError = err?.message || "Send failed";
    }
  }

  if (decision === "no") {
    sendHtml(
      res,
      200,
      htmlPage({
        title: emailed ? "Declined · customer emailed" : "Declined · email failed",
        ok: emailed,
        body: `
          <p>Order <code>${escapeHtml(updated.orderId)}</code> marked declined.</p>
          <p>Customer: ${escapeHtml(to || "—")}</p>
          ${
            emailed
              ? "<p class=\"ok\">Decline email sent.</p>"
              : `<p class="bad">${escapeHtml(emailError)}</p>`
          }
          <p><a href="${escapeHtml(origin)}/undisclosed?ops=1">Open Admin</a></p>`,
      })
    );
    return;
  }

  sendHtml(
    res,
    200,
    htmlPage({
      title: emailed
        ? "Supply confirmed · pay link emailed"
        : "Supply confirmed · email failed",
      ok: emailed,
      body: `
        <p>Order <code>${escapeHtml(updated.orderId)}</code></p>
        <p>Amount due: <strong>$${Number(updated.totals?.total || 0).toFixed(2)}</strong></p>
        <p>Customer: ${escapeHtml(to || "—")}</p>
        ${
          payUrl
            ? `<p>Pay link:<br/><code>${escapeHtml(payUrl)}</code></p>`
            : ""
        }
        ${
          emailed
            ? "<p class=\"ok\">Customer email sent with pay instructions.</p>"
            : `<p class="bad">${escapeHtml(emailError)}</p><p>Copy the pay link above and send it manually.</p>`
        }
        <p><a href="${escapeHtml(origin)}/undisclosed?ops=1">Open Admin</a>
        ${payUrl ? ` · <a href="${escapeHtml(payUrl)}">Open pay page</a>` : ""}</p>`,
    })
  );
}
