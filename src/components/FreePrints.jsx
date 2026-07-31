import React, { useMemo, useState } from "react";
import { Download, ArrowLeft, Printer } from "lucide-react";
import { CAP_SHORT_NAMES, capStlSlug } from "../data/capNames";
import LabelTemplate from "./LabelTemplate";
import {
  PRINT_CAP_OPTIONS,
  PRINT_CAP_COLORS,
} from "../data/printables";
import { PRINT_IDEAS, PRINT_IDEA_STATUS } from "../data/printIdeas";

const FEATURED_CAPS = [
  { peptide: "Retatrutide", short: "RETA" },
  { peptide: "Tirzepatide", short: "TRIZ" },
  { peptide: "Semaglutide", short: "SEMA" },
  { peptide: "BPC-157", short: "BPC" },
  { peptide: "TB-500", short: "TB5" },
  { peptide: "KLOW", short: "KLOW" },
  { peptide: "NAD+", short: "NAD" },
  { peptide: "HGH", short: "HGH" },
  { peptide: "Ipamorelin", short: "IPA" },
  { peptide: "CJC-1295", short: "CJC" },
  { peptide: "GLOW", short: "GLOW" },
  { peptide: "Blank", short: "UD" },
];

const CAP_GALLERY = Object.entries(CAP_SHORT_NAMES)
  .filter(([name], i, arr) => {
    const short = CAP_SHORT_NAMES[name];
    return arr.findIndex(([, s]) => s === short) === i;
  })
  .map(([peptide, short]) => ({ peptide, short }));

const BOTTLE_ML = [3, 5, 10, 30];

function previewCapSlug(short) {
  if (!short || short === "UD") return "blank";
  return String(short)
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]+/g, "");
}

function CapThumb({ short }) {
  const src = `/printables/previews/cap-${previewCapSlug(short)}.svg`;
  return (
    <img
      src={src}
      alt={`${short} etched vial cap`}
      width={120}
      height={120}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        e.currentTarget.src = "/printables/previews/cap-blank.svg";
      }}
    />
  );
}

function CapColorThumb({ color }) {
  return (
    <img
      src={`/printables/previews/cap-color-${color.id}.svg`}
      alt={`${color.label} solid vial cap`}
      width={120}
      height={120}
      loading="lazy"
      decoding="async"
    />
  );
}

export default function FreePrints({ onBack, onOpenCalculator }) {
  const [capMode, setCapMode] = useState("name"); // name | color
  const [capKey, setCapKey] = useState(PRINT_CAP_OPTIONS[0]?.slug || "reta");
  const [capColorId, setCapColorId] = useState("black");
  const [labelKey, setLabelKey] = useState(PRINT_CAP_OPTIONS[0]?.slug || "reta");
  const [labelMl, setLabelMl] = useState(3);
  const [labelMass, setLabelMass] = useState("10");

  const selectedCap = useMemo(
    () =>
      PRINT_CAP_OPTIONS.find((o) => o.slug === capKey) || PRINT_CAP_OPTIONS[0],
    [capKey]
  );
  const selectedCapColor = useMemo(
    () => PRINT_CAP_COLORS.find((c) => c.id === capColorId) || PRINT_CAP_COLORS[0],
    [capColorId]
  );
  const selectedLabel = useMemo(
    () =>
      PRINT_CAP_OPTIONS.find((o) => o.slug === labelKey) || PRINT_CAP_OPTIONS[0],
    [labelKey]
  );

  const capStlHref =
    capMode === "color" || selectedCap.slug === "blank"
      ? "/printables/undisclosed-cap-blank.stl"
      : `/printables/undisclosed-cap-${selectedCap.slug}.stl`;
  const capStlName =
    capMode === "color" || selectedCap.slug === "blank"
      ? "undisclosed-cap-blank.stl"
      : `undisclosed-cap-${selectedCap.slug}.stl`;

  return (
    <section className="section free-prints-page" id="free-prints">
      <div className="container">
        <button type="button" className="ghost-btn free-prints-back" onClick={onBack}>
          <ArrowLeft size={16} /> Back to catalog
        </button>

        <div className="free-prints-hero">
          <span className="featured-kicker">
            <Printer size={14} aria-hidden="true" /> Free prints
          </span>
          <h1>Free 3D prints &amp; labels</h1>
          <p>
            Download cap and kit-case STLs free — many etched names or print
            blank caps in black, white, blue, or red filament. The kit case
            matches the clear KLOW featured photo (print in clear filament).
            Make vial wrap labels free in the calculator.
          </p>
        </div>

        <div className="free-prints-grid">
          <article className="free-print-card panel">
            <div className="free-print-media free-print-media--caps">
              <img
                src="/printables/previews/caps-collage.svg"
                alt="Schematic etched vial caps with short peptide names"
                width={920}
                height={700}
                loading="eager"
                decoding="async"
              />
              <p className="meta free-print-media-note">
                Schematic preview — physical cap etch will be refined
              </p>
            </div>
            <div className="free-print-copy">
              <h2>Vial caps · free STL</h2>
              <p>
                Flip-cap STLs with a short etched name, or blank for solid
                filament colors (black, white, blue, red).
              </p>
              <div className="free-print-mode-toggle" role="group" aria-label="Cap style">
                <button
                  type="button"
                  className={capMode === "name" ? "soft-btn active" : "ghost-btn"}
                  onClick={() => setCapMode("name")}
                >
                  Many names
                </button>
                <button
                  type="button"
                  className={capMode === "color" ? "soft-btn active" : "ghost-btn"}
                  onClick={() => setCapMode("color")}
                >
                  4 colors
                </button>
              </div>

              {capMode === "name" ? (
                <>
                  <div className="free-print-cap-row" aria-label="Example named caps">
                    {FEATURED_CAPS.slice(0, 6).map((c) => (
                      <button
                        key={c.short}
                        type="button"
                        className={`free-print-cap-thumb${
                          selectedCap.short === c.short ? " active" : ""
                        }`}
                        title={c.peptide}
                        onClick={() => {
                          const opt = PRINT_CAP_OPTIONS.find((o) => o.short === c.short);
                          if (opt) setCapKey(opt.slug);
                        }}
                      >
                        <CapThumb short={c.short} />
                        <span>{c.short}</span>
                      </button>
                    ))}
                  </div>
                  <div className="free-print-order-fields">
                    <label className="field">
                      Cap name
                      <select
                        value={capKey}
                        onChange={(e) => setCapKey(e.target.value)}
                      >
                        {PRINT_CAP_OPTIONS.map((o) => (
                          <option key={o.slug} value={o.slug}>
                            {o.short} — {o.peptide}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </>
              ) : (
                <div className="free-print-color-swatches free-print-color-swatches--lg">
                  {PRINT_CAP_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={`free-print-color-pick${
                        capColorId === c.id ? " active" : ""
                      }`}
                      onClick={() => setCapColorId(c.id)}
                      aria-pressed={capColorId === c.id}
                    >
                      <CapColorThumb color={c} />
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="calc-print-actions">
                <a className="primary-btn" href={capStlHref} download={capStlName}>
                  <Download size={16} /> Download{" "}
                  {capMode === "color"
                    ? `blank · print in ${selectedCapColor.label}`
                    : `${selectedCap.short} STL`}
                </a>
                <a
                  className="soft-btn"
                  href="/printables/undisclosed-cap-plate.stl"
                  download="undisclosed-cap-plate.stl"
                >
                  Full name plate
                </a>
              </div>
            </div>
          </article>

          <article className="free-print-card panel">
            <div className="free-print-media">
              <img
                src="/undisclosed-hero-kit-sm.webp"
                alt="Undisclosed 10-vial research kit case"
                width={800}
                height={534}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="free-print-copy">
              <h2>Kit case · free STL · clear filament</h2>
              <p>
                Same layout as the featured KLOW kit photo — 2×5 vial pockets,
                4 round spare-cap wells, hinged lid. Print in{" "}
                <strong>clear PETG or clear PLA</strong> for the translucent
                look.
              </p>
              <div className="free-print-inline-thumb">
                <img
                  src="/printables/previews/case-thumb.svg"
                  alt=""
                  width={360}
                  height={200}
                  loading="lazy"
                  aria-hidden="true"
                />
              </div>
              <div className="calc-print-actions">
                <a
                  className="primary-btn"
                  href="/printables/undisclosed-vial-case-plate.stl"
                  download="undisclosed-vial-case-plate.stl"
                >
                  <Download size={16} /> Full plate STL
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
              <p className="meta" style={{ marginTop: "0.55rem" }}>
                ~125 × 45 mm · 2–3 walls · 0–15% infill · slow outer walls · no
                supports. Dry clear filament first.
              </p>
            </div>
          </article>

          <article className="free-print-card panel">
            <div className="free-print-media free-print-media--label">
              <LabelTemplate
                blank={false}
                size="lg"
                name="KLOW"
                mass="80"
                unit="mg"
                bacWater="3.2 mL"
                concentration="25 mg/mL"
                doseRange="2.5 - 5 mg (10 - 20 u)"
                vialMl={3}
                showDownload={false}
              />
            </div>
            <div className="free-print-copy">
              <h2>Vial labels · free</h2>
              <p>
                Your clinical wrap labels — pick peptide, strength, and bottle
                size, then download from the preview or calculator.
              </p>
              <div className="free-print-order-fields">
                <label className="field">
                  Peptide
                  <select
                    value={labelKey}
                    onChange={(e) => setLabelKey(e.target.value)}
                  >
                    {PRINT_CAP_OPTIONS.map((o) => (
                      <option key={o.slug} value={o.slug}>
                        {o.short} — {o.peptide}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  Strength (mg)
                  <input
                    type="text"
                    inputMode="decimal"
                    value={labelMass}
                    onChange={(e) => setLabelMass(e.target.value)}
                    placeholder="10"
                  />
                </label>
                <label className="field">
                  Bottle
                  <select
                    value={labelMl}
                    onChange={(e) => setLabelMl(Number(e.target.value))}
                  >
                    {BOTTLE_ML.map((ml) => (
                      <option key={ml} value={ml}>
                        {ml} mL
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="free-print-label-live">
                <LabelTemplate
                  blank={false}
                  size="lg"
                  name={
                    selectedLabel.peptide.startsWith("Blank")
                      ? "Peptide"
                      : selectedLabel.peptide
                  }
                  mass={labelMass || "10"}
                  unit="mg"
                  bacWater="2.0 mL"
                  vialMl={labelMl}
                  showDownload
                />
              </div>
              {onOpenCalculator ? (
                <div className="calc-print-actions">
                  <button type="button" className="soft-btn" onClick={onOpenCalculator}>
                    Open calculator
                  </button>
                </div>
              ) : null}
            </div>
          </article>
        </div>

        <div className="section-head free-prints-cap-head">
          <div>
            <h2>Cap name library</h2>
            <p className="meta">
              Free STL per etch · or blank for solid black / white / blue / red.
            </p>
          </div>
        </div>

        <div className="free-print-color-band">
          {PRINT_CAP_COLORS.map((c) => (
            <a
              key={c.id}
              className="free-print-color-pick"
              href="/printables/undisclosed-cap-blank.stl"
              download="undisclosed-cap-blank.stl"
              title={`Blank STL — print in ${c.label}`}
            >
              <CapColorThumb color={c} />
              <strong>{c.label}</strong>
              <span>Blank STL free</span>
            </a>
          ))}
        </div>

        <div className="free-prints-cap-grid">
          {CAP_GALLERY.map(({ peptide, short }) => {
            const slug = capStlSlug(peptide);
            return (
              <a
                key={`${short}-${peptide}`}
                className="free-print-cap-tile"
                href={`/printables/undisclosed-cap-${slug}.stl`}
                download={`undisclosed-cap-${slug}.stl`}
                title={`Download ${short} STL free`}
              >
                <CapThumb short={short} />
                <strong>{short}</strong>
                <span>{peptide}</span>
              </a>
            );
          })}
          <a
            className="free-print-cap-tile"
            href="/printables/undisclosed-cap-blank.stl"
            download="undisclosed-cap-blank.stl"
            title="Download blank UD STL free"
          >
            <CapThumb short="UD" />
            <strong>UD</strong>
            <span>Blank etch</span>
          </a>
        </div>

        <div className="section-head free-prints-cap-head" id="print-ideas">
          <div>
            <h2>More print ideas</h2>
            <p className="meta">
              Caps, case, and labels are free now. More STLs coming — still free
              when they drop.
            </p>
          </div>
        </div>

        <div className="print-ideas-grid">
          {PRINT_IDEAS.map((idea, i) => {
            const st = PRINT_IDEA_STATUS[idea.status] || PRINT_IDEA_STATUS.soon;
            return (
              <article key={idea.id} className="print-idea-card">
                <div className="print-idea-top">
                  <span className="print-idea-num">{String(i + 1).padStart(2, "0")}</span>
                  <span className={`print-idea-status print-idea-status--${st.tone}`}>
                    {idea.status === "soon" ? "Coming soon" : "Free"}
                  </span>
                </div>
                {idea.image ? (
                  <div className="print-idea-media">
                    <img
                      src={idea.image}
                      alt=""
                      width={400}
                      height={267}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                ) : (
                  <div className="print-idea-media print-idea-media--placeholder" aria-hidden="true">
                    <span>{idea.tag}</span>
                  </div>
                )}
                <h3>{idea.title}</h3>
                <p>{idea.blurb}</p>
                <div className="print-idea-actions">
                  {idea.status === "ready" && idea.href ? (
                    <a className="soft-btn" href={idea.href} download={idea.download}>
                      <Download size={14} /> Free STL
                    </a>
                  ) : null}
                  {idea.status === "labels" && onOpenCalculator ? (
                    <button type="button" className="soft-btn" onClick={onOpenCalculator}>
                      <Download size={14} /> Make label
                    </button>
                  ) : null}
                  {idea.status === "soon" ? (
                    <span className="meta">Free STL when ready</span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <p className="meta free-prints-footnote">
          Research organization only — not pharmaceutical closures or medical
          devices.
        </p>
      </div>
    </section>
  );
}
