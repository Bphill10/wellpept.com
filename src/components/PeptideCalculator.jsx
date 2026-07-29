import React, { useEffect, useMemo, useState } from "react";
import { Calculator, RotateCcw, Link2 } from "lucide-react";
import GeneratedVial from "./GeneratedVial";
import LabelTemplate from "./LabelTemplate";
import { guessCategory } from "../data/products";
import {
  buildCalculatorShareUrl,
  suggestedBacMl as suggestedBacFromAutomation,
} from "../utils/automation";

function formatNum(v, digits = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return parseFloat(n.toFixed(digits)).toString();
}

function toMcg(dose, unit) {
  return unit === "mg" ? Number(dose) * 1000 : Number(dose);
}

function formatDoseText(dose, unit) {
  const n = Number(dose);
  if (unit === "mg") return `${formatNum(n, 2)} mg`;
  return `${formatNum(n, 0)} mcg`;
}

/** Suggested BAC water so the chosen dose lands on `units` on a U-100 syringe. */
function suggestedBacMl(massMg, dose, doseUnit, units = 10) {
  return suggestedBacFromAutomation(massMg, dose, doseUnit, units);
}

const PRESETS = [
  { label: "Sema 10 mg", name: "Semaglutide", mass: "10", solution: "2", dose: "250", doseUnit: "mcg" },
  { label: "Tirz 10 mg", name: "Tirzepatide", mass: "10", solution: "1", dose: "1", doseUnit: "mg" },
  { label: "Reta 30 mg", name: "Retatrutide", mass: "30", solution: "3", dose: "1", doseUnit: "mg" },
  { label: "BPC 5 mg", name: "BPC-157", mass: "5", solution: "2", dose: "250", doseUnit: "mcg" },
];

export default function PeptideCalculator({ initial = null }) {
  const [name, setName] = useState(initial?.name || "Retatrutide");
  const [mass, setMass] = useState(initial?.mass != null ? String(initial.mass) : "10");
  const [dose, setDose] = useState(initial?.dose != null ? String(initial.dose) : "1");
  const [doseUnit, setDoseUnit] = useState(initial?.doseUnit || "mg");
  const [solution, setSolution] = useState(
    initial?.solution != null ? String(initial.solution) : "2"
  );
  const [shareMsg, setShareMsg] = useState("");

  useEffect(() => {
    if (!initial) return;
    if (initial.name != null) setName(initial.name);
    if (initial.mass != null) setMass(String(initial.mass));
    if (initial.dose != null) setDose(String(initial.dose));
    if (initial.doseUnit) setDoseUnit(initial.doseUnit);
    if (initial.solution != null && String(initial.solution) !== "") {
      setSolution(String(initial.solution));
    } else if (initial.autoBac && initial.mass != null && initial.dose != null) {
      const bac = suggestedBacMl(
        initial.mass,
        initial.dose,
        initial.doseUnit || "mcg",
        initial.desiredUnits || 10
      );
      if (bac != null) setSolution(formatNum(bac, 2));
    }
  }, [initial]);

  const shareUrl = useMemo(
    () =>
      buildCalculatorShareUrl({
        name,
        mass,
        solution,
        dose,
        doseUnit,
      }),
    [name, mass, solution, dose, doseUnit]
  );

  const suggested = useMemo(
    () => suggestedBacMl(mass, dose, doseUnit, 10),
    [mass, dose, doseUnit]
  );

  const result = useMemo(() => {
    const massN = parseFloat(mass);
    const solutionN = parseFloat(solution);
    const doseN = parseFloat(dose);
    if (!(massN > 0 && solutionN > 0 && doseN > 0)) return null;
    const doseMcg = toMcg(doseN, doseUnit);
    const totalMcg = massN * 1000;
    const mcgPerMl = totalMcg / solutionN;
    const mgPerMl = massN / solutionN;
    const mcgPerUnit = mcgPerMl / 100;
    const units = (doseMcg / mcgPerMl) * 100;
    const doses = totalMcg / doseMcg;
    return {
      units,
      doses,
      mgPerMl,
      mcgPerUnit,
      doseText: formatDoseText(doseN, doseUnit),
    };
  }, [mass, solution, dose, doseUnit]);

  function applyPreset(p) {
    setName(p.name);
    setMass(p.mass);
    setSolution(p.solution);
    setDose(p.dose);
    setDoseUnit(p.doseUnit);
    setShareMsg("");
  }

  function useSuggestedBac() {
    if (suggested == null) return;
    setSolution(formatNum(suggested, 2));
  }

  function clearAll() {
    setName("");
    setMass("10");
    setDose("250");
    setDoseUnit("mcg");
    setSolution("2");
    setShareMsg("");
  }

  async function shareCalc() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareMsg("Link copied.");
    } catch {
      setShareMsg(shareUrl);
    }
  }

  const fillPct = result ? Math.min(100, Math.max(0, result.units)) : 0;
  const vialBac =
    solution && Number(solution) > 0 ? `${formatNum(solution, 2)} mL` : "";
  const vialConc = result ? `${formatNum(result.mgPerMl, 2)} mg/mL` : "";
  const vialDose = result
    ? `${result.doseText} (${formatNum(result.units, 1)} u)`
    : "";
  const vialCategory = guessCategory(name || "Research");

  return (
    <section className="panel-page fade">
      <div className="container">
        <div className="panel calc-panel">
          <div className="calc-hero">
            <div className="calc-hero-icon">
              <Calculator size={22} />
            </div>
            <div>
              <h1>Peptide calculator</h1>
              <p className="lede" style={{ marginBottom: 0 }}>
                One form: BAC volume, syringe units, and an Undisclosed
                label with QR — research use only.
              </p>
            </div>
          </div>

          <div className="calc-examples">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="soft-btn calc-example"
                onClick={() => applyPreset(p)}
              >
                <strong>{p.label}</strong>
                <span>
                  {p.mass} mg · {p.solution} mL · {p.dose} {p.doseUnit}
                </span>
              </button>
            ))}
          </div>

          <div className="calc-layout">
            <div className="calc-card">
              <div className="form-grid">
                <label className="field">
                  Peptide
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Retatrutide"
                  />
                </label>

                <div className="form-row">
                  <label className="field">
                    Vial (mg)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={mass}
                      onChange={(e) => setMass(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    BAC water (mL)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={solution}
                      onChange={(e) => setSolution(e.target.value)}
                    />
                  </label>
                </div>

                {suggested != null && (
                  <button
                    type="button"
                    className="soft-btn"
                    onClick={useSuggestedBac}
                  >
                    Use {formatNum(suggested, 2)} mL so dose = 10 units
                  </button>
                )}

                <div className="form-row">
                  <label className="field">
                    Dose
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Unit
                    <select
                      value={doseUnit}
                      onChange={(e) => setDoseUnit(e.target.value)}
                    >
                      <option value="mg">mg</option>
                      <option value="mcg">mcg</option>
                    </select>
                  </label>
                </div>

                <div className="row-actions">
                  <button
                    type="button"
                    className="soft-btn"
                    onClick={shareCalc}
                    disabled={!result}
                  >
                    <Link2 size={16} /> Share
                  </button>
                  <button type="button" className="soft-btn" onClick={clearAll}>
                    <RotateCcw size={16} /> Clear
                  </button>
                </div>
                {shareMsg && <div className="notice">{shareMsg}</div>}
              </div>

              {result && (
                <div className="calc-result">
                  <div className="calc-result-main">
                    Draw <strong>{formatNum(result.units, 1)} units</strong>
                    <span className="calc-result-sub">
                      {" "}
                      for {result.doseText}
                      {name ? ` · ${name}` : ""}
                    </span>
                  </div>

                  <div className="syringe-visual" aria-hidden="true">
                    <div className="syringe-bar">
                      <div
                        className="syringe-fill"
                        style={{ width: `${fillPct}%` }}
                      />
                      <div
                        className="syringe-marker"
                        style={{ left: `${fillPct}%` }}
                      />
                    </div>
                    <div className="syringe-ticks">
                      {[0, 25, 50, 75, 100].map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </div>

                  <div className="calc-refs calc-refs--simple">
                    <div>
                      <span>Concentration</span>
                      <strong>{formatNum(result.mgPerMl, 2)} mg/mL</strong>
                    </div>
                    <div>
                      <span>Doses / vial</span>
                      <strong>{formatNum(result.doses, 1)}</strong>
                    </div>
                    <div>
                      <span>1 unit</span>
                      <strong>{formatNum(result.mcgPerUnit, 1)} mcg</strong>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="calc-vial-panel">
              <div className="calc-card-head">
                <h2>Brand vial</h2>
              </div>
              <p className="meta">
                Printable Undisclosed wrap label — clinical wrap on the vial,
                flat label download with QR for the bench.
              </p>
              <div className="calc-vial-stage">
                <GeneratedVial
                  name={name || "Peptide"}
                  mass={mass}
                  unit="mg"
                  category={vialCategory}
                  bacWater={vialBac}
                  concentration={vialConc}
                  doseRange={vialDose}
                  reconstituted={Boolean(solution && parseFloat(solution) > 0)}
                  vialMl={3}
                  size="lg"
                  qrPayload={shareUrl}
                  showDownload
                />
              </div>
              <div className="calc-label-stage">
                <LabelTemplate
                  name={name || "Peptide"}
                  mass={mass}
                  unit="mg"
                  bacWater={vialBac}
                  concentration={vialConc}
                  doseRange={vialDose}
                  size="md"
                  qrPayload={shareUrl}
                  showDownload
                />
              </div>
            </div>
          </div>

          <div className="notice warn" style={{ marginTop: "1.25rem" }}>
            Research-use calculations only. Verify independently. Not medical
            advice. Not for human use.
          </div>
        </div>
      </div>
    </section>
  );
}

export function parseCalculatorQuery(search = "") {
  const params = new URLSearchParams(search);
  if (params.get("view") !== "calculator") return null;
  return {
    name: params.get("name") || "",
    mass: params.get("mass") || "",
    solution: params.get("solution") || "",
    dose: params.get("dose") || "",
    doseUnit: params.get("doseUnit") === "mg" ? "mg" : "mcg",
    desiredUnits: params.get("units") || "10",
  };
}
