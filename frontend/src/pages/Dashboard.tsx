import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type HoldingAnalytics = {
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number | null;
  invested: number;
  currentValue: number | null;
  profitLoss: number | null;
  returnPercentage: number | null;
};

type Analytics = {
  portfolioId: number;
  holdingsCount: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalProfitLoss: number;
  returnPercentage: number;
  holdings: HoldingAnalytics[];
};

type Concentration = {
  symbol: string;
  currentValue: number;
  percentage: number;
};

type RiskData = {
  portfolioId: number;
  riskLevel: string;
  diversification: number;
  totalCurrentValue: number;
  concentration: Concentration[];
  riskFlags: string[];
};

type Recommendation = {
  type: string;
  title: string;
  message: string;
};

type RecommendationData = {
  portfolioId: number;
  riskLevel: string;
  summary: string;
  recommendations: Recommendation[];
};

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

function formatCurrency(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) {
    return "—";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function Dashboard() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] =
    useState<Analytics | null>(null);

  const [risk, setRisk] =
    useState<RiskData | null>(null);

  const [recommendations, setRecommendations] =
    useState<RecommendationData | null>(null);

  const [holdings, setHoldings] =
    useState<Holding[]>([]);

  const [watchlist, setWatchlist] =
    useState<WatchlistItem[]>([]);

  const [marketPrices, setMarketPrices] =
    useState<Record<string, MarketData>>({});

  const [loading, setLoading] =
    useState(true);

  const [symbol, setSymbol] =
    useState("");

  const [quantity, setQuantity] =
    useState("");

  const [averagePrice, setAveragePrice] =
    useState("");

  const [adding, setAdding] =
    useState(false);

  const [watchSymbol, setWatchSymbol] =
    useState("");

  const [addingToWatchlist, setAddingToWatchlist] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/analytics/1"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data: Analytics =
        await response.json();

      setAnalytics(data);
    } catch (error) {
      console.error(
        "Failed to fetch analytics:",
        error
      );
    }
  };

  const fetchRisk = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/risk/1"
      );

      if (!response.ok) {
        throw new Error("Failed to fetch risk");
      }

      const data: RiskData =
        await response.json();

      setRisk(data);
    } catch (error) {
      console.error(
        "Failed to fetch risk:",
        error
      );
    }
  };

  const fetchRecommendations = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/recommendations/1"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch recommendations"
        );
      }

      const data: RecommendationData =
        await response.json();

      setRecommendations(data);
    } catch (error) {
      console.error(
        "Failed to fetch recommendations:",
        error
      );
    }
  };

  const fetchHoldings = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/holdings/1"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch holdings"
        );
      }

      const data: Holding[] =
        await response.json();

      setHoldings(data);
    } catch (error) {
      console.error(
        "Failed to fetch holdings:",
        error
      );
    }
  };

  const fetchWatchlist = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/watchlist/1"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch watchlist"
        );
      }

      const data: WatchlistItem[] =
        await response.json();

      setWatchlist(data);
    } catch (error) {
      console.error(
        "Failed to fetch watchlist:",
        error
      );
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      await Promise.all([
        fetchAnalytics(),
        fetchRisk(),
        fetchRecommendations(),
        fetchHoldings(),
        fetchWatchlist(),
      ]);

      setLoading(false);
    };

    loadDashboard();
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      const prices: Record<
        string,
        MarketData
      > = {};

      const symbols = [
        ...holdings.map(
          (holding) => holding.symbol
        ),
        ...watchlist.map(
          (item) => item.symbol
        ),
      ];

      const uniqueSymbols = [
        ...new Set(symbols),
      ];

      for (const stockSymbol of uniqueSymbols) {
        try {
          const response = await fetch(
            `http://localhost:5001/api/market/${stockSymbol}`
          );

          if (!response.ok) {
            continue;
          }

          const data: MarketData =
            await response.json();

          prices[stockSymbol] = data;
        } catch (error) {
          console.error(
            `Failed to fetch ${stockSymbol}:`,
            error
          );
        }
      }

      setMarketPrices(prices);
    };

    if (
      holdings.length > 0 ||
      watchlist.length > 0
    ) {
      fetchPrices();
    }
  }, [holdings, watchlist]);

  const addHolding = async () => {
    if (
      !symbol.trim() ||
      !quantity ||
      !averagePrice
    ) {
      setErrorMessage(
        "Please fill in all investment fields."
      );
      return;
    }

    setAdding(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "http://localhost:5001/api/holdings",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            portfolio_id: 1,
            symbol:
              symbol.trim().toUpperCase(),
            quantity: Number(quantity),
            average_price:
              Number(averagePrice),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to add holding"
        );
      }

      const newHolding: Holding =
        await response.json();

      setHoldings((current) => [
        ...current,
        newHolding,
      ]);

      setSymbol("");
      setQuantity("");
      setAveragePrice("");

      await Promise.all([
        fetchAnalytics(),
        fetchRisk(),
        fetchRecommendations(),
      ]);
    } catch (error) {
      console.error(
        "Failed to add holding:",
        error
      );

      setErrorMessage(
        "Could not add this holding. Please check the stock symbol and try again."
      );
    } finally {
      setAdding(false);
    }
  };

  const addToWatchlist = async () => {
    if (!watchSymbol.trim()) {
      setErrorMessage(
        "Enter a stock symbol first."
      );
      return;
    }

    setAddingToWatchlist(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "http://localhost:5001/api/watchlist",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            user_id: 1,
            symbol:
              watchSymbol.trim().toUpperCase(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to add to watchlist"
        );
      }

      const newStock: WatchlistItem =
        await response.json();

      setWatchlist((current) => [
        ...current,
        newStock,
      ]);

      setWatchSymbol("");
    } catch (error) {
      console.error(
        "Failed to add to watchlist:",
        error
      );

      setErrorMessage(
        "Could not add this stock to your watchlist."
      );
    } finally {
      setAddingToWatchlist(false);
    }
  };

  const removeFromWatchlist = async (
    id: number
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/watchlist/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to remove stock"
        );
      }

      setWatchlist((current) =>
        current.filter(
          (item) => item.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Failed to remove stock:",
        error
      );
    }
  };

  const validHoldings =
    analytics?.holdings.filter(
      (holding) =>
        holding.currentValue !== null &&
        holding.profitLoss !== null
    ) ?? [];

  const bestPerformer =
    validHoldings.length > 0
      ? [...validHoldings].sort(
          (a, b) =>
            (b.returnPercentage ?? 0) -
            (a.returnPercentage ?? 0)
        )[0]
      : null;

  const worstPerformer =
    validHoldings.length > 0
      ? [...validHoldings].sort(
          (a, b) =>
            (a.returnPercentage ?? 0) -
            (b.returnPercentage ?? 0)
        )[0]
      : null;

  const portfolioReturn =
    analytics?.returnPercentage ?? 0;

  const portfolioPositive =
    portfolioReturn >= 0;

  const riskTone =
    risk?.riskLevel === "HIGH"
      ? "red"
      : risk?.riskLevel === "MEDIUM"
      ? "amber"
      : "green";

  const topHolding =
    risk?.concentration?.length
      ? [...risk.concentration].sort(
          (a, b) =>
            b.percentage - a.percentage
        )[0]
      : null;

  const watchlistPreview =
    useMemo(
      () => watchlist.slice(0, 5),
      [watchlist]
    );

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-slate-50 px-6 py-10 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="animate-pulse space-y-6">
            <div className="h-10 w-64 rounded-xl bg-slate-200 dark:bg-slate-800" />
            <div className="h-5 w-96 rounded-lg bg-slate-200 dark:bg-slate-800" />

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-36 rounded-2xl bg-slate-200 dark:bg-slate-800"
                />
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800 lg:col-span-2" />
              <div className="h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* HERO */}
        <section className="mb-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-300">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                Portfolio Command Center
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Good morning 👋
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400 sm:text-base">
                Here's what is happening with your
                portfolio today. FinPilot keeps your
                money, risk, and stock intelligence in
                one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() =>
                  navigate("/intelligence")
                }
                className="rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500"
              >
                Analyze a Stock
              </button>

              <button
                onClick={() =>
                  navigate("/stocks")
                }
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Explore Stocks
              </button>
            </div>
          </div>
        </section>

        {/* ERROR */}
        {errorMessage && (
          <div className="mb-6 flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            <span>{errorMessage}</span>

            <button
              onClick={() =>
                setErrorMessage("")
              }
              className="font-semibold"
            >
              ×
            </button>
          </div>
        )}

        {/* SUMMARY */}
        <section className="mb-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Portfolio Value
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {formatCurrency(
                    analytics?.totalCurrentValue
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-indigo-50 px-3 py-2 text-lg dark:bg-indigo-500/10">
                ₹
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
              Current market value of your holdings
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Total Invested
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {formatCurrency(
                    analytics?.totalInvested
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-3 py-2 text-lg dark:bg-blue-500/10">
                ↗
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
              Capital currently invested
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Overall P/L
                </p>

                <p
                  className={`mt-3 text-3xl font-bold tracking-tight ${
                    portfolioPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatCurrency(
                    analytics?.totalProfitLoss
                  )}
                </p>
              </div>

              <div
                className={`rounded-xl px-3 py-2 text-lg ${
                  portfolioPositive
                    ? "bg-emerald-50 dark:bg-emerald-500/10"
                    : "bg-red-50 dark:bg-red-500/10"
                }`}
              >
                {portfolioPositive ? "↑" : "↓"}
              </div>
            </div>

            <p
              className={`mt-4 text-xs font-semibold ${
                portfolioPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formatPercent(portfolioReturn)} overall return
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  Holdings
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {analytics?.holdingsCount ?? 0}
                </p>
              </div>

              <div className="rounded-xl bg-violet-50 px-3 py-2 text-lg dark:bg-violet-500/10">
                ◈
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
              Stocks currently in your portfolio
            </p>
          </div>
        </section>

        {/* MAIN GRID */}
        <section className="mb-8 grid gap-6 lg:grid-cols-3">

          {/* PERFORMANCE */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Portfolio performance
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Your investment snapshot
                </h2>
              </div>

              <button
                onClick={() =>
                  navigate("/stocks")
                }
                className="text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400"
              >
                View stocks →
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">

              <div className="rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-500/10">
                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                  Best performer
                </p>

                {bestPerformer ? (
                  <>
                    <div className="mt-4 flex items-end justify-between gap-4">
                      <p className="text-2xl font-bold">
                        {bestPerformer.symbol}
                      </p>

                      <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                        {formatPercent(
                          bestPerformer.returnPercentage
                        )}
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-emerald-700/80 dark:text-emerald-300/70">
                      {formatCurrency(
                        bestPerformer.profitLoss
                      )}{" "}
                      profit
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No performance data yet.
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-red-50 p-5 dark:bg-red-500/10">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Needs attention
                </p>

                {worstPerformer ? (
                  <>
                    <div className="mt-4 flex items-end justify-between gap-4">
                      <p className="text-2xl font-bold">
                        {worstPerformer.symbol}
                      </p>

                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        {formatPercent(
                          worstPerformer.returnPercentage
                        )}
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-red-700/80 dark:text-red-300/70">
                      {formatCurrency(
                        worstPerformer.profitLoss
                      )}{" "}
                      current P/L
                    </p>
                  </>
                ) : (
                  <p className="mt-4 text-sm text-slate-500">
                    No performance data yet.
                  </p>
                )}
              </div>
            </div>

            {/* Simple performance bar */}
            <div className="mt-6 rounded-2xl border border-slate-100 p-5 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Invested vs current value
                </p>

                <span
                  className={`text-sm font-bold ${
                    portfolioPositive
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {formatPercent(
                    analytics?.returnPercentage
                  )}
                </span>
              </div>

              <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all"
                  style={{
                    width: `${Math.min(
                      Math.max(
                        analytics?.totalInvested
                          ? (analytics.totalCurrentValue /
                              analytics.totalInvested) *
                              100
                          : 0,
                        0
                      ),
                      100
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-3 flex justify-between text-xs text-slate-500">
                <span>
                  Invested{" "}
                  {formatCurrency(
                    analytics?.totalInvested
                  )}
                </span>

                <span>
                  Current{" "}
                  {formatCurrency(
                    analytics?.totalCurrentValue
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* RISK */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Portfolio health
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Risk overview
                </h2>
              </div>

              <button
                onClick={() =>
                  navigate("/profile")
                }
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400"
              >
                Details
              </button>
            </div>

            <div
              className={`mt-6 rounded-2xl p-5 ${
                riskTone === "red"
                  ? "bg-red-50 dark:bg-red-500/10"
                  : riskTone === "amber"
                  ? "bg-amber-50 dark:bg-amber-500/10"
                  : "bg-emerald-50 dark:bg-emerald-500/10"
              }`}
            >
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Current risk level
              </p>

              <p
                className={`mt-2 text-3xl font-bold ${
                  riskTone === "red"
                    ? "text-red-600 dark:text-red-400"
                    : riskTone === "amber"
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {risk?.riskLevel ?? "UNKNOWN"}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="text-xs text-slate-500">
                  Diversification
                </p>

                <p className="mt-2 text-xl font-bold">
                  {risk?.diversification ?? 0}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  stocks
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800">
                <p className="text-xs text-slate-500">
                  Top holding
                </p>

                <p className="mt-2 text-xl font-bold">
                  {topHolding?.symbol ?? "—"}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  {topHolding
                    ? `${topHolding.percentage.toFixed(1)}%`
                    : "No data"}
                </p>
              </div>
            </div>

            {risk?.riskFlags?.length ? (
              <div className="mt-5 space-y-2">
                {risk.riskFlags
                  .slice(0, 2)
                  .map((flag, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300"
                    >
                      ⚠️ {flag}
                    </div>
                  ))}
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
                ✓ No major concentration risks detected.
              </div>
            )}
          </div>
        </section>

        {/* FINPILOT INSIGHT */}
        <section className="mb-8 overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-violet-50 shadow-sm dark:border-indigo-500/20 dark:from-indigo-500/10 dark:via-slate-900 dark:to-violet-500/10">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-xl text-white shadow-sm">
                    ✦
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                      FINPILOT INSIGHT
                    </p>

                    <h2 className="text-xl font-bold">
                      Your portfolio mentor
                    </h2>
                  </div>
                </div>

                <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {recommendations?.summary ||
                    "FinPilot is still analyzing your portfolio. Add some holdings to receive personalized insights."}
                </p>
              </div>

              <button
                onClick={() =>
                  navigate("/ai")
                }
                className="shrink-0 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
              >
                Ask FinPilot →
              </button>
            </div>

            {recommendations?.recommendations?.length ? (
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {recommendations.recommendations
                  .slice(0, 2)
                  .map(
                    (
                      recommendation,
                      index
                    ) => (
                      <div
                        key={index}
                        className="rounded-xl border border-white/80 bg-white/70 p-5 backdrop-blur dark:border-slate-700/60 dark:bg-slate-900/60"
                      >
                        <p className="font-semibold">
                          {recommendation.title}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {recommendation.message}
                        </p>
                      </div>
                    )
                  )}
              </div>
            ) : null}
          </div>
        </section>

        {/* HOLDINGS + WATCHLIST */}
        <section className="grid gap-6 lg:grid-cols-5">

          {/* HOLDINGS */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-3">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Your investments
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Holdings
                </h2>
              </div>

              <button
                onClick={() =>
                  navigate("/stocks")
                }
                className="text-sm font-semibold text-indigo-600 dark:text-indigo-400"
              >
                Manage →
              </button>
            </div>

            {holdings.length === 0 ? (
              <div className="p-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl dark:bg-slate-800">
                  +
                </div>

                <p className="mt-4 font-semibold">
                  Your portfolio is empty
                </p>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Add your first investment below.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {analytics?.holdings
                  .slice(0, 6)
                  .map((holding) => {
                    const positive =
                      (holding.profitLoss ?? 0) >= 0;

                    return (
                      <div
                        key={holding.symbol}
                        className="flex items-center justify-between gap-4 p-5 transition hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold dark:bg-slate-800">
                            {holding.symbol.slice(
                              0,
                              2
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold">
                              {holding.symbol}
                            </p>

                            <p className="text-xs text-slate-500">
                              {holding.quantity} shares
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(
                              holding.currentValue
                            )}
                          </p>

                          <p
                            className={`mt-1 text-xs font-semibold ${
                              positive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {formatPercent(
                              holding.returnPercentage
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* WATCHLIST */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
            <div className="border-b border-slate-100 p-6 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                    Market watch
                  </p>

                  <h2 className="mt-1 text-xl font-bold">
                    Watchlist
                  </h2>
                </div>

                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400">
                  {watchlist.length}
                </span>
              </div>

              <div className="mt-5 flex gap-2">
                <input
                  value={watchSymbol}
                  onChange={(event) =>
                    setWatchSymbol(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      addToWatchlist();
                    }
                  }}
                  placeholder="Add NSE symbol"
                  className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
                />

                <button
                  onClick={addToWatchlist}
                  disabled={addingToWatchlist}
                  className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  +
                </button>
              </div>
            </div>

            {watchlistPreview.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Add stocks you're interested in
                  tracking.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {watchlistPreview.map(
                  (item) => {
                    const market =
                      marketPrices[
                        item.symbol
                      ];

                    const change =
                      market &&
                      market.previousClose > 0
                        ? ((market.price -
                            market.previousClose) /
                            market.previousClose) *
                          100
                        : null;

                    const positive =
                      (change ?? 0) >= 0;

                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 p-4"
                      >
                        <button
                          onClick={() =>
                            navigate(
                              `/intelligence?symbol=${item.symbol}`
                            )
                          }
                          className="flex min-w-0 items-center gap-3 text-left"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold dark:bg-slate-800">
                            {item.symbol.slice(
                              0,
                              2
                            )}
                          </div>

                          <div>
                            <p className="font-semibold">
                              {item.symbol}
                            </p>

                            <p className="text-xs text-slate-500">
                              {market
                                ? formatCurrency(
                                    market.price
                                  )
                                : "Loading..."}
                            </p>
                          </div>
                        </button>

                        <div className="flex items-center gap-3">
                          <span
                            className={`text-xs font-bold ${
                              positive
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {formatPercent(
                              change
                            )}
                          </span>

                          <button
                            onClick={() =>
                              removeFromWatchlist(
                                item.id
                              )
                            }
                            className="text-xs font-medium text-slate-400 transition hover:text-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>
        </section>

        {/* ADD INVESTMENT */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                PORTFOLIO ACTION
              </p>

              <h2 className="mt-1 text-xl font-bold">
                Add an investment
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add a stock to your portfolio to
                start tracking its performance.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <input
              value={symbol}
              onChange={(event) =>
                setSymbol(event.target.value)
              }
              placeholder="Stock symbol e.g. TCS"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
            />

            <input
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              placeholder="Quantity"
              type="number"
              min="0"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
            />

            <input
              value={averagePrice}
              onChange={(event) =>
                setAveragePrice(
                  event.target.value
                )
              }
              placeholder="Average price"
              type="number"
              min="0"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-700 dark:bg-slate-950"
            />

            <button
              onClick={addHolding}
              disabled={adding}
              className="rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200"
            >
              {adding
                ? "Adding..."
                : "Add Holding"}
            </button>
          </div>
        </section>

        {/* QUICK NAVIGATION */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button
            onClick={() =>
              navigate("/intelligence")
            }
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-lg dark:bg-indigo-500/10">
              🧠
            </div>

            <p className="mt-4 font-semibold">
              Stock Intelligence
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Understand why a stock is moving.
            </p>

            <p className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Analyze →
            </p>
          </button>

          <button
            onClick={() =>
              navigate("/news")
            }
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-lg dark:bg-blue-500/10">
              📰
            </div>

            <p className="mt-4 font-semibold">
              Market News
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              See important company and market events.
            </p>

            <p className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Explore →
            </p>
          </button>

          <button
            onClick={() =>
              navigate("/compare")
            }
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-lg dark:bg-violet-500/10">
              ⚖️
            </div>

            <p className="mt-4 font-semibold">
              Compare Stocks
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Compare companies, sectors, and performance.
            </p>

            <p className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Compare →
            </p>
          </button>

          <button
            onClick={() =>
              navigate("/simulator")
            }
            className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-indigo-500/30"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-lg dark:bg-amber-500/10">
              🧪
            </div>

            <p className="mt-4 font-semibold">
              What-If Simulator
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
              Explore hypothetical portfolio scenarios.
            </p>

            <p className="mt-3 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              Simulate →
            </p>
          </button>
        </section>

      </main>
    </div>
  );
}

export default Dashboard;