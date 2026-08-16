# tools/blender-vials

```
references/   locked look to match
renders/      Cycles output
scripts/      render.sh, render_vial_studio.py, publish-stocks.mjs
```

Read `SKILL.md` first.

```bash
bash tools/blender-vials/scripts/render.sh --preview
bash tools/blender-vials/scripts/render.sh
```

Publish is a separate step and does not run during `npm run build`.
