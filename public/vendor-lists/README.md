# Vendor price lists

## Drop files the agent can see (no git)

**Attach in this Cursor chat** (paperclip / file upload).

- Pick the files inside `JEC US` (xlsx, csv, pdf, photos of sheets).
- Send them in chat — they land in the agent uploads folder automatically.
- Say **import JEC US** (or just “use these”).

No commit. No push. The agent can open them right away.

You can still keep local copies organized here on Windows:

```text
C:\Users\bphil\Ben_Phillips_Resume\public\vendor-lists\
  JEC US\
  ERP\
  Changsha\
  BAOHUA DONGNUO\
  Serlina Chan\
```

That local folder is for **your** filing. The agent only sees those files if you **attach** them in chat (or push them — optional).

## Optional: also keep them in git

If you want them backed up on the branch too:

```powershell
cd C:\Users\bphil\Ben_Phillips_Resume
.\scripts\push-vendor-lists.ps1
```

## Already on git (older flat files)

| File | Role |
|------|------|
| `ERP_Price_list_Jul31end.pdf` | Silent backup seed |
| `Changsha_Premium_July_2026.xlsx` | Legacy seed |

Never show supplier names on the storefront.
