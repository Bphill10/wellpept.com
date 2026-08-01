import React, { useState } from "react";
import {
  ACCESSORY_SHIP_OPTIONS,
  normalizeShipModes,
} from "../data/accessoryMarketplace";
import { formatMoney } from "../data/products";

function PartnerCard({ product, onAddToCart }) {
  const modes = normalizeShipModes(product.shipModes);
  const [shipMode, setShipMode] = useState(modes[0] || "economy");

  return (
    <article className="product-card skin-card">
      <div className="product-card-main" style={{ cursor: "default" }}>
        <div className="product-visual skin-visual">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="skin-product-img"
              loading="lazy"
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
              {product.line} · Partner
            </p>
          ) : null}
          <h3>{product.name}</h3>
          <p className="card-blurb">{product.blurb}</p>
          <div className="meta">{product.size}</div>
          <div className="price-row">
            <strong>{formatMoney(product.price)}</strong>
          </div>
        </div>
      </div>
      <div className="product-actions">
        {modes.length > 0 ? (
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
                    name={`ship-ud-${product.id}`}
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
          className="primary-btn"
          onClick={() => onAddToCart?.({ ...product, shipMode })}
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}

/**
 * Undisclosed partner marketplace strip (approved channel listings).
 */
export default function PartnerMarketplaceSection({
  listings = [],
  onAddToCart,
  onSell,
}) {
  return (
    <section className="section" id="partner-listings">
      <div className="container">
        <div className="section-head">
          <div>
            <p className="section-kicker">Partners</p>
            <h2>Partner listings</h2>
            <p>
              Tools and research supplies from approved partners. Economy
              (China · 2–4 weeks) or Fast (US · 2–5 days). Research use only.
            </p>
          </div>
          {onSell ? (
            <button type="button" className="soft-btn" onClick={onSell}>
              Sell on Undisclosed
            </button>
          ) : null}
        </div>
        {listings.length === 0 ? (
          <div className="empty-state">
            No partner listings yet.{" "}
            {onSell ? (
              <button type="button" className="linkish" onClick={onSell}>
                Apply to sell
              </button>
            ) : null}
          </div>
        ) : (
          <div className="product-grid skin-grid">
            {listings.map((product) => (
              <PartnerCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
