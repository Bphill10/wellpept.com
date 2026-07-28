# Payments (Stripe + Affirm)

Wellpept checkout accepts **credit/debit cards** and **Affirm** through Stripe Payment Element.

## 1. Stripe account

1. Create / open https://dashboard.stripe.com
2. **Settings → Payment methods → Affirm** → turn on (US)
3. **Developers → API keys** → copy Publishable + Secret keys

## 2. Environment

Copy `.env.example` to `.env` (local) or set the same vars in Vercel:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=usd
```

Restart `npm run dev` after changing env.

## 3. How it works

- Cart → US shipping form → **Pay with card or Affirm**
- `/api/create-payment-intent` creates a PaymentIntent with `automatic_payment_methods` (cards + Affirm when enabled)
- Affirm messaging shows for eligible US carts **$50+**
- On success, the order is marked paid and the drop-ship packet downloads for ops

## 4. Test cards

Use Stripe test mode cards, e.g. `4242 4242 4242 4242`. Affirm has its own test flow in Stripe test mode after Affirm is enabled.

## Notes

- Affirm is US-only (matches Wellpept shipping).
- Without keys, checkout still queues an offline drop-ship packet.
- Never commit real secret keys.
