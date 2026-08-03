/**
 * Transactional email via Resend.
 *
 * POST body:
 *   { type: "order_request", subject, text, replyTo? }
 *   { type: "auth_confirm", to, userId, code, link }
 *   { type: "ops_signup", userId, email, createdAt? }
 *   { type: "order_customer", to, subject, text }
 *   { type: "referral_payout", to, subject, text, amount, orderId, code, payoutSummary, venmoUrl? }
 *
 * Env: RESEND_API_KEY, EMAIL_FROM, EMAIL_OPS_TO
 */

import {
  emailConfigured,
  emailOpsTo,
  escapeHtml,
  readJson,
  sendJson,
  sendWithResend,
  textToHtml,
} from "./email-lib.js";

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

async function sendOrderRequest(body) {
  const subject = String(body.subject || "WellPept order request").slice(0, 200);
  const text = String(body.text || "").slice(0, 50000);
  if (!text.trim()) {
    const err = new Error("Missing order text");
    err.status = 400;
    throw err;
  }

  const order = body.order && typeof body.order === "object" ? body.order : null;
  // Always use production site for Yes/No links so Gmail taps work
  // (localhost / preview origins break phone clicks).
  let origin = String(body.siteOrigin || process.env.VITE_SITE_URL || "")
    .trim()
    .replace(/\/$/, "");
  if (
    !origin ||
    /localhost|127\.0\.0\.1|\.vercel\.app$/i.test(origin.replace(/^https?:\/\//, ""))
  ) {
    origin = "https://www.wellpept.com";
  }

  let actionHtml = "";
  let actionText = "";
  if (order?.orderId && origin) {
    try {
      const { buildSupplyActionUrls } = await import("./lib/supply-actions.js");
      const { yesUrl, noUrl, adminUrl } = buildSupplyActionUrls(origin, order);
      actionText = [
        "",
        "── ONE-TAP SUPPLY ACTIONS ──",
        `YES · confirm all & email pay link:`,
        yesUrl,
        "",
        `NO · decline & notify customer:`,
        noUrl,
        "",
        `Admin (partial / edit): ${adminUrl}`,
        "",
      ].join("\n");
      actionHtml = `
        <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;margin:0 0 1.25rem;">
          <p style="margin:0 0 .75rem;color:#111;"><strong>Supply check — tap one:</strong></p>
          <p style="margin:0 0 .75rem;">
            <a href="${escapeHtml(yesUrl)}"
               style="display:inline-block;padding:.7rem 1.1rem;background:#0a7a32;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;margin:0 .4rem .5rem 0;">
              YES · confirm &amp; email pay link
            </a>
            <a href="${escapeHtml(noUrl)}"
               style="display:inline-block;padding:.7rem 1.1rem;background:#8a1f1f;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;margin:0 .4rem .5rem 0;">
              NO · decline &amp; notify
            </a>
          </p>
          <p style="margin:0;font-size:13px;color:#555;">
            Partial fulfill? <a href="${escapeHtml(adminUrl)}">Open Admin</a>
            (same browser that received the order, or after sync).
          </p>
        </div>
      `;
    } catch (err) {
      actionText = `\n(Action links unavailable: ${err?.message || "sign failed"})\n`;
    }
  }

  const fullText = `${text}${actionText}`;
  const html = `${actionHtml}${textToHtml(text)}`;

  return sendWithResend({
    to: emailOpsTo(),
    subject,
    text: fullText,
    html,
    replyTo: body.replyTo,
  });
}

async function sendAuthConfirm(body) {
  const to = String(body.to || "").trim();
  const userId = String(body.userId || "").trim().slice(0, 64);
  const code = String(body.code || "").trim().slice(0, 12);
  const link = String(body.link || "").trim().slice(0, 500);
  if (!looksLikeEmail(to) || !userId || !code || !link) {
    const err = new Error("Missing confirmation fields");
    err.status = 400;
    throw err;
  }
  if (!/^https?:\/\//i.test(link)) {
    const err = new Error("Invalid confirmation link");
    err.status = 400;
    throw err;
  }

  const text = [
    "Confirm your WellPept account email.",
    "",
    `User ID: ${userId}`,
    `Confirmation code: ${code}`,
    "",
    "Open this link on the same device/browser where you signed up:",
    link,
    "",
    "Or sign in and enter the 6-digit code on the confirmation screen.",
    "",
    "If you did not create a WellPept account, ignore this message.",
  ].join("\n");

  const html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.5;color:#111;">
      <p>Confirm your WellPept account email.</p>
      <p><strong>User ID:</strong> ${escapeHtml(userId)}<br/>
      <strong>Confirmation code:</strong> ${escapeHtml(code)}</p>
      <p><a href="${escapeHtml(link)}">Confirm email</a></p>
      <p style="color:#555;font-size:13px;">Or enter the 6-digit code on the confirmation screen. If you did not create a WellPept account, ignore this message.</p>
    </div>
  `;

  return sendWithResend({
    to,
    subject: "Confirm your WellPept email",
    text,
    html,
  });
}

async function sendOpsSignup(body) {
  const userId = String(body.userId || "").trim().slice(0, 64);
  const email = String(body.email || "").trim();
  const createdAt = String(body.createdAt || new Date().toISOString()).slice(0, 40);
  if (!userId || !looksLikeEmail(email)) {
    const err = new Error("Missing signup fields");
    err.status = 400;
    throw err;
  }
  const text = [
    "New WellPept account (awaiting email confirmation):",
    `User ID: ${userId}`,
    `Email: ${email}`,
    `Created: ${createdAt}`,
    "",
    "They cannot shop until they confirm their email.",
  ].join("\n");

  return sendWithResend({
    to: emailOpsTo(),
    subject: `WellPept signup pending email confirm · ${userId}`,
    text,
    html: textToHtml(text),
    replyTo: email,
  });
}

async function sendOrderCustomer(body) {
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "WellPept order update").slice(0, 200);
  const text = String(body.text || "").slice(0, 50000);
  const payUrl = String(body.payUrl || "").trim();
  if (!looksLikeEmail(to) || !text.trim()) {
    const err = new Error("Missing customer email fields");
    err.status = 400;
    throw err;
  }
  let html = textToHtml(text);
  if (payUrl && /^https?:\/\//i.test(payUrl)) {
    html = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.5;color:#111;">
        <p><a href="${escapeHtml(payUrl)}"
           style="display:inline-block;padding:.75rem 1.2rem;background:#111;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">
          Pay for your order
        </a></p>
      </div>
      ${html}
    `;
  }
  return sendWithResend({
    to,
    subject,
    text,
    html,
    replyTo: emailOpsTo(),
  });
}

/** Commission notice → referrer directly; ops gets a copy with Venmo send link. */
async function sendReferralPayout(body) {
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "WellPept referral payout").slice(0, 200);
  const text = String(body.text || "").slice(0, 50000);
  const amount = Number(body.amount) || 0;
  const venmoUrl = String(body.venmoUrl || "").trim();
  const payoutSummary = String(body.payoutSummary || "").trim();
  const orderId = String(body.orderId || "").trim();
  const code = String(body.code || "").trim();
  if (!looksLikeEmail(to) || !text.trim()) {
    const err = new Error("Missing referral payout email fields");
    err.status = 400;
    throw err;
  }

  let html = `
    <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.5;color:#111;max-width:520px;">
      <h2 style="margin:0 0 .5rem;">You earned $${amount.toFixed(2)}</h2>
      <p style="margin:0 0 .75rem;">Friend-code commission from WellPept.</p>
      <p style="margin:0 0 .35rem;"><strong>Order:</strong> ${escapeHtml(orderId)}</p>
      <p style="margin:0 0 .35rem;"><strong>Your code:</strong> ${escapeHtml(code)}</p>
      <p style="margin:0 0 1rem;"><strong>Send to:</strong> ${escapeHtml(payoutSummary || "see message")}</p>
      ${textToHtml(text)}
    </div>
  `;

  const referrerResult = await sendWithResend({
    to,
    subject,
    text,
    html,
    replyTo: emailOpsTo(),
  });

  // Ops copy — includes Venmo deep link to pay the referrer
  const opsTo = emailOpsTo();
  if (opsTo && opsTo.toLowerCase() !== to.toLowerCase()) {
    const opsText = [
      `REFERRAL PAYOUT — send to referrer`,
      "",
      `Pay: $${amount.toFixed(2)}`,
      `To: ${to}`,
      `Destination: ${payoutSummary}`,
      `Order: ${orderId}`,
      `Code: ${code}`,
      venmoUrl ? `Venmo send link:\n${venmoUrl}` : "",
      "",
      "The referrer was emailed this notice directly.",
    ]
      .filter(Boolean)
      .join("\n");
    const opsHtml = `
      <div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.5;color:#111;">
        <p><strong>Send $${amount.toFixed(2)} to referrer</strong></p>
        <p>Email: ${escapeHtml(to)}<br/>Destination: ${escapeHtml(payoutSummary)}</p>
        ${
          venmoUrl && /^https?:\/\//i.test(venmoUrl)
            ? `<p><a href="${escapeHtml(venmoUrl)}"
                 style="display:inline-block;padding:.7rem 1.1rem;background:#008CFF;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;">
                 Open Venmo · send $${amount.toFixed(2)}
               </a></p>`
            : ""
        }
        <p style="font-size:13px;color:#555;">Referrer already received their notice email.</p>
      </div>
    `;
    try {
      await sendWithResend({
        to: opsTo,
        subject: `Pay referrer $${amount.toFixed(2)} · ${orderId || code}`,
        text: opsText,
        html: opsHtml,
      });
    } catch {
      /* referrer email already sent — don't fail the whole call */
    }
  }

  return referrerResult;
}

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
  if (!emailConfigured()) {
    sendJson(res, 503, {
      error: "Email not configured",
      detail: "Set RESEND_API_KEY (and preferably EMAIL_FROM) on the server.",
    });
    return;
  }

  let body;
  try {
    body = await readJson(req);
  } catch {
    sendJson(res, 400, { error: "Invalid JSON body" });
    return;
  }

  const type = String(body.type || "").trim();
  try {
    let data;
    if (type === "order_request") data = await sendOrderRequest(body);
    else if (type === "auth_confirm") data = await sendAuthConfirm(body);
    else if (type === "ops_signup") data = await sendOpsSignup(body);
    else if (type === "order_customer") data = await sendOrderCustomer(body);
    else if (type === "referral_payout") data = await sendReferralPayout(body);
    else {
      sendJson(res, 400, { error: "Unknown email type" });
      return;
    }
    sendJson(res, 200, { ok: true, id: data?.id || null });
  } catch (err) {
    sendJson(res, err.status || 500, {
      error: err.message || "Send failed",
      detail: err.payload || undefined,
    });
  }
}
