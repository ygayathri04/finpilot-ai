import { useEffect, useState } from "react";

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

type RiskStock = {
  symbol: string;
  quantity: number;
  currentPrice: number | null;
  currentValue: number;
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
  stocks: RiskStock[];
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

type IntelligenceEvent = {
  symbol: string;
  companyName: string;
  title: string;
  description: string;
  publishedAt: string;
  attachment: string;
  isin: string;
  type: string;
  impact: string;
  relevanceScore: number;
  confidence: string;
  investorExplanation: string;
};

type StockIntelligence = {
  symbol: string;
  market: MarketData | null;
  priceMovement: {
    currentPrice: number;
    previousClose: number;
    change: number;
    changePercent: number;
    direction: string;
  } | null;
  movementSummary: string;
  aiReasoning?: string | null;
  causeAssessment: string;
  topEvent: IntelligenceEvent | null;
  news: IntelligenceEvent[];
  newsCount: number;

  sectorComparison: {
    symbol: string;
    companyName?: string | null;
    macroSector?: string | null;
    sector: string | null;
    industry?: string | null;
    basicIndustry?: string | null;
    classificationLevel?: string | null;
    classificationValue?: string | null;
    targetChangePercent: number | null;
    sectorAverageChangePercent: number | null;
    differenceFromSector: number | null;
    peers: {
      symbol: string;
      companyName?: string;
      price: number | null;
      previousClose: number | null;
      changePercent: number | null;
      basicIndustry?: string | null;
      industry?: string | null;
      sector?: string | null;
    }[];
    comparison: {
      classification: string;
      difference?: number | null;
      explanation: string;
    };
  } | null;

  marketContext?: {
    index: string;
    data: {
      index: string;
      currentValue: number;
      previousClose: number;
      change: number;
      changePercent: number;
      direction: string;
      timestamp: string;
    };
    comparison: {
      classification: string;
      difference?: number | null;
      explanation: string;
    };
  } | null;
};

function App() {
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

  const [loading, setLoading] = useState(true);

  const [watchlistLoading, setWatchlistLoading] =
    useState(true);

  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [averagePrice, setAveragePrice] =
    useState("");

  const [adding, setAdding] = useState(false);

  const [watchSymbol, setWatchSymbol] =
    useState("");

  const [addingToWatchlist, setAddingToWatchlist] =
    useState(false);

  const [intelligenceSymbol, setIntelligenceSymbol] =
    useState("");

  const [intelligence, setIntelligence] =
    useState<StockIntelligence | null>(null);

  const [intelligenceLoading, setIntelligenceLoading] =
    useState(false);

  // --------------------------------
  // Analytics
  // --------------------------------

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/analytics/1"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch analytics"
        );
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

  // --------------------------------
  // Risk
  // --------------------------------

  const fetchRisk = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/risk/1"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch risk"
        );
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

  // --------------------------------
  // Recommendations
  // --------------------------------

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

  // --------------------------------
  // Holdings
  // --------------------------------

  const fetchHoldings = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/holdings/1"
      );

      const data = await response.json();

      setHoldings(data);
      setLoading(false);
    } catch (error) {
      console.error(
        "Failed to fetch holdings:",
        error
      );

      setLoading(false);
    }
  };

  // --------------------------------
  // Watchlist
  // --------------------------------

  const fetchWatchlist = async () => {
    try {
      const response = await fetch(
        "http://localhost:5001/api/watchlist/1"
      );

      const data = await response.json();

      setWatchlist(data);
      setWatchlistLoading(false);
    } catch (error) {
      console.error(
        "Failed to fetch watchlist:",
        error
      );

      setWatchlistLoading(false);
    }
  };

  // --------------------------------
  // Initial loading
  // --------------------------------

  useEffect(() => {
    fetchAnalytics();
    fetchRisk();
    fetchRecommendations();
    fetchHoldings();
    fetchWatchlist();
  }, []);

  // --------------------------------
  // Market prices
  // --------------------------------

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

      for (const symbol of uniqueSymbols) {
        try {
          const response = await fetch(
            `http://localhost:5001/api/market/${symbol}`
          );

          if (!response.ok) {
            continue;
          }

          const data: MarketData =
            await response.json();

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

    if (
      holdings.length > 0 ||
      watchlist.length > 0
    ) {
      fetchPrices();
    }
  }, [holdings, watchlist]);

  // --------------------------------
  // Add holding
  // --------------------------------

  const addHolding = async () => {
    if (
      !symbol ||
      !quantity ||
      !averagePrice
    ) {
      return;
    }

    setAdding(true);

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
              symbol.toUpperCase(),
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

      const newHolding =
        await response.json();

      setHoldings((current) => [
        ...current,
        newHolding,
      ]);

      setSymbol("");
      setQuantity("");
      setAveragePrice("");

      await fetchAnalytics();
      await fetchRisk();
      await fetchRecommendations();
    } catch (error) {
      console.error(
        "Failed to add holding:",
        error
      );
    } finally {
      setAdding(false);
    }
  };

  // --------------------------------
  // Add watchlist
  // --------------------------------

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
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            user_id: 1,
            symbol:
              watchSymbol.toUpperCase(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to add to watchlist"
        );
      }

      const newStock =
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
    } finally {
      setAddingToWatchlist(false);
    }
  };

  // --------------------------------
  // Remove watchlist
  // --------------------------------

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

  // --------------------------------
  // Stock Intelligence - Day 4
  // --------------------------------

  const fetchIntelligence = async () => {
    if (!intelligenceSymbol.trim()) {
      return;
    }

    setIntelligenceLoading(true);

    try {
      const upperSymbol =
        intelligenceSymbol.trim().toUpperCase();

      const response = await fetch(
        `http://localhost:5001/api/intelligence/${upperSymbol}`
      );

      if (!response.ok) {
        throw new Error(
          "Failed to fetch stock intelligence"
        );
      }

      const data: StockIntelligence =
        await response.json();

      setIntelligence(data);
    } catch (error) {
      console.error(
        "Failed to fetch stock intelligence:",
        error
      );

      setIntelligence(null);
    } finally {
      setIntelligenceLoading(false);
    }
  };

  // --------------------------------
  // Best / Worst performer
  // --------------------------------

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
            Track your investments in one simple
            place.
          </p>

        </div>

        {/* Summary Cards */}

        <div className="mb-8 grid gap-6 md:grid-cols-4">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              Holdings
            </p>

            <p className="mt-2 text-3xl font-bold">
              {analytics?.holdingsCount ?? 0}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              Invested
            </p>

            <p className="mt-2 text-3xl font-bold">
              ₹
              {(
                analytics?.totalInvested ?? 0
              ).toLocaleString("en-IN")}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              Current Value
            </p>

            <p className="mt-2 text-3xl font-bold">
              ₹
              {(
                analytics?.totalCurrentValue ?? 0
              ).toLocaleString("en-IN")}
            </p>

          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

            <p className="text-sm text-slate-400">
              Overall P/L
            </p>

            <p
              className={`mt-2 text-3xl font-bold ${
                (
                  analytics?.totalProfitLoss ??
                  0
                ) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {(
                analytics?.totalProfitLoss ??
                0
              ) >= 0
                ? "+"
                : ""}
              ₹
              {(
                analytics?.totalProfitLoss ??
                0
              ).toLocaleString("en-IN")}
            </p>

            <p
              className={`mt-1 text-sm ${
                (
                  analytics?.returnPercentage ??
                  0
                ) >= 0
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {(
                analytics?.returnPercentage ??
                0
              ) >= 0
                ? "+"
                : ""}
              {(
                analytics?.returnPercentage ??
                0
              ).toFixed(2)}
              %
            </p>

          </div>

        </div>

        {/* Risk Analysis */}

        <div className="mb-8">

          <h3 className="mb-4 text-2xl font-bold">
            Portfolio Risk 🛡️
          </h3>

          <div className="grid gap-6 md:grid-cols-2">

            {/* Risk Level */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <p className="text-sm text-slate-400">
                Risk Level
              </p>

              <p
                className={`mt-3 text-4xl font-bold ${
                  risk?.riskLevel === "HIGH"
                    ? "text-red-400"
                    : risk?.riskLevel ===
                      "MEDIUM"
                    ? "text-yellow-400"
                    : "text-green-400"
                }`}
              >
                {risk?.riskLevel ??
                  "Loading..."}
              </p>

              <p className="mt-3 text-slate-400">
                Based on portfolio
                concentration and
                diversification.
              </p>

            </div>

            {/* Diversification */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <p className="text-sm text-slate-400">
                Diversification
              </p>

              <p className="mt-3 text-4xl font-bold">
                {risk?.diversification ??
                  0}
              </p>

              <p className="mt-3 text-slate-400">
                Different stocks in
                your portfolio.
              </p>

            </div>

          </div>

        </div>

        {/* Stock Concentration */}

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="text-xl font-semibold">
            Stock Concentration
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            How your current portfolio value
            is distributed.
          </p>

          <div className="mt-6 space-y-5">

            {risk?.concentration.map(
              (stock) => (

                <div key={stock.symbol}>

                  <div className="mb-2 flex justify-between">

                    <span className="font-semibold">
                      {stock.symbol}
                    </span>

                    <span className="text-sm text-slate-400">
                      {stock.percentage.toFixed(
                        1
                      )}
                      %
                    </span>

                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                    <div
                      className="h-full rounded-full bg-purple-600"
                      style={{
                        width: `${Math.min(
                          stock.percentage,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                  <p className="mt-1 text-xs text-slate-500">
                    ₹
                    {stock.currentValue.toLocaleString(
                      "en-IN"
                    )}
                  </p>

                </div>
              )
            )}

          </div>

        </div>

        {/* Risk Flags */}

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="text-xl font-semibold">
            Risk Flags ⚠️
          </h3>

          {risk?.riskFlags.length === 0 ? (
            <p className="mt-4 text-green-400">
              No major concentration
              risks detected.
            </p>
          ) : (
            <div className="mt-4 space-y-3">

              {risk?.riskFlags.map(
                (flag, index) => (

                  <div
                    key={index}
                    className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-red-300"
                  >
                    ⚠️ {flag}
                  </div>

                )
              )}

            </div>
          )}

        </div>

        {/* FinPilot Recommendation */}

        <div className="mb-8 rounded-2xl border border-blue-500/20 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <div className="text-3xl">
              🤖
            </div>

            <div>

              <h3 className="text-xl font-semibold">
                FinPilot's Recommendation
              </h3>

              <p className="text-sm text-slate-400">
                Personalized insight based on
                your portfolio.
              </p>

            </div>

          </div>

          {recommendations ? (
            <>

              <div
                className={`mt-6 rounded-xl border p-5 ${
                  recommendations.riskLevel ===
                  "HIGH"
                    ? "border-red-500/30 bg-red-500/5"
                    : recommendations.riskLevel ===
                      "MEDIUM"
                    ? "border-yellow-500/30 bg-yellow-500/5"
                    : "border-green-500/30 bg-green-500/5"
                }`}
              >

                <p className="font-semibold">
                  {recommendations.riskLevel ===
                  "HIGH"
                    ? "⚠️ Attention needed"
                    : recommendations.riskLevel ===
                      "MEDIUM"
                    ? "💡 Something to review"
                    : "✅ Portfolio looks healthy"}
                </p>

                <p className="mt-2 text-slate-300">
                  {recommendations.summary}
                </p>

              </div>

              <div className="mt-4 space-y-4">

                {recommendations.recommendations.map(
                  (recommendation, index) => (

                    <div
                      key={index}
                      className="rounded-xl border border-slate-800 bg-slate-950 p-5"
                    >

                      <p className="font-semibold">
                        {recommendation.title}
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {recommendation.message}
                      </p>

                    </div>

                  )
                )}

              </div>

            </>
          ) : (
            <p className="mt-6 text-slate-400">
              Generating your recommendation...
            </p>
          )}

        </div>

        {/* Performance Overview */}

        <div className="mb-8">

          <h3 className="mb-4 text-2xl font-bold">
            Performance Overview 📈
          </h3>

          <div className="grid gap-6 md:grid-cols-2">

            {/* Best Performer */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <p className="text-sm text-slate-400">
                🏆 Best Performer
              </p>

              {bestPerformer ? (
                <>
                  <p className="mt-3 text-2xl font-bold">
                    {bestPerformer.symbol}
                  </p>

                  <p className="mt-2 text-lg text-green-400">
                    +
                    ₹
                    {(
                      bestPerformer.profitLoss ??
                      0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </p>

                  <p className="text-sm text-green-400">
                    +
                    {(
                      bestPerformer.returnPercentage ??
                      0
                    ).toFixed(2)}
                    %
                  </p>
                </>
              ) : (
                <p className="mt-3 text-slate-400">
                  No performance data
                  available.
                </p>
              )}

            </div>

            {/* Worst Performer */}

            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">

              <p className="text-sm text-slate-400">
                ⚠️ Worst Performer
              </p>

              {worstPerformer ? (
                <>
                  <p className="mt-3 text-2xl font-bold">
                    {worstPerformer.symbol}
                  </p>

                  <p className="mt-2 text-lg text-red-400">
                    {(
                      worstPerformer.profitLoss ??
                      0
                    ) >= 0
                      ? "+"
                      : ""}
                    ₹
                    {(
                      worstPerformer.profitLoss ??
                      0
                    ).toLocaleString(
                      "en-IN"
                    )}
                  </p>

                  <p className="text-sm text-red-400">
                    {(
                      worstPerformer.returnPercentage ??
                      0
                    ) >= 0
                      ? "+"
                      : ""}
                    {(
                      worstPerformer.returnPercentage ??
                      0
                    ).toFixed(2)}
                    %
                  </p>
                </>
              ) : (
                <p className="mt-3 text-slate-400">
                  No performance data
                  available.
                </p>
              )}

            </div>

          </div>

        </div>

        {/* Stock Movement Intelligence - Day 4 */}

        <div className="mb-8 rounded-2xl border border-blue-500/20 bg-slate-900 p-6">

          <div className="flex items-center gap-3">

            <div className="text-3xl">
              🧠
            </div>

            <div>
              <h3 className="text-2xl font-bold">
                Stock Movement Intelligence
              </h3>

              <p className="mt-1 text-sm text-slate-400">
                Find recent company events that may help explain a stock's movement.
              </p>
            </div>

          </div>

          <div className="mt-6 flex gap-4">

            <input
              value={intelligenceSymbol}
              onChange={(e) =>
                setIntelligenceSymbol(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchIntelligence();
                }
              }}
              placeholder="Enter stock symbol e.g. TCS"
              className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
            />

            <button
              onClick={fetchIntelligence}
              disabled={
                intelligenceLoading ||
                !intelligenceSymbol.trim()
              }
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-500 disabled:opacity-50"
            >
              {intelligenceLoading
                ? "Analyzing..."
                : "Analyze Stock"}
            </button>

          </div>

          {intelligenceLoading ? (
            <p className="mt-6 text-slate-400">
              FinPilot is checking market movement and recent company announcements...
            </p>
          ) : intelligence ? (
            <div className="mt-6 space-y-5">

              {/* Price movement */}

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-sm text-slate-400">
                      {intelligence.symbol}
                    </p>

                    <p className="mt-1 text-3xl font-bold">
                      {intelligence.market
                        ? `₹${intelligence.market.price.toLocaleString("en-IN")}`
                        : "Price unavailable"}
                    </p>
                  </div>

                  {intelligence.priceMovement && (
                    <div
                      className={`text-right ${
                        intelligence.priceMovement.direction ===
                        "UP"
                          ? "text-green-400"
                          : intelligence.priceMovement.direction ===
                            "DOWN"
                          ? "text-red-400"
                          : "text-slate-400"
                      }`}
                    >
                      <p className="text-xl font-bold">
                        {intelligence.priceMovement.direction ===
                        "UP"
                          ? "+"
                          : intelligence.priceMovement.direction ===
                            "DOWN"
                          ? "-"
                          : ""}
                        {Math.abs(
                          intelligence.priceMovement.changePercent
                        ).toFixed(2)}
                        %
                      </p>

                      <p className="text-sm">
                        {intelligence.priceMovement.direction}
                      </p>
                    </div>
                  )}

                </div>

                <p className="mt-4 text-slate-300">
                  {intelligence.movementSummary}
                </p>

              </div>

              {/* AI reasoning */}

              {intelligence.aiReasoning && (
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">
                  <p className="font-semibold">
                    🤖 AI Reasoning
                  </p>

                  <p className="mt-2 leading-6 text-slate-300">
                    {intelligence.aiReasoning}
                  </p>
                </div>
              )}

              {/* Cause assessment */}

              <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">

                <p className="font-semibold">
                  🔎 Why might it be moving?
                </p>

                <p className="mt-2 leading-6 text-slate-300">
                  {intelligence.causeAssessment}
                </p>

              </div>

              {/* Top event */}

              {intelligence.topEvent ? (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                  <div className="flex flex-wrap items-center gap-3">

                    <p className="text-lg font-semibold">
                      Most Relevant Recent Event
                    </p>

                    <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs text-blue-300">
                      {intelligence.topEvent.type.replaceAll(
                        "_",
                        " "
                      )}
                    </span>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        intelligence.topEvent.impact === "HIGH"
                          ? "bg-red-500/10 text-red-300"
                          : intelligence.topEvent.impact ===
                            "MEDIUM"
                          ? "bg-yellow-500/10 text-yellow-300"
                          : "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {intelligence.topEvent.impact} IMPACT
                    </span>

                    <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                      {intelligence.topEvent.confidence} CONFIDENCE
                    </span>

                  </div>

                  <p className="mt-4 font-semibold text-white">
                    {intelligence.topEvent.description}
                  </p>

                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {intelligence.topEvent.investorExplanation}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">
                    Announced: {intelligence.topEvent.publishedAt}
                  </p>

                  {intelligence.topEvent.attachment && (
                    <a
                      href={intelligence.topEvent.attachment}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300"
                    >
                      View NSE announcement →
                    </a>
                  )}

                </div>
              ) : (
                <div className="rounded-xl border border-slate-800 bg-slate-950 p-5 text-slate-400">
                  No relevant company event was found in the available announcement data.
                </div>
              )}

              {/* Recent events */}

              <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-lg font-semibold">
                      Recent Company Events
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {intelligence.newsCount} relevant announcements found.
                    </p>
                  </div>

                </div>

                <div className="mt-4 space-y-3">

                  {intelligence.news
                    .slice(0, 6)
                    .map((event, index) => (
                      <div
                        key={`${event.publishedAt}-${index}`}
                        className="rounded-xl border border-slate-800 p-4"
                      >

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-300">
                            {event.type.replaceAll(
                              "_",
                              " "
                            )}
                          </span>

                          <span className="text-xs text-slate-500">
                            {event.publishedAt}
                          </span>

                        </div>

                        <p className="mt-2 text-sm leading-6 text-slate-300">
                          {event.description}
                        </p>

                      </div>
                    ))}

                </div>

              </div>

              {/* Sector Comparison - Day 6 */}

              {intelligence.sectorComparison && (
                <div className="rounded-xl border border-purple-500/20 bg-slate-950 p-5">
                  <div className="flex items-center gap-3">
                    <p className="text-lg font-semibold">
                      📊 Sector Comparison
                    </p>

                    <span className="rounded-full bg-purple-500/10 px-3 py-1 text-xs text-purple-300">
                      {intelligence.sectorComparison.comparison.classification.replaceAll(
                        "_",
                        " "
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-400">
                    {intelligence.sectorComparison.classificationLevel
                      ? `Comparing ${intelligence.symbol} using ${intelligence.sectorComparison.classificationLevel.replaceAll(
                          "_",
                          " "
                        )}: ${
                          intelligence.sectorComparison.classificationValue ||
                          intelligence.sectorComparison.sector ||
                          "N/A"
                        }.`
                      : `Comparing ${intelligence.symbol} with its ${
                          intelligence.sectorComparison.sector || "sector"
                        } peers.`}
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">
                        {intelligence.symbol}
                      </p>

                      <p
                        className={`mt-2 text-2xl font-bold ${
                          (intelligence.sectorComparison.targetChangePercent ?? 0) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {intelligence.sectorComparison.targetChangePercent != null
                          ? `${
                              intelligence.sectorComparison.targetChangePercent >= 0
                                ? "+"
                                : ""
                            }${intelligence.sectorComparison.targetChangePercent.toFixed(2)}%`
                          : "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">
                        Peer Average
                      </p>

                      <p
                        className={`mt-2 text-2xl font-bold ${
                          (intelligence.sectorComparison.sectorAverageChangePercent ?? 0) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {intelligence.sectorComparison.sectorAverageChangePercent != null
                          ? `${
                              intelligence.sectorComparison.sectorAverageChangePercent >= 0
                                ? "+"
                                : ""
                            }${intelligence.sectorComparison.sectorAverageChangePercent.toFixed(2)}%`
                          : "N/A"}
                      </p>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
                      <p className="text-sm text-slate-400">
                        Difference
                      </p>

                      <p
                        className={`mt-2 text-2xl font-bold ${
                          (intelligence.sectorComparison.differenceFromSector ?? 0) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {intelligence.sectorComparison.differenceFromSector != null
                          ? `${
                              intelligence.sectorComparison.differenceFromSector >= 0
                                ? "+"
                                : ""
                            }${intelligence.sectorComparison.differenceFromSector.toFixed(2)}%`
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-slate-800 bg-slate-900 p-4">
                    <p className="font-semibold">
                      {intelligence.sectorComparison.comparison.classification.replaceAll(
                        "_",
                        " "
                      )}
                    </p>

                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      {intelligence.sectorComparison.comparison.explanation}
                    </p>
                  </div>

                  {intelligence.sectorComparison.peers.length > 0 && (
                    <div className="mt-5">
                      <p className="font-semibold">
                        Peer Stocks
                      </p>

                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                        {intelligence.sectorComparison.peers.map((peer) => (
                          <div
                            key={peer.symbol}
                            className={`rounded-xl border p-4 ${
                              peer.symbol === intelligence.symbol
                                ? "border-blue-500/30 bg-blue-500/5"
                                : "border-slate-800 bg-slate-900"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-semibold">
                                  {peer.symbol}
                                </p>

                                <p className="mt-1 text-xs text-slate-500">
                                  {peer.companyName || "Company"}
                                </p>
                              </div>

                              <p
                                className={`font-semibold ${
                                  (peer.changePercent ?? 0) >= 0
                                    ? "text-green-400"
                                    : "text-red-400"
                                }`}
                              >
                                {peer.changePercent != null
                                  ? `${
                                      peer.changePercent >= 0 ? "+" : ""
                                    }${peer.changePercent.toFixed(2)}%`
                                  : "N/A"}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">
              Enter an NSE stock symbol above to see its movement intelligence.
            </p>
          )}

        </div>

        {/* Portfolio Allocation */}

        <div className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-6">

          <h3 className="text-xl font-semibold">
            Portfolio Allocation 📊
          </h3>

          <p className="mt-1 text-sm text-slate-400">
            Distribution of invested capital.
          </p>

          <div className="mt-6 space-y-5">

            {analytics?.holdings.map(
              (holding, index) => {

                const percentage =
                  analytics.totalInvested >
                  0
                    ? (holding.invested /
                        analytics.totalInvested) *
                      100
                    : 0;

                return (
                  <div
                    key={`${holding.symbol}-${index}`}
                  >

                    <div className="mb-2 flex justify-between">

                      <span className="font-semibold">
                        {holding.symbol}
                      </span>

                      <span className="text-sm text-slate-400">
                        {percentage.toFixed(
                          1
                        )}
                        %
                      </span>

                    </div>

                    <div className="h-3 overflow-hidden rounded-full bg-slate-800">

                      <div
                        className="h-full rounded-full bg-blue-600"
                        style={{
                          width: `${percentage}%`,
                        }}
                      />

                    </div>

                    <p className="mt-1 text-xs text-slate-500">
                      ₹
                      {holding.invested.toLocaleString(
                        "en-IN"
                      )}
                    </p>

                  </div>
                );
              }
            )}

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

                  {analytics?.holdings.map(
                    (holding, index) => (

                      <tr
                        key={`${holding.symbol}-${index}`}
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
                          {holding.averagePrice.toLocaleString(
                            "en-IN"
                          )}
                        </td>

                        <td className="p-6">

                          {holding.currentPrice !==
                          null
                            ? `₹${holding.currentPrice.toLocaleString(
                                "en-IN"
                              )}`
                            : "Unavailable"}

                        </td>

                        <td className="p-6 font-semibold">

                          {holding.currentValue !==
                          null
                            ? `₹${holding.currentValue.toLocaleString(
                                "en-IN"
                              )}`
                            : "Unavailable"}

                        </td>

                        <td
                          className={`p-6 font-semibold ${
                            (
                              holding.profitLoss ??
                              0
                            ) >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >

                          {holding.profitLoss !==
                          null ? (
                            <>
                              {holding.profitLoss >=
                              0
                                ? "+"
                                : ""}
                              ₹
                              {holding.profitLoss.toLocaleString(
                                "en-IN"
                              )}

                              <span className="ml-2 text-sm">
                                (
                                {(
                                  holding.returnPercentage ??
                                  0
                                ) >= 0
                                  ? "+"
                                  : ""}
                                {(
                                  holding.returnPercentage ??
                                  0
                                ).toFixed(2)}
                                %)
                              </span>
                            </>
                          ) : (
                            "Unavailable"
                          )}

                        </td>

                      </tr>
                    )
                  )}

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
              Keep an eye on stocks you're
              interested in.
            </p>

          </div>

          <div className="border-b border-slate-800 p-6">

            <div className="flex gap-4">

              <input
                value={watchSymbol}
                onChange={(e) =>
                  setWatchSymbol(
                    e.target.value
                  )
                }
                placeholder="Enter stock symbol"
                className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 outline-none"
              />

              <button
                onClick={addToWatchlist}
                disabled={
                  addingToWatchlist
                }
                className="rounded-xl bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
              >
                {addingToWatchlist
                  ? "Adding..."
                  : "Add to Watchlist"}
              </button>

            </div>

          </div>

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
                  marketData?.previousClose ??
                  0;

                const change =
                  currentPrice -
                  previousClose;

                const changePercent =
                  previousClose > 0
                    ? (change /
                        previousClose) *
                      100
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
                            {changePercent >=
                            0
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