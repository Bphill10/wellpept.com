import React, { useEffect, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  drawLabelTemplate,
  downloadVialPng,
  loadUdMark,
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
  /** Bottle size in mL — 3 → 40×20 mm, 10 → 50×30 mm. */
  vialMl = 3,
  showDownload = true,
  className = "",
  /** Layout + brand chrome only — no peptide fields filled. */
  blank = false,
}) {
  const canvasRef = useRef(null);
  const [png, setPng] = useState("");
  const [udMark, setUdMark] = useState(null);
  const [blankLabelImage, setBlankLabelImage] = useState(null);

  const ml = Number(vialMl) || 3;
  const spec = labelSpecForVialMl(ml);
  const usesFolderArt = blank && ml === 3;

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
        vialMl: ml,
        udMark,
        blankLabelImage,
        qrPayload: SITE_QR_URL,
        coaUrl: "",
        forceSiteQr: true,
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
    ml,
    udMark,
    blankLabelImage,
    blank,
    usesFolderArt,
  ]);

  function handleDownload() {
    if (!png) return;
    const safe = blank
      ? `blank-${ml}ml`
      : (name || "label").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    downloadVialPng(png, `undisclosed-label-${safe || "template"}.png`);
  }

  return (
    <div className={`label-template-wrap ${className}`.trim()}>
      <p className="label-template-size meta">
        {spec.widthMm} × {spec.heightMm} mm · {ml} mL vial · rounded · QR →
        wellpept.com
      </p>
      <canvas
        ref={canvasRef}
        className={`label-template label-template--physical label-template--${size}`}
        aria-label={`${blank ? "Blank" : name || "Peptide"} ${spec.widthMm} by ${spec.heightMm} millimeter label for ${ml} milliliter vial`}
      />
      {showDownload && (
        <button type="button" className="soft-btn vial-download" onClick={handleDownload}>
          <Download size={14} /> Download label
        </button>
      )}
    </div>
  );
}
