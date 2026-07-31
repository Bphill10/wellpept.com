import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  Printer,
} from "lucide-react";
import FreePrints from "./components/FreePrints";
import {
  CATEGORIES,
  formatMoney,
  formatStrengthLabel,
  formatStrengthSelectLabel,
  formatCustomerForm,
  formatVendorOfferLabel,
  groupCatalog,
  guessCategory,
  retailFromVendor,
  strengthForProduct,
  resolveVialMl,
  resolveVialUnit,
  buildCalculatorListings,
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
  cryptoPayTotal,
} from "./utils/manualPayments";
import {
  loadDiscountCodes,
  saveDiscountCodes,
  applyDiscountCode,
  formatDiscountRule,
} from "./utils/discountCodes";
import {
  US_STATES,
  calcSalesTax,
  isValidUsState,
  normalizeStateCode,
} from "./utils/salesTax";
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
import ChannelTuneOverlay, { TUNE_MS } from "./components/ChannelTuneOverlay";
import PriceListDropzone from "./components/PriceListDropzone";
import PriceCompare from "./components/PriceCompare";
import LiveChat, { openLiveChat, contactEmail } from "./components/LiveChat";
import AuthGate from "./components/AuthGate";
import { getSession, logout as logoutAccount } from "./utils/auth";
import { researchHelpFor } from "./data/researchGuide";
import {
  setLabUnlocked,
  labUnlockFromUrl,
  labUnlockFromPath,
  cleanLabUnlockUrl,
  cleanPublicEntryUrl,
} from "./utils/secretMenu";
import {
  loadSupplyPolicy,
  saveSupplyPolicy,
  offerMatchKey,
} from "./utils/supplyFallback";
import {
  syncStgFromSheetUrl,
  syncStgFromParsedLines,
  saveCachedStgSubmissions,
  loadCachedStgSubmissions,
} from "./utils/stgSync";
import { STG_VENDOR_ID, PRIMARY_VENDOR_ID } from "./data/stgBackup";
import {
  WAREHOUSE_FILTERS,
  cartShippingTotal,
  cartShippingBreakdown,
} from "./data/warehouses";

const VIEWS = {
  skincare: "skincare",
  skinProduct: "skinProduct",
  shop: "shop",
  product: "product",
  cart: "cart",
  vendor: "vendor",
  admin: "admin",
  calculator: "calculator",
  prints: "prints",
};

function VialPreview({
  product,
  size = "md",
  showDownload = false,
  showLabel = false,
}) {
  if (product?.print) {
    if (product.image) {
      return (
        <div className={`skin-bottle-preview skin-bottle-preview--${size} skin-bottle-preview--photo`}>
          <img src={product.image} alt="" className="skin-cart-thumb" />
        </div>
      );
    }
    return (
      <div className={`skin-bottle-preview skin-bottle-preview--${size}`}>
        <span className="meta">Print</span>
      </div>
    );
  }
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
  // Catalog: bare photoreal vial. Detail/calculator can pass showLabel.
  return (
    <GeneratedVial
      name={product.name}
      mass={product.mg}
      unit={product.unit || "mg"}
      sku={product.sku || ""}
      category={product.category}
      subtitle={formatCustomerForm(product)}
      form={product.form}
      vialMl={product.vialMl}
      productId={product.id}
      coaUrl={product.coaUrl || ""}
      size={size}
      showDownload={showDownload}
      showLabel={showLabel}
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
  const [supplyPolicy, setSupplyPolicy] = useState(
    () => initial.policy || loadSupplyPolicy()
  );

  const urlWantsLabQuery = useMemo(
    () =>
      // Query/hash only. pathname is tracked via routePath so Exit can clear it.
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
  const [warehouseFilter, setWarehouseFilter] = useState("All");
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
      setFlash("Chargebee return noted. Confirm supply before taking payment.");
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
      view === VIEWS.calculator ||
      view === VIEWS.prints
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
    // replaceState does not fire popstate. keep routePath in sync
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
    // Warm Undisclosed assets under the black cover so WellPept never flashes back
    const warmMarble =
      typeof window !== "undefined" && window.matchMedia("(max-width: 700px)").matches
        ? "/black-marble-sm.webp"
        : "/black-marble.webp";
    [warmMarble, "/ud-monogram.svg", "/real-vial-3ml-card.webp"].forEach((href) => {
      const img = new Image();
      img.decoding = "async";
      img.src = href;
    });
    setChannelTuning(true);
    // Never leave the unlock overlay blocking taps (Add to cart, etc.)
    window.setTimeout(() => {
      channelTuneLockRef.current = false;
      setChannelTuning(false);
    }, TUNE_MS + 1200);
  }

  function lockLabMenu() {
    setLabUnlocked(false);
    setLabUnlockedState(false);
    cleanPublicEntryUrl();
    // replaceState does not fire popstate. clear Undisclosed route or
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
      ships: "2-3 weeks delivery",
      legalNote:
        product.kind === "mix"
          ? "Cosmetic skincare only. Not for injection or medical use."
          : undefined,
    });
    setFlash(
      product.kind === "mix"
        ? `Added ${product.name} (request only, no payment yet)`
        : `Added ${product.name} (request only, no payment yet)`
    );
  }

  useEffect(() => {
    const nextProducts = persistMarketplace(
      vendors,
      submissions,
      supplyPolicy
    );
    setProducts(nextProducts);
  }, [vendors, submissions, supplyPolicy]);

  /** Background STG sheet monitor — refresh at most every 6 hours when URL set. */
  useEffect(() => {
    if (!labVisible || !opsUnlocked) return undefined;
    const url = String(supplyPolicy.sheetCsvUrl || "").trim();
    if (!url || supplyPolicy.fallbackEnabled === false) return undefined;

    const SIX_H = 6 * 60 * 60 * 1000;
    const last = supplyPolicy.lastSyncAt
      ? new Date(supplyPolicy.lastSyncAt).getTime()
      : 0;
    const stale = !last || Date.now() - last > SIX_H;
    if (!stale) return undefined;

    let cancelled = false;
    (async () => {
      try {
        const result = await syncStgFromSheetUrl(url);
        if (cancelled) return;
        saveCachedStgSubmissions(result.submissions);
        setSupplyPolicy(result.policy);
        setVendors((prev) => {
          const others = prev.filter((v) => v.id !== STG_VENDOR_ID);
          return [
            ...others,
            {
              id: STG_VENDOR_ID,
              name: "STG",
              status: "approved",
              role: "fallback",
              minOrder: 0,
              shippingFlat: result.policy.shippingFlat ?? 60,
              shippingNote:
                result.policy.shippingNote ||
                "US shipping only · 2–3 weeks delivery",
              priceListSource: result.policy.sheetCsvUrl || "STG sheet",
            },
          ];
        });
        setSubmissions((prev) => {
          const primary = prev.filter((s) => s.vendorId !== STG_VENDOR_ID);
          return [...primary, ...result.submissions];
        });
      } catch (err) {
        if (cancelled) return;
        setSupplyPolicy((p) =>
          saveSupplyPolicy({
            ...p,
            lastSyncError: err?.message || "STG sync failed",
          })
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    labVisible,
    opsUnlocked,
    supplyPolicy.sheetCsvUrl,
    supplyPolicy.fallbackEnabled,
    supplyPolicy.lastSyncAt,
  ]);

  useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(""), 2800);
    return () => clearTimeout(t);
  }, [flash]);

  useEffect(() => {
    if (warehouseFilter === "All") return;
    const stillPresent = (products || []).some(
      (p) => p.warehouseId === warehouseFilter
    );
    if (!stillPresent) setWarehouseFilter("All");
  }, [products, warehouseFilter]);

  const listings = useMemo(() => groupCatalog(products), [products]);
  /** Only show warehouse chips that actually have catalog stock. */
  const activeWarehouseFilters = useMemo(() => {
    const present = new Set(
      (products || []).map((p) => p.warehouseId).filter(Boolean)
    );
    return WAREHOUSE_FILTERS.filter(
      (w) => w.id === "All" || present.has(w.id)
    );
  }, [products]);
  /** Full sellable peptide set for calculator / blank-label dropdown. */
  const calculatorListings = useMemo(() => buildCalculatorListings(), []);
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
          v.sku.toLowerCase().includes(q) || String(v.mg).includes(q)
      );
    const matchesCategory =
      category === "All" || listing.category === category;
    const matchesWarehouse =
      warehouseFilter === "All" ||
      listing.variants.some((v) => v.warehouseId === warehouseFilter);
    return matchesQuery && matchesCategory && matchesWarehouse;
  });

  const catalogSections = useMemo(() => {
    // Filtered: one section at a time. All: every category, for section jumps.
    const cats =
      category === "All"
        ? CATEGORIES.filter((c) => c !== "All")
        : [category];
    return cats
      .map((cat) => ({
        category: cat,
        items: filtered
          .filter((l) => l.category === cat)
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name)),
      }))
      .filter((section) => section.items.length > 0);
  }, [filtered, category]);

  /** Flat All view — continuous 4-across grid of every listing. */
  const catalogAllItems = useMemo(() => {
    if (category !== "All") return [];
    const order = new Map(
      CATEGORIES.filter((c) => c !== "All").map((c, i) => [c, i])
    );
    return filtered
      .slice()
      .sort((a, b) => {
        const ca = order.get(a.category) ?? 99;
        const cb = order.get(b.category) ?? 99;
        if (ca !== cb) return ca - cb;
        return a.name.localeCompare(b.name);
      });
  }, [filtered, category]);

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
    if (product.print) {
      setFlash(`${product.name} added — we’ll print for you (request only)`);
    } else if (product.skin) {
      setFlash(`${product.name} added (request only, no payment yet)`);
    } else {
      const strength = formatStrengthLabel(product);
      setFlash(`${product.name} (${strength}) added (request only, no payment yet)`);
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
    setFlash("Listing approved. Catalog updated");
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
      setFlash("Partner approved. Pending lines published");
    } else {
      setFlash("Partner approved");
    }
  }

  function rejectVendor(id) {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: "rejected" } : v))
    );
    setFlash("Partner rejected");
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
    setFlash("All pending partners and lines approved");
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
      setFlash("Add partner details and at least one price-list item");
      return false;
    }

    setVendors((prev) => [vendor, ...prev]);
    setSubmissions((prev) => [...lines, ...prev]);
    setFlash("Price list submitted. Waiting for WellPept approval");
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
        ? `${lines.length} line${lines.length === 1 ? "" : "s"} auto-published for ${vendor?.name || "partner"}`
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
    setFlash("Partner shipping & minimum order updated");
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
    const {
      payment = null,
      waitConsent = false,
      notify = true,
      discount = null,
    } = options;
    if (!session?.userId) {
      setShowAuth(true);
      setFlash("Create an account or sign in to submit an order request");
      return null;
    }
    if (!cart.length) {
      setFlash("Cart is empty");
      return null;
    }
    if (!isValidUsZip(customer.zip)) {
      setFlash("Enter a valid US ZIP code");
      return null;
    }
    if (!isValidUsState(customer.state)) {
      setFlash("Select a valid US state");
      return null;
    }
    if (!payment && !waitConsent) {
      setFlash("Confirm you accept the stated delivery window");
      return null;
    }
    const subtotal = cart.reduce((sum, line) => sum + line.price * line.qty, 0);
    const shipping = cartShippingTotal(cart);
    const discountAmount = Math.min(
      subtotal,
      Math.max(0, Number(discount?.amount) || 0)
    );
    const taxInfo = calcSalesTax({
      subtotal,
      discount: discountAmount,
      state: customer.state,
    });
    const total =
      Math.max(0, subtotal - discountAmount) + taxInfo.amount + shipping;
    const packet = buildOrderPacket({
      orderId: createOrderId(),
      customer: {
        ...customer,
        state: normalizeStateCode(customer.state),
        userId: session.userId,
        email: session.email || customer.email || "",
      },
      cart,
      subtotal,
      shipping,
      total,
      discount: discountAmount
        ? {
            code: discount?.code || "",
            amount: discountAmount,
            label: discount?.label || discount?.code || "",
            type: discount?.type || "",
            value: discount?.value ?? null,
          }
        : null,
      tax: {
        state: taxInfo.state,
        rate: taxInfo.rate,
        amount: taxInfo.amount,
        label: taxInfo.label,
      },
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
                ? "Take control · Ask questions · Your human right"
                : "Request first · Pay after supply check · 2-3 weeks"}
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
              decoding="async"
            />
            <span className="brand-text">
              <span className="brand-mark">
                {labVisible ? "Undisclosed" : "WellPept"}
              </span>
              <span className="brand-sub">
                {labVisible ? "Research · your call" : "Renew skincare"}
              </span>
            </span>
          </button>

          {labVisible ? (
            <div className="search-wrap search-wrap--desktop-lab">
              <select
                className="search-dept"
                value={category}
                onChange={(e) => {
                  const next = e.target.value;
                  setCategory(next);
                  setView(VIEWS.shop);
                  window.setTimeout(() => {
                    const id =
                      next === "All"
                        ? "catalog"
                        : `cat-${next.replace(/\s+/g, "-")}`;
                    document
                      .getElementById(id)
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 40);
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
              <>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setView(VIEWS.prints)}
                >
                  <Printer size={16} />
                  <span>Free prints</span>
                </button>
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
              </>
            )}
            {labVisible && opsUnlocked && (
              <>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => setView(VIEWS.vendor)}
                >
                  <Store size={16} />
                  <span>Partners</span>
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
                className="ghost-btn header-auth-btn"
                onClick={() => setShowAuth(true)}
              >
                <span className="nav-label-full">Sign in / Create account</span>
                <span className="nav-label-short">Sign in</span>
              </button>
            )}
            <button
              type="button"
              className={`header-bag${cartPulse ? " cart-pulse-bag" : ""}`}
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
                    window.setTimeout(() => {
                      document
                        .getElementById("catalog")
                        ?.scrollIntoView({ behavior: "smooth" });
                    }, 40);
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
                        loading="eager"
                        fetchPriority="high"
                        decoding="async"
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
                        loading="lazy"
                        decoding="async"
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
                  Undisclosed · research catalog · brought to you by WellPept
                </span>
                <button type="button" className="ghost-btn" onClick={lockLabMenu}>
                  Exit to WellPept
                </button>
              </div>
            </div>

            <section className="hero hero--undisclosed hero--undisclosed-compact">
              <div className="hero-media hero-media--undisclosed" aria-hidden="true" />
              <div className="container hero-content">
                <div className="hero-brand-lockup rise">
                  <img
                    src="/ud-monogram.svg"
                    alt="Undisclosed U mark"
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
                <p className="hero-tagline rise-delay">
                  Full research catalog. Pick a category and order.
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

            <section className="section free-prints-teaser-section" aria-label="Free prints">
              <div className="container">
                <button
                  type="button"
                  className="free-prints-teaser panel"
                  onClick={() => setView(VIEWS.prints)}
                >
                  <div className="free-prints-teaser-media" aria-hidden="true">
                    <img
                      src="/printables/previews/free-prints-caps-hero.webp"
                      alt=""
                      width={400}
                      height={267}
                      loading="lazy"
                      decoding="async"
                    />
                    <img
                      src="/printables/previews/free-prints-case-hero.webp"
                      alt=""
                      width={400}
                      height={267}
                      loading="lazy"
                      decoding="async"
                    />
                    <img
                      src="/printables/previews/free-prints-labels-hero.webp"
                      alt=""
                      width={400}
                      height={267}
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                  <div className="free-prints-teaser-copy">
                    <span className="featured-kicker">Free prints</span>
                    <h2>Caps, case &amp; labels</h2>
                    <p>
                      Order and we’ll print for you — or download free STLs and
                      make your own labels.
                    </p>
                    <span className="soft-btn free-prints-teaser-cta">Order or download</span>
                  </div>
                </button>
              </div>
            </section>

            <section className="section featured-vendor-section" id="featured">
              <div className="container">
                <div className="featured-vendor panel">
                  <div className="featured-vendor-copy">
                    <span className="featured-kicker">Featured kit</span>
                    <h2>KLOW</h2>
                    <p>
                      Signature Undisclosed kit. 10 × 80 MG lyophilized vials
                      with clinical wrap labels, QR, and research-only marking.
                      Request first; we confirm supply within 24 hours, then
                      payment. Shipping by warehouse (A / B).
                    </p>
                    <ul className="featured-meta">
                      <li>80 MG blend · kit of 10 vials</li>
                      <li>Request first · pay after supply check</li>
                      <li>Warehouse A: 7–10 days · B: 2–4 weeks</li>
                    </ul>
                  </div>
                  <div className="featured-vendor-visual">
                    <img
                      src="/undisclosed-hero-kit-sm.webp"
                      srcSet="/undisclosed-hero-kit-sm.webp 800w, /undisclosed-hero-kit.webp 1200w"
                      sizes="(max-width: 700px) 100vw, 42vw"
                      alt="Undisclosed KLOW 80 MG research kit"
                      className="featured-product-photo"
                      width={800}
                      height={534}
                      decoding="async"
                      loading="lazy"
                      fetchPriority="low"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="section catalog-page" id="catalog">
              <div className="container">
                <div className="section-head">
                  <div>
                    <p className="section-kicker">Research catalog</p>
                    <h2>Full catalog</h2>
                    <p>
                      {filtered.length} peptide
                      {filtered.length === 1 ? "" : "s"}
                      {category !== "All" ? ` in ${category}` : ""}
                      {warehouseFilter !== "All"
                        ? ` · Warehouse ${warehouseFilter}`
                        : ""}
                      {query.trim() ? ` for “${query.trim()}”` : ""}. Listed
                      Warehouse A → B. Shipping is charged per warehouse in
                      your cart · request first, pay after supply check.
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

                {activeWarehouseFilters.length > 2 ? (
                  <div
                    className="filters filters--warehouse"
                    role="group"
                    aria-label="Filter by warehouse"
                  >
                    {activeWarehouseFilters.map((w) => (
                      <button
                        key={w.id}
                        type="button"
                        className={`chip ${warehouseFilter === w.id ? "active" : ""}`}
                        onClick={() => {
                          setWarehouseFilter(w.id);
                          window.setTimeout(() => {
                            document
                              .getElementById("catalog")
                              ?.scrollIntoView({
                                behavior: "smooth",
                                block: "start",
                              });
                          }, 40);
                        }}
                      >
                        {w.label}
                        {w.hint ? (
                          <span className="chip-hint"> · {w.hint}</span>
                        ) : null}
                      </button>
                    ))}
                  </div>
                ) : null}

                <div className="filters">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`chip ${category === c ? "active" : ""}`}
                      onClick={() => {
                        setCategory(c);
                        window.setTimeout(() => {
                          document
                            .getElementById("catalog")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }, 40);
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>

                <p className="catalog-request-note">
                  Message me if there is a specific peptide you are looking for
                  that is not on this list.{" "}
                  <button
                    type="button"
                    className="linkish"
                    onClick={() => {
                      if (!openLiveChat()) {
                        window.location.href = `mailto:${contactEmail()}?subject=${encodeURIComponent(
                          "Peptide request"
                        )}`;
                      }
                    }}
                  >
                    Message
                  </button>
                </p>

                {category === "All" ? (
                  catalogAllItems.length === 0 ? (
                    <div className="empty-state">
                      No approved products match this search yet. Message me if
                      you are looking for a specific peptide not on this list.
                    </div>
                  ) : (
                    <div className="product-grid product-grid--catalog">
                      {catalogAllItems.map((listing) => (
                        <ProductCard
                          key={listing.id}
                          listing={listing}
                          preferredWarehouseId={warehouseFilter}
                          onOpen={openProduct}
                          onAdd={addToCart}
                        />
                      ))}
                    </div>
                  )
                ) : catalogSections.length === 0 ? (
                  <div className="empty-state">
                    No approved products match this search yet. Message me if
                    you are looking for a specific peptide not on this list.
                  </div>
                ) : (
                  <div className="catalog-sections">
                    {catalogSections.map((section) => (
                      <section
                        key={section.category}
                        className="catalog-category"
                        id={`cat-${section.category.replace(/\s+/g, "-")}`}
                      >
                        <div className="catalog-category-head">
                          <h3>{section.category}</h3>
                          <span>
                            {section.items.length} item
                            {section.items.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="product-grid product-grid--catalog">
                          {section.items.map((listing) => (
                            <ProductCard
                              key={listing.id}
                              listing={listing}
                              preferredWarehouseId={warehouseFilter}
                              onOpen={openProduct}
                              onAdd={addToCart}
                            />
                          ))}
                        </div>
                      </section>
                    ))}
                  </div>
                )}
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
            labCart={labVisible}
            onRequireAuth={() => setShowAuth(true)}
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
            listings={calculatorListings}
            autoSuggestBac={automation.autoSuggestBacFromProduct}
            onBack={() => {
              setCalcInitial(null);
              goShop();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        )}

        {view === VIEWS.prints && labVisible && (
          <FreePrints
            onBack={() => {
              goShop();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onOpenCalculator={() => {
              setCalcInitial(null);
              setView(VIEWS.calculator);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onAddToCart={addToCart}
            onGoCart={() => {
              setView(VIEWS.cart);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
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
            supplyPolicy={supplyPolicy}
            onUpdateSupplyPolicy={(patch) => {
              const next = saveSupplyPolicy({ ...supplyPolicy, ...patch });
              setSupplyPolicy(next);
            }}
            onStgSynced={({ submissions: stgSubs, policy }) => {
              saveCachedStgSubmissions(stgSubs);
              setSupplyPolicy(policy);
              setVendors((prev) => {
                const others = prev.filter((v) => v.id !== STG_VENDOR_ID);
                return [
                  ...others,
                  {
                    id: STG_VENDOR_ID,
                    name: "STG",
                    status: "approved",
                    role: "fallback",
                    minOrder: 0,
                    shippingFlat: policy.shippingFlat ?? 60,
                    shippingNote:
                      policy.shippingNote ||
                      "US shipping only · 2–3 weeks delivery",
                    priceListSource: policy.sheetCsvUrl || "STG sheet",
                  },
                ];
              });
              setSubmissions((prev) => {
                const primary = prev.filter(
                  (s) => s.vendorId !== STG_VENDOR_ID
                );
                return [...primary, ...stgSubs];
              });
            }}
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
                ? "Brought to you by WellPept · ask questions · research use only"
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

function preferredOfferId(listing, preferredWarehouseId) {
  if (!preferredWarehouseId || preferredWarehouseId === "All") {
    return listing.defaultVariantId;
  }
  const fromWh = (listing.variants || []).find(
    (v) => v.warehouseId === preferredWarehouseId && v.price != null
  );
  return fromWh?.id || listing.defaultVariantId;
}

function ProductCard({ listing, preferredWarehouseId = "All", onOpen, onAdd }) {
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
  const initialOfferId = preferredOfferId(listing, preferredWarehouseId);
  const [offerId, setOfferId] = useState(initialOfferId);

  useEffect(() => {
    setOfferId(preferredOfferId(listing, preferredWarehouseId));
  }, [listing.id, listing.defaultVariantId, preferredWarehouseId]);

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
          <VialPreview product={product} size="md" showLabel={false} />
        </div>
        <div className="product-body">
          <div className="meta">
            {listing.category}
            {multiStrength
              ? ` · ${strengths.length} strengths`
              : ""}
          </div>
          <h3>{listing.name}</h3>
          <p className="card-blurb">{listing.blurb || product.blurb}</p>
          <div className="meta">
            {formatStrengthLabel(product)} · {formatCustomerForm(product)}
          </div>
          <div className="meta vial-size-tag">
            {product.powderColor === "blue" ? "Blue powder" : "White powder"}
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
          {(product.warehouseLabel || product.ships) && (
            <div className="meta">
              {product.warehouseLabel || "Warehouse"}
              {product.warehouseId === "A"
                ? " · 7–10 days"
                : product.warehouseId === "B"
                  ? " · 2–4 weeks"
                  : ""}
              {product.shippingFlat != null
                ? ` · ship ${formatMoney(product.shippingFlat)}`
                : ""}
            </div>
          )}
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
          <span>Option</span>
          <select
            value={product.id}
            onChange={(e) => setOfferId(e.target.value)}
            aria-label={`${listing.name} option`}
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
        defaultScope="strength"
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
              showLabel
            />
          </div>
          <div className="detail-info">
            <div className="meta">{listing.category}</div>
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
              {formatStrengthLabel(product)} · {formatCustomerForm(product)}
              {product.powderColor === "blue"
                ? " · blue lyophilized powder"
                : " · white lyophilized powder"}
              {product.purity ? ` · Purity ${product.purity}` : ""}
            </div>
            <div className="meta">US shipping via WellPept</div>

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
                <span>Option</span>
                <select
                  value={product.id}
                  onChange={(e) => onSelectVariant(e.target.value)}
                  aria-label="Select option"
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
                {formatStrengthLabel(product)} · {formatCustomerForm(product)}
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
              {product.warehouseLabel || "Warehouse"}
              {" · "}
              {product.ships || product.shippingNote || "US shipping"}
              {product.shippingFlat != null ? (
                <> · ship {formatMoney(product.shippingFlat)}</>
              ) : null}
            </div>
            {Number(product.minOrder) > 0 && (
              <div className="meta">
                <Package size={14} style={{ display: "inline", marginRight: 6 }} />
                {product.warehouseLabel || "Warehouse"} minimum{" "}
                {formatMoney(product.minOrder)}
              </div>
            )}
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
    setStatus(saved ? "COA saved. Vial QR updated." : "COA cleared.");
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
  labCart = false,
  onRequireAuth,
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
  const shipBreak = cartShippingBreakdown(cart);
  const shipping = shipBreak.total;
  const deliveryWindow = labCart
    ? shipBreak.lines?.length
      ? shipBreak.lines.map((r) => `${r.label}: ${r.delivery}`).join(" · ")
      : "Warehouse A: 7–10 days · Warehouse B: 2–4 weeks"
    : "2-3 weeks";
  const minOrderWarnings = shipBreak.minOrderWarnings || [];

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
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoMsg, setPromoMsg] = useState("");

  useEffect(() => {
    if (!session?.userId) return;
    setCustomer((c) => ({
      ...c,
      email: session.email || c.email,
      userId: session.userId,
    }));
  }, [session?.userId, session?.email]);

  const discountAmount = promoApplied?.ok
    ? Math.min(subtotal, Number(promoApplied.amount) || 0)
    : 0;
  const taxInfo = calcSalesTax({
    subtotal,
    discount: discountAmount,
    state: customer.state,
  });
  const taxAmount = taxInfo.ok ? taxInfo.amount : 0;
  const total =
    Math.max(0, subtotal - discountAmount) + taxAmount + shipping;

  useEffect(() => {
    if (!promoApplied?.ok || !promoApplied.entry?.code) return;
    const refreshed = applyDiscountCode(subtotal, promoApplied.entry.code);
    if (!refreshed.ok) {
      setPromoApplied(null);
      setPromoMsg("Code no longer applies");
      return;
    }
    if (refreshed.amount !== promoApplied.amount) {
      setPromoApplied(refreshed);
    }
  }, [subtotal]); // eslint-disable-line react-hooks/exhaustive-deps

  function tryApplyPromo(e) {
    e?.preventDefault?.();
    const result = applyDiscountCode(subtotal, promoInput);
    if (!result.ok) {
      setPromoApplied(null);
      setPromoMsg(result.message || "That code isn’t valid");
      return;
    }
    setPromoApplied(result);
    setPromoMsg(result.message);
  }

  function clearPromo() {
    setPromoApplied(null);
    setPromoInput("");
    setPromoMsg("");
  }

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
    if (!session?.userId) {
      setPacketMsg("Create an account or sign in to submit an order request.");
      onRequireAuth?.();
      return;
    }
    if (minOrderWarnings.length) {
      setPacketMsg("Meet the minimum order before submitting.");
      return;
    }
    if (!isValidUsZip(customer.zip)) {
      setPacketMsg("Enter a valid US ZIP code");
      return;
    }
    if (!isValidUsState(customer.state)) {
      setPacketMsg("Select a valid US state");
      return;
    }
    if (!waitConsent) {
      setPacketMsg(
        `Confirm you are willing to wait ${deliveryWindow} for delivery.`
      );
      return;
    }
    setSubmitting(true);
    setPacketMsg("");
    try {
      const live = promoApplied?.ok
        ? applyDiscountCode(subtotal, promoApplied.entry?.code || promoInput)
        : null;
      const next = await onPlaceOrder?.(
        {
          ...customer,
          email: session.email || customer.email || "",
          userId: session.userId,
        },
        {
          waitConsent: true,
          notify: true,
          discount: live?.ok
            ? {
                code: live.entry.code,
                amount: live.amount,
                label: live.label,
                type: live.entry.type,
                value: live.entry.value,
              }
            : null,
        }
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
              crypto (USDC or USDT only on Solana / Ethereum (5% off for
              crypto).
            </p>
            <div className="notice" style={{ marginTop: "0.75rem" }}>
              <strong>Amount due:</strong> {formatMoney(payInvoice.total)}
              <div className="meta" style={{ marginTop: "0.35rem" }}>
                Crypto: {formatMoney(cryptoPayTotal(payInvoice.total))} (5% off)
              </div>
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
            Create an account to order. No payment at checkout. We confirm
            supply, then email payment instructions within 24 hours. Delivery
            takes {deliveryWindow}.
          </p>

          <div className="notice" style={{ marginTop: "0.75rem" }}>
            <strong>How ordering works</strong>
            <ol className="order-flow-steps">
              <li>Create an account (or sign in).</li>
              <li>Submit this request (quoted total below is not charged yet).</li>
              <li>We check supply and get back to you within 24 hours.</li>
              <li>You pay only after we confirm we can fulfill.</li>
              <li>Crypto (USDC/USDT) payments get 5% off.</li>
              <li>
                Ship after payment. {deliveryWindow}
                {labCart
                  ? " · shipping charged per warehouse in your cart"
                  : ""}.
              </li>
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
                        <div className="meta">
                          {formatStrengthLabel(line)} · {formatCustomerForm(line)}
                        </div>
                        </div>
                        {(line.warehouseLabel || line.ships) && (
                          <div className="meta">
                            {line.warehouseLabel
                              ? `${line.warehouseLabel}${
                                  line.warehouseId === "A"
                                    ? " · 7–10 days"
                                    : line.warehouseId === "B"
                                      ? " · 2–4 weeks"
                                      : ""
                                }`
                              : line.ships}
                          </div>
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
                            className="cart-remove"
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

              {cart.length > 0 && step === "shipping" && !session?.userId && (
                <div className="notice warn cart-auth-gate" style={{ marginTop: "1rem" }}>
                  <strong>Account required</strong>
                  <p style={{ margin: "0.45rem 0 0.75rem" }}>
                    Create a free account (or sign in) to submit an order request.
                    We’ll use it to email supply confirmation and your pay link.
                  </p>
                  <button
                    type="button"
                    className="primary-btn"
                    onClick={() => onRequireAuth?.()}
                  >
                    Sign in / Create account
                  </button>
                </div>
              )}

              {cart.length > 0 && step === "shipping" && session?.userId && (
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
                        readOnly
                        aria-readonly="true"
                      />
                    </label>
                  </div>
                  <p className="meta" style={{ marginTop: "-0.35rem" }}>
                    Account: @{session.userId}
                  </p>
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
                      <select
                        required
                        name="state"
                        autoComplete="address-level1"
                        value={customer.state}
                        onChange={(e) =>
                          setCustomer((c) => ({
                            ...c,
                            state: normalizeStateCode(e.target.value),
                          }))
                        }
                      >
                        <option value="">Select</option>
                        {US_STATES.map((s) => (
                          <option key={s.code} value={s.code}>
                            {s.code}: {s.name}
                          </option>
                        ))}
                      </select>
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
                      hours, and I am willing to wait {deliveryWindow} for
                      delivery.
                    </span>
                  </label>

                  <div className="cart-summary">
                    <div className="discount-code-row">
                      <label className="field discount-code-field">
                        Discount code
                        <input
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase());
                            setPromoMsg("");
                          }}
                          placeholder="Enter code"
                          autoComplete="off"
                          spellCheck={false}
                        />
                      </label>
                      <button
                        type="button"
                        className="soft-btn"
                        onClick={tryApplyPromo}
                      >
                        Apply
                      </button>
                      {promoApplied?.ok ? (
                        <button
                          type="button"
                          className="ghost-btn"
                          onClick={clearPromo}
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                    {promoMsg ? (
                      <p
                        className={`meta discount-code-msg${
                          promoApplied?.ok ? " ok" : ""
                        }`}
                      >
                        {promoMsg}
                      </p>
                    ) : null}
                    <div className="summary-row">
                      <span>Quoted subtotal</span>
                      <span>{formatMoney(subtotal)}</span>
                    </div>
                    {discountAmount > 0 ? (
                      <div className="summary-row discount-row">
                        <span>
                          Discount
                          {promoApplied?.label
                            ? ` (${promoApplied.label})`
                            : ""}
                        </span>
                        <span>−{formatMoney(discountAmount)}</span>
                      </div>
                    ) : null}
                    <div className="summary-row">
                      <span>
                        {taxInfo.ok && taxInfo.label
                          ? `Est. sales tax (${taxInfo.state})`
                          : "Est. sales tax"}
                      </span>
                      <span>
                        {taxInfo.ok
                          ? formatMoney(taxAmount)
                          : customer.state
                            ? formatMoney(0)
                            : "—"}
                      </span>
                    </div>
                    {labCart && shipBreak.lines?.length ? (
                      shipBreak.lines.map((row) => (
                        <div className="summary-row" key={row.warehouseId}>
                          <span>
                            {row.label} shipping
                            {row.free ? " (free)" : ""}
                            <span className="meta"> · {row.delivery}</span>
                          </span>
                          <span>{formatMoney(row.fee)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="summary-row">
                        <span>US shipping</span>
                        <span>{formatMoney(shipping)}</span>
                      </div>
                    )}
                    {labCart && shipBreak.lines?.length > 1 ? (
                      <div className="summary-row">
                        <span>Shipping total</span>
                        <span>{formatMoney(shipping)}</span>
                      </div>
                    ) : null}
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
                    hear from us. Allow {deliveryWindow} after payment for
                    delivery.
                  </p>
                  <ul className="cart-confirm-meta">
                    <li>Quoted total: {formatMoney(packet.totals?.total || 0)}</li>
                    {packet.discount?.code ? (
                      <li>
                        Discount {packet.discount.label || packet.discount.code}
                        {packet.totals?.discount
                          ? ` (−${formatMoney(packet.totals.discount)})`
                          : ""}
                      </li>
                    ) : null}
                    {packet.tax?.amount > 0 || packet.tax?.state ? (
                      <li>
                        {packet.tax.label || `${packet.tax.state} sales tax`}
                        {packet.totals?.tax
                          ? `: ${formatMoney(packet.totals.tax)}`
                          : ""}
                      </li>
                    ) : null}
                    <li>Ship to: {packet.customer?.name}</li>
                    {packet.waitConsent ? (
                      <li>2-3 week delivery accepted</li>
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
          <h1>Partner portal</h1>
          <p className="lede">
            Drop an Excel sheet, PDF, or CSV. We auto-fill your price list.
            Review the rows, fix anything off, then submit. US shipping only.
          </p>

          <div className="notice">
            Best results: columns like Product / Name, Strength (mg), and Price /
            Cost. PDF needs selectable text (not a scanned image).
            {autoApproveTrusted
              ? " Approved partners: price-list updates auto-publish to the catalog."
              : " All price-list updates still need admin approval."}
          </div>

          <div className="tabs">
            <button
              type="button"
              className={`chip ${tab === "apply" ? "active" : ""}`}
              onClick={() => setTab("apply")}
            >
              New partner application
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
                  Partner name
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
                    placeholder="supply@example.com"
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
                  Partner account
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
            {filled} ready · {lines.length} row{lines.length === 1 ? "" : "s"}.
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
  supplyPolicy,
  onUpdateSupplyPolicy,
  onStgSynced,
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
  const [discountCodes, setDiscountCodes] = useState(() => loadDiscountCodes());
  const [newCode, setNewCode] = useState({
    code: "",
    type: "percent",
    value: "10",
    note: "",
    active: true,
  });
  const [stgUrlDraft, setStgUrlDraft] = useState(
    () => supplyPolicy?.sheetCsvUrl || ""
  );
  const [stgBusy, setStgBusy] = useState(false);
  const [stgShipFlat, setStgShipFlat] = useState(
    () =>
      supplyPolicy?.shippingFlat != null
        ? String(supplyPolicy.shippingFlat)
        : ""
  );
  const [stgShipNote, setStgShipNote] = useState(
    () => supplyPolicy?.shippingNote || ""
  );
  const primaryRows = useMemo(() => {
    // Toggle OOS against raw primary submissions, not the fallback-collapsed shop list
    return submissions
      .filter(
        (s) =>
          s.vendorId === PRIMARY_VENDOR_ID && s.status === "approved"
      )
      .map((s) => ({
        key: offerMatchKey({
          name: s.name,
          mg: s.mg,
          unit: s.unit || "mg",
        }),
        name: s.name,
        mg: s.mg,
        sku: s.sku,
        vendorCost: s.vendorCost,
      }))
      .sort((a, b) => {
        const n = a.name.localeCompare(b.name);
        if (n !== 0) return n;
        return (Number(a.mg) || 0) - (Number(b.mg) || 0);
      });
  }, [submissions]);
  const unavailableSet = useMemo(
    () => new Set(supplyPolicy?.unavailableKeys || []),
    [supplyPolicy]
  );
  const stgCount =
    submissions.filter((s) => s.vendorId === STG_VENDOR_ID).length ||
    loadCachedStgSubmissions().length;

  async function runStgSheetSync() {
    const url = stgUrlDraft.trim();
    if (!url) {
      onFlash?.("Paste a published STG Google Sheet link first");
      return;
    }
    setStgBusy(true);
    try {
      onUpdateSupplyPolicy?.({ sheetCsvUrl: url });
      const result = await syncStgFromSheetUrl(url);
      onStgSynced?.(result);
      if (result.policy.shippingFlat != null) {
        setStgShipFlat(String(result.policy.shippingFlat));
      }
      if (result.policy.shippingNote) {
        setStgShipNote(result.policy.shippingNote);
      }
      onFlash?.(
        `STG synced · ${result.count} lines · used only when primary is unavailable`
      );
    } catch (err) {
      onUpdateSupplyPolicy?.({
        lastSyncError: err?.message || "STG sync failed",
      });
      onFlash?.(err?.message || "STG sync failed");
    } finally {
      setStgBusy(false);
    }
  }

  function saveStgShipping(e) {
    e.preventDefault();
    onUpdateSupplyPolicy?.({
      shippingFlat: stgShipFlat === "" ? null : Number(stgShipFlat),
      shippingNote: stgShipNote.trim(),
    });
    onFlash?.("STG shipping settings saved");
  }

  function togglePrimaryUnavailable(key) {
    const next = new Set(unavailableSet);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onUpdateSupplyPolicy?.({ unavailableKeys: [...next] });
  }

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

  function addDiscountCode(e) {
    e.preventDefault();
    const entry = {
      code: newCode.code,
      type: newCode.type,
      value: Number(newCode.value),
      note: newCode.note,
      active: newCode.active !== false,
    };
    if (!String(entry.code || "").trim() || !(Number(entry.value) > 0)) {
      onFlash?.("Enter a code and a value greater than 0");
      return;
    }
    const without = discountCodes.filter(
      (c) => c.code !== String(entry.code).trim().toUpperCase()
    );
    const next = saveDiscountCodes([...without, entry]);
    setDiscountCodes(next);
    setNewCode({
      code: "",
      type: "percent",
      value: "10",
      note: "",
      active: true,
    });
    onFlash?.(`Discount code saved · ${entry.code.toUpperCase()}`);
  }

  function removeDiscountCode(code) {
    const next = saveDiscountCodes(
      discountCodes.filter((c) => c.code !== code)
    );
    setDiscountCodes(next);
    onFlash?.(`Removed ${code}`);
  }

  function toggleDiscountCode(code) {
    const next = saveDiscountCodes(
      discountCodes.map((c) =>
        c.code === code ? { ...c, active: !c.active } : c
      )
    );
    setDiscountCodes(next);
  }

  return (
    <section className="panel-page fade">
      <div className="container">
        <div className="panel">
          <h1>Approval desk</h1>
          <p className="lede">
            New partners stay human-gated. Configure Venmo / Zelle / crypto here,
            then send customers a pay link after supply check.
          </p>

          <div className="stg-admin panel" style={{ marginBottom: "1.5rem" }}>
            <h2>STG backup supply (silent)</h2>
            <p className="meta">
              Monitor the STG price sheet and shipping notes. STG prices only
              replace a catalog line when you mark the primary (JEC) match
              unavailable. Customers never see vendor names.
            </p>
            <label className="field" style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <input
                type="checkbox"
                checked={supplyPolicy?.fallbackEnabled !== false}
                onChange={(e) =>
                  onUpdateSupplyPolicy?.({
                    fallbackEnabled: e.target.checked,
                  })
                }
              />
              Use STG as replacement when primary is unavailable
            </label>
            <div className="form-row" style={{ marginTop: "0.75rem" }}>
              <label className="field" style={{ flex: 1 }}>
                STG Google Sheet link (published CSV / anyone-with-link)
                <input
                  value={stgUrlDraft}
                  onChange={(e) => setStgUrlDraft(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/…"
                />
              </label>
            </div>
            <div className="row-actions" style={{ marginTop: "0.5rem" }}>
              <button
                type="button"
                className="primary-btn"
                disabled={stgBusy}
                onClick={runStgSheetSync}
              >
                {stgBusy ? "Syncing…" : "Sync STG sheet now"}
              </button>
            </div>
            <p className="meta" style={{ marginTop: "0.5rem" }}>
              Cached STG lines: {stgCount}
              {supplyPolicy?.lastSyncAt
                ? ` · last sync ${new Date(
                    supplyPolicy.lastSyncAt
                  ).toLocaleString()}`
                : " · not synced yet"}
              {supplyPolicy?.lastSyncError
                ? ` · ${supplyPolicy.lastSyncError}`
                : ""}
            </p>
            <p className="meta">
              Or drop an STG export below (Excel / CSV). Same rule: replacement
              only.
            </p>
            <PriceListDropzone
              onParsed={async (lines, meta) => {
                try {
                  const result = await syncStgFromParsedLines(lines, {
                    source: meta?.fileName || "STG upload",
                  });
                  onStgSynced?.(result);
                  onFlash?.(
                    `STG upload · ${result.count} lines ready as backup`
                  );
                } catch (err) {
                  onFlash?.(err?.message || "STG upload failed");
                }
              }}
            />
            <form
              className="form-row"
              style={{ marginTop: "1rem" }}
              onSubmit={saveStgShipping}
            >
              <label className="field">
                STG shipping flat ($)
                <input
                  value={stgShipFlat}
                  onChange={(e) => setStgShipFlat(e.target.value)}
                  inputMode="decimal"
                  placeholder="60"
                />
              </label>
              <label className="field" style={{ flex: 1 }}>
                STG shipping / delivery note
                <input
                  value={stgShipNote}
                  onChange={(e) => setStgShipNote(e.target.value)}
                  placeholder="US shipping only · 2–3 weeks"
                />
              </label>
              <button type="submit" className="soft-btn">
                Save shipping
              </button>
            </form>

            <h3 style={{ marginTop: "1.25rem" }}>
              Primary lines unavailable (use STG match if synced)
            </h3>
            <p className="meta">
              Check a strength to pull STG price/shipping for that compound only
              when a matching STG row exists. Unchecked = keep primary.
            </p>
            <div
              className="table-wrap"
              style={{ maxHeight: "280px", overflow: "auto" }}
            >
              <table>
                <thead>
                  <tr>
                    <th>Unavailable</th>
                    <th>Compound</th>
                    <th>Strength</th>
                    <th>Primary SKU</th>
                  </tr>
                </thead>
                <tbody>
                  {primaryRows.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No primary lines loaded.</td>
                    </tr>
                  ) : (
                    primaryRows.map((row) => (
                      <tr key={row.key + row.sku}>
                        <td>
                          <input
                            type="checkbox"
                            checked={unavailableSet.has(row.key)}
                            onChange={() => togglePrimaryUnavailable(row.key)}
                            aria-label={`Mark ${row.name} unavailable`}
                          />
                        </td>
                        <td>{row.name}</td>
                        <td>
                          {row.mg != null ? `${row.mg} mg` : "—"}
                        </td>
                        <td className="meta">{row.sku}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

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
                  placeholder="/receipt_c212e7f2.jpg"
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
              Solana wallet (USDC or USDT only, not SOL)
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
              Solana QR image URL (optional)
              <input
                value={payConfig.solanaQrUrl || ""}
                onChange={(e) =>
                  setPayConfig((c) => ({
                    ...c,
                    solanaQrUrl: e.target.value.trim(),
                  }))
                }
                placeholder="/solana-qr.png"
                spellCheck={false}
              />
            </label>
            <label className="field">
              Ethereum wallet (USDC or USDT only, not ETH)
              <input
                value={payConfig.ethUsdc}
                onChange={(e) =>
                  setPayConfig((c) => ({ ...c, ethUsdc: e.target.value }))
                }
                placeholder="0x…"
                spellCheck={false}
              />
            </label>
            <label className="field">
              Ethereum QR image URL (optional)
              <input
                value={payConfig.ethQrUrl || ""}
                onChange={(e) =>
                  setPayConfig((c) => ({
                    ...c,
                    ethQrUrl: e.target.value.trim(),
                  }))
                }
                placeholder="/eth-qr.png"
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

          <form className="manual-pay-admin discount-admin" onSubmit={addDiscountCode}>
            <h2>Discount codes</h2>
            <p className="meta">
              Customers enter a code on the cart. Discount applies to merchandise
              only (not shipping). Saved in this browser; optional env{" "}
              <code>VITE_DISCOUNT_CODES=SAVE10:10%,FLAT25:25</code>.
            </p>
            <div className="form-row">
              <label className="field">
                Code
                <input
                  value={newCode.code}
                  onChange={(e) =>
                    setNewCode((c) => ({
                      ...c,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="SAVE10"
                  spellCheck={false}
                />
              </label>
              <label className="field">
                Type
                <select
                  value={newCode.type}
                  onChange={(e) =>
                    setNewCode((c) => ({ ...c, type: e.target.value }))
                  }
                >
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed $ off</option>
                </select>
              </label>
              <label className="field">
                Value
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newCode.value}
                  onChange={(e) =>
                    setNewCode((c) => ({ ...c, value: e.target.value }))
                  }
                  placeholder={newCode.type === "percent" ? "10" : "25"}
                />
              </label>
            </div>
            <label className="field">
              Note (optional)
              <input
                value={newCode.note}
                onChange={(e) =>
                  setNewCode((c) => ({ ...c, note: e.target.value }))
                }
                placeholder="Launch promo"
              />
            </label>
            <button type="submit" className="primary-btn">
              Save discount code
            </button>
            {discountCodes.length > 0 ? (
              <div className="table-wrap" style={{ marginTop: "0.85rem" }}>
                <table>
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Deal</th>
                      <th>Status</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {discountCodes.map((c) => (
                      <tr key={c.code}>
                        <td>
                          <strong>{c.code}</strong>
                          {c.note ? (
                            <div className="meta">{c.note}</div>
                          ) : null}
                        </td>
                        <td>{formatDiscountRule(c)}</td>
                        <td>{c.active ? "Active" : "Off"}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="soft-btn"
                              onClick={() => toggleDiscountCode(c.code)}
                            >
                              {c.active ? "Disable" : "Enable"}
                            </button>
                            <button
                              type="button"
                              className="danger-btn"
                              onClick={() => removeDiscountCode(c.code)}
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="meta" style={{ marginTop: "0.65rem" }}>
                No codes yet. Add one above (e.g. SAVE10 = 10% off).
              </p>
            )}
          </form>

          <div className="notice warn">
            {pendingVendors.length} partner
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
                Auto-publish price-list updates from already-approved partners
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
              <span>Approving a partner also publishes their pending lines</span>
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

          <h2>Pending partners</h2>
          <div className="table-wrap" style={{ marginBottom: "1.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Partner</th>
                  <th>Terms</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingVendors.length === 0 ? (
                  <tr>
                    <td colSpan={4}>No partners waiting.</td>
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
                  <th>Partner</th>
                  <th>Cost → Retail</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingItems.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Queue clear. Catalog is up to date.</td>
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
                          <div className="meta">2-3 week delivery accepted</div>
                        ) : null}
                        {o.payment?.provider ? (
                          <div className="meta">via {o.payment.provider}</div>
                        ) : null}
                      </td>
                      <td>
                        {formatMoney(o.totals?.total || 0)}
                        {o.discount?.code ? (
                          <div className="meta">
                            {o.discount.label || o.discount.code}
                            {o.totals?.discount
                              ? ` (−${formatMoney(o.totals.discount)})`
                              : ""}
                          </div>
                        ) : null}
                        {o.tax?.state ? (
                          <div className="meta">
                            Tax {o.tax.state}
                            {o.totals?.tax
                              ? ` ${formatMoney(o.totals.tax)}`
                              : ""}
                          </div>
                        ) : null}
                      </td>
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
                  <th>Partner</th>
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
                    <td>—</td>
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
