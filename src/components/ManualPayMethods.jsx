import { useMemo, useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import {
  formatManualPayText,
  hasVenmo,
  loadManualPayConfig,
  manualPayConfigured,
  venmoPayUrl,
} from "../utils/manualPayments";
import { formatMoney } from "../data/products";

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy", value);
    }
  }

  return (
    <div className="manual-pay-row">
      <div>
        <strong>{label}</strong>
        <code className="manual-pay-value">{value}</code>
      </div>
      <button type="button" className="soft-btn" onClick={copy}>
        {copied ? <Check size={14} /> : <Copy size={14} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/**
 * Customer-facing Venmo / Zelle / crypto instructions on the pay page.
 */
export default function ManualPayMethods({
  orderId,
  total,
  onPaid,
  disabled = false,
}) {
  const config = useMemo(() => loadManualPayConfig(), []);
  const enabled = manualPayConfigured(config);
  const [method, setMethod] = useState("");
  const [sent, setSent] = useState(false);
  const amount = Number(total) || 0;
  const venmo = venmoPayUrl({
    handle: config.venmoHandle,
    codeUrl: config.venmoCodeUrl,
    amount,
    note: orderId,
  });

  if (!enabled) {
    return (
      <div className="notice warn manual-pay">
        Manual payment methods are not configured yet. In Undisclosed Admin →
        Payment methods, add Venmo, Zelle, and/or crypto wallets.
      </div>
    );
  }

  function confirmPaid(provider) {
    setMethod(provider);
    setSent(true);
    onPaid?.({
      provider,
      status: "submitted_by_customer",
      methods: provider,
      amountCents: Math.round(amount * 100),
      id: `${provider}-${orderId}-${Date.now()}`,
    });
  }

  return (
    <div className="manual-pay">
      <h2>Pay with Venmo, Zelle, or crypto</h2>
      <p className="lede">
        Amount due <strong>{formatMoney(amount)}</strong>. Put{" "}
        <strong>{orderId}</strong> in the memo / note so we can match your
        payment.
      </p>

      {hasVenmo(config) && (
        <div className="manual-pay-card">
          <h3>Venmo</h3>
          {config.venmoQrUrl ? (
            <>
              <p className="meta">Scan in the Venmo app, or open the link below.</p>
              <img
                src={config.venmoQrUrl}
                alt="Venmo QR code"
                className="manual-pay-qr"
              />
            </>
          ) : null}
          {config.venmoHandle ? (
            <CopyRow
              label="Handle"
              value={`@${String(config.venmoHandle).replace(/^@/, "")}`}
            />
          ) : !config.venmoQrUrl ? (
            <p className="meta">Pay via the Venmo button below.</p>
          ) : null}
          {venmo && (
            <a
              className="primary-btn manual-pay-open"
              href={venmo}
              target="_blank"
              rel="noreferrer"
            >
              Open Venmo <ExternalLink size={14} />
            </a>
          )}
          <CopyRow label="Memo" value={orderId} />
          <button
            type="button"
            className="soft-btn"
            disabled={disabled || sent}
            onClick={() => confirmPaid("venmo")}
          >
            I’ve paid with Venmo
          </button>
        </div>
      )}

      {config.zelleContact && (
        <div className="manual-pay-card">
          <h3>Zelle</h3>
          {config.zelleQrUrl ? (
            <>
              <p className="meta">
                Scan this code in your bank’s app, or send to the email below.
              </p>
              <img
                src={config.zelleQrUrl}
                alt="Zelle QR code — scan in your bank app"
                className="manual-pay-qr"
              />
            </>
          ) : (
            <p className="meta">Send via Zelle to the email below.</p>
          )}
          <CopyRow label="Send to" value={config.zelleContact} />
          {config.zelleName ? (
            <p className="meta">Name: {config.zelleName}</p>
          ) : null}
          <CopyRow label="Memo" value={orderId} />
          <button
            type="button"
            className="soft-btn"
            disabled={disabled || sent}
            onClick={() => confirmPaid("zelle")}
          >
            I’ve paid with Zelle
          </button>
        </div>
      )}

      {(config.solanaUsdc || config.ethUsdc) && (
        <div className="manual-pay-card">
          <h3>Crypto — USDC or USDT only</h3>
          <p className="meta">
            Do not send SOL, ETH, or any other coin. Only USDC or USDT on the
            matching network.
          </p>
          {config.solanaUsdc && (
            <CopyRow
              label="Solana (USDC or USDT)"
              value={config.solanaUsdc}
            />
          )}
          {config.ethUsdc && (
            <CopyRow
              label="Ethereum (USDC or USDT)"
              value={config.ethUsdc}
            />
          )}
          <CopyRow label="Memo / reference" value={orderId} />
          <div className="row-actions">
            {config.solanaUsdc && (
              <button
                type="button"
                className="soft-btn"
                disabled={disabled || sent}
                onClick={() => confirmPaid("crypto_solana")}
              >
                I’ve sent USDC/USDT on Solana
              </button>
            )}
            {config.ethUsdc && (
              <button
                type="button"
                className="soft-btn"
                disabled={disabled || sent}
                onClick={() => confirmPaid("crypto_eth")}
              >
                I’ve sent USDC/USDT on Ethereum
              </button>
            )}
          </div>
        </div>
      )}

      {sent && (
        <div className="notice ok" style={{ marginTop: "0.85rem" }}>
          Thanks — marked as paid via <strong>{method}</strong>. We’ll verify
          and start fulfillment. Keep your order ID: {orderId}.
        </div>
      )}

      <details className="manual-pay-raw">
        <summary>Full payment text</summary>
        <pre>{formatManualPayText({ orderId, total: amount, config })}</pre>
      </details>
    </div>
  );
}
