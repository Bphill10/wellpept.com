import React, { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import { drawGeneratedVial, downloadVialPng } from "../utils/vialArt";

export default function GeneratedVial({
  name = "Peptide",
  subtitle = "",
  sku = "",
  mass = "",
  category = "Research",
  mixText = "",
  doseRef = "",
  size = "md",
  reconstituted = false,
  showDownload = false,
  className = "",
}) {
  const canvasRef = useRef(null);
  const [png, setPng] = useState("");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = drawGeneratedVial(canvas, {
      name,
      subtitle,
      sku,
      mass,
      category,
      mixText,
      doseRef,
      size,
      reconstituted,
    });
    setPng(dataUrl);
  }, [name, subtitle, sku, mass, category, mixText, doseRef, size, reconstituted]);

  function handleDownload() {
    if (!png) return;
    const safeName = (name || "peptide").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadVialPng(png, `undisclosed-${safeName || "vial"}.png`);
  }

  return (
    <div className={`generated-vial-wrap ${className}`.trim()}>
      <canvas ref={canvasRef} className={`generated-vial generated-vial--${size}`} />
      {showDownload && (
        <button type="button" className="soft-btn vial-download" onClick={handleDownload}>
          <Download size={14} /> Download vial
        </button>
      )}
    </div>
  );
}
