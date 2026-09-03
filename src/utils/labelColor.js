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
 *
 * The crimp rotates the hue NEGATIVE (toward the cyan/warm neighbour), not positive: a +36°
 * turn pushed the blue peptides' crimp into violet, so KLOW / GLOW / GHK-Cu read as purple caps
 * instead of blue. Rotating -26° keeps royal blue → azure (still unmistakably blue), red → rose,
 * green → green, amber → red-orange — every cap stays two-tone and in its own colour family.
 */
export function capScheme(rgb) {
  return {
    dome: rgb,
    crimp: hueRotate(rgb, -26, 0.06),
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

/** A vivid RGB from a hue in degrees (0–359). */
function vividHue(hueDeg) {
  return hslToRgb(((hueDeg % 360) + 360) % 360 / 360, 0.66, 0.52);
}

/**
 * Stable per-PEPTIDE cap colour for the catalog — every compound gets its own colour combo, the
 * same on every visit. The blue-powder trio (KLOW / GLOW / GHK-Cu) is pinned to blues and B12
 * (red liquid) to crimson so the cap matches the contents; every other peptide gets a distinct
 * hue from a hash of its name (360 buckets → repeats are rare). The crimp + label are derived
 * from this base by `capScheme`.
 */
export function catalogCapColor(name) {
  const n = String(name || "").toUpperCase();
  // The blue trio is spread across the blue family so the three read as clearly different caps
  // while every one of them is still unmistakably blue: deep navy, bright electric blue, and a
  // cerulean/turquoise blue (the copper peptide).
  if (/\bKLOW\b/.test(n)) return [26, 58, 198];   // deep navy / royal
  if (/\bGLOW\b/.test(n)) return [40, 132, 246];  // bright electric blue
  if (/GHK/.test(n)) return [18, 168, 212];       // cerulean / turquoise blue (copper)
  if (/\bB\s*-?12\b|VITAMIN\s*B\s*12|METHYLCOBALAMIN/.test(n)) return [222, 52, 58]; // crimson (red liquid)
  let h = 2166136261;
  for (let i = 0; i < n.length; i++) { h ^= n.charCodeAt(i); h = Math.imul(h, 16777619); }
  // Skew the hue away from the reserved blue band (~186–252°) so non-blue peptides read distinct.
  let hue = (h >>> 0) % 360;
  if (hue > 184 && hue < 252) hue = (hue + 70) % 360;
  return vividHue(hue);
}
