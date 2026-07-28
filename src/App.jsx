import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Store,
  ShieldCheck,
  ArrowLeft,
  Plus,
  Minus,
  Check,
  X,
  Package,
  Truck,
  Calculator,
  FlaskConical,
  Headset,
  BadgeCheck,
  Microscope,
} from "lucide-react";
import {
  CATEGORIES,
  MARKUP,
  formatMoney,
  guessCategory,
} from "./data/products";
import {
  getInitialMarketplace,
  persistMarketplace,
  uid,
} from "./data/store";
import PeptideCalculator, {
  parseCalculatorQuery,
} from "./components/PeptideCalculator";
import GeneratedVial from "./components/GeneratedVial";
import { THE_LOBSTER_VENDOR } from "./data/theLobster";

const VIEWS = {
  shop: "shop",
  product: "product",
  cart: "cart",
  vendor: "vendor",
  admin: "admin",
  calculator: "calculator",
};

function VialPreview({ product, size = "md", showDownload = false }) {
  return (
    <GeneratedVial
      name={product.name}
      sku={product.sku}
      mass={product.mg}
      category={product.category}
      subtitle={product.form}
      size={size}
      showDownload={showDownload}
    />
  );
}

function StatusPill({ status }) {
  return <span className={`status ${status}`}>{status}</span>;
}

export default function App() {
  const initial = useMemo(() => getInitialMarketplace(), []);
  const calcFromUrl = useMemo(
    () => parseCalculatorQuery(window.location.search),
    []
  );
  const [vendors, setVendors] = useState(initial.vendors);
  const [submissions, setSubmissions] = useState(initial.submissions);
  const [products, setProducts] = useState(initial.products);

  const [view, setView] = useState(
    calcFromUrl ? VIEWS.calculator : VIEWS.shop
  );
  const [calcInitial, setCalcInitial] = useState(calcFromUrl);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartPulse, setCartPulse] = useState(false);
  const [flash, setFlash] = useState("");

  useEffect(() => {
    const nextProducts = persistMarketplace(vendors, submissions);
    setProducts(nextProducts);
  }, [vendors, submissions]);

  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(""), 2800);
    return () => clearTimeout(t);
  }, [flash]);

  const selected = products.find((p) => p.id === selectedId) || null;
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);

  const filtered = products.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.vendor.toLowerCase().includes(q);
    const matchesCategory = category === "All" || p.category === category;
    return matchesQuery && matchesCategory;
  });

  const bestsellers = useMemo(
    () =>
      [...products]
        .filter((p) => !p.externalOnly)
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 8),
    [products]
  );

  const newArrivals = useMemo(
    () =>
      [...products]
        .filter((p) => !p.externalOnly)
        .sort((a, b) => String(b.sku).localeCompare(String(a.sku)))
        .slice(0, 8),
    [products]
  );

  function goShop() {
    setView(VIEWS.shop);
    setSelectedId(null);
  }

  function openProduct(product) {
    setSelectedId(product.id);
    setView(VIEWS.product);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addToCart(product, qty = 1) {
    setCart((prev) => {
      const existing = prev.find((line) => line.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.id === product.id ? { ...line, qty: line.qty + qty } : line
        );
      }
      return [...prev, { ...product, qty }];
    });
    setCartPulse(true);
    setTimeout(() => setCartPulse(false), 350);
    setFlash(`${product.name} added to cart`);
  }

  function updateQty(id, delta) {
    setCart((prev) =>
      prev
        .map((line) =>
          line.id === id ? { ...line, qty: Math.max(0, line.qty + delta) } : line
        )
        .filter((line) => line.qty > 0)
    );
  }

  function removeLine(id) {
    setCart((prev) => prev.filter((line) => line.id !== id));
  }

  function approveSubmission(id) {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: "approved", reviewedAt: new Date().toISOString() }
          : s
      )
    );
    setFlash("Listing approved — catalog updated");
  }

  function rejectSubmission(id) {
    setSubmissions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: "rejected", reviewedAt: new Date().toISOString() }
          : s
      )
    );
    setFlash("Listing rejected");
  }

  function approveVendor(id) {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "approved" } : v))
    );
    setFlash("Vendor approved");
  }

  function rejectVendor(id) {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "rejected" } : v))
    );
    setFlash("Vendor rejected");
  }

  function submitVendorApplication(payload) {
    const vendorId = uid("v");
    const vendor = {
      id: vendorId,
      name: payload.name.trim(),
      email: payload.email.trim(),
      status: "pending",
      minOrder: Number(payload.minOrder) || 0,
      shippingFlat: Number(payload.shippingFlat) || 0,
      shippingNote: payload.shippingNote.trim(),
      createdAt: new Date().toISOString(),
    };

    const lines = payload.lines
      .filter((line) => line.name.trim() && line.sku.trim() && line.vendorCost)
      .map((line) => ({
        id: uid("s"),
        vendorId,
        sku: line.sku.trim().toUpperCase(),
        name: line.name.trim(),
        form: line.form.trim() || "Lyophilized vial",
        purity: line.purity.trim() || "—",
        mg: Number(line.mg) || 0,
        vendorCost: Number(line.vendorCost),
        category: line.category || guessCategory(line.name.trim()),
        status: "pending",
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
      }));

    if (!vendor.name || !vendor.email || lines.length === 0) {
      setFlash("Add vendor details and at least one price-list item");
      return false;
    }

    setVendors((prev) => [vendor, ...prev]);
    setSubmissions((prev) => [...lines, ...prev]);
    setFlash("Price list submitted — waiting for Undisclosed approval");
    return true;
  }

  function submitPriceListForExisting(vendorId, linesInput) {
    const lines = linesInput
      .filter((line) => line.name.trim() && line.sku.trim() && line.vendorCost)
      .map((line) => ({
        id: uid("s"),
        vendorId,
        sku: line.sku.trim().toUpperCase(),
        name: line.name.trim(),
        form: line.form.trim() || "Lyophilized vial",
        purity: line.purity.trim() || "—",
        mg: Number(line.mg) || 0,
        vendorCost: Number(line.vendorCost),
        category: line.category || guessCategory(line.name.trim()),
        status: "pending",
        submittedAt: new Date().toISOString(),
        reviewedAt: null,
      }));

    if (lines.length === 0) {
      setFlash("Add at least one valid line item");
      return false;
    }

    setSubmissions((prev) => [...lines, ...prev]);
    setFlash("Updated price list submitted for approval");
    return true;
  }

  function updateVendorTerms(vendorId, terms) {
    setVendors((prev) =>
      prev.map((v) =>
        v.id === vendorId
          ? {
              ...v,
              minOrder: Number(terms.minOrder) || 0,
              shippingFlat: Number(terms.shippingFlat) || 0,
              shippingNote: terms.shippingNote.trim(),
            }
          : v
      )
    );
    setFlash("Vendor shipping & minimum order updated");
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <div className="header-top">
          <div className="container header-top-inner">
            <span>Research-grade peptides · Multi-vendor marketplace</span>
            <span className="header-top-links">
              <button type="button" onClick={() => setView(VIEWS.calculator)}>
                Peptide calculator
              </button>
              <button type="button" onClick={() => setView(VIEWS.vendor)}>
                Sell on Undisclosed
              </button>
            </span>
          </div>
        </div>
        <div className="container header-inner">
          <button className="brand" onClick={goShop} type="button">
            <img
              src="/undisclosed-brand.png"
              alt=""
              className="brand-logo"
              width={40}
              height={40}
            />
            <span className="brand-text">
              <span className="brand-mark">Undisclosed</span>
              <span className="brand-sub">Research marketplace</span>
            </span>
          </button>

          <div className="search-wrap">
            <select
              className="search-dept"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setView(VIEWS.shop);
              }}
              aria-label="Department"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c === "All" ? "All" : c}
                </option>
              ))}
            </select>
            <Search size={16} strokeWidth={2} />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setView(VIEWS.shop);
              }}
              placeholder="Search peptides, SKUs, vendors…"
              aria-label="Search catalog"
            />
            <button
              type="button"
              className="search-go"
              onClick={() => {
                setView(VIEWS.shop);
                document
                  .getElementById("catalog")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Search
            </button>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="ghost-btn"
              onClick={() => {
                setCalcInitial(null);
                setView(VIEWS.calculator);
              }}
            >
              <Calculator size={16} />
              <span>Calculator</span>
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => setView(VIEWS.vendor)}
            >
              <Store size={16} />
              <span>Vendors</span>
            </button>
            <button
              type="button"
              className="soft-btn"
              onClick={() => setView(VIEWS.admin)}
            >
              <ShieldCheck size={16} />
              <span>Approve</span>
            </button>
            <button
              type="button"
              className="icon-btn cart-btn"
              onClick={() => setView(VIEWS.cart)}
              aria-label="Open cart"
            >
              <ShoppingCart size={18} />
              <span className="cart-label">Cart</span>
              {cartCount > 0 && (
                <span className={`cart-count ${cartPulse ? "pulse" : ""}`}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
        <nav className="dept-bar" aria-label="Categories">
          <div className="container dept-bar-inner">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                className={`dept-link ${category === c ? "active" : ""}`}
                onClick={() => {
                  setCategory(c);
                  setView(VIEWS.shop);
                  document
                    .getElementById("catalog")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {c}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {flash && (
        <div className="container" style={{ paddingTop: "0.85rem" }}>
          <div className="notice fade">{flash}</div>
        </div>
      )}

      <main>
        {view === VIEWS.shop && (
          <>
            <section className="hero">
              <div className="hero-media" />
              <div className="container hero-content">
                <h1 className="hero-brand rise">Undisclosed</h1>
                <p className="hero-tagline rise-delay">
                  The research equivalent — same compound, clearer path.
                </p>
                <p className="hero-copy rise-delay">
                  Most research peptides share the same synthesis pipeline.
                  Undisclosed sources approved manufacturers directly so labs
                  pay for the molecule — not the pharmacy markup.
                </p>
                <div className="hero-cta rise-delay">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() =>
                      document
                        .getElementById("catalog")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Shop catalog
                  </button>
                  <button
                    type="button"
                    className="soft-btn"
                    onClick={() => setView(VIEWS.vendor)}
                  >
                    Become a vendor
                  </button>
                </div>
              </div>
            </section>

            <section className="trust-strip">
              <div className="container trust-grid">
                <div className="trust-item">
                  <Truck size={22} />
                  <div>
                    <strong>Fast &amp; reliable shipping</strong>
                    <p>Drop-ship from approved vendor warehouses worldwide.</p>
                  </div>
                </div>
                <div className="trust-item">
                  <Microscope size={22} />
                  <div>
                    <strong>3rd-party lab tested</strong>
                    <p>Vendors publish Janoshik / COA-backed purity claims.</p>
                  </div>
                </div>
                <div className="trust-item">
                  <BadgeCheck size={22} />
                  <div>
                    <strong>Admin-approved listings</strong>
                    <p>Price lists reviewed before they hit the catalog.</p>
                  </div>
                </div>
                <div className="trust-item">
                  <Headset size={22} />
                  <div>
                    <strong>Research tools built in</strong>
                    <p>Reconstitution calculator + auto-generated vial labels.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <div className="section-head">
                  <div>
                    <p className="section-kicker">This week</p>
                    <h2>Bestsellers</h2>
                    <p>Top-reviewed research peptides across approved vendors.</p>
                  </div>
                </div>
                <div className="product-grid product-grid-scroll">
                  {bestsellers.map((product) => (
                    <ProductCard
                      key={`best-${product.id}`}
                      product={product}
                      onOpen={openProduct}
                      onAdd={addToCart}
                    />
                  ))}
                </div>
              </div>
            </section>

            <section className="mission-band">
              <div className="container mission-inner">
                <div>
                  <p className="section-kicker">Why Undisclosed</p>
                  <h2>Research equivalent. Not retail theater.</h2>
                  <p>
                    If a compound isn’t coming straight from a branded pharmacy
                    line, it’s almost always made in the same research-chemical
                    manufacturing corridors — largely China — then marked up
                    through middlemen. If it{" "}
                    <em>is</em> pharma-sourced, you’re often paying a premium for
                    packaging and distribution of the same active structure.
                    Undisclosed is the lab’s generic path: approved vendors,
                    published costs, and a transparent +
                    {Math.round(MARKUP * 100)}% catalog so researchers fund the
                    assay — not the brand story.
                  </p>
                </div>
                <ul className="mission-points">
                  <li>
                    <FlaskConical size={18} /> Same compound identity — research
                    purity, not pharmacy branding
                  </li>
                  <li>
                    <ShieldCheck size={18} /> Source closer to manufacture —
                    fewer markups between plant and bench
                  </li>
                  <li>
                    <Microscope size={18} /> Compare COAs &amp; vendor cost before
                    you commit inventory
                  </li>
                </ul>
              </div>
            </section>

            <section className="value-thesis section">
              <div className="container">
                <div className="section-head">
                  <div>
                    <p className="section-kicker">The thesis</p>
                    <h2>Two supply stories. One molecule.</h2>
                    <p>
                      Either way, the structure on the vial is what matters for
                      research — Undisclosed makes the economics honest.
                    </p>
                  </div>
                </div>
                <div className="thesis-grid">
                  <article className="thesis-card panel">
                    <p className="section-kicker">Not pharmacy-direct?</p>
                    <h3>It’s already China-sourced research supply</h3>
                    <p>
                      Most “research peptide” inventory traces back to the same
                      manufacturing hubs. Paying a domestic storefront premium
                      doesn’t change the synthesis origin — it only changes who
                      pockets the margin. We surface approved manufacturer price
                      lists so your lab can buy closer to source.
                    </p>
                  </article>
                  <article className="thesis-card panel">
                    <p className="section-kicker">Pharma-sourced?</p>
                    <h3>Why pay brand tax for the same compound</h3>
                    <p>
                      When the active is the same sequence or small molecule,
                      the research question is purity, fill, and documentation —
                      not the logo on the box. Undisclosed lists research-grade
                      equivalents beside vendor cost so you can see what the
                      compound actually clears for.
                    </p>
                  </article>
                  <article className="thesis-card panel thesis-card-accent">
                    <p className="section-kicker">Undisclosed</p>
                    <h3>Your generic research lane</h3>
                    <p>
                      Admin-vetted vendors. Lowest approved cost wins each SKU.
                      Catalog retail is vendor cost +{" "}
                      {Math.round(MARKUP * 100)}% — explicit, not mysterious.
                      For laboratory research use only; not for human
                      consumption or medical use.
                    </p>
                  </article>
                </div>
              </div>
            </section>

            <section className="section featured-vendor-section">
              <div className="container">
                <div className="featured-vendor panel">
                  <div className="featured-vendor-copy">
                    <span className="featured-kicker">
                      Featured drop-ship partner
                    </span>
                    <h2>The Lobster · Cartman Gear</h2>
                    <p>
                      Pharma-grade HGH, peptides, and Turkish pharmacy —
                      EU/Middle East based with US &amp; EU shipping. Browse{" "}
                      <a
                        href={THE_LOBSTER_VENDOR.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        cartmangear.co
                      </a>{" "}
                      for live pricing, then upload their list to sell here at +
                      {Math.round(MARKUP * 100)}%.
                    </p>
                    <ul className="featured-meta">
                      <li>
                        Min order ~{formatMoney(THE_LOBSTER_VENDOR.minOrder)}
                      </li>
                      <li>Crypto · Contact to order</li>
                      <li>{THE_LOBSTER_VENDOR.telegram}</li>
                    </ul>
                    <div className="hero-cta" style={{ marginTop: "0.85rem" }}>
                      <a
                        className="primary-btn"
                        href={THE_LOBSTER_VENDOR.website}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Visit cartmangear.co
                      </a>
                      <button
                        type="button"
                        className="soft-btn"
                        onClick={() => setView(VIEWS.vendor)}
                      >
                        Upload Lobster price list
                      </button>
                    </div>
                  </div>
                  <div className="featured-vendor-visual">
                    <GeneratedVial
                      name="The Lobster"
                      sku="CARTMAN"
                      mass={10}
                      category="Growth"
                      mixText="cartmangear.co"
                      size="lg"
                    />
                  </div>
                </div>
              </div>
            </section>

            {!query.trim() && category === "All" && (
              <section className="section section-tight">
                <div className="container">
                  <div className="section-head">
                    <div>
                      <p className="section-kicker">Just listed</p>
                      <h2>New arrivals</h2>
                      <p>Fresh SKUs from the latest approved price lists.</p>
                    </div>
                  </div>
                  <div className="product-grid">
                    {newArrivals.map((product) => (
                      <ProductCard
                        key={`new-${product.id}`}
                        product={product}
                        onOpen={openProduct}
                        onAdd={addToCart}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="section" id="catalog">
              <div className="container">
                <div className="section-head">
                  <div>
                    <p className="section-kicker">Full marketplace</p>
                    <h2>Catalog</h2>
                    <p>
                      {filtered.length} result
                      {filtered.length === 1 ? "" : "s"}
                      {category !== "All" ? ` in ${category}` : ""}
                      {query.trim() ? ` for “${query.trim()}”` : ""}. Retail =
                      vendor cost + {Math.round(MARKUP * 100)}%.
                    </p>
                  </div>
                </div>

                <div className="filters">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`chip ${category === c ? "active" : ""}`}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                {filtered.length === 0 ? (
                  <div className="empty-state">
                    No approved products match this search yet.
                  </div>
                ) : (
                  <div className="product-grid">
                    {filtered.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onOpen={openProduct}
                        onAdd={addToCart}
                      />
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="lab-band">
              <div className="container lab-inner">
                <div>
                  <p className="section-kicker">Documentation</p>
                  <h2>Judge the molecule — not the markup</h2>
                  <p>
                    Research equivalents earn trust with verifiable purity and
                    fill data. Independent COAs let your lab compare batches the
                    same way you’d compare any analytical standard — without
                    paying for a pharmacy label.
                  </p>
                </div>
                <ul className="lab-points">
                  <li>Batch transparency for the bench</li>
                  <li>Unbiased third-party reports</li>
                  <li>Purity &amp; fill over packaging</li>
                </ul>
              </div>
            </section>
          </>
        )}

        {view === VIEWS.product && selected && (
          <ProductDetail
            product={selected}
            onBack={goShop}
            onAdd={() => addToCart(selected)}
            onCalculate={() => {
              setCalcInitial({
                name: selected.name,
                mass: selected.mg || 10,
                dose: selected.mg >= 10 ? 1 : 250,
                doseUnit: selected.mg >= 10 ? "mg" : "mcg",
                desiredUnits: 10,
              });
              setView(VIEWS.calculator);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {view === VIEWS.cart && (
          <CartPage
            cart={cart}
            onBack={goShop}
            onUpdateQty={updateQty}
            onRemove={removeLine}
          />
        )}

        {view === VIEWS.calculator && (
          <PeptideCalculator initial={calcInitial} />
        )}

        {view === VIEWS.vendor && (
          <VendorPortal
            vendors={vendors}
            submissions={submissions}
            onApply={submitVendorApplication}
            onSubmitLines={submitPriceListForExisting}
            onUpdateTerms={updateVendorTerms}
          />
        )}

        {view === VIEWS.admin && (
          <AdminPanel
            vendors={vendors}
            submissions={submissions}
            products={products}
            onApproveSubmission={approveSubmission}
            onRejectSubmission={rejectSubmission}
            onApproveVendor={approveVendor}
            onRejectVendor={rejectVendor}
          />
        )}
      </main>

      <footer className="footer">
        <div className="container footer-inner">
          <div>
            <strong>Undisclosed</strong>
            <div>Research equivalents — same compounds, clearer economics</div>
          </div>
          <p className="disclaimer">
            For laboratory research use only. Not for human consumption, medical
            use, or household purposes. Buyers are responsible for lawful use in
            their jurisdiction.
          </p>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ product, onOpen, onAdd }) {
  return (
    <article className="product-card">
      <button
        type="button"
        className="product-card-main"
        onClick={() => onOpen(product)}
      >
        <div className="product-visual">
          {product.badge && <span className="badge">{product.badge}</span>}
          <VialPreview product={product} size="md" />
        </div>
        <div className="product-body">
          <div className="meta">
            {product.category} · SKU {product.sku}
          </div>
          <h3>{product.name}</h3>
          <div className="meta">{product.form}</div>
          <div className="rating">
            <span className="stars" aria-hidden>
              ★★★★☆
            </span>{" "}
            {product.rating.toFixed(1)} · {product.reviews} reviews
          </div>
          <div className="price-row">
            {product.externalOnly ? (
              <span className="price price-external">{product.priceLabel}</span>
            ) : (
              <>
                <span className="price">{formatMoney(product.price)}</span>
                <span className="compare">{formatMoney(product.compareAt)}</span>
              </>
            )}
          </div>
          <div className="meta sold-by">Sold by {product.vendor}</div>
        </div>
      </button>
      {product.externalOnly ? (
        <a
          className="cart-cta soft-btn"
          href={product.externalUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          View on vendor site
        </a>
      ) : (
        <button
          type="button"
          className="cart-cta"
          onClick={(e) => {
            e.stopPropagation();
            onAdd(product);
          }}
        >
          Add to cart
        </button>
      )}
    </article>
  );
}

function ProductDetail({ product, onBack, onAdd, onCalculate }) {
  return (
    <section className="panel-page fade">
      <div className="container">
        <button type="button" className="ghost-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to results
        </button>
        <div className="detail-layout amazon-detail" style={{ marginTop: "1rem" }}>
          <div className="detail-visual">
            <VialPreview product={product} size="lg" showDownload />
          </div>
          <div className="detail-info">
            <div className="meta">
              {product.category} · SKU {product.sku}
            </div>
            <h1>{product.name}</h1>
            <div className="rating">
              <span className="stars">★★★★☆</span> {product.rating.toFixed(1)} ·{" "}
              {product.reviews} ratings
            </div>
            <p className="detail-blurb">{product.blurb}</p>
            <div className="meta">
              {product.form} · Purity {product.purity}
            </div>
            <div className="meta sold-by">
              Sold by <strong>{product.vendor}</strong> · Ships via Undisclosed
              marketplace
            </div>
          </div>
          <div className="buy-box panel">
            {product.externalOnly ? (
              <>
                <div className="price-row">
                  <span className="price price-external">{product.priceLabel}</span>
                </div>
                <div className="meta">
                  Pricing lives on the vendor storefront. Upload their price list
                  in Vendors to sell through Undisclosed with markup.
                </div>
                <a
                  className="primary-btn"
                  href={product.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Open cartmangear.co
                </a>
              </>
            ) : (
              <>
                <div className="price-row">
                  <span className="price">{formatMoney(product.price)}</span>
                  <span className="compare">{formatMoney(product.compareAt)}</span>
                </div>
                <div className="meta">
                  per {product.unitLabel} (vendor cost{" "}
                  {formatMoney(product.vendorCost)} + {Math.round(MARKUP * 100)}%)
                </div>
                <div className="buy-stock ok">In Stock</div>
                <button type="button" className="cart-cta" onClick={onAdd}>
                  Add to cart
                </button>
                <button type="button" className="primary-btn" onClick={onAdd}>
                  Buy now
                </button>
              </>
            )}
            <div className="meta">
              <Truck size={14} style={{ display: "inline", marginRight: 6 }} />
              {product.ships}
              {!product.externalOnly && (
                <>
                  . Shipping {formatMoney(product.shippingFlat)}
                  {product.shippingNote ? ` · ${product.shippingNote}` : ""}
                </>
              )}
            </div>
            <div className="meta">
              <Package size={14} style={{ display: "inline", marginRight: 6 }} />
              Vendor minimum order {formatMoney(product.minOrder)} · Fulfilled by{" "}
              {product.vendor}
            </div>
            <button type="button" className="soft-btn" onClick={onCalculate}>
              <Calculator size={16} /> Calculate reconstitution
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function CartPage({ cart, onBack, onUpdateQty, onRemove }) {
  const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);

  const shippingByVendor = new Map();
  const vendorSubtotals = new Map();
  for (const line of cart) {
    vendorSubtotals.set(
      line.vendorId,
      (vendorSubtotals.get(line.vendorId) || 0) + line.price * line.qty
    );
    if (!shippingByVendor.has(line.vendorId)) {
      shippingByVendor.set(line.vendorId, {
        name: line.vendor,
        shippingFlat: line.shippingFlat,
        minOrder: line.minOrder,
      });
    }
  }

  let shipping = 0;
  const minOrderWarnings = [];
  for (const [vendorId, info] of shippingByVendor.entries()) {
    shipping += Number(info.shippingFlat) || 0;
    const vendorTotal = vendorSubtotals.get(vendorId) || 0;
    if (vendorTotal < info.minOrder) {
      minOrderWarnings.push(
        `${info.name} minimum is ${formatMoney(info.minOrder)} (cart has ${formatMoney(vendorTotal)})`
      );
    }
  }

  const total = subtotal + shipping;

  return (
    <section className="panel-page fade">
      <div className="container">
        <button type="button" className="ghost-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Continue shopping
        </button>
        <div className="panel" style={{ marginTop: "1rem" }}>
          <h1>Cart</h1>
          <p className="lede">
            Orders drop-ship from the approved vendor for each line item.
          </p>

          {cart.length === 0 ? (
            <div className="empty-state">Your cart is empty.</div>
          ) : (
            <>
              <div className="cart-list">
                {cart.map((line) => (
                  <div className="cart-item" key={line.id}>
                    <div className="cart-thumb">
                      <VialPreview product={line} size="sm" />
                    </div>
                    <div>
                      <strong>{line.name}</strong>
                      <div className="meta">
                        {line.form} · {line.vendor}
                      </div>
                      <div className="qty-controls">
                        <button
                          type="button"
                          onClick={() => onUpdateQty(line.id, -1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span>{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQty(line.id, 1)}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                        <button
                          type="button"
                          className="danger-btn"
                          onClick={() => onRemove(line.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="line-total">
                      <strong>{formatMoney(line.price * line.qty)}</strong>
                    </div>
                  </div>
                ))}
              </div>

              {minOrderWarnings.length > 0 && (
                <div className="notice warn" style={{ marginTop: "1rem" }}>
                  {minOrderWarnings.join(" · ")}
                </div>
              )}

              <div className="cart-summary">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="summary-row">
                  <span>Shipping (by vendor)</span>
                  <span>{formatMoney(shipping)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total</span>
                  <span>{formatMoney(total)}</span>
                </div>
                <button type="button" className="primary-btn" disabled>
                  Checkout coming soon
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function emptyLine() {
  return {
    sku: "",
    name: "",
    form: "Lyophilized vial",
    purity: "99%",
    mg: "",
    vendorCost: "",
    category: "Research",
  };
}

function VendorPortal({
  vendors,
  submissions,
  onApply,
  onSubmitLines,
  onUpdateTerms,
}) {
  const [tab, setTab] = useState("apply");
  const [form, setForm] = useState({
    name: "",
    email: "",
    minOrder: "150",
    shippingFlat: "18",
    shippingNote: "Cold-pack ground",
    lines: [emptyLine(), emptyLine()],
  });
  const [existingVendorId, setExistingVendorId] = useState(
    vendors.find((v) => v.status === "approved")?.id || vendors[0]?.id || ""
  );
  const [existingLines, setExistingLines] = useState([emptyLine(), emptyLine()]);
  const [terms, setTerms] = useState({
    minOrder: "",
    shippingFlat: "",
    shippingNote: "",
  });

  useEffect(() => {
    const vendor = vendors.find((v) => v.id === existingVendorId);
    if (!vendor) return;
    setTerms({
      minOrder: String(vendor.minOrder ?? ""),
      shippingFlat: String(vendor.shippingFlat ?? ""),
      shippingNote: vendor.shippingNote || "",
    });
  }, [existingVendorId, vendors]);

  const mySubs = submissions.filter((s) => s.vendorId === existingVendorId);

  return (
    <section className="panel-page fade">
      <div className="container">
        <div className="panel">
          <h1>Vendor portal</h1>
          <p className="lede">
            Drop your price list here. Undisclosed reviews each line, then
            publishes approved items to the live catalog with a{" "}
            {Math.round(MARKUP * 100)}% retail markup. You set minimum order and
            shipping.
          </p>

          <div className="notice">
            Catalog is loaded from approved vendor price lists. Changsha Premium
            (182 SKUs) and ERP Peptide (151 SKUs) are pre-imported. New vendors
            submit here; nothing goes live until you approve it.
          </div>

          <div className="tabs">
            <button
              type="button"
              className={`chip ${tab === "apply" ? "active" : ""}`}
              onClick={() => setTab("apply")}
            >
              New vendor application
            </button>
            <button
              type="button"
              className={`chip ${tab === "update" ? "active" : ""}`}
              onClick={() => setTab("update")}
            >
              Update price list / shipping
            </button>
          </div>

          {tab === "apply" ? (
            <form
              className="form-grid"
              onSubmit={(e) => {
                e.preventDefault();
                const ok = onApply(form);
                if (ok) {
                  setForm({
                    name: "",
                    email: "",
                    minOrder: "150",
                    shippingFlat: "18",
                    shippingNote: "Cold-pack ground",
                    lines: [emptyLine(), emptyLine()],
                  });
                }
              }}
            >
              <div className="form-row">
                <label className="field">
                  Vendor name
                  <input
                    required
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="NorthLab Research"
                  />
                </label>
                <label className="field">
                  Contact email
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="supply@vendor.com"
                  />
                </label>
              </div>
              <div className="form-row">
                <label className="field">
                  Minimum order (USD)
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.minOrder}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, minOrder: e.target.value }))
                    }
                  />
                </label>
                <label className="field">
                  Flat shipping (USD)
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.shippingFlat}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, shippingFlat: e.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="field">
                Shipping note
                <input
                  value={form.shippingNote}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, shippingNote: e.target.value }))
                  }
                  placeholder="Cold-pack, 2-day, etc."
                />
              </label>

              <PriceListEditor
                lines={form.lines}
                onChange={(lines) => setForm((f) => ({ ...f, lines }))}
              />

              <button type="submit" className="primary-btn">
                Submit for approval
              </button>
            </form>
          ) : (
            <div className="grid-2">
              <div className="form-grid">
                <label className="field">
                  Vendor account
                  <select
                    value={existingVendorId}
                    onChange={(e) => setExistingVendorId(e.target.value)}
                  >
                    {vendors.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.status})
                      </option>
                    ))}
                  </select>
                </label>

                <h2 style={{ marginTop: "0.5rem" }}>Shipping & minimums</h2>
                <div className="form-row">
                  <label className="field">
                    Minimum order (USD)
                    <input
                      type="number"
                      value={terms.minOrder}
                      onChange={(e) =>
                        setTerms((t) => ({ ...t, minOrder: e.target.value }))
                      }
                    />
                  </label>
                  <label className="field">
                    Flat shipping (USD)
                    <input
                      type="number"
                      value={terms.shippingFlat}
                      onChange={(e) =>
                        setTerms((t) => ({
                          ...t,
                          shippingFlat: e.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
                <label className="field">
                  Shipping note
                  <input
                    value={terms.shippingNote}
                    onChange={(e) =>
                      setTerms((t) => ({ ...t, shippingNote: e.target.value }))
                    }
                  />
                </label>
                <button
                  type="button"
                  className="soft-btn"
                  onClick={() => onUpdateTerms(existingVendorId, terms)}
                >
                  Save shipping terms
                </button>

                <h2 style={{ marginTop: "0.75rem" }}>New price-list lines</h2>
                <PriceListEditor
                  lines={existingLines}
                  onChange={setExistingLines}
                />
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => {
                    const ok = onSubmitLines(existingVendorId, existingLines);
                    if (ok) setExistingLines([emptyLine(), emptyLine()]);
                  }}
                >
                  Submit price list update
                </button>
              </div>

              <div>
                <h2>Your recent submissions</h2>
                <p className="lede">Status updates after Undisclosed review.</p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>SKU</th>
                        <th>Item</th>
                        <th>Cost</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mySubs.length === 0 ? (
                        <tr>
                          <td colSpan={4}>No submissions yet.</td>
                        </tr>
                      ) : (
                        mySubs.slice(0, 12).map((s) => (
                          <tr key={s.id}>
                            <td>{s.sku}</td>
                            <td>
                              {s.name}
                              <div className="meta">
                                {s.mg}mg · {s.purity}
                              </div>
                            </td>
                            <td>{formatMoney(s.vendorCost)}</td>
                            <td>
                              <StatusPill status={s.status} />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PriceListEditor({ lines, onChange }) {
  function updateLine(index, key, value) {
    onChange(
      lines.map((line, i) => (i === index ? { ...line, [key]: value } : line))
    );
  }

  return (
    <div className="form-grid">
      {lines.map((line, index) => (
        <div
          key={index}
          className="panel"
          style={{ padding: "0.9rem", boxShadow: "none" }}
        >
          <div className="form-row">
            <label className="field">
              SKU
              <input
                value={line.sku}
                onChange={(e) => updateLine(index, "sku", e.target.value)}
                placeholder="BPC-157-5MG"
              />
            </label>
            <label className="field">
              Peptide name
              <input
                value={line.name}
                onChange={(e) => updateLine(index, "name", e.target.value)}
                placeholder="BPC-157"
              />
            </label>
          </div>
          <div className="form-row">
            <label className="field">
              Your cost (USD)
              <input
                type="number"
                min="0"
                step="0.01"
                value={line.vendorCost}
                onChange={(e) =>
                  updateLine(index, "vendorCost", e.target.value)
                }
              />
            </label>
            <label className="field">
              mg
              <input
                type="number"
                min="0"
                value={line.mg}
                onChange={(e) => updateLine(index, "mg", e.target.value)}
              />
            </label>
          </div>
          <div className="form-row">
            <label className="field">
              Purity
              <input
                value={line.purity}
                onChange={(e) => updateLine(index, "purity", e.target.value)}
              />
            </label>
            <label className="field">
              Category
              <select
                value={line.category}
                onChange={(e) => updateLine(index, "category", e.target.value)}
              >
                {CATEGORIES.filter((c) => c !== "All").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="meta" style={{ marginTop: "0.35rem" }}>
            Buyer price after approval:{" "}
            {line.vendorCost
              ? formatMoney(Number(line.vendorCost) * (1 + MARKUP))
              : "—"}
          </div>
        </div>
      ))}
      <button
        type="button"
        className="soft-btn"
        onClick={() => onChange([...lines, emptyLine()])}
      >
        <Plus size={16} /> Add another line
      </button>
    </div>
  );
}

function AdminPanel({
  vendors,
  submissions,
  products,
  onApproveSubmission,
  onRejectSubmission,
  onApproveVendor,
  onRejectVendor,
}) {
  const pendingVendors = vendors.filter((v) => v.status === "pending");
  const pendingItems = submissions.filter((s) => s.status === "pending");
  const vendorName = (id) => vendors.find((v) => v.id === id)?.name || id;

  return (
    <section className="panel-page fade">
      <div className="container">
        <div className="panel">
          <h1>Approval desk</h1>
          <p className="lede">
            Nothing reaches the public catalog until you approve it. Approved
            items publish immediately with a {Math.round(MARKUP * 100)}% markup.
          </p>

          <div className="notice warn">
            {pendingVendors.length} vendor
            {pendingVendors.length === 1 ? "" : "s"} and {pendingItems.length}{" "}
            price-list line{pendingItems.length === 1 ? "" : "s"} awaiting
            review · {products.length} live products
          </div>

          <h2>Pending vendors</h2>
          <div className="table-wrap" style={{ marginBottom: "1.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Terms</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingVendors.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No vendors waiting.</td>
                  </tr>
                ) : (
                  pendingVendors.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.name}</strong>
                        <div className="meta">{v.email}</div>
                      </td>
                      <td>
                        Min {formatMoney(v.minOrder)}
                        <div className="meta">
                          Ship {formatMoney(v.shippingFlat)}
                          {v.shippingNote ? ` · ${v.shippingNote}` : ""}
                        </div>
                      </td>
                      <td className="meta">
                        {new Date(v.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() => onApproveVendor(v.id)}
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() => onRejectVendor(v.id)}
                          >
                            <X size={16} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2>Pending price-list items</h2>
          <div className="table-wrap" style={{ marginBottom: "1.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Vendor</th>
                  <th>Cost → Retail</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingItems.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Queue clear — catalog is up to date.</td>
                  </tr>
                ) : (
                  pendingItems.map((s) => (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                        <div className="meta">
                          {s.sku} · {s.mg}mg · {s.purity} · {s.category}
                        </div>
                      </td>
                      <td>{vendorName(s.vendorId)}</td>
                      <td>
                        {formatMoney(s.vendorCost)} →{" "}
                        <strong>
                          {formatMoney(Number(s.vendorCost) * (1 + MARKUP))}
                        </strong>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() => onApproveSubmission(s.id)}
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() => onRejectSubmission(s.id)}
                          >
                            <X size={16} /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <h2>Live catalog snapshot</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Vendor</th>
                  <th>Retail</th>
                  <th>Ship / Min</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                      <div className="meta">
                        {p.sku} · {p.mg}mg
                      </div>
                    </td>
                    <td>{p.vendor}</td>
                    <td>{formatMoney(p.price)}</td>
                    <td>
                      {formatMoney(p.shippingFlat)}
                      <div className="meta">Min {formatMoney(p.minOrder)}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
