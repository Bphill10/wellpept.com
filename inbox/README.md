# Agent inbox (drop files here)

Drop images/PDFs/spreadsheets here so the cloud agent can grab them after you push.

## JEC price list (priority)

Drop Aria’s full list as **`.xlsx` / `.csv` / `.pdf` / clear photo of the sheet**.

Suggested name: `JEC_Price_List.xlsx` (any name with `jec` or `jce` works).

Fastest path — **attach in this Cursor chat** with the paperclip (no git).

Or on Windows:

```powershell
cd $HOME\Documents\Ben_Phillips_Resume
git checkout cursor/undisclosed-peptide-site-bfad
git pull origin cursor/undisclosed-peptide-site-bfad
copy $HOME\Downloads\JEC*.xlsx inbox\
.\scripts\push-inbox.ps1
```

Then say: **check inbox** — I’ll replace the promo seed with the full JEC catalog.

## On Windows (any file)

1. Copy your file into this folder, e.g.:
   ```powershell
   copy C:\Users\bphil\Downloads\something.jpg inbox\
   ```
2. Push it:
   ```powershell
   cd $HOME\Documents\Ben_Phillips_Resume
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
