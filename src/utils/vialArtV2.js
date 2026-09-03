/**
 * Development / test calculator path for photographic vial masters.
 *
 * NOT wired into PeptideCalculator. Production still calls drawGeneratedVial()
 * in vialArt.js (unlabeled glass + 20/60/20 wrap).
 *
 * When production is approved to switch, calculator and shop should both
 * use resolvePhotoMasterKey() plus the same 3ML / 5ML / 10ML placement
 * profiles. Only the locked SVG (catalog vs calculator) differs.
 */
import {
  photoMasterSrc,
  resolveLabelPlacementKey,
  resolvePhotoMasterKey,
} from "./vialPhotoMasters";

export const VIAL_ART_V2_STATUS = "TEST_ONLY_AWAITING_VISUAL_APPROVAL";

export const CALCULATOR_V2_TEST_IMAGES = Object.freeze({
  "3ml-white": "/ud-labels/calculator-v2-test/calculator-TA1-5mg-3ml-white.png",
  "3ml-cobalt": "/ud-labels/calculator-v2-test/calculator-KLOW-80mg-3ml-cobalt.png",
  "10ml-white": "/ud-labels/calculator-v2-test/calculator-NAD-1000mg-10ml-white.png",
  "10ml-red": "/ud-labels/calculator-v2-test/calculator-B12-10mg-10ml-red.png",
});

/**
 * Resolve which photographed master the calculator would use.
 * No cake tint. No bare-glass template.
 */
export function resolveCalculatorPhotoMaster(options = {}) {
  return resolvePhotoMasterKey(options);
}

export function resolveCalculatorLabelPlacement(options = {}) {
  return resolveLabelPlacementKey(options);
}

/**
 * Test helper: return the pre-composited calculator V2 preview for a master.
 * Live SVG compositing in the browser is deferred until visual approval.
 */
export function calculatorV2TestImage(options = {}) {
  const key = resolveCalculatorPhotoMaster(options);
  return CALCULATOR_V2_TEST_IMAGES[key] || CALCULATOR_V2_TEST_IMAGES["3ml-white"];
}

export function calculatorV2MasterSrc(options = {}) {
  return photoMasterSrc(resolveCalculatorPhotoMaster(options));
}
