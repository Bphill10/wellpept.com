# Payments (Stripe Affirm + optional Chargebee)

WellPept checkout prefers **Stripe** (cards + Affirm) when sandbox keys are set.
Chargebee remains optional for hosted checkout / subscriptions.

## 1. Stripe sandbox (recommended)

1. Open https://dashboard.stripe.com/test/apikeys (Test mode ON)
2. Copy **Publishable key** (`pk_test_…`) and **Secret key** (`sk_test_…`)
3. Put them in `.env` locally, and in **Vercel → Project → Settings → Environment Variables**:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=usd
```

4. Restart `npm run dev` locally after changing `.env`
5. Optional: **Settings → Payment methods → Affirm** → enable for US test

### How it works

- Cart → US shipping → **Pay with card or Affirm**
- `/api/create-payment-intent` creates a PaymentIntent with automatic payment methods
- Affirm messaging shows for eligible US carts **$50+**

## 2. Chargebee (optional)

Only used when Stripe is **not** configured. See `.env.example` for Chargebee vars.

## 3. Deploy on Vercel + wellpept.com

You do **not** need to upload the `.crt` / `.ca-bundle` / `.p7b` files to Vercel.
Vercel issues free HTTPS automatically after the domain is connected.

1. Go to https://vercel.com/new and **Import** `Bphill10/Ben_Phillips_Resume`
2. Framework preset: Vite (or leave auto). Build: `npm run build`. Output: `dist`
3. Add the Stripe env vars above (Production + Preview)
4. Deploy
5. **Project → Settings → Domains** → add `wellpept.com` and `www.wellpept.com`
6. At your domain registrar DNS, add what Vercel shows (usually):
   - `www` → CNAME to `cname.vercel-dns.com`
   - apex `wellpept.com` → A record `76.76.21.21` (or the values Vercel lists)
7. Wait for DNS + SSL (often a few minutes; can take up to 48h)

Keep any private `.key` file offline. Never commit certificates or keys to GitHub.

## Notes

- Never commit real secret keys (`.env` is gitignored).
- Without keys, checkout still queues an offline drop-ship packet.
- Local `vite` exposes `/api/*` via `vite.config.js`.
