import React, { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  drawLabelTemplate,
  downloadVialPng,
  loadWpMark,
} from "../utils/vialArt";

export default function LabelTemplate({
  name = "Peptide",
  mass = "",
  unit = "mg",
  bacWater = "",
  concentration = "",
  doseRange = "",
  sku = "",
  size = "md",
  qrPayload = "",
  showDownload = true,
  className = "",
}) {
  const canvasRef = useRef(null);
  const [png, setPng] = useState("");
  const [wpMark, setWpMark] = useState(null);

  useEffect(() => {
    let alive = true;
    loadWpMark().then((img) => {
      if (alive) setWpMark(img);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const dataUrl = drawLabelTemplate(canvas, {
        name,
        mass,
        unit,
        bacWater,
        concentration,
        doseRange,
        sku,
        size,
        wpMark,
        qrPayload,
      });
      setPng(dataUrl);
    } catch (err) {
      console.error("Label template render failed", err);
    }
  }, [
    name,
    mass,
    unit,
    bacWater,
    concentration,
    doseRange,
    sku,
    size,
    wpMark,
    qrPayload,
  ]);

  function handleDownload() {
    if (!png) return;
    const safe = (name || "label").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadVialPng(png, `wellpept-label-${safe || "template"}.png`);
  }

  return (
    <div className={`label-template-wrap ${className}`.trim()}>
      <canvas
        ref={canvasRef}
        className={`label-template label-template--${size}`}
      />
      {showDownload && (
        <button type="button" className="soft-btn vial-download" onClick={handleDownload}>
          <Download size={14} /> Download QR label
        </button>
      )}
    </div>
  );
}
