import { useEffect, useState } from "react";

function App() {
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    fetch("http://localhost:5001/api/health")
      .then((response) => response.json())
      .then((data) => {
        setBackendStatus(data.message);
      })
      .catch(() => {
        setBackendStatus("Backend unavailable");
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <nav className="border-b border-slate-800 px-8 py-5">
        <h1 className="text-2xl font-bold">FinPilot AI</h1>
        <p className="text-sm text-slate-400">
          Your Personal Financial Mentor
        </p>
      </nav>

      <main className="px-8 py-10">
        <h2 className="text-4xl font-bold">
          Good Morning 👋
        </h2>

        <p className="mt-2 text-slate-400">
          Understand your money. Understand the market.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">Market Mood</p>
            <h3 className="mt-3 text-2xl font-semibold">Neutral</h3>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">Portfolio</p>
            <h3 className="mt-3 text-2xl font-semibold">₹0.00</h3>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-slate-400">Backend Status</p>
            <h3 className="mt-3 text-2xl font-semibold text-green-400">
              {backendStatus}
            </h3>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;