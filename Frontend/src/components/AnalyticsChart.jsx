/**
 * AnalyticsChart.jsx
 * Interactive expense analytics using Recharts.
 * - MonthlyTrendChart: Line + Bar combo for monthly spend per category
 * - CategoryDonut: Donut chart for category distribution
 * Design tokens: surface #131315, primary #d0bcff, secondary #4edea3
 *
 * Install: npm install recharts
 */

import {
  ResponsiveContainer, ComposedChart, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, Sector,
} from "recharts";
import { useState } from "react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const COLORS = {
  "Raw Materials": "#d0bcff",
  Logistics:       "#c0c1ff",
  Utilities:       "#4edea3",
  Marketing:       "#ffb4ab",
  Others:          "#958ea0",
};

const CHART_BG    = "#1c1b1d";
const AXIS_COLOR  = "#958ea0";
const GRID_COLOR  = "#494454";
const TEXT_COLOR  = "#e5e1e4";

// ── IDR formatter ──────────────────────────────────────────────────────────────
const formatIDR = (v) =>
  v >= 1_000_000
    ? `Rp${(v / 1_000_000).toFixed(1)}jt`
    : v >= 1_000
    ? `Rp${(v / 1_000).toFixed(0)}rb`
    : `Rp${v}`;

// ── Custom Tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl px-4 py-3 text-sm"
      style={{
        background:   "#201f22",
        border:       "1px solid #494454",
        backdropFilter: "blur(8px)",
        fontFamily:   "'Hanken Grotesk', sans-serif",
        boxShadow:    "0 8px 32px rgba(0,0,0,0.5)",
      }}
    >
      <p className="font-semibold mb-2" style={{ color: TEXT_COLOR, fontFamily: "'Geist', sans-serif" }}>{label}</p>
      {payload.map((entry, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: entry.color }} />
            {entry.name}
          </span>
          <span className="font-mono font-medium" style={{ color: TEXT_COLOR }}>
            {formatIDR(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Monthly Trend Chart ────────────────────────────────────────────────────────
export function MonthlyTrendChart({ data = [] }) {
  /**
   * data: Array<{ month: string, "Raw Materials": number, Logistics: number,
   *               Utilities: number, Marketing: number, Others: number, total: number }>
   */
  const categories = Object.keys(COLORS);

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: CHART_BG, border: `1px solid ${GRID_COLOR}` }}
    >
      <div className="mb-5">
        <h3 className="text-base font-semibold" style={{ color: TEXT_COLOR, fontFamily: "'Geist', sans-serif" }}>
          Tren Pengeluaran Bulanan
        </h3>
        <p className="text-xs mt-0.5 font-mono" style={{ color: AXIS_COLOR }}>
          Breakdown per kategori · 6 bulan terakhir
        </p>
      </div>

      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={GRID_COLOR} vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: AXIS_COLOR, fontSize: 11, fontFamily: "JetBrains Mono" }}
            axisLine={{ stroke: GRID_COLOR }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatIDR}
            tick={{ fill: AXIS_COLOR, fontSize: 10, fontFamily: "JetBrains Mono" }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: "16px", fontSize: "12px", fontFamily: "JetBrains Mono" }}
            formatter={(value) => <span style={{ color: AXIS_COLOR }}>{value}</span>}
          />
          {categories.map((cat) => (
            <Bar
              key={cat}
              dataKey={cat}
              stackId="a"
              fill={COLORS[cat]}
              radius={cat === "Others" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              opacity={0.85}
            />
          ))}
          <Line
            type="monotone"
            dataKey="total"
            stroke="#4edea3"
            strokeWidth={2.5}
            dot={{ fill: "#4edea3", r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: "#4edea3", strokeWidth: 0 }}
            name="Total"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// ── Active Donut Shape ─────────────────────────────────────────────────────────
function ActiveShape(props) {
  const {
    cx, cy, innerRadius, outerRadius, startAngle, endAngle,
    fill, payload, percent, value,
  } = props;

  return (
    <g>
      <text x={cx} y={cy - 14} textAnchor="middle" fill={TEXT_COLOR} fontSize={14} fontFamily="Geist" fontWeight={600}>
        {payload.name}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill={fill} fontSize={18} fontFamily="Geist" fontWeight={700}>
        {formatIDR(value)}
      </text>
      <text x={cx} y={cy + 30} textAnchor="middle" fill={AXIS_COLOR} fontSize={12} fontFamily="JetBrains Mono">
        {(percent * 100).toFixed(1)}%
      </text>
      <Sector
        cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6}
        startAngle={startAngle} endAngle={endAngle} fill={fill}
      />
      <Sector
        cx={cx} cy={cy} innerRadius={outerRadius + 10} outerRadius={outerRadius + 13}
        startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4}
      />
    </g>
  );
}

// ── Category Donut Chart ───────────────────────────────────────────────────────
export function CategoryDonutChart({ data = [] }) {
  /**
   * data: Array<{ name: string, value: number }>
   * name must match keys in COLORS.
   */
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: CHART_BG, border: `1px solid ${GRID_COLOR}` }}
    >
      <div className="mb-3">
        <h3 className="text-base font-semibold" style={{ color: TEXT_COLOR, fontFamily: "'Geist', sans-serif" }}>
          Distribusi Kategori
        </h3>
        <p className="text-xs mt-0.5 font-mono" style={{ color: AXIS_COLOR }}>
          Klik irisan untuk detail
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            activeIndex={activeIndex}
            activeShape={ActiveShape}
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={72}
            outerRadius={100}
            dataKey="value"
            onMouseEnter={(_, index) => setActiveIndex(index)}
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COLORS[entry.name] ?? "#958ea0"}
                opacity={index === activeIndex ? 1 : 0.65}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="grid grid-cols-1 gap-1.5 mt-1">
        {data.map((entry, i) => {
          const color = COLORS[entry.name] ?? "#958ea0";
          const total = data.reduce((s, d) => s + d.value, 0);
          const pct   = total > 0 ? ((entry.value / total) * 100).toFixed(1) : "0.0";
          return (
            <button
              key={entry.name}
              onClick={() => setActiveIndex(i)}
              className="flex items-center justify-between px-3 py-2 rounded-lg transition-colors duration-150"
              style={{
                background: i === activeIndex ? `${color}14` : "transparent",
                border:     `1px solid ${i === activeIndex ? `${color}40` : "transparent"}`,
              }}
            >
              <span className="flex items-center gap-2 text-sm" style={{ color: i === activeIndex ? color : AXIS_COLOR }}>
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                {entry.name}
              </span>
              <div className="text-right">
                <span className="text-xs font-mono font-medium" style={{ color: i === activeIndex ? color : TEXT_COLOR }}>
                  {pct}%
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Sparkline Mini Chart ───────────────────────────────────────────────────────
export function SparklineChart({ data = [], color = "#4edea3", label = "" }) {
  /**
   * data: Array<{ name: string, value: number }>
   * A small inline chart for KPI cards.
   */
  return (
    <div className="w-full" style={{ height: 48 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          />
          <Tooltip
            content={({ active, payload }) =>
              active && payload?.length ? (
                <span
                  className="text-xs font-mono px-2 py-1 rounded"
                  style={{ background: "#201f22", color, border: `1px solid ${color}40` }}
                >
                  {formatIDR(payload[0].value)}
                </span>
              ) : null
            }
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
