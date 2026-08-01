import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  drawLabelTemplate,
  downloadVialPng,
  loadUdMark,
  labelSpecForVialMl,
  SITE_QR_URL,
} from "../utils/vialArt";
import { resolveCoaQrPayload } from "../utils/coaStore";

export default function LabelTemplate({
  name = "Peptide",
  mass = "",
  unit = "mg",
  bacWater = "",
  concentration = "",
  doseRange = "",
  sku = "",
  size = "md",
  /** Bottle size in mL — 3 → 40×20 mm, 5 → 40×25, 10 → 50×30, 30 → 70×40. */
  vialMl = 3,
  showDownload = true,
  className = "",
  /** Layout + brand chrome only — no peptide fields filled. */
  blank = false,
  productId = "",
  coaUrl = "",
  qrPayload = "",
}) {
  const canvasRef = useRef(null);
  const [png, setPng] = useState("");
  const [udMark, setUdMark] = useState(null);

  const ml = Number(vialMl) || 3;
  const spec = labelSpecForVialMl(ml);
  const resolvedQr = useMemo(
    () =>
      blank
        ? SITE_QR_URL
        : resolveCoaQrPayload({
            productId,
            coaUrl,
            fallback: qrPayload || SITE_QR_URL,
          }),
    [blank, productId, coaUrl, qrPayload]
  );
  const qrIsCoa = Boolean(
    !blank &&
      resolvedQr &&
      !/^https?:\/\/(www\.)?wellpept\.com\/?$/i.test(resolvedQr)
  );

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
        qrPayload: resolvedQr,
        coaUrl: blank ? "" : resolvedQr,
        forceSiteQr: false,
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
    blank,
    resolvedQr,
  ]);

  function handleDownload() {
    if (!png) return;
    const safe = blank
      ? `blank-${ml}ml`
      : (name || "label").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const mm = `${spec.widthMm}x${spec.heightMm}mm`;
    downloadVialPng(
      png,
      `undisclosed-label-${safe || "template"}-${mm}.png`
    );
  }

  return (
    <div className={`label-template-wrap ${className}`.trim()}>
      <p className="label-template-size meta">
        {spec.widthMm} × {spec.heightMm} mm · {ml} mL · rounded · QR →{" "}
        {blank ? "wellpept.com" : qrIsCoa ? "peptide COA" : "wellpept.com"}
      </p>
      <canvas
        ref={canvasRef}
        className={`label-template label-template--physical label-template--${size}`}
        aria-label={`${blank ? "Blank" : name || "Peptide"} ${spec.widthMm} by ${spec.heightMm} millimeter label for ${ml} milliliter vial`}
      />
      {showDownload && (
        <button type="button" className="soft-btn vial-download" onClick={handleDownload}>
          <Download size={14} /> Download label · free
        </button>
      )}
    </div>
  );
}
