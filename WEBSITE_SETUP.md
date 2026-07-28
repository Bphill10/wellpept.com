# WellPept website setup

## A. Keep your resume separate

1. Create a **new empty GitHub repo** (example: `wellpept` or `wellpept-com`).
2. Do **not** merge WellPept into `Ben_Phillips_Resume`.
3. Tell Cursor the new repo URL so WellPept can be pushed there as `main`.
4. In Vercel, import **that new repo**, not the resume repo.

## B. Deploy on Vercel

1. Go to https://vercel.com/new
2. Import the WellPept GitHub repo
3. Framework: Vite · Build: `npm run build` · Output: `dist`
4. Add environment variables (Production + Preview):

```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CURRENCY=usd
VITE_CRISP_WEBSITE_ID=your-crisp-website-id
```

5. Deploy

## C. Connect wellpept.com

You do **not** need to upload the `.crt` / `.ca-bundle` / `.p7b` files.
Vercel issues HTTPS for free.

1. Vercel project → **Settings → Domains**
2. Add `wellpept.com` and `www.wellpept.com`
3. At your domain registrar DNS, enter the A / CNAME records Vercel shows
4. Wait for DNS + SSL (often minutes, sometimes longer)

Your domain registration stays with your registrar. Vercel only hosts the site.

## D. Phone chat with customers (Crisp)

Contact email on the site: **info@wellpept.com**

Live chat uses **Crisp** so you can IM from your phone:

1. Create a free account at https://app.crisp.chat
2. Create a website / inbox for WellPept
3. Copy the **Website ID**
4. Put it in Vercel as `VITE_CRISP_WEBSITE_ID`
5. Redeploy
6. Install the **Crisp** app on your phone (iOS or Android) and sign in
7. Turn on push notifications

Customers use the chat bubble on wellpept.com. You reply from the Crisp phone app.

Until Crisp is configured, the site still shows **info@wellpept.com** and a Message us button that opens email.

## E. Stripe checkout

1. Stripe Dashboard → Developers → API keys (Test mode first)
2. Add publishable + secret keys to Vercel env vars (section B)
3. Optional: enable Affirm under Stripe payment methods
4. Switch to live keys (`pk_live_` / `sk_live_`) when you are ready to take real payments

## F. Go-live checklist

- [ ] New WellPept GitHub repo (resume untouched)
- [ ] Vercel project deployed
- [ ] Domain DNS pointed at Vercel
- [ ] `info@wellpept.com` mailbox working (create at your email host / Google Workspace / etc.)
- [ ] Crisp Website ID set + phone app installed
- [ ] Stripe test checkout works
- [ ] Legal notices still visible on Fresh Mix products
