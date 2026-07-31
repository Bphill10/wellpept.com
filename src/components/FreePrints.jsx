import React, { useMemo, useState } from "react";
import { Download, ArrowLeft, Printer, ShoppingCart } from "lucide-react";
import { CAP_SHORT_NAMES, capStlSlug } from "../data/capNames";
import {
  PRINT_CAP_OPTIONS,
  PRINT_PRICES,
  formatPrintMoney,
  printCapLine,
  printCaseLine,
  printLabelsLine,
  printCapsLabelsBundleLine,
  printFullKitLine,
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
  const [capQty, setCapQty] = useState(10);
  const [labelKey, setLabelKey] = useState(PRINT_CAP_OPTIONS[0]?.slug || "reta");
  const [labelMl, setLabelMl] = useState(3);
  const [labelMass, setLabelMass] = useState("10");
  const [bundleKey, setBundleKey] = useState(PRINT_CAP_OPTIONS[0]?.slug || "reta");
  const [bundleMl, setBundleMl] = useState(3);

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
  const selectedBundle = useMemo(
    () =>
      PRINT_CAP_OPTIONS.find((o) => o.slug === bundleKey) || PRINT_CAP_OPTIONS[0],
    [bundleKey]
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
          <h1>We print for you — or DIY free</h1>
          <p>
            Order etched caps, the kit case, and vial labels and we’ll print and
            ship them with your research order. Prefer to print yourself? STL
            files and label downloads stay free.
          </p>
          <p className="meta free-prints-price-line">
            Caps {formatPrintMoney(PRINT_PRICES.capEach)} ea · pack of 10{" "}
            {formatPrintMoney(PRINT_PRICES.capPack10)} · case{" "}
            {formatPrintMoney(PRINT_PRICES.case)} · 10 labels{" "}
            {formatPrintMoney(PRINT_PRICES.labels10)} · caps+labels{" "}
            {formatPrintMoney(PRINT_PRICES.capsLabelsBundle)} · full kit{" "}
            {formatPrintMoney(PRINT_PRICES.fullKit)}. Print shipping{" "}
            {formatPrintMoney(8)} (free with Warehouse A peptides).
          </p>
        </div>

        <article className="free-print-order-banner panel">
          <div className="free-print-order-banner-copy">
            <h2>Order a full print kit</h2>
            <p>
              Case + 10 etched caps + 10 wrap labels for one peptide. We print
              in the US and ship in 5–10 days.
            </p>
            <div className="free-print-order-fields">
              <label className="field">
                Peptide / etch
                <select
                  value={bundleKey}
                  onChange={(e) => setBundleKey(e.target.value)}
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
                  value={bundleMl}
                  onChange={(e) => setBundleMl(Number(e.target.value))}
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
                    printFullKitLine({
                      peptide: selectedBundle.peptide,
                      mass: "10",
                      unit: "mg",
                      vialMl: bundleMl,
                    })
                  )
                }
              >
                <ShoppingCart size={16} /> Add full kit ·{" "}
                {formatPrintMoney(PRINT_PRICES.fullKit)}
              </button>
              <button
                type="button"
                className="soft-btn"
                onClick={() =>
                  addLine(
                    printCapsLabelsBundleLine({
                      peptide: selectedBundle.peptide,
                      mass: "10",
                      unit: "mg",
                      vialMl: bundleMl,
                    })
                  )
                }
              >
                Caps + labels only · {formatPrintMoney(PRINT_PRICES.capsLabelsBundle)}
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
              <h2>Etched vial caps</h2>
              <p>
                ~13 mm snap flip-caps with short names recessed on top and side.
                We print in matte black; etch reads from shadows.
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
                <label className="field">
                  Qty
                  <select
                    value={capQty}
                    onChange={(e) => setCapQty(Number(e.target.value))}
                  >
                    {[1, 2, 5, 10, 20, 30].map((n) => (
                      <option key={n} value={n}>
                        {n}
                        {n === 10 ? " (pack price)" : ""}
                        {n > 10 && n % 10 === 0 ? " (pack price)" : ""}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="calc-print-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    const { line, qty } = printCapLine({
                      peptide: selectedCap.peptide,
                      short: selectedCap.short,
                      qty: capQty,
                    });
                    addLine(line, qty);
                  }}
                >
                  <ShoppingCart size={16} /> Order printed ·{" "}
                  {capQty >= 10 && capQty % 10 === 0
                    ? formatPrintMoney(PRINT_PRICES.capPack10 * (capQty / 10))
                    : formatPrintMoney(PRINT_PRICES.capEach * capQty)}
                </button>
              </div>
              <p className="meta free-prints-diy-label">DIY free downloads</p>
              <div className="calc-print-actions">
                <a
                  className="soft-btn"
                  href={`/printables/undisclosed-cap-${selectedCap.slug === "blank" ? "blank" : selectedCap.slug}.stl`}
                  download={`undisclosed-cap-${selectedCap.slug === "blank" ? "blank" : selectedCap.slug}.stl`}
                >
                  <Download size={16} /> {selectedCap.short} STL
                </a>
                <a
                  className="soft-btn"
                  href="/printables/undisclosed-cap-plate.stl"
                  download="undisclosed-cap-plate.stl"
                >
                  Full plate STL
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
              <h2>10-vial kit case</h2>
              <p>
                Hinged case — 2×5 vial pockets, spare-cap trough, pin hinge.
                We print and ship assembled parts (base, lid, pin).
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
                  onClick={() => addLine(printCaseLine())}
                >
                  <ShoppingCart size={16} /> Order printed ·{" "}
                  {formatPrintMoney(PRINT_PRICES.case)}
                </button>
              </div>
              <p className="meta free-prints-diy-label">DIY free downloads</p>
              <div className="calc-print-actions">
                <a
                  className="soft-btn"
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
              <h2>Vial wrap labels</h2>
              <p>
                Black-on-white clinical wraps. Tell us peptide, strength, and
                bottle size — we print a set of 10. Or generate your own in the
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
                      printLabelsLine({
                        peptide: selectedLabel.peptide,
                        mass: labelMass || "10",
                        unit: "mg",
                        vialMl: labelMl,
                      })
                    )
                  }
                >
                  <ShoppingCart size={16} /> Order 10 labels ·{" "}
                  {formatPrintMoney(PRINT_PRICES.labels10)}
                </button>
                {onOpenCalculator ? (
                  <button type="button" className="soft-btn" onClick={onOpenCalculator}>
                    <Download size={16} /> DIY in calculator
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
              Order a printed cap or download the free STL for each etch.
            </p>
          </div>
        </div>

        <div className="free-prints-cap-grid">
          {CAP_GALLERY.map(({ peptide, short }) => {
            const slug = capStlSlug(peptide);
            return (
              <div key={`${short}-${peptide}`} className="free-print-cap-tile free-print-cap-tile--order">
                <CapThumb short={short} />
                <strong>{short}</strong>
                <span>{peptide}</span>
                <div className="free-print-cap-tile-actions">
                  <button
                    type="button"
                    className="soft-btn"
                    onClick={() => {
                      const { line, qty } = printCapLine({
                        peptide,
                        short,
                        qty: 1,
                      });
                      addLine(line, qty);
                    }}
                  >
                    Order
                  </button>
                  <a
                    href={`/printables/undisclosed-cap-${slug}.stl`}
                    download={`undisclosed-cap-${slug}.stl`}
                    title={`Download ${short} STL`}
                  >
                    STL
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
                onClick={() => {
                  const { line, qty } = printCapLine({
                    peptide: "Blank",
                    short: "UD",
                    qty: 1,
                  });
                  addLine(line, qty);
                }}
              >
                Order
              </button>
              <a
                href="/printables/undisclosed-cap-blank.stl"
                download="undisclosed-cap-blank.stl"
              >
                STL
              </a>
            </div>
          </div>
        </div>

        <p className="meta free-prints-footnote">
          Research organization only — not pharmaceutical closures or medical
          devices. Print orders are request-first like the catalog; we confirm
          before payment.
        </p>
      </div>
    </section>
  );
}
