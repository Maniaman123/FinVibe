import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Landing from "./pages/Landing";
import { subscribeToTransactions, subscribeToAuthState, logout } from "./lib/firebase";

function App() {
  const [activeTab, setActiveTab]       = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [user, setUser]                 = useState(undefined); // undefined = loading

  // ── Auth State Listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((firebaseUser) => {
      setUser(firebaseUser); // null = logged out, object = logged in
    });
    return () => unsubscribe();
  }, []);

  // ── Firestore Real-Time Listener (only when logged in) ───────────────────────
  useEffect(() => {
    if (!user) return;
    try {
      const unsubscribe = subscribeToTransactions((data) => {
        setTransactions(data);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase listener error:", err);
    }
  }, [user]);

  // ── Loading splash while auth resolves ──────────────────────────────────────
  if (user === undefined) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#131315" }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg animate-pulse"
            style={{ background: "#d0bcff", color: "#3c0091" }}
          >
            F
          </div>
          <p className="text-xs font-mono" style={{ color: "#494454" }}>
            Memuat FinVibe...
          </p>
        </div>
      </div>
    );
  }

  // ── Unauthenticated: Show Landing Page ───────────────────────────────────────
  if (!user) {
    return <Landing onNavigate={(page) => {
      // Navigate to login – handled by Login.jsx (to be added next)
      // For now, redirect to a simple placeholder
      window.location.hash = page;
    }} />;
  }

  // ── Authenticated: Show Main App ─────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "var(--color-surface)", color: "var(--color-text)" }}
    >
      {/* ── Navbar ── */}
      <nav
        className="sticky top-0 z-50 border-b backdrop-blur-md"
        style={{
          borderColor: "var(--color-outline)",
          background: "rgba(28, 27, 29, 0.8)",
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold"
                style={{ background: "var(--color-primary)", color: "#3c0091" }}
              >
                F
              </div>
              <span
                className="font-bold text-xl tracking-tight"
                style={{ fontFamily: "'Geist', sans-serif" }}
              >
                FinVibe
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  color:
                    activeTab === "dashboard"
                      ? "var(--color-primary)"
                      : "var(--color-text-dim)",
                  background:
                    activeTab === "dashboard"
                      ? "rgba(208,188,255,0.1)"
                      : "transparent",
                }}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  color:
                    activeTab === "analytics"
                      ? "var(--color-primary)"
                      : "var(--color-text-dim)",
                  background:
                    activeTab === "analytics"
                      ? "rgba(208,188,255,0.1)"
                      : "transparent",
                }}
              >
                Analytics
              </button>

              {/* User info + Logout */}
              <div
                className="flex items-center gap-2 ml-3 pl-3"
                style={{ borderLeft: "1px solid #494454" }}
              >
                <span className="text-xs font-mono hidden sm:block" style={{ color: "#958ea0" }}>
                  {user.email?.split("@")[0]}
                </span>
                <button
                  onClick={logout}
                  className="px-3 py-1.5 rounded-lg text-xs font-mono transition-colors hover:brightness-110"
                  style={{
                    color: "#ffb4ab",
                    background: "rgba(255,180,171,0.08)",
                    border: "1px solid rgba(255,180,171,0.2)",
                  }}
                >
                  Keluar
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Main Content ── */}
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

export default App;
