import React, { useState } from "react";
import { ArrowLeft } from "lucide-react";
import {
  ACCESSORY_SHIP_OPTIONS,
  MARKET_CHANNELS,
} from "../data/accessoryMarketplace";
import { siteLegal } from "../data/siteLegal";

/**
 * Public sell application — list on WellPept Renew and/or Undisclosed.
 */
export default function SellOnWellpept({
  onBack,
  onSubmit,
  labMode = false,
}) {
  const legal = siteLegal(labMode);
  const [form, setForm] = useState({
    name: "",
    email: "",
    company: "",
    notes: "",
    channelWellpept: !labMode,
    channelUndisclosed: labMode,
    productName: "",
    productPrice: "",
    productSize: "",
    productBlurb: "",
    productImage: "",
    productKind: labMode ? "research" : "tool",
    shipEconomy: true,
    shipFast: false,
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  function patch(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setMsg("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg("");
    try {
      const channels = [];
      if (form.channelWellpept) channels.push("wellpept");
      if (form.channelUndisclosed) channels.push("undisclosed");
      if (!channels.length) {
        setMsg("Pick at least one site: WellPept Renew and/or Undisclosed.");
        setBusy(false);
        return;
      }
      const shipModes = [];
      if (form.shipEconomy) shipModes.push("economy");
      if (form.shipFast) shipModes.push("fast");
      if (!shipModes.length) {
        setMsg("Pick at least one ship option (Economy and/or Fast).");
        setBusy(false);
        return;
      }
      if (
        form.productKind === "research" &&
        !channels.includes("undisclosed")
      ) {
        setMsg("Research listings require the Undisclosed site.");
        setBusy(false);
        return;
      }
      if (
        (form.productKind === "tool" || form.productKind === "mini") &&
        channels.length === 1 &&
        channels[0] === "undisclosed" &&
        form.productKind === "mini"
      ) {
        // minis ok on undisclosed as partner tools too
      }

      const product =
        form.productName.trim() && Number(form.productPrice) > 0
          ? {
              name: form.productName.trim(),
              price: Number(form.productPrice),
              size: form.productSize.trim(),
              blurb: form.productBlurb.trim(),
              image: form.productImage.trim(),
              kind: form.productKind,
              shipModes,
            }
          : null;

      const result = await onSubmit?.({
        name: form.name.trim(),
        email: form.email.trim(),
        company: form.company.trim(),
        notes: form.notes.trim(),
        channels,
        product,
      });
      if (result?.ok === false) {
        setMsg(result.error || "Could not submit application.");
        return;
      }
      setDone(true);
    } catch (err) {
      setMsg(err?.message || "Could not submit application.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel-page fade">
      <div className="container">
        <button type="button" className="ghost-btn" onClick={onBack}>
          <ArrowLeft size={16} />{" "}
          {labMode ? "Back to Undisclosed" : "Back to WellPept"}
        </button>

        <div className="panel" style={{ marginTop: "1rem" }}>
          <p className="section-kicker">Partners</p>
          <h1>Sell on {labMode ? "Undisclosed" : "WellPept"}</h1>
          <p className="lede">
            List products for customers to buy on our storefronts. You fulfill
            (China economy and/or US fast). We approve listings — pick one site
            or both.
          </p>

          {done ? (
            <div className="notice ok" style={{ marginTop: "1rem" }}>
              <strong>Application received</strong>
              <p style={{ margin: "0.5rem 0 0" }}>
                We’ll review and email you. Approved WellPept listings appear
                under Accessories; Undisclosed listings under Partner listings.
              </p>
              <button
                type="button"
                className="primary-btn"
                style={{ marginTop: "1rem" }}
                onClick={onBack}
              >
                Back to shop
              </button>
            </div>
          ) : (
            <form className="checkout-form" onSubmit={handleSubmit}>
              <h2>Your business</h2>
              <div className="form-row">
                <label className="field">
                  Contact name *
                  <input
                    required
                    value={form.name}
                    onChange={(e) => patch("name", e.target.value)}
                  />
                </label>
                <label className="field">
                  Email *
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => patch("email", e.target.value)}
                  />
                </label>
              </div>
              <label className="field">
                Company / storefront name
                <input
                  value={form.company}
                  onChange={(e) => patch("company", e.target.value)}
                />
              </label>
              <label className="field">
                Notes for us
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => patch("notes", e.target.value)}
                  placeholder="Where you ship from, MOQ, categories…"
                />
              </label>

              <h2 style={{ marginTop: "1.25rem" }}>Sell on which site?</h2>
              <label className="consent-check">
                <input
                  type="checkbox"
                  checked={form.channelWellpept}
                  onChange={(e) => patch("channelWellpept", e.target.checked)}
                />
                <span>
                  {MARKET_CHANNELS.wellpept.label} —{" "}
                  {MARKET_CHANNELS.wellpept.blurb}
                </span>
              </label>
              <label className="consent-check">
                <input
                  type="checkbox"
                  checked={form.channelUndisclosed}
                  onChange={(e) =>
                    patch("channelUndisclosed", e.target.checked)
                  }
                />
                <span>
                  {MARKET_CHANNELS.undisclosed.label} —{" "}
                  {MARKET_CHANNELS.undisclosed.blurb}
                </span>
              </label>

              <h2 style={{ marginTop: "1.5rem" }}>
                First product <span className="meta">(optional)</span>
              </h2>
              <div className="form-row">
                <label className="field">
                  Product name
                  <input
                    value={form.productName}
                    onChange={(e) => patch("productName", e.target.value)}
                    placeholder="Activate Mix Kit"
                  />
                </label>
                <label className="field">
                  Price to customer (USD)
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={form.productPrice}
                    onChange={(e) => patch("productPrice", e.target.value)}
                    placeholder="20"
                  />
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  Size / pack
                  <input
                    value={form.productSize}
                    onChange={(e) => patch("productSize", e.target.value)}
                    placeholder="Set of 3 · 10 mg kit"
                  />
                </label>
                <label className="field">
                  Type
                  <select
                    value={form.productKind}
                    onChange={(e) => patch("productKind", e.target.value)}
                  >
                    <option value="tool">Tool / packaging</option>
                    <option value="mini">Filled travel mini (cosmetic)</option>
                    <option value="research">
                      Research supply (Undisclosed only)
                    </option>
                  </select>
                </label>
              </div>
              <label className="field">
                Short blurb
                <textarea
                  rows={2}
                  value={form.productBlurb}
                  onChange={(e) => patch("productBlurb", e.target.value)}
                />
              </label>
              <label className="field">
                Image URL (optional)
                <input
                  value={form.productImage}
                  onChange={(e) => patch("productImage", e.target.value)}
                  placeholder="https://…"
                />
              </label>

              <p className="meta" style={{ marginTop: "0.75rem" }}>
                Ship options you can support
              </p>
              <label className="consent-check">
                <input
                  type="checkbox"
                  checked={form.shipEconomy}
                  onChange={(e) => patch("shipEconomy", e.target.checked)}
                />
                <span>
                  {ACCESSORY_SHIP_OPTIONS.economy.label} —{" "}
                  {ACCESSORY_SHIP_OPTIONS.economy.blurb}
                </span>
              </label>
              <label className="consent-check">
                <input
                  type="checkbox"
                  checked={form.shipFast}
                  onChange={(e) => patch("shipFast", e.target.checked)}
                />
                <span>
                  {ACCESSORY_SHIP_OPTIONS.fast.label} —{" "}
                  {ACCESSORY_SHIP_OPTIONS.fast.blurb}
                </span>
              </label>

              <div className="sk-legal-box" style={{ marginTop: "1rem" }}>
                <p className="sk-legal-title">Listing rules</p>
                <p className="meta">{legal.short}</p>
                <p className="meta" style={{ marginTop: "0.35rem" }}>
                  WellPept listings must be lawful cosmetics / accessories.
                  Undisclosed listings are research-use only — not for human
                  consumption. You fulfill approved orders; we may reject any
                  listing.
                </p>
              </div>

              {msg ? (
                <div className="notice warn" style={{ marginTop: "0.75rem" }}>
                  {msg}
                </div>
              ) : null}

              <button
                type="submit"
                className="primary-btn"
                style={{ marginTop: "1rem" }}
                disabled={busy}
              >
                {busy ? "Sending…" : "Submit application"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
