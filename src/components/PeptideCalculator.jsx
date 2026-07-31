import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calculator, RotateCcw, Link2, Download } from "lucide-react";
import LabelTemplate from "./LabelTemplate";
import {
  CATEGORIES,
  calculatorOptionsFromListings,
  matchCalculatorOption,
} from "../data/products";
import {
  buildCalculatorShareUrl,
  defaultsFromCatalogSelection,
  formatDoseRangeLabel,
  normalizeDoseUnit,
  suggestedBacMl as suggestedBacFromAutomation,
} from "../utils/automation";
import {
  LABEL_BOTTLE_SIZES_ML,
  labelSpecForVialMl,
} from "../utils/vialArt";
import { shortCapName, capStlSlug } from "../data/capNames";

const CUSTOM_ID = "custom";
const BOTTLE_SIZES_ML = LABEL_BOTTLE_SIZES_ML;

function bottleOptionLabel(ml) {
  const spec = labelSpecForVialMl(ml);
  return `${ml} mL · label ${spec.widthMm}×${spec.heightMm} mm`;
}

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

/** Full defaults from peptide name + available dosage strength. */
function defaultsFor(option, strength, seed = null) {
  return defaultsFromCatalogSelection({
    name: option?.name || seed?.name || "",
    mass: strength?.mg ?? seed?.mass ?? "",
    unit: strength?.unit || seed?.unit || "mg",
    vialMl: strength?.vialMl ?? seed?.vialMl,
    form: strength?.form || seed?.form || "",
    desiredUnits: Number(seed?.desiredUnits) || 10,
    dose: seed?.dose,
    doseUnit: seed?.doseUnit,
  });
}

function suggestedBacMl(mass, dose, doseUnit, units = 10, name = "") {
  return suggestedBacFromAutomation(mass, dose, doseUnit, units, name);
}

const QUICK_PREF = [
  "hgh",
  "retatrutide",
  "wolverine",
  "bpc 157",
  "tb-500",
  "tb500",
  "ta-1",
  "vitamin b12",
  "tirzepatide",
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
    const d = defaultsFor(opt, strength);
    picks.push({
      id: `${opt.id}-${strength.key}`,
      label: `${opt.name.split("(")[0].trim()} ${formatNum(strength.mg, 2)} ${
        d.unit
      }`,
      optionId: opt.id,
      strengthKey: strength.key,
      name: opt.name,
      mass: String(d.mass),
      unit: d.unit,
      dose: String(d.dose),
      doseUnit: d.doseUnit,
      vialMl: d.vialMl,
      solution: d.solution,
    });
    if (picks.length >= 6) break;
  }
  if (picks.length < 4) {
    for (const opt of options) {
      if (used.has(opt.id)) continue;
      const strength = opt.strengths[0];
      const d = defaultsFor(opt, strength);
      picks.push({
        id: `${opt.id}-${strength.key}`,
        label: `${opt.name.split("(")[0].trim()} ${formatNum(strength.mg, 2)} ${
          d.unit
        }`,
        optionId: opt.id,
        strengthKey: strength.key,
        name: opt.name,
        mass: String(d.mass),
        unit: d.unit,
        dose: String(d.dose),
        doseUnit: d.doseUnit,
        vialMl: d.vialMl,
        solution: d.solution,
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
  onBack = null,
}) {
  const options = useMemo(
    () => calculatorOptionsFromListings(listings),
    [listings]
  );
  const optionsByCategory = useMemo(() => {
    const map = new Map();
    for (const opt of options) {
      const cat = opt.category || "Research";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat).push(opt);
    }
    const rank = (cat) => {
      const i = CATEGORIES.indexOf(cat);
      return i === -1 ? CATEGORIES.length : i;
    };
    return [...map.entries()].sort((a, b) => rank(a[0]) - rank(b[0]));
  }, [options]);
  const quickPicks = useMemo(() => buildQuickPicks(options), [options]);

  const matched = useMemo(
    () => matchCalculatorOption(options, initial),
    [options, initial]
  );

  const boot = useMemo(
    () =>
      defaultsFor(matched?.option, matched?.strength, initial),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [peptideId, setPeptideId] = useState(matched?.option?.id || "");
  const [strengthKey, setStrengthKey] = useState(
    matched?.strength?.key || ""
  );
  const [name, setName] = useState(boot.name || "");
  const [mass, setMass] = useState(boot.mass ? String(boot.mass) : "");
  const [vialUnit, setVialUnit] = useState(boot.unit || "mg");
  const [vialMl, setVialMl] = useState(boot.vialMl || 3);
  const [dose, setDose] = useState(boot.dose != null ? String(boot.dose) : "");
  const [doseUnit, setDoseUnit] = useState(boot.doseUnit || "mg");
  const [solution, setSolution] = useState(
    initial?.solution != null ? String(initial.solution) : boot.solution || "2"
  );
  const [shareMsg, setShareMsg] = useState("");
  const [hydratedInitial, setHydratedInitial] = useState(null);

  const isCustom = peptideId === CUSTOM_ID;
  const selectedPeptide = isCustom
    ? null
    : options.find((o) => o.id === peptideId) || options[0] || null;
  const etchName = name || selectedPeptide?.name || "UD";
  const etchShort = shortCapName(etchName);
  const etchSlug = capStlSlug(etchName);
  const etchPreviewSlug = etchSlug === "ud" ? "blank" : etchSlug;
  const selectedStrength =
    selectedPeptide?.strengths.find((s) => s.key === strengthKey) ||
    selectedPeptide?.strengths[0] ||
    null;

  function applyCustomMode(seed = null) {
    setPeptideId(CUSTOM_ID);
    setStrengthKey("");
    setName(seed?.name != null ? String(seed.name) : "");
    setMass(seed?.mass != null ? String(seed.mass) : "");
    setVialUnit(seed?.unit === "IU" ? "IU" : "mg");
    const ml = Number(seed?.vialMl);
    setVialMl(BOTTLE_SIZES_ML.includes(ml) ? ml : 3);
    setDose(seed?.dose != null ? String(seed.dose) : "0.25");
    setDoseUnit(seed?.doseUnit === "IU" ? "IU" : "mg");
    setSolution(seed?.solution != null ? String(seed.solution) : "2");
    setShareMsg("");
  }

  function applyCatalogSelection(option, strength, seed = null) {
    if (!option || !strength) return;
    const d = defaultsFor(option, strength, seed);
    setPeptideId(option.id);
    setStrengthKey(strength.key);
    setName(option.name);
    setMass(String(d.mass));
    setVialUnit(d.unit);
    setVialMl(d.vialMl);
    setDose(String(d.dose));
    setDoseUnit(d.doseUnit);
    // BAC always follows peptide + dosage unless an explicit seed value is given
    if (seed?.solution != null && String(seed.solution) !== "") {
      setSolution(String(seed.solution));
    } else {
      setSolution(d.solution || "2");
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

    const doseMg = doseN;
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
    if (id === CUSTOM_ID) {
      applyCustomMode({
        name: "",
        mass: "",
        vialMl: 3,
        dose: "0.25",
        doseUnit: "mg",
        unit: "mg",
        solution: "2",
      });
      return;
    }
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
    applyCatalogSelection(option, strength);
  }

  function useSuggestedBac() {
    if (suggested == null) return;
    setSolution(formatNum(suggested, 2));
  }

  function clearAll() {
    if (isCustom) {
      applyCustomMode({
        name: "",
        mass: "",
        vialMl: 3,
        dose: "0.25",
        doseUnit: "mg",
        unit: "mg",
        solution: "2",
      });
      return;
    }
    if (options[0]) {
      applyCatalogSelection(options[0], options[0].strengths[0]);
      return;
    }
    applyCustomMode();
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
  const doseUnitOptions =
    vialUnit === "IU"
      ? [{ value: "IU", label: "IU" }]
      : isCustom
        ? [
            { value: "mg", label: "mg" },
            { value: "IU", label: "IU" },
          ]
        : [{ value: "mg", label: "mg" }];

  return (
    <section className="panel-page fade">
      <div className="container">
        {typeof onBack === "function" && (
          <button type="button" className="ghost-btn" onClick={onBack}>
            <ArrowLeft size={16} /> Back to catalog
          </button>
        )}
        <div
          className="panel calc-panel"
          style={typeof onBack === "function" ? { marginTop: "1rem" } : undefined}
        >
          <div className="calc-hero">
            <div className="calc-hero-icon">
              <Calculator size={22} />
            </div>
            <div>
              <h1>Peptide calculator</h1>
              <p className="lede" style={{ marginBottom: 0 }}>
                Pick a catalog peptide or Custom to enter your own name, vial
                contents, and bottle / label size (3·40×20 · 5·40×25 · 10·50×30 ·
                30·70×40 mm).
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
                    !isCustom &&
                    peptideId === p.optionId &&
                    strengthKey === p.strengthKey
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

          <div className="calc-layout calc-layout--solo">
            <div className="calc-card">
              <div className="form-grid">
                <label className="field">
                  Peptide ({options.length || 0})
                  <select
                    value={isCustom ? CUSTOM_ID : selectedPeptide?.id || ""}
                    onChange={(e) => onPeptideChange(e.target.value)}
                  >
                    <option value={CUSTOM_ID}>Custom — enter your own</option>
                    {!options.length && (
                      <option value="" disabled>
                        No catalog peptides
                      </option>
                    )}
                    {optionsByCategory.map(([category, items]) => (
                      <optgroup key={category} label={category}>
                        {items.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>

                {isCustom ? (
                  <>
                    <label className="field">
                      Peptide name
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. BPC-157"
                        autoComplete="off"
                      />
                    </label>
                    <div className="form-row">
                      <label className="field">
                        Vial contents ({vialUnit || "mg"})
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={mass}
                          onChange={(e) => setMass(e.target.value)}
                          placeholder="e.g. 5"
                        />
                      </label>
                      <label className="field">
                        Bottle + label size
                        <select
                          value={String(vialMl)}
                          onChange={(e) => setVialMl(Number(e.target.value))}
                        >
                          {BOTTLE_SIZES_ML.map((ml) => (
                            <option key={ml} value={ml}>
                              {bottleOptionLabel(ml)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <label className="field">
                      Unit
                      <select
                        value={vialUnit === "IU" ? "IU" : "mg"}
                        onChange={(e) => {
                          const next = e.target.value === "IU" ? "IU" : "mg";
                          setVialUnit(next);
                          setDoseUnit(next);
                        }}
                      >
                        <option value="mg">mg</option>
                        <option value="IU">IU</option>
                      </select>
                    </label>
                  </>
                ) : (
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
                )}

                <div className="form-row">
                  {!isCustom ? (
                    <label className="field">
                      Vial ({vialUnit || "mg"} · {vialMl || 3} mL)
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
                  ) : null}
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
                    Dose unit
                    <select
                      value={doseUnit === "IU" ? "IU" : "mg"}
                      disabled={!isCustom && vialUnit !== "IU"}
                      title={
                        isCustom
                          ? "Choose mg or IU"
                          : vialUnit === "IU"
                            ? "IU (HGH only)"
                            : "mg (default for all other peptides)"
                      }
                      onChange={(e) =>
                        setDoseUnit(e.target.value === "IU" ? "IU" : "mg")
                      }
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
                <p className="meta" style={{ margin: 0 }}>
                  {isCustom ? (
                    <>
                      Custom · {name.trim() || "unnamed"}
                      {mass ? ` · ${mass} ${vialUnit}` : ""}
                      {` · ${vialMl} mL bottle`}
                    </>
                  ) : selectedPeptide ? (
                    <>
                      Defaults from{" "}
                      <strong>{selectedPeptide.name.split("(")[0].trim()}</strong>
                      {selectedStrength ? ` · ${selectedStrength.label}` : ""}
                      {` · ${vialUnit} · ${vialMl} mL`}
                      {selectedPeptide.strengths.length > 1
                        ? ` · ${selectedPeptide.strengths.length} dosages in catalog`
                        : ""}
                    </>
                  ) : null}
                </p>
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
                    <div>
                      <span>Bottle</span>
                      <strong>{vialMl} mL</strong>
                    </div>
                    <div>
                      <span>Label</span>
                      <strong>
                        {labelSpecForVialMl(vialMl).widthMm}×
                        {labelSpecForVialMl(vialMl).heightMm} mm
                      </strong>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="calc-print-panel">
            <div className="calc-card-head">
              <h2>Vial label</h2>
            </div>
            <p className="meta">
              {bottleOptionLabel(Number(vialMl) || 3)}. Rounded corners · QR →
              www.wellpept.com. Filled from this calculator.
            </p>
            {!isCustom ? (
              <label className="field" style={{ maxWidth: "22rem" }}>
                Bottle + label size
                <select
                  value={
                    BOTTLE_SIZES_ML.includes(Number(vialMl))
                      ? String(vialMl)
                      : "3"
                  }
                  onChange={(e) => setVialMl(Number(e.target.value))}
                >
                  {BOTTLE_SIZES_ML.map((ml) => (
                    <option key={ml} value={ml}>
                      {bottleOptionLabel(ml)}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <div className="calc-label-stage">
              <LabelTemplate
                blank={false}
                size="lg"
                name={name || selectedPeptide?.name || "Peptide"}
                mass={mass}
                unit={vialUnit || "mg"}
                bacWater={solution ? `${formatNum(solution, 2)} mL` : ""}
                concentration={result?.concLabel || ""}
                doseRange={formatDoseRangeLabel(
                  dose,
                  doseUnit,
                  result?.units ? Math.round(Number(result.units)) || 10 : 10
                )}
                vialMl={Number(vialMl) || 3}
                showDownload
              />
            </div>
          </div>

          <div className="calc-print-panel">
            <div className="calc-card-head">
              <h2>3D print etched vial cap</h2>
            </div>
            <p className="meta">
              Snap-style ~13 mm flip-cap with short name recessed on top and
              side (single-color print — etch reads from shadows) —{" "}
              <strong>{etchShort}</strong>
              {" "}for{" "}
              {name?.trim() || selectedPeptide?.name || "custom"}. Print top-up,
              0.2 mm layers, no supports.
            </p>
            <div className="calc-print-cap-preview">
              <img
                src={`/printables/previews/cap-${etchPreviewSlug}.svg`}
                alt=""
                width={72}
                height={72}
                onError={(e) => {
                  e.currentTarget.src = "/printables/previews/cap-blank.svg";
                }}
              />
              <span>{etchShort}</span>
            </div>
            <p className="meta" style={{ marginTop: "0.35rem" }}>
              Schematic preview — physical cap etch will be refined later.
            </p>
            <div className="calc-print-actions">
              <a
                className="primary-btn"
                href={`/printables/undisclosed-cap-${etchSlug}.stl`}
                download={`undisclosed-cap-${etchSlug}.stl`}
              >
                <Download size={16} /> Download {etchShort} cap STL
              </a>
              <a
                className="soft-btn"
                href="/printables/undisclosed-cap-plate.stl"
                download="undisclosed-cap-plate.stl"
              >
                Full cap plate
              </a>
              <a
                className="soft-btn"
                href="/printables/undisclosed-cap-blank.stl"
                download="undisclosed-cap-blank.stl"
              >
                Blank UD
              </a>
            </div>
            <p className="meta" style={{ marginTop: "0.65rem" }}>
              Examples: Retatrutide → RETA · Tirzepatide → TRIZ · Semaglutide →
              SEMA · BPC-157 → BPC. Custom names shorten to 5 characters.
            </p>
          </div>

          <div className="calc-print-panel">
            <div className="calc-card-head">
              <h2>3D print the kit case</h2>
            </div>
            <p className="meta">
              Printable case for the 10-vial kit in the product photo — 2×5
              vial pockets, spare-cap trough, hinged lid. STL in millimeters.
            </p>
            <div className="calc-print-preview">
              <img
                src="/undisclosed-hero-kit-sm.webp"
                alt="Undisclosed 10-vial research kit case"
                width={800}
                height={534}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="calc-print-actions">
              <a
                className="primary-btn"
                href="/printables/undisclosed-vial-case-plate.stl"
                download="undisclosed-vial-case-plate.stl"
              >
                <Download size={16} /> Download full plate STL
              </a>
              <a
                className="soft-btn"
                href="/printables/undisclosed-vial-case-base.stl"
                download="undisclosed-vial-case-base.stl"
              >
                Base
              </a>
              <a
                className="soft-btn"
                href="/printables/undisclosed-vial-case-lid.stl"
                download="undisclosed-vial-case-lid.stl"
              >
                Lid
              </a>
              <a
                className="soft-btn"
                href="/printables/undisclosed-vial-case-pin.stl"
                download="undisclosed-vial-case-pin.stl"
              >
                Pin
              </a>
            </div>
            <p className="meta" style={{ marginTop: "0.65rem" }}>
              ~141 × 50 mm · PETG or PLA · 0.2 mm layers · no supports. Scale
              ±1–3% if vials are tight.
            </p>
            <p className="meta" style={{ marginTop: "0.65rem" }}>
              Prefer a label pack or more STLs? Open{" "}
              <strong>Free prints</strong> in the header.
            </p>
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
