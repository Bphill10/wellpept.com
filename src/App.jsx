import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  ShoppingCart,
  Store,
  ShieldCheck,
  ArrowLeft,
  ArrowRight,
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
  Factory,
} from "lucide-react";
import {
  CATEGORIES,
  formatMoney,
  formatStrengthLabel,
  formatVendorOfferLabel,
  groupCatalog,
  guessCategory,
  retailFromVendor,
  strengthForProduct,
} from "./data/products";
import {
  getInitialMarketplace,
  persistMarketplace,
  uid,
} from "./data/store";
import {
  loadAutomationSettings,
  saveAutomationSettings,
  buildOrderPacket,
  formatOrderPacketText,
  createOrderId,
  isValidUsZip,
  loadOrders,
  saveOrder,
  suggestedBacMl,
} from "./utils/automation";
import { fetchPaymentConfig } from "./utils/payments";
import { fetchChargebeeConfig } from "./utils/chargebeeClient";
import PeptideCalculator, {
  parseCalculatorQuery,
} from "./components/PeptideCalculator";
import GeneratedVial from "./components/GeneratedVial";
import CheckoutPayment from "./components/CheckoutPayment";
import ChargebeeCheckout from "./components/ChargebeeCheckout";
import SkincareHome from "./components/SkincareHome";
import PriceListDropzone from "./components/PriceListDropzone";
import PriceCompare from "./components/PriceCompare";
import { openLiveChat, contactEmail } from "./components/LiveChat";
import { THE_LOBSTER_VENDOR } from "./data/theLobster";
import {
  LYOPHILIZED_QC,
  RESEARCH_GLOSSARY,
  researchHelpFor,
} from "./data/researchGuide";
import {
  isLabUnlocked,
  setLabUnlocked,
  labUnlockFromUrl,
  cleanLabUnlockUrl,
} from "./utils/secretMenu";

const VIEWS = {
  skincare: "skincare",
  skinProduct: "skinProduct",
  shop: "shop",
  product: "product",
  cart: "cart",
  vendor: "vendor",
  admin: "admin",
  calculator: "calculator",
};

function VialPreview({ product, size = "md", showDownload = false }) {
  if (product?.skin) {
    return (
      <div className={`skin-bottle-preview skin-bottle-preview--${size}`}>
        <div className="skin-bottle" aria-hidden="true">
          <span className="skin-bottle-cap" />
          <span className="skin-bottle-body" />
        </div>
      </div>
    );
  }
  return (
    <GeneratedVial
      name={product.name}
      sku={product.sku}
      mass={product.mg}
      unit={product.unit || "mg"}
      category={product.category}
      subtitle={product.form}
      form={product.form}
      vialMl={product.vialMl}
      summary={product.tagline || ""}
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

  const urlWantsLab = useMemo(
    () => labUnlockFromUrl(window.location.search, window.location.hash),
    []
  );
  const [labUnlocked, setLabUnlockedState] = useState(
    () => urlWantsLab || isLabUnlocked()
  );
  const [logoClicks, setLogoClicks] = useState([]);
  const [skinProduct, setSkinProduct] = useState(null);
  const [view, setView] = useState(() => {
    if (calcFromUrl && (urlWantsLab || isLabUnlocked())) return VIEWS.calculator;
    if (urlWantsLab || isLabUnlocked()) return VIEWS.shop;
    return VIEWS.skincare;
  });
  const [calcInitial, setCalcInitial] = useState(calcFromUrl);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [selectedId, setSelectedId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [cart, setCart] = useState([]);
  const [cartPulse, setCartPulse] = useState(false);
  const [flash, setFlash] = useState("");
  const [automation, setAutomation] = useState(() => loadAutomationSettings());
  const [orders, setOrders] = useState(() => loadOrders());
  const [paymentConfig, setPaymentConfig] = useState({
    enabled: false,
    publishableKey: null,
  });
  const [chargebeeConfig, setChargebeeConfig] = useState({
    enabled: false,
    site: null,
    publishableKey: null,
    skincarePlanPriceId: null,
  });

  function updateAutomation(patch) {
    setAutomation((prev) => saveAutomationSettings({ ...prev, ...patch }));
  }

  useEffect(() => {
    fetchPaymentConfig().then(setPaymentConfig);
    fetchChargebeeConfig().then(setChargebeeConfig);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    const cb = params.get("cb");
    if (viewParam === "cart" || cb === "success" || cb === "cancel") {
      setView(VIEWS.cart);
    }
    if (cb === "success") {
      setFlash("Chargebee checkout completed — confirm the order packet below if needed.");
    } else if (cb === "cancel") {
      setFlash("Chargebee checkout canceled");
    }
    if (cb || viewParam === "cart") {
      const url = new URL(window.location.href);
      url.searchParams.delete("cb");
      url.searchParams.delete("view");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  useEffect(() => {
    if (!urlWantsLab) return;
    setLabUnlocked(true);
    setLabUnlockedState(true);
    cleanLabUnlockUrl();
    setFlash("Undisclosed unlocked");
  }, [urlWantsLab]);

  useEffect(() => {
    if (labUnlocked) return;
    if (
      view === VIEWS.shop ||
      view === VIEWS.product ||
      view === VIEWS.vendor ||
      view === VIEWS.admin ||
      view === VIEWS.calculator
    ) {
      setView(VIEWS.skincare);
    }
  }, [labUnlocked, view]);

  function unlockLabMenu(message = "Undisclosed unlocked") {
    setLabUnlocked(true);
    setLabUnlockedState(true);
    setFlash(message);
    setView(VIEWS.shop);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function lockLabMenu() {
    setLabUnlocked(false);
    setLabUnlockedState(false);
    setView(VIEWS.skincare);
    setSelectedId(null);
    setSelectedVariantId(null);
    setFlash("Back to WellPept skincare");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBrandClick() {
    if (!labUnlocked) {
      const now = Date.now();
      const next = [...logoClicks, now].filter((t) => now - t < 4000);
      setLogoClicks(next);
      if (next.length >= 5) {
        setLogoClicks([]);
        unlockLabMenu("Undisclosed unlocked");
        return;
      }
      setView(VIEWS.skincare);
      setSkinProduct(null);
      return;
    }
    goShop();
  }

  function addSkincareToCart(product) {
    const mixLabel =
      product.kind === "mix" && product.buildSummary
        ? `${product.buildSummary.base}: ${product.buildSummary.peptides.join(" + ")}${
            product.buildSummary.customs?.length
              ? ` + ${product.buildSummary.customs.join(", ")}`
              : ""
          }`
        : product.size;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      form: mixLabel,
      mg: 0,
      unit: "",
      unitLabel: product.size,
      vendor: "WellPept",
      vendorId: "wellpept-skin",
      shippingFlat: 8,
      minOrder: 0,
      shippingNote: "US ground, cold-pack when needed",
      sku: String(product.id).toUpperCase().slice(0, 48),
      category: product.kind === "mix" ? "Fresh Mix" : "Skincare",
      skin: true,
      mix: product.kind === "mix",
      ships: product.kind === "mix" ? "Fresh pack, 2 to 4 days" : "Ships in 2 to 4 days",
      legalNote:
        product.kind === "mix"
          ? "Cosmetic topical peptides only. Not for injection or medical use."
          : undefined,
    });
    setFlash(
      product.kind === "mix"
        ? `Added ${product.name} (cosmetic use only)`
        : `Added ${product.name}`
    );
  }

  useEffect(() => {
    const nextProducts = persistMarketplace(vendors, submissions);
    setProducts(nextProducts);
  }, [vendors, submissions]);

  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(""), 2800);
    return () => clearTimeout(t);
  }, [flash]);

  const listings = useMemo(() => groupCatalog(products), [products]);
  const selectedListing =
    listings.find((l) => l.id === selectedId) || null;
  const selectedVariant =
    selectedListing?.variants.find((v) => v.id === selectedVariantId) ||
    selectedListing?.variants.find(
      (v) => v.id === selectedListing.defaultVariantId
    ) ||
    selectedListing?.variants[0] ||
    null;
  const cartCount = cart.reduce((sum, line) => sum + line.qty, 0);

  const filtered = listings.filter((listing) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      listing.name.toLowerCase().includes(q) ||
      listing.category.toLowerCase().includes(q) ||
      listing.variants.some(
        (v) =>
          v.sku.toLowerCase().includes(q) ||
          v.vendor.toLowerCase().includes(q) ||
          String(v.mg).includes(q)
      );
    const matchesCategory =
      category === "All" || listing.category === category;
    return matchesQuery && matchesCategory;
  });

  const bestsellers = useMemo(
    () =>
      [...listings]
        .filter((l) => l.variants.some((v) => !v.externalOnly))
        .sort((a, b) => b.reviews - a.reviews)
        .slice(0, 8),
    [listings]
  );

  const newArrivals = useMemo(
    () =>
      [...listings]
        .filter((l) => l.variants.some((v) => !v.externalOnly))
        .sort((a, b) => {
          const aSku = a.variants[a.variants.length - 1]?.sku || "";
          const bSku = b.variants[b.variants.length - 1]?.sku || "";
          return String(bSku).localeCompare(String(aSku));
        })
        .slice(0, 8),
    [listings]
  );

  function goShop() {
    setView(labUnlocked ? VIEWS.shop : VIEWS.skincare);
    setSelectedId(null);
    setSelectedVariantId(null);
    setSkinProduct(null);
  }

  function openProduct(listing, variantId) {
    setSelectedId(listing.id);
    setSelectedVariantId(variantId || listing.defaultVariantId);
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
    if (product.skin) {
      setFlash(`${product.name} added to bag`);
    } else {
      const strength = formatStrengthLabel(product);
      setFlash(`${product.name} (${strength}) added to cart`);
    }
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
    const now = new Date().toISOString();
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "approved" } : v))
    );
    if (automation.approveVendorPublishesLines) {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.vendorId === id && s.status === "pending"
            ? { ...s, status: "approved", reviewedAt: now }
            : s
        )
      );
      setFlash("Vendor approved — pending lines published");
    } else {
      setFlash("Vendor approved");
    }
  }

  function rejectVendor(id) {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "rejected" } : v))
    );
    setFlash("Vendor rejected");
  }

  function approveAllPending() {
    const now = new Date().toISOString();
    setVendors((prev) =>
      prev.map((v) =>
        v.status === "pending" ? { ...v, status: "approved" } : v
      )
    );
    setSubmissions((prev) =>
      prev.map((s) =>
        s.status === "pending"
          ? { ...s, status: "approved", reviewedAt: now }
          : s
      )
    );
    setFlash("All pending vendors and lines approved");
  }

  function approveAllPendingLines() {
    const now = new Date().toISOString();
    let count = 0;
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.status !== "pending") return s;
        count += 1;
        return { ...s, status: "approved", reviewedAt: now };
      })
    );
    setFlash(
      count
        ? `${count} price-list line${count === 1 ? "" : "s"} approved`
        : "No pending lines"
    );
  }

  function rejectAllPendingLines() {
    const now = new Date().toISOString();
    setSubmissions((prev) =>
      prev.map((s) =>
        s.status === "pending"
          ? { ...s, status: "rejected", reviewedAt: now }
          : s
      )
    );
    setFlash("All pending lines rejected");
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
      .map((line) => {
        const vialMl = Number(line.vialMl) === 10 ? 10 : 3;
        const baseForm = line.form.trim() || "Lyophilized vial";
        const form = /\b\d+\s*ml\b/i.test(baseForm)
          ? baseForm
          : `${baseForm} · ${vialMl}ml`;
        return {
          id: uid("s"),
          vendorId,
          sku: line.sku.trim().toUpperCase(),
          name: line.name.trim(),
          form,
          purity: line.purity.trim() || "—",
          mg: Number(line.mg) || 0,
          vendorCost: Number(line.vendorCost),
          category: line.category || guessCategory(line.name.trim()),
          vialMl,
          packVials: 10,
          status: "pending",
          submittedAt: new Date().toISOString(),
          reviewedAt: null,
        };
      });

    if (!vendor.name || !vendor.email || lines.length === 0) {
      setFlash("Add vendor details and at least one price-list item");
      return false;
    }

    setVendors((prev) => [vendor, ...prev]);
    setSubmissions((prev) => [...lines, ...prev]);
    setFlash("Price list submitted — waiting for WellPept approval");
    return true;
  }

  function submitPriceListForExisting(vendorId, linesInput) {
    const vendor = vendors.find((v) => v.id === vendorId);
    const autoPublish =
      automation.autoApproveTrustedUpdates && vendor?.status === "approved";
    const now = new Date().toISOString();
    const lines = linesInput
      .filter((line) => line.name.trim() && line.sku.trim() && line.vendorCost)
      .map((line) => {
        const vialMl = Number(line.vialMl) === 10 ? 10 : 3;
        const baseForm = line.form.trim() || "Lyophilized vial";
        const form = /\b\d+\s*ml\b/i.test(baseForm)
          ? baseForm
          : `${baseForm} · ${vialMl}ml`;
        return {
          id: uid("s"),
          vendorId,
          sku: line.sku.trim().toUpperCase(),
          name: line.name.trim(),
          form,
          purity: line.purity.trim() || "—",
          mg: Number(line.mg) || 0,
          vendorCost: Number(line.vendorCost),
          category: line.category || guessCategory(line.name.trim()),
          vialMl,
          packVials: 10,
          status: autoPublish ? "approved" : "pending",
          submittedAt: now,
          reviewedAt: autoPublish ? now : null,
        };
      });

    if (lines.length === 0) {
      setFlash("Add at least one valid line item");
      return false;
    }

    setSubmissions((prev) => [...lines, ...prev]);
    setFlash(
      autoPublish
        ? `${lines.length} line${lines.length === 1 ? "" : "s"} auto-published for ${vendor?.name || "vendor"}`
        : "Updated price list submitted for approval"
    );
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

  function placeOrder(customer, payment = null) {
    if (!cart.length) {
      setFlash("Cart is empty");
      return null;
    }
    if (!isValidUsZip(customer.zip)) {
      setFlash("Enter a valid US ZIP code");
      return null;
    }
    const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
    const shippingByVendor = new Map();
    for (const line of cart) {
      if (!shippingByVendor.has(line.vendorId)) {
        shippingByVendor.set(line.vendorId, Number(line.shippingFlat) || 0);
      }
    }
    let shipping = 0;
    for (const fee of shippingByVendor.values()) shipping += fee;
    const total = subtotal + shipping;
    const packet = buildOrderPacket({
      orderId: createOrderId(),
      customer,
      cart,
      subtotal,
      shipping,
      total,
    });
    if (payment) {
      const provider = payment.provider || "stripe";
      packet.payment = {
        provider,
        paymentIntentId: payment.id || payment.paymentIntentId || "",
        status: payment.status || "succeeded",
        amountCents: payment.amount || null,
        methods:
          provider === "chargebee"
            ? "chargebee_hosted"
            : "card_or_affirm",
      };
      packet.status = "paid";
    }
    setOrders(saveOrder(packet));
    setCart([]);
    setFlash(
      payment
        ? `Payment received · order ${packet.orderId}`
        : `Order ${packet.orderId} queued for drop-ship`
    );
    return packet;
  }

  return (
    <div className={`app-shell ${labUnlocked ? "app-shell--undisclosed" : "app-shell--skincare"}`}>
      <header className="site-header">
        <div className="header-top">
          <div className="container header-top-inner">
            <span className="header-top-msg">
              {labUnlocked
                ? "Undisclosed · Research peptides · US only"
                : "Twist-cap freshness. Dropper beside. US shipping"}
            </span>
            <span className="header-top-links">
              {labUnlocked ? (
                <button type="button" onClick={lockLabMenu}>
                  Exit to WellPept
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("build")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Build your serum
                </button>
              )}
            </span>
          </div>
        </div>

        <div className="container header-inner">
          <button className="brand" onClick={handleBrandClick} type="button">
            <img
              src={labUnlocked ? "/ud-monogram.svg" : "/wp-monogram.svg"}
              alt={labUnlocked ? "Undisclosed" : "WellPept"}
              className="brand-logo"
              width={44}
              height={44}
            />
            <span className="brand-text">
              <span className="brand-mark">
                {labUnlocked ? "Undisclosed" : "WellPept"}
              </span>
              <span className="brand-sub">
                {labUnlocked ? "Research lab" : "Fresh Mix skincare"}
              </span>
            </span>
          </button>

          {labUnlocked ? (
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
          ) : (
            <nav className="header-nav" aria-label="WellPept">
              <button
                type="button"
                className="header-nav-link"
                onClick={() => {
                  setView(VIEWS.skincare);
                  document
                    .getElementById("build")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Build serum
              </button>
              <button
                type="button"
                className="header-nav-link"
                onClick={() => {
                  setView(VIEWS.skincare);
                  document
                    .getElementById("skin-catalog")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Ready
              </button>
              <button
                type="button"
                className="header-nav-link"
                onClick={() =>
                  document
                    .getElementById("ritual")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                How it works
              </button>
              <button
                type="button"
                className="header-nav-link"
                onClick={() =>
                  document
                    .getElementById("contact-wellpept")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Contact
              </button>
            </nav>
          )}

          <div className="header-actions">
            {labUnlocked && (
              <>
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
              </>
            )}
            <button
              type="button"
              className="header-bag"
              onClick={() => setView(VIEWS.cart)}
              aria-label="Open bag"
            >
              <ShoppingCart size={17} />
              <span className="cart-label">{labUnlocked ? "Cart" : "Bag"}</span>
              {cartCount > 0 && (
                <span className={`cart-count ${cartPulse ? "pulse" : ""}`}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {labUnlocked && (
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
        )}
      </header>

      {flash && (
        <div className="container" style={{ paddingTop: "0.85rem" }}>
          <div className="notice fade">{flash}</div>
        </div>
      )}

      <main>
        {view === VIEWS.skincare && (
          <SkincareHome
            chargebeeConfig={chargebeeConfig}
            onShopSkin={() =>
              document
                .getElementById("skin-catalog")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            onOpenProduct={(product) => {
              setSkinProduct(product);
              setView(VIEWS.skinProduct);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onAddToCart={addSkincareToCart}
          />
        )}

        {view === VIEWS.skinProduct && skinProduct && (
          <section className="panel-page fade">
            <div className="container">
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setView(VIEWS.skincare);
                  setSkinProduct(null);
                }}
              >
                <ArrowLeft size={16} /> Back to skincare
              </button>
              <div className="amazon-detail skin-detail" style={{ marginTop: "1rem" }}>
                  <div className="detail-visual skin-visual-col">
                    {skinProduct.image ? (
                      <img
                        src={skinProduct.image}
                        alt={skinProduct.name}
                        className="skin-product-img skin-product-img--detail"
                      />
                    ) : (
                      <div className="skin-bottle skin-bottle--lg" aria-hidden="true">
                        <span className="skin-bottle-cap" />
                        <span className="skin-bottle-body" />
                      </div>
                    )}
                    {skinProduct.gallery?.[1] && skinProduct.gallery[1] !== skinProduct.image && (
                      <img
                        src={skinProduct.gallery[1]}
                        alt="After mixing: peptide activated into the base"
                        className="skin-product-img skin-product-img--howto"
                      />
                    )}
                    {skinProduct.video && (
                      <details className="skin-product-video-wrap">
                        <summary>Watch mix activation</summary>
                        <video
                          className="skin-product-video"
                          controls
                          muted
                          playsInline
                          loop
                          preload="metadata"
                          poster={skinProduct.videoPoster || skinProduct.gallery?.[1]}
                        >
                          <source src={skinProduct.video} type="video/mp4" />
                        </video>
                      </details>
                    )}
                  </div>
                  <div className="detail-info">
                    <p className="section-kicker">{skinProduct.line}</p>
                    <h1>{skinProduct.name}</h1>
                    <p className="lede">{skinProduct.blurb}</p>
                    <p className="meta">
                      {skinProduct.size}. {skinProduct.focus}. {skinProduct.texture}
                    </p>
                    {skinProduct.kind === "mix" && (
                      <div className="mix-panel">
                        <p className="mix-lead">
                          {skinProduct.form === "cream"
                            ? `Dry peptides mix into a leave-on cream vehicle (${skinProduct.mixYield}).`
                            : skinProduct.packaging === "twist-cap"
                              ? `Dry peptide powder lives in the twist-cap. The dropper ships beside the bottle. Seat it after you activate (${skinProduct.mixYield}).`
                              : `Fresh ingredients ship separated. You mix at home (${skinProduct.mixYield}).`}
                          {skinProduct.shelfAfterMix
                            ? ` ${skinProduct.shelfAfterMix}`
                            : ""}
                        </p>
                        {Array.isArray(skinProduct.ingredients) && (
                          <>
                            <h3>In the bottle</h3>
                            <ul className="mix-list">
                              {skinProduct.ingredients.map((ing) => (
                                <li key={ing.name}>
                                  <strong>{ing.name}</strong>
                                  <span>{ing.amount}</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                        {Array.isArray(skinProduct.steps) && (
                          <>
                            <h3>
                              {skinProduct.packaging === "twist-cap"
                                ? "Activate"
                                : "Mix steps"}
                            </h3>
                            <ol className="mix-steps">
                              {skinProduct.steps.map((step) => (
                                <li key={step}>{step}</li>
                              ))}
                            </ol>
                          </>
                        )}
                      </div>
                    )}
                    <div className="price-row" style={{ margin: "1rem 0" }}>
                      <strong style={{ fontSize: "1.4rem" }}>
                        {formatMoney(skinProduct.price)}
                      </strong>
                    </div>
                    {skinProduct.kind === "mix" && skinProduct.legal && (
                      <div className="sk-legal-box sk-legal-box--pdp">
                        <p className="sk-legal-title">Peptide acknowledgment</p>
                        <p>{skinProduct.legal.medium}</p>
                        <ul className="sk-legal-long sk-legal-long--compact">
                          {skinProduct.legal.long.map((line) => (
                            <li key={line.slice(0, 28)}>{line}</li>
                          ))}
                        </ul>
                        <p className="meta">{skinProduct.legal.short}</p>
                      </div>
                    )}
                    <button
                      type="button"
                      className="primary-btn"
                      onClick={() => addSkincareToCart(skinProduct)}
                    >
                      Add to bag
                    </button>
                  </div>
              </div>
            </div>
          </section>
        )}

        {view === VIEWS.shop && labUnlocked && (
          <>
            <div className="lab-banner">
              <div className="container lab-banner-inner">
                <span>Undisclosed · research peptides</span>
                <button type="button" className="ghost-btn" onClick={lockLabMenu}>
                  Exit to WellPept
                </button>
              </div>
            </div>
            <section className="hero hero--undisclosed">
              <div className="hero-media hero-media--undisclosed" />
              <div className="container hero-content">
                <div className="hero-brand-lockup rise">
                  <img
                    src="/ud-monogram.svg"
                    alt="Undisclosed UD mark"
                    className="hero-brand-mark"
                    width={136}
                    height={136}
                  />
                  <h1 className="hero-brand">Undisclosed</h1>
                </div>
                <div className="hero-brand-rule rise-delay" aria-hidden="true" />
                <p className="hero-tagline rise-delay">
                  Research peptides — same compound, clearer path.
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
                    <strong>US shipping only</strong>
                    <p>Drop-ship to United States addresses from approved vendors.</p>
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
                  {bestsellers.map((listing) => (
                    <ProductCard
                      key={`best-${listing.id}`}
                      listing={listing}
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
                  <p className="section-kicker">Why WellPept</p>
                  <h2>Research equivalent. Not retail theater.</h2>
                  <p>
                    If a compound isn’t coming straight from a branded pharmacy
                    line, it’s almost always made in the same research-chemical
                    manufacturing corridors — largely China — then passed through
                    resellers and storefronts. If it{" "}
                    <em>is</em> pharma-sourced, you’re often paying a premium for
                    packaging and distribution of the same active structure.
                    WellPept is the lab’s generic path: approved near-source
                    vendors, documented batches, and a catalog built for the
                    bench — not the brand story.
                  </p>
                </div>
                <ul className="mission-points">
                  <li>
                    <FlaskConical size={18} /> Same compound identity — research
                    purity, not pharmacy branding
                  </li>
                  <li>
                    <ShieldCheck size={18} /> Source closer to manufacture —
                    fewer hands between plant and bench
                  </li>
                  <li>
                    <Microscope size={18} /> Compare COAs &amp; fill data before
                    you commit inventory
                  </li>
                </ul>
              </div>
            </section>

            <section className="section supply-chain" id="supply-chain">
              <div className="container">
                <div className="section-head">
                  <div>
                    <p className="section-kicker">How peptides are made</p>
                    <h2>From source plant to your US lab</h2>
                    <p>
                      Most research peptides follow the same manufacturing path.
                      WellPept sits after QC — connecting approved vendors to
                      your bench without sending you to their storefront.
                    </p>
                  </div>
                </div>

                <ol className="supply-flow">
                  <li className="supply-step">
                    <span className="supply-step-icon" aria-hidden="true">
                      <Factory size={22} />
                    </span>
                    <span className="supply-step-num">1</span>
                    <strong>Synthesis</strong>
                    <p>
                      Sequences are built in research-chemical manufacturing
                      hubs — the same corridors behind most “research” vials.
                    </p>
                  </li>
                  <li className="supply-flow-arrow" aria-hidden="true">
                    <ArrowRight size={20} />
                  </li>
                  <li className="supply-step">
                    <span className="supply-step-icon" aria-hidden="true">
                      <FlaskConical size={22} />
                    </span>
                    <span className="supply-step-num">2</span>
                    <strong>Purify &amp; dry</strong>
                    <p>
                      Crude peptide is purified and lyophilized into stable
                      powder ready for research vials.
                    </p>
                  </li>
                  <li className="supply-flow-arrow" aria-hidden="true">
                    <ArrowRight size={20} />
                  </li>
                  <li className="supply-step">
                    <span className="supply-step-icon" aria-hidden="true">
                      <Package size={22} />
                    </span>
                    <span className="supply-step-num">3</span>
                    <strong>Vial &amp; kit</strong>
                    <p>
                      Powder is filled into vials or kits — strength and pack
                      size set for lab inventory, not pharmacy packaging.
                    </p>
                  </li>
                  <li className="supply-flow-arrow" aria-hidden="true">
                    <ArrowRight size={20} />
                  </li>
                  <li className="supply-step">
                    <span className="supply-step-icon" aria-hidden="true">
                      <Microscope size={22} />
                    </span>
                    <span className="supply-step-num">4</span>
                    <strong>QC / COA</strong>
                    <p>
                      Batches are checked for purity and identity; third-party
                      reports back the claim when available.
                    </p>
                  </li>
                  <li className="supply-flow-arrow" aria-hidden="true">
                    <ArrowRight size={20} />
                  </li>
                  <li className="supply-step">
                    <span className="supply-step-icon" aria-hidden="true">
                      <Truck size={22} />
                    </span>
                    <span className="supply-step-num">5</span>
                    <strong>US drop-ship</strong>
                    <p>
                      You order on WellPept; the approved vendor ships to your
                      US address. Vendor sites stay hidden.
                    </p>
                  </li>
                </ol>

                <div className="supply-example">
                  <div className="supply-example-copy">
                    <p className="section-kicker">Source path example</p>
                    <h3>Tirzepatide kit · research supply</h3>
                    <p>
                      Same active structure whether it arrives via a branded
                      pharmacy lane or a research manufacturer. We list the
                      research path: plant → vial → COA → approved vendor →
                      your lab.
                    </p>
                  </div>
                  <ol className="source-path">
                    <li>
                      <span>Plant</span>
                      Research-chemical synthesis corridor
                    </li>
                    <li>
                      <span>Fill</span>
                      Lyophilized kit at labeled strength
                    </li>
                    <li>
                      <span>Proof</span>
                      Purity / identity documentation
                    </li>
                    <li>
                      <span>Fulfill</span>
                      Vendor drop-ships US-only via WellPept
                    </li>
                  </ol>
                  <ul className="supply-example-notes">
                    <li>
                      <Package size={16} />
                      Featured vendor min order{" "}
                      {formatMoney(THE_LOBSTER_VENDOR.minOrder)}
                    </li>
                    <li>
                      <Truck size={16} />
                      US shipping only · allow up to 4 weeks
                    </li>
                    <li>
                      <ShieldCheck size={16} />
                      You never leave this site to checkout
                    </li>
                  </ul>
                </div>
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
                      research — WellPept makes the source path clear.
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
                      sits between the plant and your lab. We connect approved
                      near-source vendors so you buy closer to manufacture.
                    </p>
                  </article>
                  <article className="thesis-card panel">
                    <p className="section-kicker">Pharma-sourced?</p>
                    <h3>Why pay brand tax for the same compound</h3>
                    <p>
                      When the active is the same sequence or small molecule,
                      the research question is purity, fill, and documentation —
                      not the logo on the box. WellPept lists research-grade
                      equivalents so you can judge the molecule on the bench.
                    </p>
                  </article>
                  <article className="thesis-card panel thesis-card-accent">
                    <p className="section-kicker">WellPept</p>
                    <h3>Your generic research lane</h3>
                    <p>
                      Admin-vetted vendors. Documented kits. US drop-ship only.
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
                    <span className="featured-kicker">Featured vendor</span>
                    <h2>The Lobster</h2>
                    <p>
                      Featured vendor on WellPept. Minimum order{" "}
                      {formatMoney(THE_LOBSTER_VENDOR.minOrder)}. US shipping
                      only — allow up to 4 weeks. Sold only through this
                      catalog; we handle drop-ship.
                    </p>
                    <ul className="featured-meta">
                      <li>
                        Min order {formatMoney(THE_LOBSTER_VENDOR.minOrder)}
                      </li>
                      <li>US shipping only · allow up to 4 weeks</li>
                    </ul>
                    <div className="hero-cta" style={{ marginTop: "0.85rem" }}>
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() => {
                          setQuery("Lobster");
                          setCategory("All");
                          document
                            .getElementById("catalog")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Shop Lobster catalog
                      </button>
                    </div>
                  </div>
                  <div className="featured-vendor-visual">
                    <GeneratedVial
                      name="The Lobster"
                      sku="INTL"
                      mass={10}
                      unit="mg"
                      category="Growth"
                      vialMl={3}
                      form="Lyophilized vial · 3ml"
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
                    {newArrivals.map((listing) => (
                      <ProductCard
                        key={`new-${listing.id}`}
                        listing={listing}
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
                      {query.trim() ? ` for “${query.trim()}”` : ""}. US
                      shipping only.
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
                    {filtered.map((listing) => (
                      <ProductCard
                        key={listing.id}
                        listing={listing}
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
                  <h2>Judge the molecule on the data</h2>
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

            <section className="section research-guide" id="research-guide">
              <div className="container">
                <div className="section-head">
                  <div>
                    <p className="section-kicker">Lab literacy</p>
                    <h2>What to check before you assay</h2>
                    <p>
                      Quick visual and testing cues for lyophilized research
                      peptides — layer these with third-party COAs. For
                      laboratory research use only.
                    </p>
                  </div>
                </div>
                <div className="qc-grid">
                  <article className="panel qc-card">
                    <h3>Looks good</h3>
                    <ul>
                      {LYOPHILIZED_QC.good.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                  <article className="panel qc-card">
                    <h3>Pause / retest</h3>
                    <ul>
                      {LYOPHILIZED_QC.caution.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                  <article className="panel qc-card">
                    <h3>Worth testing</h3>
                    <ul>
                      {LYOPHILIZED_QC.testing.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                </div>
                <div className="glossary-block">
                  <h3>Research glossary</h3>
                  <div className="glossary-grid">
                    {RESEARCH_GLOSSARY.map((g) => (
                      <div key={g.term} className="glossary-item">
                        <strong>{g.term}</strong>
                        <p>{g.def}</p>
                      </div>
                    ))}
                  </div>
                  <p className="meta glossary-credit">
                    Educational reference (unaffiliated):{" "}
                    <a
                      href="https://www.stairwaytogray.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Stairway to Gray
                    </a>{" "}
                    — rewritten here for lab research framing, not medical use.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}

        {view === VIEWS.product && labUnlocked && selectedListing && selectedVariant && (
          <ProductDetail
            listing={selectedListing}
            product={selectedVariant}
            onSelectVariant={setSelectedVariantId}
            onBack={goShop}
            onAdd={() => addToCart(selectedVariant)}
            onCalculate={() => {
              const mass = selectedVariant.mg || 10;
              const dose = mass >= 10 ? 1 : 250;
              const doseUnit = mass >= 10 ? "mg" : "mcg";
              const autoBac = automation.autoSuggestBacFromProduct;
              const bac = autoBac
                ? suggestedBacMl(mass, dose, doseUnit, 10)
                : null;
              setCalcInitial({
                name: selectedVariant.name,
                mass,
                dose,
                doseUnit,
                desiredUnits: 10,
                solution: bac != null ? Number(bac.toFixed(2)) : undefined,
                autoBac,
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
            onPlaceOrder={placeOrder}
            paymentConfig={paymentConfig}
            chargebeeConfig={chargebeeConfig}
          />
        )}

        {view === VIEWS.calculator && labUnlocked && (
          <PeptideCalculator initial={calcInitial} />
        )}

        {view === VIEWS.vendor && labUnlocked && (
          <VendorPortal
            vendors={vendors}
            submissions={submissions}
            autoApproveTrusted={automation.autoApproveTrustedUpdates}
            onApply={submitVendorApplication}
            onSubmitLines={submitPriceListForExisting}
            onUpdateTerms={updateVendorTerms}
          />
        )}

        {view === VIEWS.admin && labUnlocked && (
          <AdminPanel
            vendors={vendors}
            submissions={submissions}
            products={products}
            orders={orders}
            automation={automation}
            onUpdateAutomation={updateAutomation}
            onApproveSubmission={approveSubmission}
            onRejectSubmission={rejectSubmission}
            onApproveVendor={approveVendor}
            onRejectVendor={rejectVendor}
            onApproveAllPending={approveAllPending}
            onApproveAllLines={approveAllPendingLines}
            onRejectAllLines={rejectAllPendingLines}
          />
        )}
      </main>

      <footer className="footer" id="contact">
        <div className="container footer-inner">
          <div>
            <strong>{labUnlocked ? "Undisclosed" : "WellPept"}</strong>
            <div>
              {labUnlocked
                ? "Research peptides for laboratory use"
                : "Fresh Mix skincare. White light, cobalt signal"}
            </div>
            <p className="footer-contact">
              <a href={`mailto:${contactEmail()}`}>{contactEmail()}</a>
              <button
                type="button"
                className="footer-chat-btn"
                onClick={() => {
                  if (!openLiveChat()) {
                    window.location.href = `mailto:${contactEmail()}?subject=WellPept%20question`;
                  }
                }}
              >
                Message us
              </button>
            </p>
          </div>
          <p className="disclaimer">
            {labUnlocked ? (
              <>
                Undisclosed items are for laboratory research use only. Not for human
                consumption, medical use, or household purposes. Ships to United
                States addresses only.
              </>
            ) : (
              <>
                WellPept Fresh Mix products contain topical cosmetic peptides for
                external use on intact skin only. Not for injection, ingestion, or
                medical use. Not evaluated by the FDA. Not intended to diagnose,
                treat, cure, or prevent any disease. Ships to United States
                addresses only. Questions: {contactEmail()}.
              </>
            )}
          </p>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ listing, onOpen, onAdd }) {
  const strengths = listing.strengths?.length
    ? listing.strengths
    : [
        {
          key: "default",
          offers: listing.variants,
          defaultOfferId: listing.defaultVariantId,
          label: formatStrengthLabel(listing.variants[0] || {}),
          lowestPrice: listing.variants[0]?.price ?? null,
          vendorCount: listing.variants.length,
        },
      ];
  const [offerId, setOfferId] = useState(listing.defaultVariantId);

  useEffect(() => {
    setOfferId(listing.defaultVariantId);
  }, [listing.id, listing.defaultVariantId]);

  const strength =
    strengths.find((s) => s.offers.some((o) => o.id === offerId)) ||
    strengths[0];
  const offers = strength?.offers || [];
  const product = offers.find((o) => o.id === offerId) || offers[0];
  const multiStrength = strengths.length > 1;
  const multiVendor = offers.length > 1;
  const listingFrom = [...(listing.variants || [])]
    .filter((v) => v.price != null)
    .sort((a, b) => Number(a.price) - Number(b.price))[0]?.price;

  if (!product) return null;

  return (
    <article className="product-card">
      <button
        type="button"
        className="product-card-main"
        onClick={() => onOpen(listing, product.id)}
      >
        <div className="product-visual">
          {(product.badge || listing.badge) && (
            <span className="badge">{product.badge || listing.badge}</span>
          )}
          <VialPreview product={product} size="md" />
        </div>
        <div className="product-body">
          <div className="meta">
            {listing.category}
            {multiStrength
              ? ` · ${strengths.length} strengths`
              : ` · SKU ${product.sku}`}
            {listing.vendorCount > 1 ? ` · ${listing.vendorCount} vendors` : ""}
          </div>
          <h3>{listing.name}</h3>
          <p className="card-blurb">{listing.blurb || product.blurb}</p>
          <div className="meta">{product.form}</div>
          <div className="meta vial-size-tag">
            {product.vialMl || 3} mL vial
          </div>
          <div className="rating">
            <span className="stars" aria-hidden>
              ★★★★☆
            </span>{" "}
            {listing.rating.toFixed(1)} · {listing.reviews} reviews
          </div>
          <div className="price-row">
            {product.externalOnly || product.price == null ? (
              <span className="price price-external">See options</span>
            ) : (
              <>
                <span className="price">{formatMoney(product.price)}</span>
                {listingFrom != null && listing.variants.length > 1 && (
                  <span className="price-from">
                    from {formatMoney(listingFrom)}
                  </span>
                )}
              </>
            )}
          </div>
          <div className="meta sold-by">Sold by {product.vendor}</div>
        </div>
      </button>

      {multiStrength && (
        <label className="strength-field" onClick={(e) => e.stopPropagation()}>
          <span>Strength</span>
          <select
            value={strength.key}
            onChange={(e) => {
              const next = strengths.find((s) => s.key === e.target.value);
              if (next) setOfferId(next.defaultOfferId);
            }}
            aria-label={`${listing.name} strength`}
          >
            {strengths.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
                {s.lowestPrice == null ? "" : ` · from ${formatMoney(s.lowestPrice)}`}
                {s.vendorCount > 1 ? ` · ${s.vendorCount} vendors` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      {multiVendor && (
        <label className="strength-field" onClick={(e) => e.stopPropagation()}>
          <span>Vendor</span>
          <select
            value={product.id}
            onChange={(e) => setOfferId(e.target.value)}
            aria-label={`${listing.name} vendor`}
          >
            {offers.map((o) => (
              <option key={o.id} value={o.id}>
                {formatVendorOfferLabel(o)}
              </option>
            ))}
          </select>
        </label>
      )}

      <PriceCompare
        listing={listing}
        product={product}
        onSelect={setOfferId}
        defaultOpen={false}
        defaultScope={listing.vendorCount > 1 ? "all" : "strength"}
        compact
      />

      <button
        type="button"
        className="cart-cta"
        disabled={product.price == null}
        onClick={(e) => {
          e.stopPropagation();
          onAdd(product);
        }}
      >
        Add to cart
      </button>
    </article>
  );
}

function ProductDetail({
  listing,
  product,
  onSelectVariant,
  onBack,
  onAdd,
  onCalculate,
}) {
  const strengths = listing.strengths?.length
    ? listing.strengths
    : [
        {
          key: "default",
          offers: listing.variants,
          defaultOfferId: listing.defaultVariantId,
          label: formatStrengthLabel(product),
          lowestPrice: product?.price ?? null,
          vendorCount: listing.variants.length,
        },
      ];
  const strength =
    strengthForProduct(listing, product) ||
    strengths.find((s) => s.offers.some((o) => o.id === product.id)) ||
    strengths[0];
  const offers = strength?.offers || [product];
  const multiStrength = strengths.length > 1;
  const multiVendor = offers.length > 1;
  const listingFrom = [...(listing.variants || [])]
    .filter((v) => v.price != null)
    .sort((a, b) => Number(a.price) - Number(b.price))[0]?.price;

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
              {listing.category} · SKU {product.sku}
              {listing.vendorCount > 1
                ? ` · ${listing.vendorCount} vendors`
                : ""}
            </div>
            <h1>{listing.name}</h1>
            <div className="rating">
              <span className="stars">★★★★☆</span> {listing.rating.toFixed(1)} ·{" "}
              {listing.reviews} ratings
            </div>
            <div className="detail-summary">
              <h2 className="detail-summary-label">Summary</h2>
              <p className="detail-blurb">{listing.blurb || product.blurb}</p>
            </div>
            {researchHelpFor(listing.name || product.name) && (
              <p className="detail-help">
                <strong>Research focus: </strong>
                {researchHelpFor(listing.name || product.name)}
              </p>
            )}
            <p className="detail-research-note">
              For laboratory research use only. Not for human consumption,
              medical use, or household purposes.
            </p>
            <div className="meta">
              {product.form} · Purity {product.purity}
            </div>
            <div className="meta sold-by">
              Sold by <strong>{product.vendor}</strong> · US shipping via
              WellPept marketplace
            </div>

            <div className="detail-compare">
              <h2 className="detail-summary-label">Compare prices</h2>
              <PriceCompare
                listing={listing}
                product={product}
                onSelect={onSelectVariant}
                defaultOpen
                defaultScope="all"
              />
            </div>
          </div>
          <div className="buy-box panel">
            {multiStrength && (
              <label className="strength-field">
                <span>Strength</span>
                <select
                  value={strength.key}
                  onChange={(e) => {
                    const next = strengths.find((s) => s.key === e.target.value);
                    if (next) onSelectVariant(next.defaultOfferId);
                  }}
                  aria-label="Select strength"
                >
                  {strengths.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                      {s.lowestPrice == null
                        ? ""
                        : ` · from ${formatMoney(s.lowestPrice)}`}
                      {s.vendorCount > 1 ? ` · ${s.vendorCount} vendors` : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {multiVendor && (
              <label className="strength-field">
                <span>Vendor</span>
                <select
                  value={product.id}
                  onChange={(e) => onSelectVariant(e.target.value)}
                  aria-label="Select vendor"
                >
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>
                      {formatVendorOfferLabel(o)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <>
              <div className="price-row">
                <span className="price">{formatMoney(product.price)}</span>
                {listingFrom != null && listing.variants.length > 1 && (
                  <span className="price-from">
                    from {formatMoney(listingFrom)}
                  </span>
                )}
              </div>
              <div className="meta">
                {formatStrengthLabel(product)} · per {product.unitLabel}
              </div>
              <div className="buy-stock ok">In Stock</div>
              <button type="button" className="cart-cta" onClick={onAdd}>
                Add to cart
              </button>
              <button type="button" className="primary-btn" onClick={onAdd}>
                Buy now
              </button>
            </>
            <div className="meta">
              <Truck size={14} style={{ display: "inline", marginRight: 6 }} />
              {product.ships}
              <>
                . Shipping {formatMoney(product.shippingFlat)}
                {product.shippingNote ? ` · ${product.shippingNote}` : ""}
              </>
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

function CartPage({
  cart,
  onBack,
  onUpdateQty,
  onRemove,
  onPlaceOrder,
  paymentConfig = { enabled: false, publishableKey: null },
  chargebeeConfig = { enabled: false },
}) {
  const paymentsReady = Boolean(
    (paymentConfig?.enabled && paymentConfig?.publishableKey) ||
      chargebeeConfig?.enabled
  );
  const useStripe = Boolean(
    paymentConfig?.enabled && paymentConfig?.publishableKey
  );
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
  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
  });
  const [step, setStep] = useState("shipping"); // shipping | pay | done
  const [draftOrderId, setDraftOrderId] = useState("");
  const [packet, setPacket] = useState(null);
  const [packetMsg, setPacketMsg] = useState("");

  function finalizePacket(next, note) {
    setPacket(next);
    setStep("done");
    const text = formatOrderPacketText(next);
    try {
      navigator.clipboard.writeText(text);
      setPacketMsg(note || "Drop-ship packet copied.");
    } catch {
      setPacketMsg(note || "Download the packet below.");
    }
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${next.orderId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleShippingContinue(e) {
    e.preventDefault();
    if (minOrderWarnings.length) {
      setPacketMsg("Meet each vendor minimum before checkout.");
      return;
    }
    if (!isValidUsZip(customer.zip)) {
      setPacketMsg("Enter a valid US ZIP code");
      return;
    }
    setDraftOrderId(createOrderId());
    setPacketMsg("");
    if (paymentsReady) {
      setStep("pay");
      return;
    }
    // Offline fallback when payment providers are not configured
    const next = onPlaceOrder?.(customer);
    if (!next) return;
    finalizePacket(next, "Order queued (payments offline) · packet copied.");
  }

  function handlePaid(paymentIntent) {
    const next = onPlaceOrder?.(customer, paymentIntent);
    if (!next) return;
    finalizePacket(next, "Payment received · drop-ship packet copied.");
  }

  function handleOfflineQueue() {
    const next = onPlaceOrder?.(customer);
    if (!next) return;
    finalizePacket(next, "Order queued without card charge · packet copied.");
  }

  return (
    <section className="panel-page fade">
      <div className="container">
        <button type="button" className="ghost-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Continue shopping
        </button>
        <div className="panel" style={{ marginTop: "1rem" }}>
          <h1>Cart</h1>
          <p className="lede">
            US shipping only. Pay by card or Affirm
            {useStripe
              ? " through Stripe"
              : chargebeeConfig?.enabled
                ? " through Chargebee"
                : ""}{" "}
            — then we auto-build the vendor drop-ship packet.
          </p>

          {cart.length === 0 && !packet ? (
            <div className="empty-state">Your cart is empty.</div>
          ) : (
            <>
              {cart.length > 0 && (
                <div className="cart-list">
                  {cart.map((line) => (
                    <div className="cart-item" key={line.id}>
                      <div className="cart-thumb">
                        <VialPreview product={line} size="sm" />
                      </div>
                      <div>
                        <strong>{line.name}</strong>
                        <div className="meta">
                          {formatStrengthLabel(line)} · {line.form} ·{" "}
                          {line.vendor}
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
              )}

              {minOrderWarnings.length > 0 && (
                <div className="notice warn" style={{ marginTop: "1rem" }}>
                  {minOrderWarnings.join(" · ")}
                </div>
              )}

              {cart.length > 0 && step === "shipping" && (
                <form className="checkout-form" onSubmit={handleShippingContinue}>
                  <h2>US shipping</h2>
                  <div className="form-row">
                    <label className="field">
                      Full name
                      <input
                        required
                        value={customer.name}
                        onChange={(e) =>
                          setCustomer((c) => ({ ...c, name: e.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      Email
                      <input
                        required
                        type="email"
                        value={customer.email}
                        onChange={(e) =>
                          setCustomer((c) => ({ ...c, email: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                  <label className="field">
                    Address
                    <input
                      required
                      value={customer.address1}
                      onChange={(e) =>
                        setCustomer((c) => ({ ...c, address1: e.target.value }))
                      }
                      placeholder="Street address"
                    />
                  </label>
                  <label className="field">
                    Address line 2
                    <input
                      value={customer.address2}
                      onChange={(e) =>
                        setCustomer((c) => ({ ...c, address2: e.target.value }))
                      }
                      placeholder="Apt, suite (optional)"
                    />
                  </label>
                  <div className="form-row form-row--3">
                    <label className="field">
                      City
                      <input
                        required
                        value={customer.city}
                        onChange={(e) =>
                          setCustomer((c) => ({ ...c, city: e.target.value }))
                        }
                      />
                    </label>
                    <label className="field">
                      State
                      <input
                        required
                        maxLength={2}
                        value={customer.state}
                        onChange={(e) =>
                          setCustomer((c) => ({
                            ...c,
                            state: e.target.value.toUpperCase(),
                          }))
                        }
                        placeholder="CA"
                      />
                    </label>
                    <label className="field">
                      ZIP
                      <input
                        required
                        value={customer.zip}
                        onChange={(e) =>
                          setCustomer((c) => ({ ...c, zip: e.target.value }))
                        }
                        placeholder="90210"
                        pattern="\d{5}(-\d{4})?"
                      />
                    </label>
                  </div>
                  <label className="field">
                    Phone (optional)
                    <input
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer((c) => ({ ...c, phone: e.target.value }))
                      }
                    />
                  </label>

                  <div className="cart-summary">
                    <div className="summary-row">
                      <span>Subtotal</span>
                      <span>{formatMoney(subtotal)}</span>
                    </div>
                    <div className="summary-row">
                      <span>US shipping (by vendor)</span>
                      <span>{formatMoney(shipping)}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total</span>
                      <span>{formatMoney(total)}</span>
                    </div>
                    <button type="submit" className="primary-btn">
                      {paymentsReady
                        ? useStripe
                          ? "Continue to card / Affirm"
                          : "Continue to Chargebee"
                        : "Place order · auto drop-ship packet"}
                    </button>
                    {!paymentsReady && (
                      <p className="meta" style={{ marginTop: "0.65rem" }}>
                        Stripe keys not configured yet — orders queue offline.
                        Add <code>VITE_STRIPE_PUBLISHABLE_KEY</code> and{" "}
                        <code>STRIPE_SECRET_KEY</code> from your Stripe sandbox.
                      </p>
                    )}
                    {packetMsg && (
                      <div className="notice warn" style={{ marginTop: "0.75rem" }}>
                        {packetMsg}
                      </div>
                    )}
                  </div>
                </form>
              )}

              {cart.length > 0 && step === "pay" && (
                <div className="checkout-form">
                  <div className="checkout-step-bar">
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => setStep("shipping")}
                    >
                      <ArrowLeft size={16} /> Edit shipping
                    </button>
                    <div className="cart-summary" style={{ marginTop: 0, borderTop: 0, paddingTop: 0 }}>
                      <div className="summary-row total">
                        <span>Total due</span>
                        <span>{formatMoney(total)}</span>
                      </div>
                    </div>
                  </div>

                  {useStripe ? (
                    <CheckoutPayment
                      publishableKey={paymentConfig.publishableKey}
                      total={total}
                      orderId={draftOrderId}
                      customer={customer}
                      onPaid={handlePaid}
                      onError={(err) =>
                        setPacketMsg(err?.message || "Payment error")
                      }
                    />
                  ) : chargebeeConfig?.enabled ? (
                    <ChargebeeCheckout
                      config={chargebeeConfig}
                      mode="cart"
                      total={total}
                      shippingCents={Math.round(Number(shipping) * 100)}
                      orderId={draftOrderId}
                      customer={customer}
                      lines={cart}
                      onPaid={handlePaid}
                      onError={(err) =>
                        setPacketMsg(err?.message || "Payment error")
                      }
                    />
                  ) : null}

                  <button
                    type="button"
                    className="soft-btn"
                    style={{ marginTop: "0.75rem" }}
                    onClick={handleOfflineQueue}
                  >
                    Queue without payment (ops fallback)
                  </button>
                  {packetMsg && (
                    <div className="notice warn" style={{ marginTop: "0.75rem" }}>
                      {packetMsg}
                    </div>
                  )}
                </div>
              )}

              {packet && (
                <div className="notice ok" style={{ marginTop: "1rem" }}>
                  <strong>{packet.orderId}</strong>
                  {packet.payment?.paymentIntentId
                    ? ` · paid via ${
                        packet.payment.provider === "chargebee"
                          ? "Chargebee"
                          : "Stripe"
                      } (${packet.payment.status})`
                    : " · queued"}
                  {packetMsg ? ` · ${packetMsg}` : ""}
                  <pre className="order-packet-preview">
                    {formatOrderPacketText(packet)}
                  </pre>
                </div>
              )}
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
    form: "Lyophilized vial · 3ml",
    purity: "99%",
    mg: "",
    vendorCost: "",
    category: "Research",
    vialMl: "3",
  };
}

function VendorPortal({
  vendors,
  submissions,
  autoApproveTrusted = true,
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
    shippingNote: "US cold-pack ground",
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
            Drop an Excel sheet, PDF, or CSV — we auto-fill your price list.
            Review the rows, fix anything off, then submit. US shipping only.
          </p>

          <div className="notice">
            Best results: columns like Product / Name, Strength (mg), and Price /
            Cost. PDF needs selectable text (not a scanned image).
            {autoApproveTrusted
              ? " Approved vendors: price-list updates auto-publish to the catalog."
              : " All price-list updates still need admin approval."}
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
                    shippingNote: "US cold-pack ground",
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
                  placeholder="US only · cold-pack, ground, etc."
                />
              </label>

              <h2 className="vendor-section-title">Price list</h2>
              <PriceListDropzone
                onParsed={(lines) =>
                  setForm((f) => ({
                    ...f,
                    lines: lines.length ? lines : [emptyLine()],
                  }))
                }
              />

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
                <PriceListDropzone
                  onParsed={(lines) =>
                    setExistingLines(lines.length ? lines : [emptyLine()])
                  }
                />
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
                  {autoApproveTrusted &&
                  vendors.find((v) => v.id === existingVendorId)?.status ===
                    "approved"
                    ? "Publish price list update"
                    : "Submit price list update"}
                </button>
              </div>

              <div>
                <h2>Your recent submissions</h2>
                <p className="lede">Status updates after WellPept review.</p>
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

  const filled = lines.filter(
    (l) => l.name?.trim() && l.sku?.trim() && l.vendorCost
  ).length;

  return (
    <div className="form-grid">
      <div className="price-review-head">
        <div>
          <strong>Review auto-filled lines</strong>
          <p className="meta">
            {filled} ready · {lines.length} row{lines.length === 1 ? "" : "s"} —
            edit anything before submit.
          </p>
        </div>
        <button
          type="button"
          className="soft-btn"
          onClick={() => onChange([...lines, emptyLine()])}
        >
          <Plus size={14} /> Add blank row
        </button>
      </div>
      {lines.map((line, index) => (
        <div
          key={index}
          className="panel price-line-card"
          style={{ padding: "0.9rem", boxShadow: "none" }}
        >
          <div className="price-line-top">
            <span className="meta">Line {index + 1}</span>
            {lines.length > 1 && (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => onChange(lines.filter((_, i) => i !== index))}
              >
                <X size={14} /> Remove
              </button>
            )}
          </div>
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
              Vial size
              <select
                value={line.vialMl === "10" || line.vialMl === 10 ? "10" : "3"}
                onChange={(e) => {
                  const vialMl = e.target.value;
                  const base = String(line.form || "Lyophilized vial").replace(
                    /\s*·\s*\d+\s*ml/gi,
                    ""
                  );
                  onChange(
                    lines.map((row, i) =>
                      i === index
                        ? {
                            ...row,
                            vialMl,
                            form: `${base} · ${vialMl}ml`,
                          }
                        : row
                    )
                  );
                }}
              >
                <option value="3">3 mL (standard)</option>
                <option value="10">10 mL</option>
              </select>
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
          <label className="field" style={{ marginTop: "0.5rem" }}>
            Form / pack note
            <input
              value={line.form}
              onChange={(e) => updateLine(index, "form", e.target.value)}
              placeholder="Lyophilized vial · 10mg*10vials · 3ml"
            />
          </label>
          <div className="meta" style={{ marginTop: "0.35rem" }}>
            Catalog price after approval:{" "}
            {line.vendorCost
              ? formatMoney(retailFromVendor(line.vendorCost))
              : "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminPanel({
  vendors,
  submissions,
  products,
  orders = [],
  automation,
  onUpdateAutomation,
  onApproveSubmission,
  onRejectSubmission,
  onApproveVendor,
  onRejectVendor,
  onApproveAllPending,
  onApproveAllLines,
  onRejectAllLines,
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
            New vendors stay human-gated. Everything else can run on autopilot —
            bulk approve, trusted updates, and queued drop-ship orders.
          </p>

          <div className="notice warn">
            {pendingVendors.length} vendor
            {pendingVendors.length === 1 ? "" : "s"} and {pendingItems.length}{" "}
            price-list line{pendingItems.length === 1 ? "" : "s"} awaiting
            review · {products.length} live products · {orders.length} queued
            order{orders.length === 1 ? "" : "s"}
          </div>

          <div className="automation-bar">
            <h2>Automation</h2>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={Boolean(automation?.autoApproveTrustedUpdates)}
                onChange={(e) =>
                  onUpdateAutomation?.({
                    autoApproveTrustedUpdates: e.target.checked,
                  })
                }
              />
              <span>
                Auto-publish price-list updates from already-approved vendors
              </span>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={Boolean(automation?.approveVendorPublishesLines)}
                onChange={(e) =>
                  onUpdateAutomation?.({
                    approveVendorPublishesLines: e.target.checked,
                  })
                }
              />
              <span>Approving a vendor also publishes their pending lines</span>
            </label>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={Boolean(automation?.autoSuggestBacFromProduct)}
                onChange={(e) =>
                  onUpdateAutomation?.({
                    autoSuggestBacFromProduct: e.target.checked,
                  })
                }
              />
              <span>Auto-fill BAC water when opening calculator from a product</span>
            </label>
            <div className="row-actions" style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                className="primary-btn"
                disabled={
                  pendingVendors.length === 0 && pendingItems.length === 0
                }
                onClick={onApproveAllPending}
              >
                <Check size={16} /> Approve all pending
              </button>
              <button
                type="button"
                className="soft-btn"
                disabled={pendingItems.length === 0}
                onClick={onApproveAllLines}
              >
                Approve all lines
              </button>
              <button
                type="button"
                className="danger-btn"
                disabled={pendingItems.length === 0}
                onClick={onRejectAllLines}
              >
                <X size={16} /> Reject all lines
              </button>
            </div>
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
                            {automation?.approveVendorPublishesLines
                              ? " + lines"
                              : ""}
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
                          {formatMoney(retailFromVendor(s.vendorCost))}
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

          <h2>Queued drop-ship orders</h2>
          <div className="table-wrap" style={{ marginBottom: "1.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Shipments</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No orders queued yet.</td>
                  </tr>
                ) : (
                  orders.slice(0, 20).map((o) => (
                    <tr key={o.orderId}>
                      <td>
                        <strong>{o.orderId}</strong>
                        <div className="meta">
                          {new Date(o.createdAt).toLocaleString()}
                        </div>
                      </td>
                      <td>
                        {o.customer?.name}
                        <div className="meta">{o.customer?.email}</div>
                      </td>
                      <td>
                        {o.shipments?.length || 0} vendor
                        {(o.shipments?.length || 0) === 1 ? "" : "s"}
                      </td>
                      <td>{formatMoney(o.totals?.total || 0)}</td>
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
