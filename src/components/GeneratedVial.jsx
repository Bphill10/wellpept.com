import React, { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  drawGeneratedVial,
  downloadVialPng,
  loadBrandVial,
  loadWpMark,
  resolveVialMl,
} from "../utils/vialArt";

export default function GeneratedVial({
  name = "Peptide",
  subtitle = "",
  sku = "",
  mass = "",
  unit = "mg",
  category = "Research",
  mixText = "",
  doseRef = "",
  bacWater = "",
  concentration = "",
  doseRange = "",
  summary = "",
  size = "md",
  reconstituted = false,
  vialMl,
  form = "",
  qrPayload = "",
  showDownload = false,
  className = "",
}) {
  const canvasRef = useRef(null);
  const [png, setPng] = useState("");
  const [brandVial, setBrandVial] = useState(null);
  const [wpMark, setWpMark] = useState(null);
  const resolvedMl = resolveVialMl({ form: form || subtitle, vialMl });

  useEffect(() => {
    let alive = true;
    Promise.all([loadBrandVial(), loadWpMark()]).then(([vial, mark]) => {
      if (!alive) return;
      setBrandVial(vial);
      setWpMark(mark);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = drawGeneratedVial(canvas, {
        name,
        subtitle,
        sku,
        mass,
        unit,
        category,
        mixText,
        doseRef,
        bacWater,
        concentration,
        doseRange,
        summary,
        size,
        reconstituted,
        vialMl: resolvedMl,
        form: form || subtitle,
        brandVial,
        wpMark,
        qrPayload,
      });
      setPng(dataUrl);
    } catch (err) {
      console.error("Vial render failed", err);
    }
  }, [
    name,
    subtitle,
    sku,
    mass,
    unit,
    category,
    mixText,
    doseRef,
    bacWater,
    concentration,
    doseRange,
    summary,
    size,
    reconstituted,
    resolvedMl,
    form,
    brandVial,
    wpMark,
    qrPayload,
  ]);

  function handleDownload() {
    if (!png) return;
    const safeName = (name || "peptide").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadVialPng(png, `wellpept-${safeName || "vial"}.png`);
  }

  return (
    <div className={`generated-vial-wrap ${className}`.trim()}>
      <canvas
        ref={canvasRef}
        className={`generated-vial generated-vial--${size} generated-vial--${resolvedMl}ml`}
        aria-label={`${name} Wellpept brand vial`}
      />
      {showDownload && (
        <button type="button" className="soft-btn vial-download" onClick={handleDownload}>
          <Download size={14} /> Download vial
        </button>
      )}
    </div>
  );
}
