/**
 * TransactionCard.jsx
 * Displays a single extracted receipt/transaction with IDR formatting,
 * item list, category badge, and FinVibe Coach tip.
 * Design tokens: #131315 bg, #1c1b1d card, #d0bcff primary, #4edea3 success
 */

import { useState } from "react";

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORY_CONFIG = {
  "Raw Materials": { color: "#d0bcff", bg: "rgba(208,188,255,0.12)", icon: "🧱" },
  Logistics:       { color: "#c0c1ff", bg: "rgba(192,193,255,0.12)", icon: "🚚" },
  Utilities:       { color: "#4edea3", bg: "rgba(78,222,163,0.12)",  icon: "⚡" },
  Marketing:       { color: "#ffb4ab", bg: "rgba(255,180,171,0.12)", icon: "📣" },
  Others:          { color: "#cbc3d7", bg: "rgba(203,195,215,0.12)", icon: "📦" },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
const formatIDR = (amount) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(amount ?? 0);

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
};

// ── Category Badge ─────────────────────────────────────────────────────────────
function CategoryBadge({ category }) {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG["Others"];
  return (
    <span
      style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.color}30` }}
      className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium whitespace-nowrap"
    >
      <span>{cfg.icon}</span>
      {category ?? "Others"}
    </span>
  );
}

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    success: { label: "Processed",  color: "#4edea3", bg: "rgba(78,222,163,0.12)" },
    error:   { label: "Error",      color: "#ffb4ab", bg: "rgba(255,180,171,0.12)" },
    pending: { label: "Processing", color: "#d0bcff", bg: "rgba(208,188,255,0.12)" },
  };
  const cfg = map[status] ?? map["pending"];
  return (
    <span
      style={{ color: cfg.color, backgroundColor: cfg.bg }}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-mono"
    >
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ── Item Row ───────────────────────────────────────────────────────────────────
function ItemRow({ item, index }) {
  return (
    <div
      className="flex items-center justify-between py-2 text-sm"
      style={{ borderBottom: "1px solid #494454", animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <span className="font-mono text-xs" style={{ color: "#958ea0" }}>×{item.quantity}</span>
        <span className="truncate" style={{ color: "#e5e1e4" }}>{item.item_name}</span>
      </div>
      <div className="flex items-center gap-3 shrink-0 ml-3">
        {item.quantity > 1 && (
          <span className="text-xs font-mono" style={{ color: "#958ea0" }}>{formatIDR(item.price)}/unit</span>
        )}
        <span className="font-mono text-sm font-medium" style={{ color: "#d0bcff" }}>
          {formatIDR(item.total_item_price)}
        </span>
      </div>
    </div>
  );
}

// ── FinVibe Coach Panel ────────────────────────────────────────────────────────
function CoachPanel({ tip }) {
  if (!tip) return null;
  return (
    <div
      className="rounded-xl p-3 mt-3 flex items-start gap-3"
      style={{
        background: "linear-gradient(135deg, rgba(208,188,255,0.08) 0%, rgba(78,222,163,0.06) 100%)",
        border: "1px solid rgba(208,188,255,0.2)",
        backdropFilter: "blur(8px)",
      }}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-base"
        style={{ background: "rgba(208,188,255,0.15)", border: "1px solid rgba(208,188,255,0.25)" }}
      >
        🤖
      </div>
      <div>
        <p className="text-xs font-mono font-semibold mb-0.5 uppercase tracking-widest" style={{ color: "#d0bcff" }}>
          FinVibe Coach
        </p>
        <p className="text-sm leading-relaxed" style={{ color: "#cbc3d7" }}>{tip}</p>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TransactionCard({ transaction, className = "" }) {
  const [expanded, setExpanded] = useState(false);

  if (!transaction) return null;

  const {
    merchant_name, transaction_date, total_amount,
    expense_category, items = [], coach_tip, status, gcs_object,
  } = transaction;

  const hasItems   = items.length > 0;
  const previewMax = 2;

  return (
    <article
      className={`rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.01] ${className}`}
      style={{
        background:   "#1c1b1d",
        border:       "1px solid #494454",
        boxShadow:    "0 4px 24px rgba(0,0,0,0.4)",
        fontFamily:   "'Hanken Grotesk', sans-serif",
      }}
    >
      {/* ── Header ── */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <h3
              className="text-base font-semibold truncate"
              style={{ color: "#e5e1e4", fontFamily: "'Geist', sans-serif" }}
            >
              {merchant_name ?? "Unknown Merchant"}
            </h3>
            <p className="text-xs mt-0.5 font-mono" style={{ color: "#958ea0" }}>
              {formatDate(transaction_date)}
            </p>
          </div>
          <StatusBadge status={status ?? "success"} />
        </div>

        {/* Total */}
        <div className="flex items-end justify-between mt-3">
          <CategoryBadge category={expense_category} />
          <div className="text-right">
            <p className="text-xs font-mono mb-0.5" style={{ color: "#958ea0" }}>Total</p>
            <p
              className="text-xl font-bold font-mono"
              style={{ color: "#4edea3", fontFamily: "'Geist', sans-serif" }}
            >
              {formatIDR(total_amount)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: "1px", background: "#494454" }} />

      {/* ── Items ── */}
      {hasItems && (
        <div className="px-4 pt-3 pb-1">
          <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#958ea0" }}>
            Items ({items.length})
          </p>
          <div>
            {(expanded ? items : items.slice(0, previewMax)).map((item, i) => (
              <ItemRow key={i} item={item} index={i} />
            ))}
          </div>
          {items.length > previewMax && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full mt-2 py-1.5 text-xs font-mono rounded-lg transition-colors duration-200"
              style={{
                color:      "#d0bcff",
                background: "rgba(208,188,255,0.07)",
                border:     "1px solid rgba(208,188,255,0.15)",
              }}
            >
              {expanded ? "▲ Sembunyikan" : `▼ Lihat ${items.length - previewMax} item lainnya`}
            </button>
          )}
        </div>
      )}

      {/* ── Coach Tip ── */}
      {coach_tip && (
        <div className="px-4 pb-4">
          <CoachPanel tip={coach_tip} />
        </div>
      )}

      {/* ── GCS source link (subtle) ── */}
      {gcs_object && (
        <div className="px-4 pb-3">
          <p className="text-xs font-mono truncate" style={{ color: "#494454" }}>
            📎 {gcs_object}
          </p>
        </div>
      )}
    </article>
  );
}
