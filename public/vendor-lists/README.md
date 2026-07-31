# Vendor price lists

**Canonical drop folder** for supplier catalogs (XLSX / CSV / PDF).

Windows path:

```text
C:\Users\bphil\Ben_Phillips_Resume\public\vendor-lists
```

Put updated lists here, commit, push, then tell the agent: **check vendor-lists**.

## Naming (clear is best)

| File pattern | Vendor |
|--------------|--------|
| `*jec*` / `*jce*` / `JEC_*.xlsx` | JEC (primary Undisclosed supply) |
| `*changsha*` | Changsha (legacy; not active storefront) |
| `*erp*` / `*stg*` / `ERP_*.pdf` | STG / ERP silent backup |

Any readable name works — the agent matches by filename + contents.

## Currently in this folder

- `Changsha_Premium_July_2026.xlsx`
- `ERP_Price_list_Jul31end.pdf`

Drop the full **JEC** workbook here when you have it (e.g. `JEC_Price_List.xlsx`).

## After you update a file

```powershell
cd C:\Users\bphil\Ben_Phillips_Resume
git checkout cursor/undisclosed-peptide-site-bfad
git pull origin cursor/undisclosed-peptide-site-bfad
git add public/vendor-lists
git commit -m "vendor-lists: update JEC (or STG / Changsha)"
git push origin cursor/undisclosed-peptide-site-bfad
```

Then say **check vendor-lists** in chat so the catalog seed gets rebuilt.
