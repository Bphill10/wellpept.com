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
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_CURRENCY=usd
VITE_CRISP_WEBSITE_ID=your-crisp-website-id
RESEND_API_KEY=re_...
EMAIL_FROM=WellPept <info@wellpept.com>
EMAIL_OPS_TO=info@wellpept.com
```

5. Deploy

See `PAYMENTS.md` for Stripe live activation + pay-link flow after supply check.

## C. Connect wellpept.com

You do **not** need to upload the `.crt` / `.ca-bundle` / `.p7b` files.
Vercel issues HTTPS for free.

1. Vercel project → **Settings → Domains**
2. Add `wellpept.com` and `www.wellpept.com`
3. At your domain registrar DNS, enter the A / CNAME records Vercel shows
4. Wait for DNS + SSL (often minutes, sometimes longer)

Your domain registration stays with your registrar. Vercel only hosts the site.

## D. Outbound email (Resend)

Contact / ops address: **info@wellpept.com**

The site sends real email when Resend is configured:

1. Create an account at https://resend.com
2. Add and verify **wellpept.com** (DNS records Resend shows)
3. Create an API key
4. In Vercel set:
   - `RESEND_API_KEY=re_...`
   - `EMAIL_FROM=WellPept <info@wellpept.com>`
   - `EMAIL_OPS_TO=info@wellpept.com`
5. Redeploy

What gets emailed:

- **Order requests** → `info@wellpept.com` (with customer reply-to)
- **Account confirmation** → the customer’s inbox (code + link)
- **New signup ping** → `info@wellpept.com`

If `RESEND_API_KEY` is missing, the site falls back to opening a `mailto:` draft.

## E. Phone chat with customers (Crisp)

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

## F. Ordering (request first, pay later)

Checkout does **not** charge the card. Flow:

1. Customer submits an order request
2. You get an email at **info@wellpept.com** (Resend) or a mailto draft if email isn’t configured yet, plus a local queue entry
3. Check supply and reply within **24 hours** with payment instructions
4. After payment, fulfill (customer accepted **2–3 weeks** delivery)

Stripe keys are optional for when you invoice after supply check (see `PAYMENTS.md`).

## G. Customer accounts (required to shop)

The site is locked behind an account gate:

- Email address required
- User ID required
- Password required (8+ characters, letter + number)
- Must confirm **18 or older**
- **Email must be confirmed** before shopping (6-digit code or confirmation link)

Flow: create account → confirmation email is sent (Resend) or a mailto draft opens → they enter the code or open the link → then they can shop.

Create account or sign in before browsing. Sign out is in the header.

Accounts are stored in the browser for now (device local). Confirmation links work on the same browser where they signed up. With Resend configured, the confirmation message arrives in their real inbox.

## H. Go-live checklist

- [ ] New WellPept GitHub repo (resume untouched)
- [ ] Vercel project deployed
- [ ] Domain DNS pointed at Vercel
- [ ] `info@wellpept.com` mailbox working
- [ ] Stripe live keys on Vercel + test pay link from Admin
- [ ] Resend domain verified + `RESEND_API_KEY` / `EMAIL_FROM` set on Vercel
- [ ] Crisp Website ID set + phone app installed
- [ ] Order request emails arrive at info@wellpept.com
- [ ] Create account / email confirmation tested
- [ ] Legal notices still visible on Renew products
