/**
 * Transactional email via Resend.
 *
 * POST body:
 *   { type: "order_request", subject, text, replyTo? }
 *   { type: "auth_confirm", to, userId, code, link }
 *   { type: "ops_signup", userId, email, createdAt? }
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
  return sendWithResend({
    to: emailOpsTo(),
    subject,
    text,
    html: textToHtml(text),
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
