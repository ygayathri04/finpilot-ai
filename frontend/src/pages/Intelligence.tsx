import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

type Peer = {
  symbol: string;
  companyName?: string;
  changePercent?: number | null;
};

type NewsEvent = {
  title?: string;
  displayTitle?: string;
  description?: string;
  publishedAt?: string;
  date?: string;
  eventType?: string;
  type?: string;
  readableType?: string;
  impact?: string;
  confidence?: string;
  investorExplanation?: string;
  attachment?: string | null;
  source?: string | null;
  relevanceScore?: number;
};

type StockIntelligence = {
  symbol: string;

  market: {
    symbol: string;
    price: number;
    previousClose: number;
    currency: string;
    exchange: string;
  } | null;

  priceMovement: {
    currentPrice: number;
    previousClose: number;
    change: number;
    changePercent: number;
    direction: string;
  } | null;

  movementSummary?: string;
  causeAssessment?: string;

  marketContext?: {
    data?: {
      currentValue?: number;
      previousClose?: number;
      change?: number;
      changePercent?: number;
      direction?: string;
    };
  };

  marketAnalysis?: {
    available: boolean;
    classification?: string;
    stockChangePercent?: number | null;
    marketChangePercent?: number | null;
    differenceFromMarket?: number | null;
    explanation?: string;
  };

  companyAnalysis?: {
    available: boolean;
    companySignal?: string;
    classification?: string;
    classificationLevel?: string | null;
    classificationValue?: string | null;
    stockChangePercent?: number | null;
    sectorAverageChangePercent?: number | null;
    differenceFromSector?: number | null;
    peerCount?: number;
    peers?: Peer[];
    explanation?: string;
  };

  reasoningAnalysis?: {
    whatHappened?: string;
    marketSignal?: string;
    companySignal?: string;
    newsSignal?: string;
    overallAssessment?: string;
    confidence?: string;
  };

  newsAnalysis?: {
    eventCount?: number;
    summary?: string;
    topEvent?: NewsEvent | null;
    events?: NewsEvent[];
  };

  topEvent?: NewsEvent | null;

  news?: NewsEvent[];
  newsCount?: number;

  sectorComparison?: {
    comparison?: {
      classification?: string;
      explanation?: string;
    };
    classificationLevel?: string;
    classificationValue?: string;
    sector?: string;
    targetChangePercent?: number | null;
    sectorAverageChangePercent?: number | null;
    differenceFromSector?: number | null;
    peers?: Peer[];
  };
};


function getEventDisplayTitle(event?: NewsEvent | null) {
  if (!event) {
    return "No major company event identified";
  }

  if (event.displayTitle) {
    return event.displayTitle;
  }

  const type =
    String(
      event.eventType ||
      event.type ||
      ""
    ).toUpperCase();

  const description =
    String(
      event.description ||
      ""
    ).trim();

  if (
    type === "ACQUISITION"
  ) {
    if (
      description &&
      !/^general updates?$/i.test(description)
    ) {
      return description.length > 90
        ? `${description.slice(0, 87)}...`
        : description;
    }

    return "Acquisition update";
  }

  if (type === "CONTRACT") {
    return "Contract / business win";
  }

  if (type === "PARTNERSHIP") {
    return "Strategic partnership";
  }

  if (type === "EARNINGS") {
    return "Financial results / earnings";
  }

  if (type === "REGULATORY_ACTION") {
    return "Regulatory action";
  }

  if (type === "REGULATORY_DISCLOSURE") {
    return "Regulatory disclosure";
  }

  if (type === "MANAGEMENT_CHANGE") {
    return "Management change";
  }

  if (type === "SHAREHOLDER_EVENT") {
    return "Shareholder event";
  }

  if (type === "CORPORATE_ACTION") {
    return "Corporate action";
  }

  return description || event.title || "Company update";
}

function formatPercent(value?: number | null) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "N/A";
  }

  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatPrice(value?: number | null) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "N/A";
  }

  return value.toFixed(2);
}

function getDirectionLabel(direction?: string) {
  if (!direction) return "Unknown";

  if (direction.toLowerCase() === "up") {
    return "Moving up";
  }

  if (direction.toLowerCase() === "down") {
    return "Moving down";
  }

  return direction;
}

function getBarWidth(value?: number | null, max = 5) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return 0;
  }

  const percentage = (Math.abs(value) / max) * 100;

  return Math.min(Math.max(percentage, 4), 100);
}

function getBarClass(value?: number | null) {
  if (
    value === null ||
    value === undefined ||
    !Number.isFinite(value)
  ) {
    return "bg-slate-500";
  }

  return value >= 0
    ? "bg-emerald-500"
    : "bg-red-500";
}

function badgeClass(value?: string) {
  const text =
    String(value || "").toUpperCase();

  if (
    text.includes("HIGH") ||
    text.includes("DIVERGENCE") ||
    text.includes("SPECIFIC")
  ) {
    return "bg-red-500/10 text-red-400 border-red-500/20";
  }

  if (
    text.includes("MEDIUM") ||
    text.includes("OUTPERFORMING") ||
    text.includes("UNDERPERFORMING")
  ) {
    return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
  }

  if (
    text.includes("ALIGNED") ||
    text.includes("LOW")
  ) {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }

  return "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";
}

function getEventIcon(eventType?: string) {
  const type =
    String(eventType || "").toUpperCase();

  if (type.includes("CONTRACT")) return "📄";
  if (type.includes("ACQUISITION")) return "🤝";
  if (type.includes("PARTNERSHIP")) return "🔗";
  if (type.includes("EARNINGS")) return "💰";
  if (type.includes("REGULATORY")) return "⚠️";
  if (type.includes("MANAGEMENT")) return "👤";

  return "📰";
}

export default function Intelligence() {
  const [searchParams] = useSearchParams();

  const [symbol, setSymbol] = useState(
    searchParams.get("symbol") || ""
  );

  const [intelligence, setIntelligence] =
    useState<StockIntelligence | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] = useState("");

  const fetchIntelligence = useCallback(
    async (requestedSymbol: string) => {
      const upperSymbol =
        requestedSymbol.trim().toUpperCase();

      if (!upperSymbol) return;

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `http://localhost:5001/api/intelligence/${upperSymbol}`
        );

        if (!response.ok) {
          throw new Error(
            "Failed to fetch stock intelligence."
          );
        }

        const data: StockIntelligence =
          await response.json();

        setIntelligence(data);
        setSymbol(upperSymbol);
      } catch (err) {
        console.error(
          "Failed to fetch stock intelligence:",
          err
        );

        setIntelligence(null);

        setError(
          "FinPilot could not load intelligence for this stock. Check the symbol and make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    const querySymbol =
      searchParams.get("symbol");

    if (querySymbol) {
      // The fetch function performs asynchronous state updates after
      // the API request completes.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void fetchIntelligence(querySymbol);
    }
  }, [searchParams, fetchIntelligence]);

  const movement =
    intelligence?.priceMovement;

  const marketAnalysis =
    intelligence?.marketAnalysis;

  const companyAnalysis =
    intelligence?.companyAnalysis;

  const reasoning =
    intelligence?.reasoningAnalysis;

  const newsAnalysis =
    intelligence?.newsAnalysis;

  const topEvent =
    intelligence?.topEvent ||
    newsAnalysis?.topEvent ||
    null;

  const sectorComparison =
    intelligence?.sectorComparison;

  const peers =
    sectorComparison?.peers ||
    companyAnalysis?.peers ||
    [];

  const marketChange =
    marketAnalysis?.marketChangePercent ??
    intelligence?.marketContext?.data
      ?.changePercent;

  const stockChange =
    movement?.changePercent ??
    marketAnalysis?.stockChangePercent;

  const peerAverage =
    sectorComparison?.sectorAverageChangePercent != null
      ? sectorComparison.sectorAverageChangePercent
      : null;

  const peerDifference =
    sectorComparison?.differenceFromSector != null
      ? sectorComparison.differenceFromSector
      : null;

  const confidence =
    reasoning?.confidence || "LOW";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            FinPilot Intelligence
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Why did this stock move?
          </h1>

          <p className="mt-2 max-w-3xl text-slate-600 dark:text-slate-400">
            FinPilot combines price movement, market conditions,
            peer performance, and company events to build an
            evidence-based explanation.
          </p>
        </div>

        {/* Search */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={symbol}
              onChange={(e) =>
                setSymbol(e.target.value)
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  fetchIntelligence(symbol);
                }
              }}
              placeholder="Enter NSE stock symbol e.g. TCS"
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
            />

            <button
              onClick={() => fetchIntelligence(symbol)}
              disabled={
                loading || !symbol.trim()
              }
              className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Analyzing..."
                : "Analyze Stock"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {[
              "TCS",
              "INFY",
              "PNB",
              "RELIANCE",
            ].map((item) => (
              <button
                key={item}
                onClick={() => {
                  setSymbol(item);
                  fetchIntelligence(item);
                }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-400 dark:hover:border-blue-700 dark:hover:text-blue-400"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-6 space-y-5">
            <div className="h-44 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-900" />
            <div className="h-72 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-900" />
            <div className="h-60 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-900" />
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !intelligence &&
          !error && (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="text-5xl">🧠</div>

              <h2 className="mt-4 text-xl font-semibold">
                Enter a stock to begin
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                FinPilot will investigate the stock movement
                using multiple evidence sources.
              </p>
            </div>
          )}

        {/* Main */}
        {!loading && intelligence && (
          <div className="mt-6 space-y-6">

            {/* Stock Hero */}
            <section className="rounded-2xl border border-blue-500/20 bg-white p-6 shadow-sm dark:bg-slate-900">
              <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Stock under analysis
                  </p>

                  <div className="mt-1 flex items-center gap-3">
                    <h2 className="text-3xl font-bold">
                      {intelligence.symbol}
                    </h2>

                    <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-500">
                      NSE
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    {intelligence.market?.exchange ||
                      "National Stock Exchange"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">

                  <div>
                    <p className="text-xs text-slate-500">
                      Current price
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      ₹{formatPrice(
                        movement?.currentPrice
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Previous close
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      ₹{formatPrice(
                        movement?.previousClose
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Day change
                    </p>

                    <p
                      className={`mt-1 text-xl font-bold ${
                        (stockChange || 0) >= 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {formatPercent(stockChange)}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Direction
                    </p>

                    <p className="mt-1 text-xl font-bold">
                      {getDirectionLabel(
                        movement?.direction
                      )}
                    </p>
                  </div>

                </div>
              </div>
            </section>

            {/* WHY DID IT MOVE */}
            <section className="overflow-hidden rounded-2xl border border-purple-500/20 bg-white shadow-sm dark:bg-slate-900">

              <div className="border-b border-slate-200 bg-purple-500/5 p-6 dark:border-slate-800">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">

                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">
                      FinPilot Intelligence
                    </p>

                    <h2 className="mt-1 text-2xl font-bold">
                      Why did {intelligence.symbol} move?
                    </h2>
                  </div>

                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${badgeClass(
                      confidence
                    )}`}
                  >
                    {confidence} CONFIDENCE
                  </span>

                </div>
              </div>

              <div className="p-6">

                <p className="text-lg leading-8 text-slate-700 dark:text-slate-300">
                  {reasoning?.overallAssessment ||
                    intelligence.movementSummary ||
                    intelligence.causeAssessment ||
                    "FinPilot could not form a strong conclusion from the available evidence."}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">

                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Stock
                    </p>

                    <p className="mt-1 text-lg font-bold">
                      {formatPercent(stockChange)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Market
                    </p>

                    <p className="mt-1 text-lg font-bold">
                      {formatPercent(marketChange)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Peer average
                    </p>

                    <p className="mt-1 text-lg font-bold">
                      {peerAverage != null
                        ? formatPercent(peerAverage)
                        : "Unavailable"}
                    </p>
                  </div>

                </div>

                <div className="mt-5 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">

                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-purple-500">
                      📰 Most relevant company event
                    </span>

                    {topEvent?.type && (
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        {String(
                          topEvent.readableType ||
                            topEvent.type
                        ).replaceAll("_", " ")}
                      </span>
                    )}

                    {topEvent?.relevanceScore !== undefined && (
                      <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-xs font-semibold text-blue-500">
                        Relevance {topEvent.relevanceScore}
                      </span>
                    )}
                  </div>

                  <p className="mt-3 font-semibold text-slate-800 dark:text-slate-200">
                    {topEvent?.displayTitle ||
                      topEvent?.title ||
                      "No major company event identified"}
                  </p>

                  {topEvent?.investorExplanation && (
                    <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {topEvent.investorExplanation}
                    </p>
                  )}

                  <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-500">
                    FinPilot identifies relevant evidence, but the event
                    timing alone does not prove that it caused today's
                    stock movement.
                  </p>

                  {topEvent?.attachment && (
                    <a
                      href={topEvent.attachment}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-sm font-semibold text-blue-500 hover:underline"
                    >
                      View NSE filing →
                    </a>
                  )}

                </div>
              </div>
            </section>

            {/* PRICE / MARKET CHART */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-blue-500">
                  Market Context
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  Stock vs Market
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  A quick visual comparison of today's movement.
                </p>
              </div>

              <div className="mt-6 space-y-5">

                {/* Stock */}
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-semibold">
                      {intelligence.symbol}
                    </span>

                    <span
                      className={
                        (stockChange || 0) >= 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    >
                      {formatPercent(stockChange)}
                    </span>
                  </div>

                  <div className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${getBarClass(
                        stockChange
                      )}`}
                      style={{
                        width: `${getBarWidth(
                          stockChange
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Market */}
                <div>
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="font-semibold">
                      NIFTY 50
                    </span>

                    <span
                      className={
                        (marketChange || 0) >= 0
                          ? "text-emerald-500"
                          : "text-red-500"
                      }
                    >
                      {formatPercent(marketChange)}
                    </span>
                  </div>

                  <div className="h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className={`h-full rounded-full ${getBarClass(
                        marketChange
                      )}`}
                      style={{
                        width: `${getBarWidth(
                          marketChange
                        )}%`,
                      }}
                    />
                  </div>
                </div>

              </div>

              <div className="mt-6 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <p className="text-sm font-semibold text-emerald-500">
                  🌍 Market signal
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {marketAnalysis?.explanation ||
                    "There is not enough market data to determine whether the movement is market-wide."}
                </p>
              </div>
            </section>

            {/* SECTOR / PEERS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-orange-500">
                    Sector Intelligence
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Sector / Peer Comparison
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    FinPilot dynamically selects comparable companies.
                  </p>
                </div>

                <span className="rounded-full bg-orange-500/10 px-3 py-1 text-xs font-semibold text-orange-400">
                  {sectorComparison?.classificationValue ||
                    companyAnalysis?.classificationValue ||
                    "Sector unavailable"}
                </span>

              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs text-slate-500">
                    Stock
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {formatPercent(
                      sectorComparison?.targetChangePercent ??
                        companyAnalysis?.stockChangePercent
                    )}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs text-slate-500">
                    Peer average
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {peerAverage == null
                      ? "Unavailable"
                      : formatPercent(peerAverage)}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <p className="text-xs text-slate-500">
                    Difference
                  </p>

                  <p className="mt-1 text-xl font-bold">
                    {peerDifference == null
                      ? "Unavailable"
                      : formatPercent(peerDifference)}
                  </p>
                </div>

              </div>

              {/* Peer chart */}
              {peers.length > 0 && (
                <div className="mt-7">

                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      Peer performance
                    </p>

                    <span className="text-xs text-slate-500">
                      {peers.length} comparable stocks
                    </span>
                  </div>

                  <div className="space-y-4">

                    {peers
                      .slice(0, 8)
                      .map((peer) => {
                        const change =
                          peer.changePercent;

                        return (
                          <div key={peer.symbol}>

                            <div className="mb-1 flex justify-between text-sm">
                              <span className="font-medium">
                                {peer.symbol}
                              </span>

                              <span
                                className={
                                  (change || 0) >= 0
                                    ? "text-emerald-500"
                                    : "text-red-500"
                                }
                              >
                                {formatPercent(change)}
                              </span>
                            </div>

                            <div className="h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                              <div
                                className={`h-full rounded-full ${getBarClass(
                                  change
                                )}`}
                                style={{
                                  width: `${getBarWidth(
                                    change
                                  )}%`,
                                }}
                              />
                            </div>

                            <p className="mt-1 text-xs text-slate-500">
                              {peer.companyName ||
                                "Company name unavailable"}
                            </p>

                          </div>
                        );
                      })}

                  </div>
                </div>
              )}

              {!peers.length && (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-4 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    Peer comparison unavailable
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    FinPilot does not have enough comparable-stock data to make a reliable sector comparison.
                  </p>
                </div>
              )}

              <div className="mt-6 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
                <p className="text-sm font-semibold text-orange-400">
                  🏢 Company signal
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  {companyAnalysis?.explanation ||
                    sectorComparison?.comparison?.explanation ||
                    "There is not enough peer data to determine whether this movement is company-specific."}
                </p>
              </div>

            </section>

            {/* RECENT NEWS */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">

                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-blue-500">
                    Company Events
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Recent News & Agreements
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Recent company announcements that may help
                    explain the movement.
                  </p>
                </div>

                <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                  {intelligence.newsCount ||
                    newsAnalysis?.eventCount ||
                    0}{" "}
                  events
                </span>

              </div>

              <div className="mt-6 space-y-4">

                {(intelligence.news || [])
                  .slice(0, 6)
                  .map((event, index) => (

                    <div
                      key={`${event.publishedAt}-${index}`}
                      className="rounded-xl border border-slate-200 p-5 transition hover:border-blue-300 dark:border-slate-800 dark:hover:border-blue-700"
                    >

                      <div className="flex gap-4">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                          {getEventIcon(
                            event.eventType ||
                              event.type
                          )}
                        </div>

                        <div className="min-w-0 flex-1">

                          <div className="flex flex-wrap items-center gap-2">

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {event.readableType ||
                                event.displayTitle ||
                                String(
                                  event.eventType ||
                                    event.type ||
                                    "OTHER"
                                ).replaceAll(
                                  "_",
                                  " "
                                )}
                            </span>

                            {event.impact && (
                              <span
                                className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClass(
                                  event.impact
                                )}`}
                              >
                                {event.impact}
                              </span>
                            )}

                            <span className="text-xs text-slate-500">
                              {event.publishedAt ||
                                event.date ||
                                "Date unavailable"}
                            </span>

                          </div>

                          <p className="mt-3 text-sm font-medium leading-6 text-slate-800 dark:text-slate-200">
                            {event.displayTitle ||
                              event.title ||
                              "Company announcement"}
                          </p>

                          {event.investorExplanation && (
                            <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                              {event.investorExplanation}
                            </p>
                          )}

                          {event.attachment && (
                            <a
                              href={event.attachment}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 inline-block text-sm font-semibold text-blue-500 hover:underline"
                            >
                              View NSE evidence →
                            </a>
                          )}

                        </div>
                      </div>

                    </div>

                  ))}

                {(!intelligence.news ||
                  intelligence.news.length === 0) && (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
                    <p className="text-sm text-slate-500">
                      No recent company events were found.
                    </p>
                  </div>
                )}

              </div>

            </section>

            {/* EVIDENCE TRAIL */}
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">

              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-purple-500">
                  Explainability
                </p>

                <h2 className="mt-1 text-2xl font-bold">
                  FinPilot Evidence Trail
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  The evidence FinPilot used to understand today's stock movement.
                </p>
              </div>

              <div className="mt-6 grid gap-4 lg:grid-cols-2">

                {/* Company News Evidence */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-5">

                  <div className="flex items-start gap-3">
                    <div className="text-xl">
                      📰
                    </div>

                    <div>
                      <p className="font-semibold text-blue-500">
                        Company news
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Recent company-specific evidence
                      </p>
                    </div>
                  </div>

                  {topEvent ? (
                    <div className="mt-4">

                      <p className="text-sm font-semibold leading-6 text-slate-800 dark:text-slate-200">
                        {getEventDisplayTitle(topEvent)}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2">

                        {topEvent.readableType ||
                          topEvent.eventType ||
                          topEvent.type ? (
                          <span className="rounded-full border border-blue-500/20 bg-white px-2.5 py-1 text-xs font-medium text-blue-600 dark:bg-slate-900 dark:text-blue-400">
                            {String(
                              topEvent.readableType ||
                                topEvent.eventType ||
                                topEvent.type ||
                                "Company News"
                            ).replaceAll("_", " ")}
                          </span>
                        ) : null}

                        {topEvent.impact && (
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            Impact: {topEvent.impact}
                          </span>
                        )}

                        {topEvent.confidence && (
                          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                            Confidence: {topEvent.confidence}
                          </span>
                        )}

                        {topEvent.relevanceScore !== undefined && (
                          <span className="rounded-full border border-purple-500/20 bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-500">
                            Relevance: {topEvent.relevanceScore}
                          </span>
                        )}

                      </div>

                      {topEvent.investorExplanation && (
                        <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                          {topEvent.investorExplanation}
                        </p>
                      )}

                      {topEvent.attachment && (
                        <a
                          href={topEvent.attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-block text-sm font-semibold text-blue-500 hover:underline"
                        >
                          View NSE evidence →
                        </a>
                      )}

                    </div>
                  ) : (
                    <p className="mt-4 text-sm text-slate-500">
                      No relevant company news was found.
                    </p>
                  )}

                </div>

                {/* Market Evidence */}
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">

                  <div className="flex items-start gap-3">
                    <div className="text-xl">
                      🌍
                    </div>

                    <div>
                      <p className="font-semibold text-emerald-500">
                        Market evidence
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Stock performance versus the broader market
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">

                    <div>
                      <p className="text-xs text-slate-500">
                        {intelligence.symbol}
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {formatPercent(stockChange)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        NIFTY 50
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {formatPercent(marketChange)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Difference
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {formatPercent(
                          stockChange !== undefined &&
                          stockChange !== null &&
                          marketChange !== undefined &&
                          marketChange !== null
                            ? stockChange - marketChange
                            : null
                        )}
                      </p>
                    </div>

                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {marketAnalysis?.explanation ||
                      "There is not enough market data to determine the market contribution."}
                  </p>

                </div>

                {/* Peer Evidence */}
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5">

                  <div className="flex items-start gap-3">
                    <div className="text-xl">
                      🏢
                    </div>

                    <div>
                      <p className="font-semibold text-orange-500">
                        Sector / peer evidence
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Stock performance versus comparable companies
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-3">

                    <div>
                      <p className="text-xs text-slate-500">
                        {intelligence.symbol}
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {formatPercent(
                          sectorComparison?.targetChangePercent ??
                            companyAnalysis?.stockChangePercent
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Peer average
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {peerAverage != null
                        ? formatPercent(peerAverage)
                        : "Unavailable"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Difference
                      </p>

                      <p className="mt-1 text-lg font-bold">
                        {peerDifference != null
                        ? formatPercent(peerDifference)
                        : "Unavailable"}
                      </p>
                    </div>

                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {companyAnalysis?.explanation ||
                      sectorComparison?.comparison?.explanation ||
                      "There is not enough peer data to determine whether the movement is company-specific."}
                  </p>

                </div>

                {/* Final Reasoning */}
                <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-5">

                  <div className="flex items-start gap-3">
                    <div className="text-xl">
                      🧠
                    </div>

                    <div>
                      <p className="font-semibold text-purple-500">
                        FinPilot conclusion
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Combined interpretation of the available evidence
                      </p>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
                    {reasoning?.overallAssessment ||
                      intelligence.movementSummary ||
                      "FinPilot could not form a strong conclusion from the available evidence."}
                  </p>

                  <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-3">
                    <p className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                      Important
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                      FinPilot identifies evidence and relationships.
                      Event timing alone does not prove that a particular
                      announcement caused the stock movement.
                    </p>
                  </div>

                </div>

              </div>

            </section>

          </div>
        )}

      </div>
    </div>
  );
}