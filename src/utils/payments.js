/** Client helpers for Stripe card + Affirm checkout. */

export async function fetchPaymentConfig() {
  try {
    const res = await fetch("/api/payment-config", { method: "GET" });
    if (!res.ok) return { enabled: false, publishableKey: null };
    return await res.json();
  } catch {
    return { enabled: false, publishableKey: null };
  }
}

export async function createPaymentIntent({
  amountCents,
  orderId,
  email,
  name,
  shipping,
  publicCodes = "",
}) {
  const res = await fetch("/api/create-payment-intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amountCents,
      orderId,
      email,
      name,
      shipping,
      publicCodes,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || data.error || "Payment start failed");
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export function dollarsToCents(amount) {
  return Math.round(Number(amount) * 100);
}
