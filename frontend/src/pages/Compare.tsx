import { useState } from "react";

type Quote = {
  symbol: string;
  price?: number;
  change?: number;
  changePercent?: number;
};

function Compare() {
  const [symbols, setSymbols] = useState(["TCS", "INFY"]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const updateSymbol = (index: number, value: string) => {
    setSymbols((current) =>
      current.map((symbol, i) =>
        i === index ? value.toUpperCase() : symbol
      )
    );
  };

  const compareStocks = async () => {
    const cleanSymbols = symbols
      .map((symbol) => symbol.trim().toUpperCase())
      .filter(Boolean);

    if (cleanSymbols.length < 2) {
      setError("Enter at least two stock symbols.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const results = await Promise.all(
        cleanSymbols.map(async (symbol) => {
          const response = await fetch(
            `http://localhost:5001/api/market/${symbol}`
          );

          if (!response.ok) {
            throw new Error(`Could not load ${symbol}.`);
          }

          return response.json();
        })
      );

      setQuotes(results);
    } catch (err) {
      console.error("Compare error:", err);
      setQuotes([]);
      setError(
        err instanceof Error
          ? err.message
          : "Could not compare these stocks."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          FinPilot
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Compare Stocks
        </h1>

        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Compare current market data across stocks.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-3 sm:grid-cols-3">
            {symbols.map((symbol, index) => (
              <input
                key={index}
                value={symbol}
                onChange={(event) =>
                  updateSymbol(index, event.target.value)
                }
                placeholder={`Stock ${index + 1}`}
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
              />
            ))}
          </div>

          <button
            onClick={compareStocks}
            disabled={loading}
            className="mt-4 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Comparing..." : "Compare Stocks"}
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
              Loading comparison...
            </div>
          ) : quotes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="text-4xl">⚖️</div>

              <h2 className="mt-4 text-lg font-semibold">
                No comparison yet
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Enter stock symbols above and compare their current data.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full min-w-[600px] text-left">
                <thead className="border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-4 text-sm font-semibold">
                      Stock
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold">
                      Price
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold">
                      Change
                    </th>
                    <th className="px-5 py-4 text-sm font-semibold">
                      Change %
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {quotes.map((quote) => (
                    <tr
                      key={quote.symbol}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                    >
                      <td className="px-5 py-4 font-bold">
                        {quote.symbol}
                      </td>

                      <td className="px-5 py-4">
                        {quote.price !== undefined
                          ? `₹${Number(quote.price).toFixed(2)}`
                          : "Unavailable"}
                      </td>

                      <td className="px-5 py-4">
                        {quote.change !== undefined
                          ? Number(quote.change).toFixed(2)
                          : "Unavailable"}
                      </td>

                      <td className="px-5 py-4">
                        {quote.changePercent !== undefined
                          ? `${Number(quote.changePercent).toFixed(2)}%`
                          : "Unavailable"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Compare;
