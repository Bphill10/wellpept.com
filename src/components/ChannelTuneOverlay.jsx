import { useEffect, useRef } from "react";
import { UD_LABEL_BRAND } from "../data/udLabelAssets";

/**
 * The Undisclosed unlock — a private key turning.
 *
 * On black: a thin platinum hexagon draws itself, the UD monogram seats inside it, the mark turns
 * and locks home, and a hexagonal iris opens outward onto Undisclosed. The metaphor is being
 * granted access, not a device failing — so there is no static, no tearing and nothing breaks.
 * It is unhurried but short: a door held open for you should not cost seven seconds.
 *
 * The page underneath is swapped to Undisclosed at REVEAL_AT, while the veil is still solid, so
 * the iris opens onto the real catalog rather than a cross-fade.
 */

const VEIL_MS = 220;  // black closes over the page you tapped from
const DRAW_MS = 940;  // the ring strokes itself
const SEAT_MS = 320;  // the mark turns and locks
const IRIS_MS = 620;  // the frame opens onto Undisclosed
const REVEAL_AT = VEIL_MS + DRAW_MS + SEAT_MS; // swap the page under the solid veil
const TUNE_MS = REVEAL_AT + IRIS_MS;           // total overlay lifetime
const REDUCED_MS = 200;

export { TUNE_MS };

/** Points for a pointy-top regular hexagon (side length === r). */
function hexPoints(cx, cy, r) {
  const w = r * 0.8660254;
  return [
    [cx, cy - r],
    [cx + w, cy - r / 2],
    [cx + w, cy + r / 2],
    [cx, cy + r],
    [cx - w, cy + r / 2],
    [cx - w, cy - r / 2],
  ]
    .map(([x, y]) => `${Math.round(x * 1000) / 1000},${Math.round(y * 1000) / 1000}`)
    .join(" ");
}

const RING_R = 52;                 // in the mark's 120-unit viewBox
const RING_LEN = RING_R * 6;       // a regular hexagon's perimeter is 6r — the exact dash length

/**
 * One low, short tone as the key seats — the weight of a lock, in place of the old static hiss.
 * Returns the AudioContext so the caller can close it.
 */
function playSeatTone() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(126, now);
    osc.frequency.exponentialRampToValueAtTime(56, now + 0.3);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.14, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);
    return ctx;
  } catch {
    return null;
  }
}

export default function ChannelTuneOverlay({ active, onReveal, onDone }) {
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const onRevealRef = useRef(onReveal);
  onRevealRef.current = onReveal;
  const doneRef = useRef(false);
  const revealedRef = useRef(false);

  useEffect(() => {
    if (!active) {
      doneRef.current = false;
      revealedRef.current = false;
      return undefined;
    }
    const reveal = () => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      onRevealRef.current?.();
    };
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      reveal();
      onDoneRef.current?.();
    };

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (reduced) {
      const t = window.setTimeout(finish, REDUCED_MS);
      return () => window.clearTimeout(t);
    }

    let audio = null;
    const seatTimer = window.setTimeout(() => {
      audio = playSeatTone();
      try {
        navigator.vibrate?.(12);
      } catch {
        /* ignore */
      }
    }, VEIL_MS + DRAW_MS);
    const revealTimer = window.setTimeout(reveal, REVEAL_AT);
    const doneTimer = window.setTimeout(finish, TUNE_MS);
    // Never leave an invisible full-screen blocker up if an animation event is missed.
    const failsafe = window.setTimeout(finish, TUNE_MS + 700);

    return () => {
      window.clearTimeout(seatTimer);
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(failsafe);
      try {
        audio?.close();
      } catch {
        /* ignore */
      }
      try {
        navigator.vibrate?.(0);
      } catch {
        /* ignore */
      }
    };
  }, [active]);

  if (!active) return null;

  const style = {
    "--ud-key-veil": `${VEIL_MS}ms`,
    "--ud-key-draw": `${DRAW_MS}ms`,
    "--ud-key-seat": `${SEAT_MS}ms`,
    "--ud-key-iris": `${IRIS_MS}ms`,
    "--ud-key-reveal": `${REVEAL_AT}ms`,
  };

  return (
    <div className="ud-key" style={style} role="presentation" aria-hidden="true">
      {/* The veil, with a hexagonal iris that opens outward onto Undisclosed. The rect is drawn
          far outside the viewBox so it still covers the screen at any aspect ratio. */}
      <svg className="ud-key-veil" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <defs>
          <mask id="ud-key-iris" maskUnits="userSpaceOnUse" x="-250" y="-250" width="600" height="600">
            <rect x="-250" y="-250" width="600" height="600" fill="#ffffff" />
            <polygon className="ud-key-hole" points={hexPoints(50, 50, 9)} fill="#000000" />
          </mask>
        </defs>
        <rect x="-250" y="-250" width="600" height="600" fill="#07080a" mask="url(#ud-key-iris)" />
      </svg>

      {/* The key itself: a ring that draws, and the monogram that seats inside it. */}
      <div className="ud-key-mark">
        <div className="ud-key-turn">
          <svg className="ud-key-ring" viewBox="0 0 120 120">
            <polygon
              className="ud-key-ring-line"
              points={hexPoints(60, 60, RING_R)}
              style={{ strokeDasharray: RING_LEN, strokeDashoffset: RING_LEN }}
            />
          </svg>
          <img className="ud-key-glyph" src={UD_LABEL_BRAND.whiteTransparent} alt="" draggable="false" />
          <span className="ud-key-sheen" />
        </div>
      </div>
    </div>
  );
}
