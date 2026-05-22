/**
 * TransactionTable.jsx
 * Full-featured transaction table with search, filter, sort, pagination,
 * row-expand for item details, and delete action.
 *
 * Design tokens: bg #131315 · surface #1c1b1d · primary #d0bcff · accent #4edea3
 */

import { useState, useMemo, useCallback } from "react";
import { deleteTransaction } from "../lib/firebase";

// ── Constants ──────────────────────────────────────────────────────────────────
const CATEGORIES = ["Raw Materials", "Logistics", "Utilities", "Marketing", "Others"];

const CATEGORY_CFG = {
  "Raw Materials": { color: "#d0bcff", bg: "rgba(208,188,255,0.12)", label: "Raw Mat." },
  Logistics:       { color: "#c0c1ff", bg: "rgba(192,193,255,0.12)", label: "Logistik" },
  Utilities:       { color: "#4edea3", bg: "rgba(78,222,163,0.12)",  label: "Utilitas" },
  Marketing:       { color: "#ffb4ab", bg: "rgba(255,180,171,0.12)", label: "Marketing" },
  Others:          { color: "#958ea0", bg: "rgba(149,142,160,0.12)", label: "Lainnya"  },
};

const PAGE_SIZE = 10;

// ── Formatters ─────────────────────────────────────────────────────────────────
const formatIDR = (v) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v ?? 0);

const formatIDRCompact = (v) =>
  v >= 1_000_000_000
    ? `Rp${(v / 1_000_000_000).toFixed(2)}M`
    : v >= 1_000_000
    ? `Rp${(v / 1_000_000).toFixed(1)}jt`
    : `Rp${(v / 1_000).toFixed(0)}rb`;

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function CategoryPill({ category }) {
  const cfg = CATEGORY_CFG[category] ?? CATEGORY_CFG["Others"];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono whitespace-nowrap"
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}30` }}
    >
      {cfg.label}
    </span>
  );
}

function StatusDot({ status }) {
  const map = {
    success: { color: "#4edea3", label: "OK" },
    error:   { color: "#ffb4ab", label: "Error" },
    pending: { color: "#d0bcff", label: "Proses" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className="flex items-center gap-1.5 text-xs font-mono" style={{ color: s.color }}>
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.color, boxShadow: status !== "error" ? `0 0 6px ${s.color}80` : "none" }}
      />
      {s.label}
    </span>
  );
}

function SortIcon({ field, current, dir }) {
  if (current !== field) return <span style={{ color: "#494454" }}>⇅</span>;
  return <span style={{ color: "#d0bcff" }}>{dir === "asc" ? "↑" : "↓"}</span>;
}

function ExpandedItems({ items = [] }) {
  if (!items.length) return (
    <p className="text-xs font-mono py-2" style={{ color: "#494454" }}>Tidak ada item detail</p>
  );
  return (
    <div className="rounded-lg overflow-hidden" style={{ background: "#131315", border: "1px solid #494454" }}>
      <div
        className="grid text-xs font-mono uppercase px-4 py-2"
        style={{ gridTemplateColumns: "1fr auto auto auto", color: "#958ea0", borderBottom: "1px solid #494454" }}
      >
        <span>Item</span>
        <span className="text-center w-12">Qty</span>
        <span className="text-right w-28">Harga/unit</span>
        <span className="text-right w-28">Subtotal</span>
      </div>
      {items.map((item, i) => (
        <div
          key={i}
          className="grid px-4 py-2 text-sm hover:bg-white/5 transition-colors"
          style={{ gridTemplateColumns: "1fr auto auto auto", borderBottom: i < items.length - 1 ? "1px solid #1c1b1d" : "none" }}
        >
          <span className="truncate pr-3" style={{ color: "#e5e1e4" }}>{item.item_name}</span>
          <span className="w-12 text-center font-mono" style={{ color: "#958ea0" }}>×{item.quantity}</span>
          <span className="w-28 text-right font-mono text-xs" style={{ color: "#958ea0" }}>{formatIDR(item.price)}</span>
          <span className="w-28 text-right font-mono font-medium" style={{ color: "#d0bcff" }}>{formatIDR(item.total_item_price)}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TransactionTable({ transactions = [], compact = false }) {
  const [search,      setSearch]      = useState("");
  const [filterCat,   setFilterCat]   = useState("All");
  const [sortField,   setSortField]   = useState("processed_at");
  const [sortDir,     setSortDir]     = useState("desc");
  const [page,        setPage]        = useState(1);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [deleting,    setDeleting]    = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── Derived data ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...transactions];

    // Category filter
    if (filterCat !== "All") {
      data = data.filter((t) => t.expense_category === filterCat);
    }

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (t) =>
          t.merchant_name?.toLowerCase().includes(q) ||
          t.expense_category?.toLowerCase().includes(q)
      );
    }

    // Sort
    data.sort((a, b) => {
      let av = a[sortField] ?? 0;
      let bv = b[sortField] ?? 0;
      if (sortField === "processed_at" || sortField === "transaction_date") {
        av = av?.seconds ?? new Date(av).getTime() / 1000;
        bv = bv?.seconds ?? new Date(bv).getTime() / 1000;
      }
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return sortDir === "asc" ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });

    return data;
  }, [transactions, filterCat, search, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged      = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalFiltered = filtered.reduce((s, t) => s + (t.total_amount ?? 0), 0);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSort = useCallback((field) => {
    if (sortField === field) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortField(field); setSortDir("desc"); }
    setPage(1);
  }, [sortField]);

  const toggleExpand = useCallback((id) => {
    setExpandedIds((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  }, []);

  const handleDelete = async (tx) => {
    if (deleteConfirm !== tx.id) {
      setDeleteConfirm(tx.id);
      setTimeout(() => setDeleteConfirm(null), 3000);
      return;
    }
    setDeleting(tx.id);
    setDeleteConfirm(null);
    try {
      await deleteTransaction(tx.id);
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleting(null);
    }
  };

  const exportCSV = () => {
    const header = ["Tanggal", "Merchant", "Kategori", "Total (IDR)", "Status"];
    const rows = filtered.map((t) => [
      t.transaction_date ?? "",
      `"${t.merchant_name ?? ""}"`,
      t.expense_category ?? "",
      t.total_amount ?? 0,
      t.status ?? "success",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `finvibe-transaksi-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">

      {/* ── Toolbar ── */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Search */}
        <div className="relative flex-1">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
            style={{ color: "#494454" }}
          >
            ⌕
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Cari merchant atau kategori..."
            className="w-full pl-8 pr-4 py-2 rounded-xl text-sm outline-none transition-colors duration-200 font-mono"
            style={{
              background:  "#1c1b1d",
              border:      "1px solid #494454",
              color:       "#e5e1e4",
              caretColor:  "#d0bcff",
            }}
            onFocus={(e)  => (e.target.style.borderColor = "#d0bcff")}
            onBlur={(e)   => (e.target.style.borderColor = "#494454")}
          />
        </div>

        {/* Export CSV */}
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono transition-colors duration-200 shrink-0"
          style={{
            background: "rgba(78,222,163,0.08)",
            border:     "1px solid rgba(78,222,163,0.25)",
            color:      "#4edea3",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(78,222,163,0.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(78,222,163,0.08)")}
        >
          ↓ Export CSV
        </button>
      </div>

      {/* ── Category Filters ── */}
      <div className="flex flex-wrap gap-2">
        {["All", ...CATEGORIES].map((cat) => {
          const active = filterCat === cat;
          const color  = cat === "All" ? "#d0bcff" : (CATEGORY_CFG[cat]?.color ?? "#958ea0");
          return (
            <button
              key={cat}
              onClick={() => { setFilterCat(cat); setPage(1); }}
              className="px-3 py-1 rounded-full text-xs font-mono transition-all duration-200"
              style={{
                background: active ? `${color}20` : "transparent",
                border:     `1px solid ${active ? color : "#494454"}`,
                color:      active ? color : "#958ea0",
              }}
            >
              {cat === "All" ? "Semua" : cat}
            </button>
          );
        })}
      </div>

      {/* ── Summary bar ── */}
      {filtered.length > 0 && (
        <div
          className="flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-mono"
          style={{ background: "#1c1b1d", border: "1px solid #494454" }}
        >
          <span style={{ color: "#958ea0" }}>
            {filtered.length} transaksi
            {filterCat !== "All" ? ` · ${filterCat}` : ""}
            {search ? ` · "${search}"` : ""}
          </span>
          <span style={{ color: "#4edea3" }}>Total: {formatIDRCompact(totalFiltered)}</span>
        </div>
      )}

      {/* ── Table (desktop) / Card list (mobile) ── */}
      {paged.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ border: "1px dashed #494454" }}
        >
          <p className="text-4xl mb-3">🔍</p>
          <p className="text-sm font-mono" style={{ color: "#958ea0" }}>
            {transactions.length === 0 ? "Belum ada transaksi." : "Tidak ada hasil untuk filter ini."}
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block rounded-2xl overflow-hidden" style={{ border: "1px solid #494454" }}>
            {/* Header */}
            <div
              className="grid text-xs font-mono uppercase tracking-wider px-5 py-3 sticky top-0 z-10"
              style={{
                gridTemplateColumns: "1fr 160px 100px 120px 80px 80px",
                background: "#201f22",
                borderBottom: "1px solid #494454",
                color: "#958ea0",
              }}
            >
              {[
                { label: "Merchant", field: "merchant_name" },
                { label: "Tanggal",  field: "transaction_date" },
                { label: "Kategori", field: "expense_category" },
                { label: "Total",    field: "total_amount" },
                { label: "Status",   field: "status" },
                { label: "Aksi",     field: null },
              ].map(({ label, field }) => (
                <button
                  key={label}
                  onClick={() => field && handleSort(field)}
                  className="flex items-center gap-1 text-left"
                  style={{ cursor: field ? "pointer" : "default", color: sortField === field ? "#d0bcff" : "#958ea0" }}
                >
                  {label}
                  {field && <SortIcon field={field} current={sortField} dir={sortDir} />}
                </button>
              ))}
            </div>

            {/* Rows */}
            <div style={{ background: "#1c1b1d" }}>
              {paged.map((tx, i) => {
                const isExpanded = expandedIds.has(tx.id);
                const isDeleting = deleting === tx.id;
                const isConfirm  = deleteConfirm === tx.id;
                const hasItems   = tx.items?.length > 0;
                return (
                  <div key={tx.id}>
                    {/* Main row */}
                    <div
                      className="grid items-center px-5 py-3.5 transition-colors duration-150 hover:bg-white/5 cursor-pointer"
                      style={{
                        gridTemplateColumns: "1fr 160px 100px 120px 80px 80px",
                        borderBottom: "1px solid #131315",
                        opacity: isDeleting ? 0.4 : 1,
                        transition: "opacity 0.3s",
                      }}
                      onClick={() => hasItems && toggleExpand(tx.id)}
                    >
                      {/* Merchant */}
                      <div className="flex items-center gap-2 min-w-0 pr-3">
                        {hasItems && (
                          <span
                            className="shrink-0 text-xs transition-transform duration-200"
                            style={{ color: "#494454", transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
                          >
                            ▶
                          </span>
                        )}
                        <span className="truncate text-sm" style={{ color: "#e5e1e4" }}>
                          {tx.merchant_name ?? "—"}
                        </span>
                      </div>

                      {/* Date */}
                      <span className="text-xs font-mono" style={{ color: "#958ea0" }}>
                        {formatDate(tx.transaction_date)}
                      </span>

                      {/* Category */}
                      <CategoryPill category={tx.expense_category} />

                      {/* Amount */}
                      <span className="text-sm font-mono font-medium" style={{ color: "#4edea3" }}>
                        {formatIDRCompact(tx.total_amount)}
                      </span>

                      {/* Status */}
                      <StatusDot status={tx.status ?? "success"} />

                      {/* Delete */}
                      <div
                        className="flex justify-end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleDelete(tx)}
                          disabled={isDeleting}
                          className="px-2.5 py-1 rounded-lg text-xs font-mono transition-all duration-200"
                          style={{
                            color:      isConfirm ? "#131315" : "#ffb4ab",
                            background: isConfirm ? "#ffb4ab" : "rgba(255,180,171,0.08)",
                            border:     "1px solid rgba(255,180,171,0.25)",
                          }}
                        >
                          {isDeleting ? "..." : isConfirm ? "Yakin?" : "Hapus"}
                        </button>
                      </div>
                    </div>

                    {/* Expanded items */}
                    {isExpanded && (
                      <div
                        className="px-5 py-3"
                        style={{ background: "#131315", borderBottom: "1px solid #131315" }}
                      >
                        <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: "#958ea0" }}>
                          Detail Item ({tx.items?.length ?? 0})
                        </p>
                        <ExpandedItems items={tx.items} />
                        {tx.coach_tip && (
                          <div
                            className="mt-3 rounded-xl px-4 py-3 flex items-start gap-3"
                            style={{
                              background: "linear-gradient(135deg, rgba(208,188,255,0.08), rgba(78,222,163,0.06))",
                              border: "1px solid rgba(208,188,255,0.2)",
                            }}
                          >
                            <span className="text-base shrink-0">🤖</span>
                            <div>
                              <p className="text-xs font-mono font-semibold uppercase tracking-widest mb-1" style={{ color: "#d0bcff" }}>
                                FinVibe Coach
                              </p>
                              <p className="text-sm leading-relaxed" style={{ color: "#cbc3d7" }}>
                                {tx.coach_tip}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile card list */}
          <div className="flex flex-col gap-3 md:hidden">
            {paged.map((tx) => {
              const isExpanded = expandedIds.has(tx.id);
              const isDeleting = deleting === tx.id;
              const isConfirm  = deleteConfirm === tx.id;
              const hasItems   = tx.items?.length > 0;
              const color      = CATEGORY_CFG[tx.expense_category]?.color ?? "#958ea0";
              return (
                <div
                  key={tx.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "#1c1b1d", border: "1px solid #494454", opacity: isDeleting ? 0.4 : 1 }}
                >
                  <div
                    className="p-4 flex items-start justify-between gap-3 cursor-pointer"
                    onClick={() => hasItems && toggleExpand(tx.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate" style={{ color: "#e5e1e4", fontFamily: "'Geist', sans-serif" }}>
                        {tx.merchant_name ?? "—"}
                      </p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: "#958ea0" }}>
                        {formatDate(tx.transaction_date)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <CategoryPill category={tx.expense_category} />
                        <StatusDot status={tx.status ?? "success"} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold font-mono" style={{ color: "#4edea3" }}>
                        {formatIDRCompact(tx.total_amount)}
                      </p>
                      {hasItems && (
                        <p className="text-xs font-mono mt-1" style={{ color: "#494454" }}>
                          {isExpanded ? "▲ tutup" : `▼ ${tx.items.length} item`}
                        </p>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0">
                      <div style={{ height: "1px", background: "#494454", marginBottom: "12px" }} />
                      <ExpandedItems items={tx.items} />
                      {tx.coach_tip && (
                        <div
                          className="mt-3 rounded-xl px-3 py-3 flex items-start gap-2"
                          style={{ background: "rgba(208,188,255,0.08)", border: "1px solid rgba(208,188,255,0.2)" }}
                        >
                          <span className="text-sm">🤖</span>
                          <p className="text-xs leading-relaxed" style={{ color: "#cbc3d7" }}>{tx.coach_tip}</p>
                        </div>
                      )}
                    </div>
                  )}

                  <div
                    className="flex items-center justify-end px-4 pb-3"
                    style={{ borderTop: "1px solid #131315" }}
                  >
                    <button
                      onClick={() => handleDelete(tx)}
                      disabled={isDeleting}
                      className="px-3 py-1 rounded-lg text-xs font-mono transition-all duration-200 mt-2"
                      style={{
                        color:      isConfirm ? "#131315" : "#ffb4ab",
                        background: isConfirm ? "#ffb4ab" : "rgba(255,180,171,0.08)",
                        border:     "1px solid rgba(255,180,171,0.25)",
                      }}
                    >
                      {isDeleting ? "..." : isConfirm ? "Yakin hapus?" : "Hapus"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs font-mono" style={{ color: "#958ea0" }}>
            Halaman {page} dari {totalPages} · {filtered.length} transaksi
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 disabled:opacity-30"
              style={{ background: "#1c1b1d", border: "1px solid #494454", color: "#d0bcff" }}
            >
              ← Prev
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 disabled:opacity-30"
              style={{ background: "#1c1b1d", border: "1px solid #494454", color: "#d0bcff" }}
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
