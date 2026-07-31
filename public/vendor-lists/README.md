# Vendor price lists

**Canonical drop folder** — one subfolder per supplier.

Windows path:

```text
C:\Users\bphil\Ben_Phillips_Resume\public\vendor-lists
```

Expected layout (local):

```text
public/vendor-lists/
  JEC US/            ← primary Undisclosed supply (push this)
  ERP/               ← silent backup
  Changsha/          ← legacy
  BAOHUA DONGNUO/
  Serlina Chan/
```

## Push vendor folders to git (required for the cloud agent)

Folders on your PC are **not** visible here until you commit and push them.

```powershell
cd C:\Users\bphil\Ben_Phillips_Resume
git checkout cursor/undisclosed-peptide-site-bfad
git pull origin cursor/undisclosed-peptide-site-bfad
git add "public/vendor-lists"
git status
git commit -m "vendor-lists: add JEC US and supplier folders"
git push origin cursor/undisclosed-peptide-site-bfad
```

Then say **check vendor-lists** (or **import JEC US**).

## Already on git (flat files from earlier)

| File | Role |
|------|------|
| `ERP_Price_list_Jul31end.pdf` | Silent backup seed (`erpPeptide.js`) |
| `Changsha_Premium_July_2026.xlsx` | Legacy seed (`changshaPremium.js`) |

## Naming

| Folder / file | Role |
|---------------|------|
| `JEC US/` | Primary catalog |
| `ERP/` | Silent STG backup |
| `Changsha/` | Legacy |
| Other vendor folders | Kept for reference / future use |

Never show supplier names on the storefront.
