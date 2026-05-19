/**
 * Landing.jsx
 * Premium dark-mode landing page for FinVibe.
 * Background: ShapeGrid animated canvas (React Bits).
 * No emojis — clean, minimal, professional.
 */

import ShapeGrid from "../components/ShapeGrid";

const FEATURES = [
  {
    icon: null,
    label: "OCR",
    title: "Ekstraksi Struk Otomatis",
    desc: "Upload foto struk atau invoice — Gemini 1.5 Pro mengekstrak merchant, tanggal, dan nominal secara akurat dalam hitungan detik.",
    accent: "#d0bcff",
    glow: "rgba(208,188,255,0.10)",
  },
  {
    icon: null,
    label: "LIVE",
    title: "Sinkronisasi Real-Time",
    desc: "Data transaksi langsung tampil di dashboard tanpa refresh. Firestore memastikan bisnis Anda selalu up-to-date.",
    accent: "#4edea3",
    glow: "rgba(78,222,163,0.10)",
  },
  {
    icon: null,
    label: "AI",
    title: "FinVibe Coach",
    desc: "Setiap struk dilengkapi saran keuangan singkat dari AI — tips penghematan dan deteksi anomali yang actionable.",
    accent: "#c0c1ff",
    glow: "rgba(192,193,255,0.10)",
  },
  {
    icon: null,
    label: "VIZ",
    title: "Analytics Mendalam",
    desc: "Visualisasikan pengeluaran per kategori dengan Donut Chart interaktif dan tren bulanan dalam Stacked Bar Chart.",
    accent: "#ffb4ab",
    glow: "rgba(255,180,171,0.10)",
  },
  {
    icon: null,
    label: "DB",
    title: "Data Warehouse",
    desc: "Setiap transaksi otomatis diekspor ke BigQuery untuk analitik jangka panjang dan laporan bisnis skala enterprise.",
    accent: "#4edea3",
    glow: "rgba(78,222,163,0.10)",
  },
  {
    icon: null,
    label: "SEC",
    title: "Aman & Terenkripsi",
    desc: "Firebase Auth, Firestore Security Rules, dan signed URL GCS menjaga data UMKM Anda sepenuhnya terlindungi.",
    accent: "#d0bcff",
    glow: "rgba(208,188,255,0.10)",
  },
];

const STATS = [
  { value: "< 5s", label: "Waktu OCR rata-rata" },
  { value: "6", label: "Fitur terintegrasi" },
  { value: "100%", label: "Serverless & scalable" },
  { value: "Real-time", label: "Sinkronisasi data" },
];

// ── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ label, title, desc, accent, glow }) {
  return (
    <div
      className="rounded-2xl p-6 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 cursor-default"
      style={{
        background: `linear-gradient(135deg, ${glow} 0%, rgba(28,27,29,0.85) 100%)`,
        border: `1px solid ${accent}22`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Monospace label badge instead of emoji */}
      <div
        className="w-fit px-2.5 py-0.5 rounded-md text-xs font-mono font-bold tracking-widest"
        style={{
          background: `${accent}18`,
          color: accent,
          border: `1px solid ${accent}30`,
        }}
      >
        {label}
      </div>
      <h3
        className="text-base font-semibold"
        style={{ color: "#e5e1e4", fontFamily: "'Geist', 'Inter', sans-serif" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "#958ea0" }}>
        {desc}
      </p>
    </div>
  );
}

// ── Stat Badge ───────────────────────────────────────────────────────────────
function StatBadge({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-1 px-6 py-4">
      <span
        className="text-3xl font-bold font-mono"
        style={{ color: "#d0bcff", fontFamily: "'Geist', 'Inter', sans-serif" }}
      >
        {value}
      </span>
      <span className="text-xs font-mono" style={{ color: "#958ea0" }}>
        {label}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Landing({ onNavigate }) {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#131315", color: "#e5e1e4" }}
    >
      {/* ── Sticky Navbar ── */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          borderColor: "rgba(73,68,84,0.45)",
          background: "rgba(19,19,21,0.80)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm select-none"
                style={{ background: "#d0bcff", color: "#3c0091" }}
              >
                F
              </div>
              <span
                className="font-bold text-xl tracking-tight"
                style={{ fontFamily: "'Geist', 'Inter', sans-serif" }}
              >
                FinVibe
              </span>
            </div>

            {/* Nav CTA */}
            <button
              onClick={() => onNavigate("login")}
              className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:brightness-110 hover:scale-105 active:scale-95"
              style={{
                background: "rgba(208,188,255,0.10)",
                color: "#d0bcff",
                border: "1px solid rgba(208,188,255,0.22)",
              }}
            >
              Masuk
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section (ShapeGrid background) ── */}
      <section className="relative flex flex-col items-center justify-center text-center px-4 sm:px-6 overflow-hidden"
        style={{ minHeight: "88vh" }}
      >
        {/* ShapeGrid fills the entire hero */}
        <div className="absolute inset-0 z-0">
          <ShapeGrid
            speed={0.3}
            squareSize={44}
            direction="diagonal"
            borderColor="rgba(73,68,84,0.55)"
            hoverFillColor="rgba(208,188,255,0.18)"
            shape="square"
            hoverTrailAmount={6}
          />
        </div>

        {/* Overlay gradient so text remains legible */}
        <div
          className="absolute inset-0 z-10 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 50% 50%, rgba(19,19,21,0.35) 0%, rgba(19,19,21,0.82) 100%)",
          }}
        />

        {/* Content sits above canvas + overlay */}
        <div className="relative z-20 max-w-4xl mx-auto">
          {/* Pill badge */}
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono mb-8"
            style={{
              background: "rgba(208,188,255,0.08)",
              border: "1px solid rgba(208,188,255,0.22)",
              color: "#d0bcff",
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse"
              style={{ background: "#4edea3" }}
            />
            Powered by Gemini 1.5 Pro &amp; Firebase
          </div>

          {/* Headline */}
          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6"
            style={{ fontFamily: "'Geist', 'Inter', sans-serif", color: "#e5e1e4" }}
          >
            Kelola Finansial UMKM{" "}
            <span
              className="relative inline-block"
              style={{
                background: "linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              dengan Kekuatan AI
            </span>
          </h1>

          {/* Sub-heading */}
          <p
            className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: "#958ea0" }}
          >
            Unggah struk fisik, biarkan AI mengekstraknya secara otomatis,
            pantau arus kas secara{" "}
            <span style={{ color: "#e5e1e4" }}>real-time</span>, dan dapatkan
            saran dari{" "}
            <span style={{ color: "#d0bcff" }}>FinVibe Coach</span> — semua
            dalam satu dashboard.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate("login")}
              className="px-8 py-3.5 rounded-xl text-base font-semibold transition-all duration-300 hover:scale-105 active:scale-95"
              style={{
                background: "linear-gradient(135deg, #d0bcff 0%, #b69eff 100%)",
                color: "#3c0091",
                boxShadow: "0 4px 24px rgba(208,188,255,0.30)",
                fontFamily: "'Geist', 'Inter', sans-serif",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow =
                  "0 0 0 6px rgba(208,188,255,0.14), 0 8px 32px rgba(208,188,255,0.42)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow =
                  "0 4px 24px rgba(208,188,255,0.30)";
              }}
            >
              Mulai Sekarang &rarr;
            </button>

            <a
              href="#features"
              className="px-6 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:brightness-125"
              style={{ color: "#958ea0", border: "1px solid #494454" }}
            >
              Lihat Fitur &darr;
            </a>
          </div>
        </div>
      </section>

      {/* ── Stats Strip ── */}
      <section
        className="border-y py-2"
        style={{ borderColor: "#494454", background: "rgba(28,27,29,0.55)" }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#494454]">
            {STATS.map(s => (
              <StatBadge key={s.label} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ── */}
      <section id="features" className="py-24 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <p
              className="text-xs font-mono uppercase tracking-widest mb-3"
              style={{ color: "#d0bcff" }}
            >
              Kenapa FinVibe?
            </p>
            <h2
              className="text-3xl sm:text-4xl font-bold"
              style={{
                fontFamily: "'Geist', 'Inter', sans-serif",
                color: "#e5e1e4",
              }}
            >
              Semua yang dibutuhkan UMKM modern
            </h2>
            <p
              className="mt-4 text-base max-w-xl mx-auto"
              style={{ color: "#958ea0" }}
            >
              Dari struk kertas lusuh hingga insight finansial yang tajam —
              FinVibe menangani seluruh pipeline data Anda secara otomatis.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(f => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA Banner ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="rounded-3xl p-12 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(208,188,255,0.09) 0%, rgba(78,222,163,0.07) 100%)",
              border: "1px solid rgba(208,188,255,0.18)",
            }}
          >
            {/* Subtle top glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 0%, rgba(208,188,255,0.10) 0%, transparent 60%)",
              }}
            />

            <h2
              className="text-3xl sm:text-4xl font-bold mb-4 relative"
              style={{
                fontFamily: "'Geist', 'Inter', sans-serif",
                color: "#e5e1e4",
              }}
            >
              Siap transformasi bisnis Anda?
            </h2>
            <p
              className="text-base mb-8 relative"
              style={{ color: "#958ea0" }}
            >
              Bergabung dan mulai mengelola keuangan UMKM dengan AI. Gratis.
              Sekarang.
            </p>
            <button
              onClick={() => onNavigate("login")}
              className="px-10 py-4 rounded-xl text-base font-bold transition-all duration-300 hover:scale-105 active:scale-95 relative"
              style={{
                background: "linear-gradient(135deg, #d0bcff 0%, #b69eff 100%)",
                color: "#3c0091",
                fontFamily: "'Geist', 'Inter', sans-serif",
                boxShadow: "0 8px 32px rgba(208,188,255,0.30)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.boxShadow =
                  "0 0 0 6px rgba(208,188,255,0.14), 0 12px 40px rgba(208,188,255,0.48)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.boxShadow =
                  "0 8px 32px rgba(208,188,255,0.30)";
              }}
            >
              Mulai Sekarang &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="border-t py-8 px-4 sm:px-6 text-center"
        style={{ borderColor: "#494454" }}
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold select-none"
            style={{ background: "#d0bcff", color: "#3c0091" }}
          >
            F
          </div>
          <span
            className="font-semibold"
            style={{ fontFamily: "'Geist', 'Inter', sans-serif", color: "#e5e1e4" }}
          >
            FinVibe
          </span>
        </div>
        <p className="text-xs font-mono" style={{ color: "#494454" }}>
          Dibuat untuk JuaraVibeCoding Hackathon &middot; Google Cloud Run &middot; Firebase
          &middot; Gemini AI
        </p>
      </footer>
    </div>
  );
}
