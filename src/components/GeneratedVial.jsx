import React, { useEffect, useMemo, useRef, useState } from "react";
import { Download } from "lucide-react";
import {
  drawGeneratedVial,
  downloadVialPng,
  resolveVialMl,
  loadBrandVial,
  loadBrandVial10,
  loadBrandImage,
  loadUdMark,
  CATALOG_VIAL_TEMPLATE,
} from "../utils/vialArt";
import { resolveCalculatorLabelFields } from "../utils/automation";
import { resolveCoaQrPayload } from "../utils/coaStore";

// Warm Undisclosed brand plate (UD), seal, and photoreal vials.
if (typeof window !== "undefined") {
  loadBrandImage();
  loadUdMark();
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
  coaUrl = "",
  productId = "",
  showDownload = false,
  className = "",
  /** Storefront framing lock: same 3 mL plate. */
  catalogTemplate = true,
  /** Clinical wrap label on the photoreal vial PNG. */
  showLabel = true,
}) {
  const canvasRef = useRef(null);
  const [png, setPng] = useState("");
  const resolvedMl = catalogTemplate
    ? 3
    : resolveVialMl({ form: form || subtitle, vialMl, name });
  const resolvedQr = catalogTemplate
    ? CATALOG_VIAL_TEMPLATE.qrPayload
    : resolveCoaQrPayload({
        productId,
        coaUrl,
        fallback: qrPayload,
      });

  const labelFields = useMemo(() => {
    // Per-product name + mg/IU + dosage on every vial (catalog + calculator)
    return resolveCalculatorLabelFields({
      name,
      mass,
      unit,
      sku,
      bacWater,
      concentration,
      doseRange,
      qrPayload: resolvedQr,
      vialMl: resolvedMl,
      form: form || subtitle,
    });
  }, [
    name,
    mass,
    unit,
    sku,
    bacWater,
    concentration,
    doseRange,
    resolvedQr,
    resolvedMl,
    form,
    subtitle,
  ]);

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
          unit: labelFields.unit || unit,
          category,
          mixText,
          doseRef,
          bacWater: labelFields.bacWater,
          concentration: labelFields.concentration,
          doseRange: labelFields.doseRange,
          summary,
          size,
          reconstituted: catalogTemplate ? false : reconstituted,
          vialMl: resolvedMl,
          form: form || subtitle,
          qrPayload: labelFields.qrPayload,
          coaUrl: catalogTemplate ? "" : resolvedQr,
          catalogTemplate,
          showLabel,
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
    labelFields,
    summary,
    size,
    reconstituted,
    resolvedMl,
    form,
    resolvedQr,
    catalogTemplate,
    showLabel,
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
        aria-label={`${name} Undisclosed vial`}
      />
      {showDownload && png && (
        <button type="button" className="soft-btn vial-download" onClick={handleDownload}>
          <Download size={14} /> Download vial PNG
        </button>
      )}
    </div>
  );
}
