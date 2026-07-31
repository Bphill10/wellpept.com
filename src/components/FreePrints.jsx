import React from "react";
import { Download, ArrowLeft, Printer } from "lucide-react";
import { CAP_SHORT_NAMES, capStlSlug } from "../data/capNames";

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
    // Dedupe by short etch (Epithalon/Epitalon, TA-1/Thymosin)
    const short = CAP_SHORT_NAMES[name];
    return arr.findIndex(([, s]) => s === short) === i;
  })
  .map(([peptide, short]) => ({ peptide, short }));

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

export default function FreePrints({ onBack, onOpenCalculator }) {
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
          <h1>Print your own lab kit</h1>
          <p>
            Free STL files and vial labels for Undisclosed research vials —
            etched flip-caps, hinged kit case, and clinical wrap labels. No
            paywall. Print at home or at a local shop.
          </p>
        </div>

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
                Single-color print — the etch reads from shadows. Print top-up,
                0.2 mm layers, no supports.
              </p>
              <div className="free-print-cap-row" aria-label="Example caps">
                {FEATURED_CAPS.slice(0, 6).map((c) => (
                  <div key={c.short} className="free-print-cap-thumb" title={c.peptide}>
                    <CapThumb short={c.short} />
                    <span>{c.short}</span>
                  </div>
                ))}
              </div>
              <div className="calc-print-actions">
                <a
                  className="primary-btn"
                  href="/printables/undisclosed-cap-plate.stl"
                  download="undisclosed-cap-plate.stl"
                >
                  <Download size={16} /> Full cap plate STL
                </a>
                <a
                  className="soft-btn"
                  href="/printables/undisclosed-cap-blank.stl"
                  download="undisclosed-cap-blank.stl"
                >
                  Blank UD
                </a>
                {onOpenCalculator ? (
                  <button type="button" className="soft-btn" onClick={onOpenCalculator}>
                    Cap for your peptide
                  </button>
                ) : null}
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
                Hinged case for the kit photo layout — 2×5 vial pockets, spare-cap
                trough, pin hinge. ~141 × 50 mm. PETG or PLA, no supports.
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
                Black-on-white clinical wraps sized for 3 / 5 / 10 / 30 mL
                bottles. Rounded die-cut, QR to wellpept.com, filled from the
                calculator. Single-color printer friendly.
              </p>
              <div className="free-print-inline-thumb">
                <img
                  src="/printables/previews/labels-thumb.svg"
                  alt=""
                  width={320}
                  height={200}
                  loading="lazy"
                  aria-hidden="true"
                />
              </div>
              <div className="calc-print-actions">
                {onOpenCalculator ? (
                  <button type="button" className="primary-btn" onClick={onOpenCalculator}>
                    <Download size={16} /> Make a label in calculator
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
              Download one STL per short etch. Custom names: open the calculator
              and pick Custom.
            </p>
          </div>
        </div>

        <div className="free-prints-cap-grid">
          {CAP_GALLERY.map(({ peptide, short }) => {
            const slug = capStlSlug(short === "UD" ? "UD" : peptide);
            return (
              <a
                key={`${short}-${peptide}`}
                className="free-print-cap-tile"
                href={`/printables/undisclosed-cap-${slug}.stl`}
                download={`undisclosed-cap-${slug}.stl`}
                title={`Download ${short} cap STL`}
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
            title="Download blank UD cap STL"
          >
            <CapThumb short="UD" />
            <strong>UD</strong>
            <span>Blank</span>
          </a>
        </div>

        <p className="meta free-prints-footnote">
          Research organization only — not pharmaceutical closures or medical
          devices. Verify fit on your vials before batch printing.
        </p>
      </div>
    </section>
  );
}
