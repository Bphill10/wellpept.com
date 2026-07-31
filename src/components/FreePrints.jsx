import React, { useMemo, useState } from "react";
import { Download, ArrowLeft, Printer, ShoppingCart } from "lucide-react";
import { CAP_SHORT_NAMES, capStlSlug } from "../data/capNames";
import {
  PRINT_CAP_OPTIONS,
  PRINT_PRICES,
  formatPrintMoney,
  printCaps10Line,
  printLabels10Line,
  printKitLine,
} from "../data/printables";

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

export default function FreePrints({
  onBack,
  onOpenCalculator,
  onAddToCart,
  onGoCart,
}) {
  const [capKey, setCapKey] = useState(PRINT_CAP_OPTIONS[0]?.slug || "reta");
  const [labelKey, setLabelKey] = useState(PRINT_CAP_OPTIONS[0]?.slug || "reta");
  const [labelMl, setLabelMl] = useState(3);
  const [labelMass, setLabelMass] = useState("10");
  const [kitKey, setKitKey] = useState(PRINT_CAP_OPTIONS[0]?.slug || "reta");
  const [kitMl, setKitMl] = useState(3);

  const selectedCap = useMemo(
    () =>
      PRINT_CAP_OPTIONS.find((o) => o.slug === capKey) || PRINT_CAP_OPTIONS[0],
    [capKey]
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
              Case + 10 etched caps + 10 wrap labels for one peptide. We print
              in the US and ship in 5–10 days.
            </p>
            <div className="free-print-order-fields">
              <label className="field">
                Peptide / etch
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
                      mass: "10",
                      unit: "mg",
                      vialMl: kitMl,
                    })
                  )
                }
              >
                <ShoppingCart size={16} /> Add kit ·{" "}
                {formatPrintMoney(PRINT_PRICES.kit)}
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
              src="/printables/previews/free-prints-case-hero.webp"
              alt=""
              width={640}
              height={427}
              loading="eager"
              decoding="async"
            />
          </div>
        </article>

        <div className="free-prints-grid">
          <article className="free-print-card panel">
            <div className="free-print-media">
              <img
                src="/printables/previews/free-prints-caps-hero.webp"
                alt="3D printed etched vial caps with short peptide names"
                width={1200}
                height={675}
                loading="eager"
                decoding="async"
              />
            </div>
            <div className="free-print-copy">
              <h2>10 etched caps · {formatPrintMoney(PRINT_PRICES.caps10)}</h2>
              <p>
                ~13 mm snap flip-caps with short names recessed on top and side.
                We print a pack of 10 in matte black.
              </p>
              <div className="free-print-cap-row" aria-label="Example caps">
                {FEATURED_CAPS.slice(0, 6).map((c) => (
                  <div key={c.short} className="free-print-cap-thumb" title={c.peptide}>
                    <CapThumb short={c.short} />
                    <span>{c.short}</span>
                  </div>
                ))}
              </div>
              <div className="free-print-order-fields">
                <label className="field">
                  Cap etch
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
              <div className="calc-print-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    addLine(
                      printCaps10Line({
                        peptide: selectedCap.peptide,
                        short: selectedCap.short,
                      })
                    )
                  }
                >
                  <ShoppingCart size={16} /> Order 10 ·{" "}
                  {formatPrintMoney(PRINT_PRICES.caps10)}
                </button>
              </div>
              <p className="meta free-prints-diy-label">Or print free</p>
              <div className="calc-print-actions">
                <a
                  className="soft-btn"
                  href={`/printables/undisclosed-cap-${selectedCap.slug === "blank" ? "blank" : selectedCap.slug}.stl`}
                  download={`undisclosed-cap-${selectedCap.slug === "blank" ? "blank" : selectedCap.slug}.stl`}
                >
                  <Download size={16} /> {selectedCap.short} STL free
                </a>
                <a
                  className="soft-btn"
                  href="/printables/undisclosed-cap-plate.stl"
                  download="undisclosed-cap-plate.stl"
                >
                  Full plate STL free
                </a>
              </div>
            </div>
          </article>

          <article className="free-print-card panel">
            <div className="free-print-media">
              <img
                src="/printables/previews/free-prints-case-hero.webp"
                alt="3D printed hinged vial kit case with pockets"
                width={1200}
                height={675}
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
                        mass: "10",
                        unit: "mg",
                        vialMl: kitMl,
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
            <div className="free-print-media">
              <img
                src="/printables/previews/free-prints-labels-hero.webp"
                alt="Printed monochrome vial wrap labels"
                width={1200}
                height={675}
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
            </div>
          </article>
        </div>

        <div className="section-head free-prints-cap-head">
          <div>
            <h2>Cap library</h2>
            <p className="meta">
              Order a pack of 10 for {formatPrintMoney(PRINT_PRICES.caps10)}, or
              download any STL free.
            </p>
          </div>
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
                      addLine(printCaps10Line({ peptide, short }))
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
            <span>Blank</span>
            <div className="free-print-cap-tile-actions">
              <button
                type="button"
                className="soft-btn"
                onClick={() =>
                  addLine(printCaps10Line({ peptide: "Blank", short: "UD" }))
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

        <p className="meta free-prints-footnote">
          Research organization only — not pharmaceutical closures or medical
          devices. Print orders are request-first; we confirm before payment.
        </p>
      </div>
    </section>
  );
}
