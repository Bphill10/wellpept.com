import React, { useMemo, useState } from "react";
import { Scale } from "lucide-react";
import {
  formatMoney,
  formatStrengthLabel,
  strengthKey,
} from "../data/products";

/**
 * Vendor / strength price compare table.
 * scope: "strength" = same mg/pack/vial as selected offer; "all" = whole listing.
 */
export default function PriceCompare({
  listing,
  product,
  onSelect,
  defaultOpen = false,
  defaultScope = "all",
  compact = false,
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [scope, setScope] = useState(defaultScope);

  const currentKey = product ? strengthKey(product) : null;
  const allOffers = listing?.variants || [];

  const rows = useMemo(() => {
    const list =
      scope === "strength" && currentKey
        ? allOffers.filter((o) => strengthKey(o) === currentKey)
        : allOffers;
    return [...list].sort((a, b) => {
      const pa = a.price == null ? Number.POSITIVE_INFINITY : Number(a.price);
      const pb = b.price == null ? Number.POSITIVE_INFINITY : Number(b.price);
      if (pa !== pb) return pa - pb;
      const mg = (Number(a.mg) || 0) - (Number(b.mg) || 0);
      if (mg !== 0) return mg;
      return String(a.vendor || "").localeCompare(String(b.vendor || ""));
    });
  }, [allOffers, scope, currentKey]);

  const vendorCount = new Set(allOffers.map((o) => o.vendorId)).size;
  const canCompare = allOffers.length > 1;
  if (!canCompare) return null;

  const bestId = rows.find((o) => o.price != null)?.id;

  return (
    <div className={`price-compare ${compact ? "price-compare--compact" : ""}`}>
      <div className="price-compare-head">
        <button
          type="button"
          className="soft-btn price-compare-toggle"
          onClick={(e) => {
            e.stopPropagation();
            setOpen((v) => !v);
          }}
        >
          <Scale size={15} />
          {open ? "Hide compare" : "Compare prices"}
          <span className="price-compare-count">
            {allOffers.length} options
            {vendorCount > 1 ? ` · ${vendorCount} vendors` : ""}
          </span>
        </button>
      </div>

      {open && (
        <div
          className="price-compare-body"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="price-compare-scopes" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={scope === "all"}
              className={scope === "all" ? "is-active" : ""}
              onClick={() => setScope("all")}
            >
              All options
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={scope === "strength"}
              className={scope === "strength" ? "is-active" : ""}
              onClick={() => setScope("strength")}
            >
              This strength
            </button>
          </div>

          <div className="compare-panel">
            <table className="compare-table">
              <thead>
                <tr>
                  <th>Strength</th>
                  <th>Vendor</th>
                  <th>Price</th>
                  {!compact && <th>Ship</th>}
                  {!compact && <th>Min</th>}
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map((o) => {
                  const selected = product && o.id === product.id;
                  const isBest = o.id === bestId;
                  return (
                    <tr key={o.id} className={selected ? "is-selected" : ""}>
                      <td>{formatStrengthLabel(o)}</td>
                      <td>
                        {o.vendor}
                        {o.featured ? (
                          <span className="best-price-tag">Featured</span>
                        ) : null}
                        {isBest ? (
                          <span className="best-price-tag">Best</span>
                        ) : null}
                      </td>
                      <td>
                        {o.price == null ? "—" : formatMoney(o.price)}
                      </td>
                      {!compact && (
                        <td>
                          {formatMoney(o.shippingFlat || 0)}
                          {o.shippingNote ? (
                            <div className="compare-note">{o.shippingNote}</div>
                          ) : null}
                        </td>
                      )}
                      {!compact && (
                        <td>{formatMoney(o.minOrder || 0)}</td>
                      )}
                      <td>
                        <button
                          type="button"
                          className="soft-btn compare-select"
                          onClick={() => onSelect?.(o.id)}
                        >
                          {selected ? "Selected" : "Select"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
