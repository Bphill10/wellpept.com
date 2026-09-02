import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Calculator, RotateCcw, Link2, Download, Upload } from "lucide-react";
import LabelTemplate from "./LabelTemplate";
import {
  CATEGORIES,
  calculatorOptionsFromListings,
  matchCalculatorOption,
} from "../data/products";
import {
  buildCalculatorShareUrl,
  defaultsFromCatalogSelection,
  normalizeDoseUnit,
  suggestedBacMl as suggestedBacFromAutomation,
} from "../utils/automation";
import {
  LABEL_BOTTLE_SIZES_ML,
  labelSpecForVialMl,
  udLabelTemplateById,
  udLabelTemplateFor,
} from "../utils/vialArt";
import { shortCapName, capStlSlug } from "../data/capNames";
import {
  UD_FEATURED_KIT_SRC,
} from "../data/udLabelAssets";
import SilverLabelVial from "./SilverLabelVial";

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

function defaultHighDose(low) {
  const n = Number(low);
  return n > 0 ? formatNum(n * 2, 4) : "";
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
  const [doseHigh, setDoseHigh] = useState(
    initial?.doseHigh != null && String(initial.doseHigh) !== ""
      ? String(initial.doseHigh)
      : defaultHighDose(boot.dose)
  );
  const [doseUnit, setDoseUnit] = useState(boot.doseUnit || "mg");
  const [solution, setSolution] = useState(
    initial?.solution != null ? String(initial.solution) : boot.solution || "2"
  );
  const [shareMsg, setShareMsg] = useState("");
  const [hydratedInitial, setHydratedInitial] = useState(null);
  const [labelTemplateId, setLabelTemplateId] = useState(() =>
    udLabelTemplateFor(boot.vialMl || 3, "CALCULATOR").id
  );

  const labelTemplate = udLabelTemplateById(labelTemplateId);

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
    const nextMl = BOTTLE_SIZES_ML.includes(ml) ? ml : 3;
    setVialMl(nextMl);
    setLabelTemplateId(udLabelTemplateFor(nextMl, labelTemplate.labelType).id);
    const nextDose = seed?.dose != null ? String(seed.dose) : "0.25";
    setDose(nextDose);
    setDoseHigh(
      seed?.doseHigh != null && String(seed.doseHigh) !== ""
        ? String(seed.doseHigh)
        : defaultHighDose(nextDose)
    );
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
    setLabelTemplateId(udLabelTemplateFor(d.vialMl, labelTemplate.labelType).id);
    setDose(String(d.dose));
    setDoseHigh(
      seed?.doseHigh != null && String(seed.doseHigh) !== ""
        ? String(seed.doseHigh)
        : defaultHighDose(d.dose)
    );
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
      doseHigh: initial?.doseHigh ?? "",
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
        doseHigh,
        doseUnit,
        unit: vialUnit,
      }),
    [name, mass, solution, dose, doseHigh, doseUnit, vialUnit]
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

  const doseLowNumber = Number(dose);
  const doseHighNumber = Number(doseHigh);
  const doseRangeValid =
    doseLowNumber > 0 &&
    doseHighNumber > 0 &&
    doseHighNumber >= doseLowNumber;
  const highDoseUnits =
    result?.units && doseLowNumber > 0
      ? Number(result.units) * (doseHighNumber / doseLowNumber)
      : 0;
  // Split dose for the silver label: mg amount on the value line, syringe units below.
  const doseParts = useMemo(() => {
    const fmt = (n) => parseFloat(Number(n).toFixed(2)).toString();
    const unitLabel = doseUnit === "IU" ? "IU" : "MG";
    if (!(result && doseLowNumber > 0)) return { value: "", units: "" };
    const uLow = Number(result.units) || 0;
    if (doseRangeValid && doseHighNumber > doseLowNumber) {
      return {
        value: `${fmt(doseLowNumber)} – ${fmt(doseHighNumber)} ${unitLabel}`,
        units: `${fmt(uLow)} – ${fmt(highDoseUnits)} U`,
      };
    }
    return { value: `${fmt(doseLowNumber)} ${unitLabel}`, units: `${fmt(uLow)} U` };
  }, [result, doseLowNumber, doseHighNumber, doseRangeValid, highDoseUnits, doseUnit]);

  // Custom private-label branding (name + logo instead of UNDISCLOSED).
  const [customBrand, setCustomBrand] = useState(false);
  const [brandNameInput, setBrandNameInput] = useState("");
  const [brandLogo, setBrandLogo] = useState("");

  function onBrandLogoFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBrandLogo(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  const activeBrandName =
    customBrand && brandNameInput.trim() ? brandNameInput.trim() : "UNDISCLOSED";
  const activeBrandImage = customBrand && brandLogo ? brandLogo : "";

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
                Pick a catalog peptide or Custom. Dose math on the left — free
                vial label beside it. Cap and kit-case STLs below are free too.
              </p>
            </div>
          </div>

          <div className="calc-layout calc-layout--with-label">
            <div className="calc-card calc-card--skinny">
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
                          onChange={(e) => {
                            const ml = Number(e.target.value);
                            setVialMl(ml);
                            setLabelTemplateId(
                              udLabelTemplateFor(ml, labelTemplate.labelType).id
                            );
                          }}
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

                <div className="form-row form-row--3">
                  <label className="field">
                    Range minimum
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={dose}
                      onChange={(e) => setDose(e.target.value)}
                    />
                  </label>
                  <label className="field">
                    Range maximum
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={doseHigh}
                      onChange={(e) => setDoseHigh(e.target.value)}
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
                {!doseRangeValid && (
                  <div className="notice warn">
                    Enter a maximum research dose equal to or greater than the
                    minimum.
                  </div>
                )}

                <div className="row-actions">
                  <button
                    type="button"
                    className="soft-btn"
                    onClick={shareCalc}
                    disabled={!result || !doseRangeValid}
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

                  <div className="calc-refs calc-refs--compact">
                    <div>
                      <span>Conc.</span>
                      <strong>{result.concLabel}</strong>
                    </div>
                    <div>
                      <span>Doses</span>
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

            <aside className="calc-label-panel">
              <div className="calc-card-head">
                <h2>Vial label · free</h2>
              </div>
              <p className="meta">
                Pick a label · {bottleOptionLabel(Number(vialMl) || 3)} · catalog
                or calculator (your dose) · silver design · download free to print
                (40×20 mm / 50×30 mm, Niimbot-ready)
              </p>
              <span className="calc-controls-label">Label type</span>
              <div
                className="calc-label-templates"
                role="radiogroup"
                aria-label="Label type"
              >
                {[
                  ["CATALOG", "Catalog", "Name · form · storage"],
                  ["CALCULATOR", "Dosage", "Your dose · diluent · conc."],
                ].map(([t, title, blurb]) => {
                  const active = labelTemplate.labelType === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`calc-label-template${active ? " is-active" : ""}`}
                      onClick={() =>
                        setLabelTemplateId(
                          udLabelTemplateFor(Number(vialMl) || 3, t).id
                        )
                      }
                    >
                      <strong>{title}</strong>
                      <span>{blurb}</span>
                    </button>
                  );
                })}
              </div>
              <span className="calc-controls-label">Bottle size</span>
              <div
                className="calc-label-templates"
                role="radiogroup"
                aria-label="Bottle size"
              >
                {[
                  [3, "3 mL", "40 × 20 mm label"],
                  [10, "10 mL", "50 × 30 mm label"],
                ].map(([ml, title, blurb]) => {
                  const active = (Number(vialMl) >= 8 ? 10 : 3) === ml;
                  return (
                    <button
                      key={ml}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`calc-label-template${active ? " is-active" : ""}`}
                      onClick={() => {
                        setVialMl(ml);
                        setLabelTemplateId(
                          udLabelTemplateFor(ml, labelTemplate.labelType).id
                        );
                      }}
                    >
                      <strong>{title}</strong>
                      <span>{blurb}</span>
                    </button>
                  );
                })}
              </div>
              <div className="calc-brand-custom">
                <label className="calc-brand-toggle">
                  <input
                    type="checkbox"
                    checked={customBrand}
                    onChange={(e) => setCustomBrand(e.target.checked)}
                  />
                  <span>
                    Custom branding — your own name &amp; logo instead of
                    UNDISCLOSED
                  </span>
                </label>
                {customBrand && (
                  <div className="calc-brand-fields">
                    <input
                      type="text"
                      className="calc-brand-name"
                      placeholder="Your brand name"
                      value={brandNameInput}
                      maxLength={22}
                      onChange={(e) => setBrandNameInput(e.target.value)}
                    />
                    <label className="calc-brand-logo soft-btn">
                      <Upload size={14} />{" "}
                      {brandLogo ? "Change logo" : "Upload logo"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onBrandLogoFile}
                        hidden
                      />
                    </label>
                    {brandLogo && (
                      <button
                        type="button"
                        className="calc-brand-clear soft-btn"
                        onClick={() => setBrandLogo("")}
                      >
                        Remove logo
                      </button>
                    )}
                    <span className="meta">
                      A white or light logo shows best on the black strip.
                    </span>
                  </div>
                )}
              </div>
              <div className="calc-vial-stage">
                <SilverLabelVial
                  name={name || selectedPeptide?.name || "Peptide"}
                  mass={mass}
                  unit={vialUnit || "mg"}
                  labelType={labelTemplate.labelType}
                  formText={(selectedStrength?.form || "Lyophilized Powder").toUpperCase()}
                  storageTemp="36–46°F"
                  diluent={solution ? `${formatNum(solution, 2)} mL` : ""}
                  concentration={result?.concLabel || ""}
                  doseValue={doseParts.value}
                  doseUnits={doseParts.units}
                  brandName={activeBrandName}
                  brandImage={activeBrandImage}
                  vialMl={Number(vialMl) || 3}
                  className="calc-generated-vial"
                />
              </div>
              <p className="calc-label-caption meta">
                This flat label is what prints (exact size):
              </p>
              <div className="calc-label-stage">
                <LabelTemplate
                  blank={false}
                  size="lg"
                  name={name || selectedPeptide?.name || "Peptide"}
                  mass={mass}
                  unit={vialUnit || "mg"}
                  bacWater={solution ? `${formatNum(solution, 2)} mL` : ""}
                  concentration={result?.concLabel || ""}
                  doseRange={doseParts.value}
                  doseUnits={doseParts.units}
                  vialMl={Number(vialMl) || 3}
                  labelType={labelTemplate.labelType}
                  formText={(selectedStrength?.form || "Lyophilized Powder").toUpperCase()}
                  storageTemp="36–46°F"
                  brandName={activeBrandName}
                  brandImage={activeBrandImage}
                  showDownload
                />
              </div>
            </aside>
          </div>

          <div className="calc-print-panel">
            <div className="calc-card-head">
              <h2>3D print etched vial cap · free</h2>
            </div>
            <p className="meta">
              Free STL · snap-style ~13 mm flip-cap with short name recessed on
              top and side (single-color print — etch reads from shadows) —{" "}
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
              <h2>3D print the clear kit case · free</h2>
            </div>
            <p className="meta">
              Free STL · matches the featured KLOW kit photo — 2×5 vial pockets,
              4 round spare-cap wells, hinged lid. Print in clear PETG / clear
              PLA.
            </p>
            <div className="calc-print-preview">
              <img
                src={UD_FEATURED_KIT_SRC}
                alt="Undisclosed clear KLOW 10-vial research kit case"
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
              ~125 × 45 mm · clear filament · 2–3 walls · 0–15% infill · slow
              outer walls · no supports. Scale ±1–3% if vials are tight.
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
  const normalizedHigh = normalizeDoseUnit(
    params.get("doseHigh") || "",
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
    doseHigh:
      Number.isFinite(normalizedHigh.dose) && params.get("doseHigh")
        ? String(normalizedHigh.dose)
        : params.get("doseHigh") || "",
    doseUnit: normalized.doseUnit,
    unit: params.get("unit") || "",
    desiredUnits: params.get("units") || "10",
  };
}
