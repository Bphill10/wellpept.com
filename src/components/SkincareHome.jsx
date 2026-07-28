import React from "react";
import { ArrowRight, Droplets, FlaskConical, Moon, Sparkles } from "lucide-react";
import { formatMoney } from "../data/products";
import {
  SKINCARE_PRODUCTS,
  SERUM_COMBOS,
  SKINCARE_RITUAL,
} from "../data/skincare";
import ChargebeeCheckout from "./ChargebeeCheckout";

function ProductCard({ product, onOpenProduct, onAddToCart }) {
  return (
    <article className="product-card skin-card" key={product.id}>
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
            Fresh ingredients. You mix at home.
          </p>
          <p className="hero-copy rise-delay">
            WellPept ships separated actives and a clean vehicle — combine when
            you open for serums that stay bright, clear, and clinical.
          </p>
          <div className="hero-cta rise-delay">
            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                document
                  .getElementById("fresh-mixes")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Shop Fresh Mixes
            </button>
            <button type="button" className="soft-btn" onClick={onShopSkin}>
              Ready formulas
            </button>
          </div>
        </div>
      </section>

      <section className="trust-strip skin-trust">
        <div className="container trust-grid">
          <div className="trust-item">
            <FlaskConical size={22} />
            <div>
              <strong>Ships fresh, not pre-mixed</strong>
              <p>Actives stay sealed until you blend them in your bottle.</p>
            </div>
          </div>
          <div className="trust-item">
            <Droplets size={22} />
            <div>
              <strong>Mix in under a minute</strong>
              <p>Ampoule + vehicle + empty dropper. No tools beyond a shake.</p>
            </div>
          </div>
          <div className="trust-item">
            <Sparkles size={22} />
            <div>
              <strong>Clinical cobalt finish</strong>
              <p>White light, chrome caps, and textures that stay quiet.</p>
            </div>
          </div>
          <div className="trust-item">
            <Moon size={22} />
            <div>
              <strong>Use while potent</strong>
              <p>Each kit lists how long the blend stays at its best after mixing.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="fresh-mixes">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Fresh Mix</p>
              <h2>Serum combos you blend at home</h2>
              <p>
                We send the fresh ingredients separately. You combine them when
                you’re ready — maximum potency, minimal shelf wait.
              </p>
            </div>
          </div>
          <div className="product-grid skin-grid">
            {SERUM_COMBOS.map((product) => (
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

      <section className="section section-tight" id="ritual">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">How it works</p>
              <h2>Receive. Mix. Apply.</h2>
              <p>A short sequence — no lab bench required.</p>
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

      <section className="section" id="skin-catalog">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Ready</p>
              <h2>Already-blended essentials</h2>
              <p>Stable formulas for the rest of the ritual — cream, mist, oil.</p>
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

      <section className="section">
        <div className="container skin-about">
          <div>
            <p className="section-kicker">About</p>
            <h2>WellPept skincare</h2>
            <p>
              Fresh Mix kits keep unstable actives sealed until you need them.
              Ready formulas handle the rest — same clinical restraint, white
              light, cobalt signal.
            </p>
            <p className="meta" style={{ marginTop: "1rem" }}>
              Ships to United States addresses only. For external cosmetic use.
            </p>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={() =>
              document
                .getElementById("fresh-mixes")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Browse Fresh Mixes <ArrowRight size={16} />
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
                  Recurring Fresh Mix deliveries — manage billing in the customer
                  portal after checkout.
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
