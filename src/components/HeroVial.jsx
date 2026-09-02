import React, { useEffect, useRef, useState } from "react";
import { labelSVGFromFields } from "../utils/udSilverLabel";
import {
  drawSilverLabelVial,
  silverVialBaseSrc,
  prepareVialCompositor,
  composeVial,
} from "../utils/udVialComposite";

// Showcase turntable: a steady, unhurried revolution. Faster than the calculator preview so it
// reads as a "loop" centrepiece, throttled to ~30fps and paused when off-screen or the tab is
// hidden. The label wraps continuously around the (stationary) vial — no reconstructed back, so
// no artifacts. Motion is disabled under prefers-reduced-motion.
const SPIN_MS = 13000; // one revolution
const FRAME_MS = 33;   // ~30fps cap

/**
 * Large, continuously-rotating vial for the Undisclosed landing showcase. Renders the crisp
 * still first (and snapshots it for the rest state), then spins the silver label around the
 * vial. Self-contained and self-cleaning.
 */
export default function HeroVial({
  name = "Vitamin B12",
  mass = "5",
  unit = "mg",
  vialMl = 10,
  formText = "LYOPHILIZED POWDER",
  className = "",
}) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);
  const prepRef = useRef(null);
  const stillRef = useRef(null);
  const rafRef = useRef(0);
  const rotRef = useRef(0);
  const lastRef = useRef(0);
  const stateRef = useRef({ inView: true, tabVisible: true, mounted: true });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    const s = stateRef.current;
    s.mounted = true;

    const ml = Number(vialMl) >= 8 ? 10 : 3;
    const { svg } = labelSVGFromFields({
      name, mass, unit, labelType: "CATALOG",
      formText: (formText || "Lyophilized Powder").toUpperCase(),
      storageTemp: "36–46°F", vialMl: ml,
    });
    const baseSrc = silverVialBaseSrc(name, ml);

    cancelAnimationFrame(rafRef.current);
    prepRef.current = null;
    stillRef.current = null;

    drawSilverLabelVial(canvas, { svg, vialMl: ml, baseSrc })
      .then(() => {
        if (cancelled) return;
        setReady(true);
        try {
          const snap = document.createElement("canvas");
          snap.width = canvas.width; snap.height = canvas.height;
          snap.getContext("2d").drawImage(canvas, 0, 0);
          stillRef.current = snap;
        } catch (_) { /* skip snapshot */ }
        const mm = window.matchMedia;
        if (mm?.("(prefers-reduced-motion: reduce)")?.matches) return;
        const coarse = mm?.("(pointer: coarse)")?.matches;
        prepareVialCompositor({ svg, vialMl: ml, baseSrc, ss: coarse ? 0.45 : 0.6 })
          .then((prep) => { if (cancelled) return; prepRef.current = prep; rotRef.current = 0; run(); })
          .catch(() => {});
      })
      .catch((err) => console.error("Hero vial composite failed", err));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, mass, unit, vialMl, formText]);

  const active = () => {
    const s = stateRef.current;
    return s.mounted && s.inView && s.tabVisible && prepRef.current;
  };

  const restoreStill = () => {
    const canvas = canvasRef.current;
    const snap = stillRef.current;
    if (canvas && snap) {
      canvas.width = snap.width; canvas.height = snap.height;
      canvas.getContext("2d").drawImage(snap, 0, 0);
    }
  };

  const step = (ts) => {
    if (!active()) { rafRef.current = 0; restoreStill(); return; }
    const last = lastRef.current || ts;
    const dt = Math.min(64, ts - last);
    if (dt >= FRAME_MS) {
      rotRef.current = (rotRef.current + dt * (1 / SPIN_MS)) % 1;
      composeVial(canvasRef.current, prepRef.current, rotRef.current, { wrap: true });
      lastRef.current = ts;
    }
    rafRef.current = requestAnimationFrame(step);
  };

  const run = () => {
    if (rafRef.current) return;
    if (!active()) return;
    lastRef.current = 0;
    rafRef.current = requestAnimationFrame(step);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const s = stateRef.current;
    s.mounted = true;
    let io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => { s.inView = entries.some((e) => e.isIntersecting); if (s.inView) run(); },
        { threshold: 0.05 }
      );
      io.observe(canvas);
    }
    const onVis = () => { s.tabVisible = !document.hidden; if (s.tabVisible) run(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      s.mounted = false;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (io) io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`hero-vial-canvas${ready ? " is-ready" : ""} ${className}`.trim()}
      aria-label={`${name} Undisclosed vial, rotating`}
    />
  );
}
