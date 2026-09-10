import { useEffect, useMemo, useState } from "react";

type Holding = {
  id: number;
  symbol: string;
  quantity: number;
  average_price: number;
};

type Quote = {
  symbol: string;
  price?: number;
};

function Reports() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [quotes, setQuotes] = useState<Record<string, Quote>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadReportData = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5001/api/holdings/1"
        );

        if (!response.ok) {
          throw new Error("Failed to load portfolio data.");
        }

        const data = await response.json();
        const holdingData = Array.isArray(data) ? data : [];

        setHoldings(holdingData);

        const quoteResults = await Promise.all(
          holdingData.map(async (holding: Holding) => {
            try {
              const quoteResponse = await fetch(
                `http://localhost:5001/api/market/${holding.symbol}`
              );

              if (!quoteResponse.ok) {
                return null;
              }

              return await quoteResponse.json();
            } catch {
              return null;
            }
          })
        );

        const quoteMap: Record<string, Quote> = {};

        quoteResults.forEach((quote) => {
          if (quote?.symbol) {
            quoteMap[quote.symbol] = quote;
          }
        });

        setQuotes(quoteMap);
      } catch (err) {
        console.error("Failed to load report:", err);
        setError(
          "Could not load your report. Make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    loadReportData();
  }, []);

  const totals = useMemo(() => {
    let invested = 0;
    let currentValue = 0;

    holdings.forEach((holding) => {
      invested +=
        Number(holding.quantity) *
        Number(holding.average_price);

      const quote = quotes[holding.symbol];

      if (quote?.price !== undefined) {
        currentValue +=
          Number(holding.quantity) *
          Number(quote.price);
      }
    });

    return {
      invested,
      currentValue,
      pnl:
        currentValue > 0
          ? currentValue - invested
          : null,
    };
  }, [holdings, quotes]);

  const downloadReport = () => {
    const lines = [
      "FinPilot Portfolio Report",
      `Generated: ${new Date().toLocaleString()}`,
      "",
      `Total holdings: ${holdings.length}`,
      `Total invested: ₹${totals.invested.toFixed(2)}`,
      totals.currentValue > 0
        ? `Current value: ₹${totals.currentValue.toFixed(2)}`
        : "Current value: Unavailable",
      totals.pnl !== null
        ? `P&L: ₹${totals.pnl.toFixed(2)}`
        : "P&L: Unavailable",
      "",
      "Holdings:",
      ...holdings.map(
        (holding) =>
          `${holding.symbol} | Quantity: ${holding.quantity} | Average price: ₹${Number(
            holding.average_price
          ).toFixed(2)}`
      ),
    ];

    const blob = new Blob([lines.join("\n")], {
      type: "text/plain",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "finpilot-report.txt";
    link.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          FinPilot
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Reports
        </h1>

        <p className="mt-2 text-slate-600 dark:text-slate-400">
          View and generate a portfolio report.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            Loading report...
          </div>
        ) : (
          <>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500">
                  Total Holdings
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {holdings.length}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500">
                  Total Invested
                </p>
                <p className="mt-2 text-2xl font-bold">
                  ₹{totals.invested.toFixed(2)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500">
                  Current Value
                </p>
                <p className="mt-2 text-2xl font-bold">
                  {totals.currentValue > 0
                    ? `₹${totals.currentValue.toFixed(2)}`
                    : "Unavailable"}
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={downloadReport}
                disabled={holdings.length === 0}
                className="rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Generate Report
              </button>
            </div>

            {holdings.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
                <div className="text-4xl">📊</div>
                <h2 className="mt-4 text-lg font-semibold">
                  No portfolio data
                </h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Add holdings to generate a portfolio report.
                </p>
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full min-w-[650px] text-left">
                  <thead className="border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="px-5 py-4 text-sm font-semibold">
                        Stock
                      </th>
                      <th className="px-5 py-4 text-sm font-semibold">
                        Quantity
                      </th>
                      <th className="px-5 py-4 text-sm font-semibold">
                        Average Price
                      </th>
                      <th className="px-5 py-4 text-sm font-semibold">
                        Current Price
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {holdings.map((holding) => {
                      const quote = quotes[holding.symbol];

                      return (
                        <tr
                          key={holding.id}
                          className="border-b border-slate-100 last:border-0 dark:border-slate-800"
                        >
                          <td className="px-5 py-4 font-bold">
                            {holding.symbol}
                          </td>

                          <td className="px-5 py-4">
                            {holding.quantity}
                          </td>

                          <td className="px-5 py-4">
                            ₹
                            {Number(
                              holding.average_price
                            ).toFixed(2)}
                          </td>

                          <td className="px-5 py-4">
                            {quote?.price !== undefined
                              ? `₹${Number(
                                  quote.price
                                ).toFixed(2)}`
                              : "Unavailable"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Reports;
