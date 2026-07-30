# Ordering & payments

WellPept uses a **request-first** flow. Customers do **not** pay at checkout.

## Customer flow

1. Customer submits an **order request** (shipping + quoted total)
2. Customer must confirm they can wait **up to 4 weeks** / until inventory replenishes
3. You (ops) check supply
4. Within **24 hours**, email the customer a **Stripe pay link** (Admin → Copy Stripe link)
5. After payment, fulfill (allow up to 4 weeks)

Requests are stored in the browser order queue (admin panel). When Resend is configured, order packets are emailed to **info@wellpept.com**; otherwise a mailto draft opens.

## Activate Stripe (live) today

Your app already has Stripe checkout. Turn on live keys:

1. Open https://dashboard.stripe.com (use your existing account)
2. Complete business / identity verification if prompted
3. Switch to **Live mode** (toggle in the Dashboard)
4. Developers → API keys → copy **Publishable** + **Secret**
5. In Vercel → Settings → Environment Variables (Production + Preview):

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_CURRENCY=usd
```

6. Redeploy
7. Optional: enable **Affirm** under Settings → Payment methods
8. Optional: Instant Payouts → add an eligible debit card for same-day cashout

### Ops: collect payment after supply check

1. Open Undisclosed Admin (`?ops=1` once to unlock)
2. Find the order request
3. Click **Copy Stripe link**
4. Email that link to the customer (or paste into your reply)
5. Customer pays by card / Affirm on the pay page
6. Order status becomes **paid**

Test with a small live charge first, then Instant Payout if you need funds today.

## Crypto (next)

Stripe first. Crypto (Solana/ETH USDC to your wallet) can be added after live Stripe works.

## Chargebee (optional later)

Chargebee is optional for subscriptions / hosted pages and still needs Stripe underneath. Skip until Stripe live is working.

```
CHARGEBEE_SITE=...
VITE_CHARGEBEE_SITE=...
CHARGEBEE_API_KEY=...
VITE_CHARGEBEE_PUBLISHABLE_KEY=...
```

## Deploy on Vercel + wellpept.com

You do **not** need to upload `.crt` / `.ca-bundle` / `.p7b` files to Vercel.
Vercel issues free HTTPS after the domain is connected.

1. Import the WellPept GitHub repo into Vercel
2. Framework: Vite. Build: `npm run build`. Output: `dist`
3. Add env vars for Stripe / Resend / Crisp
4. Domains: `wellpept.com` and `www.wellpept.com`
5. Create mailbox for **info@wellpept.com** and configure Resend (`RESEND_API_KEY`, `EMAIL_FROM`)

## Notes

- Never commit real secret keys (`.env` is gitignored).
- Cart CTA is **Submit order request**, not pay now.
- Pay links are for after you confirm supply.
- Local `vite` exposes `/api/*` via `vite.config.js`.
