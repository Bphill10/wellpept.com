# WellPept agent notes

## Cursor Cloud specific instructions

Cloud Agents should treat this repo as a Vite React site plus the Undisclosed label package under `ud-label-system/`.

### Environment Builds

- Config: `.cursor/environment.json`
- `install` runs `npm ci` at repo root, then `npm ci` in `ud-label-system`
- `terminals.vite` starts `npm run dev -- --host 0.0.0.0 --port 5173`
- Do not put long-running servers in `install`; they belong in `terminals` / `start`
- After merging environment config changes, prefer starting agents from an enabled Build so deps are already present

### Verify before finishing label/catalog work

```bash
cd ud-label-system
npm run build   # validation-report.json must say PASS
```

Root site check:

```bash
npm run build
```

### Locked label rules

Follow `.cursor/rules/ud-label-system.mdc` and `ud-label-system/START_HERE_CURSOR.md`. Source of truth is `ud-label-system/data/UD_Peptide_Label_Catalog.xlsx`. Do not invent placement geometry or full-regen catalog vials unless explicitly asked.
