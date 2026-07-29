import React, { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  drawGeneratedVial,
  downloadVialPng,
  resolveVialMl,
  loadBrandVial,
  loadBrandVial10,
} from "../utils/vialArt";

// Warm the photoreal vial photos so first paint is fast.
if (typeof window !== "undefined") {
  loadBrandVial();
  loadBrandVial10();
}

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
  const resolvedMl = resolveVialMl({ form: form || subtitle, vialMl });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    (async () => {
      try {
        const dataUrl = await drawGeneratedVial(canvas, {
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
          qrPayload,
        });
        if (!cancelled) setPng(dataUrl);
      } catch (err) {
        console.error("Vial render failed", err);
      }
    })();
    return () => {
      cancelled = true;
    };
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
    qrPayload,
  ]);

  function handleDownload() {
    if (!png) return;
    const safeName = (name || "peptide").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadVialPng(png, `undisclosed-${safeName || "vial"}.png`);
  }

  return (
    <div className={`generated-vial-wrap ${className}`.trim()}>
      <canvas
        ref={canvasRef}
        className={`generated-vial generated-vial--${size} generated-vial--${resolvedMl}ml`}
        aria-label={`${name} Undisclosed labeled vial`}
      />
      {showDownload && (
        <button type="button" className="soft-btn vial-download" onClick={handleDownload}>
          <Download size={14} /> Download vial
        </button>
      )}
    </div>
  );
}
