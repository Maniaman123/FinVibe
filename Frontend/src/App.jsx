/**
 * App.jsx
 * Root component with Firebase Auth route-guard.
 *
 * Routing flow:
 *   loading=true            → Full-screen loading splash (prevents layout flash)
 *   loading=false, !user    → Landing / Login (unauthenticated views)
 *   loading=false,  user    → Main app shell (Dashboard / Analytics)
 */

import { useState, useEffect } from "react";

// ── Pages ──────────────────────────────────────────────────────────────────────
import Landing   from "./pages/Landing";
import Login     from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";

// ── Firebase ───────────────────────────────────────────────────────────────────
import {
  auth,
  logout,
  subscribeToAuthState,
  subscribeToTransactions,
  resolveGoogleRedirect,
} from "./lib/firebase";

// ── Loading Spinner ────────────────────────────────────────────────────────────
function LoadingScreen() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center gap-5"
      style={{ background: "#131315" }}
    >
      {/* Animated logo */}
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl animate-pulse"
        style={{ background: "#d0bcff", color: "#3c0091" }}
      >
        F
      </div>

      {/* Spinner ring */}
      <div
        className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "rgba(208,188,255,0.4)", borderTopColor: "#d0bcff" }}
      />

      <p
        className="text-xs font-mono"
        style={{ color: "#494454" }}
      >
        Memuat FinVibe...
      </p>
    </div>
  );
}

// ── Navbar (authenticated shell) ───────────────────────────────────────────────
function Navbar({ activeTab, setActiveTab, user }) {
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
    } catch (err) {
      console.error("Sign-out error:", err);
      setSigningOut(false);
    }
    // onAuthStateChanged in App will handle clearing state automatically
  };

  return (
    <nav
      className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{
        borderColor: "rgba(73,68,84,0.6)",
        background:  "rgba(28, 27, 29, 0.85)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">

          {/* ── Logo ── */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm"
              style={{ background: "#d0bcff", color: "#3c0091" }}
            >
              F
            </div>
            <span
              className="font-bold text-xl tracking-tight"
              style={{ fontFamily: "'Geist', sans-serif", color: "#e5e1e4" }}
            >
              FinVibe
            </span>
          </div>

          {/* ── Right side ── */}
          <div className="flex items-center gap-1 sm:gap-2">

            {/* Tab buttons */}
            {[
              { key: "dashboard", label: "Dashboard" },
              { key: "analytics", label: "Analytics" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className="px-3 py-2 rounded-md text-sm font-medium transition-all duration-200"
                style={{
                  color:      activeTab === key ? "#d0bcff" : "#958ea0",
                  background: activeTab === key ? "rgba(208,188,255,0.1)" : "transparent",
                  fontFamily: "'Hanken Grotesk', sans-serif",
                }}
              >
                {label}
              </button>
            ))}

            {/* Divider */}
            <div
              className="hidden sm:block w-px h-5 mx-1"
              style={{ background: "#494454" }}
            />

            {/* User email (truncated) */}
            {user?.email && (
              <span
                className="hidden sm:block text-xs font-mono max-w-[120px] truncate"
                style={{ color: "#958ea0" }}
                title={user.email}
              >
                {user.email.split("@")[0]}
              </span>
            )}

            {/* Keluar button */}
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all duration-200 hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                color:      "#ffb4ab",
                background: "rgba(255,180,171,0.08)",
                border:     "1px solid rgba(255,180,171,0.2)",
              }}
            >
              {signingOut ? (
                <span
                  className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"
                />
              ) : (
                "↩"
              )}
              <span className="hidden sm:inline">
                {signingOut ? "Keluar..." : "Keluar"}
              </span>
            </button>

          </div>
        </div>
      </div>
    </nav>
  );
}

// ── Main App ───────────────────────────────────────────────────────────────────
export default function App() {
  // Auth state
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true); // true until first auth check

  // Unauthenticated view: "landing" | "login"
  const [view, setView] = useState("landing");

  // Main app tab: "dashboard" | "analytics"
  const [activeTab, setActiveTab] = useState("dashboard");

  // Live Firestore data
  const [transactions, setTransactions] = useState([]);

  // ── 1. Global Auth State Listener + Google Redirect Result ───────────────
  useEffect(() => {
    // We must wait for getRedirectResult() to finish before trusting the
    // first onAuthStateChanged(null) — otherwise a redirect login causes
    // a flash back to the landing page before the session is established.
    let redirectResolved = false;

    const unsubscribeAuth = subscribeToAuthState((firebaseUser) => {
      setUser(firebaseUser);
      // Only dismiss the loading screen after the redirect check is done.
      if (redirectResolved) setLoading(false);
    });

    // Resolve any pending Google redirect (runs once on every app load).
    resolveGoogleRedirect()
      .catch(() => {})
      .finally(() => {
        redirectResolved = true;
        // Auth state has already settled — safe to show the UI now.
        setLoading(false);
      });

    return () => unsubscribeAuth();
  }, []);

  // ── 2. Firestore Real-Time Listener (only when authenticated) ─────────────
  useEffect(() => {
    if (!user) {
      setTransactions([]); // clear data on logout
      return;
    }
    let unsubscribeFs;
    try {
      unsubscribeFs = subscribeToTransactions((data) => {
        setTransactions(data);
      });
    } catch (err) {
      console.warn("Firestore listener error:", err);
    }
    return () => unsubscribeFs?.();
  }, [user]);

  // ── 3. Loading Gate — prevents layout flash ────────────────────────────────
  if (loading) {
    return <LoadingScreen />;
  }

  // ── 4. Unauthenticated Routes ──────────────────────────────────────────────
  if (!user) {
    if (view === "login") {
      return (
        <Login
          onLoginSuccess={() => {
            // onAuthStateChanged will fire automatically and set user
            // No manual navigation needed
          }}
          onBack={() => setView("landing")}
        />
      );
    }
    // Default unauthenticated view
    return <Landing onNavigate={(target) => setView(target)} />;
  }

  // ── 5. Authenticated Main App Shell ───────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "#131315", color: "#e5e1e4" }}
    >
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={user}
      />

      <main className="flex-1">
        {activeTab === "dashboard" ? (
          <Dashboard transactions={transactions} />
        ) : (
          <Analytics transactions={transactions} />
        )}
      </main>
    </div>
  );
}
