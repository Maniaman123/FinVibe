/**
 * Analytics.jsx — Full Analytics Page
 * Houses: KPI cards, monthly trend chart, category donut, per-category breakdown table.
 * Consumes real Firestore data; uses mock fallback while loading.
 *
 * Design tokens: surface #131315, container-low #1c1b1d, primary #d0bcff, secondary #4edea3
 */

import { useState, useEffect, useMemo } from "react";
import { MonthlyTrendChart, CategoryDonutChart, SparklineChart } from "../components/AnalyticsChart";

// ── Design tokens ──────────────────────────────────────────────────────────────
const COLORS = {
  "Raw Materials": "#d0bcff",
  Logistics:       "#c0c1ff",
  Utilities:       "#4edea3",
  Marketing:       "#ffb4ab",
  Others:          "#958ea0",
};

const CATEGORIES = ["Raw Materials", "Logistics", "Utilities", "Marketing", "Others"];

// ── Formatters ─────────────────────────────────────────────────────────────────
const formatIDR = (v) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v ?? 0);

const formatIDRCompact = (v) =>
  v >= 1_000_000_000
    ? `Rp${(v / 1_000_000_000).toFixed(2)}M`
    : v >= 1_000_000
    ? `Rp${(v / 1_000_000).toFixed(1)}jt`
    : `Rp${(v / 1_000).toFixed(0)}rb`;

const formatDate = (d) => new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

// ── Mock data (replaced by real Firestore data via props/context) ──────────────
const MOCK_MONTHLY = [
  { month: "Jan", "Raw Materials": 4200000, Logistics: 1100000, Utilities: 600000, Marketing: 800000,  Others: 300000,  total: 7000000 },
  { month: "Feb", "Raw Materials": 3800000, Logistics: 950000,  Utilities: 550000, Marketing: 700000,  Others: 200000,  total: 6200000 },
  { month: "Mar", "Raw Materials": 5100000, Logistics: 1300000, Utilities: 700000, Marketing: 1100000, Others: 400000,  total: 8600000 },
  { month: "Apr", "Raw Materials": 4700000, Logistics: 1050000, Utilities: 620000, Marketing: 900000,  Others: 350000,  total: 7620000 },
  { month: "Mei", "Raw Materials": 5500000, Logistics: 1400000, Utilities: 750000, Marketing: 1200000, Others: 500000,  total: 9350000 },
  { month: "Jun", "Raw Materials": 6200000, Logistics: 1600000, Utilities: 800000, Marketing: 1500000, Others: 600000,  total: 10700000 },
];

const MOCK_TRANSACTIONS = [
  { id: "t1", merchant_name: "Pasar Induk Kramat Jati", transaction_date: "2026-06-15", total_amount: 2400000, expense_category: "Raw Materials" },
  { id: "t2", merchant_name: "JNE Express",              transaction_date: "2026-06-14", total_amount: 185000,  expense_category: "Logistics" },
  { id: "t3", merchant_name: "PLN Token",                transaction_date: "2026-06-13", total_amount: 350000,  expense_category: "Utilities" },
  { id: "t4", merchant_name: "Meta Ads Indonesia",       transaction_date: "2026-06-12", total_amount: 750000,  expense_category: "Marketing" },
  { id: "t5", merchant_name: "Supplier Bahan Baku",      transaction_date: "2026-06-11", total_amount: 1800000, expense_category: "Raw Materials" },
  { id: "t6", merchant_name: "Shopee Express",           transaction_date: "2026-06-10", total_amount: 95000,   expense_category: "Logistics" },
];

// ── KPI Card ───────────────────────────────────────────────────────────────────
function KpiCard({ title, value, subtitle, color = "#4edea3", sparkData = [], trend }) {
  const isPositive = trend >= 0;
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ background: "#1c1b1d", border: "1px solid #494454" }}
    >
      <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "#958ea0" }}>{title}</p>
      <p className="text-2xl font-bold" style={{ color, fontFamily: "'Geist', sans-serif" }}>{value}</p>
      <div className="flex items-center gap-2 mt-1">
        {trend !== undefined && (
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{
              color:       isPositive ? "#ffb4ab" : "#4edea3",
              background:  isPositive ? "rgba(255,180,171,0.12)" : "rgba(78,222,163,0.12)",
            }}
          >
            {isPositive ? "▲" : "▼"} {Math.abs(trend).toFixed(1)}%
          </span>
        )}
        <p className="text-xs" style={{ color: "#958ea0" }}>{subtitle}</p>
      </div>
      {sparkData.length > 0 && <SparklineChart data={sparkData} color={color} />}
    </div>
  );
}

// ── Category Breakdown Table ───────────────────────────────────────────────────
function CategoryTable({ transactions = [] }) {
  const breakdown = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => { map[c] = { count: 0, total: 0 }; });
    transactions.forEach(({ expense_category, total_amount }) => {
      const cat = map[expense_category] ? expense_category : "Others";
      map[cat].count += 1;
      map[cat].total += total_amount ?? 0;
    });
    const grandTotal = Object.values(map).reduce((s, v) => s + v.total, 0);
    return CATEGORIES.map((cat) => ({
      category: cat,
      ...map[cat],
      pct: grandTotal > 0 ? (map[cat].total / grandTotal) * 100 : 0,
    })).sort((a, b) => b.total - a.total);
  }, [transactions]);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#1c1b1d", border: "1px solid #494454" }}>
      {/* Header */}
      <div
        className="grid grid-cols-4 px-5 py-3 text-xs font-mono uppercase tracking-widest sticky top-0"
        style={{ background: "#201f22", color: "#958ea0", borderBottom: "1px solid #494454" }}
      >
        <span>Kategori</span>
        <span className="text-center">Transaksi</span>
        <span className="text-right">Total</span>
        <span className="text-right">Porsi</span>
      </div>

      {breakdown.map((row, i) => {
        const color = COLORS[row.category] ?? "#958ea0";
        return (
          <div
            key={row.category}
            className="grid grid-cols-4 items-center px-5 py-3.5 transition-colors duration-150 hover:bg-[#2a2a2c]"
            style={{ borderBottom: i < breakdown.length - 1 ? "1px solid #1c1b1d" : "none" }}
          >
            {/* Category */}
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-sm" style={{ color: "#e5e1e4" }}>{row.category}</span>
            </div>

            {/* Count */}
            <p className="text-sm font-mono text-center" style={{ color: "#cbc3d7" }}>{row.count}</p>

            {/* Total */}
            <p className="text-sm font-mono text-right font-medium" style={{ color }}>
              {formatIDR(row.total)}
            </p>

            {/* Percentage bar */}
            <div className="flex items-center justify-end gap-2">
              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: "#353437" }}>
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${row.pct}%`, background: color }}
                />
              </div>
              <span className="text-xs font-mono w-10 text-right" style={{ color: "#958ea0" }}>
                {row.pct.toFixed(1)}%
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Recent Transactions Mini List ──────────────────────────────────────────────
function RecentList({ transactions = [] }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#1c1b1d", border: "1px solid #494454" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #494454" }}>
        <h3 className="text-sm font-semibold" style={{ color: "#e5e1e4", fontFamily: "'Geist', sans-serif" }}>
          Transaksi Terbaru
        </h3>
      </div>
      <div className="divide-y" style={{ borderColor: "#494454" }}>
        {transactions.slice(0, 6).map((tx) => {
          const color = COLORS[tx.expense_category] ?? "#958ea0";
          return (
            <div key={tx.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#2a2a2c] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ background: `${color}18` }}
                >
                  {tx.expense_category === "Raw Materials" ? "🧱" : tx.expense_category === "Logistics" ? "🚚" : tx.expense_category === "Utilities" ? "⚡" : tx.expense_category === "Marketing" ? "📣" : "📦"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm truncate" style={{ color: "#e5e1e4" }}>{tx.merchant_name}</p>
                  <p className="text-xs font-mono" style={{ color: "#958ea0" }}>{formatDate(tx.transaction_date)}</p>
                </div>
              </div>
              <p className="text-sm font-mono font-medium shrink-0 ml-3" style={{ color }}>
                {formatIDRCompact(tx.total_amount)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Analytics({ transactions = null, monthlyData = null }) {
  /**
   * Props:
   *   transactions  - Array of transaction docs from Firestore (live).
   *                   Falls back to MOCK_TRANSACTIONS if null/empty.
   *   monthlyData   - Pre-aggregated monthly breakdown from BigQuery or client-side.
   *                   Falls back to MOCK_MONTHLY if null.
   */
  const [filter, setFilter]   = useState("All");
  const [loading, setLoading] = useState(false);

  const txData     = (transactions?.length ? transactions : MOCK_TRANSACTIONS);
  const monthly    = monthlyData ?? MOCK_MONTHLY;

  // Derive donut data from transactions
  const donutData = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => { map[c] = 0; });
    txData.forEach(({ expense_category, total_amount }) => {
      const cat = map[expense_category] !== undefined ? expense_category : "Others";
      map[cat] += total_amount ?? 0;
    });
    return CATEGORIES.map((c) => ({ name: c, value: map[c] })).filter((d) => d.value > 0);
  }, [txData]);

  // KPI computation
  const totalSpend    = txData.reduce((s, t) => s + (t.total_amount ?? 0), 0);
  const thisMonthData = monthly[monthly.length - 1] ?? {};
  const lastMonthData = monthly[monthly.length - 2] ?? {};
  const momChange     = lastMonthData.total > 0
    ? ((thisMonthData.total - lastMonthData.total) / lastMonthData.total) * 100
    : 0;
  const avgTx         = txData.length > 0 ? totalSpend / txData.length : 0;
  const sparkData     = monthly.map((m) => ({ name: m.month, value: m.total }));

  // Filtered transactions for category filter
  const filtered = filter === "All" ? txData : txData.filter((t) => t.expense_category === filter);

  return (
    <div
      className="min-h-screen"
      style={{
        background:  "#131315",
        fontFamily:  "'Hanken Grotesk', sans-serif",
        color:       "#e5e1e4",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: "#e5e1e4", fontFamily: "'Geist', sans-serif" }}>
            Analitik Keuangan
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#958ea0" }}>
            Pantau tren pengeluaran dan distribusi kategori UMKM Anda secara real-time.
          </p>
          {/* Data source indicator */}
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono"
            style={{ background: "rgba(78,222,163,0.1)", border: "1px solid rgba(78,222,163,0.25)", color: "#4edea3" }}>
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4edea3" }} />
            {transactions?.length ? "Live — Firestore" : "Demo data"}
          </div>
        </div>

        {/* ── KPI Row ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <KpiCard
            title="Total Pengeluaran"
            value={formatIDRCompact(totalSpend)}
            subtitle="keseluruhan periode"
            color="#d0bcff"
            sparkData={sparkData}
          />
          <KpiCard
            title="Bulan Ini"
            value={formatIDRCompact(thisMonthData.total ?? 0)}
            subtitle="vs bulan lalu"
            color={momChange >= 0 ? "#ffb4ab" : "#4edea3"}
            trend={momChange}
          />
          <KpiCard
            title="Rata-rata per Transaksi"
            value={formatIDRCompact(avgTx)}
            subtitle={`dari ${txData.length} transaksi`}
            color="#c0c1ff"
          />
          <KpiCard
            title="Kategori Terbesar"
            value={donutData[0]?.name ?? "—"}
            subtitle={donutData[0] ? formatIDRCompact(donutData[0].value) : ""}
            color={COLORS[donutData[0]?.name] ?? "#958ea0"}
          />
        </div>

        {/* ── Charts Row ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
          <div className="lg:col-span-2">
            <MonthlyTrendChart data={monthly} />
          </div>
          <div>
            <CategoryDonutChart data={donutData} />
          </div>
        </div>

        {/* ── Category Filter ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["All", ...CATEGORIES].map((cat) => {
            const active = filter === cat;
            const color  = cat === "All" ? "#d0bcff" : (COLORS[cat] ?? "#958ea0");
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200"
                style={{
                  background: active ? `${color}20` : "transparent",
                  border:     `1px solid ${active ? color : "#494454"}`,
                  color:      active ? color : "#958ea0",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* ── Bottom Row: Table + Recent ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <CategoryTable transactions={filtered} />
          </div>
          <div className="lg:col-span-2">
            <RecentList transactions={filtered} />
          </div>
        </div>

      </div>
    </div>
  );
}
