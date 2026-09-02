import React, { useCallback, useEffect, useRef, useState } from "react";
import { labelSVGFromFields } from "../utils/udSilverLabel";
import {
  prepareVialCompositor,
  composeVial,
  silverVialBaseSrc,
  ROT_MIN,
  ROT_MAX,
} from "../utils/udVialComposite";

/**
 * Live, turnable vial preview: wraps the current silver label (catalog or dosage, incl.
 * custom branding) onto a real vial photo. Drag left/right to rotate the bottle and read
 * the whole label around it. The label is rendered once per field change; rotation only
 * re-runs the fast wrap, so dragging stays smooth.
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
  vialMl = 3,
  className = "",
}) {
  const canvasRef = useRef(null);
  const preparedRef = useRef(null);
  const rotRef = useRef(0);
  const rafRef = useRef(0);
  const [ready, setReady] = useState(false);

  const scheduleDraw = useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      const canvas = canvasRef.current;
      if (canvas && preparedRef.current) composeVial(canvas, preparedRef.current, rotRef.current);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ml = Number(vialMl) >= 8 ? 10 : 3;
    const { svg } = labelSVGFromFields({
      name, mass, unit, labelType, formText, storageTemp,
      diluent, concentration, doseValue, doseUnits, brandName, brandImage, vialMl: ml,
    });
    const baseSrc = silverVialBaseSrc(name, ml);
    prepareVialCompositor({ svg, vialMl: ml, baseSrc })
      .then((prep) => {
        if (cancelled) return;
        preparedRef.current = prep;
        const canvas = canvasRef.current;
        if (canvas) composeVial(canvas, prep, rotRef.current);
        setReady(true);
      })
      .catch((err) => console.error("Vial composite failed", err));
    return () => { cancelled = true; };
  }, [
    name, mass, unit, labelType, formText, storageTemp,
    diluent, concentration, doseValue, doseUnits, brandName, brandImage, vialMl,
  ]);

  // Drag / swipe to rotate the bottle.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let dragging = false, startX = 0, startRot = 0;
    const clampRot = (r) => Math.max(ROT_MIN, Math.min(ROT_MAX, r));
    const down = (e) => {
      dragging = true;
      startX = e.clientX;
      startRot = rotRef.current;
      try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
    };
    const move = (e) => {
      if (!dragging) return;
      const dx = (e.clientX - startX) / (canvas.clientWidth || 1);
      rotRef.current = clampRot(startRot + dx * (ROT_MAX - ROT_MIN) * 1.15);
      scheduleDraw();
    };
    const up = () => { dragging = false; };
    canvas.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      canvas.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [scheduleDraw]);

  return (
    <canvas
      ref={canvasRef}
      className={`silver-label-vial${ready ? " is-ready" : ""} ${className}`.trim()}
      aria-label={`${name || "Peptide"} Undisclosed vial — drag to rotate`}
    />
  );
}
