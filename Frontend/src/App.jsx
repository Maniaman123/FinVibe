import { useState, useEffect } from "react";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import { subscribeToTransactions } from "./lib/firebase";

function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [transactions, setTransactions] = useState([]);

  // Setup real-time listener to Firestore when app loads
  useEffect(() => {
    // If you haven't configured Firebase yet, this will throw an error.
    // Comment out the try-catch block if testing UI only with mock data.
    try {
      const unsubscribe = subscribeToTransactions((data) => {
        setTransactions(data);
      });
      return () => unsubscribe();
    } catch (err) {
      console.warn("Firebase not fully configured yet. Using empty state for Live Feed.", err);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--color-surface)", color: "var(--color-text)" }}>
      
      {/* ── Navbar ── */}
      <nav 
        className="sticky top-0 z-50 border-b backdrop-blur-md" 
        style={{ borderColor: "var(--color-outline)", background: "rgba(28, 27, 29, 0.8)" }}
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
              <span className="font-bold text-xl tracking-tight" style={{ fontFamily: "'Geist', sans-serif" }}>
                FinVibe
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => setActiveTab("dashboard")}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  color: activeTab === "dashboard" ? "var(--color-primary)" : "var(--color-text-dim)",
                  background: activeTab === "dashboard" ? "rgba(208,188,255,0.1)" : "transparent"
                }}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className="px-3 py-2 rounded-md text-sm font-medium transition-colors"
                style={{
                  color: activeTab === "analytics" ? "var(--color-primary)" : "var(--color-text-dim)",
                  background: activeTab === "analytics" ? "rgba(208,188,255,0.1)" : "transparent"
                }}
              >
                Analytics
              </button>
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
