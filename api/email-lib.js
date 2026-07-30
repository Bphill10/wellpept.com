/**
 * Shared WellPept email helpers (Resend).
 *
 * Env:
 *   RESEND_API_KEY=re_...
 *   EMAIL_FROM=WellPept <info@wellpept.com>
 *   EMAIL_OPS_TO=info@wellpept.com   (optional, defaults to info@)
 */

export function emailConfigured() {
  return Boolean(String(process.env.RESEND_API_KEY || "").trim());
}

export function emailFrom() {
  return (
    String(process.env.EMAIL_FROM || "").trim() ||
    "WellPept <info@wellpept.com>"
  );
}

export function emailOpsTo() {
  return (
    String(process.env.EMAIL_OPS_TO || "").trim() ||
    "info@wellpept.com"
  );
}

export function readJson(req) {
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

export function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export async function sendWithResend({ to, subject, text, html, replyTo }) {
  const key = String(process.env.RESEND_API_KEY || "").trim();
  if (!key) {
    const err = new Error("Email not configured");
    err.status = 503;
    throw err;
  }

  const recipients = (Array.isArray(to) ? to : [to])
    .map((v) => String(v || "").trim())
    .filter(looksLikeEmail);
  if (!recipients.length) {
    const err = new Error("Missing recipient");
    err.status = 400;
    throw err;
  }

  const payload = {
    from: emailFrom(),
    to: recipients,
    subject: String(subject || "").slice(0, 200),
    text: String(text || "").slice(0, 50000),
  };
  if (html) payload.html = String(html).slice(0, 100000);
  if (replyTo && looksLikeEmail(replyTo)) payload.reply_to = String(replyTo).trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(
      data?.message || data?.error || `Resend error ${res.status}`
    );
    err.status = res.status >= 400 && res.status < 600 ? res.status : 502;
    err.payload = data;
    throw err;
  }
  return data;
}

export function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function textToHtml(text) {
  return `<pre style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;line-height:1.45;white-space:pre-wrap;">${escapeHtml(text)}</pre>`;
}
