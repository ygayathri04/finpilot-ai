import { useEffect, useState } from "react";

type Holding = {
  id: number;
  portfolio_id: number;
  symbol: string;
  quantity: string;
  average_price: string;
  created_at: string;
};

type WatchlistItem = {
  id: number;
  user_id: number;
  symbol: string;
  created_at: string;
};

type MarketData = {
  symbol: string;
  price: number;
  previousClose: number;
  currency: string;
  exchange: string;
};

function App() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [marketPrices, setMarketPrices] = useState<
    Record<string, MarketData>
  >({});

  const [loading, setLoading] = useState(true);
  const [watchlistLoading, setWatchlistLoading] = useState(true);

  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [averagePrice, setAveragePrice] = useState("");
  const [adding, setAdding] = useState(false);

  const [watchSymbol, setWatchSymbol] = useState("");
  const [addingToWatchlist, setAddingToWatchlist] = useState(false);

  // Fetch holdings and watchlist
  useEffect(() => {
    fetch("http://localhost:5001/api/holdings/1")
      .then((response) => response.json())
      .then((data) => {
        setHoldings(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch holdings:", error);
        setLoading(false);
      });

    fetch("http://localhost:5001/api/watchlist/1")
      .then((response) => response.json())
      .then((data) => {
        setWatchlist(data);
        setWatchlistLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch watchlist:", error);
        setWatchlistLoading(false);
      });
  }, []);

  // Fetch market prices for holdings + watchlist
  useEffect(() => {
    const fetchPrices = async () => {
      const prices: Record<string, MarketData> = {};

      const symbols = [
        ...holdings.map((holding) => holding.symbol),
        ...watchlist.map((item) => item.symbol),
      ];

      const uniqueSymbols = [...new Set(symbols)];

      for (const symbol of uniqueSymbols) {
        try {
          const response = await fetch(
            `http://localhost:5001/api/market/${symbol}`
          );

          if (!response.ok) {
            continue;
          }

          const data: MarketData = await response.json();

          prices[symbol] = data;
        } catch (error) {
          console.error(
            `Failed to fetch price for ${symbol}:`,
            error
          );
        }
      }

      setMarketPrices(prices);
    };

    if (holdings.length > 0 || watchlist.length > 0) {
      fetchPrices();
    }
  }, [holdings, watchlist]);

  // Add holding
  const addHolding = async () => {
    if (!symbol || !quantity || !averagePrice) {
      return;
    }

    setAdding(true);

    try {
      const response = await fetch(
        "http://localhost:5001/api/holdings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            portfolio_id: 1,
            symbol: symbol.toUpperCase(),
            quantity: Number(quantity),
            average_price: Number(averagePrice),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add holding");
      }

      const newHolding = await response.json();

      setHoldings((current) => [...current, newHolding]);

      setSymbol("");
      setQuantity("");
      setAveragePrice("");
    } catch (error) {
      console.error("Failed to add holding:", error);
    } finally {
      setAdding(false);
    }
  };

  // Add to watchlist
  const addToWatchlist = async () => {
    if (!watchSymbol) {
      return;
    }

    setAddingToWatchlist(true);

    try {
      const response = await fetch(
        "http://localhost:5001/api/watchlist",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: 1,
            symbol: watchSymbol.toUpperCase(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to add to watchlist");
      }

      const newStock = await response.json();

      setWatchlist((current) => [...current, newStock]);

      setWatchSymbol("");
    } catch (error) {
      console.error("Failed to add to watchlist:", error);
    } finally {
      setAddingToWatchlist(false);
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (id: number) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/watchlist/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to remove stock");
      }

      setWatchlist((current) =>
        current.filter((item) => item.id !== id)
      );
    } catch (error) {
      console.error("Failed to remove stock:", error);
    }
  };

  // Total invested amount
  const totalInvestment = holdings.reduce(
    (total, holding) =>
      total +
      Number(holding.quantity) *
        Number(holding.average_price),
    0
  );

  // Current portfolio value
  const totalCurrentValue = holdings.reduce(
    (total, holding) => {
      const marketData = marketPrices[holding.symbol];

      if (!marketData) {
        return total;
      }

      return (
        total +
        Number(holding.quantity) * marketData.price
      );
    },
    0
  );

  // Overall profit/loss
  const totalProfitLoss =
    totalCurrentValue - totalInvestment;

  const totalReturn =
    totalInvestment > 0
      ? (totalProfitLoss / totalInvestment) * 100
      : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-slate-800 px-8 py-5">
        <h1 className="text-2xl font-bold">
          FinPilot AI
        </h1>

        <p className="text-sm text-slate-400">
          Your Personal Financial Mentor
        </p>
      </nav>

      <main className="mx-auto max-w-6xl px-8 py-10">

        {/* Header */}
        <div className="mb-10">
          <h2 className="text-4xl font-bold">
            My Portfolio 📊
          </h2>

          <p className="mt-2 text-slate-400">
            Track your investments in one simple place.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Holdings
            </p>

            <p className="mt-2 text-3xl font-bold">
              {holdings.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Invested
            </p>

            <p className="mt-2 text-3xl font-bold">
              ₹{totalInvestment.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Current Value
            </p>

            <p className="mt-2 text-3xl font-bold">
              ₹{totalCurrentValue.toLocaleString("en-IN")}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              Overall P/L
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${
                totalProfitLoss >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {totalProfitLoss >= 0 ? "+" : ""}₹
              {totalProfitLoss.toLocaleString("en-IN")}
            </p>

            <p
              className={`mt-1 text-sm ${
                totalReturn >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {totalReturn >= 0 ? "+" : ""}
              {totalReturn.toFixed(2)}%
            </p>

          </div>
        </div>

        {/* Add Investment */}
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="text-xl font-semibold">
            Add Investment
          </h3>

          <div className="mt-5 grid gap-4 md:grid-cols-4">

            <input
              value={symbol}
              onChange={(e) =>
                setSymbol(e.target.value)
              }
              placeholder="Stock symbol"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
            />

            <input
              value={quantity}
              onChange={(e) =>
                setQuantity(e.target.value)
              }
              placeholder="Quantity"
              type="number"
              min="0"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
            />

            <input
              value={averagePrice}
              onChange={(e) =>
                setAveragePrice(e.target.value)
              }
              placeholder="Average price"
              type="number"
              min="0"
              className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
            />

            <button
              onClick={addHolding}
              disabled={adding}
              className="rounded-xl bg-blue-600 px-4 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {adding
                ? "Adding..."
                : "Add Holding"}
            </button>

          </div>
        </div>

        {/* Holdings */}
        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900">

          <div className="border-b border-slate-800 p-6">
            <h3 className="text-xl font-semibold">
              Your Holdings
            </h3>
          </div>

          {loading ? (
            <div className="p-6 text-slate-400">
              Loading holdings...
            </div>
          ) : holdings.length === 0 ? (
            <div className="p-6 text-slate-400">
              No holdings yet.
            </div>
          ) : (
            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>
                  <tr className="border-b border-slate-800 text-left text-sm text-slate-400">

                    <th className="p-6">
                      Stock
                    </th>

                    <th className="p-6">
                      Quantity
                    </th>

                    <th className="p-6">
                      Average Price
                    </th>

                    <th className="p-6">
                      Current Price
                    </th>

                    <th className="p-6">
                      Current Value
                    </th>

                    <th className="p-6">
                      P/L
                    </th>

                  </tr>
                </thead>

                <tbody>

                  {holdings.map((holding) => {

                    const quantity =
                      Number(holding.quantity);

                    const averagePrice =
                      Number(
                        holding.average_price
                      );

                    const marketData =
                      marketPrices[holding.symbol];

                    const currentPrice =
                      marketData?.price;

                    const investment =
                      quantity * averagePrice;

                    const currentValue =
                      currentPrice
                        ? quantity * currentPrice
                        : 0;

                    const profitLoss =
                      currentValue - investment;

                    const returnPercent =
                      investment > 0
                        ? (profitLoss /
                            investment) *
                          100
                        : 0;

                    return (
                      <tr
                        key={holding.id}
                        className="border-b border-slate-800 last:border-0"
                      >

                        <td className="p-6 font-semibold">
                          {holding.symbol}
                        </td>

                        <td className="p-6">
                          {holding.quantity}
                        </td>

                        <td className="p-6">
                          ₹
                          {averagePrice.toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td className="p-6">

                          {currentPrice ? (
                            <>
                              ₹
                              {currentPrice.toLocaleString(
                                "en-IN"
                              )}
                            </>
                          ) : (
                            "Loading..."
                          )}

                        </td>

                        <td className="p-6 font-semibold">
                          ₹
                          {currentValue.toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td
                          className={`p-6 font-semibold ${
                            profitLoss >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >

                          {currentPrice ? (
                            <>
                              {profitLoss >= 0
                                ? "+"
                                : ""}
                              ₹
                              {profitLoss.toLocaleString(
                                "en-IN"
                              )}

                              <span className="ml-2 text-sm">
                                (
                                {returnPercent >= 0
                                  ? "+"
                                  : ""}
                                {returnPercent.toFixed(
                                  2
                                )}
                                %)
                              </span>
                            </>
                          ) : (
                            "Loading..."
                          )}

                        </td>

                      </tr>
                    );
                  })}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* Watchlist */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900">

          <div className="border-b border-slate-800 p-6">

            <h3 className="text-xl font-semibold">
              My Watchlist ⭐
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Keep an eye on stocks you're interested in.
            </p>

          </div>

          {/* Add Watchlist Stock */}
          <div className="border-b border-slate-800 p-6">

            <div className="flex gap-4">

              <input
                value={watchSymbol}
                onChange={(e) =>
                  setWatchSymbol(e.target.value)
                }
                placeholder="Enter stock symbol"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
              />

              <button
                onClick={addToWatchlist}
                disabled={addingToWatchlist}
                className="rounded-xl bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
              >
                {addingToWatchlist
                  ? "Adding..."
                  : "Add to Watchlist"}
              </button>

            </div>

          </div>

          {/* Watchlist Items */}

          {watchlistLoading ? (
            <div className="p-6 text-slate-400">
              Loading watchlist...
            </div>
          ) : watchlist.length === 0 ? (
            <div className="p-6 text-slate-400">
              Your watchlist is empty.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">

              {watchlist.map((item) => {

                const marketData =
                  marketPrices[item.symbol];

                const currentPrice =
                  marketData?.price ?? 0;

                const previousClose =
                  marketData?.previousClose ?? 0;

                const change =
                  currentPrice - previousClose;

                const changePercent =
                  previousClose > 0
                    ? (change / previousClose) * 100
                    : 0;

                return (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-6"
                  >

                    <div>

                      <p className="text-lg font-semibold">
                        {item.symbol}
                      </p>

                      <p className="text-sm text-slate-400">
                        {marketData
                          ? `₹${currentPrice.toLocaleString(
                              "en-IN"
                            )}`
                          : "Loading price..."}
                      </p>

                    </div>

                    <div className="flex items-center gap-6">

                      {marketData && (
                        <div
                          className={`text-right font-semibold ${
                            change >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >

                          <p>
                            {change >= 0
                              ? "+"
                              : ""}
                            ₹
                            {change.toLocaleString(
                              "en-IN"
                            )}
                          </p>

                          <p className="text-sm">
                            {changePercent >= 0
                              ? "+"
                              : ""}
                            {changePercent.toFixed(
                              2
                            )}
                            %
                          </p>

                        </div>
                      )}

                      <button
                        onClick={() =>
                          removeFromWatchlist(
                            item.id
                          )
                        }
                        className="rounded-lg border border-red-500/30 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10"
                      >
                        Remove
                      </button>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </div>

      </main>
    </div>
  );
}

export default App;