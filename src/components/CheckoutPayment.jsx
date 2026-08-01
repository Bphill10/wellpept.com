import React, { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  PaymentMethodMessagingElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { CreditCard, Loader2 } from "lucide-react";
import { createPaymentIntent, dollarsToCents } from "../utils/payments";

const appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#0047ab",
    colorBackground: "#ffffff",
    colorText: "#111111",
    colorDanger: "#b42318",
    borderRadius: "10px",
    fontFamily: "Outfit, system-ui, sans-serif",
  },
};

function AffirmPromo({ stripePromise, amountCents, countryCode = "US" }) {
  if (!(amountCents >= 5000) || !stripePromise) {
    return (
      <p className="meta affirm-hint">
        Affirm installment options appear for eligible US orders of $50+.
      </p>
    );
  }

  return (
    <div className="affirm-messaging">
      <Elements stripe={stripePromise}>
        <PaymentMethodMessagingElement
          options={{
            amount: amountCents,
            currency: "USD",
            countryCode,
            paymentMethodTypes: ["affirm"],
          }}
        />
      </Elements>
    </div>
  );
}

function PaymentForm({ totalLabel, customer, onPaid, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function handlePay(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setMessage("");

    const returnUrl = new URL(window.location.href);
    returnUrl.searchParams.set("view", "cart");
    returnUrl.searchParams.set("paid", "1");

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl.toString(),
        receipt_email: customer.email,
        // Do not pass shipping here — PaymentIntent already has shipping from
        // the secret-key create call; client publishable key cannot overwrite it.
        payment_method_data: {
          billing_details: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone || undefined,
            ...(customer.address1
              ? {
                  address: {
                    line1: customer.address1,
                    line2: customer.address2 || undefined,
                    city: customer.city,
                    state: customer.state,
                    postal_code: customer.zip,
                    country: "US",
                  },
                }
              : {}),
          },
        },
      },
      redirect: "if_required",
    });

    if (error) {
      setMessage(error.message || "Payment failed");
      onError?.(error);
      setSubmitting(false);
      return;
    }

    if (
      paymentIntent &&
      (paymentIntent.status === "succeeded" ||
        paymentIntent.status === "processing" ||
        paymentIntent.status === "requires_capture")
    ) {
      onPaid?.(paymentIntent);
      setSubmitting(false);
      return;
    }

    setMessage("Payment is still processing. Check your email for confirmation.");
    setSubmitting(false);
  }

  return (
    <form className="stripe-pay-form" onSubmit={handlePay}>
      <div className="stripe-pay-head">
        <CreditCard size={18} />
        <div>
          <strong>Pay with card or Affirm</strong>
          <div className="meta">
            Secure Stripe checkout · US cards and Affirm installments
          </div>
        </div>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
          business: { name: "Wellpept" },
          fields: {
            billingDetails: {
              name: "never",
              email: "never",
              phone: "auto",
              address: "never",
            },
          },
        }}
      />

      {message && <div className="notice warn">{message}</div>}

      <button
        type="submit"
        className="primary-btn stripe-pay-btn"
        disabled={!stripe || submitting}
      >
        {submitting ? (
          <>
            <Loader2 size={16} className="spin" /> Processing…
          </>
        ) : (
          <>Pay {totalLabel}</>
        )}
      </button>
    </form>
  );
}

/**
 * Embedded Stripe Payment Element for cards + Affirm.
 * Requires VITE_STRIPE_PUBLISHABLE_KEY + STRIPE_SECRET_KEY (server).
 */
export default function CheckoutPayment({
  publishableKey,
  total,
  orderId,
  customer,
  onPaid,
  onError,
  publicCodes = "",
}) {
  const amountCents = dollarsToCents(total);
  const stripePromise = useMemo(
    () => (publishableKey ? loadStripe(publishableKey) : null),
    [publishableKey]
  );
  const [clientSecret, setClientSecret] = useState("");
  const [bootError, setBootError] = useState("");
  const [booting, setBooting] = useState(true);

  useEffect(() => {
    let alive = true;
    setBooting(true);
    setBootError("");
    setClientSecret("");

    createPaymentIntent({
      amountCents,
      orderId,
      email: customer.email,
      name: customer.name,
      publicCodes,
      shipping: customer.address1
        ? {
            name: customer.name,
            phone: customer.phone,
            address1: customer.address1,
            address2: customer.address2,
            city: customer.city,
            state: customer.state,
            zip: customer.zip,
          }
        : null,
    })
      .then((data) => {
        if (!alive) return;
        setClientSecret(data.clientSecret);
      })
      .catch((err) => {
        if (!alive) return;
        setBootError(err.message || "Could not start Stripe payment");
        onError?.(err);
      })
      .finally(() => {
        if (alive) setBooting(false);
      });

    return () => {
      alive = false;
    };
  }, [
    amountCents,
    orderId,
    publicCodes,
    customer.email,
    customer.name,
    customer.phone,
    customer.address1,
    customer.address2,
    customer.city,
    customer.state,
    customer.zip,
  ]);

  if (!publishableKey) {
    return (
      <div className="notice warn">
        Stripe publishable key missing. Add{" "}
        <code>VITE_STRIPE_PUBLISHABLE_KEY</code> and{" "}
        <code>STRIPE_SECRET_KEY</code>, then enable Affirm under Stripe →
        Settings → Payment methods.
      </div>
    );
  }

  if (booting) {
    return (
      <div className="stripe-booting">
        <Loader2 size={18} className="spin" /> Preparing secure payment…
      </div>
    );
  }

  if (bootError || !clientSecret || !stripePromise) {
    return (
      <div className="notice warn">
        {bootError || "Payment could not be initialized."}
      </div>
    );
  }

  const totalLabel = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(total) || 0);

  return (
    <div className="stripe-checkout">
      <AffirmPromo stripePromise={stripePromise} amountCents={amountCents} />
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance,
          loader: "auto",
        }}
      >
        <PaymentForm
          totalLabel={totalLabel}
          customer={customer}
          onPaid={onPaid}
          onError={onError}
        />
      </Elements>
    </div>
  );
}
