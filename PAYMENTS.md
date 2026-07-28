# Payments (Stripe Affirm + optional Chargebee)

WellPept checkout prefers **Stripe** (cards + Affirm) when sandbox keys are set.
Chargebee remains optional for hosted checkout / subscriptions.

## 1. Stripe sandbox (recommended)

1. Open https://dashboard.stripe.com/test/apikeys (Test mode ON)
2. Copy **Publishable key** (`pk_test_…`) and **Secret key** (`sk_test_…`)
3. Put them in `.env`:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=usd
```

4. Restart `npm run dev`
5. Optional: **Settings → Payment methods → Affirm** → enable for US test

### How it works

- Cart → US shipping → **Pay with card or Affirm**
- `/api/create-payment-intent` creates a PaymentIntent with automatic payment methods
- Affirm messaging shows for eligible US carts **$50+**

## 2. Chargebee (optional)

Only used when Stripe is **not** configured. See `.env.example` for Chargebee vars.

## Notes

- Never commit real secret keys (`.env` is gitignored).
- Without keys, checkout still queues an offline drop-ship packet.
- Local `vite` exposes `/api/*` via `vite.config.js`.
