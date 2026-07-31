import React, { useMemo, useState } from "react";
import { Download, ArrowLeft, Printer, ShoppingCart } from "lucide-react";
import { CAP_SHORT_NAMES, capStlSlug } from "../data/capNames";
import LabelTemplate from "./LabelTemplate";
import {
  PRINT_CAP_OPTIONS,
  PRINT_CAP_COLORS,
  PRINT_PRICES,
  formatPrintMoney,
  printCaps10Line,
  printLabels10Line,
  printKitLine,
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

export default function FreePrints({
  onBack,
  onOpenCalculator,
  onAddToCart,
  onGoCart,
}) {
  const [capMode, setCapMode] = useState("name"); // name | color
  const [capKey, setCapKey] = useState(PRINT_CAP_OPTIONS[0]?.slug || "reta");
  const [capColorId, setCapColorId] = useState("black");
  const [labelKey, setLabelKey] = useState(PRINT_CAP_OPTIONS[0]?.slug || "reta");
  const [labelMl, setLabelMl] = useState(3);
  const [labelMass, setLabelMass] = useState("10");
  const [kitCapMode, setKitCapMode] = useState("name");
  const [kitKey, setKitKey] = useState(PRINT_CAP_OPTIONS[0]?.slug || "reta");
  const [kitColorId, setKitColorId] = useState("black");
  const [kitMl, setKitMl] = useState(3);

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
  const selectedKit = useMemo(
    () =>
      PRINT_CAP_OPTIONS.find((o) => o.slug === kitKey) || PRINT_CAP_OPTIONS[0],
    [kitKey]
  );
  const selectedKitColor = useMemo(
    () => PRINT_CAP_COLORS.find((c) => c.id === kitColorId) || PRINT_CAP_COLORS[0],
    [kitColorId]
  );

  function addLine(line, qty = 1) {
    if (!onAddToCart || !line) return;
    onAddToCart(line, qty);
  }

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
          <h1>Print free — or order cheap</h1>
          <p>
            Download any STL or label and print yourself for free. Or order and
            we’ll print for you:{" "}
            <strong>10 caps {formatPrintMoney(PRINT_PRICES.caps10)}</strong>
            {" · "}
            <strong>10 labels {formatPrintMoney(PRINT_PRICES.labels10)}</strong>
            {" · "}
            <strong>print kit {formatPrintMoney(PRINT_PRICES.kit)}</strong>
            {" "}(case + 10 caps + 10 labels).
          </p>
          <p className="meta free-prints-price-line">
            Print shipping {formatPrintMoney(8)} · free with Warehouse A
            peptides. Request-first checkout like the catalog.
          </p>
        </div>

        <article className="free-print-order-banner panel">
          <div className="free-print-order-banner-copy">
            <h2>Print kit · {formatPrintMoney(PRINT_PRICES.kit)}</h2>
            <p>
              Case + 10 caps + 10 wrap labels. Caps: etched name or one of four
              solid colors. We print in the US · 5–10 days.
            </p>
            <div className="free-print-mode-toggle" role="group" aria-label="Kit cap style">
              <button
                type="button"
                className={kitCapMode === "name" ? "soft-btn active" : "ghost-btn"}
                onClick={() => setKitCapMode("name")}
              >
                Named etch
              </button>
              <button
                type="button"
                className={kitCapMode === "color" ? "soft-btn active" : "ghost-btn"}
                onClick={() => setKitCapMode("color")}
              >
                Solid color
              </button>
            </div>
            <div className="free-print-order-fields">
              {kitCapMode === "name" ? (
                <label className="field">
                  Cap name
                  <select
                    value={kitKey}
                    onChange={(e) => setKitKey(e.target.value)}
                  >
                    {PRINT_CAP_OPTIONS.map((o) => (
                      <option key={o.slug} value={o.slug}>
                        {o.short} — {o.peptide}
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <fieldset className="free-print-color-field">
                  <legend>Cap color</legend>
                  <div className="free-print-color-swatches">
                    {PRINT_CAP_COLORS.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className={`free-print-color-swatch${
                          kitColorId === c.id ? " active" : ""
                        }`}
                        style={{ "--swatch": c.hex }}
                        onClick={() => setKitColorId(c.id)}
                        aria-pressed={kitColorId === c.id}
                        title={c.label}
                      >
                        <span className="free-print-color-dot" />
                        {c.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <label className="field">
                Label peptide
                <select
                  value={kitKey}
                  onChange={(e) => setKitKey(e.target.value)}
                >
                  {PRINT_CAP_OPTIONS.map((o) => (
                    <option key={o.slug} value={o.slug}>
                      {o.short} — {o.peptide}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Label bottle size
                <select
                  value={kitMl}
                  onChange={(e) => setKitMl(Number(e.target.value))}
                >
                  {BOTTLE_ML.map((ml) => (
                    <option key={ml} value={ml}>
                      {ml} mL
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="calc-print-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={() =>
                  addLine(
                    printKitLine({
                      peptide: selectedKit.peptide,
                      short: selectedKit.short,
                      mass: "10",
                      unit: "mg",
                      vialMl: kitMl,
                      capMode: kitCapMode,
                      colorId: kitColorId,
                    })
                  )
                }
              >
                <ShoppingCart size={16} /> Add kit ·{" "}
                {formatPrintMoney(PRINT_PRICES.kit)}
                {kitCapMode === "color"
                  ? ` · ${selectedKitColor.label}`
                  : ` · ${selectedKit.short}`}
              </button>
              {onGoCart ? (
                <button type="button" className="ghost-btn" onClick={onGoCart}>
                  View cart
                </button>
              ) : null}
            </div>
          </div>
          <div className="free-print-order-banner-media" aria-hidden="true">
            <img
              src="/undisclosed-hero-kit-sm.webp"
              alt=""
              width={800}
              height={534}
              loading="eager"
              decoding="async"
            />
          </div>
        </article>

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
              <h2>10 caps · {formatPrintMoney(PRINT_PRICES.caps10)}</h2>
              <p>
                Pack of 10 flip-caps. Choose a short etched name from the
                library, or a solid color with no etch — black, white, blue, or
                red.
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
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    addLine(
                      printCaps10Line(
                        capMode === "color"
                          ? { mode: "color", colorId: capColorId }
                          : {
                              mode: "name",
                              peptide: selectedCap.peptide,
                              short: selectedCap.short,
                            }
                      )
                    )
                  }
                >
                  <ShoppingCart size={16} /> Order 10 ·{" "}
                  {formatPrintMoney(PRINT_PRICES.caps10)}
                  {capMode === "color"
                    ? ` · ${selectedCapColor.label}`
                    : ` · ${selectedCap.short}`}
                </button>
              </div>
              <p className="meta free-prints-diy-label">Or print free</p>
              <div className="calc-print-actions">
                <a
                  className="soft-btn"
                  href={`/printables/undisclosed-cap-${
                    capMode === "color" || selectedCap.slug === "blank"
                      ? "blank"
                      : selectedCap.slug
                  }.stl`}
                  download={`undisclosed-cap-${
                    capMode === "color" || selectedCap.slug === "blank"
                      ? "blank"
                      : selectedCap.slug
                  }.stl`}
                >
                  <Download size={16} />{" "}
                  {capMode === "color" ? "Blank" : selectedCap.short} STL free
                </a>
                <a
                  className="soft-btn"
                  href="/printables/undisclosed-cap-plate.stl"
                  download="undisclosed-cap-plate.stl"
                >
                  Full name plate STL free
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
              <h2>Kit case · free DIY or in the ${PRINT_PRICES.kit} kit</h2>
              <p>
                Hinged case — 2×5 vial pockets, spare-cap trough, pin hinge.
                Included in the print kit, or download the STL and print free.
              </p>
              <div className="free-print-inline-thumb">
                <img
                  src="/printables/previews/case-thumb.svg"
                  alt=""
                  width={320}
                  height={200}
                  loading="lazy"
                  aria-hidden="true"
                />
              </div>
              <div className="calc-print-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    addLine(
                      printKitLine({
                        peptide: selectedKit.peptide,
                        short: selectedKit.short,
                        mass: "10",
                        unit: "mg",
                        vialMl: kitMl,
                        capMode: kitCapMode,
                        colorId: kitColorId,
                      })
                    )
                  }
                >
                  <ShoppingCart size={16} /> Order print kit ·{" "}
                  {formatPrintMoney(PRINT_PRICES.kit)}
                </button>
              </div>
              <p className="meta free-prints-diy-label">Or print free</p>
              <div className="calc-print-actions">
                <a
                  className="soft-btn"
                  href="/printables/undisclosed-vial-case-plate.stl"
                  download="undisclosed-vial-case-plate.stl"
                >
                  <Download size={16} /> Full plate STL free
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
              </div>
            </div>
          </article>

          <article className="free-print-card panel">
            <div className="free-print-media free-print-media--label">
              <img
                src="/undisclosed-label-flat.webp"
                alt="Undisclosed clinical vial wrap label"
                width={640}
                height={320}
                loading="lazy"
                decoding="async"
              />
            </div>
            <div className="free-print-copy">
              <h2>10 vial labels · {formatPrintMoney(PRINT_PRICES.labels10)}</h2>
              <p>
                Black-on-white clinical wraps. Pick peptide, strength, and
                bottle size — we print 10. Or generate your own in the
                calculator for free.
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
              <div className="calc-print-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    addLine(
                      printLabels10Line({
                        peptide: selectedLabel.peptide,
                        mass: labelMass || "10",
                        unit: "mg",
                        vialMl: labelMl,
                      })
                    )
                  }
                >
                  <ShoppingCart size={16} /> Order 10 ·{" "}
                  {formatPrintMoney(PRINT_PRICES.labels10)}
                </button>
                {onOpenCalculator ? (
                  <button type="button" className="soft-btn" onClick={onOpenCalculator}>
                    <Download size={16} /> DIY free in calculator
                  </button>
                ) : null}
              </div>
              <div className="free-print-label-live">
                <LabelTemplate
                  blank={false}
                  size="md"
                  name={
                    selectedLabel.peptide.startsWith("Blank")
                      ? "Peptide"
                      : selectedLabel.peptide
                  }
                  mass={labelMass || "10"}
                  unit="mg"
                  bacWater="2.0 mL"
                  vialMl={labelMl}
                  showDownload={false}
                />
              </div>
            </div>
          </article>
        </div>

        <div className="section-head free-prints-cap-head">
          <div>
            <h2>Cap library</h2>
            <p className="meta">
              Many etched names · or 4 solid colors · packs of 10 for{" "}
              {formatPrintMoney(PRINT_PRICES.caps10)}. STLs free to DIY.
            </p>
          </div>
        </div>

        <div className="free-print-color-band">
          {PRINT_CAP_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className="free-print-color-pick"
              onClick={() =>
                addLine(printCaps10Line({ mode: "color", colorId: c.id }))
              }
            >
              <CapColorThumb color={c} />
              <strong>{c.label}</strong>
              <span>10 · $5 · no etch</span>
            </button>
          ))}
        </div>

        <div className="free-prints-cap-grid">
          {CAP_GALLERY.map(({ peptide, short }) => {
            const slug = capStlSlug(peptide);
            return (
              <div
                key={`${short}-${peptide}`}
                className="free-print-cap-tile free-print-cap-tile--order"
              >
                <CapThumb short={short} />
                <strong>{short}</strong>
                <span>{peptide}</span>
                <div className="free-print-cap-tile-actions">
                  <button
                    type="button"
                    className="soft-btn"
                    onClick={() =>
                      addLine(
                        printCaps10Line({ mode: "name", peptide, short })
                      )
                    }
                  >
                    10 · $5
                  </button>
                  <a
                    href={`/printables/undisclosed-cap-${slug}.stl`}
                    download={`undisclosed-cap-${slug}.stl`}
                    title={`Download ${short} STL free`}
                  >
                    Free STL
                  </a>
                </div>
              </div>
            );
          })}
          <div className="free-print-cap-tile free-print-cap-tile--order">
            <CapThumb short="UD" />
            <strong>UD</strong>
            <span>Blank etch</span>
            <div className="free-print-cap-tile-actions">
              <button
                type="button"
                className="soft-btn"
                onClick={() =>
                  addLine(
                    printCaps10Line({
                      mode: "name",
                      peptide: "Blank / UD",
                      short: "UD",
                    })
                  )
                }
              >
                10 · $5
              </button>
              <a
                href="/printables/undisclosed-cap-blank.stl"
                download="undisclosed-cap-blank.stl"
              >
                Free STL
              </a>
            </div>
          </div>
        </div>

        <div className="section-head free-prints-cap-head" id="print-ideas">
          <div>
            <h2>20 things to print for your peptides</h2>
            <p className="meta">
              Caps, case, and labels ship today. The rest are next up — all DIY
              STLs stay free when they drop.
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
                    {st.label}
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
                    <span className="meta">STL coming · DIY free when ready</span>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        <p className="meta free-prints-footnote">
          Research organization only — not pharmaceutical closures or medical
          devices. Print orders are request-first; we confirm before payment.
        </p>
      </div>
    </section>
  );
}
