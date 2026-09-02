import React, { useEffect, useRef, useState } from "react";
import { labelSVGFromFields } from "../utils/udSilverLabel";
import {
  drawSilverLabelVial,
  silverVialBaseSrc,
  prepareVialCompositor,
  composeVial,
} from "../utils/udVialComposite";

// Hero turntable: one slow revolution every ~18s, throttled to ~30fps (plenty for a slow spin)
// and paused whenever it's off-screen, the tab is hidden, or the pointer is hovering it (so it
// holds still to be read/grabbed).
const SPIN_SPEED = 1 / 18000; // label-u per ms
const FRAME_MS = 33; // ~30fps cap

/**
 * Live vial preview: wraps the current silver label (catalog or dosage, incl. custom
 * branding) onto a real vial photo. Reflects the calculator's fields as they change, and
 * slowly turns so the whole label wraps past — the "rotating label" showcase. The crisp still
 * is rendered first (and snapshotted), and the spin composites at a small resolution so it
 * stays smooth; hovering it pauses on the current face so it can be read.
 */
export default function SilverLabelVial({
  name = "Peptide",
  mass = "",
  unit = "mg",
  labelType = "CALCULATOR",
  formText = "LYOPHILIZED POWDER",
  storageTemp = "36–46°F",
  diluent = "",
  concentration = "",
  doseValue = "",
  doseUnits = "",
  brandName = "UNDISCLOSED",
  brandImage = "",
  qrPayload = "",
  vialMl = 3,
  className = "",
}) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  const preparedRef = useRef(null); // low-res bare compositor for the spin
  const stillRef = useRef(null);    // crisp snapshot for the rest state
  const rafRef = useRef(0);
  const rotRef = useRef(0);
  const lastPaintRef = useRef(0);
  const stateRef = useRef({ inView: true, tabVisible: true, hovered: false, mounted: true });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    const s = stateRef.current;
    s.mounted = true;

    const ml = Number(vialMl) >= 8 ? 10 : 3;
    const { svg } = labelSVGFromFields({
      name, mass, unit, labelType, formText, storageTemp,
      diluent, concentration, doseValue, doseUnits, brandName, brandImage, qrPayload, vialMl: ml,
    });
    const baseSrc = silverVialBaseSrc(name, ml);

    // Stop any prior spin while we re-render the still for the new fields.
    cancelAnimationFrame(rafRef.current);
    preparedRef.current = null;
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

        // Build the low-res spin compositor (motion allowed only).
        const mm = window.matchMedia;
        if (mm?.("(prefers-reduced-motion: reduce)")?.matches) return;
        const coarse = mm?.("(pointer: coarse)")?.matches;
        prepareVialCompositor({ svg, vialMl: ml, baseSrc, ss: coarse ? 0.4 : 0.5 })
          .then((prep) => {
            if (cancelled) return;
            preparedRef.current = prep;
            rotRef.current = 0;
            maybeRun();
          })
          .catch(() => {});
      })
      .catch((err) => console.error("Vial composite failed", err));
    return () => { cancelled = true; };
  }, [
    name, mass, unit, labelType, formText, storageTemp,
    diluent, concentration, doseValue, doseUnits, brandName, brandImage, qrPayload, vialMl,
  ]);

  const restoreStill = () => {
    const canvas = canvasRef.current;
    const snap = stillRef.current;
    if (canvas && snap) {
      canvas.width = snap.width; canvas.height = snap.height;
      canvas.getContext("2d").drawImage(snap, 0, 0);
    }
  };

  const spinActive = () => {
    const s = stateRef.current;
    return s.mounted && s.inView && s.tabVisible && !s.hovered && preparedRef.current;
  };

  const step = (ts) => {
    if (!spinActive()) { rafRef.current = 0; restoreStill(); return; }
    const last = lastPaintRef.current || ts;
    const dt = Math.min(64, ts - last);
    if (dt >= FRAME_MS) {
      rotRef.current = (rotRef.current + dt * SPIN_SPEED) % 1;
      composeVial(canvasRef.current, preparedRef.current, rotRef.current, { wrap: true });
      lastPaintRef.current = ts;
    }
    rafRef.current = requestAnimationFrame(step);
  };

  const maybeRun = () => {
    if (rafRef.current) return;
    if (!spinActive()) return;
    lastPaintRef.current = 0;
    rafRef.current = requestAnimationFrame(step);
  };

  // View / tab-visibility / hover gating.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const s = stateRef.current;
    s.mounted = true;

    let io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          s.inView = entries.some((e) => e.isIntersecting);
          if (s.inView) maybeRun();
        },
        { threshold: 0.05 }
      );
      io.observe(canvas);
    }
    const onVis = () => { s.tabVisible = !document.hidden; if (s.tabVisible) maybeRun(); };
    const onEnter = () => { s.hovered = true; };
    const onLeave = () => { s.hovered = false; maybeRun(); };
    document.addEventListener("visibilitychange", onVis);
    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      s.mounted = false;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
      if (io) io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`silver-label-vial${ready ? " is-ready" : ""} ${className}`.trim()}
      aria-label={`${name || "Peptide"} Undisclosed vial`}
    />
  );
}
