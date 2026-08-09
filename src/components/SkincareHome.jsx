import React, { useMemo, useState } from "react";
import { ArrowRight, Droplets, FlaskConical, Moon, Sparkles } from "lucide-react";
import {
  SKINCARE_PRODUCTS,
  RENEW_ACCESSORIES,
  SKINCARE_RITUAL,
  FLAGSHIP_SERUM,
  PEPTIDE_LEGAL,
  PEPTIDES,
  SERUM_BASES,
} from "../data/skincare";
import {
  ACCESSORY_SHIP_OPTIONS,
  normalizeShipModes,
} from "../data/accessoryMarketplace";
import SerumBuilder from "./SerumBuilder";
import { formatMoney } from "../data/products";

function ProductCard({ product, onOpenProduct, onAddToCart, priority = false }) {
  const modes = normalizeShipModes(product.shipModes);
  const isAccessory =
    product.kind === "tool" ||
    product.kind === "mini" ||
    product.kind === "kit" ||
    product.accessory ||
    product.marketplace;
  const [shipMode, setShipMode] = useState(modes[0] || "economy");

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
              alt={product.alt || product.name}
              className={`skin-product-img${
                product.imageContain ? " skin-product-img--contain" : ""
              }`}
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : "auto"}
              decoding="async"
            />
          ) : (
            <div className="skin-bottle" aria-hidden="true">
              <span className="skin-bottle-cap" />
              <span className="skin-bottle-body" />
            </div>
          )}
        </div>
        <div className="product-body">
          {product.line ? (
            <p className="meta" style={{ marginBottom: "0.25rem" }}>
              {product.line}
              {product.marketplace ? " · Partner" : ""}
            </p>
          ) : null}
          <h3>{product.name}</h3>
          <p className="card-blurb">{product.blurb}</p>
          <div className="meta">
            {product.need ? `${product.need}, ` : ""}
            {product.focus && product.kind !== "ready" && product.kind !== "mix"
              ? `${product.focus} · `
              : ""}
            {product.size}
          </div>
          <div className="price-row">
            <strong>{formatMoney(product.price)}</strong>
          </div>
        </div>
      </button>
      <div className="product-actions">
        {isAccessory && modes.length > 0 ? (
          <div className="meta" style={{ marginBottom: "0.5rem", width: "100%" }}>
            {modes.map((id) => {
              const opt = ACCESSORY_SHIP_OPTIONS[id];
              if (!opt) return null;
              return (
                <label
                  key={id}
                  className="consent-check"
                  style={{ marginBottom: "0.25rem" }}
                >
                  <input
                    type="radio"
                    name={`ship-${product.id}`}
                    checked={shipMode === id}
                    onChange={() => setShipMode(id)}
                  />
                  <span>
                    {opt.label} · {opt.delivery}
                    {opt.shippingFlat > 0
                      ? ` · +${formatMoney(opt.shippingFlat)} ship`
                      : " · free ship"}
                  </span>
                </label>
              );
            })}
          </div>
        ) : null}
        <button
          type="button"
          className="cart-cta"
          onClick={() =>
            onAddToCart?.(isAccessory ? { ...product, shipMode } : product)
          }
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
  onSell,
  marketplaceListings = [],
}) {
  const accessoryCatalog = useMemo(
    () => [...RENEW_ACCESSORIES, ...(marketplaceListings || [])],
    [marketplaceListings]
  );

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
              fetchPriority="high"
              decoding="async"
            />
            <h1 className="hero-brand">WellPept</h1>
          </div>
          <div className="hero-brand-rule rise-delay" aria-hidden="true" />
          <p className="hero-tagline rise-delay">
            Fresh-mix skincare for the way you renew.
          </p>
          <p className="hero-copy rise-delay">
            Copper, matrix, and expression-line actives, sealed until you
            activate them at home.
          </p>
          <div className="hero-cta rise-delay">
            <button
              type="button"
              className="primary-btn"
              onClick={() =>
                document.getElementById("build")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Build your formula
            </button>
            <button
              type="button"
              className="soft-btn"
              onClick={() =>
                document.getElementById("flagship")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Shop flagship serum
            </button>
          </div>
        </div>
      </section>

      <section className="trust-strip skin-trust">
        <div className="container trust-grid">
          <div className="trust-item">
            <FlaskConical size={22} />
            <div>
              <strong>Four actives, clear jobs</strong>
              <p>
                Copper for firmness and glow, Matrixyl for support, plus
                expression-line care for Syn-Ake and SNAP-8 zones.
              </p>
            </div>
          </div>
          <div className="trust-item">
            <Droplets size={22} />
            <div>
              <strong>Serum or cream bases</strong>
              <p>Face serum, moisture cream, or eye serum. Then add the actives you want.</p>
            </div>
          </div>
          <div className="trust-item">
            <Sparkles size={22} />
            <div>
              <strong>Optional add-ons</strong>
              <p>Under-eye and expression-line boosters available on the same order.</p>
            </div>
          </div>
          <div className="trust-item">
            <Moon size={22} />
            <div>
              <strong>Request first, pay later</strong>
              <p>
                We confirm supply, then email payment within 24 hours. Allow up to
                2-3 weeks for delivery.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="renew">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Renew</p>
              <h2>Your anti-aging formula, built to order.</h2>
              <p>
                Choose a serum or cream base, then add the renewal actives that
                match your goals. Optional boosters ship with the same order.
              </p>
            </div>
          </div>

          <div className="sk-lineup">
            <div>
              <p className="sk-lineup-label">Actives</p>
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

          <article className="flagship-mix fade" id="flagship">
            <div className="flagship-mix-media-col">
              <button
                type="button"
                className="flagship-mix-media"
                onClick={() => onOpenProduct?.(FLAGSHIP_SERUM)}
                aria-label={`View ${FLAGSHIP_SERUM.name}`}
              >
                <img
                  src="/skincare/core-peptide-bottle-family.webp"
                  alt="WellPept classic serum bottles for GHK-Cu, Matrixyl 3000, Syn-Ake, and SNAP-8"
                  className="flagship-mix-img"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </button>
            </div>
            <div className="flagship-mix-body">
              <p className="section-kicker">Flagship</p>
              <h3>{FLAGSHIP_SERUM.name}</h3>
              <p>{FLAGSHIP_SERUM.blurb}</p>
              <ul className="flagship-mix-points">
                <li>Fresh copper active sealed until you twist to activate</li>
                <li>30 mL Renew face serum in the bottle</li>
                <li>Dropper ships beside the bottle. Seat it after activation</li>
                <li>For external cosmetic use on intact skin only</li>
                <li>Request first. Pay only after we confirm supply (within 24 hours)</li>
                <li>Allow 2-3 weeks after payment for delivery</li>
              </ul>
              <div className="price-row" style={{ margin: "0.85rem 0 1rem" }}>
                <strong>{formatMoney(FLAGSHIP_SERUM.price)}</strong>
                <span className="meta">{FLAGSHIP_SERUM.size}</span>
              </div>
              <div className="hero-cta" style={{ marginTop: 0 }}>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => onOpenProduct?.(FLAGSHIP_SERUM)}
                >
                  View flagship
                </button>
                <button
                  type="button"
                  className="soft-btn"
                  onClick={() => onAddToCart?.(FLAGSHIP_SERUM)}
                >
                  Add flagship to bag
                </button>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() =>
                    document.getElementById("build")?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Customize this mix
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
                Choose a serum or cream base, add up to four actives, then
                activate when you’re ready.
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
                <img
                  src="/skincare/buffet-serum.webp"
                  alt="Before: dry powder in the twist-cap"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption>Before</figcaption>
              </figure>
              <figure>
                <img
                  src="/skincare/buffet-serum-mixed.webp"
                  alt="After: powder mixed into the serum"
                  loading="lazy"
                  decoding="async"
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
              poster="/skincare/buffet-serum-mixing.webp"
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
            {SKINCARE_PRODUCTS.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenProduct={onOpenProduct}
                onAddToCart={onAddToCart}
                priority={index < 2}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="accessories">
        <div className="container">
          <div className="section-head">
            <div>
              <p className="section-kicker">Accessories</p>
              <h2>Tools and travel minis</h2>
              <p>
                Low-cost add-ons and partner listings. Pick Economy (China ·
                2–4 weeks) or Fast (US · 2–5 days) on each card.
              </p>
            </div>
            {onSell ? (
              <button type="button" className="soft-btn" onClick={onSell}>
                Sell on WellPept
              </button>
            ) : null}
          </div>
          <div className="product-grid skin-grid">
            {accessoryCatalog.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpenProduct={onOpenProduct}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
          {onSell ? (
            <p className="meta" style={{ marginTop: "1rem" }}>
              Vendor?{" "}
              <button
                type="button"
                className="footer-chat-btn"
                onClick={onSell}
              >
                Apply to list accessories
              </button>
            </p>
          ) : null}
        </div>
      </section>

      <section className="section" id="peptide-legal">
        <div className="container sk-legal-page">
          <p className="section-kicker">Important</p>
          <h2>Product notices</h2>
          <p className="sk-legal-lead">{PEPTIDE_LEGAL.medium}</p>
          <ul className="sk-legal-long">
            {PEPTIDE_LEGAL.long.map((line) => (
              <li key={line.slice(0, 24)}>{line}</li>
            ))}
          </ul>
          <p className="meta">{PEPTIDE_LEGAL.short}</p>
        </div>
      </section>

      <section className="section" id="contact-wellpept">
        <div className="container skin-about">
          <div>
            <p className="section-kicker">Contact</p>
            <h2>Talk with WellPept</h2>
            <p>
              Email{" "}
              <a className="sk-contact-link" href="mailto:info@wellpept.com">
                info@wellpept.com
              </a>
              . Or use the chat bubble to message us live. Replies come from our
              phone.
            </p>
            <p className="meta" style={{ marginTop: "1rem" }}>
              Ships to United States addresses only. External cosmetic use on
              intact skin. Not a drug and not for medical use.
            </p>
          </div>
          <div className="skin-about-actions">
            <a className="primary-btn" href="mailto:info@wellpept.com">
              Email info@wellpept.com
            </a>
            <button
              type="button"
              className="soft-btn"
              onClick={() => {
                if (typeof window !== "undefined" && window.$crisp) {
                  try {
                    window.$crisp.push(["do", "chat:open"]);
                    return;
                  } catch {
                    /* fall through */
                  }
                }
                window.location.href = "mailto:info@wellpept.com?subject=WellPept%20question";
              }}
            >
              Open chat
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container skin-about">
          <div>
            <p className="section-kicker">About</p>
            <h2>WellPept skincare</h2>
            <p>
              Actives stay sealed until you mix them into serum or cream.
              Ready formulas finish the ritual with clean texture and quiet
              shine.
            </p>
          </div>
          <button
            type="button"
            className="primary-btn"
            onClick={() =>
              document.getElementById("build")?.scrollIntoView({ behavior: "smooth" })
            }
          >
            Build a formula <ArrowRight size={16} />
          </button>
        </div>
      </section>
    </>
  );
}
