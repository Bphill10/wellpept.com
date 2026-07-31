# Vendor price lists

**Canonical drop folder** for supplier catalogs (XLSX / CSV / PDF).

Windows path:

```text
C:\Users\bphil\Ben_Phillips_Resume\public\vendor-lists
```

Put updated lists here, commit, push, then tell the agent: **check vendor-lists**.

## Files in this folder (already imported)

| File | Role in app |
|------|-------------|
| `ERP_Price_list_Jul31end.pdf` | Silent backup catalog (`src/data/erpPeptide.js` → STG fallback). Never shown by name. |
| `Changsha_Premium_July_2026.xlsx` | Legacy import (`src/data/changshaPremium.js`). Not an active storefront vendor. |

**Primary Undisclosed supply** is JEC (`src/data/jecPremium.js`), currently seeded from Aria’s public promo SKUs. Drop a full `JEC_*.xlsx` / CSV here when you have the complete workbook — it is not in this folder yet.

## Naming (clear is best)

| File pattern | Vendor |
|--------------|--------|
| `*jec*` / `*jce*` / `JEC_*.xlsx` | JEC (primary Undisclosed supply) |
| `*changsha*` | Changsha (legacy) |
| `*erp*` / `ERP_*.pdf` | ERP → silent STG backup |

## After you update a file

```powershell
cd C:\Users\bphil\Ben_Phillips_Resume
git checkout cursor/undisclosed-peptide-site-bfad
git pull origin cursor/undisclosed-peptide-site-bfad
git add public/vendor-lists
git commit -m "vendor-lists: update price list"
git push origin cursor/undisclosed-peptide-site-bfad
```

Then say **check vendor-lists** so the catalog seed gets rebuilt.
