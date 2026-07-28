/** Chargebee client helpers for WellPept checkout + subscriptions. */

let chargebeeScriptPromise = null;

export function loadChargebeeScript() {
  if (typeof window === "undefined") return Promise.resolve(null);
  if (window.Chargebee) return Promise.resolve(window.Chargebee);
  if (chargebeeScriptPromise) return chargebeeScriptPromise;
  chargebeeScriptPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-wellpept-chargebee]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.Chargebee));
      existing.addEventListener("error", reject);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.chargebee.com/v2/chargebee.js";
    script.async = true;
    script.dataset.wellpeptChargebee = "1";
    script.onload = () => resolve(window.Chargebee);
    script.onerror = () => reject(new Error("Failed to load Chargebee.js"));
    document.head.appendChild(script);
  });
  return chargebeeScriptPromise;
}

export async function fetchChargebeeConfig() {
  try {
    const res = await fetch("/api/chargebee-config");
    if (!res.ok) return { enabled: false };
    return await res.json();
  } catch {
    return { enabled: false };
  }
}

export async function createChargebeeCheckout(payload) {
  const res = await fetch("/api/chargebee-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.detail || data.error || "Chargebee checkout failed");
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  return data;
}

export async function openChargebeeHostedCheckout({
  site,
  publishableKey,
  hostedPage,
  onSuccess,
  onClose,
  onError,
}) {
  const Chargebee = await loadChargebeeScript();
  if (!Chargebee) throw new Error("Chargebee.js unavailable");

  if (!Chargebee.inited) {
    Chargebee.init({
      site,
      publishableKey: publishableKey || undefined,
    });
  }

  const instance = Chargebee.getInstance();
  instance.openCheckout({
    hostedPage: () => Promise.resolve(hostedPage),
    success: (hostedPageId) => {
      onSuccess?.(hostedPageId);
    },
    close: () => {
      onClose?.();
    },
    error: (err) => {
      onError?.(err);
    },
  });
}
