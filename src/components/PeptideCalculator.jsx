import React, { useEffect, useMemo, useState } from "react";
import { Calculator, FlaskConical, Syringe, RotateCcw, Link2 } from "lucide-react";
import GeneratedVial from "./GeneratedVial";
import { guessCategory } from "../data/products";

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

const EXAMPLES = [
  {
    label: "Semaglutide",
    detail: "10 mg vial + 4 mL BAC → 250 mcg = 10 units",
    name: "Semaglutide",
    mass: 10,
    solution: 4,
    dose: 250,
    doseUnit: "mcg",
  },
  {
    label: "Tirzepatide",
    detail: "10 mg vial + 1 mL BAC → 1 mg = 10 units",
    name: "Tirzepatide",
    mass: 10,
    solution: 1,
    dose: 1,
    doseUnit: "mg",
  },
  {
    label: "Retatrutide",
    detail: "30 mg vial + 3 mL BAC → 1 mg = 10 units",
    name: "Retatrutide",
    mass: 30,
    solution: 3,
    dose: 1,
    doseUnit: "mg",
  },
  {
    label: "10 mg / 2 mL",
    detail: "10 mg vial + 2 mL BAC → 500 mcg = 10 units",
    name: "",
    mass: 10,
    solution: 2,
    dose: 500,
    doseUnit: "mcg",
  },
];

const UNIT_OPTIONS = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);

export default function PeptideCalculator({ initial = null }) {
  const [name, setName] = useState(initial?.name || "");
  const [mass, setMass] = useState(initial?.mass != null ? String(initial.mass) : "10");
  const [dose, setDose] = useState(initial?.dose != null ? String(initial.dose) : "250");
  const [doseUnit, setDoseUnit] = useState(initial?.doseUnit || "mcg");
  const [desiredUnits, setDesiredUnits] = useState(
    initial?.desiredUnits != null ? String(initial.desiredUnits) : "10"
  );
  const [solution, setSolution] = useState(
    initial?.solution != null ? String(initial.solution) : ""
  );
  const [shareMsg, setShareMsg] = useState("");

  useEffect(() => {
    if (!initial) return;
    if (initial.name != null) setName(initial.name);
    if (initial.mass != null) setMass(String(initial.mass));
    if (initial.dose != null) setDose(String(initial.dose));
    if (initial.doseUnit) setDoseUnit(initial.doseUnit);
    if (initial.desiredUnits != null) setDesiredUnits(String(initial.desiredUnits));
    if (initial.solution != null) setSolution(String(initial.solution));
  }, [initial]);

  const recon = useMemo(() => {
    const massN = parseFloat(mass);
    const doseN = parseFloat(dose);
    const unitsN = parseFloat(desiredUnits);
    if (!(massN > 0 && doseN > 0 && unitsN > 0)) return null;
    const doseMcg = toMcg(doseN, doseUnit);
    const totalMcg = massN * 1000;
    const mcgPerUnit = doseMcg / unitsN;
    const totalUnits = totalMcg / mcgPerUnit;
    const totalMl = totalUnits / 100;
    return { totalMl, doseMcg, totalMcg };
  }, [mass, dose, doseUnit, desiredUnits]);

  const dosage = useMemo(() => {
    const massN = parseFloat(mass);
    const solutionN = parseFloat(solution);
    const doseN = parseFloat(dose);
    if (!(massN > 0 && solutionN > 0 && doseN > 0)) return null;
    const doseMcg = toMcg(doseN, doseUnit);
    const totalMcg = massN * 1000;
    const mcgPerMl = totalMcg / solutionN;
    const mgPerMl = massN / solutionN;
    const mcgPerUnit = mcgPerMl / 100;
    const mlForDose = doseMcg / mcgPerMl;
    const units = mlForDose * 100;
    const doses = totalMcg / doseMcg;
    return {
      units,
      doses,
      mgPerMl,
      mcgPerUnit,
      unitsPer1mg: (1000 / mcgPerMl) * 100,
      unitsPer500mcg: (500 / mcgPerMl) * 100,
      unitsPer250mcg: (250 / mcgPerMl) * 100,
      doseText: formatDoseText(doseN, doseUnit),
    };
  }, [mass, solution, dose, doseUnit]);

  function applyReconstitution() {
    if (!recon) return;
    setSolution(formatNum(recon.totalMl, 2));
  }

  function applyExample(ex) {
    setName(ex.name);
    setMass(String(ex.mass));
    setSolution(String(ex.solution));
    setDose(String(ex.dose));
    setDoseUnit(ex.doseUnit);
    setDesiredUnits("10");
  }

  function clearAll() {
    setName("");
    setMass("10");
    setDose("250");
    setDoseUnit("mcg");
    setDesiredUnits("10");
    setSolution("");
    setShareMsg("");
  }

  async function shareCalc() {
    const params = new URLSearchParams({
      view: "calculator",
      name: name || "",
      mass: mass || "",
      solution: solution || "",
      dose: dose || "",
      doseUnit,
      units: desiredUnits || "",
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareMsg("Calculation link copied.");
    } catch {
      setShareMsg(url);
    }
  }

  const fillPct = dosage ? Math.min(100, Math.max(0, dosage.units)) : 0;

  const vialMixText =
    mass && solution
      ? `${formatNum(mass, 2)}mg / ${formatNum(solution, 2)}ml`
      : mass
        ? `${formatNum(mass, 2)}mg lyophilized`
        : "";

  const vialDoseRef = dosage
    ? `${formatNum(dosage.units, 1)}u = ${dosage.doseText}`
    : recon
      ? `Add ${formatNum(recon.totalMl, 2)} mL BAC`
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
                Reconstitution volume, dosage in U-100 syringe units, and quick
                references — for research calculations only.
              </p>
            </div>
          </div>

          <div className="calc-examples">
            {EXAMPLES.map((ex) => (
              <button
                key={ex.label}
                type="button"
                className="soft-btn calc-example"
                onClick={() => applyExample(ex)}
              >
                <strong>{ex.label}</strong>
                <span>{ex.detail}</span>
              </button>
            ))}
          </div>

          <div className="grid-2 calc-grid">
            <div className="calc-card">
              <div className="calc-card-head">
                <FlaskConical size={18} />
                <h2>Reconstitution</h2>
              </div>
              <p className="meta">
                Find how much bacteriostatic water to add so your desired dose
                lands on a clean syringe mark.
              </p>

              <div className="form-grid">
                <label className="field">
                  Peptide name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Optional — e.g. Retatrutide"
                  />
                </label>
                <label className="field">
                  Peptide mass in vial (mg)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={mass}
                    onChange={(e) => setMass(e.target.value)}
                    placeholder="10"
                  />
                </label>
                <div className="form-row">
                  <label className="field">
                    Desired dose
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
                      <option value="mcg">mcg</option>
                      <option value="mg">mg</option>
                    </select>
                  </label>
                </div>
                <label className="field">
                  Desired units per dose
                  <select
                    value={desiredUnits}
                    onChange={(e) => setDesiredUnits(e.target.value)}
                  >
                    {UNIT_OPTIONS.map((u) => (
                      <option key={u} value={u}>
                        {u} units
                      </option>
                    ))}
                  </select>
                </label>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={applyReconstitution}
                  disabled={!recon}
                >
                  Calculate BAC water
                </button>
              </div>

              {recon && (
                <div className="calc-result">
                  <div className="calc-result-main">
                    Add <strong>{formatNum(recon.totalMl, 2)} mL</strong> solution
                  </div>
                  <div className="meta">
                    Then use the dosage panel — fields update automatically.
                  </div>
                </div>
              )}
            </div>

            <div className="calc-card">
              <div className="calc-card-head">
                <Syringe size={18} />
                <h2>Dosage</h2>
              </div>
              <p className="meta">
                Convert a reconstituted vial into U-100 insulin syringe units
                (100 units = 1 mL).
              </p>

              <div className="form-grid">
                <label className="field">
                  Peptide mass in vial (mg)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={mass}
                    onChange={(e) => setMass(e.target.value)}
                  />
                </label>
                <label className="field">
                  Solution added (mL)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    placeholder="From reconstitution, or enter manually"
                  />
                </label>
                <div className="form-row">
                  <label className="field">
                    Desired dose
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
                      <option value="mcg">mcg</option>
                      <option value="mg">mg</option>
                    </select>
                  </label>
                </div>
                <div className="row-actions">
                  <button
                    type="button"
                    className="soft-btn"
                    onClick={shareCalc}
                    disabled={!dosage}
                  >
                    <Link2 size={16} /> Share
                  </button>
                  <button type="button" className="soft-btn" onClick={clearAll}>
                    <RotateCcw size={16} /> Clear
                  </button>
                </div>
                {shareMsg && <div className="notice">{shareMsg}</div>}
              </div>

              {dosage && (
                <div className="calc-result">
                  <div className="calc-result-main">
                    For {dosage.doseText}, draw{" "}
                    <strong>{formatNum(dosage.units, 1)} units</strong>
                    {name ? ` of ${name}` : ""} on a U-100 syringe
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
                      {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  </div>

                  <div className="calc-refs">
                    <div>
                      Total doses per vial:{" "}
                      <strong>{formatNum(dosage.doses, 2)}</strong>
                    </div>
                    <div>
                      Concentration:{" "}
                      <strong>{formatNum(dosage.mgPerMl, 3)} mg/mL</strong>
                    </div>
                    <div>
                      1 unit ={" "}
                      <strong>{formatNum(dosage.mcgPerUnit, 2)} mcg</strong>
                    </div>
                    <div className="calc-quick">
                      <strong>Quick references</strong>
                      <div>{formatNum(dosage.unitsPer1mg, 1)} units = 1 mg</div>
                      <div>
                        {formatNum(dosage.unitsPer500mcg, 1)} units = 500 mcg
                      </div>
                      <div>
                        {formatNum(dosage.unitsPer250mcg, 1)} units = 250 mcg
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="calc-vial-panel">
            <div className="calc-card-head">
              <h2>Auto-generated vial</h2>
            </div>
            <p className="meta">
              Label updates as you type — unique color per peptide, Undisclosed
              branding, download-ready PNG.
            </p>
            <div className="calc-vial-stage">
              <GeneratedVial
                name={name || "Peptide"}
                mass={mass}
                category={vialCategory}
                mixText={vialMixText}
                doseRef={vialDoseRef}
                reconstituted={Boolean(solution && parseFloat(solution) > 0)}
                size="lg"
                showDownload
              />
            </div>
          </div>

          <div className="notice warn" style={{ marginTop: "1.25rem" }}>
            Educational / research-use calculations only. Verify independently.
            Not medical advice. Not for human use.
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
