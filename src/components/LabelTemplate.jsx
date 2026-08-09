import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  drawLabelTemplate,
  downloadVialPng,
  loadUdMark,
  loadSentinelMascot,
  labelSpecForVialMl,
  SITE_QR_URL,
  udLabelTemplateById,
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
  /** Bottle size in mL — 3 → 40×20 mm, 10 → 50×30 mm. */
  vialMl = 3,
  /** CATALOG (no dosage) | CALCULATOR (diluent / conc / dose). */
  labelType = "CALCULATOR",
  formText = "LYOPHILIZED POWDER",
  storageTemp = "36–46°F",
  showDownload = true,
  className = "",
  /** Layout + brand chrome only — no peptide fields filled. */
  blank = false,
  productId = "",
  coaUrl = "",
  qrPayload = "",
  /** Optional UD template id for meta caption. */
  templateId = "",
}) {
  const canvasRef = useRef(null);
  const [png, setPng] = useState("");
  const [udMark, setUdMark] = useState(null);
  const [mascot, setMascot] = useState(null);

  const ml = Number(vialMl) || 3;
  const spec = labelSpecForVialMl(ml);
  const type = String(labelType || "CALCULATOR").toUpperCase() === "CATALOG"
    ? "CATALOG"
    : "CALCULATOR";
  const templateMeta = templateId ? udLabelTemplateById(templateId) : null;
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
    Promise.all([loadUdMark(), loadSentinelMascot()]).then(([mark, sentinel]) => {
      if (!alive) return;
      setUdMark(mark);
      setMascot(sentinel);
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
        labelType: type,
        formText,
        storageTemp,
        udMark,
        mascot,
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
    type,
    formText,
    storageTemp,
    udMark,
    mascot,
    blank,
    resolvedQr,
  ]);

  function handleDownload() {
    if (!png) return;
    const safe = blank
      ? `blank-${ml}ml`
      : (name || "label").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const mm = `${spec.widthMm}x${spec.heightMm}mm`;
    const kind = type.toLowerCase();
    downloadVialPng(
      png,
      `undisclosed-${kind}-label-${safe || "template"}-${mm}.png`
    );
  }

  return (
    <div className={`label-template-wrap ${className}`.trim()}>
      <p className="label-template-size meta">
        {templateMeta ? `${templateMeta.title} · ` : ""}
        {spec.widthMm} × {spec.heightMm} mm · {ml} mL · {type.toLowerCase()} ·
        QR →{" "}
        {blank ? "wellpept.com" : qrIsCoa ? "peptide COA" : "wellpept.com"}
      </p>
      <canvas
        ref={canvasRef}
        className={`label-template label-template--physical label-template--${size}`}
        aria-label={`${blank ? "Blank" : name || "Peptide"} ${type.toLowerCase()} ${spec.widthMm} by ${spec.heightMm} millimeter label for ${ml} milliliter vial`}
      />
      {showDownload && (
        <button type="button" className="soft-btn vial-download" onClick={handleDownload}>
          <Download size={14} /> Download {type === "CATALOG" ? "catalog" : "calculator"} label · free
        </button>
      )}
    </div>
  );
}
