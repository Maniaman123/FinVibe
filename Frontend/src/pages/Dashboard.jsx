/**
 * Dashboard.jsx
 * The main operational view. Includes drag-and-drop receipt upload,
 * status indicators, and a live feed of processed transactions.
 */

import { useState, useCallback } from "react";
import TransactionCard from "../components/TransactionCard";

// TODO: Replace with your deployed Cloud Run URL
const API_BASE_URL = "http://localhost:8080";

export default function Dashboard({ transactions = [] }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleUpload(files[0]);
  }, []);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) handleUpload(files[0]);
  };

  const handleUpload = async (file) => {
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") {
      alert("Hanya format gambar (JPG, PNG) atau PDF yang didukung.");
      return;
    }

    setUploading(true);
    setUploadStatus(`Mengamankan jalur upload untuk ${file.name}...`);

    try {
      // 1. Get signed URL from FastAPI
      const res = await fetch(`${API_BASE_URL}/api/upload-url?filename=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`, {
        method: "POST"
      });
      
      if (!res.ok) throw new Error("Gagal mengambil upload URL dari server.");
      const { upload_url } = await res.json();

      setUploadStatus("Mengunggah struk ke Cloud Storage...");

      // 2. Upload directly to GCS
      const uploadRes = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file
      });

      if (!uploadRes.ok) throw new Error("Gagal mengunggah file.");

      setUploadStatus("Upload berhasil! AI sedang memproses data...");
      
      // Clear status after 3 seconds; Firestore listener will show the result
      setTimeout(() => setUploadStatus(""), 3000);

    } catch (err) {
      console.error(err);
      setUploadStatus(`Error: ${err.message}`);
      setTimeout(() => setUploadStatus(""), 5000);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* ── Header ── */}
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: "#e5e1e4", fontFamily: "'Geist', sans-serif" }}>
            Dashboard Operasional
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#958ea0" }}>
            Unggah struk atau invoice untuk diproses oleh AI secara otomatis.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Left Column: Upload Zone ── */}
        <div className="lg:col-span-1">
          <div 
            className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200 flex flex-col items-center justify-center min-h-[300px] ${
              isDragging ? "border-[#d0bcff] bg-[#d0bcff]/10" : "border-[#494454] bg-[#1c1b1d] hover:border-[#958ea0]"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-lg font-medium mb-2" style={{ fontFamily: "'Geist', sans-serif" }}>
              Tarik & Lepas Struk
            </h3>
            <p className="text-sm mb-6" style={{ color: "#958ea0" }}>
              Mendukung JPG, PNG, atau PDF (Max 5MB)
            </p>
            
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
              className={`px-5 py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                uploading ? "opacity-50 cursor-not-allowed" : "hover:brightness-110"
              }`}
              style={{ backgroundColor: "#d0bcff", color: "#3c0091" }}
            >
              {uploading ? "Memproses..." : "Pilih File"}
            </label>

            {uploadStatus && (
              <p className="mt-4 text-xs font-mono animate-pulse" style={{ color: "#4edea3" }}>
                {uploadStatus}
              </p>
            )}
          </div>
        </div>

        {/* ── Right Column: Live Feed ── */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium" style={{ fontFamily: "'Geist', sans-serif" }}>
              Riwayat Transaksi
            </h2>
            <div className="flex items-center gap-2 text-xs font-mono px-2 py-1 rounded" style={{ background: "rgba(208,188,255,0.1)", color: "#d0bcff" }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#d0bcff" }} />
              Live Feed
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {transactions.length === 0 ? (
              <div className="text-center py-12 rounded-2xl" style={{ border: "1px dashed #494454" }}>
                <p style={{ color: "#958ea0" }}>Belum ada transaksi. Silakan unggah struk pertama Anda.</p>
              </div>
            ) : (
              transactions.map((tx) => (
                <TransactionCard key={tx.id || tx.doc_id} transaction={tx} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
