# Agent inbox (drop files here)

Use this folder for **payment QRs, images, and one-off files**.

**Vendor price lists** go in **`public/vendor-lists`** (not here):

```text
C:\Users\bphil\Ben_Phillips_Resume\public\vendor-lists
```

See `public/vendor-lists/README.md`. After you update a list, say **check vendor-lists**.

---

## Payment QRs / other files

Drop images/PDFs here so the cloud agent can grab them after you push.

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
