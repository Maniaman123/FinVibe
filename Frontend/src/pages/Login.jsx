/**
 * Login.jsx
 * Firebase Auth — Sign In & Sign Up with Email/Password and Google OAuth.
 * Design tokens: #131315 bg | #1c1b1d card | #494454 border | #d0bcff accent | #ffb4ab error
 */

import { useState } from "react";
import {
  auth,
  googleProvider,
  loginWithEmail,
  loginWithGoogle,
} from "../lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";

// ── Error message map (Firebase error codes → Bahasa Indonesia) ───────────────
const ERROR_MAP = {
  "auth/invalid-email":            "Format email tidak valid.",
  "auth/user-not-found":           "Akun dengan email ini tidak ditemukan.",
  "auth/wrong-password":           "Password salah. Silakan coba lagi.",
  "auth/email-already-in-use":     "Email ini sudah terdaftar. Silakan masuk.",
  "auth/weak-password":            "Password terlalu lemah. Minimal 6 karakter.",
  "auth/popup-closed-by-user":     "Login Google dibatalkan.",
  "auth/network-request-failed":   "Koneksi gagal. Periksa jaringan Anda.",
  "auth/too-many-requests":        "Terlalu banyak percobaan. Coba lagi nanti.",
  "auth/invalid-credential":       "Email atau password salah.",
};

const friendlyError = (err) =>
  ERROR_MAP[err?.code] ?? err?.message ?? "Terjadi kesalahan. Silakan coba lagi.";

// ── Input Field ────────────────────────────────────────────────────────────────
function AuthInput({ label, type = "text", value, onChange, placeholder, disabled }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        className="text-xs font-mono uppercase tracking-widest"
        style={{ color: "#958ea0" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete={type === "password" ? "current-password" : "email"}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background:   "#131315",
          border:       "1px solid #494454",
          color:        "#e5e1e4",
          fontFamily:   "'Hanken Grotesk', sans-serif",
        }}
        onFocus={(e) => {
          e.currentTarget.style.border = "1px solid rgba(208,188,255,0.5)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(208,188,255,0.08)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.border = "1px solid #494454";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}

// ── Google Icon ─────────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function Login({ onLoginSuccess }) {
  const [tab,      setTab]      = useState("signin"); // "signin" | "signup"
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setError("");
  };

  const switchTab = (newTab) => {
    setTab(newTab);
    resetForm();
  };

  // ── Email / Password Auth ────────────────────────────────────────────────────
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Email dan password tidak boleh kosong.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (tab === "signin") {
        await loginWithEmail(email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onLoginSuccess?.();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ── Google OAuth ─────────────────────────────────────────────────────────────
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
      onLoginSuccess?.();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative"
      style={{ background: "#131315" }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(208,188,255,0.06) 0%, transparent 70%)",
        }}
      />

      {/* ── Logo ── */}
      <div className="flex items-center gap-3 mb-8">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-base"
          style={{ background: "#d0bcff", color: "#3c0091" }}
        >
          F
        </div>
        <span
          className="font-bold text-2xl tracking-tight"
          style={{ fontFamily: "'Geist', sans-serif", color: "#e5e1e4" }}
        >
          FinVibe
        </span>
      </div>

      {/* ── Card ── */}
      <div
        className="w-full max-w-md rounded-3xl p-8 relative"
        style={{
          background: "#1c1b1d",
          border:     "1px solid #494454",
          boxShadow:  "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* ── Tab Switcher ── */}
        <div
          className="flex p-1 rounded-xl mb-8"
          style={{ background: "#131315" }}
        >
          {[
            { key: "signin", label: "Masuk" },
            { key: "signup", label: "Daftar Akun" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => switchTab(key)}
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
              style={{
                background: tab === key ? "#d0bcff" : "transparent",
                color:      tab === key ? "#3c0091" : "#958ea0",
                fontFamily: "'Geist', sans-serif",
                fontWeight: tab === key ? "600" : "400",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ── Heading ── */}
        <div className="mb-6">
          <h1
            className="text-xl font-bold mb-1"
            style={{ color: "#e5e1e4", fontFamily: "'Geist', sans-serif" }}
          >
            {tab === "signin" ? "Selamat datang kembali" : "Buat akun baru"}
          </h1>
          <p className="text-sm" style={{ color: "#958ea0" }}>
            {tab === "signin"
              ? "Masuk untuk mengakses dashboard UMKM Anda."
              : "Daftar gratis dan mulai kelola keuangan dengan AI."}
          </p>
        </div>

        {/* ── Form ── */}
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-4">
          <AuthInput
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@bisnis.com"
            disabled={loading}
          />
          <AuthInput
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={tab === "signup" ? "Minimal 6 karakter" : "••••••••"}
            disabled={loading}
          />

          {/* ── Error Message ── */}
          {error && (
            <div
              className="flex items-start gap-2 px-4 py-3 rounded-xl text-sm"
              style={{
                background: "rgba(255,180,171,0.08)",
                border:     "1px solid rgba(255,180,171,0.25)",
                color:      "#ffb4ab",
              }}
            >
              <span className="shrink-0 mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Submit Button ── */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100 mt-1"
            style={{
              background:  "linear-gradient(135deg, #d0bcff 0%, #b69eff 100%)",
              color:       "#3c0091",
              fontFamily:  "'Geist', sans-serif",
              boxShadow:   loading ? "none" : "0 4px 20px rgba(208,188,255,0.3)",
            }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
                />
                Memproses...
              </span>
            ) : tab === "signin" ? (
              "Masuk ➔"
            ) : (
              "Buat Akun ➔"
            )}
          </button>
        </form>

        {/* ── Divider ── */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: "#494454" }} />
          <span className="text-xs font-mono" style={{ color: "#494454" }}>
            atau
          </span>
          <div className="flex-1 h-px" style={{ background: "#494454" }} />
        </div>

        {/* ── Google Sign-In Button ── */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
          style={{
            background: "#131315",
            border:     "1px solid #494454",
            color:      "#e5e1e4",
            fontFamily: "'Hanken Grotesk', sans-serif",
          }}
          onMouseEnter={(e) => {
            if (!loading) e.currentTarget.style.border = "1px solid rgba(208,188,255,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.border = "1px solid #494454";
          }}
        >
          <GoogleIcon />
          Masuk dengan Google
        </button>
      </div>

      {/* ── Footer note ── */}
      <p className="mt-8 text-xs font-mono text-center" style={{ color: "#494454" }}>
        Data Anda aman · Dienkripsi oleh Firebase Auth
      </p>
    </div>
  );
}
