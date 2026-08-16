# tools/blender-vials

Headless Blender / Cycles studio for Undisclosed unlabeled vial stocks.

Read `SKILL.md` first. That is the agent workflow.

```bash
bash tools/blender-vials/render.sh --preview
bash tools/blender-vials/render.sh
```

From `ud-label-system`:

```bash
npm run vial-studio -- --preview
npm run publish-vial-stocks
```

Output lands in `tools/blender-vials/output/`. Publish is a separate step and
does not run during `npm run build`.
