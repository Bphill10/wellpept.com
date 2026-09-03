import React, { useEffect, useRef, useState } from "react";
import { labelSVGFromFields } from "../utils/udSilverLabel";
import {
  silverVialBaseSrc,
  prepareVialCompositor,
  composeVial,
} from "../utils/udVialComposite";
import { capScheme, catalogCapColor } from "../utils/labelColor";

/**
 * Undisclosed landing showcase — a single large hero vial that channel-surfs the catalog. Each
 * "channel" is a real compound: the vial turns slowly on a turntable (the whole label wraps past,
 * same as the catalog vials) for a few seconds, then TELEPORTS to the next compound through a
 * burst of old-TV fuzz — the current vial breaks into RGB-split analog snow as it shrinks to its
 * centre and fades, and the next one crackles back out the same way, with a bright bloom at the
 * swap. It goes "in and out", never rolling up and down. A little "CH 0X · NAME" readout
 * underneath sells the dial. Under prefers-reduced-motion it holds each vial still and simply
 * cross-dissolves between the labels — no spin, no scaling, no fuzz, no bloom.
 *
 * Self-contained: composites every vial live from name/strength/size (no per-product image),
 * prepares each channel just ahead of time, and pauses when off-screen or the tab is hidden.
 */

const HOLD_MS = 3600;   // slow turntable on each channel before it teleports
const TUNE_MS = 760;    // the fuzzy teleport (dematerialise → rematerialise)
const FADE_MS = 720;    // reduced-motion cross-dissolve
const FRAME_MS = 33;    // ~30fps cap for the continuous hold spin (power-friendly)
const HERO_SPIN = 1 / 9000; // label-u per ms — a stately full revolution every ~9s

const smooth = (x) => x * x * (3 - 2 * x); // smoothstep ease

/** Build red / green / blue single-channel copies of a frozen vial for the chromatic split. */
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

/**
 * One fuzzy-teleport frame. The frozen vial (as RGB tints) is drawn scaled about its centre and
 * faded — shrinking away on the way OUT, growing back on the way IN — with the channel-change
 * fuzz on top: a chromatic split that widens toward the swap, analog snow, and faint scanlines,
 * all masked to the glass. There is deliberately no vertical roll.
 */
function fuzzFrame(ctx, gfx, tints, out, t, p) {
  const W = gfx.W, H = gfx.H;
  const center = 1 - Math.min(1, Math.abs(p - 0.5) * 2); // triangle, peaks at the swap
  const k = Math.pow(center, 0.7);
  const e = smooth(t);
  const alpha = out ? 1 - e : e;
  const scale = out ? 1 - 0.34 * e : 0.66 + 0.34 * e;
  const w = W * scale, h = H * scale, ox = (W - w) / 2, oy = (H - h) / 2;
  ctx.clearRect(0, 0, W, H);
  if (alpha <= 0.003) return;

  // Chromatic split: the three channels drift apart sideways as the signal breaks up.
  const dx = 1.5 + 9 * k;
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = alpha;
  ctx.drawImage(tints.g, ox, oy, w, h);
  ctx.drawImage(tints.r, ox + dx, oy, w, h);
  ctx.drawImage(tints.b, ox - dx, oy, w, h);

  // Everything below is masked to the vial so the fuzz stays on the glass, not the stage.
  ctx.globalCompositeOperation = "source-atop";
  ctx.imageSmoothingEnabled = false;
  const noise = gfx.noise[(Math.random() * gfx.noise.length) | 0];
  ctx.globalAlpha = (0.12 + 0.72 * k) * alpha;
  ctx.drawImage(noise, 0, 0, noise.width, noise.height, 0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = 0.22 * alpha;
  ctx.drawImage(gfx.scan, 0, 0);

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/** Additive bloom flash centred on the vial, peaking at the swap — the teleport "snap". */
function teleportBloom(ctx, W, H, k) {
  ctx.globalCompositeOperation = "lighter";
  const cx = W / 2, cy = H * 0.46, r = Math.max(W, H) * 0.55;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, `rgba(226,241,255,${0.55 * k})`);
  g.addColorStop(0.35, `rgba(150,196,255,${0.20 * k})`);
  g.addColorStop(1, "rgba(120,170,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
}

export default function ChannelVial({ channels = [], className = "" }) {
  const canvasRef = useRef(null);
  const readoutRef = useRef(null);
  const [ready, setReady] = useState(false);

  const chRef = useRef(channels);
  chRef.current = channels;

  const prepsRef = useRef(new Map());     // index -> prepared compositor (or in-flight promise)
  const bufRef = useRef(null);            // scratch canvas for composing a vial before snapshotting
  const fromRef = useRef(null);           // frozen OUTgoing vial (dematerialise)
  const toRef = useRef(null);             // frozen INcoming vial (rematerialise)
  const gfxRef = useRef({ noise: null, scan: null, W: 0, H: 0 }); // reusable fuzz scratch
  const tintsRef = useRef(null);          // RGB tints of whichever vial is currently teleporting

  const rafRef = useRef(0);
  const curRef = useRef(0);
  const nextRef = useRef(1);
  const rotRef = useRef(0);
  const phaseRef = useRef("hold");        // hold | tune (fuzzy teleport, or cross-dissolve when reduced)
  const phaseStartRef = useRef(0);
  const lastRef = useRef(0);
  const lastDrawRef = useRef(0);          // last hold-spin composite time (for the 30fps cap)
  const swappedRef = useRef(false);
  const stateRef = useRef({ mounted: true, inView: true, tabVisible: true });
  const reducedRef = useRef(false);
  const coarseRef = useRef(false);

  const ssFor = () => (coarseRef.current ? 0.5 : 0.66);

  const buildSVG = (c, accentColor) => {
    const ml = Number(c.vialMl) >= 8 ? 10 : 3;
    const { svg } = labelSVGFromFields({
      name: c.name, mass: c.mass, unit: c.unit || "mg", labelType: "CATALOG",
      formText: (c.formText || "Lyophilized Powder").toUpperCase(),
      storageTemp: "36–46°F", vialMl: ml, accentColor,
    });
    // The powder keeps its real colour — blue for the blue-powder compounds (KLOW / GLOW /
    // GHK-Cu), white otherwise; the cap and label carry the channel colour. Size follows the channel.
    return { svg, ml, baseSrc: silverVialBaseSrc(c.name, ml) };
  };

  const ensurePrep = (i) => {
    const list = chRef.current;
    if (!list.length) return Promise.resolve(null);
    const idx = ((i % list.length) + list.length) % list.length;
    const cache = prepsRef.current;
    const hit = cache.get(idx);
    if (hit) return hit.then ? hit : Promise.resolve(hit);
    // Each peptide keeps its own catalog colour (KLOW/GLOW/GHK blue, B12 crimson, etc.).
    const rgb = catalogCapColor(list[idx].name);
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

  // (Re)build the noise/scanline scratch whenever the frozen vial size changes.
  const ensureGfx = (buf) => {
    const g = gfxRef.current;
    if (g.W !== buf.width || g.H !== buf.height) {
      g.W = buf.width; g.H = buf.height;
      g.noise = makeNoise(g.W, g.H, 5);
      g.scan = makeScan(g.W, g.H);
    }
  };

  // Compose a vial into the scratch buffer and snapshot it into `dest` (a persistent canvas).
  const snapshot = (prep, rot, dest) => {
    let buf = bufRef.current;
    if (!buf) { buf = document.createElement("canvas"); bufRef.current = buf; }
    composeVial(buf, prep, rot, { wrap: true });
    dest.width = buf.width; dest.height = buf.height;
    dest.getContext("2d").drawImage(buf, 0, 0);
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
            if (!fromRef.current) fromRef.current = document.createElement("canvas");
            if (!toRef.current) toRef.current = document.createElement("canvas");
            snapshot(cur, 0, fromRef.current);
            snapshot(nxt, 0, toRef.current);
            phaseRef.current = "tune"; phaseStartRef.current = ts; swappedRef.current = false;
          } else {
            ensurePrep(nextRef.current); phaseStartRef.current = ts; // wait for it
          }
        }
      } else {
        const p = Math.min(1, e / FADE_MS);
        const from = fromRef.current, to = toRef.current;
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

    // ---- Full motion: slow turntable, then a fuzzy teleport that masks the swap. ----
    if (phaseRef.current === "hold") {
      // Continuous rotation (whole label wraps past), composited at ~30fps to save power.
      // lastDrawRef is reset to 0 on entering hold, so the first frame always draws.
      rotRef.current += dt * HERO_SPIN;
      if (ts - lastDrawRef.current >= FRAME_MS) {
        lastDrawRef.current = ts;
        composeVial(canvas, cur, rotRef.current, { wrap: true });
      }
      if (e >= HOLD_MS) {
        const nxt = prepsRef.current.get(nextRef.current);
        if (nxt && !nxt.then) {
          if (!fromRef.current) fromRef.current = document.createElement("canvas");
          snapshot(cur, rotRef.current, fromRef.current); // freeze the current turn
          ensureGfx(fromRef.current);
          tintsRef.current = buildTints(gfxRef.current, fromRef.current);
          phaseRef.current = "tune"; phaseStartRef.current = ts; swappedRef.current = false;
        } else {
          ensurePrep(nextRef.current); phaseStartRef.current = ts; // hold until ready
        }
      }
    } else {
      // Fuzzy teleport: out (shrink + fade in static) → swap → in (grow + fade in static),
      // with a bloom at the midpoint. The canvas is locked to the frozen vial's size.
      const p = Math.min(1, e / TUNE_MS);
      const { W, H } = gfxRef.current;
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      if (!swappedRef.current && p >= 0.5) {
        swappedRef.current = true;
        curRef.current = nextRef.current;
        nextRef.current = (curRef.current + 1) % chRef.current.length;
        rotRef.current = 0;
        if (!toRef.current) toRef.current = document.createElement("canvas");
        snapshot(prepsRef.current.get(curRef.current), 0, toRef.current); // incoming, front-facing
        ensureGfx(toRef.current);
        tintsRef.current = buildTints(gfxRef.current, toRef.current);
        setReadout(curRef.current);
        ensurePrep(nextRef.current);
      }

      if (p < 0.5) fuzzFrame(ctx, gfxRef.current, tintsRef.current, true, p / 0.5, p);
      else fuzzFrame(ctx, gfxRef.current, tintsRef.current, false, (p - 0.5) / 0.5, p);
      const bloom = 1 - Math.min(1, Math.abs(p - 0.5) * 2); // triangle, peaks at the swap
      if (bloom > 0) teleportBloom(ctx, W, H, bloom);

      if (p >= 1) {
        phaseRef.current = "hold"; phaseStartRef.current = ts; lastRef.current = 0;
        rotRef.current = 0; lastDrawRef.current = 0;
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
    curRef.current = 0; nextRef.current = chRef.current.length > 1 ? 1 : 0;
    phaseRef.current = "hold"; rotRef.current = 0; swappedRef.current = false; lastDrawRef.current = 0;

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
