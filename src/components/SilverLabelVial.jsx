import React, { useEffect, useRef, useState } from "react";
import { labelSVGFromFields } from "../utils/udSilverLabel";
import { drawSilverLabelVial, silverVialBaseSrc } from "../utils/udVialComposite";

/**
 * Live vial preview: wraps the current silver label (catalog or dosage, incl. custom
 * branding) onto a real vial photo. Reflects the calculator's fields as they change.
 */
export default function SilverLabelVial({
  name = "Peptide",
  mass = "",
  unit = "mg",
  labelType = "CALCULATOR",
  formText = "LYOPHILIZED POWDER",
  storageTemp = "36–46°F",
  diluent = "",
  concentration = "",
  doseValue = "",
  doseUnits = "",
  brandName = "UNDISCLOSED",
  brandImage = "",
  vialMl = 3,
  className = "",
}) {
  const canvasRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    const ml = Number(vialMl) >= 8 ? 10 : 3;
    const { svg } = labelSVGFromFields({
      name, mass, unit, labelType, formText, storageTemp,
      diluent, concentration, doseValue, doseUnits, brandName, brandImage, vialMl: ml,
    });
    const baseSrc = silverVialBaseSrc(name, ml);
    drawSilverLabelVial(canvas, { svg, vialMl: ml, baseSrc })
      .then(() => { if (!cancelled) setReady(true); })
      .catch((err) => console.error("Vial composite failed", err));
    return () => { cancelled = true; };
  }, [
    name, mass, unit, labelType, formText, storageTemp,
    diluent, concentration, doseValue, doseUnits, brandName, brandImage, vialMl,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className={`silver-label-vial${ready ? " is-ready" : ""} ${className}`.trim()}
      aria-label={`${name || "Peptide"} Undisclosed vial`}
    />
  );
}
