/**
 * Shared colour helpers for the vial caps + matching label accents (landing showcase and
 * catalog).
 *
 * A cap is three decisions, not one: the DOME's colour, the DOME's finish (painted solid,
 * clear plastic with a colour in it, or plain colourless clear), and the CRIMP collar's metal
 * underneath. Two compounds can share a colour and still read as completely different caps
 * because the other two differ — which is what keeps 28 compounds apart from a palette of
 * eight colours.
 */

export const clamp255 = (n) => (n < 0 ? 0 : n > 255 ? 255 : Math.round(n));
export const rgbHex = (rgb) => `#${rgb.map((n) => clamp255(n).toString(16).padStart(2, "0")).join("")}`;
export const lighten = (rgb, t) => rgb.map((v) => Math.round(v + (255 - v) * t));
export const darken = (rgb, t) => rgb.map((v) => Math.round(v * (1 - t)));

/**
 * The cap palette. Plain colours first — black, white, green, blue, red, pink — then the two
 * metals. Nothing is a hashed-up arbitrary hue any more: every cap on the site is one of these
 * eight, so the catalog reads as a designed set instead of a rainbow.
 */
export const CAP_COLORS = {
  black:  [32, 34, 39],
  white:  [240, 242, 246],
  green:  [26, 156, 84],
  blue:   [40, 132, 246],
  red:    [212, 40, 46],
  pink:   [236, 84, 152],
  copper: [188, 104, 52],
  silver: [176, 185, 197],
  // Two more blues, for the blue-powder trio only. All three of those caps have to be blue to
  // agree with what is in the vial, so they cannot be separated by colour family the way
  // everything else is — they get separated inside the blue family instead: deep royal, bright
  // electric, and the cerulean that goes to GHK-Cu, the copper peptide.
  navy:   [26, 58, 198],
  azure:  [18, 168, 212],
};

/** Dome finishes. `solid` is painted; `tint` is clear plastic with colour in it; `clear` is plain glass-clear. */
export const CAP_FINISHES = ["solid", "tint", "clear"];

const rgbOf = (name) => CAP_COLORS[name] || CAP_COLORS.silver;

/**
 * Cap assignments. Read as: dome colour · dome finish · crimp collar.
 *
 * Ordered to follow the storefront's own running order, and laid out so neighbours never share
 * a colour — scrolling the catalog should never show two cards that look like the same cap.
 *
 * Two families are pinned rather than styled: the blue-powder trio (KLOW / GLOW / GHK-Cu) all
 * take the blue, because the cap is supposed to agree with what is in the vial, and B12 takes
 * the red for its red liquid. They are told apart by finish and collar instead — including
 * GHK-Cu, the copper peptide, which gets the copper collar.
 *
 * White never appears in the collar column. On a crimp it is the same bright neutral metal as
 * silver, so a white collar and a silver one under the same dome colour are the same cap —
 * which is exactly how Semaglutide/Glutathione and Tirzepatide/SS-31 ended up as lookalikes.
 * White stays a dome colour, where it has the whole face to read on.
 */
/** Caps tied to the vial's contents — never handed out to an unlisted compound by the fallback. */
const PINNED = new Set(["KLOW", "GLOW", "GHK-CU", "VITAMIN B12"]);

const CAP_ROSTER = [
  ["TIRZEPATIDE",           "copper", "solid", "silver"],
  ["RETATRUTIDE",           "white",  "solid", "copper"],
  ["SEMAGLUTIDE",           "green",  "solid", "silver"],
  ["BPC-157",               "pink",   "solid", "silver"],
  ["TB-500",                "black",  "solid", "copper"],
  ["KLOW",                  "navy",   "solid", "silver"],
  ["GLOW",                  "blue",   "solid", "black"],
  ["GHK-CU",                "azure",  "solid", "copper"],
  ["TESAMORELIN",           "red",    "solid", "black"],
  ["IPAMORELIN",            "silver", "solid", "black"],
  ["CJC-1295",              "green",  "tint",  "silver"],
  ["CJC-1295 / IPAMORELIN", "copper", "tint",  "black"],
  ["HGH",                   "white",  "solid", "black"],
  ["NAD+",                  "green",  "solid", "copper"],
  ["MOTS-C",                "pink",   "tint",  "copper"],
  ["EPITHALON",             "black",  "solid", "silver"],
  ["SEMAX",                 "red",    "tint",  "silver"],
  ["SELANK",                "silver", "clear", "silver"],
  ["GLUTATHIONE",           "green",  "solid", "black"],
  ["SS-31",                 "silver", "solid", "copper"],
  ["PT-141",                "pink",   "solid", "black"],
  ["THYMOSIN ALPHA-1",      "copper", "clear", "copper"],
  ["KPV",                   "green",  "clear", "green"],
  ["CAGRILINTIDE",          "red",    "solid", "copper"],
  ["ARA-290",               "black",  "tint",  "silver"],
  ["FOX04-DRI",             "pink",   "clear", "pink"],
  ["DSIP",                  "silver", "tint",  "black"],
  ["VITAMIN B12",           "red",    "solid", "silver"],
];

/** Normalise a compound name to the key shape used in the roster. */
function capKey(name) {
  return String(name || "")
    .toUpperCase()
    .replace(/[·•]/g, "/")
    .replace(/\s*\/\s*/g, " / ")
    .replace(/[^A-Z0-9+/ -]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Aliases + families that should land on the same cap as their roster entry. */
function rosterIndex(name) {
  const k = capKey(name);
  const exact = CAP_ROSTER.findIndex((e) => e[0] === k);
  if (exact >= 0) return exact;
  const by = (needle) => CAP_ROSTER.findIndex((e) => e[0] === needle);
  if (/^GHK/.test(k)) return by("GHK-CU");
  if (/B\s*-?12|METHYLCOBALAMIN/.test(k)) return by("VITAMIN B12");
  if (/CJC.*IPAM|IPAM.*CJC/.test(k)) return by("CJC-1295 / IPAMORELIN");
  if (/^CJC/.test(k)) return by("CJC-1295");
  if (/^BPC/.test(k)) return by("BPC-157");
  if (/^TB.?500/.test(k)) return by("TB-500");
  if (/^MOTS/.test(k)) return by("MOTS-C");
  if (/THYMOSIN/.test(k)) return by("THYMOSIN ALPHA-1");
  // The storefront spells this "Epitalon"; the roster key is the "h" spelling. Without this it
  // fell through to the hash and landed on PT-141's exact cap.
  if (/^EPITH?ALON/.test(k)) return by("EPITHALON");
  if (/^SS.?31/.test(k)) return by("SS-31");
  if (/^PT.?141/.test(k)) return by("PT-141");
  if (/^ARA.?290/.test(k)) return by("ARA-290");
  if (/^FOX/.test(k)) return by("FOX04-DRI");
  if (/^NAD/.test(k)) return by("NAD+");
  if (/GLUTATHION/.test(k)) return by("GLUTATHIONE");
  if (/^HGH|SOMATROPIN/.test(k)) return by("HGH");
  return -1;
}

/**
 * Stable per-compound cap spec — the same on every visit. Anything not on the roster still
 * lands on a real palette entry (hashed into the roster) rather than an arbitrary hue, so an
 * unlisted compound can never break the set.
 */
export function catalogCapSpec(name) {
  let i = rosterIndex(name);
  if (i < 0) {
    const n = capKey(name);
    let h = 2166136261;
    for (let j = 0; j < n.length; j++) { h ^= n.charCodeAt(j); h = Math.imul(h, 16777619); }
    // Skip the pinned slots so an unlisted compound can never steal a blue or the B12 red.
    const open = CAP_ROSTER.map((_, k) => k).filter((k) => !PINNED.has(CAP_ROSTER[k][0]));
    i = open[(h >>> 0) % open.length];
  }
  const [, color, finish, crimp] = CAP_ROSTER[i];
  return { color, finish, crimp };
}

/** Back-compat: the cap's identity colour as RGB. */
export function catalogCapColor(name) {
  return rgbOf(catalogCapSpec(name).color);
}

/**
 * The coordinated set the renderer wants: dome tint, dome finish, crimp collar tint, and the
 * label accent. The label accent always follows the dome's identity colour — including on a
 * colourless clear top, where the colour lives in the collar underneath.
 */
export function capScheme(spec) {
  // Tolerates the old call shape (a raw [r,g,b]) so nothing that still passes a colour breaks.
  if (Array.isArray(spec)) return { dome: spec, domeFinish: "solid", crimp: spec, labelHex: rgbHex(darken(spec, 0.12)) };
  const { color, finish, crimp } = spec;
  const base = rgbOf(color);
  return {
    dome: base,
    domeFinish: finish,
    crimp: rgbOf(finish === "clear" ? color : crimp),
    labelHex: rgbHex(color === "white" || color === "silver" ? darken(base, 0.55) : darken(base, 0.12)),
  };
}

/** The full scheme straight from a compound name. */
export function capSchemeFor(name) {
  return capScheme(catalogCapSpec(name));
}
