# Agent inbox (drop files here)

Drop images/PDFs in this folder so the cloud agent can grab them after you push.

## On Windows

1. Copy your file into this folder, e.g.:
   ```powershell
   copy C:\Users\bphil\Downloads\something.jpg inbox\
   ```
2. Push it:
   ```powershell
   cd C:\Users\bphil\Documents\GitHub\Ben_Phillips_Resume
   git add inbox
   git commit -m "inbox: add files"
   git push origin cursor/undisclosed-peptide-site-bfad
   ```
3. Tell the agent: **check inbox**

The agent will move/copy files into `public/` (and wire payment QRs when obvious).

## Or attach in this Cursor chat

Use the **paperclip / file upload** (not paste). Those land in the agent uploads folder automatically — same idea, no git needed.

## Payment QR names (optional but clear)

| File name | Used as |
|-----------|---------|
| `*zelle*` or `receipt_*.jpg` | Zelle QR → kept under `public/` |
| `*venmo*` | Venmo QR |
| `*solana*` | Solana QR |
| `*eth*` | Ethereum QR |

Any other file is copied to `public/` with the same name.
