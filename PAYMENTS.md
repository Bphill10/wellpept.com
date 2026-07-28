# Payments (Chargebee + Stripe Affirm)

WellPept checkout prefers **Chargebee** hosted checkout for cart charges and
optional skincare subscriptions. **Stripe Payment Element** (cards + Affirm)
remains as a fallback when Chargebee is not configured.

## 1. Chargebee (preferred)

1. Create / open a Chargebee site
2. **Settings → Configure Chargebee → API Keys** → copy a full-access API key
3. **Checkout & Self-Serve Portal** → copy the publishable key
4. Connect a payment gateway (Stripe is common) and enable Affirm there if you want installments
5. (Optional) Create a Product Catalog 2.0 plan item price for skincare membership

### Environment

```
CHARGEBEE_SITE=your-site
VITE_CHARGEBEE_SITE=your-site
CHARGEBEE_API_KEY=full_access_key_...
VITE_CHARGEBEE_PUBLISHABLE_KEY=publishable_key_...

# Optional skincare subscription
CHARGEBEE_SKINCARE_PLAN_PRICE_ID=skincare-ritual-USD-Monthly
VITE_CHARGEBEE_SKINCARE_PLAN_PRICE_ID=skincare-ritual-USD-Monthly
```

### How it works

- Cart → US shipping → **Pay with Chargebee** (hosted page)
- `/api/chargebee-checkout` creates a one-time hosted page from cart `charges[]`
- Skincare home shows **Subscribe** when a plan price id is set (`checkout_new_for_items`)
- Return URLs use `?view=cart&cb=success` / `cb=cancel`
- `/api/chargebee-portal` can open the customer billing portal by email or customer id

## 2. Stripe Affirm (fallback)

1. Create / open https://dashboard.stripe.com
2. **Settings → Payment methods → Affirm** → turn on (US)
3. **Developers → API keys** → copy Publishable + Secret keys

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=usd
```

- Used only when Chargebee is **not** enabled
- `/api/create-payment-intent` + embedded Payment Element (cards + Affirm $50+)

## Notes

- Affirm is US-only (matches WellPept shipping). On Chargebee, enable it via your gateway settings.
- Without any keys, checkout still queues an offline drop-ship packet.
- Never commit real secret keys.
- Local `vite` / `vite preview` expose the same `/api/*` routes as Vercel via `vite.config.js`.
