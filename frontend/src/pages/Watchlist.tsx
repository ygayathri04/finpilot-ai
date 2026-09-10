import { useEffect, useState } from "react";

type WatchItem = {
  id: number;
  user_id: number;
  symbol: string;
};

function Watchlist() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [symbol, setSymbol] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5001/api/watchlist/1"
      );

      if (!response.ok) {
        throw new Error("Failed to load watchlist.");
      }

      const data = await response.json();

      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load watchlist:", err);
      setError(
        "Could not load your watchlist. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, []);

  const addStock = async () => {
    const cleanSymbol = symbol.trim().toUpperCase();

    if (!cleanSymbol || saving) {
      return;
    }

    if (
      items.some(
        (item) =>
          item.symbol.toUpperCase() === cleanSymbol
      )
    ) {
      setError(`${cleanSymbol} is already in your watchlist.`);
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "http://localhost:5001/api/watchlist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: 1,
            symbol: cleanSymbol,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to add stock."
        );
      }

      setItems((current) => [...current, data]);
      setSymbol("");
    } catch (err) {
      console.error("Failed to add stock:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not add this stock."
      );
    } finally {
      setSaving(false);
    }
  };

  const removeStock = async (id: number) => {
    try {
      setError("");

      const response = await fetch(
        `http://localhost:5001/api/watchlist/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove stock.");
      }

      setItems((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error("Failed to remove stock:", err);
      setError("Could not remove this stock.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          FinPilot
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Watchlist
        </h1>

        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Keep track of stocks you want to monitor.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <input
            value={symbol}
            onChange={(event) =>
              setSymbol(event.target.value)
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                addStock();
              }
            }}
            placeholder="Enter NSE symbol, e.g. RELIANCE"
            className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900"
          />

          <button
            onClick={addStock}
            disabled={saving || !symbol.trim()}
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Adding..." : "+ Add Stock"}
          </button>
        </div>

        {error && (
          <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="mt-8">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              Loading watchlist...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="text-4xl">👀</div>

              <h2 className="mt-4 text-lg font-semibold">
                Your watchlist is empty
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Add a stock above to start monitoring it.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <article
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">
                        {item.symbol}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        NSE
                      </p>
                    </div>

                    <button
                      onClick={() =>
                        removeStock(item.id)
                      }
                      className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/5"
                    >
                      Remove
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Watchlist;
