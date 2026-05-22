/**
 * Dashboard.jsx
 * The main operational view. Includes drag-and-drop receipt upload,
 * real-time transaction history with search/filter/sort/pagination.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "../lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import TransactionTable from "../components/TransactionTable";
import FadeContent from "../components/FadeContent";

// TODO: Replace with your deployed Cloud Run URL
const API_BASE_URL = "https://finvibe-backend-pczqnj65aa-as.a.run.app";

// ── Formatter ─────────────────────────────────────────────────────────────────
const formatIDRCompact = (v) =>
  v >= 1_000_000_000
    ? `Rp${(v / 1_000_000_000).toFixed(2)}M`
    : v >= 1_000_000
    ? `Rp${(v / 1_000_000).toFixed(1)}jt`
    : `Rp${(v / 1_000).toFixed(0)}rb`;

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, color = "#d0bcff" }) {
  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-1"
      style={{ background: "#1c1b1d", border: "1px solid #494454" }}
    >
      <p className="text-xs font-mono uppercase tracking-widest" style={{ color: "#958ea0" }}>
        {label}
      </p>
      <p className="text-xl font-bold font-mono" style={{ color, fontFamily: "'Geist', sans-serif" }}>
        {value}
      </p>
    </div>
  );
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onUpload, uploading, uploadStatus }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) onUpload(files[0]);
  }, [onUpload]);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) onUpload(files[0]);
  };

  // Parse status type
  const isError   = uploadStatus?.startsWith("Error");
  const isSuccess = uploadStatus?.includes("berhasil");

  return (
    <div
      className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-300 flex flex-col items-center justify-center min-h-[260px] ${
        isDragging
          ? "border-[#d0bcff] bg-[#d0bcff]/5 scale-[1.01]"
          : "border-[#494454] bg-[#1c1b1d] hover:border-[#958ea0]"
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Icon */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 text-2xl transition-all duration-300"
        style={{
          background: isDragging ? "rgba(208,188,255,0.15)" : "rgba(73,68,84,0.3)",
          border: `1px solid ${isDragging ? "#d0bcff" : "#494454"}`,
        }}
      >
        {uploading ? "⏳" : isDragging ? "📂" : "📄"}
      </div>

      <h3 className="text-base font-semibold mb-1" style={{ fontFamily: "'Geist', sans-serif", color: "#e5e1e4" }}>
        {uploading ? "Memproses..." : "Unggah Struk atau Invoice"}
      </h3>
      <p className="text-xs mb-5 font-mono" style={{ color: "#958ea0" }}>
        Tarik & lepas file · JPG, PNG, atau PDF (maks. 5MB)
      </p>

      {/* Upload button */}
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/jpeg, image/png, application/pdf"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <label
        htmlFor="file-upload"
        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-200 ${
          uploading ? "opacity-50 cursor-not-allowed" : "hover:brightness-110 hover:scale-[1.02]"
        }`}
        style={{
          background: uploading
            ? "rgba(208,188,255,0.3)"
            : "linear-gradient(135deg, #d0bcff 0%, #b9a9f0 100%)",
          color:   "#3c0091",
          boxShadow: uploading ? "none" : "0 4px 16px rgba(208,188,255,0.25)",
        }}
      >
        {uploading ? (
          <>
            <span className="w-4 h-4 border-2 border-[#3c0091]/40 border-t-[#3c0091] rounded-full animate-spin" />
            Memproses...
          </>
        ) : (
          "Pilih File"
        )}
      </label>

      {/* Status message */}
      {uploadStatus && (
        <div
          className="mt-4 px-3 py-2 rounded-xl text-xs font-mono max-w-full text-center animate-pulse"
          style={{
            color:      isError ? "#ffb4ab" : isSuccess ? "#4edea3" : "#d0bcff",
            background: isError
              ? "rgba(255,180,171,0.1)"
              : isSuccess
              ? "rgba(78,222,163,0.1)"
              : "rgba(208,188,255,0.1)",
            border: `1px solid ${isError ? "rgba(255,180,171,0.25)" : isSuccess ? "rgba(78,222,163,0.25)" : "rgba(208,188,255,0.25)"}`,
          }}
        >
          {uploadStatus}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard({ transactions = [] }) {
  const [uploading,    setUploading]    = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  // Ref to hold the active Firestore document listener so we can unsubscribe it.
  const fsListenerRef = useRef(null);

  // Cleanup any pending Firestore doc listener when component unmounts.
  useEffect(() => () => fsListenerRef.current?.(), []);

  // ── Computed stats ─────────────────────────────────────────────────────────
  const totalSpend  = transactions.reduce((s, t) => s + (t.total_amount ?? 0), 0);
  const todayISO    = new Date().toISOString().slice(0, 10);
  const todayTx     = transactions.filter((t) => t.transaction_date === todayISO);
  const todaySpend  = todayTx.reduce((s, t) => s + (t.total_amount ?? 0), 0);

  const categoryCount = transactions.reduce((acc, t) => {
    const cat = t.expense_category ?? "Others";
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {});
  const topCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";

  // ── Watch a specific Firestore doc for backend processing result ───────────
  /**
   * After the file is uploaded to GCS, the backend will process it and write
   * the result (status: 'success' | 'error') to a Firestore document whose ID
   * matches the GCS object name (with '/' replaced by '_' and extension stripped).
   * We listen to that document in real-time to show the user the processing result.
   */
  const watchDocStatus = useCallback((objectName) => {
    // Unsubscribe from any previous listener
    fsListenerRef.current?.();

    // Compute the doc_id the backend will use (mirrors process_receipt() in main.py)
    const docId = objectName.replace(/\//g, "_").replace(/\.[^.]+$/, "");

    const unsub = onSnapshot(
      doc(db, "transactions", docId),
      (snapshot) => {
        if (!snapshot.exists()) return; // Backend hasn't written yet — keep waiting.
        const { status, error } = snapshot.data();
        if (status === "success") {
          setUploadStatus("✅ Struk berhasil diproses! Data transaksi sudah masuk.");
          setTimeout(() => setUploadStatus(""), 6000);
          unsub(); // Stop listening — done.
        } else if (status === "error") {
          setUploadStatus(`❌ Gagal memproses struk: ${error ?? "Error tidak diketahui."}`);
          setTimeout(() => setUploadStatus(""), 8000);
          unsub(); // Stop listening — done.
        }
      },
      (err) => {
        console.error("[Dashboard] Firestore doc watch error:", err);
        setUploadStatus("❌ Tidak dapat terhubung ke Firestore.");
        setTimeout(() => setUploadStatus(""), 6000);
      }
    );

    fsListenerRef.current = unsub;

    // Safety timeout: if backend takes >60s, tell the user something is wrong.
    setTimeout(() => {
      if (fsListenerRef.current === unsub) {
        unsub();
        setUploadStatus("⚠️ Proses AI memakan waktu lebih lama dari biasanya. Coba refresh halaman.");
        setTimeout(() => setUploadStatus(""), 8000);
      }
    }, 60_000);
  }, []);

  // ── Upload handler ─────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (file) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      setUploadStatus("Error: Hanya format gambar (JPG, PNG) atau PDF yang didukung.");
      setTimeout(() => setUploadStatus(""), 4000);
      return;
    }

    setUploading(true);
    setUploadStatus(`Mengamankan jalur upload untuk ${file.name}...`);

    try {
      // 1. Get signed URL from FastAPI
      const res = await fetch(
        `${API_BASE_URL}/api/upload-url?filename=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`,
        { method: "POST" }
      );
      if (!res.ok) throw new Error("Gagal mengambil upload URL dari server.");
      const { upload_url, object_name } = await res.json();

      setUploadStatus("Mengunggah struk ke Cloud Storage...");

      // 2. Upload directly to GCS via signed URL
      const uploadRes = await fetch(upload_url, {
        method:  "PUT",
        headers: { "Content-Type": file.type },
        body:    file,
      });
      if (!uploadRes.ok) throw new Error("Gagal mengunggah file ke storage.");

      // 3. Start watching the Firestore doc for backend processing result.
      //    This replaces the naive setTimeout — users now see real success/error.
      setUploadStatus("⏳ Upload berhasil! AI sedang mengekstrak data struk...");
      watchDocStatus(object_name);
    } catch (err) {
      console.error(err);
      setUploadStatus(`Error: ${err.message}`);
      setTimeout(() => setUploadStatus(""), 5000);
    } finally {
      setUploading(false);
    }
  }, [watchDocStatus]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1
            className="text-3xl font-bold"
            style={{ color: "#e5e1e4", fontFamily: "'Geist', sans-serif" }}
          >
            Dashboard
          </h1>
          {/* Live indicator */}
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono"
            style={{ background: "rgba(78,222,163,0.1)", border: "1px solid rgba(78,222,163,0.25)", color: "#4edea3" }}
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4edea3" }} />
            Live
          </div>
        </div>
        <p className="text-sm" style={{ color: "#958ea0" }}>
          Unggah struk untuk diproses AI, lalu pantau riwayat transaksi secara real-time.
        </p>
      </div>

      {/* ── Stat Cards ── */}
      <FadeContent blur duration={800} delay={0} ease="power2.out" initialOpacity={0}>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
          <StatCard label="Total Pengeluaran" value={formatIDRCompact(totalSpend)} color="#d0bcff" />
          <StatCard label="Hari Ini" value={formatIDRCompact(todaySpend)} color="#4edea3" />
          <StatCard label="Kategori Terbanyak" value={topCategory} color="#ffb4ab" />
        </div>
      </FadeContent>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* ── Left Column: Upload Zone ── */}
        <div className="lg:col-span-1">
          <FadeContent blur duration={800} delay={100} ease="power2.out" initialOpacity={0}>
            <UploadZone
              onUpload={handleUpload}
              uploading={uploading}
              uploadStatus={uploadStatus}
            />
          </FadeContent>

          {/* Quick tips */}
          <div
            className="mt-4 rounded-2xl p-4"
            style={{ background: "#1c1b1d", border: "1px solid #494454" }}
          >
            <p className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: "#958ea0" }}>
              Tips
            </p>
            {[
              { icon: "📷", text: "Foto struk yang terang dan tidak buram" },
              { icon: "🔍", text: "Pastikan teks struk terbaca jelas" },
              { icon: "⚡", text: "Hasil OCR muncul dalam 5–10 detik" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex items-start gap-2 mb-2">
                <span className="shrink-0 text-sm">{icon}</span>
                <p className="text-xs leading-relaxed" style={{ color: "#958ea0" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right Column: Transaction History ── */}
        <div className="lg:col-span-2">
          <FadeContent blur duration={800} delay={150} ease="power2.out" initialOpacity={0}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold" style={{ fontFamily: "'Geist', sans-serif", color: "#e5e1e4" }}>
                Riwayat Transaksi
              </h2>
              <span className="text-xs font-mono" style={{ color: "#958ea0" }}>
                {transactions.length} total
              </span>
            </div>

            <TransactionTable transactions={transactions} />
          </FadeContent>
        </div>

      </div>
    </div>
  );
}
