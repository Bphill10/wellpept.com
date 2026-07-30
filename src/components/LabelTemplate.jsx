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
  coaUrl = "",
  showDownload = true,
  className = "",
  /** Layout + brand chrome only — no peptide fields filled. */
  blank = false,
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
        name: blank ? "" : name,
        mass: blank ? "" : mass,
        unit,
        bacWater: blank ? "" : bacWater,
        concentration: blank ? "" : concentration,
        doseRange: blank ? "" : doseRange,
        sku: blank ? "" : sku,
        size,
        wpMark,
        qrPayload: blank ? "" : qrPayload,
        coaUrl: blank ? "" : coaUrl,
        blank,
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
    coaUrl,
    blank,
  ]);

  function handleDownload() {
    if (!png) return;
    const safe = blank
      ? "blank"
      : (name || "label").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
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
          <Download size={14} /> Download label
        </button>
      )}
    </div>
  );
}
