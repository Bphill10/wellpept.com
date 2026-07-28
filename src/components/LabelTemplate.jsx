import React, { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  drawLabelTemplate,
  downloadVialPng,
  loadUdMark,
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
  showDownload = true,
  className = "",
}) {
  const canvasRef = useRef(null);
  const [png, setPng] = useState("");
  const [udMark, setUdMark] = useState(null);

  useEffect(() => {
    let alive = true;
    loadUdMark().then((img) => {
      if (alive) setUdMark(img);
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
        udMark,
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
    udMark,
  ]);

  function handleDownload() {
    if (!png) return;
    const safe = (name || "label").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadVialPng(png, `undisclosed-label-${safe || "template"}.png`);
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
