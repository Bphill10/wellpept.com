import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/**
 * The Undisclosed unlock — the page itself tunes over.
 *
 * Rather than cutting to a card, the REAL page bends: an SVG displacement filter slips it into
 * horizontal bands and splits its colour channels apart, white snow washes over it, and at peak
 * chaos the page underneath is swapped for the catalog. The bend then eases out and the snow
 * lifts, leaving Undisclosed crisp. It is the showcase vial's tune, applied to the whole screen.
 *
 * Glitch, deliberately — but nothing cracks and nothing shatters. The picture slips and recovers;
 * your phone is never the thing that appears to break.
 *
 * The filter is applied to #root, so the snow canvas and the filter definition are portalled to
 * <body> — otherwise the overlay would be bent along with the page.
 */

const RISE_MS = 800;   // the page slips apart and the snow comes up
const FALL_MS = 1100;  // it recovers onto the catalog
const REVEAL_AT = RISE_MS;  // swap the page at peak, hidden by the snow
const TUNE_MS = RISE_MS + FALL_MS;
const REDUCED_MS = 220;

const BEND_MAX = 78;   // displacement, in CSS px

export { TUNE_MS };

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** Chunky white snow tiles, blitted upscaled with smoothing off. */
function makeSnow(w, h, n = 6) {
  const tw = Math.max(64, Math.round(w / 5));
  const th = Math.max(96, Math.round(h / 5));
  const tiles = [];
  for (let k = 0; k < n; k++) {
    const c = document.createElement("canvas");
    c.width = tw;
    c.height = th;
    const cx = c.getContext("2d");
    const img = cx.createImageData(tw, th);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = v;
      img.data[i + 1] = v;
      img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    cx.putImageData(img, 0, 0);
    tiles.push(c);
  }
  return tiles;
}

export default function ChannelTuneOverlay({ active, onReveal, onDone }) {
  const canvasRef = useRef(null);
  const dispRef = useRef(null);
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
    const root = document.documentElement;
    const reveal = () => {
      if (revealedRef.current) return;
      revealedRef.current = true;
      onRevealRef.current?.();
    };
    const finish = () => {
      if (doneRef.current) return;
      doneRef.current = true;
      root.classList.remove("ud-bending");
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

    const canvas = canvasRef.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(window.innerWidth * dpr);
    const H = Math.round(window.innerHeight * dpr);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    const snow = makeSnow(W, H, 6);

    root.classList.add("ud-bending");

    let raf = 0;
    let seedAt = 0;
    let jitter = 1;
    const t0 = performance.now();

    const frame = (now) => {
      const e = now - t0;
      // Chaos rises into the swap, then recovers.
      const chaos = e < RISE_MS ? smooth(e / RISE_MS) : 1 - smooth((e - RISE_MS) / FALL_MS);

      // Bend the real page. Only `scale` changes, so the turbulence stays cached; jittering it in
      // steps makes the bands slip and snap the way a picture does while it retunes.
      if (now - seedAt > 80) {
        seedAt = now;
        jitter = 0.55 + Math.random() * 0.45;
      }
      dispRef.current?.setAttribute("scale", String(BEND_MAX * chaos * jitter));

      // White snow over the top.
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      ctx.imageSmoothingEnabled = false;
      const tile = snow[(Math.random() * snow.length) | 0];
      ctx.globalAlpha = 0.05 + 0.44 * chaos;
      ctx.drawImage(tile, 0, 0, tile.width, tile.height, 0, 0, W, H);
      ctx.imageSmoothingEnabled = true;

      // One bright sync bar sweeping through, the way a picture rolls while it retunes.
      if (chaos > 0.04) {
        const y = ((e / 520) % 1) * H;
        const g = ctx.createLinearGradient(0, y - H * 0.05, 0, y + H * 0.05);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.5, `rgba(226,240,255,${0.42 * chaos})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(0, y - H * 0.05, W, H * 0.1);
      }

      // Scanlines.
      ctx.globalAlpha = 0.08 + 0.14 * chaos;
      ctx.fillStyle = "#000";
      const step = Math.max(2, Math.round(3 * dpr));
      for (let y = 0; y < H; y += step) ctx.fillRect(0, y, W, Math.max(1, Math.round(dpr)));
      ctx.globalAlpha = 1;

      if (e < TUNE_MS) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const revealTimer = window.setTimeout(reveal, REVEAL_AT);
    const doneTimer = window.setTimeout(finish, TUNE_MS);
    // Never leave the page bent or a blocker up if a frame is missed.
    const failsafe = window.setTimeout(finish, TUNE_MS + 700);

    let audio = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        audio = new AC();
        const now = audio.currentTime;
        const buf = audio.createBuffer(1, Math.floor(audio.sampleRate * 1.4), audio.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
        const src = audio.createBufferSource();
        src.buffer = buf;
        const hiss = audio.createGain();
        hiss.gain.setValueAtTime(0.0001, now);
        hiss.gain.exponentialRampToValueAtTime(0.075, now + RISE_MS / 1000);
        hiss.gain.exponentialRampToValueAtTime(0.0001, now + TUNE_MS / 1000);
        src.connect(hiss).connect(audio.destination);
        src.start(now);
      }
    } catch {
      /* no audio is fine */
    }
    try {
      navigator.vibrate?.([0, 14, 50, 10]);
    } catch {
      /* ignore */
    }

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(revealTimer);
      window.clearTimeout(doneTimer);
      window.clearTimeout(failsafe);
      root.classList.remove("ud-bending");
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

  // Portalled to <body>: #root is the thing being bent, so anything inside it would bend too.
  return createPortal(
    <>
      <svg className="ud-bend-defs" aria-hidden="true" focusable="false">
        {/* Deliberately only three primitives, on a FIXED seed. A chromatic split (and re-seeding
            the noise each frame) looked better in stills but regenerated the turbulence every
            frame and cost ~27 dropped frames on a phone — and a glitch that stutters just reads
            as broken. The slip comes from jittering `scale` instead, which is free. */}
        <filter id="ud-bend" x="-4%" y="-4%" width="108%" height="108%" colorInterpolationFilters="sRGB">
          {/* Low horizontal / high vertical frequency = wide horizontal bands. */}
          <feTurbulence type="fractalNoise" baseFrequency="0.0016 0.035" numOctaves="1" seed="7" result="t" />
          {/* Flatten green so the displacement is purely sideways — bands slip, they never bob. */}
          <feColorMatrix
            in="t"
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0.5
                    0 0 0 0 0
                    0 0 0 0 1"
            result="m"
          />
          <feDisplacementMap ref={dispRef} in="SourceGraphic" in2="m" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <canvas ref={canvasRef} className="ud-tune-canvas" role="presentation" aria-hidden="true" />
    </>,
    document.body
  );
}
