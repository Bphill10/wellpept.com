import { useMemo, useState } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import {
  formatManualPayText,
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

      {config.venmoHandle && (
        <div className="manual-pay-card">
          <h3>Venmo</h3>
          <CopyRow
            label="Handle"
            value={`@${String(config.venmoHandle).replace(/^@/, "")}`}
          />
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
          <h3>Crypto (USDC)</h3>
          {config.solanaUsdc && (
            <CopyRow label="Solana USDC" value={config.solanaUsdc} />
          )}
          {config.ethUsdc && (
            <CopyRow label="Ethereum USDC" value={config.ethUsdc} />
          )}
          <CopyRow label="Memo / reference" value={orderId} />
          <div className="row-actions">
            {config.solanaUsdc && (
              <button
                type="button"
                className="soft-btn"
                disabled={disabled || sent}
                onClick={() => confirmPaid("crypto_solana_usdc")}
              >
                I’ve paid Solana USDC
              </button>
            )}
            {config.ethUsdc && (
              <button
                type="button"
                className="soft-btn"
                disabled={disabled || sent}
                onClick={() => confirmPaid("crypto_eth_usdc")}
              >
                I’ve paid ETH USDC
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
