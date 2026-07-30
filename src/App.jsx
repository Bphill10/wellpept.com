import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  formatStrengthSelectLabel,
  formatVendorOfferLabel,
  displayVendorName,
  groupCatalog,
  guessCategory,
  retailFromVendor,
  strengthForProduct,
  resolveVialMl,
  resolveVialUnit,
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
  createOrderId,
  isValidUsZip,
  loadOrders,
  saveOrder,
  markOrderPaid,
  buildStripePayUrl,
  parseStripePayPayload,
  notifyOrderRequest,
  defaultsFromCatalogSelection,
} from "./utils/automation";
import { fetchChargebeeConfig } from "./utils/chargebeeClient";
import { fetchPaymentConfig } from "./utils/payments";
import CheckoutPayment from "./components/CheckoutPayment";
import ManualPayMethods from "./components/ManualPayMethods";
import {
  loadManualPayConfig,
  saveManualPayConfig,
  formatManualPayText,
  manualPayConfigured,
} from "./utils/manualPayments";
import {
  getCoaMeta,
  setCoaUrl,
  clearCoaUrl,
} from "./utils/coaStore";
import PeptideCalculator, {
  parseCalculatorQuery,
} from "./components/PeptideCalculator";
import GeneratedVial from "./components/GeneratedVial";
import SkincareHome from "./components/SkincareHome";
import ChannelTuneOverlay from "./components/ChannelTuneOverlay";
import PriceListDropzone from "./components/PriceListDropzone";
import PriceCompare from "./components/PriceCompare";
import LiveChat, { openLiveChat, contactEmail } from "./components/LiveChat";
import AuthGate from "./components/AuthGate";
import { getSession, logout as logoutAccount } from "./utils/auth";
import { THE_LOBSTER_VENDOR } from "./data/theLobster";
import {
  LYOPHILIZED_QC,
  RESEARCH_GLOSSARY,
  researchHelpFor,
} from "./data/researchGuide";
import {
  setLabUnlocked,
  labUnlockFromUrl,
  labUnlockFromPath,
  cleanLabUnlockUrl,
  cleanPublicEntryUrl,
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
    if (product.image) {
      return (
        <div className={`skin-bottle-preview skin-bottle-preview--${size} skin-bottle-preview--photo`}>
          <img src={product.image} alt="" className="skin-cart-thumb" />
        </div>
      );
    }
    return (
      <div className={`skin-bottle-preview skin-bottle-preview--${size}`}>
        <div className="skin-bottle" aria-hidden="true">
          <span className="skin-bottle-cap" />
          <span className="skin-bottle-body" />
        </div>
      </div>
    );
  }
  // Plain studio vial — no wrap label
  return (
    <GeneratedVial
      name={product.name}
      mass={product.mg}
      unit={product.unit || "mg"}
      sku={product.sku || ""}
      category={product.category}
      subtitle={product.form}
      form={product.form}
      vialMl={product.vialMl}
      productId={product.id}
      coaUrl={product.coaUrl || ""}
      size={size}
      showDownload={showDownload}
      showLabel={false}
      catalogTemplate
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

  const urlWantsLabQuery = useMemo(
    () =>
      // Query/hash only — pathname is tracked via routePath so Exit can clear it.
      labUnlockFromUrl(
        window.location.search,
        window.location.hash,
        "/"
      ),
    []
  );
  // Public `/` always starts as WellPept. Do not restore Undisclosed from
  // localStorage (that made search/home reopen the lab after testing).
  // Unlock only via /undisclosed path, query/hash, or the 5-tap ritual.
  const [labUnlocked, setLabUnlockedState] = useState(
    () =>
      urlWantsLabQuery ||
      labUnlockFromPath(
        typeof window !== "undefined" ? window.location.pathname : "/"
      )
  );
  const [routePath, setRoutePath] = useState(
    () => (typeof window !== "undefined" ? window.location.pathname : "/")
  );
  const onUndisclosedRoute = labUnlockFromPath(routePath);
  const labVisible = labUnlocked || onUndisclosedRoute;
  const [logoClicks, setLogoClicks] = useState([]);
  const logoClicksRef = useRef([]);
  const lastBrandTapRef = useRef(0);
  const [channelTuning, setChannelTuning] = useState(false);
  const channelTuneLockRef = useRef(false);
  const [skinProduct, setSkinProduct] = useState(null);
  const [view, setView] = useState(() => {
    const openLab =
      urlWantsLabQuery ||
      labUnlockFromPath(
        typeof window !== "undefined" ? window.location.pathname : "/"
      );
    if (calcFromUrl && openLab) return VIEWS.calculator;
    if (openLab) return VIEWS.shop;
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
  const [chargebeeConfig, setChargebeeConfig] = useState({
    enabled: false,
    site: null,
    publishableKey: null,
    skincarePlanPriceId: null,
  });
  const [stripeConfig, setStripeConfig] = useState({
    enabled: false,
    publishableKey: null,
  });
  const [payInvoice, setPayInvoice] = useState(null);
  const [session, setSession] = useState(() => getSession());
  const [showAuth, setShowAuth] = useState(false);
  const [opsUnlocked, setOpsUnlocked] = useState(() => {
    try {
      return localStorage.getItem("wellpept_ops_v1") === "1";
    } catch {
      return false;
    }
  });

  function updateAutomation(patch) {
    setAutomation((prev) => saveAutomationSettings({ ...prev, ...patch }));
  }

  function handleLogout() {
    logoutAccount();
    setSession(null);
    setFlash("Signed out");
  }

  useEffect(() => {
    const syncRoute = () =>
      setRoutePath(
        typeof window !== "undefined" ? window.location.pathname : "/"
      );
    syncRoute();
    window.addEventListener("popstate", syncRoute);
    return () => window.removeEventListener("popstate", syncRoute);
  }, []);

  useLayoutEffect(() => {
    if (!onUndisclosedRoute) return;
    setLabUnlocked(true);
    setLabUnlockedState(true);
    setView((current) =>
      current === VIEWS.skincare || current === VIEWS.skinProduct
        ? VIEWS.shop
        : current
    );
  }, [onUndisclosedRoute]);

  useEffect(() => {
    fetchChargebeeConfig().then(setChargebeeConfig);
    fetchPaymentConfig().then(setStripeConfig);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get("view");
    const cb = params.get("cb");
    const payRaw = params.get("pay");
    if (payRaw) {
      const parsed = parseStripePayPayload(payRaw);
      if (parsed) {
        setPayInvoice(parsed);
        setView(VIEWS.cart);
      }
    }
    if (viewParam === "cart" || cb === "success" || cb === "cancel") {
      setView(VIEWS.cart);
    }
    if (params.get("ops") === "1") {
      try {
        localStorage.setItem("wellpept_ops_v1", "1");
      } catch {
        /* ignore */
      }
      setOpsUnlocked(true);
    }
    if (cb === "success") {
      setFlash("Chargebee return noted — confirm supply before taking payment.");
    } else if (cb === "cancel") {
      setFlash("Chargebee checkout canceled");
    }
    if (cb || viewParam === "cart" || payRaw) {
      const url = new URL(window.location.href);
      url.searchParams.delete("cb");
      // Keep pay payload in URL until paid so refresh still works; strip view only
      url.searchParams.delete("view");
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  useEffect(() => {
    if (!urlWantsLabQuery) return;
    setLabUnlocked(true);
    setLabUnlockedState(true);
    cleanLabUnlockUrl({ promotePath: true });
    setRoutePath(
      typeof window !== "undefined" ? window.location.pathname : "/undisclosed"
    );
    setFlash("Undisclosed unlocked");
  }, [urlWantsLabQuery]);

  // Landing on public `/` clears any leftover unlock flag from prior testing.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = window.location.pathname || "/";
    if (labUnlockFromPath(path) || urlWantsLabQuery) return;
    setLabUnlocked(false);
  }, [urlWantsLabQuery]);

  useEffect(() => {
    if (labVisible) return;
    if (
      view === VIEWS.shop ||
      view === VIEWS.product ||
      view === VIEWS.vendor ||
      view === VIEWS.admin ||
      view === VIEWS.calculator
    ) {
      setView(VIEWS.skincare);
    }
  }, [labVisible, view]);

  useEffect(() => {
    if (opsUnlocked) return;
    if (view === VIEWS.vendor || view === VIEWS.admin) {
      setView(labVisible ? VIEWS.shop : VIEWS.skincare);
    }
  }, [opsUnlocked, view, labVisible]);

  function unlockLabMenu(message = "Undisclosed unlocked", { flashMsg = true } = {}) {
    setLabUnlocked(true);
    setLabUnlockedState(true);
    cleanLabUnlockUrl({ promotePath: true });
    // replaceState does not fire popstate — keep routePath in sync
    setRoutePath(
      typeof window !== "undefined" ? window.location.pathname : "/undisclosed"
    );
    if (flashMsg && message) setFlash(message);
    setView(VIEWS.shop);
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  /** Swap to Undisclosed while CRT overlay still covers the screen. */
  function revealDuringChannelTune() {
    unlockLabMenu("", { flashMsg: false });
  }

  function finishChannelTune() {
    channelTuneLockRef.current = false;
    setChannelTuning(false);
    setFlash("Undisclosed unlocked");
  }

  function startChannelTuneUnlock() {
    if (channelTuneLockRef.current || channelTuning || labVisible) return;
    channelTuneLockRef.current = true;
    setChannelTuning(true);
  }

  function lockLabMenu() {
    setLabUnlocked(false);
    setLabUnlockedState(false);
    cleanPublicEntryUrl();
    // replaceState does not fire popstate — clear Undisclosed route or
    // labVisible stays true and the layout effect re-opens the lab.
    setRoutePath("/");
    setView(VIEWS.skincare);
    setSelectedId(null);
    setSelectedVariantId(null);
    setFlash("Back to WellPept skincare");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleBrandActivate(e) {
    // Prefer pointer events so phone taps and mouse clicks both count once.
    if (e?.type === "pointerup" && e.button != null && e.button !== 0) return;
    if (e?.pointerType === "touch" || e?.pointerType === "pen") {
      e.preventDefault?.();
    }

    const now = Date.now();
    // Ignore ghost duplicate events within 40ms (some devices fire both).
    if (now - lastBrandTapRef.current < 40) return;
    lastBrandTapRef.current = now;

    if (!labUnlocked) {
      // Ref keeps a reliable count during rapid phone taps (state can lag).
      const next = [...logoClicksRef.current, now].filter((t) => now - t < 6000);
      logoClicksRef.current = next;
      setLogoClicks(next);
      if (next.length >= 5) {
        logoClicksRef.current = [];
        setLogoClicks([]);
        startChannelTuneUnlock();
        return;
      }
      // Stay on skincare without thrashing navigation on every tap.
      if (view !== VIEWS.skincare || skinProduct) {
        setView(VIEWS.skincare);
        setSkinProduct(null);
      }
      return;
    }
    goShop();
  }

  function handleBrandClick(e) {
    // Fallback for browsers without PointerEvent; skip if pointer already handled.
    if (typeof window !== "undefined" && window.PointerEvent) return;
    handleBrandActivate(e);
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
      category: product.kind === "mix" ? "Renew" : "Skincare",
      skin: true,
      mix: product.kind === "mix",
      image: product.image || "",
      ships: "Up to 4 weeks after payment",
      legalNote:
        product.kind === "mix"
          ? "Cosmetic skincare only. Not for injection or medical use."
          : undefined,
    });
    setFlash(
      product.kind === "mix"
        ? `Added ${product.name} (request only — no payment yet)`
        : `Added ${product.name} (request only — no payment yet)`
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
        .sort((a, b) => {
          const reviewDiff = (Number(b.reviews) || 0) - (Number(a.reviews) || 0);
          if (reviewDiff !== 0) return reviewDiff;
          if (Boolean(b.featured) !== Boolean(a.featured)) {
            return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
          }
          return a.name.localeCompare(b.name);
        })
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
    setView(labVisible ? VIEWS.shop : VIEWS.skincare);
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
      setFlash(`${product.name} added (request only — no payment yet)`);
    } else {
      const strength = formatStrengthLabel(product);
      setFlash(`${product.name} (${strength}) added (request only — no payment yet)`);
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
        const name = line.name.trim();
        const vialMl = resolveVialMl({ name, form: line.form });
        const unit = resolveVialUnit({ name, form: line.form, unit: line.unit });
        const baseForm = line.form.trim() || "Lyophilized vial";
        const form = /\b\d+\s*ml\b/i.test(baseForm)
          ? baseForm.replace(/\b\d+(?:\.\d+)?\s*ml\b/gi, `${vialMl}ml`)
          : `${baseForm} · ${vialMl}ml`;
        return {
          id: uid("s"),
          vendorId,
          sku: line.sku.trim().toUpperCase(),
          name,
          form,
          purity: line.purity.trim() || "—",
          mg: Number(line.mg) || 0,
          unit,
          vendorCost: Number(line.vendorCost),
          category: line.category || guessCategory(name),
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
        const name = line.name.trim();
        const vialMl = resolveVialMl({ name, form: line.form });
        const unit = resolveVialUnit({ name, form: line.form, unit: line.unit });
        const baseForm = line.form.trim() || "Lyophilized vial";
        const form = /\b\d+\s*ml\b/i.test(baseForm)
          ? baseForm.replace(/\b\d+(?:\.\d+)?\s*ml\b/gi, `${vialMl}ml`)
          : `${baseForm} · ${vialMl}ml`;
        return {
          id: uid("s"),
          vendorId,
          sku: line.sku.trim().toUpperCase(),
          name,
          form,
          purity: line.purity.trim() || "—",
          mg: Number(line.mg) || 0,
          unit,
          vendorCost: Number(line.vendorCost),
          category: line.category || guessCategory(name),
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

  function handleStripePaid(orderId, payment) {
    const provider = payment?.provider || "stripe";
    let updated = markOrderPaid(orderId, {
      ...payment,
      provider,
    });
    if (!updated && payInvoice?.orderId === orderId) {
      updated = {
        orderId,
        createdAt: new Date().toISOString(),
        status: "paid",
        paymentDue: null,
        paidAt: new Date().toISOString(),
        customer: payInvoice.customer,
        totals: {
          subtotal: payInvoice.total,
          shipping: 0,
          total: payInvoice.total,
        },
        shipments: [],
        notes: `Paid via ${provider}`,
        payment: {
          provider,
          paymentIntentId: payment.id || payment.paymentIntentId || "",
          status: payment.status || "succeeded",
          amountCents: payment.amount || payment.amountCents || null,
          methods: payment.methods || provider,
        },
      };
      setOrders(saveOrder(updated));
    } else if (updated) {
      setOrders(loadOrders());
    }
    setPayInvoice(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("pay");
      window.history.replaceState(
        {},
        "",
        `${url.pathname}${url.search}${url.hash}`
      );
    } catch {
      /* ignore */
    }
    setFlash(`Payment received · order ${orderId} · ${provider}`);
    setView(VIEWS.cart);
  }

  async function placeOrder(customer, options = {}) {
    const { payment = null, waitConsent = false, notify = true } = options;
    if (!cart.length) {
      setFlash("Cart is empty");
      return null;
    }
    if (!isValidUsZip(customer.zip)) {
      setFlash("Enter a valid US ZIP code");
      return null;
    }
    if (!payment && !waitConsent) {
      setFlash("Confirm you can wait up to 4 weeks for inventory");
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
      customer: {
        ...customer,
        userId: customer.userId || session?.userId || "",
        email: customer.email || session?.email || "",
      },
      cart,
      subtotal,
      shipping,
      total,
      status: payment ? "paid" : "awaiting_supply_review",
      waitConsent: Boolean(waitConsent) || Boolean(payment),
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
      packet.paymentDue = null;
    }
    setOrders(saveOrder(packet));
    setCart([]);
    if (notify && !payment) {
      await notifyOrderRequest(packet);
    }
    setFlash(
      payment
        ? `Payment received · order ${packet.orderId}`
        : `Request ${packet.orderId} sent · we’ll confirm supply within 24 hours`
    );
    return packet;
  }

  return (
    <div className={`app-shell ${labVisible ? "app-shell--undisclosed" : "app-shell--skincare"}`}>
      {showAuth && (
        <AuthGate
          onAuthed={(next) => {
            setSession(next);
            setShowAuth(false);
            setFlash("Signed in");
          }}
          onClose={() => setShowAuth(false)}
        />
      )}
      <header className="site-header">
        <div className="header-top">
          <div className="container header-top-inner">
            <span className="header-top-msg">
              {labVisible
                ? "Undisclosed · alternate universe · by WellPept"
                : "Request first · Pay after supply check · Up to 4 weeks"}
            </span>
            <span className="header-top-links">
              {labVisible ? (
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
          <button
            className="brand"
            type="button"
            aria-label={labVisible ? "Undisclosed home" : "WellPept home"}
            onPointerUp={handleBrandActivate}
            onClick={handleBrandClick}
          >
            <img
              src={labVisible ? "/ud-monogram.svg" : "/wp-monogram.svg"}
              alt={labVisible ? "Undisclosed" : "WellPept"}
              className="brand-logo"
              width={44}
              height={44}
            />
            <span className="brand-text">
              <span className="brand-mark">
                {labVisible ? "Undisclosed" : "WellPept"}
              </span>
              <span className="brand-sub">
                {labVisible ? "Brought to you by WellPept" : "Renew skincare"}
              </span>
            </span>
          </button>

          {labVisible ? (
            <div className="search-wrap search-wrap--desktop-lab">
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
              <Search size={16} strokeWidth={2} aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setView(VIEWS.shop);
                }}
                placeholder="Search catalog…"
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
                <span className="nav-label-full">Build formula</span>
                <span className="nav-label-short">Build</span>
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
                <span className="nav-label-full">How it works</span>
                <span className="nav-label-short">Ritual</span>
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
            {labVisible && (
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
            )}
            {labVisible && opsUnlocked && (
              <>
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
            {session ? (
              <div className="header-account">
                <span className="header-account-id" title={session.email}>
                  @{session.userId}
                </span>
                <button type="button" className="ghost-btn" onClick={handleLogout}>
                  Sign out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowAuth(true)}
              >
                Sign in
              </button>
            )}
            <button
              type="button"
              className="header-bag"
              onClick={() => setView(VIEWS.cart)}
              aria-label="Open bag"
            >
              <ShoppingCart size={17} />
              <span className="cart-label">{labVisible ? "Cart" : "Bag"}</span>
              {cartCount > 0 && (
                <span className={`cart-count ${cartPulse ? "pulse" : ""}`}>
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {labVisible && (
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

      {channelTuning && (
        <ChannelTuneOverlay
          active
          onReveal={revealDuringChannelTune}
          onDone={finishChannelTune}
        />
      )}

      {flash && (
        <div className="container" style={{ paddingTop: "0.85rem" }}>
          <div className="notice fade">{flash}</div>
        </div>
      )}

      <main>
        {view === VIEWS.skincare && (
          <SkincareHome
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
                        alt="After mixing: active blended into the base"
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
                            ? `Dry actives mix into a leave-on cream base (${skinProduct.mixYield}).`
                            : skinProduct.packaging === "twist-cap"
                              ? `Dry active powder lives in the twist-cap. The dropper ships beside the bottle. Seat it after you activate (${skinProduct.mixYield}).`
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
                        <p className="sk-legal-title">Cosmetic use acknowledgment</p>
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

        {view === VIEWS.shop && labVisible && (
          <>
              <div className="lab-banner">
                <div className="container lab-banner-inner">
                  <span>
                    Undisclosed · alternate universe · brought to you by WellPept
                  </span>
                  <button type="button" className="ghost-btn" onClick={lockLabMenu}>
                    Exit to WellPept
                  </button>
                </div>
              </div>
            <section className="hero hero--undisclosed">
              <div className="hero-media hero-media--undisclosed" aria-hidden="true" />
              <div className="container hero-content">
                <div className="hero-brand-lockup rise">
                  <img
                    src="/ud-monogram.svg"
                    alt="Undisclosed UD mark"
                    className="hero-brand-mark"
                    width={136}
                    height={136}
                  />
                  <div className="hero-brand-text">
                    <h1 className="hero-brand">Undisclosed</h1>
                    <p className="ud-brought-by">
                      Brought to you by <strong>WellPept</strong>
                    </p>
                  </div>
                </div>
                <div className="hero-brand-rule rise-delay" aria-hidden="true" />
                <p className="hero-tagline rise-delay">
                  Research peptides. Same molecule. Darker mirror of WellPept.
                </p>
                <div className="hero-cta rise-delay">
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() =>
                      document
                        .getElementById("featured")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                  >
                    Shop featured
                  </button>
                  <button
                    type="button"
                    className="soft-btn"
                    onClick={() => {
                      setCalcInitial(null);
                      setView(VIEWS.calculator);
                    }}
                  >
                    Calculator
                  </button>
                </div>
              </div>
            </section>

            <section className="section featured-vendor-section" id="featured">
              <div className="container">
                <div className="featured-vendor panel">
                  <div className="featured-vendor-copy">
                    <span className="featured-kicker">Featured kit</span>
                    <h2>KLOW</h2>
                    <p>
                      Signature Undisclosed kit photography — 10 × 80 MG
                      lyophilized vials with clinical wrap labels, QR, and
                      research-only marking. Request first; we confirm supply
                      within 24 hours, then payment. US shipping only.
                    </p>
                    <ul className="featured-meta">
                      <li>Featured kit photography</li>
                      <li>80 MG · BAC 3.2 mL template</li>
                      <li>Kit of 10 labeled vials</li>
                      <li>Request first · pay after supply check</li>
                      <li>US shipping only · up to 4 weeks after payment</li>
                    </ul>
                    <div className="hero-cta" style={{ marginTop: "0.85rem" }}>
                      <button
                        type="button"
                        className="primary-btn"
                        onClick={() => {
                          setQuery("KLOW");
                          setCategory("All");
                          document
                            .getElementById("catalog")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Shop KLOW
                      </button>
                      <button
                        type="button"
                        className="soft-btn"
                        onClick={() => {
                          setQuery("");
                          setCategory("All");
                          document
                            .getElementById("catalog")
                            ?.scrollIntoView({ behavior: "smooth" });
                        }}
                      >
                        Full catalog
                      </button>
                    </div>
                  </div>
                  <div className="featured-vendor-visual">
                    <img
                      src="/undisclosed-hero-kit.png"
                      alt="Undisclosed KLOW 80 MG research kit"
                      className="featured-product-photo"
                      width={1536}
                      height={1024}
                      decoding="async"
                    />
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
                    <p>Focused research lines from Changsha and Lobster.</p>
                  </div>
                </div>
                <div className="product-grid">
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

            {!query.trim() && category === "All" && (
              <section className="section section-tight">
                <div className="container">
                  <div className="section-head">
                    <div>
                      <p className="section-kicker">Just listed</p>
                      <h2>New arrivals</h2>
                      <p>Fresh lines from the latest approved price lists.</p>
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

                <label className="catalog-search-mobile">
                  <Search size={16} strokeWidth={2} aria-hidden="true" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search catalog…"
                    aria-label="Search catalog"
                    enterKeyHint="search"
                  />
                </label>

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

            <section className="trust-strip">
              <div className="container trust-grid">
                <div className="trust-item">
                  <Truck size={22} />
                  <div>
                    <strong>Request → supply check → pay</strong>
                    <p>
                      All orders come to us first. We confirm inventory, then
                      email payment within 24 hours. Allow up to 4 weeks.
                    </p>
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
                    <p>Reconstitution calculator built in.</p>
                  </div>
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
                    manufacturing corridors — largely China — then passed through
                    resellers and storefronts. If it{" "}
                    <em>is</em> pharma-sourced, you’re often paying a premium for
                    packaging and distribution of the same active structure.
                    Undisclosed is WellPept’s lab mirror: approved near-source
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
                      Undisclosed sits after QC — connecting approved vendors to
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
                      Every line ships as a kit of 10 lyophilized vials —
                      white powder for most compounds, blue powder for KLOW.
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
                      You order on Undisclosed; the approved vendor ships to your
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
                      Vendor drop-ships US-only via Undisclosed
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
                      US shipping only · allow up to 4 weeks after payment
                    </li>
                    <li>
                      <ShieldCheck size={16} />
                      Request first · we confirm supply · then you pay
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
                      research — Undisclosed makes the source path clear.
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
                      not the logo on the box. Undisclosed lists research-grade
                      equivalents so you can judge the molecule on the bench.
                    </p>
                  </article>
                  <article className="thesis-card panel thesis-card-accent">
                    <p className="section-kicker">Undisclosed</p>
                    <h3>Your generic research lane</h3>
                    <p>
                      Admin-vetted vendors. Documented kits. US drop-ship only.
                      For laboratory research use only; not for human
                      consumption or medical use. Brought to you by WellPept.
                    </p>
                  </article>
                </div>
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
                </div>
              </div>
            </section>
          </>
        )}

        {view === VIEWS.product && labVisible && selectedListing && selectedVariant && (
          <ProductDetail
            listing={selectedListing}
            product={selectedVariant}
            onSelectVariant={setSelectedVariantId}
            onBack={goShop}
            onAdd={() => addToCart(selectedVariant)}
            onCalculate={() => {
              const d = defaultsFromCatalogSelection({
                name: selectedVariant.name,
                mass: selectedVariant.mg || 10,
                unit: selectedVariant.unit,
                vialMl: selectedVariant.vialMl,
                form: selectedVariant.form,
              });
              setCalcInitial({
                name: d.name,
                mass: d.mass,
                unit: d.unit,
                vialMl: d.vialMl,
                dose: d.dose,
                doseUnit: d.doseUnit,
                desiredUnits: 10,
                solution: automation.autoSuggestBacFromProduct
                  ? d.solution
                  : undefined,
                autoBac: automation.autoSuggestBacFromProduct,
              });
              setView(VIEWS.calculator);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {view === VIEWS.cart && (
          <CartPage
            cart={cart}
            session={session}
            onBack={goShop}
            onUpdateQty={updateQty}
            onRemove={removeLine}
            onPlaceOrder={placeOrder}
            stripeConfig={stripeConfig}
            payInvoice={payInvoice}
            onStripePaid={handleStripePaid}
            onClearPayInvoice={() => {
              setPayInvoice(null);
              try {
                const url = new URL(window.location.href);
                url.searchParams.delete("pay");
                window.history.replaceState(
                  {},
                  "",
                  `${url.pathname}${url.search}${url.hash}`
                );
              } catch {
                /* ignore */
              }
            }}
          />
        )}

        {view === VIEWS.calculator && labVisible && (
          <PeptideCalculator
            initial={calcInitial}
            listings={listings}
            autoSuggestBac={automation.autoSuggestBacFromProduct}
          />
        )}

        {view === VIEWS.vendor && labVisible && opsUnlocked && (
          <VendorPortal
            vendors={vendors}
            submissions={submissions}
            autoApproveTrusted={automation.autoApproveTrustedUpdates}
            onApply={submitVendorApplication}
            onSubmitLines={submitPriceListForExisting}
            onUpdateTerms={updateVendorTerms}
          />
        )}

        {view === VIEWS.admin && labVisible && opsUnlocked && (
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
            onMarkOrderPaid={(orderId, provider) => {
              const updated = markOrderPaid(orderId, {
                provider,
                status: "succeeded",
                methods: provider,
              });
              if (updated) setOrders(loadOrders());
              setFlash(`Marked paid · ${orderId} · ${provider}`);
            }}
            onFlash={setFlash}
          />
        )}
      </main>

      <footer className="footer" id="contact">
        <div className="container footer-inner">
          <div>
            <strong>{labVisible ? "Undisclosed" : "WellPept"}</strong>
            <div>
              {labVisible
                ? "Brought to you by WellPept · research peptides for laboratory use"
                : "Renew skincare. White light, cobalt signal"}
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
            {labVisible ? (
              <>
                Undisclosed is brought to you by WellPept. Items are for laboratory
                research use only. Not for human consumption, medical use, or
                household purposes. Ships to United States addresses only.
              </>
            ) : (
              <>
                WellPept Renew is cosmetic skincare for external use on intact
                skin only. Not for injection, ingestion, or medical use. Not
                evaluated by the FDA. Not intended to diagnose, treat, cure, or
                prevent any disease. Ships to United States addresses only.
                Questions: {contactEmail()}.
              </>
            )}
          </p>
        </div>
      </footer>
      <LiveChat />
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
              : ""}
            {listing.vendorCount > 1 ? ` · ${listing.vendorCount} vendors` : ""}
          </div>
          <h3>{listing.name}</h3>
          <p className="card-blurb">{listing.blurb || product.blurb}</p>
          <div className="meta">{product.form}</div>
          <div className="meta vial-size-tag">
            Kit of 10 · {product.vialMl || 3} mL vials ·{" "}
            {product.powderColor === "blue" ? "blue powder" : "white powder"}
          </div>
          {Number(listing.reviews) > 0 && listing.rating != null && (
            <div className="rating">
              <span className="stars" aria-hidden>
                ★★★★☆
              </span>{" "}
              {Number(listing.rating).toFixed(1)} · {listing.reviews} reviews
            </div>
          )}
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
          <div className="meta sold-by">
            Sold by {displayVendorName(product.vendor, product.vendorId)}
          </div>
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
                {s.selectLabel || formatStrengthSelectLabel(s)}
                {s.lowestPrice == null ? "" : ` · ${formatMoney(s.lowestPrice)}`}
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

  const [coaTick, setCoaTick] = useState(0);
  const coaMeta = useMemo(
    () => getCoaMeta(product.id),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [product.id, coaTick]
  );
  const coaUrl = product.coaUrl || coaMeta?.url || "";

  return (
    <section className="panel-page fade">
      <div className="container">
        <button type="button" className="ghost-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to results
        </button>
        <div className="detail-layout amazon-detail" style={{ marginTop: "1rem" }}>
          <div className="detail-visual">
            <VialPreview
              key={`${product.id}-${coaTick}`}
              product={{ ...product, coaUrl }}
              size="lg"
              showDownload
            />
          </div>
          <div className="detail-info">
            <div className="meta">
              {listing.category}
              {listing.vendorCount > 1
                ? ` · ${listing.vendorCount} vendors`
                : ""}
            </div>
            <h1>{listing.name}</h1>
            {Number(listing.reviews) > 0 && listing.rating != null && (
              <div className="rating">
                <span className="stars">★★★★☆</span>{" "}
                {Number(listing.rating).toFixed(1)} · {listing.reviews} ratings
              </div>
            )}
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
              Kit of 10 · {product.vialMl || 3} mL ·{" "}
              {product.powderColor === "blue"
                ? "blue lyophilized powder"
                : "white lyophilized powder"}
              {product.purity ? ` · Purity ${product.purity}` : ""}
            </div>
            <div className="meta">{product.form}</div>
            <div className="meta sold-by">
              Sold by{" "}
              <strong>
                {displayVendorName(product.vendor, product.vendorId)}
              </strong>{" "}
              · US shipping via WellPept marketplace
            </div>

            <CoaStorePanel
              productId={product.id}
              productName={listing.name || product.name}
              seedUrl={product.coaUrl || ""}
              onChanged={() => setCoaTick((n) => n + 1)}
            />

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
                      {s.selectLabel || formatStrengthSelectLabel(s)}
                      {s.lowestPrice == null
                        ? ""
                        : ` · ${formatMoney(s.lowestPrice)}`}
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
                {formatStrengthLabel(product)} · kit of 10
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
              {displayVendorName(product.vendor, product.vendorId)}
            </div>
            <button type="button" className="soft-btn" onClick={onCalculate}>
              <Calculator size={16} /> Calculate reconstitution
            </button>
            {coaUrl ? (
              <p className="meta" style={{ marginTop: "0.75rem" }}>
                Label QR → COA linked
              </p>
            ) : (
              <p className="meta" style={{ marginTop: "0.75rem" }}>
                Add a COA below to encode it in the vial QR
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CoaStorePanel({ productId, productName, seedUrl = "", onChanged }) {
  const existing = getCoaMeta(productId);
  const [url, setUrl] = useState(existing?.url || seedUrl || "");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const meta = getCoaMeta(productId);
    setUrl(meta?.url || seedUrl || "");
    setStatus("");
  }, [productId, seedUrl]);

  function saveUrl(next, name = "Certificate of Analysis") {
    const saved = setCoaUrl(productId, next, name);
    setUrl(saved);
    setStatus(saved ? "COA saved — vial QR updated." : "COA cleared.");
    onChanged?.();
  }

  function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4.5 * 1024 * 1024) {
      setStatus("File too large (max ~4.5 MB). Host it and paste the URL instead.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      saveUrl(String(reader.result || ""), file.name || "COA");
    };
    reader.onerror = () => setStatus("Could not read that file.");
    reader.readAsDataURL(file);
  }

  return (
    <div className="detail-summary coa-store-panel">
      <h2 className="detail-summary-label">Certificate of Analysis</h2>
      <p className="meta" style={{ marginTop: 0 }}>
        Stored on this selection page. The vial / wrap label QR opens this COA
        for {productName}.
      </p>
      <label className="field">
        COA URL
        <input
          type="url"
          placeholder="https://…/coa.pdf"
          value={url.startsWith("data:") ? "" : url}
          onChange={(e) => setUrl(e.target.value)}
        />
      </label>
      {url.startsWith("data:") && (
        <p className="meta">Local file attached ({existing?.name || "COA"}).</p>
      )}
      <div className="row-actions" style={{ marginTop: "0.5rem" }}>
        <button
          type="button"
          className="soft-btn"
          onClick={() => saveUrl(url)}
          disabled={!url.trim() && !existing?.url}
        >
          Save COA link
        </button>
        <label className="soft-btn" style={{ cursor: "pointer" }}>
          Upload file
          <input
            type="file"
            accept=".pdf,image/*,.png,.jpg,.jpeg,.webp"
            hidden
            onChange={onFile}
          />
        </label>
        {existing?.url && (
          <button
            type="button"
            className="ghost-btn"
            onClick={() => {
              clearCoaUrl(productId);
              setUrl("");
              setStatus("COA cleared.");
              onChanged?.();
            }}
          >
            Remove
          </button>
        )}
        {existing?.url && (
          <a
            className="soft-btn"
            href={existing.url}
            target="_blank"
            rel="noreferrer"
          >
            Open COA
          </a>
        )}
      </div>
      {status && <div className="notice" style={{ marginTop: "0.75rem" }}>{status}</div>}
    </div>
  );
}

function CartPage({
  cart,
  session = null,
  onBack,
  onUpdateQty,
  onRemove,
  onPlaceOrder,
  stripeConfig = null,
  payInvoice = null,
  onStripePaid,
  onClearPayInvoice,
}) {
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
    email: session?.email || "",
    userId: session?.userId || "",
    phone: "",
    address1: "",
    address2: "",
    city: "",
    state: "",
    zip: "",
  });
  const [waitConsent, setWaitConsent] = useState(false);
  const [step, setStep] = useState("shipping"); // shipping | done
  const [packet, setPacket] = useState(null);
  const [packetMsg, setPacketMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function finalizePacket(next, note) {
    setPacket(next);
    setStep("done");
    setPacketMsg(
      note ||
        "Request received. We’ll check supply and reply within 24 hours."
    );
  }

  async function handleSubmitRequest(e) {
    e.preventDefault();
    if (minOrderWarnings.length) {
      setPacketMsg("Meet each vendor minimum before submitting.");
      return;
    }
    if (!isValidUsZip(customer.zip)) {
      setPacketMsg("Enter a valid US ZIP code");
      return;
    }
    if (!waitConsent) {
      setPacketMsg(
        "Confirm you are willing to wait up to 4 weeks until inventory replenishes."
      );
      return;
    }
    setSubmitting(true);
    setPacketMsg("");
    try {
      const next = await onPlaceOrder?.(
        {
          ...customer,
          email: customer.email || session?.email || "",
          userId: customer.userId || session?.userId || "",
        },
        { waitConsent: true, notify: true }
      );
      if (!next) return;
      finalizePacket(
        next,
        "Request saved. We’ll check supply and reply within 24 hours."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="panel-page fade">
      <div className="container">
        <button
          type="button"
          className="ghost-btn"
          onClick={() => {
            if (payInvoice) onClearPayInvoice?.();
            onBack();
          }}
        >
          <ArrowLeft size={16} /> Continue shopping
        </button>

        {payInvoice && (
          <div className="panel" style={{ marginTop: "1rem" }}>
            <h1>Pay order {payInvoice.orderId}</h1>
            <p className="lede">
              Supply confirmed. Pay the quoted total with Venmo, Zelle, or
              crypto (USDC or USDT only on Solana / Ethereum).
            </p>
            <div className="notice" style={{ marginTop: "0.75rem" }}>
              <strong>Amount due:</strong> {formatMoney(payInvoice.total)}
              <div className="meta" style={{ marginTop: "0.35rem" }}>
                {payInvoice.customer?.name} · {payInvoice.customer?.email}
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <ManualPayMethods
                orderId={payInvoice.orderId}
                total={payInvoice.total}
                onPaid={(payment) =>
                  onStripePaid?.(payInvoice.orderId, payment)
                }
              />
            </div>

            {stripeConfig?.enabled && stripeConfig?.publishableKey ? (
              <div style={{ marginTop: "1.25rem" }}>
                <h2>Or pay by card</h2>
                <CheckoutPayment
                  publishableKey={stripeConfig.publishableKey}
                  total={payInvoice.total}
                  orderId={payInvoice.orderId}
                  customer={payInvoice.customer}
                  onPaid={(payment) =>
                    onStripePaid?.(payInvoice.orderId, payment)
                  }
                  onError={(err) =>
                    setPacketMsg(err?.message || "Payment failed")
                  }
                />
              </div>
            ) : null}
            {packetMsg && (
              <div className="notice warn" style={{ marginTop: "0.75rem" }}>
                {packetMsg}
              </div>
            )}
          </div>
        )}

        {!payInvoice && (
        <div className="panel" style={{ marginTop: "1rem" }}>
          <h1>Cart</h1>
          <p className="lede">
            No payment at checkout. Submit a request, we confirm supply, then email
            payment instructions within 24 hours. Fulfillment can take up to 4 weeks.
          </p>

          <div className="notice" style={{ marginTop: "0.75rem" }}>
            <strong>How ordering works</strong>
            <ol className="order-flow-steps">
              <li>You submit this request (quoted total below is not charged yet).</li>
              <li>We check supply and get back to you within 24 hours.</li>
              <li>You pay only after we confirm we can fulfill.</li>
              <li>Ship after payment — allow up to 4 weeks / until inventory replenishes.</li>
            </ol>
          </div>

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
                        {line.ships && (
                          <div className="meta">{line.ships}</div>
                        )}
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
                <form className="checkout-form" onSubmit={handleSubmitRequest}>
                  <h2>US shipping</h2>
                  <div className="form-row">
                    <label className="field">
                      Full name
                      <input
                        required
                        name="name"
                        autoComplete="name"
                        enterKeyHint="next"
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
                        name="email"
                        autoComplete="email"
                        inputMode="email"
                        enterKeyHint="next"
                        value={customer.email}
                        onChange={(e) =>
                          setCustomer((c) => ({ ...c, email: e.target.value }))
                        }
                      />
                    </label>
                  </div>
                  {session?.userId && (
                    <p className="meta" style={{ marginTop: "-0.35rem" }}>
                      Account: {session.userId}
                    </p>
                  )}
                  <label className="field">
                    Address
                    <input
                      required
                      name="address1"
                      autoComplete="address-line1"
                      enterKeyHint="next"
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
                      name="address2"
                      autoComplete="address-line2"
                      enterKeyHint="next"
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
                        name="city"
                        autoComplete="address-level2"
                        enterKeyHint="next"
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
                        name="state"
                        autoComplete="address-level1"
                        autoCapitalize="characters"
                        maxLength={2}
                        enterKeyHint="next"
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
                        name="zip"
                        autoComplete="postal-code"
                        inputMode="numeric"
                        enterKeyHint="next"
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
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      inputMode="tel"
                      enterKeyHint="done"
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer((c) => ({ ...c, phone: e.target.value }))
                      }
                    />
                  </label>

                  <label className="consent-check">
                    <input
                      type="checkbox"
                      checked={waitConsent}
                      onChange={(e) => setWaitConsent(e.target.checked)}
                      required
                    />
                    <span>
                      I understand there is no payment yet. After supply is
                      confirmed I will receive payment instructions within 24
                      hours, and I am willing to wait up to 4 weeks (or until
                      inventory replenishes) for fulfillment.
                    </span>
                  </label>

                  <div className="cart-summary">
                    <div className="summary-row">
                      <span>Quoted subtotal</span>
                      <span>{formatMoney(subtotal)}</span>
                    </div>
                    <div className="summary-row">
                      <span>US shipping</span>
                      <span>{formatMoney(shipping)}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Quoted total (not charged yet)</span>
                      <span>{formatMoney(total)}</span>
                    </div>
                    <button
                      type="submit"
                      className="primary-btn"
                      disabled={submitting || !waitConsent}
                    >
                      {submitting
                        ? "Sending request…"
                        : "Submit order request"}
                    </button>
                    <p className="meta" style={{ marginTop: "0.65rem" }}>
                      We’ll review your request and reply to your email within 24
                      hours with payment instructions if supply is available.
                    </p>
                    {packetMsg && (
                      <div className="notice warn" style={{ marginTop: "0.75rem" }}>
                        {packetMsg}
                      </div>
                    )}
                  </div>
                </form>
              )}

              {packet && (
                <div className="notice ok cart-confirm" style={{ marginTop: "1rem" }}>
                  <strong>Request {packet.orderId} received</strong>
                  <p style={{ margin: "0.5rem 0 0" }}>
                    We will check supply and email you at{" "}
                    <strong>{packet.customer?.email}</strong> within 24 hours
                    with next steps for payment. Do not send payment until you
                    hear from us. Allow up to 4 weeks after payment for
                    fulfillment.
                  </p>
                  <ul className="cart-confirm-meta">
                    <li>Quoted total: {formatMoney(packet.totals?.total || 0)}</li>
                    <li>Ship to: {packet.customer?.name}</li>
                    {packet.waitConsent ? (
                      <li>4-week wait accepted</li>
                    ) : null}
                  </ul>
                  {packetMsg ? (
                    <p className="meta" style={{ marginTop: "0.5rem" }}>
                      {packetMsg}
                    </p>
                  ) : null}
                  <button
                    type="button"
                    className="primary-btn"
                    style={{ marginTop: "1rem" }}
                    onClick={onBack}
                  >
                    Keep shopping
                  </button>
                </div>
              )}
            </>
          )}
        </div>
        )}
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
      lines.map((line, i) => {
        if (i !== index) return line;
        const next = { ...line, [key]: value };
        if (key === "name" || key === "form") {
          const vialMl = resolveVialMl({
            name: next.name,
            form: next.form,
          });
          const unit = resolveVialUnit({
            name: next.name,
            form: next.form,
            unit: next.unit,
          });
          const base = String(next.form || "Lyophilized vial").replace(
            /\s*·\s*\d+\s*ml/gi,
            ""
          );
          next.vialMl = String(vialMl);
          next.unit = unit;
          if (key === "name" || !/\b\d+\s*ml\b/i.test(String(line.form || ""))) {
            next.form = `${base} · ${vialMl}ml`;
          } else if (key === "form") {
            next.form = String(value).replace(
              /\b\d+(?:\.\d+)?\s*ml\b/gi,
              `${vialMl}ml`
            );
          }
        }
        return next;
      })
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
                value={String(
                  resolveVialMl({ name: line.name, form: line.form })
                )}
                disabled
                title="3 mL default · 10 mL only for NAD / Glutathione"
              >
                <option value="3">3 mL (default)</option>
                <option value="10">10 mL (NAD / Glutathione)</option>
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
  onMarkOrderPaid,
  onFlash,
}) {
  const pendingVendors = vendors.filter((v) => v.status === "pending");
  const pendingItems = submissions.filter((s) => s.status === "pending");
  const vendorName = (id) => vendors.find((v) => v.id === id)?.name || id;
  const [payConfig, setPayConfig] = useState(() => loadManualPayConfig());

  async function copyPayLink(order) {
    const url = buildStripePayUrl(order);
    if (!url) {
      onFlash?.("Could not build pay link");
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      onFlash?.(`Customer pay link copied · ${order.orderId}`);
    } catch {
      window.prompt("Copy customer pay link", url);
    }
  }

  async function copyPayInstructions(order) {
    const text = formatManualPayText({
      orderId: order.orderId,
      total: order.totals?.total || 0,
      config: payConfig,
    });
    try {
      await navigator.clipboard.writeText(text);
      onFlash?.(`Venmo/Zelle/crypto instructions copied · ${order.orderId}`);
    } catch {
      window.prompt("Copy payment instructions", text);
    }
  }

  function savePayMethods(e) {
    e.preventDefault();
    const next = saveManualPayConfig(payConfig);
    setPayConfig(next);
    onFlash?.(
      manualPayConfigured(next)
        ? "Payment methods saved on this device"
        : "Add at least one Venmo, Zelle, or crypto address"
    );
  }

  return (
    <section className="panel-page fade">
      <div className="container">
        <div className="panel">
          <h1>Approval desk</h1>
          <p className="lede">
            New vendors stay human-gated. Configure Venmo / Zelle / crypto here,
            then send customers a pay link after supply check.
          </p>

          <form className="manual-pay-admin" onSubmit={savePayMethods}>
            <h2>Payment methods (Venmo · Zelle · Crypto)</h2>
            <p className="meta">
              Saved in this browser (and optional Vercel env). Needed before
              customers can pay without Stripe.
            </p>
            <div className="form-row">
              <label className="field">
                Venmo handle (optional)
                <input
                  value={payConfig.venmoHandle}
                  onChange={(e) =>
                    setPayConfig((c) => ({
                      ...c,
                      venmoHandle: e.target.value.replace(/^@/, ""),
                    }))
                  }
                  placeholder="yourVenmoName"
                />
              </label>
              <label className="field">
                Zelle email or phone
                <input
                  value={payConfig.zelleContact}
                  onChange={(e) =>
                    setPayConfig((c) => ({ ...c, zelleContact: e.target.value }))
                  }
                  placeholder="pay@wellpept.com"
                />
              </label>
            </div>
            <label className="field">
              Venmo QR / code link
              <input
                value={payConfig.venmoCodeUrl || ""}
                onChange={(e) =>
                  setPayConfig((c) => ({ ...c, venmoCodeUrl: e.target.value.trim() }))
                }
                placeholder="https://venmo.com/code?user_id=…"
                spellCheck={false}
              />
            </label>
            <label className="field">
              Venmo QR image URL (optional)
              <input
                value={payConfig.venmoQrUrl || ""}
                onChange={(e) =>
                  setPayConfig((c) => ({
                    ...c,
                    venmoQrUrl: e.target.value.trim(),
                  }))
                }
                placeholder="/venmo-qr.png"
                spellCheck={false}
              />
            </label>
            <div className="form-row">
              <label className="field">
                Zelle name (optional)
                <input
                  value={payConfig.zelleName}
                  onChange={(e) =>
                    setPayConfig((c) => ({ ...c, zelleName: e.target.value }))
                  }
                  placeholder="WellPept"
                />
              </label>
              <label className="field">
                Zelle QR image URL (optional)
                <input
                  value={payConfig.zelleQrUrl || ""}
                  onChange={(e) =>
                    setPayConfig((c) => ({
                      ...c,
                      zelleQrUrl: e.target.value.trim(),
                    }))
                  }
                  placeholder="/zelle-qr.png"
                  spellCheck={false}
                />
              </label>
            </div>
            <label className="field">
              Note on pay page
              <input
                value={payConfig.note}
                onChange={(e) =>
                  setPayConfig((c) => ({ ...c, note: e.target.value }))
                }
              />
            </label>
            <label className="field">
              Solana wallet (USDC or USDT only — not SOL)
              <input
                value={payConfig.solanaUsdc}
                onChange={(e) =>
                  setPayConfig((c) => ({ ...c, solanaUsdc: e.target.value }))
                }
                placeholder="Your Solana wallet"
                spellCheck={false}
              />
            </label>
            <label className="field">
              Ethereum wallet (USDC or USDT only — not ETH)
              <input
                value={payConfig.ethUsdc}
                onChange={(e) =>
                  setPayConfig((c) => ({ ...c, ethUsdc: e.target.value }))
                }
                placeholder="0x…"
                spellCheck={false}
              />
            </label>
            <button type="submit" className="primary-btn">
              Save payment methods
            </button>
            {!manualPayConfigured(payConfig) && (
              <p className="meta" style={{ marginTop: "0.5rem" }}>
                Add at least one method so the customer pay page works today.
              </p>
            )}
          </form>

          <div className="notice warn">
            {pendingVendors.length} vendor
            {pendingVendors.length === 1 ? "" : "s"} and {pendingItems.length}{" "}
            price-list line{pendingItems.length === 1 ? "" : "s"} awaiting
            review · {products.length} live products · {orders.length} order
            request{orders.length === 1 ? "" : "s"}
            {manualPayConfigured(payConfig)
              ? " · Venmo / Zelle / crypto ready"
              : " · add payment methods above"}
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

          <h2>Order requests (supply review)</h2>
          <p className="meta" style={{ marginBottom: "0.75rem" }}>
            After you confirm supply, copy the pay link (or Venmo / Zelle /
            crypto instructions) and email it to the customer. Mark paid when
            funds arrive.
          </p>
          <div className="table-wrap" style={{ marginBottom: "1.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Quoted total</th>
                  <th>Collect payment</th>
                </tr>
              </thead>
              <tbody>
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No order requests yet.</td>
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
                        {o.customer?.userId ? (
                          <div className="meta">ID: {o.customer.userId}</div>
                        ) : null}
                      </td>
                      <td>
                        {o.status || "awaiting_supply_review"}
                        {o.waitConsent ? (
                          <div className="meta">4-week wait accepted</div>
                        ) : null}
                        {o.payment?.provider ? (
                          <div className="meta">via {o.payment.provider}</div>
                        ) : null}
                      </td>
                      <td>{formatMoney(o.totals?.total || 0)}</td>
                      <td>
                        {o.status === "paid" ? (
                          <span className="meta">Paid</span>
                        ) : (
                          <div className="row-actions admin-pay-actions">
                            <button
                              type="button"
                              className="soft-btn"
                              onClick={() => copyPayLink(o)}
                            >
                              Copy pay link
                            </button>
                            <button
                              type="button"
                              className="soft-btn"
                              onClick={() => copyPayInstructions(o)}
                            >
                              Copy Venmo/Zelle/crypto
                            </button>
                            <button
                              type="button"
                              className="ghost-btn"
                              onClick={() =>
                                onMarkOrderPaid?.(o.orderId, "manual")
                              }
                            >
                              Mark paid
                            </button>
                          </div>
                        )}
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
