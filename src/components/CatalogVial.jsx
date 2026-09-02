import React, { useEffect, useRef, useState } from "react";
import { labelSVGFromFields } from "../utils/udSilverLabel";
import { drawSilverLabelVial, silverVialBaseSrc } from "../utils/udVialComposite";

/**
 * Storefront vial with the live silver catalog label wrapped on it. Renders lazily (only
 * when scrolled near the viewport) so a full product grid stays fast. Works for every
 * product — no per-product image needed — using the product's name, strength, size, form,
 * and powder colour.
 */
export default function CatalogVial({
  name = "Peptide",
  mg = "",
  unit = "mg",
  vialMl = 3,
  form = "",
  powderColor = "",
  className = "",
}) {
  const canvasRef = useRef(null);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "220px 0px", threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    let cancelled = false;
    const ml = Number(vialMl) >= 8 ? 10 : 3;
    const { svg } = labelSVGFromFields({
      name: name || "Peptide",
      mass: mg != null && mg !== "" ? String(mg) : "",
      unit: unit || "mg",
      labelType: "CATALOG",
      formText: (form || "Lyophilized Powder").toUpperCase(),
      storageTemp: "36–46°F",
      vialMl: ml,
    });
    const baseSrc = silverVialBaseSrc(name, ml, powderColor);
    drawSilverLabelVial(canvas, { svg, vialMl: ml, baseSrc })
      .then(() => { if (!cancelled) setReady(true); })
      .catch((err) => console.error("Catalog vial render failed", err));
    return () => { cancelled = true; };
  }, [visible, name, mg, unit, vialMl, form, powderColor]);

  return (
    <canvas
      ref={canvasRef}
      className={`${className} silver-label-vial${ready ? " is-ready" : ""}`.trim()}
      aria-label={`${name || "Peptide"} Undisclosed vial`}
    />
  );
}
