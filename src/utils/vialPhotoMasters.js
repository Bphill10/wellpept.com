/**
 * Shared photographic-master profiles for the V2 vial system.
 *
 * TEST / future path only. Production shop cards still use
 * public/ud-labels/catalog/ and the existing manifest.
 * Production calculator still uses drawGeneratedVial() in vialArt.js.
 *
 * Five immutable photographs. Three authoritative placement profiles.
 * Catalog and calculator share both. Only the locked SVG artwork differs.
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

export const LABEL_PLACEMENT_BY_PHOTO = Object.freeze({
  "3ml-white": "3ML_LABEL_PLACEMENT",
  "3ml-cobalt": "3ML_LABEL_PLACEMENT",
  "5ml-white": "5ML_LABEL_PLACEMENT",
  "10ml-white": "10ML_LABEL_PLACEMENT",
  "10ml-red": "10ML_LABEL_PLACEMENT",
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

/**
 * Size-only placement. Cobalt uses 3ML. Red uses 10ML.
 */
export function resolveLabelPlacementKey(options = {}) {
  const photoKey = resolvePhotoMasterKey(options);
  return LABEL_PLACEMENT_BY_PHOTO[photoKey] || "3ML_LABEL_PLACEMENT";
}

export function photoMasterSrc(key) {
  return PHOTO_MASTER_FILES[key] || PHOTO_MASTER_FILES["3ml-white"];
}
