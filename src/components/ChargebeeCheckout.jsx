import React, { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import {
  createChargebeeCheckout,
  openChargebeeHostedCheckout,
} from "../utils/chargebeeClient";
import { formatMoney } from "../data/products";

/**
 * Chargebee hosted checkout for cart (one-time) or skincare subscription.
 * Affirm / cards are configured in the Chargebee site (often via Stripe gateway).
 */
export default function ChargebeeCheckout({
  config,
  mode = "cart",
  total,
  shippingCents = 0,
  orderId,
  customer,
  lines = [],
  itemPriceId = "",
  onPaid,
  onError,
  buttonLabel,
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function startCheckout() {
    if (!config?.enabled || !config.site) {
      setMessage("Chargebee is not configured yet.");
      return;
    }
    setBusy(true);
    setMessage("");
    try {
      const path = window.location.pathname || "/";
      const hostedPage = await createChargebeeCheckout({
        mode,
        orderId,
        customer: {
          email: customer?.email,
          name: customer?.name,
          phone: customer?.phone,
          address1: customer?.address1,
          address2: customer?.address2,
          city: customer?.city,
          state: customer?.state,
          zip: customer?.zip,
          country: customer?.country || "US",
        },
        shipping: {
          name: customer?.name,
          email: customer?.email,
          phone: customer?.phone,
          line1: customer?.address1,
          line2: customer?.address2,
          city: customer?.city,
          state: customer?.state,
          postal: customer?.zip,
          country: "US",
        },
        items: lines.map((line) => ({
          name: line.publicLabel || line.name,
          unitPrice: line.price ?? line.unitPrice,
          quantity: line.qty ?? line.quantity ?? 1,
        })),
        shippingCents,
        itemPriceId: itemPriceId || config.skincarePlanPriceId,
        redirectUrl: `${window.location.origin}${path}?view=cart&cb=success`,
        cancelUrl: `${window.location.origin}${path}?view=cart&cb=cancel`,
      });

      await openChargebeeHostedCheckout({
        site: config.site,
        publishableKey: config.publishableKey,
        hostedPage: {
          id: hostedPage.id || hostedPage.hostedPageId,
          url: hostedPage.url,
        },
        onSuccess: (hostedPageId) => {
          onPaid?.({
            provider: "chargebee",
            id: hostedPageId,
            paymentIntentId: hostedPageId,
            status: "succeeded",
            amount: Math.round(Number(total) * 100),
          });
          setBusy(false);
        },
        onClose: () => setBusy(false),
        onError: (err) => {
          const msg = err?.message || "Chargebee checkout error";
          setMessage(msg);
          onError?.(err);
          setBusy(false);
        },
      });
    } catch (err) {
      const msg = err?.message || "Could not open Chargebee";
      setMessage(msg);
      onError?.(err);
      setBusy(false);
    }
  }

  const label =
    buttonLabel ||
    (mode === "subscription"
      ? "Subscribe with Chargebee"
      : `Pay ${formatMoney(total)} with Chargebee`);

  return (
    <div className="chargebee-checkout">
      <div className="stripe-pay-head">
        <CreditCard size={18} />
        <div>
          <strong>
            {mode === "subscription"
              ? "Subscribe with Chargebee"
              : "Pay with Chargebee"}
          </strong>
          <div className="meta">
            Hosted checkout · cards
            {mode === "cart" ? " · Affirm when enabled in Chargebee" : ""}
          </div>
        </div>
      </div>

      {message && <div className="notice warn">{message}</div>}

      <button
        type="button"
        className="primary-btn stripe-pay-btn"
        disabled={busy || !config?.enabled}
        onClick={startCheckout}
      >
        {busy ? (
          <>
            <Loader2 size={16} className="spin" /> Opening Chargebee…
          </>
        ) : (
          label
        )}
      </button>
    </div>
  );
}
