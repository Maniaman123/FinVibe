/**
 * Analytics.jsx — Full Analytics Page
 * Computes all KPIs and chart data in real-time from Firestore transactions.
 * Includes period selector, CSV export, and all-live charts.
 *
 * Design tokens: surface #131315, container-low #1c1b1d,
 *                primary #d0bcff, secondary #4edea3, error #ffb4ab
 */

import { useState, useMemo } from "react";
import { MonthlyTrendChart, CategoryDonutChart, SparklineChart } from "../components/AnalyticsChart";
import FadeContent from "../components/FadeContent";

// ── Design tokens ──────────────────────────────────────────────────────────────
const COLORS = {
  "Raw Materials": "#d0bcff",
  Logistics:       "#c0c1ff",
  Utilities:       "#4edea3",
  Marketing:       "#ffb4ab",
  Others:          "#958ea0",
};

const CATEGORIES = ["Raw Materials", "Logistics", "Utilities", "Marketing", "Others"];

const MONTH_NAMES_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

// ── Formatters ─────────────────────────────────────────────────────────────────
const formatIDR = (v) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(v ?? 0);

const formatIDRCompact = (v) =>
  v >= 1_000_000_000
    ? `Rp${(v / 1_000_000_000).toFixed(2)}M`
    : v >= 1_000_000
    ? `Rp${(v / 1_000_000).toFixed(1)}jt`
    : `Rp${(v / 1_000).toFixed(0)}rb`;

const formatDate = (d) =>
  new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short" });

// ── Period helpers ─────────────────────────────────────────────────────────────
const PERIODS = [
  { key: "1m",  label: "1 Bulan" },
  { key: "3m",  label: "3 Bulan" },
  { key: "6m",  label: "6 Bulan" },
  { key: "1y",  label: "1 Tahun" },
  { key: "all", label: "Semua" },
];

function getPeriodStartDate(key) {
  const now = new Date();
  switch (key) {
    case "1m":  return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    case "3m":  return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
    case "6m":  return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    case "1y":  return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    default:    return new Date(0); // all time
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({ title, value, subtitle, color = "#4edea3", sparkData = [], trend }) {
  const isPositive = trend >= 0;
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1 transition-all duration-300 hover:scale-[1.01]"
      style={{ background: "#1c1b1d", border: "1px solid #494454", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
    >
      <p className="text-xs font-mono uppercase tracking-widest mb-1" style={{ color: "#958ea0" }}>
        {title}
      </p>
      <p className="text-2xl font-bold" style={{ color, fontFamily: "'Geist', sans-serif" }}>
        {value}
      </p>
      <div className="flex items-center gap-2 mt-1">
        {trend !== undefined && (
          <span
            className="text-xs font-mono px-1.5 py-0.5 rounded"
            style={{
              color:      isPositive ? "#ffb4ab" : "#4edea3",
              background: isPositive ? "rgba(255,180,171,0.12)" : "rgba(78,222,163,0.12)",
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
      <div
        className="grid grid-cols-4 px-5 py-3 text-xs font-mono uppercase tracking-widest"
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
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
              <span className="text-sm" style={{ color: "#e5e1e4" }}>{row.category}</span>
            </div>
            <p className="text-sm font-mono text-center" style={{ color: "#cbc3d7" }}>{row.count}</p>
            <p className="text-sm font-mono text-right font-medium" style={{ color }}>{formatIDR(row.total)}</p>
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

function RecentList({ transactions = [] }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#1c1b1d", border: "1px solid #494454" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #494454" }}>
        <h3 className="text-sm font-semibold" style={{ color: "#e5e1e4", fontFamily: "'Geist', sans-serif" }}>
          Transaksi Terbaru
        </h3>
      </div>
      {transactions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10">
          <p className="text-sm font-mono" style={{ color: "#494454" }}>Tidak ada data</p>
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "#1c1b1d" }}>
          {transactions.slice(0, 8).map((tx) => {
            const color = COLORS[tx.expense_category] ?? "#958ea0";
            const icons = { "Raw Materials": "🧱", Logistics: "🚚", Utilities: "⚡", Marketing: "📣", Others: "📦" };
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between px-5 py-3 hover:bg-[#2a2a2c] transition-colors duration-150"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
                    style={{ background: `${color}18` }}
                  >
                    {icons[tx.expense_category] ?? "📦"}
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
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function Analytics({ transactions = null }) {
  const [period,    setPeriod]    = useState("6m");
  const [filterCat, setFilterCat] = useState("All");

  // ── 1. Filter by period ────────────────────────────────────────────────────
  const txAll = transactions ?? [];
  const periodStart = getPeriodStartDate(period);

  const txInPeriod = useMemo(() =>
    txAll.filter((t) => {
      if (!t.transaction_date) return false;
      return new Date(t.transaction_date) >= periodStart;
    }),
    [txAll, period]
  );

  // ── 2. Filter by category ──────────────────────────────────────────────────
  const txFiltered = useMemo(() =>
    filterCat === "All"
      ? txInPeriod
      : txInPeriod.filter((t) => t.expense_category === filterCat),
    [txInPeriod, filterCat]
  );

  // ── 3. Compute monthly trend ───────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    // Determine how many months to show
    const monthCount = period === "1m" ? 1 : period === "3m" ? 3 : period === "6m" ? 6 : period === "1y" ? 12 : 6;
    const now = new Date();
    const months = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({
        key,
        label: MONTH_NAMES_ID[d.getMonth()],
        "Raw Materials": 0,
        Logistics: 0,
        Utilities: 0,
        Marketing: 0,
        Others: 0,
        total: 0,
      });
    }

    txAll.forEach((t) => {
      if (!t.transaction_date) return;
      const d   = new Date(t.transaction_date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const m   = months.find((mo) => mo.key === key);
      if (!m) return;
      const cat = CATEGORIES.includes(t.expense_category) ? t.expense_category : "Others";
      m[cat]    += t.total_amount ?? 0;
      m.total   += t.total_amount ?? 0;
    });

    return months.map(({ key, ...rest }) => rest); // drop internal key for recharts
  }, [txAll, period]);

  // ── 4. Donut chart data ────────────────────────────────────────────────────
  const donutData = useMemo(() => {
    const map = {};
    CATEGORIES.forEach((c) => { map[c] = 0; });
    txInPeriod.forEach(({ expense_category, total_amount }) => {
      const cat = CATEGORIES.includes(expense_category) ? expense_category : "Others";
      map[cat] += total_amount ?? 0;
    });
    return CATEGORIES.map((c) => ({ name: c, value: map[c] })).filter((d) => d.value > 0);
  }, [txInPeriod]);

  // ── 5. KPI computation ─────────────────────────────────────────────────────
  const totalSpend = txInPeriod.reduce((s, t) => s + (t.total_amount ?? 0), 0);
  const thisMonth  = monthlyData[monthlyData.length - 1] ?? {};
  const lastMonth  = monthlyData[monthlyData.length - 2] ?? {};
  const momChange  = lastMonth.total > 0
    ? ((thisMonth.total - lastMonth.total) / lastMonth.total) * 100
    : 0;
  const avgTx      = txInPeriod.length > 0 ? totalSpend / txInPeriod.length : 0;
  const topCat     = donutData.sort((a, b) => b.value - a.value)[0];
  const sparkData  = monthlyData.map((m) => ({ name: m.label, value: m.total }));

  const isLive = txAll.length > 0;

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const header = ["Tanggal", "Merchant", "Kategori", "Total (IDR)", "Status"];
    const rows = txFiltered.map((t) => [
      t.transaction_date ?? "",
      `"${t.merchant_name ?? ""}"`,
      t.expense_category ?? "",
      t.total_amount ?? 0,
      t.status ?? "success",
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `finvibe-analitik-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "#131315", fontFamily: "'Hanken Grotesk', sans-serif", color: "#e5e1e4" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Page Header ── */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: "#e5e1e4", fontFamily: "'Geist', sans-serif" }}>
                Analitik Keuangan
              </h1>
              <p className="mt-1 text-sm" style={{ color: "#958ea0" }}>
                Pantau tren pengeluaran dan distribusi kategori UMKM Anda secara real-time.
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Live badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono"
                style={{
                  background: isLive ? "rgba(78,222,163,0.1)" : "rgba(149,142,160,0.1)",
                  border:     `1px solid ${isLive ? "rgba(78,222,163,0.25)" : "rgba(149,142,160,0.25)"}`,
                  color:      isLive ? "#4edea3" : "#958ea0",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: isLive ? "#4edea3" : "#958ea0", animation: isLive ? "pulse 2s infinite" : "none" }}
                />
                {isLive ? "Live — Firestore" : "Menunggu data..."}
              </div>

              {/* Export CSV */}
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-mono transition-colors duration-200"
                style={{
                  background: "rgba(208,188,255,0.08)",
                  border:     "1px solid rgba(208,188,255,0.25)",
                  color:      "#d0bcff",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(208,188,255,0.15)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(208,188,255,0.08)")}
              >
                ↓ Export CSV
              </button>
            </div>
          </div>

          {/* ── Period Selector ── */}
          <div className="flex items-center gap-2 mt-5 flex-wrap">
            <span className="text-xs font-mono" style={{ color: "#494454" }}>Periode:</span>
            {PERIODS.map(({ key, label }) => {
              const active = period === key;
              return (
                <button
                  key={key}
                  onClick={() => setPeriod(key)}
                  className="px-3 py-1 rounded-lg text-xs font-mono transition-all duration-200"
                  style={{
                    background: active ? "rgba(208,188,255,0.15)" : "transparent",
                    border:     `1px solid ${active ? "#d0bcff" : "#494454"}`,
                    color:      active ? "#d0bcff" : "#958ea0",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── KPI Row ── */}
        <FadeContent blur={true} duration={800} delay={0} ease="power2.out" initialOpacity={0}>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
              title="Total Pengeluaran"
              value={formatIDRCompact(totalSpend)}
              subtitle={`${txInPeriod.length} transaksi`}
              color="#d0bcff"
              sparkData={sparkData}
            />
            <KpiCard
              title="Bulan Ini"
              value={formatIDRCompact(thisMonth.total ?? 0)}
              subtitle="vs bulan lalu"
              color={momChange >= 0 ? "#ffb4ab" : "#4edea3"}
              trend={momChange}
            />
            <KpiCard
              title="Rata-rata / Transaksi"
              value={formatIDRCompact(avgTx)}
              subtitle={`dari ${txInPeriod.length} transaksi`}
              color="#c0c1ff"
            />
            <KpiCard
              title="Kategori Terbesar"
              value={topCat?.name ?? "—"}
              subtitle={topCat ? formatIDRCompact(topCat.value) : "belum ada data"}
              color={COLORS[topCat?.name] ?? "#958ea0"}
            />
          </div>
        </FadeContent>

        {/* ── Charts Row ── */}
        <FadeContent blur={true} duration={800} delay={100} ease="power2.out" initialOpacity={0}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
            <div className="lg:col-span-2">
              <MonthlyTrendChart data={monthlyData} />
            </div>
            <div>
              <CategoryDonutChart data={donutData} />
            </div>
          </div>
        </FadeContent>

        {/* ── Category Filter ── */}
        <div className="flex flex-wrap gap-2 mb-4">
          {["All", ...CATEGORIES].map((cat) => {
            const active = filterCat === cat;
            const color  = cat === "All" ? "#d0bcff" : (COLORS[cat] ?? "#958ea0");
            return (
              <button
                key={cat}
                onClick={() => setFilterCat(cat)}
                className="px-3 py-1.5 rounded-full text-xs font-mono transition-all duration-200"
                style={{
                  background: active ? `${color}20` : "transparent",
                  border:     `1px solid ${active ? color : "#494454"}`,
                  color:      active ? color : "#958ea0",
                }}
              >
                {cat === "All" ? "Semua" : cat}
                {cat !== "All" && txInPeriod.filter((t) => t.expense_category === cat).length > 0 && (
                  <span className="ml-1.5 opacity-60">
                    ({txInPeriod.filter((t) => t.expense_category === cat).length})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Bottom Row: Table + Recent ── */}
        <FadeContent blur={true} duration={800} delay={200} ease="power2.out" initialOpacity={0}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-3">
              <CategoryTable transactions={txFiltered} />
            </div>
            <div className="lg:col-span-2">
              <RecentList transactions={txFiltered} />
            </div>
          </div>
        </FadeContent>

      </div>
    </div>
  );
}
