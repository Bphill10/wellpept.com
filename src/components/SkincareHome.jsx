import React from "react";
import { ArrowRight, Droplets, FlaskConical, Moon, Sparkles } from "lucide-react";
import {
  SKINCARE_PRODUCTS,
  SKINCARE_RITUAL,
  FLAGSHIP_SERUM,
  PEPTIDE_LEGAL,
  PEPTIDES,
  SERUM_BASES,
} from "../data/skincare";
import SerumBuilder from "./SerumBuilder";
import ChargebeeCheckout from "./ChargebeeCheckout";
import { formatMoney } from "../data/products";

function ProductCard({ product, onOpenProduct, onAddToCart }) {
  return (
    <article className="product-card skin-card">
      <button
        type="button"
        className="product-card-main"
        onClick={() => onOpenProduct?.(product)}
      >
        <div className="product-visual skin-visual">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="skin-product-img"
              loading="lazy"
            />
          ) : (
            <div className="skin-bottle" aria-hidden="true">
              <span className="skin-bottle-cap" />
              <span className="skin-bottle-body" />
            </div>
          )}
        </div>
        <div className="product-body">
          <h3>{product.name}</h3>
          <p className="card-blurb">{product.blurb}</p>
          <div className="meta">
            {product.need ? `${product.need}, ` : ""}
            {product.size}
          </div>
          <div className="price-row">
            <strong>{formatMoney(product.price)}</strong>
          </div>
        </div>
      </button>
      <div className="product-actions">
        <button
          type="button"
          className="cart-cta"
          onClick={() => onAddToCart?.(product)}
        >
          Add to bag
        </button>
      </div>
    </article>
  );
}

export default function SkincareHome({
  onShopSkin,
  onOpenProduct,
  onAddToCart,
  chargebeeConfig,
}) {
  return (
    <>
      <section className="hero skin-hero">
        <div className="hero-media skin-hero-media" />
        <div className="container hero-content">
          <div className="hero-brand-lockup rise">
            <img
              src="/wp-monogram.svg"
              alt="WellPept"
              className="hero-brand-mark"
              width={136}
              height={136}
            />
            <h1 className="hero-brand">WellPept</h1>
          </div>
          <div className="hero-brand-rule rise-delay" aria-hidden="true" />
          <p className="hero-tagline rise-delay">
            Four peptides. Serum or cream. Mixed when you are.
          </p>
          <p className="hero-copy rise-delay">
            GHK-Cu is the staple, with Matrixyl 3000, Syn-Ake, and SNAP-8.
            Dry powder in the twist-cap. Dropper beside until you activate.
          </p>
          <div className="hero-cta rise-delay">
            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                document.getElementById("build")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Build your serum
            </button>
            <button
              type="button"
              className="soft-btn"
              onClick={() => onOpenProduct?.(FLAGSHIP_SERUM)}
            >
              Flagship GHK-Cu
            </button>
          </div>
        </div>
      </section>

      <section className="trust-strip skin-trust">
        <div className="container trust-grid">
          <div className="trust-item">
            <FlaskConical size={22} />
            <div>
              <strong>4 peptides, different jobs</strong>
              <p>
                GHK-Cu (staple), Matrixyl 3000, Syn-Ake, and SNAP-8 for firmness,
                matrix support, and expression zones.
              </p>
            </div>
          </div>
          <div className="trust-item">
            <Droplets size={22} />
            <div>
              <strong>2 serums + 1 cream</strong>
              <p>Buffet serum, peptide cream base, or eye serum. Then load peptides.</p>
            </div>
          </div>
          <div className="trust-item">
            <Sparkles size={22} />
            <div>
              <strong>Custom add-ons</strong>
              <p>Optional Eyeseryl, Argireline, or extra GHK-Cu on the same order.</p>
            </div>
          </div>
          <div className="trust-item">
            <Moon size={22} />
            <div>
              <strong>Fresh until you mix</strong>
              <p>Dry chambers and vials. Activate when you’re ready, not months on a shelf.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="fresh-mixes">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Fresh Mix</p>
              <h2>Your peptides. Serum or cream. One mix.</h2>
              <p>
                Choose a Buffet serum, peptide cream, or eye serum, then add any
                combination of our four core topicals, or all four. Optional custom
                peptides ship as extra dry vials on the same order.
              </p>
            </div>
          </div>

          <div className="sk-lineup">
            <div>
              <p className="sk-lineup-label">Peptides</p>
              <ul>
                {PEPTIDES.map((p) => (
                  <li key={p.id}>
                    <strong>{p.name}</strong>
                    <span>{p.need}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="sk-lineup-label">Bases</p>
              <ul>
                {SERUM_BASES.map((b) => (
                  <li key={b.id}>
                    <strong>{b.name}</strong>
                    <span>
                      {b.form === "cream" ? "Cream, " : "Serum, "}
                      {b.volume}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <article className="flagship-mix fade">
            <div className="flagship-mix-media-col">
              <button
                type="button"
                className="flagship-mix-media"
                onClick={() => onOpenProduct?.(FLAGSHIP_SERUM)}
              >
                <img
                  src="/skincare/buffet-serum.png"
                  alt={FLAGSHIP_SERUM.name}
                  className="flagship-mix-img"
                />
              </button>
            </div>
            <div className="flagship-mix-body">
              <p className="section-kicker">Flagship</p>
              <h3>{FLAGSHIP_SERUM.name}</h3>
              <p>{FLAGSHIP_SERUM.blurb}</p>
              <ul className="flagship-mix-points">
                <li>1 g dry GHK-Cu sealed in the twist-cap chamber</li>
                <li>30 mL Buffet-style serum in the bottle</li>
                <li>Dropper ships beside. Seat it after you activate.</li>
                <li>Cosmetic use only. Peptide acknowledgment at checkout.</li>
              </ul>
              <div className="price-row" style={{ margin: "0.85rem 0 1rem" }}>
                <strong>{formatMoney(FLAGSHIP_SERUM.price)}</strong>
                <span className="meta">{FLAGSHIP_SERUM.size}</span>
              </div>
              <div className="hero-cta" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    document.getElementById("build")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Customize this mix
                </button>
                <button
                  type="button"
                  className="soft-btn"
                  onClick={() => onAddToCart?.(FLAGSHIP_SERUM)}
                >
                  Add flagship to bag
                </button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <div className="container">
        <SerumBuilder onAdd={onAddToCart} onOpenProduct={onOpenProduct} />
      </div>

      <section className="section section-tight" id="ritual">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">How it works</p>
              <h2>Pick. Mix. Activate.</h2>
              <p>
                One vehicle (serum or cream), up to four peptides, optional customs.
                Activate when you’re ready.
              </p>
            </div>
          </div>
          <div className="skin-ritual-grid">
            {SKINCARE_RITUAL.map((item) => (
              <div className="skin-ritual-step" key={item.step}>
                <span className="skin-ritual-num">{item.step}</span>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </div>
            ))}
          </div>
          <div className="sk-mix-demo">
            <div className="sk-mix-demo-stills">
              <figure>
                <img src="/skincare/buffet-serum.png" alt="Before: dry powder in the twist-cap" />
                <figcaption>Before</figcaption>
              </figure>
              <figure>
                <img
                  src="/skincare/buffet-serum-mixed.png"
                  alt="After: powder mixed into the serum"
                />
                <figcaption>After</figcaption>
              </figure>
            </div>
            <video
              className="sk-mix-demo-video"
              controls
              muted
              playsInline
              loop
              preload="metadata"
              poster="/skincare/buffet-serum-mixing.png"
            >
              <source src="/skincare/mix-activation.mp4" type="video/mp4" />
            </video>
          </div>
        </div>
      </section>

      <section className="section" id="skin-catalog">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Ready</p>
              <h2>Already-blended essentials</h2>
              <p>Stable formulas for the rest of the ritual: cream, mist, and oil.</p>
            </div>
          </div>
          <div className="product-grid skin-grid">
            {SKINCARE_PRODUCTS.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenProduct={onOpenProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="peptide-legal">
        <div className="container sk-legal-page">
          <p className="section-kicker">Important</p>
          <h2>Peptide product notices</h2>
          <p className="sk-legal-lead">{PEPTIDE_LEGAL.medium}</p>
          <ul className="sk-legal-long">
            {PEPTIDE_LEGAL.long.map((line) => (
              <li key={line.slice(0, 24)}>{line}</li>
            ))}
          </ul>
          <p className="meta">{PEPTIDE_LEGAL.short}</p>
        </div>
      </section>

      <section className="section">
        <div className="container skin-about">
          <div>
            <p className="section-kicker">About</p>
            <h2>WellPept skincare</h2>
            <p>
              Fresh Mix keeps topical peptides dry until you activate them into your chosen
              base. Ready formulas handle the rest with restrained textures, white light,
              and a cobalt signal.
            </p>
            <p className="meta" style={{ marginTop: "1rem" }}>
              Ships to United States addresses only. For external cosmetic use. Not for
              injection or medical use.
            </p>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={() =>
              document.getElementById("build")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Build a serum <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {chargebeeConfig?.enabled && chargebeeConfig?.skincarePlanPriceId && (
        <section className="section section-tight" id="subscribe">
          <div className="container">
            <div className="section-head">
              <div>
                <p className="section-kicker">Membership</p>
                <h2>Subscribe to the ritual</h2>
                <p>
                  Recurring Fresh Mix deliveries. Manage billing in the customer portal
                  after checkout.
                </p>
              </div>
            </div>
            <ChargebeeCheckout
              config={chargebeeConfig}
              mode="subscription"
              total={0}
              buttonLabel="Subscribe with Chargebee"
              onPaid={() => {}}
            />
          </div>
        </section>
      )}
    </>
  );
}
