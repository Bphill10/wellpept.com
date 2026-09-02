/**
 * Shared colour helpers for the coloured crimp caps + matching label accents (landing showcase
 * and catalog). The cap is two coordinated colours — a base DOME and an analogous CRIMP collar
 * (a genuinely different hue that still harmonises) — plus a slightly deeper LABEL accent.
 */

export const clamp255 = (n) => (n < 0 ? 0 : n > 255 ? 255 : Math.round(n));
export const rgbHex = (rgb) => `#${rgb.map((n) => clamp255(n).toString(16).padStart(2, "0")).join("")}`;
export const lighten = (rgb, t) => rgb.map((v) => Math.round(v + (255 - v) * t));
export const darken = (rgb, t) => rgb.map((v) => Math.round(v * (1 - t)));

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h, s; const l = (mx + mn) / 2;
  if (mx === mn) { h = s = 0; }
  else {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    switch (mx) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const f = (p, q, t) => {
      if (t < 0) t += 1; if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/** Rotate a colour's hue by `deg` degrees (and optionally nudge lightness by `dl`, -1..1). */
export function hueRotate(rgb, deg, dl = 0) {
  const [h, s, l] = rgbToHsl(rgb[0], rgb[1], rgb[2]);
  return hslToRgb((h + deg / 360 + 1) % 1, s, Math.min(1, Math.max(0, l + dl)));
}

/**
 * From one base colour, the coordinated set: dome (base), crimp collar (analogous hue, a touch
 * lighter — a different colour that still matches), and the label accent hex (a deeper dome).
 */
export function capScheme(rgb) {
  return {
    dome: rgb,
    crimp: hueRotate(rgb, 36, 0.06),
    labelHex: rgbHex(darken(rgb, 0.12)),
  };
}

/** Vivid base colours for the caps. */
export const CAP_PALETTE = [
  [46, 92, 230],   // royal blue
  [34, 190, 120],  // emerald
  [30, 180, 190],  // teal
  [150, 90, 235],  // violet
  [230, 70, 150],  // rose
  [235, 175, 45],  // amber
  [225, 55, 60],   // crimson
  [70, 205, 225],  // cyan
];

/**
 * Stable per-product cap colour for the catalog: coordinate with a coloured powder where there
 * is one (blue KLOW/GLOW/GHK, red B12), otherwise a fixed palette colour chosen by a hash of the
 * name — so a product shows the SAME colour on every visit.
 */
export function catalogCapColor(name) {
  const n = String(name || "").toUpperCase();
  if (/\bKLOW\b|\bGLOW\b|GHK/.test(n)) return [46, 92, 230];
  if (/\bB\s*12\b|VITAMIN\s*B12|METHYLCOBALAMIN/.test(n)) return [225, 55, 60];
  let h = 2166136261;
  for (let i = 0; i < n.length; i++) { h ^= n.charCodeAt(i); h = Math.imul(h, 16777619); }
  return CAP_PALETTE[(h >>> 0) % CAP_PALETTE.length];
}
