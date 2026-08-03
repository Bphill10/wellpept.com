import React, { useMemo, useState } from "react";
import { Copy, Check, Truck } from "lucide-react";
import { formatMoney } from "../data/products";
import {
  buildSupplierPo,
  formatSupplierPayInstructions,
  supplierLaneStatus,
  allSuppliersPaid,
} from "../utils/supplierPayments";

/**
 * Ops panel: after customer pays, show what to send each supplier and mark paid.
 */
export default function SupplierPayPanel({
  order,
  config,
  onMarkLanePaid,
  onMarkFulfilled,
}) {
  const po = useMemo(() => buildSupplierPo(order), [order]);
  const [txDraft, setTxDraft] = useState({});
  const [copied, setCopied] = useState("");

  if (!po.length) {
    return (
      <div className="supplier-pay-panel">
        <p className="meta">No warehouse lines on this order.</p>
      </div>
    );
  }

  const totalCost = po.reduce((s, l) => s + (Number(l.costTotal) || 0), 0);
  const done = allSuppliersPaid(order);

  async function copyText(key, text) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    } catch {
      window.prompt("Copy supplier pay instructions", text);
    }
  }

  return (
    <div className="supplier-pay-panel">
      <div className="supplier-pay-head">
        <strong>
          <Truck size={14} /> Pay suppliers · place PO
        </strong>
        <span className="meta">
          You owe {formatMoney(totalCost)}
          {po.some((l) => l.estimated) ? " (est.)" : ""} · customer paid{" "}
          {formatMoney(order.totals?.total || 0)}
        </span>
      </div>
      <p className="meta supplier-pay-hint">
        1) Instant Payout your Stripe balance (or use Venmo/Zelle received) →
        2) send USDT/wire below → 3) Mark paid → order becomes{" "}
        <em>ordered</em>.
      </p>

      {po.map((lane) => {
        const st = supplierLaneStatus(order, lane.warehouseId);
        const paid = st === "paid" || st === "ordered";
        const instr = formatSupplierPayInstructions({
          lane,
          config,
          orderId: order.orderId,
        });
        const whCfg = config?.[lane.warehouseId] || {};
        return (
          <div
            key={lane.warehouseId}
            className={`supplier-lane ${paid ? "paid" : ""}`}
          >
            <div className="supplier-lane-top">
              <div>
                <strong>{lane.warehouseLabel}</strong>
                <div className="meta">
                  {formatMoney(lane.costTotal)}
                  {lane.estimated ? " · estimated" : ""} · {st}
                </div>
              </div>
              <button
                type="button"
                className="soft-btn"
                onClick={() => copyText(lane.warehouseId, instr)}
              >
                {copied === lane.warehouseId ? (
                  <Check size={14} />
                ) : (
                  <Copy size={14} />
                )}{" "}
                Copy pay info
              </button>
            </div>
            <ul className="supplier-lane-lines">
              {lane.lines.map((l, i) => (
                <li key={`${l.sku}-${i}`}>
                  {l.qty}× {l.name} — {formatMoney(l.lineCost)}
                </li>
              ))}
            </ul>
            {(whCfg.usdtTrc20 || whCfg.usdtSolana || whCfg.contact) && (
              <div className="meta supplier-lane-dest">
                {whCfg.usdtTrc20 ? (
                  <div>TRC20: {whCfg.usdtTrc20}</div>
                ) : null}
                {whCfg.usdtSolana ? (
                  <div>SOL: {whCfg.usdtSolana}</div>
                ) : null}
                {whCfg.telegram ? <div>TG: {whCfg.telegram}</div> : null}
              </div>
            )}
            {!paid ? (
              <div className="supplier-lane-actions">
                <input
                  placeholder="Tx hash / wire ref (optional)"
                  value={txDraft[lane.warehouseId] || ""}
                  onChange={(e) =>
                    setTxDraft((d) => ({
                      ...d,
                      [lane.warehouseId]: e.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() =>
                    onMarkLanePaid?.(lane.warehouseId, {
                      method: whCfg.method || "usdt",
                      txRef: txDraft[lane.warehouseId] || "",
                      amount: lane.costTotal,
                    })
                  }
                >
                  Mark supplier paid
                </button>
              </div>
            ) : (
              <div className="meta">
                Supplier paid
                {order.supplierPay?.[lane.warehouseId]?.txRef
                  ? ` · ${order.supplierPay[lane.warehouseId].txRef}`
                  : ""}
                {order.supplierPay?.[lane.warehouseId]?.paidAt
                  ? ` · ${new Date(
                      order.supplierPay[lane.warehouseId].paidAt
                    ).toLocaleString()}`
                  : ""}
              </div>
            )}
          </div>
        );
      })}

      {done && order.status !== "fulfilled" ? (
        <button
          type="button"
          className="soft-btn"
          onClick={() => onMarkFulfilled?.()}
        >
          Mark shipped / fulfilled
        </button>
      ) : null}
    </div>
  );
}
