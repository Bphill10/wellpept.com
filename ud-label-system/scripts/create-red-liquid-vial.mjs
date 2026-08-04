/**
 * Build unlabeled 10 mL B12 stock vial with transparent ruby liquid at 75% fill.
 * Delegates to render-vial-contents (never recolor a powder cake).
 */
import { renderLiquidVial } from "./render-vial-contents.mjs";

const result = await renderLiquidVial();
console.log(`Wrote ${result.assetPath}`);
console.log(`Wrote ${result.publicPath}`);
