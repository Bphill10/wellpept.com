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

## Easiest push (one script)

Folders on your PC are **not** visible to the cloud agent until you push them.

1. Make sure your lists are under:
   `C:\Users\bphil\Ben_Phillips_Resume\public\vendor-lists\JEC US\`
2. Open PowerShell and run:

```powershell
cd C:\Users\bphil\Ben_Phillips_Resume
.\scripts\push-vendor-lists.ps1
```

3. In Cursor chat say: **import JEC US**

### Manual push (same thing, typed out)

```powershell
cd C:\Users\bphil\Ben_Phillips_Resume
git checkout cursor/undisclosed-peptide-site-bfad
git pull origin cursor/undisclosed-peptide-site-bfad
git add "public/vendor-lists"
git commit -m "vendor-lists: add JEC US and supplier folders"
git push origin cursor/undisclosed-peptide-site-bfad
```

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
