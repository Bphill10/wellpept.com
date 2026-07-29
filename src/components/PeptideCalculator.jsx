import React, { useEffect, useMemo, useState } from "react";
import { Calculator, RotateCcw, Link2 } from "lucide-react";
import GeneratedVial from "./GeneratedVial";
import LabelTemplate from "./LabelTemplate";
import {
  guessCategory,
  calculatorOptionsFromListings,
  matchCalculatorOption,
} from "../data/products";
import {
  buildCalculatorShareUrl,
  defaultResearchDose,
  normalizeDoseUnit,
  suggestedBacMl as suggestedBacFromAutomation,
} from "../utils/automation";

function formatNum(v, digits = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return "—";
  return parseFloat(n.toFixed(digits)).toString();
}

function formatDoseText(dose, unit) {
  const n = Number(dose);
  if (unit === "IU") return `${formatNum(n, 2)} IU`;
  return `${formatNum(n, 2)} mg`;
}

function defaultDoseForStrength(strength, name = "") {
  const { dose, doseUnit } = defaultResearchDose(
    strength?.mg,
    strength?.unit || "mg",
    name || strength?.name || ""
  );
  return { dose: String(dose), doseUnit };
}

/** Suggested BAC water so the chosen dose lands on `units` on a U-100 syringe. */
function suggestedBacMl(mass, dose, doseUnit, units = 10, name = "") {
  return suggestedBacFromAutomation(mass, dose, doseUnit, units, name);
}

const QUICK_PREF = [
  "hgh",
  "retatrutide",
  "wolverine",
  "bpc 157",
  "tirzepatide",
  "tb 4",
  "ipamorelin",
  "klow",
];

function buildQuickPicks(options) {
  const picks = [];
  const used = new Set();
  for (const pref of QUICK_PREF) {
    const opt = options.find(
      (o) => o.key === pref || o.key.includes(pref) || pref.includes(o.key)
    );
    if (!opt || used.has(opt.id)) continue;
    used.add(opt.id);
    const strength =
      opt.strengths.find((s) => Number(s.mg) >= 10) || opt.strengths[0];
    const { dose, doseUnit } = defaultDoseForStrength(strength, opt.name);
    picks.push({
      id: `${opt.id}-${strength.key}`,
      label: `${opt.name.split("(")[0].trim()} ${formatNum(strength.mg, 2)} ${
        strength.unit || "mg"
      }`,
      optionId: opt.id,
      strengthKey: strength.key,
      name: opt.name,
      mass: String(strength.mg),
      unit: strength.unit || "mg",
      dose,
      doseUnit,
      vialMl: strength.vialMl,
    });
    if (picks.length >= 6) break;
  }
  if (picks.length < 4) {
    for (const opt of options) {
      if (used.has(opt.id)) continue;
      const strength = opt.strengths[0];
      const { dose, doseUnit } = defaultDoseForStrength(strength, opt.name);
      picks.push({
        id: `${opt.id}-${strength.key}`,
        label: `${opt.name.split("(")[0].trim()} ${formatNum(strength.mg, 2)} ${
          strength.unit || "mg"
        }`,
        optionId: opt.id,
        strengthKey: strength.key,
        name: opt.name,
        mass: String(strength.mg),
        unit: strength.unit || "mg",
        dose,
        doseUnit,
        vialMl: strength.vialMl,
      });
      used.add(opt.id);
      if (picks.length >= 6) break;
    }
  }
  return picks;
}

export default function PeptideCalculator({
  initial = null,
  listings = [],
  autoSuggestBac = true,
}) {
  const options = useMemo(
    () => calculatorOptionsFromListings(listings),
    [listings]
  );
  const quickPicks = useMemo(() => buildQuickPicks(options), [options]);

  const matched = useMemo(
    () => matchCalculatorOption(options, initial),
    [options, initial]
  );

  const [peptideId, setPeptideId] = useState(matched?.option?.id || "");
  const [strengthKey, setStrengthKey] = useState(
    matched?.strength?.key || ""
  );
  const [name, setName] = useState(
    matched?.option?.name || initial?.name || ""
  );
  const [mass, setMass] = useState(
    matched?.strength?.mg != null
      ? String(matched.strength.mg)
      : initial?.mass != null
        ? String(initial.mass)
        : ""
  );
  const [vialUnit, setVialUnit] = useState(
    matched?.strength?.unit || initial?.unit || "mg"
  );
  const [vialMl, setVialMl] = useState(
    matched?.strength?.vialMl || initial?.vialMl || 3
  );
  const [dose, setDose] = useState(
    initial?.dose != null
      ? String(initial.dose)
      : defaultDoseForStrength(matched?.strength).dose
  );
  const [doseUnit, setDoseUnit] = useState(
    initial?.doseUnit || defaultDoseForStrength(matched?.strength).doseUnit
  );
  const [solution, setSolution] = useState(
    initial?.solution != null ? String(initial.solution) : "2"
  );
  const [shareMsg, setShareMsg] = useState("");
  const [hydratedInitial, setHydratedInitial] = useState(null);

  const selectedPeptide =
    options.find((o) => o.id === peptideId) || options[0] || null;
  const selectedStrength =
    selectedPeptide?.strengths.find((s) => s.key === strengthKey) ||
    selectedPeptide?.strengths[0] ||
    null;

  function applyCatalogSelection(option, strength, seed = null) {
    if (!option || !strength) return;
    setPeptideId(option.id);
    setStrengthKey(strength.key);
    setName(option.name);
    setMass(String(strength.mg));
    setVialUnit(strength.unit || "mg");
    setVialMl(strength.vialMl || 3);

    const defaults = defaultDoseForStrength(strength, option.name);
    const seeded =
      seed?.dose != null
        ? normalizeDoseUnit(
            seed.dose,
            seed.doseUnit || defaults.doseUnit,
            option.name
          )
        : { dose: Number(defaults.dose), doseUnit: defaults.doseUnit };
    // Keep dose unit coherent with vial unit — only IU or mg
    const coherentUnit =
      (strength.unit || "mg") === "IU"
        ? "IU"
        : seeded.doseUnit === "IU"
          ? defaults.doseUnit
          : "mg";
    const nextDose =
      coherentUnit === "IU" && seeded.doseUnit === "IU"
        ? String(seeded.dose)
        : coherentUnit === "mg" && seeded.doseUnit === "mg"
          ? String(seeded.dose)
          : defaults.dose;
    setDose(nextDose);
    setDoseUnit(coherentUnit);

    if (seed?.solution != null && String(seed.solution) !== "") {
      setSolution(String(seed.solution));
    } else if (autoSuggestBac || seed?.autoBac) {
      const bac = suggestedBacMl(
        strength.mg,
        nextDose,
        coherentUnit,
        seed?.desiredUnits || 10,
        option.name
      );
      if (bac != null) setSolution(formatNum(bac, 2));
    }
    setShareMsg("");
  }

  useEffect(() => {
    if (!options.length) return;
    const match = matchCalculatorOption(options, initial);
    if (!match) return;
    const seedKey = JSON.stringify({
      name: initial?.name || "",
      mass: initial?.mass ?? "",
      dose: initial?.dose ?? "",
      solution: initial?.solution ?? "",
    });
    if (hydratedInitial === seedKey && peptideId) return;
    applyCatalogSelection(match.option, match.strength, initial);
    setHydratedInitial(seedKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, initial]);

  const shareUrl = useMemo(
    () =>
      buildCalculatorShareUrl({
        name,
        mass,
        solution,
        dose,
        doseUnit,
        unit: vialUnit,
      }),
    [name, mass, solution, dose, doseUnit, vialUnit]
  );

  const suggested = useMemo(
    () => suggestedBacMl(mass, dose, doseUnit, 10, name),
    [mass, dose, doseUnit, name]
  );

  const result = useMemo(() => {
    const massN = parseFloat(mass);
    const solutionN = parseFloat(solution);
    const doseN = parseFloat(dose);
    if (!(massN > 0 && solutionN > 0 && doseN > 0)) return null;

    if (vialUnit === "IU" || doseUnit === "IU") {
      const iuPerMl = massN / solutionN;
      const units = (doseN / iuPerMl) * 100;
      const doses = massN / doseN;
      return {
        units,
        doses,
        mgPerMl: iuPerMl,
        concLabel: `${formatNum(iuPerMl, 2)} IU/mL`,
        perUnitLabel: `${formatNum(iuPerMl / 100, 2)} IU`,
        doseText: formatDoseText(doseN, "IU"),
      };
    }

    const doseMg = Number(
      normalizeDoseUnit(doseN, doseUnit, name).dose
    );
    const mgPerMl = massN / solutionN;
    const mgPerUnit = mgPerMl / 100;
    const units = (doseMg / mgPerMl) * 100;
    const doses = massN / doseMg;
    return {
      units,
      doses,
      mgPerMl,
      concLabel: `${formatNum(mgPerMl, 2)} mg/mL`,
      perUnitLabel: `${formatNum(mgPerUnit, 3)} mg`,
      doseText: formatDoseText(doseMg, "mg"),
    };
  }, [mass, solution, dose, doseUnit, vialUnit, name]);

  function onPeptideChange(id) {
    const option = options.find((o) => o.id === id);
    if (!option) return;
    applyCatalogSelection(option, option.strengths[0]);
  }

  function onStrengthChange(key) {
    if (!selectedPeptide) return;
    const strength =
      selectedPeptide.strengths.find((s) => s.key === key) ||
      selectedPeptide.strengths[0];
    applyCatalogSelection(selectedPeptide, strength);
  }

  function applyQuickPick(pick) {
    const option = options.find((o) => o.id === pick.optionId);
    const strength = option?.strengths.find((s) => s.key === pick.strengthKey);
    if (!option || !strength) return;
    applyCatalogSelection(option, strength, {
      dose: pick.dose,
      doseUnit: pick.doseUnit,
      autoBac: autoSuggestBac,
    });
  }

  function useSuggestedBac() {
    if (suggested == null) return;
    setSolution(formatNum(suggested, 2));
  }

  function clearAll() {
    if (options[0]) {
      applyCatalogSelection(options[0], options[0].strengths[0]);
      return;
    }
    setName("");
    setMass("");
    setDose("0.25");
    setDoseUnit("mg");
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
  const vialConc = result?.concLabel || "";
  const vialDose = result
    ? `${result.doseText} (${formatNum(result.units, 1)} u)`
    : "";
  const vialCategory = guessCategory(name || "Research");
  const doseUnitOptions =
    vialUnit === "IU"
      ? [{ value: "IU", label: "IU" }]
      : [{ value: "mg", label: "mg" }];

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
                Tied to live Undisclosed stock — pick a peptide and vial
                dosage, then set BAC and research dose.
              </p>
            </div>
          </div>

          {quickPicks.length > 0 && (
            <div className="calc-examples">
              {quickPicks.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`soft-btn calc-example${
                    peptideId === p.optionId && strengthKey === p.strengthKey
                      ? " is-active"
                      : ""
                  }`}
                  onClick={() => applyQuickPick(p)}
                >
                  <strong>{p.label}</strong>
                  <span>
                    Catalog · dose {p.dose} {p.doseUnit}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="calc-layout">
            <div className="calc-card">
              <div className="form-grid">
                <label className="field">
                  Peptide
                  <select
                    value={selectedPeptide?.id || ""}
                    onChange={(e) => onPeptideChange(e.target.value)}
                    disabled={!options.length}
                  >
                    {!options.length && (
                      <option value="">No catalog peptides</option>
                    )}
                    {options.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                        {o.category ? ` · ${o.category}` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  Available dosage
                  <select
                    value={selectedStrength?.key || ""}
                    onChange={(e) => onStrengthChange(e.target.value)}
                    disabled={!selectedPeptide?.strengths?.length}
                  >
                    {(selectedPeptide?.strengths || []).map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="form-row">
                  <label className="field">
                    Vial ({vialUnit || "mg"})
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={mass}
                      readOnly
                      aria-readonly="true"
                      title="Set by available catalog dosage"
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
                    Research dose
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
                      value={doseUnit === "IU" ? "IU" : "mg"}
                      onChange={(e) => setDoseUnit(e.target.value)}
                    >
                      {doseUnitOptions.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
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
                    <RotateCcw size={16} /> Reset
                  </button>
                </div>
                {shareMsg && <div className="notice">{shareMsg}</div>}
                {selectedPeptide && (
                  <p className="meta" style={{ margin: 0 }}>
                    {selectedPeptide.strengths.length} dosage
                    {selectedPeptide.strengths.length === 1 ? "" : "s"} in
                    catalog
                    {selectedStrength
                      ? ` · ${selectedStrength.label}`
                      : ""}
                  </p>
                )}
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
                      <strong>{result.concLabel}</strong>
                    </div>
                    <div>
                      <span>Doses / vial</span>
                      <strong>{formatNum(result.doses, 1)}</strong>
                    </div>
                    <div>
                      <span>1 unit</span>
                      <strong>{result.perUnitLabel}</strong>
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
                  unit={vialUnit || "mg"}
                  category={vialCategory}
                  bacWater={vialBac}
                  concentration={vialConc}
                  doseRange={vialDose}
                  reconstituted={Boolean(solution && parseFloat(solution) > 0)}
                  vialMl={vialMl || 3}
                  size="lg"
                  qrPayload={shareUrl}
                  showDownload
                />
              </div>
              <div className="calc-label-stage">
                <LabelTemplate
                  name={name || "Peptide"}
                  mass={mass}
                  unit={vialUnit || "mg"}
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
  const name = params.get("name") || "";
  const normalized = normalizeDoseUnit(
    params.get("dose") || "",
    params.get("doseUnit") || "mg",
    name
  );
  return {
    name,
    mass: params.get("mass") || "",
    solution: params.get("solution") || "",
    dose:
      Number.isFinite(normalized.dose) && params.get("dose")
        ? String(normalized.dose)
        : params.get("dose") || "",
    doseUnit: normalized.doseUnit,
    unit: params.get("unit") || "",
    desiredUnits: params.get("units") || "10",
  };
}
