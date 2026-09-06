import React, { useEffect, useRef, useState } from "react";
import { labelSVGFromFields } from "../utils/udSilverLabel";
import {
  silverVialBaseSrc,
  cleanVialBaseSrc,
  powderTintFor,
  prepareVialCompositor,
  composeVial,
} from "../utils/udVialComposite";
import { capSchemeFor } from "../utils/labelColor";

/**
 * Undisclosed landing showcase — a single large hero vial that channel-surfs the catalog. Each
 * "channel" is a real compound: the vial turns slowly on a turntable (the whole label wraps past,
 * same as the catalog vials) for a few seconds, then TUNES to the next compound. The vial never
 * leaves the frame and never changes size — instead the light bends through it: the image is
 * sliced into horizontal bands that a travelling wave displaces and stretches sideways, as if
 * refracted through moving glass, while the outgoing and incoming vials cross-dissolve through a
 * soft chromatic fringe, analog snow and a bloom. A little "CH 0X · NAME" readout underneath
 * sells the dial. Under prefers-reduced-motion it holds each vial still and simply cross-dissolves
 * between the labels — no spin, no bending, no fuzz, no bloom.
 *
 * Self-contained: composites every vial live from name/strength/size (no per-product image),
 * prepares each channel just ahead of time, and pauses when off-screen or the tab is hidden.
 */

const HOLD_MS = 4000;   // slow turntable on each channel before it tunes to the next
const TUNE_MS = 3000;   // the light-bending tune — long and unhurried, not a snap
const FADE_MS = 720;    // reduced-motion cross-dissolve
const HERO_SPIN = 1 / 9000; // label-u per ms — a stately full revolution every ~9s

const smooth = (x) => x * x * (3 - 2 * x); // smoothstep ease

/**
 * Build red / green / blue single-channel copies of a frozen vial for the chromatic fringe.
 * `key` namespaces the scratch canvases so the outgoing and incoming vials can each keep a set
 * and be drawn together during the cross-dissolve.
 */
function buildTints(gfx, buf, key) {
  const W = buf.width, H = buf.height;
  const mk = (ch, color) => {
    const slot = key + ch;
    let c = gfx[slot];
    if (!c) { c = document.createElement("canvas"); gfx[slot] = c; }
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
  return { r: mk("R", "#ff0000"), g: mk("G", "#00ff00"), b: mk("B", "#0000ff") };
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
 * Per-frame band geometry for the tune. The vial is sliced into horizontal bands; each is
 * displaced sideways and stretched by a slow refraction swell plus a faster ripple, and now and
 * then a band slips hard sideways the way a picture tears while you tune it in. It is computed
 * ONCE per frame and shared by both vials and all three colour channels — if each channel rolled
 * its own tears they would desync and the vial would break into confetti instead of tearing as
 * one picture.
 */
function buildBands(W, H, strips, amp, phase, tear) {
  const bands = [];
  for (let i = 0; i < strips; i++) {
    // Integer band bounds so the slices tile exactly — no hairline seams, no double-lit overlaps.
    const y0 = Math.round((i * H) / strips), y1 = Math.round(((i + 1) * H) / strips);
    if (y1 <= y0) continue;
    const u = i / strips;
    const w = 0.66 * Math.sin(u * Math.PI * 2.6 + phase)
            + 0.34 * Math.sin(u * Math.PI * 7.3 - phase * 1.7);
    let off = amp * w;
    if (tear > 0 && Math.random() < 0.16 * tear) off += (Math.random() - 0.5) * W * 0.14 * tear;
    bands.push({ y0, bh: y1 - y0, off, dw: W * (1 + 0.022 * w) });
  }
  return bands;
}

/**
 * Draw one frozen vial (as its three colour channels) through the current band geometry, so the
 * light appears to refract and tear through moving glass. The three channels are offset by
 * `split` and recombined additively for the chromatic fringe of a signal being tuned. Nothing
 * scales up or down and nothing translates as a whole — the vial stays exactly where it is.
 */
function bendTints(ctx, tints, W, alpha, bands, split) {
  if (alpha <= 0.004) return;
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = alpha;
  const put = (img, dx) => {
    for (let i = 0; i < bands.length; i++) {
      const b = bands[i];
      ctx.drawImage(img, 0, b.y0, W, b.bh, dx + b.off - (b.dw - W) / 2, b.y0, b.dw, b.bh);
    }
  };
  put(tints.g, 0); put(tints.r, split); put(tints.b, -split);
}

/**
 * One tune frame: the outgoing and incoming vials cross-dissolve in place, both bent by the same
 * travelling wave, with analog snow and scanlines masked to the glass. Because both are drawn
 * every frame the vial is always present — it tunes from one compound to the next rather than
 * leaving and coming back.
 */
function tuneFrame(ctx, gfx, outT, inT, p, phase, strips) {
  const W = gfx.W, H = gfx.H;
  // A FLAT-TOPPED bell. A plain sine touches full glitch for a single instant and slides off it;
  // clipping an overdriven sine holds the fully torn state across the middle ~60% of the tune, so
  // it can actually be looked at rather than passed through.
  const q = p < 0 ? 0 : p > 1 ? 1 : p;
  const bell = Math.min(1, Math.sin(Math.PI * q) * 1.75);
  const k = Math.pow(bell, 0.75);
  const e = smooth(p);
  ctx.clearRect(0, 0, W, H);

  const amp = W * 0.075 * k;     // how far the light bends
  const split = 1 + 8 * k;       // chromatic fringe
  // One set of bands per frame, shared by both vials so they tear as a single picture.
  const bands = buildBands(W, H, strips, amp, phase, k);
  bendTints(ctx, outT, W, 1 - e, bands, split);
  bendTints(ctx, inT, W, e, bands, split);

  // Fuzz, masked to the glass so it never spills onto the marble.
  ctx.globalCompositeOperation = "source-atop";
  ctx.imageSmoothingEnabled = false;
  const noise = gfx.noise[(Math.random() * gfx.noise.length) | 0];
  ctx.globalAlpha = 0.06 + 0.36 * k;
  ctx.drawImage(noise, 0, 0, noise.width, noise.height, 0, 0, W, H);
  ctx.imageSmoothingEnabled = true;
  ctx.globalAlpha = 0.2 * k;
  ctx.drawImage(gfx.scan, 0, 0);

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = "source-over";
}

/** Additive bloom flash centred on the vial, peaking at the swap — the teleport "snap". */
function teleportBloom(ctx, W, H, k) {
  ctx.globalCompositeOperation = "lighter";
  const cx = W / 2, cy = H * 0.46, r = Math.max(W, H) * 0.55;
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  g.addColorStop(0, `rgba(226,241,255,${0.34 * k})`);
  g.addColorStop(0.35, `rgba(150,196,255,${0.13 * k})`);
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
  const outTintsRef = useRef(null);       // RGB channel copies of the outgoing vial
  const inTintsRef = useRef(null);        // ...and of the incoming one (both drawn during a tune)

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

  // Render resolution, matched to the screen's actual device pixels. The hero is the biggest
  // thing on the page: at the old ss 0.5 its 360x540 backing store was blown up ~2.6x on a 3x
  // phone, which is exactly why the label looked pixelated. The hero displays ~560px tall at most
  // and the base photo is 1080px, so ss = 560*dpr/1080 lands one rendered pixel on one device
  // pixel; clamped so a 1x screen still gets a sharp render and a 3x screen stays affordable to
  // composite every frame. Only affordable at all because composeGreen now reuses its output
  // buffer instead of reallocating a full frame each time.
  const ssFor = () => {
    const dpr = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 2;
    return Math.max(1.0, Math.min(1.25, (560 * Math.min(dpr, 3)) / 1080));
  };
  // Compositing cap for the continuous turn: a touch slower on phones to save battery.
  const frameMs = () => (coarseRef.current ? 40 : 33);
  // Bands the tune slices the vial into — more bands tear more finely; fewer on phones.
  const stripsFor = () => (coarseRef.current ? 18 : 26);

  const buildSVG = (c, accentColor, nameColor) => {
    const ml = Number(c.vialMl) >= 8 ? 10 : 3;
    const { svg } = labelSVGFromFields({
      name: c.name, mass: c.mass, unit: c.unit || "mg", labelType: "CATALOG",
      formText: (c.formText || "Lyophilized Powder").toUpperCase(),
      storageTemp: "36–46°F", vialMl: ml, accentColor, nameColor,
    });
    // The powder keeps its real colour — blue for the blue-powder compounds (KLOW / GLOW /
    // GHK-Cu), white otherwise; the cap and label carry the channel colour. Size follows the channel.
    return { svg, ml, baseSrc: silverVialBaseSrc(c.name, ml), cleanSrc: cleanVialBaseSrc(c.name, ml), powderTint: powderTintFor(c.name) };
  };

  const ensurePrep = (i) => {
    const list = chRef.current;
    if (!list.length) return Promise.resolve(null);
    const idx = ((i % list.length) + list.length) % list.length;
    const cache = prepsRef.current;
    const hit = cache.get(idx);
    if (hit) return hit.then ? hit : Promise.resolve(hit);
    // Each peptide keeps its own catalog cap: a palette colour, the dome finish (painted,
    // clear-tinted or clear), the crimp collar under it, and a matching label accent.
    const { dome, domeFinish, crimp, labelHex, nameHex } = capSchemeFor(list[idx].name);
    const { svg, ml, baseSrc, cleanSrc, powderTint } = buildSVG(list[idx], labelHex, nameHex);
    const promise = prepareVialCompositor({ svg, vialMl: ml, baseSrc, cleanSrc, ss: ssFor(), capTint: dome, capFinish: domeFinish, crimpTint: crimp, powderTint })
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
      if (ts - lastDrawRef.current >= frameMs()) {
        lastDrawRef.current = ts;
        composeVial(canvas, cur, rotRef.current, { wrap: true });
      }
      if (e >= HOLD_MS) {
        const nxt = prepsRef.current.get(nextRef.current);
        if (nxt && !nxt.then) {
          if (!fromRef.current) fromRef.current = document.createElement("canvas");
          if (!toRef.current) toRef.current = document.createElement("canvas");
          snapshot(cur, rotRef.current, fromRef.current); // freeze the current turn
          snapshot(nxt, 0, toRef.current);                // and the incoming vial, front-facing
          ensureGfx(fromRef.current);
          // Both are on screen for the whole tune, so both need their channel copies up front.
          outTintsRef.current = buildTints(gfxRef.current, fromRef.current, "out");
          inTintsRef.current = buildTints(gfxRef.current, toRef.current, "in");
          phaseRef.current = "tune"; phaseStartRef.current = ts; swappedRef.current = false;
        } else {
          ensurePrep(nextRef.current); phaseStartRef.current = ts; // hold until ready
        }
      }
    } else {
      // Tune: the outgoing and incoming vials cross-dissolve in place while a travelling wave
      // bends the light through both. Nothing scales or slides — the vial holds its position.
      const p = Math.min(1, e / TUNE_MS);
      const { W, H } = gfxRef.current;
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;

      // Hand over the channel indices (and the readout) once, mid-dissolve.
      if (!swappedRef.current && p >= 0.5) {
        swappedRef.current = true;
        curRef.current = nextRef.current;
        nextRef.current = (curRef.current + 1) % chRef.current.length;
        rotRef.current = 0;
        setReadout(curRef.current);
        ensurePrep(nextRef.current);
      }

      tuneFrame(ctx, gfxRef.current, outTintsRef.current, inTintsRef.current, p, e / 150, stripsFor());
      const bloom = 1 - Math.min(1, Math.abs(p - 0.5) * 2); // triangle, peaks mid-tune
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
