import React from "react";
import { ArrowRight, Droplets, Moon, Sparkles, Sun } from "lucide-react";
import { formatMoney } from "../data/products";
import { SKINCARE_PRODUCTS, SKINCARE_RITUAL } from "../data/skincare";

export default function SkincareHome({
  onShopSkin,
  onOpenProduct,
  onAddToCart,
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
          <p className="hero-tagline rise-delay">Clinical skincare, quietly made.</p>
          <p className="hero-copy rise-delay">
            WellPept is a skincare atelier — precise textures, restrained formulas,
            and a finish that never announces itself.
          </p>
          <div className="hero-cta rise-delay">
            <button type="button" className="primary-btn" onClick={onShopSkin}>
              Shop skincare
            </button>
            <button
              type="button"
              className="soft-btn"
              onClick={() =>
                document
                  .getElementById("ritual")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              The ritual
            </button>
          </div>
        </div>
      </section>

      <section className="trust-strip skin-trust">
        <div className="container trust-grid">
          <div className="trust-item">
            <Sparkles size={22} />
            <div>
              <strong>Restrained formulas</strong>
              <p>No fragrance theater. Just what the skin needs to look settled.</p>
            </div>
          </div>
          <div className="trust-item">
            <Droplets size={22} />
            <div>
              <strong>Texture-first</strong>
              <p>Serums, creams, and oils built for a soft matte or quiet glow.</p>
            </div>
          </div>
          <div className="trust-item">
            <Sun size={22} />
            <div>
              <strong>Day to night</strong>
              <p>A short ritual that holds from first light through late hours.</p>
            </div>
          </div>
          <div className="trust-item">
            <Moon size={22} />
            <div>
              <strong>Atelier finish</strong>
              <p>Clinical discipline with a private, black-and-gold presentation.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="skin-catalog">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Collection</p>
              <h2>Skincare essentials</h2>
              <p>Six quiet pieces. Enough for a complete face ritual.</p>
            </div>
          </div>
          <div className="product-grid skin-grid">
            {SKINCARE_PRODUCTS.map((product) => (
              <article className="product-card skin-card" key={product.id}>
                <button
                  type="button"
                  className="product-card-main"
                  onClick={() => onOpenProduct?.(product)}
                >
                  <div className="product-visual skin-visual">
                    <div className="skin-bottle" aria-hidden="true">
                      <span className="skin-bottle-cap" />
                      <span className="skin-bottle-body" />
                    </div>
                    <span className="badge">{product.line}</span>
                  </div>
                  <div className="product-body">
                    <h3>{product.name}</h3>
                    <p className="card-blurb">{product.blurb}</p>
                    <div className="meta">
                      {product.size} · {product.focus}
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
            ))}
          </div>
        </div>
      </section>

      <section className="section section-tight" id="ritual">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Ritual</p>
              <h2>Three steps. No noise.</h2>
              <p>A short sequence designed to feel inevitable, not complicated.</p>
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
        </div>
      </section>

      <section className="section">
        <div className="container skin-about">
          <div>
            <p className="section-kicker">About</p>
            <h2>WellPept skincare</h2>
            <p>
              We design for people who want clinical restraint — black, white, a
              little gold, and formulas that earn their place on the shelf.
            </p>
            <p className="meta" style={{ marginTop: "1rem" }}>
              Ships to United States addresses only.
            </p>
          </div>
          <button type="button" className="primary-btn" onClick={onShopSkin}>
            Browse the collection <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </>
  );
}
