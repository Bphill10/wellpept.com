/** Client helpers for WellPept transactional email (Resend-backed API). */

let cachedConfig = null;
let cachedAt = 0;

export async function fetchEmailConfig({ force = false } = {}) {
  const now = Date.now();
  if (!force && cachedConfig && now - cachedAt < 60_000) return cachedConfig;
  try {
    const res = await fetch("/api/email-config", { method: "GET" });
    if (!res.ok) {
      cachedConfig = { enabled: false };
      cachedAt = now;
      return cachedConfig;
    }
    cachedConfig = await res.json();
    cachedAt = now;
    return cachedConfig;
  } catch {
    cachedConfig = { enabled: false };
    cachedAt = now;
    return cachedConfig;
  }
}

export async function sendTransactionalEmail(payload) {
  const res = await fetch("/api/send-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || data.error || "Email send failed");
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export function openMailto({ to, subject, body }) {
  const mailto = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(
    subject || ""
  )}&body=${encodeURIComponent(body || "")}`;
  try {
    const a = document.createElement("a");
    a.href = mailto;
    a.rel = "noopener";
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    a.remove();
  } catch {
    /* ignore if blocked */
  }
  return mailto;
}
