import React, { useEffect, useRef, useState } from "react";
import { labelSVGFromFields } from "../utils/udSilverLabel";
import {
  silverVialBaseSrc,
  prepareVialCompositor,
  composeVial,
} from "../utils/udVialComposite";
import { capScheme } from "../utils/labelColor";

/**
 * Undisclosed landing showcase — a single hero vial that channel-surfs the catalog. Each
 * "channel" is a real compound: the vial turns gently for a few seconds, then does an
 * old-school TV channel change (RGB split, vertical roll, analog snow, and a bright snap)
 * that masks the swap to the next label. A little "CH 0X · NAME" readout underneath sells
 * the dial. Under prefers-reduced-motion it drops the glitch and simply cross-dissolves
 * between the labels, so the catalog still visibly tunes without any strobing.
 *
 * Self-contained: composites every vial live from name/strength/size (no per-product image),
 * prepares each channel just ahead of time, and pauses when off-screen or the tab is hidden.
 */

const HOLD_MS = 3200; // gentle turn on each channel before it changes
const TUNE_MS = 640;  // the channel-change glitch
const FADE_MS = 720;  // reduced-motion cross-dissolve
const SPIN_MS = 11000; // one full label revolution during the hold
const FRAME_MS = 33;   // ~30fps cap for the hold spin

// Accent colours the showcase surfs at random — each channel gets one (a fresh shuffle each page
// load) applied to BOTH the crimp cap and the label accents, so the two match. The powder stays
// its real white; only the cap + label are colour-coded.
const SHOWCASE_PALETTE = [
  [46, 92, 230],   // royal blue
  [34, 190, 120],  // emerald
  [30, 180, 190],  // teal
  [150, 90, 235],  // violet
  [230, 70, 150],  // rose
  [235, 175, 45],  // amber
  [225, 55, 60],   // crimson
  [70, 205, 225],  // cyan
];

// Fisher–Yates shuffle (returns a new array) so each load gets a different colour order.
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}


/** Build red / green / blue single-channel copies of the frozen vial for the split. */
function buildTints(gfx, buf) {
  const W = buf.width, H = buf.height;
  const mk = (key, color) => {
    let c = gfx[key];
    if (!c) { c = document.createElement("canvas"); gfx[key] = c; }
    c.width = W; c.height = H;
    const cx = c.getContext("2d");
    cx.globalCompositeOperation = "source-over";
    cx.clearRect(0, 0, W, H);
    cx.drawImage(buf, 0, 0);
    cx.globalCompositeOperation = "multiply";   // keep only this colour channel
    cx.fillStyle = color; cx.fillRect(0, 0, W, H);
    cx.globalCompositeOperation = "destination-in"; // restore the vial's alpha shape
    cx.drawImage(buf, 0, 0);
    cx.globalCompositeOperation = "source-over";
    return c;
  };
  return { r: mk("tintR", "#ff0000"), g: mk("tintG", "#00ff00"), b: mk("tintB", "#0000ff") };
}

/** A few chunky grayscale noise tiles for analog snow (blitted upscaled, nearest-neighbour). */
function makeNoise(W, H, n = 5) {
  const nw = Math.max(48, Math.round(W / 3)), nh = Math.max(72, Math.round(H / 3));
  const tiles = [];
  for (let k = 0; k < n; k++) {
    const c = document.createElement("canvas"); c.width = nw; c.height = nh;
    const cx = c.getContext("2d"); const img = cx.createImageData(nw, nh);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 255;
    }
    cx.putImageData(img, 0, 0); tiles.push(c);
  }
  return tiles;
}

/** Constant faint CRT scanline overlay at the vial resolution. */
function makeScan(W, H) {
  const c = document.createElement("canvas"); c.width = W; c.height = H;
  const cx = c.getContext("2d");
  cx.fillStyle = "rgba(0,0,0,0.5)";
  for (let y = 0; y < H; y += 3) cx.fillRect(0, y, W, 1);
  return c;
}

/** Paint one channel-change glitch frame onto the visible canvas from the frozen tints. */
function glitchFrame(ctx, gfx, tints, p, rollY) {
  const W = gfx.W, H = gfx.H;
  const center = 1 - Math.min(1, Math.abs(p - 0.5) * 2); // triangle, peaks mid-tune
  const k = Math.pow(center, 0.7);
  ctx.clearRect(0, 0, W, H);

  // Chromatic split + vertical hold roll (each tile drawn twice to wrap the roll).
  const dx = 1.5 + 9 * k;
  const y = ((rollY % H) + H) % H;
  ctx.globalCompositeOperation = "lighter";
  const put = (img, ox) => { ctx.drawImage(img, ox, y - H); ctx.drawImage(img, ox, y); };
  put(tints.g, 0); put(tints.r, dx); put(tints.b, -dx);

  // Everything below is masked to the vial so the glitch stays on the glass, not the stage.
  ctx.globalCompositeOperation = "source-atop";

  ctx.imageSmoothingEnabled = false;
  const noise = gfx.noise[(Math.random() * gfx.noise.length) | 0];
  ctx.globalAlpha = 0.12 + 0.72 * k;
  ctx.drawImage(noise, 0, 0, noise.width, noise.height, 0, y - H, W, H);
  ctx.drawImage(noise, 0, 0, noise.width, noise.height, 0, y, W, H);
  ctx.imageSmoothingEnabled = true;

  ctx.globalAlpha = 0.22;
  ctx.drawImage(gfx.scan, 0, 0);

  // Bright vertical-hold bar sweeping with the roll.
  ctx.globalAlpha = 0.1 + 0.18 * k;
  const grad = ctx.createLinearGradient(0, y - H * 0.09, 0, y + H * 0.09);
  grad.addColorStop(0, "rgba(255,255,255,0)");
  grad.addColorStop(0.5, "rgba(214,238,255,0.9)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad; ctx.fillRect(0, y - H * 0.09, W, H * 0.18);

  // The "snap" as the new channel locks in.
  const flash = Math.max(0, 1 - Math.abs(p - 0.5) / 0.05);
  if (flash > 0) { ctx.globalAlpha = 0.7 * flash; ctx.fillStyle = "#eaf4ff"; ctx.fillRect(0, 0, W, H); }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

export default function ChannelVial({ channels = [], className = "" }) {
  const canvasRef = useRef(null);
  const readoutRef = useRef(null);
  const [ready, setReady] = useState(false);

  const chRef = useRef(channels);
  chRef.current = channels;

  const colorsRef = useRef(SHOWCASE_PALETTE); // per-channel powder tint (shuffled on mount)
  const prepsRef = useRef(new Map());     // index -> prepared compositor (or in-flight promise)
  const gfxRef = useRef({ noise: null, scan: null, W: 0, H: 0 }); // reusable glitch scratch
  const tintsRef = useRef(null);
  const bufRef = useRef(null);
  const fadeRef = useRef(null);           // { from, to } canvases for reduced-motion dissolve

  const rafRef = useRef(0);
  const curRef = useRef(0);
  const nextRef = useRef(1);
  const rotRef = useRef(0);
  const rollRef = useRef(0);
  const phaseRef = useRef("hold");        // hold | tune (or hold | fade under reduced motion)
  const phaseStartRef = useRef(0);
  const lastRef = useRef(0);
  const swappedRef = useRef(false);
  const stateRef = useRef({ mounted: true, inView: true, tabVisible: true });
  const reducedRef = useRef(false);
  const coarseRef = useRef(false);

  const ssFor = () => (coarseRef.current ? 0.48 : 0.6);

  const buildSVG = (c, accentColor) => {
    const ml = Number(c.vialMl) >= 8 ? 10 : 3;
    const { svg } = labelSVGFromFields({
      name: c.name, mass: c.mass, unit: c.unit || "mg", labelType: "CATALOG",
      formText: (c.formText || "Lyophilized Powder").toUpperCase(),
      storageTemp: "36–46°F", vialMl: ml, accentColor,
    });
    // Always the white-powder base — the powder stays its real white; only the cap and label are
    // colour-coded. Size (3 vs 10 mL) still follows the channel.
    return { svg, ml, baseSrc: silverVialBaseSrc("", ml) };
  };

  const ensurePrep = (i) => {
    const list = chRef.current;
    if (!list.length) return Promise.resolve(null);
    const idx = ((i % list.length) + list.length) % list.length;
    const cache = prepsRef.current;
    const hit = cache.get(idx);
    if (hit) return hit.then ? hit : Promise.resolve(hit);
    const rgb = colorsRef.current[idx % colorsRef.current.length];
    // Coordinated set: dome (base), crimp collar (analogous different hue), label accent (deeper).
    const { dome, crimp, labelHex } = capScheme(rgb);
    const { svg, ml, baseSrc } = buildSVG(list[idx], labelHex);
    const promise = prepareVialCompositor({ svg, vialMl: ml, baseSrc, ss: ssFor(), capTint: dome, crimpTint: crimp })
      .then((prep) => { cache.set(idx, prep); return prep; })
      .catch(() => { cache.delete(idx); return null; });
    cache.set(idx, promise);
    return promise;
  };

  const setReadout = (idx) => {
    const el = readoutRef.current;
    const list = chRef.current;
    if (!el || !list.length) return;
    const n = String((idx % list.length) + 1).padStart(2, "0");
    el.textContent = `CH ${n} · ${list[idx % list.length].name}`;
  };

  const ensureGfx = (buf) => {
    const g = gfxRef.current;
    if (g.W !== buf.width || g.H !== buf.height) {
      g.W = buf.width; g.H = buf.height;
      g.noise = makeNoise(g.W, g.H, 5);
      g.scan = makeScan(g.W, g.H);
    }
  };

  // Snapshot the current live vial frame into a reusable buffer canvas.
  const grabBuffer = (prep, rot, wrap) => {
    let buf = bufRef.current;
    if (!buf) { buf = document.createElement("canvas"); bufRef.current = buf; }
    composeVial(buf, prep, rot, { wrap });
    return buf;
  };

  const active = () => {
    const s = stateRef.current;
    return s.mounted && s.inView && s.tabVisible && prepsRef.current.get(curRef.current) && !prepsRef.current.get(curRef.current)?.then;
  };

  const step = (ts) => {
    if (!active()) { rafRef.current = 0; return; }
    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = 0; return; }
    const ctx = canvas.getContext("2d");
    const dt = Math.min(64, ts - (lastRef.current || ts));
    lastRef.current = ts;
    const cur = prepsRef.current.get(curRef.current);
    const e = ts - phaseStartRef.current;

    if (reducedRef.current) {
      // ---- Reduced motion: hold the still, then cross-dissolve to the next label. ----
      if (phaseRef.current === "hold") {
        if (e >= HOLD_MS) {
          const nxt = prepsRef.current.get(nextRef.current);
          if (nxt && !nxt.then) {
            const from = document.createElement("canvas");
            grabBuffer(cur, 0, false);
            from.width = bufRef.current.width; from.height = bufRef.current.height;
            from.getContext("2d").drawImage(bufRef.current, 0, 0);
            const to = document.createElement("canvas");
            grabBuffer(nxt, 0, false);
            to.width = bufRef.current.width; to.height = bufRef.current.height;
            to.getContext("2d").drawImage(bufRef.current, 0, 0);
            fadeRef.current = { from, to };
            phaseRef.current = "fade"; phaseStartRef.current = ts; swappedRef.current = false;
          } else {
            ensurePrep(nextRef.current); phaseStartRef.current = ts; // wait for it
          }
        }
      } else {
        const p = Math.min(1, e / FADE_MS);
        const { from, to } = fadeRef.current;
        canvas.width = to.width; canvas.height = to.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1 - p; ctx.drawImage(from, 0, 0);
        ctx.globalAlpha = p; ctx.drawImage(to, 0, 0);
        ctx.globalAlpha = 1;
        if (!swappedRef.current && p >= 0.6) { swappedRef.current = true; setReadout(nextRef.current); }
        if (p >= 1) {
          curRef.current = nextRef.current;
          nextRef.current = (curRef.current + 1) % chRef.current.length;
          phaseRef.current = "hold"; phaseStartRef.current = ts;
          setReadout(curRef.current); ensurePrep(nextRef.current);
        }
      }
      rafRef.current = requestAnimationFrame(step);
      return;
    }

    // ---- Full motion: gentle turn, then a channel-change glitch that masks the swap. ----
    if (phaseRef.current === "hold") {
      if (dt >= FRAME_MS || rotRef.current === 0) {
        rotRef.current = (rotRef.current + dt * (1 / SPIN_MS)) % 1;
        composeVial(canvas, cur, rotRef.current, { wrap: true });
      }
      if (e >= HOLD_MS) {
        const nxt = prepsRef.current.get(nextRef.current);
        if (nxt && !nxt.then) {
          const buf = grabBuffer(cur, rotRef.current, true); // freeze the current turn
          ensureGfx(buf);
          tintsRef.current = buildTints(gfxRef.current, buf);
          phaseRef.current = "tune"; phaseStartRef.current = ts; swappedRef.current = false;
        } else {
          ensurePrep(nextRef.current); phaseStartRef.current = ts; // hold until ready
        }
      }
    } else {
      const p = Math.min(1, e / TUNE_MS);
      if (!swappedRef.current && p >= 0.5) {
        swappedRef.current = true;
        curRef.current = nextRef.current;
        nextRef.current = (curRef.current + 1) % chRef.current.length;
        rotRef.current = 0;
        const buf = grabBuffer(prepsRef.current.get(curRef.current), 0, true);
        ensureGfx(buf);
        tintsRef.current = buildTints(gfxRef.current, buf);
        setReadout(curRef.current);
        ensurePrep(nextRef.current);
      }
      rollRef.current += dt * 0.34 * (0.5 + (1 - Math.min(1, Math.abs(p - 0.5) * 2)));
      if (canvas.width !== gfxRef.current.W) canvas.width = gfxRef.current.W;
      if (canvas.height !== gfxRef.current.H) canvas.height = gfxRef.current.H;
      glitchFrame(ctx, gfxRef.current, tintsRef.current, p, rollRef.current * (gfxRef.current.H / 300));
      if (p >= 1) {
        phaseRef.current = "hold"; phaseStartRef.current = ts; lastRef.current = 0;
        composeVial(canvas, prepsRef.current.get(curRef.current), 0, { wrap: true });
      }
    }
    rafRef.current = requestAnimationFrame(step);
  };

  const run = () => {
    if (rafRef.current || !active()) return;
    lastRef.current = 0;
    rafRef.current = requestAnimationFrame(step);
  };

  // Boot: detect motion/pointer, draw the first channel crisp, then start surfing.
  useEffect(() => {
    const s = stateRef.current; s.mounted = true;
    const mm = typeof window !== "undefined" ? window.matchMedia : null;
    reducedRef.current = !!mm?.("(prefers-reduced-motion: reduce)")?.matches;
    coarseRef.current = !!mm?.("(pointer: coarse)")?.matches;
    prepsRef.current = new Map();
    colorsRef.current = shuffled(SHOWCASE_PALETTE); // fresh random colour order each load
    curRef.current = 0; nextRef.current = chRef.current.length > 1 ? 1 : 0;
    phaseRef.current = "hold"; rotRef.current = 0; swappedRef.current = false;

    let cancelled = false;
    ensurePrep(0).then((prep) => {
      if (cancelled || !prep) return;
      const canvas = canvasRef.current;
      if (canvas) composeVial(canvas, prep, 0, { wrap: true });
      setReady(true);
      setReadout(0);
      phaseStartRef.current = performance.now();
      run();
      ensurePrep(1);
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channels]);

  // Pause when off-screen or the tab is hidden; resume on return.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const s = stateRef.current; s.mounted = true;
    let io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => { s.inView = entries.some((en) => en.isIntersecting); if (s.inView) run(); },
        { threshold: 0.05 }
      );
      io.observe(canvas);
    }
    const onVis = () => { s.tabVisible = !document.hidden; if (s.tabVisible) run(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      s.mounted = false;
      cancelAnimationFrame(rafRef.current); rafRef.current = 0;
      if (io) io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="channel-vial">
      <canvas
        ref={canvasRef}
        className={`hero-vial-canvas${ready ? " is-ready" : ""} ${className}`.trim()}
        aria-label="Undisclosed catalog vial, changing channels"
      />
      <div ref={readoutRef} className="channel-vial-readout" aria-hidden="true">CH 01</div>
    </div>
  );
}
