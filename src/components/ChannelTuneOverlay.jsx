import { useEffect, useRef } from "react";
import { UD_LABEL_BRAND } from "../data/udLabelAssets";

/**
 * The Undisclosed unlock — tuning in a channel that is not on the dial.
 *
 * The site's whole hook is "Change the channel", so the front door is the same analog tune the
 * hero uses, at full screen: the signal cuts to snow, a picture fights its way out of the static
 * — torn into bands, split into colour, ghosting — then SNAPS into focus, holds, and the static
 * lifts onto the catalog.
 *
 * Deliberately NOT the old version of this: nothing cracks and nothing breaks. A signal being
 * tuned is a private frequency being found; a shattered screen is your phone dying. Same
 * vocabulary, opposite message.
 */

const CUT_MS = 170;    // the signal drops out
const HUNT_MS = 1080;  // static, with the picture fighting through it
const LOCK_MS = 420;   // it snaps into focus and holds
const LIFT_MS = 620;   // the static lifts off the catalog
const REVEAL_AT = CUT_MS + HUNT_MS + LOCK_MS;  // swap the page under the static
const TUNE_MS = REVEAL_AT + LIFT_MS;
const REDUCED_MS = 220;

export { TUNE_MS };

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const smooth = (x) => x * x * (3 - 2 * x);

/** Chunky grayscale snow tiles, blitted upscaled with smoothing off. */
function makeSnow(w, h, n = 6) {
  const tw = Math.max(60, Math.round(w / 5));
  const th = Math.max(90, Math.round(h / 5));
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

/** Letter-spaced centred text, drawn per glyph so spacing works in every browser. */
function spacedText(ctx, text, cx, y, spacing) {
  const chars = [...text];
  let total = 0;
  for (const ch of chars) total += ctx.measureText(ch).width + spacing;
  total -= spacing;
  let x = cx - total / 2;
  for (const ch of chars) {
    ctx.fillText(ch, x, y);
    x += ctx.measureText(ch).width + spacing;
  }
}

/** The station ident that resolves out of the static: the UD mark over the wordmark. */
function buildCard(W, H, mark) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const unit = Math.min(W, H);
  const markSize = unit * 0.3;
  const cx = W / 2;
  const top = H / 2 - markSize * 0.78;
  if (mark) ctx.drawImage(mark, cx - markSize / 2, top, markSize, markSize);
  ctx.fillStyle = "#f2f6ff";
  ctx.textBaseline = "alphabetic";
  ctx.font = `600 ${Math.round(unit * 0.082)}px "Playfair Display", Georgia, serif`;
  spacedText(ctx, "UNDISCLOSED", cx, top + markSize * 1.42, unit * 0.021);
  ctx.fillStyle = "rgba(196,214,240,0.85)";
  ctx.font = `500 ${Math.round(unit * 0.026)}px Inter, system-ui, sans-serif`;
  spacedText(ctx, "CHANNEL 01", cx, top + markSize * 1.78, unit * 0.02);
  return c;
}

/** Red / green / blue copies of the ident, so it can be split apart into colour fringes. */
function buildTints(card) {
  const mk = (color) => {
    const c = document.createElement("canvas");
    c.width = card.width;
    c.height = card.height;
    const cx = c.getContext("2d");
    cx.drawImage(card, 0, 0);
    cx.globalCompositeOperation = "multiply";
    cx.fillStyle = color;
    cx.fillRect(0, 0, c.width, c.height);
    cx.globalCompositeOperation = "destination-in"; // keep the ident's own alpha
    cx.drawImage(card, 0, 0);
    return c;
  };
  return { r: mk("#ff0000"), g: mk("#00ff00"), b: mk("#0000ff") };
}

/**
 * Per-frame band geometry, shared by all three colour channels so the picture tears as ONE
 * picture rather than breaking into colour confetti.
 */
function buildBands(W, H, strips, amp, phase, tear) {
  const bands = [];
  for (let i = 0; i < strips; i++) {
    const y0 = Math.round((i * H) / strips);
    const y1 = Math.round(((i + 1) * H) / strips);
    if (y1 <= y0) continue;
    const u = i / strips;
    const w =
      0.66 * Math.sin(u * Math.PI * 3.1 + phase) +
      0.34 * Math.sin(u * Math.PI * 8.7 - phase * 1.7);
    let off = amp * w;
    if (tear > 0 && Math.random() < 0.2 * tear) {
      off += (Math.random() - 0.5) * W * 0.5 * tear;
    }
    bands.push({ y0, bh: y1 - y0, off });
  }
  return bands;
}

export default function ChannelTuneOverlay({ active, onReveal, onDone }) {
  const canvasRef = useRef(null);
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

    const canvas = canvasRef.current;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const W = Math.round(window.innerWidth * dpr);
    const H = Math.round(window.innerHeight * dpr);
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const snow = makeSnow(W, H, 6);
    let tints = buildTints(buildCard(W, H, null));
    const mark = new Image();
    mark.decoding = "async";
    mark.onload = () => { tints = buildTints(buildCard(W, H, mark)); };
    mark.src = UD_LABEL_BRAND.whiteTransparent;

    let raf = 0;
    const t0 = performance.now();

    const frame = (now) => {
      const e = now - t0;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#04050a";
      ctx.fillRect(0, 0, W, H);

      // How hard the signal is breaking up: full during the hunt, collapsing through the lock.
      let chaos;
      if (e < CUT_MS) chaos = clamp01(e / CUT_MS);
      else if (e < CUT_MS + HUNT_MS) {
        const u = (e - CUT_MS) / HUNT_MS;
        chaos = 1 - 0.35 * smooth(u); // eases down as the picture starts to hold
      } else if (e < REVEAL_AT) {
        chaos = 0.65 * (1 - smooth((e - CUT_MS - HUNT_MS) / LOCK_MS));
      } else chaos = 0;

      // The ident fights through: invisible at the cut, ghosting during the hunt, solid at lock.
      let signal = 0;
      if (e > CUT_MS && e < CUT_MS + HUNT_MS) {
        const u = (e - CUT_MS) / HUNT_MS;
        // flickers in and out while it is being found, then holds
        signal = smooth(u) * (0.45 + 0.55 * Math.abs(Math.sin(u * Math.PI * 4.2)));
      } else if (e >= CUT_MS + HUNT_MS) signal = 1;

      // Everything fades off together as the static lifts onto the catalog.
      const lift = e > REVEAL_AT ? clamp01((e - REVEAL_AT) / LIFT_MS) : 0;
      const veil = 1 - smooth(lift);

      // ---- the ident, torn into bands and split into colour ----
      if (signal > 0.01 && veil > 0.01) {
        const strips = 26;
        const amp = W * 0.09 * chaos;
        const bands = buildBands(W, H, strips, amp, e / 90, chaos);
        const split = 1 + 14 * chaos;
        // The three colour channels are drawn apart and recombined additively — the fringe of a
        // picture that has not locked yet. They share `bands`, so it tears as one picture.
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = signal * veil;
        const put = (img, dx) => {
          for (const b of bands) {
            ctx.drawImage(img, 0, b.y0, W, b.bh, b.off + dx, b.y0, W, b.bh);
          }
        };
        put(tints.g, 0);
        put(tints.r, split);
        put(tints.b, -split);
      }

      // ---- snow ----
      ctx.globalCompositeOperation = "screen";
      ctx.imageSmoothingEnabled = false;
      const tile = snow[(Math.random() * snow.length) | 0];
      ctx.globalAlpha = (0.1 + 0.5 * chaos) * veil;
      ctx.drawImage(tile, 0, 0, tile.width, tile.height, 0, 0, W, H);
      ctx.imageSmoothingEnabled = true;

      // ---- one bright sync bar sweeping while it hunts ----
      if (chaos > 0.05) {
        const y = ((e / 620) % 1) * H;
        const g = ctx.createLinearGradient(0, y - H * 0.06, 0, y + H * 0.06);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.5, `rgba(214,236,255,${0.5 * chaos * veil})`);
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 1;
        ctx.fillStyle = g;
        ctx.fillRect(0, y - H * 0.06, W, H * 0.12);
      }

      // ---- the lock flash ----
      const dl = Math.abs(e - (CUT_MS + HUNT_MS));
      if (dl < 130) {
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = (1 - dl / 130) * 0.5 * veil;
        ctx.fillStyle = "#dceaff";
        ctx.fillRect(0, 0, W, H);
      }

      // ---- scanlines ----
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = (0.16 + 0.2 * chaos) * veil;
      ctx.fillStyle = "#000";
      for (let y = 0; y < H; y += Math.max(2, Math.round(3 * dpr))) {
        ctx.fillRect(0, y, W, Math.max(1, Math.round(dpr)));
      }

      // The whole overlay dims away, uncovering the catalog underneath.
      canvas.style.opacity = String(veil);

      if (e < TUNE_MS) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const revealTimer = window.setTimeout(reveal, REVEAL_AT);
    const doneTimer = window.setTimeout(finish, TUNE_MS);
    // Never leave an invisible full-screen blocker up.
    const failsafe = window.setTimeout(finish, TUNE_MS + 700);
    let audio = null;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        audio = new AC();
        const now = audio.currentTime;
        // Static hiss that resolves into one low tone as the picture locks.
        const buf = audio.createBuffer(1, Math.floor(audio.sampleRate * 1.6), audio.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.5;
        const src = audio.createBufferSource();
        src.buffer = buf;
        const hiss = audio.createGain();
        hiss.gain.setValueAtTime(0.0001, now);
        hiss.gain.exponentialRampToValueAtTime(0.09, now + 0.12);
        hiss.gain.setValueAtTime(0.09, now + (CUT_MS + HUNT_MS) / 1000);
        hiss.gain.exponentialRampToValueAtTime(0.0001, now + (REVEAL_AT + 120) / 1000);
        src.connect(hiss).connect(audio.destination);
        src.start(now);
        const osc = audio.createOscillator();
        const tone = audio.createGain();
        const lockAt = now + (CUT_MS + HUNT_MS) / 1000;
        osc.type = "sine";
        osc.frequency.setValueAtTime(132, lockAt);
        osc.frequency.exponentialRampToValueAtTime(58, lockAt + 0.32);
        tone.gain.setValueAtTime(0.0001, lockAt);
        tone.gain.exponentialRampToValueAtTime(0.13, lockAt + 0.03);
        tone.gain.exponentialRampToValueAtTime(0.0001, lockAt + 0.5);
        osc.connect(tone).connect(audio.destination);
        osc.start(lockAt);
        osc.stop(lockAt + 0.55);
      }
    } catch {
      /* no audio is fine */
    }
    try {
      navigator.vibrate?.([0, 18, 60, 10]);
    } catch {
      /* ignore */
    }

    return () => {
      cancelAnimationFrame(raf);
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
  return <canvas ref={canvasRef} className="ud-tune-canvas" role="presentation" aria-hidden="true" />;
}
