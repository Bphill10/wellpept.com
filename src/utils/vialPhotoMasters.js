/**
 * Shared photographic-master profiles for the V2 vial system.
 *
 * TEST / future path only. Production shop cards still use
 * public/ud-labels/catalog/ and the existing manifest.
 * Production calculator still uses drawGeneratedVial() in vialArt.js.
 *
 * Catalog and calculator must share these masters and placement
 * rectangles. Only the locked SVG artwork differs (catalog vs calculator).
 */
export const PHOTO_MASTER_FILES = Object.freeze({
  "3ml-white": "/ud-labels/vial-photos-v2/3ml-white.png",
  "3ml-cobalt": "/ud-labels/vial-photos-v2/3ml-cobalt.png",
  "5ml-white": "/ud-labels/vial-photos-v2/5ml-white.png",
  "10ml-white": "/ud-labels/vial-photos-v2/10ml-white.png",
  "10ml-red": "/ud-labels/vial-photos-v2/10ml-red.png",
});

export const PHOTO_MASTER_BY_PROFILE = Object.freeze({
  "3ML_WHITE": "3ml-white",
  "3ML_BLUE": "3ml-cobalt",
  "5ML_WHITE": "5ml-white",
  "10ML_WHITE": "10ml-white",
  "10ML_B12_LIQUID": "10ml-red",
});

/**
 * Choose the locked photo master. No JavaScript cake tinting.
 */
export function resolvePhotoMasterKey({
  vialMl = 3,
  materialColor = "",
  visualType = "",
  formText = "",
  placementProfile = "",
} = {}) {
  const requested = String(placementProfile || "").toUpperCase();
  if (PHOTO_MASTER_BY_PROFILE[requested]) return PHOTO_MASTER_BY_PROFILE[requested];
  const ml = Number(vialMl) || 3;
  if (ml >= 8) {
    return /RED|B12|LIQUID/i.test(`${materialColor} ${visualType} ${formText}`)
      ? "10ml-red"
      : "10ml-white";
  }
  if (ml >= 4.5 && ml < 8) return "5ml-white";
  return /BLUE|COBALT/i.test(`${materialColor} ${visualType}`)
    ? "3ml-cobalt"
    : "3ml-white";
}

export function photoMasterSrc(key) {
  return PHOTO_MASTER_FILES[key] || PHOTO_MASTER_FILES["3ml-white"];
}
