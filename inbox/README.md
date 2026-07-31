# Agent inbox

## Fastest: attach in Cursor chat (no git)

Use the **paperclip / file upload** in this chat. The agent can view those files immediately — no push.

Works for vendor lists (JEC US), payment QRs, photos, PDFs, etc.

---

## Optional git folder (payment QRs / one-offs)

Use this folder only if you prefer committing files. **Vendor lists:** attach in chat, or keep local copies under `public/vendor-lists\` (see that README).

### On Windows

1. Copy your file into this folder, e.g.:
   ```powershell
   copy C:\Users\bphil\Downloads\something.jpg inbox\
   ```
2. Push it:
   ```powershell
   cd C:\Users\bphil\Ben_Phillips_Resume
   git add inbox
   git commit -m "inbox: add files"
   git push origin cursor/undisclosed-peptide-site-bfad
   ```
   Or: `.\scripts\push-inbox.ps1`
3. Tell the agent: **check inbox**

The agent will move/copy files into `public/` (and wire payment QRs when obvious). Price-list spreadsheets dropped here are copied into `public/vendor-lists/`.

## Or attach in this Cursor chat

Use the **paperclip / file upload** (not paste). Those land in the agent uploads folder automatically — same idea, no git needed.

## Payment QR names (optional but clear)

| File name | Used as |
|-----------|---------|
| `*zelle*` or `receipt_*.jpg` | Zelle QR → kept under `public/` |
| `*venmo*` | Venmo QR |
| `*solana*` | Solana QR |
| `*eth*` | Ethereum QR |

Any other non–price-list file is copied to `public/` with the same name.
