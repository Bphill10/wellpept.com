# Ordering & payments

WellPept uses a **request-first** flow. Customers do **not** pay at checkout.

## Customer flow

1. Customer submits an **order request** (shipping + quoted total)
2. Customer must confirm they can wait **up to 4 weeks** / until inventory replenishes
3. You (ops) check supply
4. Within **24 hours**, email the customer payment instructions
5. After payment, fulfill (allow up to 4 weeks)

Requests are stored in the browser order queue (admin panel). When Resend is configured, order packets are emailed to **info@wellpept.com**; otherwise a mailto draft opens.


## Stripe / Chargebee (optional, after supply check)

Keys can still be configured for when you later invoice or take payment manually:

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=usd
```

Chargebee remains optional for subscriptions / hosted pages (see `.env.example`).

## Deploy on Vercel + wellpept.com

You do **not** need to upload `.crt` / `.ca-bundle` / `.p7b` files to Vercel.
Vercel issues free HTTPS after the domain is connected.

1. Import the WellPept GitHub repo into Vercel
2. Framework: Vite. Build: `npm run build`. Output: `dist`
3. Add env vars if you use Stripe/Chargebee/Crisp
4. Domains: `wellpept.com` and `www.wellpept.com`
5. Create mailbox for **info@wellpept.com** and configure Resend (`RESEND_API_KEY`, `EMAIL_FROM`) so order requests arrive automatically


## Notes

- Never commit real secret keys (`.env` is gitignored).
- Cart CTA is **Submit order request**, not pay now.
- Local `vite` exposes `/api/*` via `vite.config.js` when payment APIs are used later.
