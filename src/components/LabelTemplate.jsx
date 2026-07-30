import React, { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  drawLabelTemplate,
  downloadVialPng,
  loadWpMark,
  loadBlankLabelImage,
  labelSpecForVialMl,
  SITE_QR_URL,
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
  /** Bottle size in mL — 3 mL blank labels use the 40×20 mm folder art. */
  vialMl = 3,
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
  const [blankLabelImage, setBlankLabelImage] = useState(null);

  const spec = labelSpecForVialMl(vialMl);
  const usesFolderArt = blank && (Number(vialMl) || 3) === 3;

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
    if (!usesFolderArt) return undefined;
    let alive = true;
    loadBlankLabelImage().then((img) => {
      if (alive) setBlankLabelImage(img);
    });
    return () => {
      alive = false;
    };
  }, [usesFolderArt]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (usesFolderArt && !blankLabelImage) return;
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
        vialMl,
        wpMark,
        blankLabelImage,
        qrPayload: blank ? qrPayload || SITE_QR_URL : qrPayload,
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
    vialMl,
    wpMark,
    blankLabelImage,
    qrPayload,
    coaUrl,
    blank,
    usesFolderArt,
  ]);

  function handleDownload() {
    if (!png) return;
    const safe = blank
      ? `blank-${Number(vialMl) || 3}ml`
      : (name || "label").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadVialPng(png, `undisclosed-label-${safe || "template"}.png`);
  }

  return (
    <div className={`label-template-wrap ${className}`.trim()}>
      {usesFolderArt && (
        <p className="label-template-size meta">
          {spec.widthMm} × {spec.heightMm} mm · {Number(vialMl) || 3} mL vial
        </p>
      )}
      <canvas
        ref={canvasRef}
        className={`label-template label-template--${size}${
          usesFolderArt ? " label-template--physical" : ""
        }`}
        aria-label={
          usesFolderArt
            ? `Blank ${spec.widthMm} by ${spec.heightMm} millimeter label for ${Number(vialMl) || 3} milliliter vial`
            : "Label template"
        }
      />
      {showDownload && (
        <button type="button" className="soft-btn vial-download" onClick={handleDownload}>
          <Download size={14} /> Download label
        </button>
      )}
    </div>
  );
}
