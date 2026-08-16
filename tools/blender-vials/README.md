# tools/blender-vials

```
references/   image-gen look targets
renders/      Cycles working output
masters/      approved 1024×1536 plates
scripts/      render.sh, render_vial_studio.py, publish-stocks.mjs
```

Read `SKILL.md` first.

```bash
bash tools/blender-vials/scripts/render.sh --preview
bash tools/blender-vials/scripts/render.sh
```

Publish reads `masters/` and does not run during `npm run build`.
