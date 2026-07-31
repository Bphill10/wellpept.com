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

## Optional: push to git (Windows)

PowerShell often blocks `.ps1` scripts. Use either:

**A. Double-click** `scripts\push-vendor-lists.cmd`

**B. PowerShell with bypass:**

```powershell
cd C:\Users\bphil\Ben_Phillips_Resume
powershell -ExecutionPolicy Bypass -File .\scripts\push-vendor-lists.ps1
```

**C. Plain git (always works):**

```powershell
cd C:\Users\bphil\Ben_Phillips_Resume
git add "public/vendor-lists"
git commit -m "vendor-lists: sync supplier folders (JEC US and others)"
git push origin HEAD
```

Then say **import JEC US**.

## On git now

| Path | Role |
|------|------|
| `JEC US/Screenshot 2026-07-30 182013.png` | **Primary** US warehouse inventory → `jecPremium.js` |
| `Changsha/Changsha_Premium_July_2026.xlsx` | **Gap-fill** — kits JEC US does not carry |
| `ERP/ERP_Price_list_Jul31end.pdf` | Silent STG backup (OOS replacement only) |
| `BAOHUA DONGNUO/`, `Serlina Chan/` | Reference / future |

Never show supplier names on the storefront.
