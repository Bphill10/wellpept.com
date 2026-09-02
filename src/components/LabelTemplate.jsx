import React, { useMemo } from "react";
import { Download } from "lucide-react";
import { downloadVialPng } from "../utils/vialArt";
import {
  buildSilverLabelSVG,
  svgToImageSrc,
  rasterizeLabelPng,
  silverLabelDims,
} from "../utils/udSilverLabel";

/**
 * Flat, print-ready Undisclosed silver label. Renders the approved SVG design as a
 * crisp preview and downloads it as a 600-DPI PNG sized exactly to the physical label
 * (40×20 mm for 3 mL, 50×30 mm for 10 mL) — ready for a Niimbot M2.
 *
 * Custom branding: pass `brandName` + `brandImage` (a data URL) to swap UNDISCLOSED and
 * the UD mark for a customer's own name and logo.
 */
export default function LabelTemplate({
  name = "Peptide",
  mass = "",
  unit = "mg",
  bacWater = "",
  concentration = "",
  /** Calculator dose amount incl. unit, e.g. "0.25 – 0.50 MG". */
  doseRange = "",
  /** Calculator syringe units below the dose, e.g. "5 – 10 U". */
  doseUnits = "",
  size = "md",
  /** Bottle size in mL — 3 → 40×20 mm, 10 → 50×30 mm. */
  vialMl = 3,
  /** CATALOG (no dosage) | CALCULATOR (diluent / conc / dose). */
  labelType = "CALCULATOR",
  formText = "LYOPHILIZED POWDER",
  storageTemp = "36–46°F",
  /** Custom private-label overrides. */
  brandName = "UNDISCLOSED",
  brandImage = "",
  showDownload = true,
  className = "",
  /** Layout + brand chrome only — no peptide fields filled. */
  blank = false,
}) {
  const dims = silverLabelDims(vialMl);
  const type = String(labelType || "CALCULATOR").toUpperCase() === "CATALOG" ? "catalog" : "calculator";

  const svg = useMemo(() => {
    const mg = !blank && mass ? `${mass} ${String(unit || "mg").toUpperCase()}` : "";
    return buildSilverLabelSVG({
      name: blank ? "" : name,
      mg,
      type,
      accent: "silver",
      w: dims.w,
      h: dims.h,
      line1: blank ? "" : formText,
      line2: blank ? "" : `STORE AT ${storageTemp}`,
      diluent: blank ? "" : bacWater,
      concentration: blank ? "" : concentration,
      doseValue: blank ? "" : doseRange,
      doseUnits: blank ? "" : doseUnits,
      brandName: brandName || "UNDISCLOSED",
      brandImage: brandImage || undefined,
    });
  }, [
    blank, name, mass, unit, type, dims.w, dims.h,
    formText, storageTemp, bacWater, concentration, doseRange, doseUnits,
    brandName, brandImage,
  ]);

  const imgSrc = useMemo(() => svgToImageSrc(svg), [svg]);

  async function handleDownload() {
    const png = await rasterizeLabelPng(svg, {
      widthMm: dims.widthMm,
      heightMm: dims.heightMm,
      dpi: 600,
    });
    if (!png) return;
    const brandSlug = (brandName && brandName !== "UNDISCLOSED"
      ? brandName
      : "undisclosed").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const safe = blank
      ? `blank-${dims.ml}ml`
      : (name || "label").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    const mm = `${dims.widthMm}x${dims.heightMm}mm`;
    downloadVialPng(png, `${brandSlug}-${type}-label-${safe || "template"}-${mm}.png`);
  }

  const isCustom = brandName && brandName.toUpperCase() !== "UNDISCLOSED";

  return (
    <div className={`label-template-wrap ${className}`.trim()}>
      <p className="label-template-size meta">
        {dims.widthMm} × {dims.heightMm} mm · {dims.ml} mL · {type} ·{" "}
        {isCustom ? "custom brand" : "Undisclosed"} · QR → wellpept.com
      </p>
      <img
        src={imgSrc}
        className={`label-template label-template--physical label-template--${size}`}
        alt={`${blank ? "Blank" : name || "Peptide"} ${type} ${dims.widthMm} by ${dims.heightMm} millimeter label for ${dims.ml} milliliter vial`}
        style={{ width: "100%", height: "auto", display: "block" }}
      />
      {showDownload && (
        <button type="button" className="soft-btn vial-download" onClick={handleDownload}>
          <Download size={14} /> Download {type === "catalog" ? "catalog" : "calculator"} label · free
        </button>
      )}
    </div>
  );
}
