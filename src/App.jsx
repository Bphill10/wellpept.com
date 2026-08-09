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
} from "lucide-react";
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
  resolvePublicLabels,
  formatPublicLineLabel,
  formatOrderDecodeAppendix,
  orderPublicLines,
} from "./data/publicLabels";
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
  notifyAccessoryVendorApply,
  flattenOrderLines,
  applySupplyDecision,
  notifyCustomerOrderDecision,
  defaultsFromCatalogSelection,
} from "./utils/automation";
import {
  loadAccessoryMarketplace,
  saveAccessoryMarketplace,
  applyAccessoryVendor,
  setAccessoryVendorStatus,
  setAccessoryListingStatus,
  getApprovedAccessoryListings,
  ACCESSORY_SHIP_OPTIONS,
} from "./data/accessoryMarketplace";
import { fetchChargebeeConfig } from "./utils/chargebeeClient";
import { fetchPaymentConfig } from "./utils/payments";
import CheckoutPayment from "./components/CheckoutPayment";
import ManualPayMethods from "./components/ManualPayMethods";
import SupplierPayPanel from "./components/SupplierPayPanel";
import {
  loadSupplierPayConfig,
  saveSupplierPayConfig,
  supplierPayConfigured,
  markSupplierLanePaid,
  markOrderFulfilled,
} from "./utils/supplierPayments";
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
  ensureVipMember,
  applyVipCheckoutCode,
  attachReferralToOrder,
  accrueReferralCommission,
  loadReferralState,
  saveReferralSettings,
  saveReferralPayout,
  notifyReferralPayoutDirect,
  markCommissionPaid,
  commissionTotals,
  maskEmail,
  payoutDestinationSummary,
  venmoPayLink,
  isAllowlisted,
  addAllowlistEmail,
  removeAllowlistEmail,
  findReferralByEmail,
} from "./utils/referralCodes";
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
import SkincareHome from "./components/SkincareHome";
import SellOnWellpept from "./components/SellOnWellpept";
import PartnerMarketplaceSection from "./components/PartnerMarketplaceSection";
import {
  UNDISCLOSED_LEGAL,
  WELLPEPT_COSMETIC_LEGAL,
} from "./data/siteLegal";
import ChannelTuneOverlay, { TUNE_MS } from "./components/ChannelTuneOverlay";
import PriceListDropzone from "./components/PriceListDropzone";
import LiveChat, { openLiveChat, contactEmail } from "./components/LiveChat";
import SentinelKnowledgeChat from "./components/SentinelKnowledgeChat";
import AuthGate from "./components/AuthGate";
import AgeGate, { hasAgeClearance } from "./components/AgeGate";
import UndisclosedNews from "./components/UndisclosedNews";
import {
  approvedCatalogImage,
  UD_FEATURED_KIT_SRC,
  UD_LABEL_BRAND,
} from "./data/udLabelAssets";
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
  sell: "sell",
  shop: "shop",
  product: "product",
  cart: "cart",
  vendor: "vendor",
  admin: "admin",
  calculator: "calculator",
};

function VialPreview({
  product,
  size = "md",
  showDownload = false,
  showLabel = true,
}) {
  const vialGlow =
    product?.powderColor === "blue"
      ? "vial-glow--blue"
      : product?.powderColor === "liquid-red" || product?.contentsType === "LIQUID"
        ? "vial-glow--sun"
        : "vial-glow--sun";

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
  const approvedSrc = approvedCatalogImage(product);
  if (approvedSrc) {
    return (
      <div
        className={`skin-bottle-preview skin-bottle-preview--${size} skin-bottle-preview--photo vial-approved-photo ${vialGlow}`}
      >
        <img src={approvedSrc} alt="" className="vial-approved-img" />
      </div>
    );
  }
  return (
    <div
      className={`skin-bottle-preview skin-bottle-preview--${size} skin-bottle-preview--photo vial-approved-photo vial-approved-photo--empty ${vialGlow}`}
      aria-hidden="true"
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
  const [accessoryMarket, setAccessoryMarket] = useState(() =>
    loadAccessoryMarketplace()
  );
  const wellpeptMarketplaceListings = useMemo(
    () =>
      getApprovedAccessoryListings(accessoryMarket, { channel: "wellpept" }),
    [accessoryMarket]
  );
  const undisclosedMarketplaceListings = useMemo(
    () =>
      getApprovedAccessoryListings(accessoryMarket, {
        channel: "undisclosed",
      }),
    [accessoryMarket]
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
  const [udGridLive, setUdGridLive] = useState(false);
  const [sentinelChatOpen, setSentinelChatOpen] = useState(false);
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
  const [paymentReceipt, setPaymentReceipt] = useState(null);
  const [session, setSession] = useState(() => getSession());
  const [showAuth, setShowAuth] = useState(false);
  const [ageOk, setAgeOk] = useState(() => hasAgeClearance());
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
    const paidFlag = params.get("paid");
    const redirectStatus = params.get("redirect_status");
    const paymentIntentId = params.get("payment_intent");
    let parsedPay = null;
    if (payRaw) {
      parsedPay = parseStripePayPayload(payRaw);
      if (parsedPay) {
        setPayInvoice(parsedPay);
        setView(VIEWS.cart);
      }
    }
    if (viewParam === "cart" || cb === "success" || cb === "cancel" || paidFlag === "1") {
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

    // Affirm / Stripe redirect return — mark paid when redirect_status succeeded
    if (
      paidFlag === "1" &&
      (redirectStatus === "succeeded" ||
        redirectStatus === "processing" ||
        !redirectStatus)
    ) {
      const orderId =
        parsedPay?.orderId ||
        (() => {
          try {
            return sessionStorage.getItem("wellpept-pay-order-id") || "";
          } catch {
            return "";
          }
        })();
      const invoice =
        parsedPay ||
        (() => {
          try {
            const raw = sessionStorage.getItem("wellpept-pay-invoice");
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })();
      if (orderId) {
        window.setTimeout(() => {
          handleStripePaid(
            orderId,
            {
              id: paymentIntentId || `stripe-redirect-${Date.now()}`,
              paymentIntentId: paymentIntentId || "",
              status: redirectStatus || "succeeded",
              provider: "stripe",
              methods: "card_or_affirm",
              amountCents: Math.round(Number(invoice?.total || 0) * 100),
            },
            invoice
          );
        }, 0);
      } else if (paymentIntentId || paidFlag === "1") {
        // Redirect lost the pay payload — still show a clear success screen.
        setPaymentReceipt({
          orderId: paymentIntentId || "see Stripe / email",
          total: null,
          provider: "stripe",
          paidAt: new Date().toISOString(),
        });
        setFlash("Payment received. Check your email for the receipt.");
        setView(VIEWS.cart);
      }
    }

    if (cb || viewParam === "cart" || payRaw || paidFlag) {
      const url = new URL(window.location.href);
      url.searchParams.delete("cb");
      url.searchParams.delete("view");
      url.searchParams.delete("paid");
      url.searchParams.delete("redirect_status");
      url.searchParams.delete("payment_intent");
      url.searchParams.delete("payment_intent_client_secret");
      // Keep pay payload until paid handler clears it
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }, []);

  useEffect(() => {
    if (!urlWantsLabQuery) return;
    setLabUnlocked(true);
    setLabUnlockedState(true);
    // Strip ?lab= / #undisclosed but stay on `/` so refresh ≠ Undisclosed.
    cleanLabUnlockUrl({ promotePath: false });
    setRoutePath(
      typeof window !== "undefined" ? window.location.pathname : "/"
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

  // Steady electrified grid when Undisclosed is open (power-up animates on unlock).
  useEffect(() => {
    if (!labVisible) {
      setUdGridLive(false);
      setSentinelChatOpen(false);
      return;
    }
    if (channelTuning) return;
    setUdGridLive(true);
  }, [labVisible, channelTuning]);

  useEffect(() => {
    if (opsUnlocked) return;
    if (view === VIEWS.vendor || view === VIEWS.admin) {
      setView(labVisible ? VIEWS.shop : VIEWS.skincare);
    }
  }, [opsUnlocked, view, labVisible]);

  function unlockLabMenu(message = "Undisclosed unlocked", { flashMsg = true } = {}) {
    setLabUnlocked(true);
    setLabUnlockedState(true);
    // Keep current path (usually `/`). Promoting to /undisclosed made every
    // reload reopen the lab + age gate for anyone who unlocked once.
    cleanLabUnlockUrl({ promotePath: false });
    setRoutePath(
      typeof window !== "undefined" ? window.location.pathname : "/"
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
    setUdGridLive(true);
    setFlash("Undisclosed unlocked");
  }

  function startChannelTuneUnlock() {
    if (channelTuneLockRef.current || channelTuning || labVisible) return;
    channelTuneLockRef.current = true;
    [
      UD_LABEL_BRAND.whiteTransparent,
      UD_FEATURED_KIT_SRC,
    ].forEach((href) => {
      const img = new Image();
      img.decoding = "async";
      img.src = href;
    });
    setUdGridLive(false);
    setChannelTuning(true);
    // Never leave the unlock overlay blocking taps (Add to cart, etc.)
    window.setTimeout(() => {
      channelTuneLockRef.current = false;
      setChannelTuning(false);
      setUdGridLive(true);
    }, TUNE_MS + 1200);
  }

  function lockLabMenu() {
    setLabUnlocked(false);
    setLabUnlockedState(false);
    setUdGridLive(false);
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
    const isAccessory =
      product.kind === "tool" ||
      product.kind === "mini" ||
      product.kind === "kit" ||
      product.accessory ||
      product.marketplace;
    const forUndisclosed =
      product.channel === "undisclosed" ||
      (Array.isArray(product.channels) &&
        product.channels.includes("undisclosed") &&
        !product.channels.includes("wellpept"));
    const shipMode =
      product.shipMode ||
      (Array.isArray(product.shipModes) ? product.shipModes[0] : null) ||
      "economy";
    const shipOpt =
      isAccessory && ACCESSORY_SHIP_OPTIONS[shipMode]
        ? ACCESSORY_SHIP_OPTIONS[shipMode]
        : null;
    const mixLabel =
      product.kind === "mix" && product.buildSummary
        ? `${product.buildSummary.base}: ${product.buildSummary.peptides.join(" + ")}${
            product.buildSummary.customs?.length
              ? ` + ${product.buildSummary.customs.join(", ")}`
              : ""
          }`
        : product.size;
    const cartId = isAccessory
      ? `${product.id}-${shipMode}`
      : product.id;
    const isSkinLine = !forUndisclosed;
    addToCart({
      id: cartId,
      name: product.name,
      price: product.price,
      form: mixLabel,
      mg: 0,
      unit: "",
      unitLabel: product.size,
      vendor: forUndisclosed ? "Undisclosed Partner" : "WellPept",
      vendorId: shipOpt
        ? `wellpept-mkt-${shipMode}`
        : forUndisclosed
          ? "undisclosed-mkt"
          : "wellpept-skin",
      shippingFlat: shipOpt ? shipOpt.shippingFlat : 8,
      minOrder: 0,
      shippingNote: shipOpt
        ? shipOpt.ships
        : "US ground, cold-pack when needed",
      sku: String(product.sku || product.id).toUpperCase().slice(0, 48),
      category:
        product.kind === "mix"
          ? "Renew"
          : product.kind === "kit"
            ? "Fresh Mix"
            : isAccessory
              ? forUndisclosed
                ? "Partner"
                : "Accessories"
              : "Skincare",
      skin: isSkinLine,
      mix: product.kind === "mix",
      accessory: isAccessory,
      shipMode: shipOpt ? shipMode : undefined,
      marketplaceVendorId: product.marketplaceVendorId || "",
      image: product.image || "",
      ships: shipOpt ? shipOpt.ships : "2-3 weeks delivery",
      legalNote: forUndisclosed
        ? "For research use only. Not for human consumption."
        : product.kind === "mix" ||
            product.kind === "ready" ||
            product.kind === "kit" ||
            isAccessory
          ? "Cosmetic skincare only. Not for injection or medical use."
          : undefined,
      ...resolvePublicLabels({
        name: product.name,
        sku: String(product.sku || product.id).toUpperCase().slice(0, 48),
        skin: isSkinLine,
        kind: product.kind,
      }),
    });
    setFlash(
      isAccessory && shipOpt
        ? `Added ${product.name} · ${shipOpt.label} (${shipOpt.delivery})`
        : `Added ${product.name} (request only, no payment yet)`
    );
  }

  async function handleAccessoryVendorApply(payload) {
    const result = applyAccessoryVendor(payload);
    if (!result.ok) return result;
    setAccessoryMarket(result.market);
    try {
      await notifyAccessoryVendorApply({
        vendor: result.vendor,
        listing: result.listing,
      });
    } catch {
      /* mailto fallback inside notify */
    }
    setFlash(`Sell application received · ${result.vendor.name}`);
    return result;
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
      role: "partner",
      warehouseId: "B",
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
          id: line.id || uid("s"),
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
          submittedAt: line.submittedAt || now,
          reviewedAt: autoPublish ? now : line.reviewedAt || null,
        };
      });

    if (lines.length === 0) {
      setFlash("Add at least one valid line item");
      return false;
    }

    // Upsert by vendor + SKU so drag-drop edits update existing rows
    setSubmissions((prev) => {
      const incoming = new Map(
        lines.map((l) => [`${l.vendorId}::${l.sku}`, l])
      );
      const next = prev.map((s) => {
        const key = `${s.vendorId}::${String(s.sku || "").toUpperCase()}`;
        if (!incoming.has(key)) return s;
        const neu = incoming.get(key);
        incoming.delete(key);
        return {
          ...s,
          ...neu,
          id: s.id,
          submittedAt: now,
          reviewedAt: autoPublish ? now : null,
          status: autoPublish ? "approved" : "pending",
        };
      });
      return [...incoming.values(), ...next];
    });
    setFlash(
      autoPublish
        ? `${lines.length} line${lines.length === 1 ? "" : "s"} published for ${vendor?.name || "partner"}`
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

  function handleStripePaid(orderId, payment, invoiceOverride = null) {
    const provider = payment?.provider || "stripe";
    const invoice = invoiceOverride || payInvoice;
    let updated = markOrderPaid(orderId, {
      ...payment,
      provider,
    });
    if (!updated && invoice?.orderId === orderId) {
      updated = {
        orderId,
        createdAt: new Date().toISOString(),
        status: "paid",
        paymentDue: null,
        paidAt: new Date().toISOString(),
        customer: invoice.customer,
        totals: {
          subtotal: invoice.total,
          shipping: 0,
          total: invoice.total,
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
    // Referral cash is sent after delivery (fulfilled), not at payment
    setPayInvoice(null);
    setPaymentReceipt({
      orderId,
      total: invoice?.total ?? updated?.totals?.total ?? null,
      provider,
      paidAt: new Date().toISOString(),
      customerEmail: invoice?.customer?.email || updated?.customer?.email || "",
    });
    try {
      sessionStorage.removeItem("wellpept-pay-order-id");
      sessionStorage.removeItem("wellpept-pay-invoice");
    } catch {
      /* ignore */
    }
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("pay");
      url.searchParams.delete("paid");
      url.searchParams.delete("redirect_status");
      url.searchParams.delete("payment_intent");
      url.searchParams.delete("payment_intent_client_secret");
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
      referral = null,
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
    // VIP members already have codes from allowlist/signup; attach friend share if used
    if (packet.customer?.email && isAllowlisted(packet.customer.email)) {
      ensureVipMember(packet.customer.email);
    }
    const withRef = attachReferralToOrder(packet, referral);
    setOrders(saveOrder(withRef));
    setCart([]);
    if (notify && !payment) {
      const notifyResult = await notifyOrderRequest(withRef);
      if (notifyResult?.warning) {
        setFlash(notifyResult.warning);
      } else if (notifyResult?.via === "resend") {
        setFlash(
          `Request ${withRef.orderId} sent · we’ll confirm supply within 24 hours`
        );
      } else {
        setFlash(
          `Request ${withRef.orderId} drafted in your email app · send it, then use Yes/No links`
        );
      }
    } else {
      setFlash(
        payment
          ? `Payment received · order ${withRef.orderId}`
          : `Request ${withRef.orderId} sent · we’ll confirm supply within 24 hours`
      );
    }
    return withRef;
  }

  return (
    <div
      className={`app-shell ${
        labVisible ? "app-shell--undisclosed" : "app-shell--skincare"
      }${labVisible && udGridLive ? " app-shell--ud-live" : ""}${
        channelTuning ? " app-shell--ud-powering" : ""
      }`}
    >
      {!ageOk && (
        <AgeGate
          brand={labVisible ? "Undisclosed" : "WellPept"}
          labMode={labVisible}
          onClear={() => setAgeOk(true)}
        />
      )}
      {showAuth && (
        <AuthGate
          labMode={labVisible}
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
              src={labVisible ? UD_LABEL_BRAND.whiteTransparent : "/wp-monogram.svg"}
              alt={labVisible ? "Undisclosed" : "WellPept"}
              className={`brand-logo${labVisible ? " brand-logo--ud-hex" : ""}`}
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
                onClick={() => {
                  setView(VIEWS.skincare);
                  document
                    .getElementById("accessories")
                    ?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Accessories
              </button>
              <button
                type="button"
                className="header-nav-link"
                onClick={() => {
                  setView(VIEWS.sell);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                Sell
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
                  setView(VIEWS.sell);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <Store size={16} />
                <span>Sell</span>
              </button>
            )}
            {labVisible && (
              <button
                type="button"
                className="ghost-btn"
                onClick={() => {
                  setView(VIEWS.shop);
                  window.setTimeout(() => {
                    document
                      .getElementById("ud-news")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 40);
                }}
              >
                <span>News</span>
              </button>
            )}
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
            onSell={() => {
              setView(VIEWS.sell);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            marketplaceListings={wellpeptMarketplaceListings}
          />
        )}

        {view === VIEWS.sell && (
          <SellOnWellpept
            labMode={labVisible}
            onBack={() => {
              setView(labVisible ? VIEWS.shop : VIEWS.skincare);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onSubmit={handleAccessoryVendorApply}
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
                        alt={skinProduct.alt || skinProduct.name}
                        className={`skin-product-img skin-product-img--detail${
                          skinProduct.imageContain
                            ? " skin-product-img--contain"
                            : ""
                        }`}
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
                    {skinProduct.kind === "kit" && (
                      <div className="mix-panel">
                        {skinProduct.sku ? (
                          <p className="meta">SKU: {skinProduct.sku}</p>
                        ) : null}
                        {Array.isArray(skinProduct.ingredients) && (
                          <>
                            <h3>Contents</h3>
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
                            <h3>Activation instructions</h3>
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
                    {skinProduct.legal && (
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
                    src={UD_LABEL_BRAND.whiteTransparent}
                    alt="Undisclosed brand mark"
                    className="hero-brand-mark hero-brand-mark--hex"
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
                  A curated research peptide catalog from vetted, tested, and trusted partners in the U.S. and overseas.
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
                  setView(VIEWS.shop);
                  window.setTimeout(() => {
                    document
                      .getElementById("partner-listings")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }, 40);
                }}
              >
                Partner listings
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
              <button
                type="button"
                className="sentinel-hero-console rise-delay"
                onClick={() => setSentinelChatOpen(true)}
                aria-label="Ask Atlas, the Undisclosed Sentinel knowledge guide"
              >
                <span className="sentinel-hero-orbit" aria-hidden="true">
                  <span className="sentinel-hero-figure">
                    <img
                      src={UD_LABEL_BRAND.mascotWhite}
                      alt=""
                      width={176}
                      height={176}
                    />
                    <span className="sentinel-hero-torso">
                      <i />
                    </span>
                  </span>
                </span>
                <span className="sentinel-hero-copy">
                  <span className="sentinel-hero-status">
                    <i aria-hidden="true" /> Sentinel knowledge desk online
                  </span>
                  <strong>Ask Atlas</strong>
                  <small>
                    Your Undisclosed Sentinel for research guides, COA links,
                    catalog navigation, and calculator label help.
                  </small>
                  <span className="sentinel-hero-tools" aria-hidden="true">
                    <b>Research</b>
                    <b>COA</b>
                    <b>Calculator</b>
                  </span>
                  <span className="sentinel-hero-action">Open knowledge chat →</span>
                </span>
              </button>
            </section>

            <section className="section featured-vendor-section" id="featured">
              <div className="container">
                <div className="featured-vendor panel">
                  <div className="featured-vendor-copy">
                    <span className="featured-kicker">Featured kit</span>
                    <h2>KLOW</h2>
                    <p>
                      Signature Undisclosed kit. 10 × 80 MG sealed research vials
                      with catalog wrap labels (no calculator dosage block).
                      Request first; we confirm supply within 24 hours, then
                      payment. Shipping by warehouse (A / B).
                    </p>
                    <ul className="featured-meta">
                      <li>80 MG blend · kit of 10 vials</li>
                      <li>Catalog label · QR verified</li>
                      <li>Warehouse A: 7–10 days · B: 2–4 weeks</li>
                    </ul>
                  </div>
                  <div className="featured-vendor-visual featured-vendor-visual--kit">
                    <img
                      src={UD_FEATURED_KIT_SRC}
                      alt="Undisclosed KLOW 80 MG 10-vial research kit"
                      className="featured-product-photo featured-product-photo--kit"
                      width={1200}
                      height={800}
                      decoding="async"
                      loading="lazy"
                      fetchPriority="low"
                    />
                  </div>
                </div>
              </div>
            </section>

            <UndisclosedNews />

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

            <PartnerMarketplaceSection
              listings={undisclosedMarketplaceListings}
              onAddToCart={addSkincareToCart}
              onSell={() => {
                setView(VIEWS.sell);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
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
            paymentReceipt={paymentReceipt}
            onClearPaymentReceipt={() => setPaymentReceipt(null)}
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
            accessoryMarket={accessoryMarket}
            onApproveAccessoryVendor={(id) => {
              const next = setAccessoryVendorStatus(id, "approved");
              setAccessoryMarket(next);
              setFlash("Accessory vendor approved");
            }}
            onRejectAccessoryVendor={(id) => {
              const next = setAccessoryVendorStatus(id, "rejected");
              setAccessoryMarket(next);
              setFlash("Accessory vendor rejected");
            }}
            onApproveAccessoryListing={(id) => {
              const next = setAccessoryListingStatus(id, "approved");
              setAccessoryMarket(next);
              setFlash("Accessory listing approved");
            }}
            onRejectAccessoryListing={(id) => {
              const next = setAccessoryListingStatus(id, "rejected");
              setAccessoryMarket(next);
              setFlash("Accessory listing rejected");
            }}
            onApproveAllPending={approveAllPending}
            onApproveAllLines={approveAllPendingLines}
            onRejectAllLines={rejectAllPendingLines}
            onMarkOrderPaid={(orderId, provider) => {
              const updated = markOrderPaid(orderId, {
                provider,
                status: "succeeded",
                methods: provider,
              });
              if (updated) {
                setOrders(loadOrders());
              }
              setFlash(`Marked paid · ${orderId} · ${provider}`);
            }}
            onMarkSupplierPaid={(orderId, warehouseId, meta) => {
              const updated = markSupplierLanePaid(
                orderId,
                warehouseId,
                meta
              );
              if (updated) {
                setOrders(loadOrders());
                setFlash(
                  updated.status === "ordered"
                    ? `Suppliers paid · ${orderId} · status: ordered — place the PO`
                    : `Supplier ${warehouseId} paid · ${orderId}`
                );
              }
            }}
            onMarkOrderFulfilled={(orderId) => {
              const updated = markOrderFulfilled(orderId);
              if (updated) {
                setOrders(loadOrders());
                setFlash(
                  `Delivered · ${orderId}` +
                    (updated.referral?.commission
                      ? ` · $${Number(updated.referral.commission).toFixed(2)} to referrer`
                      : updated.referral?.code
                        ? " · share code on order"
                        : "")
                );
              }
            }}
            onOrderDecided={(packet) => {
              if (!packet) return;
              setOrders(saveOrder(packet));
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
            {labVisible ? UNDISCLOSED_LEGAL.footer : WELLPEPT_COSMETIC_LEGAL.footer}
            {!labVisible ? <> Questions: {contactEmail()}.</> : null}
          </p>
        </div>
      </footer>
      <SentinelKnowledgeChat
        open={labVisible && sentinelChatOpen}
        onClose={() => setSentinelChatOpen(false)}
        onBrowseCatalog={() => {
          setSentinelChatOpen(false);
          setView(VIEWS.shop);
          window.setTimeout(() => {
            document
              .getElementById("partner-listings")
              ?.scrollIntoView({ behavior: "smooth" });
          }, 40);
        }}
        onOpenCalculator={() => {
          setSentinelChatOpen(false);
          setCalcInitial(null);
          setView(VIEWS.calculator);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onHumanSupport={() => {
          if (!openLiveChat()) {
            window.location.href = `mailto:${contactEmail()}?subject=Undisclosed%20research%20question`;
          }
        }}
      />
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
    <article
      className={`product-card${product.powderColor === "blue" ? " product-card--blue-vial" : ""}`}
    >
      <button
        type="button"
        className="product-card-main"
        onClick={() => onOpen(listing, product.id)}
      >
        <div className="product-visual">
          {(product.badge || listing.badge) && (
            <span className="badge">{product.badge || listing.badge}</span>
          )}
          <VialPreview product={product} size="md" showLabel />
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
          <div className="card-research">
            <strong>Research focus</strong>
            <span>{researchHelpFor(listing.name)}</span>
          </div>
          <div className="meta">
            {formatStrengthLabel(product)} · {formatCustomerForm(product)}
          </div>
          <div className="meta vial-size-tag">
            {product.powderColor === "liquid-red" || product.contentsType === "LIQUID"
              ? "Ruby liquid vial"
              : product.powderColor === "blue"
                ? "Cobalt vial"
                : "Clear vial"}
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
            <p className="detail-research-note">{UNDISCLOSED_LEGAL.short}</p>
            <p className="detail-research-note detail-dose-disclaimer">
              <strong>Dose range note:</strong> Any DOSE RANGE shown on
              Undisclosed vial labels is an auto-suggested lab convenience range
              (research dose → about 2×, often framed as 10–20 syringe units).
              It comes from Undisclosed reconstitution defaults — not from the
              COA, not from manufacturer labeling, and not medical or clinical
              dosing guidance.
            </p>
            <div className="meta">
              {formatStrengthLabel(product)} · {formatCustomerForm(product)}
              {product.powderColor === "liquid-red" || product.contentsType === "LIQUID"
                ? " · ruby liquid vial"
                : product.powderColor === "blue"
                  ? " · cobalt vial"
                  : " · clear vial"}
              {product.purity ? ` · Purity ${product.purity}` : ""}
            </div>
            <div className="meta">US shipping via WellPept</div>

            <CoaStorePanel
              productId={product.id}
              productName={listing.name || product.name}
              seedUrl={product.coaUrl || ""}
              onChanged={() => setCoaTick((n) => n + 1)}
            />
          </div>
          <div className="buy-box panel">
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
  paymentReceipt = null,
  onClearPaymentReceipt,
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
  const [cosmeticConsent, setCosmeticConsent] = useState(false);
  const [researchConsent, setResearchConsent] = useState(false);
  const [step, setStep] = useState("shipping"); // shipping | done
  const [packet, setPacket] = useState(null);
  const [packetMsg, setPacketMsg] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promoApplied, setPromoApplied] = useState(null);
  const [promoMsg, setPromoMsg] = useState("");
  const [refApplied, setRefApplied] = useState(null);
  const [refMsg, setRefMsg] = useState("");
  const [myVip, setMyVip] = useState(null);
  const [myPayout, setMyPayout] = useState({
    method: "venmo",
    venmo: "",
    zelle: "",
    crypto: "",
  });

  useEffect(() => {
    if (!session?.userId) return;
    setCustomer((c) => ({
      ...c,
      email: session.email || c.email,
      userId: session.userId,
    }));
    if (session.email && isAllowlisted(session.email)) {
      const mine = ensureVipMember(session.email);
      setMyVip(mine);
      if (mine?.payout) {
        setMyPayout({
          method: mine.payout.method || "venmo",
          venmo: mine.payout.venmo || "",
          zelle: mine.payout.zelle || "",
          crypto: mine.payout.crypto || "",
        });
      }
    } else {
      setMyVip(null);
    }
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
    const buyer = session?.email || customer.email;
    const vip = applyVipCheckoutCode(subtotal, promoApplied.entry.code, buyer);
    if (vip.ok) {
      setPromoApplied(vip);
      if (vip.referral?.ok) {
        setRefApplied(vip.referral);
      } else if (promoApplied.kind === "share") {
        setRefApplied(null);
      }
      return;
    }
    const refreshed = applyDiscountCode(subtotal, promoApplied.entry.code);
    if (!refreshed.ok) {
      setPromoApplied(null);
      setPromoMsg("Code no longer applies");
      setRefApplied(null);
      return;
    }
    if (refreshed.amount !== promoApplied.amount) {
      setPromoApplied(refreshed);
    }
  }, [subtotal]); // eslint-disable-line react-hooks/exhaustive-deps

  function tryApplyPromo(e) {
    e?.preventDefault?.();
    const buyer = session?.email || customer.email;
    const vip = applyVipCheckoutCode(subtotal, promoInput, buyer);
    if (vip.ok) {
      setPromoApplied(vip);
      setPromoMsg(vip.message);
      if (vip.referral?.ok) {
        setRefApplied(vip.referral);
        setRefMsg(vip.referral.message);
      } else {
        setRefApplied(null);
        setRefMsg("");
      }
      return;
    }
    if (vip.message) {
      setPromoApplied(null);
      setPromoMsg(vip.message);
      setRefApplied(null);
      return;
    }
    const result = applyDiscountCode(subtotal, promoInput);
    if (!result.ok) {
      setPromoApplied(null);
      setPromoMsg(result.message || "That code isn’t valid");
      setRefApplied(null);
      return;
    }
    setPromoApplied(result);
    setPromoMsg(result.message);
    setRefApplied(null);
    setRefMsg("");
  }

  function clearPromo() {
    setPromoApplied(null);
    setPromoInput("");
    setPromoMsg("");
    setRefApplied(null);
    setRefMsg("");
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
    if (!labCart && !cosmeticConsent) {
      setPacketMsg(
        "Confirm the cosmetic use acknowledgment (external use only — not for injection)."
      );
      return;
    }
    if (labCart && !researchConsent) {
      setPacketMsg(
        "Confirm the research use acknowledgment (laboratory research only — not for human use)."
      );
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
      const buyerEmail = session.email || customer.email || "";
      const codeRaw = promoApplied?.entry?.code || promoInput;
      let live = null;
      let liveRef = null;
      if (promoApplied?.ok && codeRaw) {
        const vip = applyVipCheckoutCode(subtotal, codeRaw, buyerEmail);
        if (vip.ok) {
          live = vip;
          liveRef = vip.referral?.ok ? vip.referral : null;
        } else {
          live = applyDiscountCode(subtotal, codeRaw);
        }
      }
      const next = await onPlaceOrder?.(
        {
          ...customer,
          email: buyerEmail,
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
          referral: liveRef?.ok ? liveRef : null,
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
            if (paymentReceipt) onClearPaymentReceipt?.();
            onBack();
          }}
        >
          <ArrowLeft size={16} /> Continue shopping
        </button>

        {paymentReceipt && (
          <div className="panel" style={{ marginTop: "1rem" }}>
            <h1>Payment received</h1>
            <p className="lede">
              Thank you. Your payment went through. We’ll prepare your order for
              shipment (about 2–3 weeks after payment).
            </p>
            <div className="notice ok" style={{ marginTop: "0.75rem" }}>
              <strong>Order {paymentReceipt.orderId}</strong>
              {paymentReceipt.total != null ? (
                <div style={{ marginTop: "0.35rem" }}>
                  Paid {formatMoney(paymentReceipt.total)}
                  {paymentReceipt.provider
                    ? ` · ${paymentReceipt.provider}`
                    : ""}
                </div>
              ) : (
                <div className="meta" style={{ marginTop: "0.35rem" }}>
                  Confirmation is in Stripe
                  {paymentReceipt.provider
                    ? ` (${paymentReceipt.provider})`
                    : ""}
                  . Check your email for the receipt.
                </div>
              )}
              {paymentReceipt.customerEmail ? (
                <div className="meta" style={{ marginTop: "0.35rem" }}>
                  Receipt email: {paymentReceipt.customerEmail}
                </div>
              ) : null}
            </div>
            <button
              type="button"
              className="primary-btn"
              style={{ marginTop: "1rem" }}
              onClick={() => {
                onClearPaymentReceipt?.();
                onBack();
              }}
            >
              Continue shopping
            </button>
          </div>
        )}

        {payInvoice && (
          <div className="panel" style={{ marginTop: "1rem" }}>
            <h1>Pay order {payInvoice.orderId}</h1>
            <p className="lede">
              Supply confirmed. Pay the quoted total with Venmo, Zelle, or
              crypto (USDC or USDT only on Solana / Ethereum — 5% off for
              crypto). Card checkout appears below when Stripe is enabled.
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

            {Array.isArray(payInvoice.lines) && payInvoice.lines.length > 0 ? (
              <div className="notice" style={{ marginTop: "0.75rem" }}>
                <strong>After-order confirmation</strong>
                <p className="meta" style={{ margin: "0.35rem 0 0.5rem" }}>
                  {labCart
                    ? UNDISCLOSED_LEGAL.orderMapCaution
                    : WELLPEPT_COSMETIC_LEGAL.orderMapCaution}
                </p>
                <strong>Invoice items</strong>
                <ul style={{ margin: "0.5rem 0 0", paddingLeft: "1.1rem" }}>
                  {payInvoice.lines.map((line, i) => (
                    <li key={`${line.publicCode || i}-${i}`}>
                      {formatPublicLineLabel(line)}
                    </li>
                  ))}
                </ul>
                <pre
                  className="meta"
                  style={{
                    marginTop: "0.75rem",
                    whiteSpace: "pre-wrap",
                    fontFamily: "inherit",
                  }}
                >
                  {formatOrderDecodeAppendix(payInvoice.lines, {
                    labMode: labCart,
                  })}
                </pre>
              </div>
            ) : null}

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
                  publicCodes={(payInvoice.lines || [])
                    .map((l) => l.publicCode)
                    .filter(Boolean)
                    .join(",")}
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

        {!payInvoice && !paymentReceipt && (
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

                  {!labCart && (
                    <div className="sk-legal-box sk-legal-box--cart">
                      <p className="sk-legal-title">
                        {WELLPEPT_COSMETIC_LEGAL.cartTitle}
                      </p>
                      <p>{WELLPEPT_COSMETIC_LEGAL.medium}</p>
                      <ul className="sk-legal-long sk-legal-long--compact">
                        {WELLPEPT_COSMETIC_LEGAL.long.map((line) => (
                          <li key={line.slice(0, 28)}>{line}</li>
                        ))}
                      </ul>
                      <label className="consent-check">
                        <input
                          type="checkbox"
                          checked={cosmeticConsent}
                          onChange={(e) => setCosmeticConsent(e.target.checked)}
                          required
                        />
                        <span>{WELLPEPT_COSMETIC_LEGAL.cartCheckbox}</span>
                      </label>
                      <p className="meta">{WELLPEPT_COSMETIC_LEGAL.short}</p>
                    </div>
                  )}

                  {labCart && (
                    <div className="sk-legal-box sk-legal-box--cart">
                      <p className="sk-legal-title">
                        {UNDISCLOSED_LEGAL.cartTitle}
                      </p>
                      <p>{UNDISCLOSED_LEGAL.medium}</p>
                      <ul className="sk-legal-long sk-legal-long--compact">
                        {UNDISCLOSED_LEGAL.long.map((line) => (
                          <li key={line.slice(0, 28)}>{line}</li>
                        ))}
                      </ul>
                      <label className="consent-check">
                        <input
                          type="checkbox"
                          checked={researchConsent}
                          onChange={(e) => setResearchConsent(e.target.checked)}
                          required
                        />
                        <span>{UNDISCLOSED_LEGAL.cartCheckbox}</span>
                      </label>
                      <p className="meta">{UNDISCLOSED_LEGAL.short}</p>
                    </div>
                  )}

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
                    {myVip ? (
                      <div className="referral-mine notice">
                        <strong>Your two codes</strong>
                        <p className="meta">
                          Personal = 20% off your orders. Share = friends get
                          10% off; you get the other 10% after their order is
                          delivered.
                        </p>
                        <div className="referral-dual-codes">
                          <div>
                            <span className="meta">Your 20% code</span>
                            <strong>{myVip.personalCode}</strong>
                            <button
                              type="button"
                              className="soft-btn"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    myVip.personalCode
                                  );
                                  setPromoMsg(
                                    `Copied personal code ${myVip.personalCode}`
                                  );
                                } catch {
                                  window.prompt(
                                    "Copy your 20% code",
                                    myVip.personalCode
                                  );
                                }
                              }}
                            >
                              Copy
                            </button>
                          </div>
                          <div>
                            <span className="meta">Share with friends</span>
                            <strong>{myVip.shareCode}</strong>
                            <button
                              type="button"
                              className="soft-btn"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(
                                    myVip.shareCode
                                  );
                                  setPromoMsg(
                                    `Copied share code ${myVip.shareCode}`
                                  );
                                } catch {
                                  window.prompt(
                                    "Copy share code",
                                    myVip.shareCode
                                  );
                                }
                              }}
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                        <div className="referral-payout-fields">
                          <p className="meta">
                            <strong>Where we send your 10% cut</strong>
                          </p>
                          <div className="form-row">
                            <label className="field">
                              Method
                              <select
                                value={myPayout.method}
                                onChange={(e) =>
                                  setMyPayout((p) => ({
                                    ...p,
                                    method: e.target.value,
                                  }))
                                }
                              >
                                <option value="venmo">Venmo</option>
                                <option value="zelle">Zelle</option>
                                <option value="crypto">Crypto / USDT</option>
                              </select>
                            </label>
                            {myPayout.method === "venmo" ? (
                              <label className="field">
                                Venmo handle
                                <input
                                  value={myPayout.venmo}
                                  onChange={(e) =>
                                    setMyPayout((p) => ({
                                      ...p,
                                      venmo: e.target.value.replace(/^@/, ""),
                                    }))
                                  }
                                  placeholder="yourVenmo"
                                />
                              </label>
                            ) : null}
                            {myPayout.method === "zelle" ? (
                              <label className="field">
                                Zelle email / phone
                                <input
                                  value={myPayout.zelle}
                                  onChange={(e) =>
                                    setMyPayout((p) => ({
                                      ...p,
                                      zelle: e.target.value,
                                    }))
                                  }
                                  placeholder="you@email.com"
                                />
                              </label>
                            ) : null}
                            {myPayout.method === "crypto" ? (
                              <label className="field">
                                Wallet (USDT etc.)
                                <input
                                  value={myPayout.crypto}
                                  onChange={(e) =>
                                    setMyPayout((p) => ({
                                      ...p,
                                      crypto: e.target.value.trim(),
                                    }))
                                  }
                                  placeholder="Address"
                                  spellCheck={false}
                                />
                              </label>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            className="soft-btn"
                            onClick={() => {
                              if (!session?.email) return;
                              const row = saveReferralPayout(
                                session.email,
                                myPayout
                              );
                              setMyVip(row);
                              setPromoMsg(
                                row
                                  ? `Payout saved · ${payoutDestinationSummary(row.payout)}`
                                  : "Could not save payout"
                              );
                            }}
                          >
                            Save payout destination
                          </button>
                        </div>
                      </div>
                    ) : null}
                    <div className="discount-code-row">
                      <label className="field discount-code-field">
                        Code (discount or friend share)
                        <input
                          value={promoInput}
                          onChange={(e) => {
                            setPromoInput(e.target.value.toUpperCase());
                            setPromoMsg("");
                          }}
                          placeholder="Your 20% code or a friend’s share code"
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
                    {refApplied?.ok ? (
                      <div className="summary-row discount-row">
                        <span>Friend share {refApplied.code}</span>
                        <span className="meta">
                          ~{formatMoney(refApplied.commission)} to them after
                          delivery
                        </span>
                      </div>
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
                      disabled={
                        submitting ||
                        !waitConsent ||
                        (!labCart && !cosmeticConsent) ||
                        (labCart && !researchConsent)
                      }
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
                    {packet.referral?.code ? (
                      <li>
                        Friend share code: {packet.referral.code} (they earn
                        after delivery)
                      </li>
                    ) : null}
                    {myVip ? (
                      <li>
                        Your codes — 20%: <strong>{myVip.personalCode}</strong>{" "}
                        · share: <strong>{myVip.shareCode}</strong>
                      </li>
                    ) : null}
                  </ul>
                  {orderPublicLines(packet).length > 0 ? (
                    <div className="notice" style={{ marginTop: "0.75rem" }}>
                      <strong>After-order confirmation</strong>
                      <p className="meta" style={{ margin: "0.35rem 0 0.5rem" }}>
                        {labCart
                          ? UNDISCLOSED_LEGAL.orderMapCaution
                          : WELLPEPT_COSMETIC_LEGAL.orderMapCaution}
                      </p>
                      <strong>Invoice items</strong>
                      <ul style={{ margin: "0.35rem 0 0", paddingLeft: "1.1rem" }}>
                        {orderPublicLines(packet).map((row, i) => (
                          <li key={`${row.publicCode}-${i}`}>
                            {formatPublicLineLabel(row)}
                          </li>
                        ))}
                      </ul>
                      <pre
                        className="meta"
                        style={{
                          marginTop: "0.65rem",
                          whiteSpace: "pre-wrap",
                          fontFamily: "inherit",
                        }}
                      >
                        {formatOrderDecodeAppendix(packet, { labMode: labCart })}
                      </pre>
                    </div>
                  ) : null}
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

function submissionToEditorLine(s) {
  return {
    id: s.id,
    sku: s.sku || "",
    name: s.name || "",
    form: s.form || "Lyophilized vial · 3ml",
    purity: s.purity || "99%",
    mg: s.mg != null ? String(s.mg) : "",
    unit: s.unit || "mg",
    vendorCost: s.vendorCost != null ? String(s.vendorCost) : "",
    category: s.category || "Research",
    vialMl: String(s.vialMl || resolveVialMl(s) || 3),
    submittedAt: s.submittedAt,
    reviewedAt: s.reviewedAt,
    status: s.status,
  };
}

/** Merge dropped rows into the editor by SKU (case-insensitive). */
function mergePriceLines(current, incoming) {
  const base = (current || []).filter(
    (l) => l.name?.trim() || l.sku?.trim() || l.vendorCost
  );
  const bySku = new Map(
    base.map((l) => [String(l.sku || "").trim().toUpperCase(), { ...l }])
  );
  for (const row of incoming || []) {
    const sku = String(row.sku || "").trim().toUpperCase();
    if (!sku) {
      bySku.set(`__new_${bySku.size}_${row.name}`, { ...emptyLine(), ...row });
      continue;
    }
    const prev = bySku.get(sku);
    bySku.set(sku, prev ? { ...prev, ...row, sku, id: prev.id } : { ...row, sku });
  }
  const merged = [...bySku.values()];
  return merged.length ? merged : [emptyLine()];
}

function VendorPortal({
  vendors,
  submissions,
  autoApproveTrusted = true,
  onApply,
  onSubmitLines,
  onUpdateTerms,
}) {
  const [tab, setTab] = useState("update");
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
  const [existingLines, setExistingLines] = useState([emptyLine()]);
  const [terms, setTerms] = useState({
    minOrder: "",
    shippingFlat: "",
    shippingNote: "",
  });

  const mySubs = useMemo(
    () => submissions.filter((s) => s.vendorId === existingVendorId),
    [submissions, existingVendorId]
  );

  function loadCatalogIntoEditor(vendorId = existingVendorId) {
    const rows = submissions
      .filter(
        (s) =>
          s.vendorId === vendorId &&
          (s.status === "approved" || s.status === "pending")
      )
      .map(submissionToEditorLine);
    // Dedupe by SKU, newest first
    const seen = new Set();
    const deduped = [];
    for (const row of rows) {
      const key = String(row.sku || "").toUpperCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      deduped.push(row);
    }
    setExistingLines(deduped.length ? deduped : [emptyLine()]);
  }

  useEffect(() => {
    const vendor = vendors.find((v) => v.id === existingVendorId);
    if (!vendor) return;
    setTerms({
      minOrder: String(vendor.minOrder ?? ""),
      shippingFlat: String(vendor.shippingFlat ?? ""),
      shippingNote: vendor.shippingNote || "",
    });
  }, [existingVendorId, vendors]);

  // Load that partner's catalog when the account changes (not on every persist)
  useEffect(() => {
    if (!existingVendorId) return;
    loadCatalogIntoEditor(existingVendorId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingVendorId]);

  return (
    <section className="panel-page fade">
      <div className="container">
        <div className="panel">
          <h1>Partner portal</h1>
          <p className="lede">
            Drag and drop an Excel, CSV, TXT, or PDF price list. Edit rows in the
            table, then publish. Matching SKUs update existing catalog lines.
          </p>

          <div className="notice">
            Best results: columns like Product / Name, Strength (mg), and Price /
            Cost. PDF needs selectable text (not a scanned image).
            {autoApproveTrusted
              ? " Approved partners: updates auto-publish to the catalog."
              : " All price-list updates still need admin approval."}
          </div>

          <div className="tabs">
            <button
              type="button"
              className={`chip ${tab === "update" ? "active" : ""}`}
              onClick={() => setTab("update")}
            >
              Edit price list
            </button>
            <button
              type="button"
              className={`chip ${tab === "apply" ? "active" : ""}`}
              onClick={() => setTab("apply")}
            >
              New partner application
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
                    lines: lines.length
                      ? mergePriceLines(f.lines, lines)
                      : [emptyLine()],
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
            <div className="form-grid">
              <div className="form-row">
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
                <div className="field" style={{ justifyContent: "flex-end" }}>
                  <span className="meta" style={{ marginBottom: "0.35rem" }}>
                    {mySubs.filter((s) => s.status === "approved").length} live ·{" "}
                    {mySubs.filter((s) => s.status === "pending").length} pending
                  </span>
                  <button
                    type="button"
                    className="soft-btn"
                    onClick={() => loadCatalogIntoEditor()}
                  >
                    Reload catalog into editor
                  </button>
                </div>
              </div>

              <h2 style={{ marginTop: "0.25rem" }}>Shipping & minimums</h2>
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
                <label className="field">
                  Shipping note
                  <input
                    value={terms.shippingNote}
                    onChange={(e) =>
                      setTerms((t) => ({ ...t, shippingNote: e.target.value }))
                    }
                  />
                </label>
              </div>
              <button
                type="button"
                className="soft-btn"
                onClick={() => onUpdateTerms(existingVendorId, terms)}
              >
                Save shipping terms
              </button>

              <h2 style={{ marginTop: "0.75rem" }}>
                Price list — drag & drop, then edit
              </h2>
              <PriceListDropzone
                onParsed={(lines) =>
                  setExistingLines((prev) =>
                    mergePriceLines(prev, lines.length ? lines : [])
                  )
                }
              />
              <PriceListEditor
                lines={existingLines}
                onChange={setExistingLines}
              />
              <div className="form-row" style={{ alignItems: "center" }}>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => onSubmitLines(existingVendorId, existingLines)}
                >
                  {autoApproveTrusted &&
                  vendors.find((v) => v.id === existingVendorId)?.status ===
                    "approved"
                    ? "Publish edits"
                    : "Submit edits for approval"}
                </button>
                <p className="meta" style={{ margin: 0 }}>
                  Same SKU → updates that line. New SKU → adds a line.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function PriceListEditor({ lines, onChange }) {
  const [mode, setMode] = useState("table");

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
          <strong>Edit price-list rows</strong>
          <p className="meta">
            {filled} ready · {lines.length} row{lines.length === 1 ? "" : "s"}.
            Click any cell to edit before publish.
          </p>
        </div>
        <div className="price-review-actions">
          <button
            type="button"
            className={`chip ${mode === "table" ? "active" : ""}`}
            onClick={() => setMode("table")}
          >
            Table
          </button>
          <button
            type="button"
            className={`chip ${mode === "cards" ? "active" : ""}`}
            onClick={() => setMode("cards")}
          >
            Cards
          </button>
          <button
            type="button"
            className="soft-btn"
            onClick={() => onChange([...lines, emptyLine()])}
          >
            <Plus size={14} /> Add row
          </button>
        </div>
      </div>

      {mode === "table" ? (
        <div className="table-wrap price-edit-table-wrap">
          <table className="price-edit-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Name</th>
                <th>Cost</th>
                <th>mg</th>
                <th>Purity</th>
                <th>Category</th>
                <th>Form</th>
                <th>Retail</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id || index}>
                  <td>
                    <input
                      value={line.sku}
                      onChange={(e) => updateLine(index, "sku", e.target.value)}
                      placeholder="SKU"
                    />
                  </td>
                  <td>
                    <input
                      value={line.name}
                      onChange={(e) => updateLine(index, "name", e.target.value)}
                      placeholder="Peptide"
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={line.vendorCost}
                      onChange={(e) =>
                        updateLine(index, "vendorCost", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      value={line.mg}
                      onChange={(e) => updateLine(index, "mg", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={line.purity}
                      onChange={(e) =>
                        updateLine(index, "purity", e.target.value)
                      }
                    />
                  </td>
                  <td>
                    <select
                      value={line.category}
                      onChange={(e) =>
                        updateLine(index, "category", e.target.value)
                      }
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      value={line.form}
                      onChange={(e) => updateLine(index, "form", e.target.value)}
                    />
                  </td>
                  <td className="meta">
                    {line.vendorCost
                      ? formatMoney(retailFromVendor(line.vendorCost))
                      : "—"}
                  </td>
                  <td>
                    {lines.length > 1 && (
                      <button
                        type="button"
                        className="ghost-btn"
                        title="Remove row"
                        onClick={() =>
                          onChange(lines.filter((_, i) => i !== index))
                        }
                      >
                        <X size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        lines.map((line, index) => (
          <div
            key={line.id || index}
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
                  onChange={(e) =>
                    updateLine(index, "category", e.target.value)
                  }
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
        ))
      )}
    </div>
  );
}

function OrderSupplyReviewRow({
  order,
  payConfig,
  onFlash,
  onOrderDecided,
}) {
  const lines = useMemo(() => flattenOrderLines(order), [order]);
  const [kept, setKept] = useState(() => new Set(lines.map((l) => l.key)));
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setKept(new Set(flattenOrderLines(order).map((l) => l.key)));
    setComment("");
  }, [order.orderId]);

  const preview = useMemo(() => {
    const keys = [...kept];
    if (!keys.length) return null;
    return applySupplyDecision(order, {
      decision: "yes",
      keepKeys: keys,
      comment,
    });
  }, [order, kept, comment]);

  function toggle(key) {
    setKept((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function runDecision(decision) {
    if (busy) return;
    setBusy(true);
    try {
      const keepKeys =
        decision === "no" ? [] : [...kept];
      if (decision !== "no" && !keepKeys.length) {
        onFlash?.("Check at least one item, or Decline");
        return;
      }
      const updated = applySupplyDecision(order, {
        decision: decision === "no" ? "no" : "yes",
        keepKeys: decision === "no" ? null : keepKeys,
        comment,
      });
      if (!updated) {
        onFlash?.("Could not apply supply decision");
        return;
      }

      const payUrl =
        updated.status === "awaiting_payment"
          ? buildStripePayUrl(updated)
          : "";
      const payText =
        updated.status === "awaiting_payment"
          ? formatManualPayText({
              orderId: updated.orderId,
              total: updated.totals?.total || 0,
              config: payConfig,
            })
          : "";

      const notify = await notifyCustomerOrderDecision(updated, {
        payUrl,
        payText,
      });
      onOrderDecided?.(updated);

      const kind = updated.supplyDecision?.decision || decision;
      const via = notify?.via || "none";
      if (kind === "no") {
        onFlash?.(
          notify?.ok
            ? `Declined · emailed customer (${via})`
            : `Declined · email draft opened (${via})`
        );
      } else if (kind === "partial") {
        onFlash?.(
          `Partial confirm · ${formatMoney(updated.totals?.total || 0)} · emailed (${via})`
        );
      } else {
        onFlash?.(
          `Confirmed · pay link emailed (${via}) · ${formatMoney(updated.totals?.total || 0)}`
        );
      }
    } finally {
      setBusy(false);
    }
  }

  const droppedCount = lines.length - kept.size;

  return (
    <div className="admin-supply-decide">
      <ul className="admin-supply-lines">
        {lines.map((line) => (
          <li key={line.key}>
            <label>
              <input
                type="checkbox"
                checked={kept.has(line.key)}
                onChange={() => toggle(line.key)}
                disabled={busy}
              />
              <span>
                {line.qty}× {line.supplyLabel || line.name}
                {line.mg != null && Number(line.mg) > 0
                  ? ` (${line.mg}mg)`
                  : ""}{" "}
                <span className="meta">{formatMoney(line.lineTotal || 0)}</span>
                {line.publicLabel || line.publicCode ? (
                  <div className="meta">
                    Customer sees:{" "}
                    {line.publicLabel || "—"}
                    {line.publicCode ? ` [${line.publicCode}]` : ""}
                  </div>
                ) : null}
              </span>
            </label>
          </li>
        ))}
      </ul>
      {droppedCount > 0 && preview ? (
        <div className="meta">
          Partial · new total {formatMoney(preview.totals?.total || 0)} (
          {droppedCount} unavailable)
        </div>
      ) : null}
      <textarea
        className="admin-supply-comment"
        rows={2}
        placeholder="Optional note to customer (override / explanation)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={busy}
      />
      <div className="row-actions admin-pay-actions">
        <button
          type="button"
          className="soft-btn"
          disabled={busy || kept.size === 0}
          onClick={() => runDecision("yes")}
        >
          {droppedCount > 0 ? "Confirm partial & email" : "Yes · email pay link"}
        </button>
        <button
          type="button"
          className="ghost-btn"
          disabled={busy}
          onClick={() => runDecision("no")}
        >
          No · decline
        </button>
      </div>
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
  onMarkSupplierPaid,
  onMarkOrderFulfilled,
  onOrderDecided,
  onFlash,
  accessoryMarket = { vendors: [], listings: [] },
  onApproveAccessoryVendor,
  onRejectAccessoryVendor,
  onApproveAccessoryListing,
  onRejectAccessoryListing,
}) {
  const pendingVendors = vendors.filter((v) => v.status === "pending");
  const pendingItems = submissions.filter((s) => s.status === "pending");
  const pendingAccVendors = (accessoryMarket.vendors || []).filter(
    (v) => v.status === "pending"
  );
  const pendingAccListings = (accessoryMarket.listings || []).filter(
    (l) => l.status === "pending"
  );
  const accVendorName = (id) =>
    (accessoryMarket.vendors || []).find((v) => v.id === id)?.name || id;
  const vendorName = (id) => vendors.find((v) => v.id === id)?.name || id;
  const [payConfig, setPayConfig] = useState(() => loadManualPayConfig());
  const [supplierPay, setSupplierPay] = useState(() =>
    loadSupplierPayConfig()
  );
  const [referralState, setReferralState] = useState(() => loadReferralState());
  const [refLookupEmail, setRefLookupEmail] = useState("");
  const [refLookupResult, setRefLookupResult] = useState("");
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

  function saveSupplierMethods(e) {
    e.preventDefault();
    const next = saveSupplierPayConfig(supplierPay);
    setSupplierPay(next);
    onFlash?.(
      supplierPayConfigured(next)
        ? "Supplier pay methods saved — use on paid orders below"
        : "Add USDT / wire / contact for Warehouse A or B"
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

          <form
            className="manual-pay-admin supplier-pay-admin"
            onSubmit={saveSupplierMethods}
          >
            <h2>Pay suppliers (USDT · wire · Telegram)</h2>
            <p className="meta">
              After a customer pays you, use these addresses to fund the
              warehouse PO immediately. Not Stripe Connect — peptide suppliers
              usually take USDT or wire. Tip: Stripe Dashboard → Instant Payout
              to your debit card, then send USDT to the supplier.
            </p>
            {["A", "B"].map((id) => (
              <div key={id} className="supplier-config-block">
                <h3>{supplierPay[id]?.label || `Warehouse ${id}`}</h3>
                <div className="form-row">
                  <label className="field">
                    USDT TRC20
                    <input
                      value={supplierPay[id]?.usdtTrc20 || ""}
                      onChange={(e) =>
                        setSupplierPay((c) => ({
                          ...c,
                          [id]: { ...c[id], usdtTrc20: e.target.value.trim() },
                        }))
                      }
                      placeholder="T…"
                      spellCheck={false}
                    />
                  </label>
                  <label className="field">
                    USDT Solana
                    <input
                      value={supplierPay[id]?.usdtSolana || ""}
                      onChange={(e) =>
                        setSupplierPay((c) => ({
                          ...c,
                          [id]: { ...c[id], usdtSolana: e.target.value.trim() },
                        }))
                      }
                      placeholder="Solana address"
                      spellCheck={false}
                    />
                  </label>
                </div>
                <div className="form-row">
                  <label className="field">
                    Telegram / contact
                    <input
                      value={supplierPay[id]?.telegram || ""}
                      onChange={(e) =>
                        setSupplierPay((c) => ({
                          ...c,
                          [id]: { ...c[id], telegram: e.target.value.trim() },
                        }))
                      }
                      placeholder="@supplier"
                    />
                  </label>
                  <label className="field">
                    Email / phone
                    <input
                      value={supplierPay[id]?.contact || ""}
                      onChange={(e) =>
                        setSupplierPay((c) => ({
                          ...c,
                          [id]: { ...c[id], contact: e.target.value.trim() },
                        }))
                      }
                      placeholder="ops@…"
                    />
                  </label>
                </div>
                <label className="field">
                  Wire / bank note
                  <input
                    value={supplierPay[id]?.wireNote || ""}
                    onChange={(e) =>
                      setSupplierPay((c) => ({
                        ...c,
                        [id]: { ...c[id], wireNote: e.target.value },
                      }))
                    }
                    placeholder="Bank · account · SWIFT (ops only)"
                  />
                </label>
              </div>
            ))}
            <label className="field">
              Ops note
              <input
                value={supplierPay.note || ""}
                onChange={(e) =>
                  setSupplierPay((c) => ({ ...c, note: e.target.value }))
                }
              />
            </label>
            <button type="submit" className="primary-btn">
              Save supplier pay methods
            </button>
            {!supplierPayConfigured(supplierPay) && (
              <p className="meta" style={{ marginTop: "0.5rem" }}>
                Add at least one USDT address or wire note so Copy pay info works
                on paid orders.
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

          <div className="manual-pay-admin referral-admin">
            <h2>VIP friend codes (allowlist · 20% split)</h2>
            <p className="meta">
              Only emails you add below get the program. At signup they set
              Venmo / Zelle / crypto. They receive two codes:{" "}
              <strong>personal {referralState.settings.personalDiscountPercent}%
              off</strong> for themselves, and a{" "}
              <strong>share code</strong> — friends get{" "}
              {referralState.settings.shareBuyerPercent}% off; the VIP gets the
              other {referralState.settings.shareReferrerPercent}% of
              merchandise <strong>after delivery</strong> (emailed + ops Venmo
              link).
            </p>
            <div className="form-row">
              <label className="field">
                Personal % off
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={referralState.settings.personalDiscountPercent}
                  onChange={(e) =>
                    setReferralState((s) => ({
                      ...s,
                      settings: {
                        ...s.settings,
                        personalDiscountPercent: Number(e.target.value) || 0,
                      },
                    }))
                  }
                />
              </label>
              <label className="field">
                Friend % off (½)
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={referralState.settings.shareBuyerPercent}
                  onChange={(e) =>
                    setReferralState((s) => ({
                      ...s,
                      settings: {
                        ...s.settings,
                        shareBuyerPercent: Number(e.target.value) || 0,
                      },
                    }))
                  }
                />
              </label>
              <label className="field">
                VIP cash % (½)
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={referralState.settings.shareReferrerPercent}
                  onChange={(e) =>
                    setReferralState((s) => ({
                      ...s,
                      settings: {
                        ...s.settings,
                        shareReferrerPercent: Number(e.target.value) || 0,
                      },
                    }))
                  }
                />
              </label>
              <label className="field">
                Max $ per order (0 = none)
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={referralState.settings.maxCommissionPerOrder || 0}
                  onChange={(e) =>
                    setReferralState((s) => ({
                      ...s,
                      settings: {
                        ...s.settings,
                        maxCommissionPerOrder: Number(e.target.value) || 0,
                      },
                    }))
                  }
                />
              </label>
              <label className="field toggle-row" style={{ paddingTop: "1.4rem" }}>
                <input
                  type="checkbox"
                  checked={referralState.settings.active !== false}
                  onChange={(e) =>
                    setReferralState((s) => ({
                      ...s,
                      settings: { ...s.settings, active: e.target.checked },
                    }))
                  }
                />
                <span>Program active</span>
              </label>
            </div>
            <button
              type="button"
              className="primary-btn"
              onClick={() => {
                const next = saveReferralSettings(referralState.settings);
                setReferralState(next);
                onFlash?.(
                  `VIP settings · ${next.settings.personalDiscountPercent}% personal · ${next.settings.shareBuyerPercent}/${next.settings.shareReferrerPercent} share split`
                );
              }}
            >
              Save VIP settings
            </button>

            <h3 style={{ marginTop: "1.1rem" }}>Allowlist (invite emails)</h3>
            <div className="discount-code-row">
              <label className="field discount-code-field">
                Email to invite
                <input
                  type="email"
                  value={refLookupEmail}
                  onChange={(e) => setRefLookupEmail(e.target.value)}
                  placeholder="vip@email.com"
                />
              </label>
              <button
                type="button"
                className="soft-btn"
                onClick={() => {
                  const r = addAllowlistEmail(refLookupEmail);
                  setReferralState(loadReferralState());
                  setRefLookupResult(
                    r.ok && r.row
                      ? `Added · personal ${r.row.personalCode} · share ${r.row.shareCode}`
                      : r.error || "Enter a valid email"
                  );
                  if (r.ok) setRefLookupEmail("");
                }}
              >
                Add to list
              </button>
            </div>
            {refLookupResult ? (
              <p className="meta" style={{ marginTop: "0.35rem" }}>
                {refLookupResult}
              </p>
            ) : null}
            {(referralState.settings.allowlist || []).length ? (
              <ul className="referral-allowlist">
                {(referralState.settings.allowlist || []).map((em) => {
                  const row = findReferralByEmail(em, referralState);
                  return (
                    <li key={em}>
                      <div>
                        <strong>{em}</strong>
                        {row ? (
                          <div className="meta">
                            20%: {row.personalCode} · share: {row.shareCode}
                            {row.payout
                              ? ` · ${payoutDestinationSummary(row.payout)}`
                              : " · no payout yet"}
                          </div>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        className="ghost-btn"
                        onClick={() => {
                          setReferralState(removeAllowlistEmail(em));
                          onFlash?.(`Removed ${em} from VIP list`);
                        }}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="meta" style={{ marginTop: "0.35rem" }}>
                No invites yet. Add an email — when they create an account,
                they’ll be asked for payout details.
              </p>
            )}

            {(() => {
              const totals = commissionTotals(referralState);
              return (
                <p className="meta" style={{ marginTop: "0.85rem" }}>
                  Ledger: {formatMoney(totals.pending)} pending ·{" "}
                  {formatMoney(totals.paid)} paid ·{" "}
                  {(referralState.settings.allowlist || []).length} invited
                </p>
              );
            })()}

            <div className="table-wrap" style={{ marginTop: "0.65rem" }}>
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Referrer</th>
                    <th>Send to</th>
                    <th>Commission</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {referralState.commissions.length === 0 ? (
                    <tr>
                      <td colSpan={7}>
                        No payouts yet. Accrue when a share-code order is marked
                        delivered — referrer is emailed automatically.
                      </td>
                    </tr>
                  ) : (
                    referralState.commissions.slice(0, 30).map((c) => {
                      const dest =
                        c.payoutSummary ||
                        payoutDestinationSummary(c.payout);
                      const payUrl = c.payout?.venmo
                        ? venmoPayLink({
                            handle: c.payout.venmo,
                            amount: c.amount,
                            note: `WellPept referral ${c.orderId}`,
                          })
                        : "";
                      return (
                        <tr key={c.id}>
                          <td>
                            <strong>{c.orderId}</strong>
                            <div className="meta">{c.code}</div>
                          </td>
                          <td>
                            {maskEmail(c.email)}
                            <div className="meta">{c.email}</div>
                          </td>
                          <td>
                            <span className="meta">{dest}</span>
                          </td>
                          <td>
                            {formatMoney(c.amount)}
                            <div className="meta">
                              {c.rate}% · merch{" "}
                              {formatMoney(c.merchandise ?? c.profit)}
                            </div>
                          </td>
                          <td>
                            <span className="meta">
                              {c.emailStatus || "—"}
                              {c.emailedAt
                                ? ` · ${new Date(
                                    c.emailedAt
                                  ).toLocaleDateString()}`
                                : ""}
                            </span>
                          </td>
                          <td>{c.status}</td>
                          <td>
                            <div className="referral-ledger-actions">
                              <button
                                type="button"
                                className="soft-btn"
                                onClick={async () => {
                                  const r = await notifyReferralPayoutDirect(c);
                                  setReferralState(loadReferralState());
                                  onFlash?.(
                                    r?.ok
                                      ? `Emailed referrer · ${c.email}`
                                      : `Email failed · ${r?.error || "error"}`
                                  );
                                }}
                              >
                                {c.emailStatus === "sent"
                                  ? "Resend email"
                                  : "Email referrer"}
                              </button>
                              {payUrl ? (
                                <a
                                  className="soft-btn"
                                  href={payUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Open Venmo
                                </a>
                              ) : null}
                              {c.status === "pending" ? (
                                <button
                                  type="button"
                                  className="soft-btn"
                                  onClick={() => {
                                    markCommissionPaid(c.id);
                                    setReferralState(loadReferralState());
                                    onFlash?.(
                                      `Marked sent · ${formatMoney(c.amount)} → ${dest}`
                                    );
                                  }}
                                >
                                  Confirm sent
                                </button>
                              ) : (
                                <span className="meta">
                                  {c.paidAt
                                    ? new Date(c.paidAt).toLocaleDateString()
                                    : "—"}
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

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

          <h2>Marketplace (partners)</h2>
          <p className="meta" style={{ marginBottom: "0.75rem" }}>
            Public Sell applications for WellPept Renew and/or Undisclosed.
            Approved WellPept → Accessories. Approved Undisclosed → Partner
            listings. Economy / Fast ship options.
          </p>
          <div className="table-wrap" style={{ marginBottom: "1rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Vendor</th>
                  <th>Sites</th>
                  <th>Notes</th>
                  <th>Submitted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAccVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No partner vendors waiting.</td>
                  </tr>
                ) : (
                  pendingAccVendors.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <strong>{v.name}</strong>
                        <div className="meta">{v.email}</div>
                        {v.company ? (
                          <div className="meta">{v.company}</div>
                        ) : null}
                      </td>
                      <td className="meta">
                        {(v.channels || ["wellpept"]).join(", ")}
                      </td>
                      <td className="meta">{v.notes || "—"}</td>
                      <td className="meta">
                        {new Date(v.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() => onApproveAccessoryVendor?.(v.id)}
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() => onRejectAccessoryVendor?.(v.id)}
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
          <div className="table-wrap" style={{ marginBottom: "1.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Listing</th>
                  <th>Vendor</th>
                  <th>Sites</th>
                  <th>Ship</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingAccListings.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No partner listings waiting.</td>
                  </tr>
                ) : (
                  pendingAccListings.map((l) => (
                    <tr key={l.id}>
                      <td>
                        <strong>{l.name}</strong>
                        <div className="meta">
                          {formatMoney(l.price)} · {l.size || "—"} · {l.kind}
                        </div>
                      </td>
                      <td className="meta">{accVendorName(l.vendorId)}</td>
                      <td className="meta">
                        {(l.channels || ["wellpept"]).join(", ")}
                      </td>
                      <td className="meta">
                        {(l.shipModes || []).join(", ") || "economy"}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button
                            type="button"
                            className="primary-btn"
                            onClick={() => onApproveAccessoryListing?.(l.id)}
                          >
                            <Check size={16} /> Approve
                          </button>
                          <button
                            type="button"
                            className="danger-btn"
                            onClick={() => onRejectAccessoryListing?.(l.id)}
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
            Uncheck anything you can’t fill, add an optional note, then Confirm
            (emails pay link) or Decline. Partial orders recalculate the total
            automatically.
          </p>
          <div className="table-wrap" style={{ marginBottom: "1.5rem" }}>
            <table>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Quoted total</th>
                  <th>Decide</th>
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
                        {o.supplyDecision?.decision ? (
                          <div className="meta">
                            decided: {o.supplyDecision.decision}
                          </div>
                        ) : null}
                        {o.referral?.code ? (
                          <div className="meta">
                            ref {o.referral.code}
                            {o.referral.commission
                              ? ` · ${formatMoney(o.referral.commission)}`
                              : ""}
                            {o.referral.status
                              ? ` · ${o.referral.status}`
                              : ""}
                          </div>
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
                        {o.status === "paid" ||
                        o.status === "ordered" ||
                        o.status === "fulfilled" ? (
                          <div className="admin-supplier-cell">
                            <span className="meta">
                              {o.status === "fulfilled"
                                ? "Fulfilled"
                                : o.status === "ordered"
                                  ? "Ordered from suppliers"
                                  : "Customer paid"}
                            </span>
                            {o.status !== "fulfilled" ? (
                              <SupplierPayPanel
                                order={o}
                                config={supplierPay}
                                onMarkLanePaid={(warehouseId, meta) =>
                                  onMarkSupplierPaid?.(
                                    o.orderId,
                                    warehouseId,
                                    meta
                                  )
                                }
                                onMarkFulfilled={() =>
                                  onMarkOrderFulfilled?.(o.orderId)
                                }
                              />
                            ) : null}
                          </div>
                        ) : o.status === "declined" ? (
                          <span className="meta">Declined</span>
                        ) : o.status === "awaiting_payment" ? (
                          <div className="row-actions admin-pay-actions">
                            <span className="meta">
                              Customer emailed · awaiting payment
                            </span>
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
                        ) : (
                          <OrderSupplyReviewRow
                            order={o}
                            payConfig={payConfig}
                            onFlash={onFlash}
                            onOrderDecided={onOrderDecided}
                          />
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
