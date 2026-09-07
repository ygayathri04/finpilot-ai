import { useEffect, useMemo, useState } from "react";

type NewsEvent = {
  symbol: string;
  companyName: string;
  title: string;
  description: string;
  publishedAt: string;
  attachment: string;
  type: string;
  eventType: string;
  impact: string;
  confidence: string;
  relevanceScore?: number;
  investorExplanation: string;
};

type Holding = {
  id: number | string;
  symbol: string;
};

type WatchlistItem = {
  id: number | string;
  symbol: string;
};

type FilterType =
  | "ALL"
  | "HOLDINGS"
  | "WATCHLIST"
  | "CONTRACT"
  | "EARNINGS"
  | "PARTNERSHIP"
  | "REGULATORY_ACTION"
  | "COMPANY_UPDATE";

const filterLabels: { value: FilterType; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "HOLDINGS", label: "My Holdings" },
  { value: "WATCHLIST", label: "Watchlist" },
  { value: "CONTRACT", label: "Contracts" },
  { value: "EARNINGS", label: "Earnings" },
  { value: "PARTNERSHIP", label: "Partnerships" },
  { value: "REGULATORY_ACTION", label: "Regulatory" },
  { value: "COMPANY_UPDATE", label: "Company Updates" },
];

function eventLabel(type: string) {
  switch (type) {
    case "CONTRACT":
      return "Contract / Order";
    case "EARNINGS":
      return "Earnings";
    case "PARTNERSHIP":
      return "Partnership";
    case "REGULATORY_ACTION":
      return "Regulatory";
    case "ACQUISITION":
      return "Acquisition";
    case "MANAGEMENT_CHANGE":
      return "Management Change";
    case "CORPORATE_ACTION":
      return "Corporate Action";
    case "COMPANY_UPDATE":
      return "Company Update";
    default:
      return "Company News";
  }
}

function eventIcon(type: string) {
  switch (type) {
    case "CONTRACT":
      return "📄";
    case "EARNINGS":
      return "💰";
    case "PARTNERSHIP":
      return "🤝";
    case "REGULATORY_ACTION":
      return "⚖️";
    case "ACQUISITION":
      return "🏢";
    case "MANAGEMENT_CHANGE":
      return "👤";
    case "CORPORATE_ACTION":
      return "📌";
    default:
      return "📰";
  }
}

function impactClasses(impact: string) {
  switch (impact) {
    case "HIGH":
      return "bg-red-500/10 text-red-600 dark:text-red-400";
    case "MEDIUM":
      return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
    default:
      return "bg-slate-500/10 text-slate-600 dark:text-slate-400";
  }
}

function formatDate(value: string) {
  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function shortWhyItMatters(text: string) {
  if (!text) {
    return "This announcement may provide useful context for investors.";
  }

  const cleaned = text.replace(/\s+/g, " ").trim();

  if (cleaned.length <= 180) {
    return cleaned;
  }

  return `${cleaned.slice(0, 177).trim()}...`;
}

export default function News() {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [news, setNews] = useState<NewsEvent[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<FilterType>("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchUserStocks = async () => {
    try {
      const [holdingsResponse, watchlistResponse] = await Promise.all([
        fetch("http://localhost:5001/api/holdings/1"),
        fetch("http://localhost:5001/api/watchlist/1"),
      ]);

      const holdingsData = await holdingsResponse.json();
      const watchlistData = await watchlistResponse.json();

      const safeHoldings = Array.isArray(holdingsData)
        ? holdingsData
        : [];

      const safeWatchlist = Array.isArray(watchlistData)
        ? watchlistData
        : [];

      setHoldings(safeHoldings);
      setWatchlist(safeWatchlist);

      return {
        holdings: safeHoldings,
        watchlist: safeWatchlist,
      };
    } catch (error) {
      console.error("Failed to fetch user stocks:", error);
      throw error;
    }
  };

  const fetchNewsForSymbol = async (
    symbol: string
  ): Promise<NewsEvent[]> => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/intelligence/${symbol}`
      );

      if (!response.ok) {
        return [];
      }

      const data = await response.json();

      return Array.isArray(data.news) ? data.news : [];
    } catch (error) {
      console.error(`Failed to fetch news for ${symbol}:`, error);
      return [];
    }
  };

  const fetchNews = async () => {
    try {
      setLoading(true);
      setError("");

      const userStocks = await fetchUserStocks();

      const symbols = [
        ...userStocks.holdings.map((item: Holding) =>
          item.symbol.toUpperCase()
        ),
        ...userStocks.watchlist.map((item: WatchlistItem) =>
          item.symbol.toUpperCase()
        ),
      ];

      const uniqueSymbols = [...new Set(symbols)];

      if (uniqueSymbols.length === 0) {
        setNews([]);
        return;
      }

      const results = await Promise.all(
        uniqueSymbols.map((symbol) => fetchNewsForSymbol(symbol))
      );

      const combinedNews = results.flat();

      const uniqueNews = Array.from(
        new Map(
          combinedNews.map((item) => [
            `${item.symbol}-${item.publishedAt}-${item.title}`,
            item,
          ])
        ).values()
      );

      uniqueNews.sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime()
      );

      setNews(uniqueNews);
    } catch (error) {
      console.error("Failed to load personalized news:", error);

      setError(
        "Could not load personalized news. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const holdingSymbols = useMemo(
    () =>
      new Set(
        holdings.map((item) => item.symbol.toUpperCase())
      ),
    [holdings]
  );

  const watchlistSymbols = useMemo(
    () =>
      new Set(
        watchlist.map((item) => item.symbol.toUpperCase())
      ),
    [watchlist]
  );

  const filteredNews = useMemo(() => {
    const query = search.trim().toLowerCase();

    return news.filter((item) => {
      const symbol = item.symbol.toUpperCase();

      const matchesSearch =
        !query ||
        symbol.toLowerCase().includes(query) ||
        item.companyName.toLowerCase().includes(query) ||
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }

      switch (filter) {
        case "HOLDINGS":
          return holdingSymbols.has(symbol);

        case "WATCHLIST":
          return watchlistSymbols.has(symbol);

        case "CONTRACT":
        case "EARNINGS":
        case "PARTNERSHIP":
        case "REGULATORY_ACTION":
        case "COMPANY_UPDATE":
          return (
            item.eventType === filter ||
            item.type === filter
          );

        default:
          return true;
      }
    });
  }, [
    news,
    search,
    filter,
    holdingSymbols,
    watchlistSymbols,
  ]);

  const highImpactCount = news.filter(
    (item) => item.impact === "HIGH"
  ).length;

  const contractCount = news.filter(
    (item) => item.eventType === "CONTRACT"
  ).length;

  const earningsCount = news.filter(
    (item) => item.eventType === "EARNINGS"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              FinPilot News
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Personalized News
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
              The company events that matter most to the stocks you follow.
            </p>
          </div>

          <button
            onClick={fetchNews}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 hover:text-blue-600 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            {loading ? "Refreshing..." : "↻ Refresh News"}
          </button>
        </div>

        {/* Summary */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">News items</p>
            <p className="mt-2 text-2xl font-bold">{news.length}</p>
            <p className="mt-1 text-xs text-slate-500">
              From your stocks
            </p>
          </div>

          <div className="rounded-2xl border border-red-500/10 bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-slate-500">High impact</p>
            <p className="mt-2 text-2xl font-bold text-red-500">
              {highImpactCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Worth checking first
            </p>
          </div>

          <div className="rounded-2xl border border-blue-500/10 bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-slate-500">Contracts</p>
            <p className="mt-2 text-2xl font-bold text-blue-500">
              {contractCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Orders and business wins
            </p>
          </div>

          <div className="rounded-2xl border border-emerald-500/10 bg-white p-5 shadow-sm dark:bg-slate-900">
            <p className="text-sm text-slate-500">Earnings</p>
            <p className="mt-2 text-2xl font-bold text-emerald-500">
              {earningsCount}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Financial results
            </p>
          </div>
        </div>

        {/* Filters */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

            <div className="flex flex-wrap gap-2">
              {filterLabels.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setFilter(item.value)}
                  className={`rounded-lg px-3 py-2 text-xs font-semibold transition ${
                    filter === item.value
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search news..."
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-blue-500 lg:w-64 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && news.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="text-5xl">📰</div>

            <h2 className="mt-4 text-xl font-bold">
              No personalized news yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Add stocks to your holdings or watchlist and FinPilot
              will bring their important company events here.
            </p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-52 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-900"
              />
            ))}
          </div>
        )}

        {/* News */}
        {!loading && filteredNews.length > 0 && (
          <section className="mt-8">

            <div className="mb-4">
              <h2 className="text-xl font-bold">
                Latest for you
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {filteredNews.length}{" "}
                {filteredNews.length === 1 ? "event" : "events"}
              </p>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">

              {filteredNews.map((item, index) => {
                const eventId = `${item.symbol}-${item.publishedAt}-${index}`;

                const isExpanded = expandedId === eventId;

                const isHolding = holdingSymbols.has(
                  item.symbol.toUpperCase()
                );

                const isWatchlist =
                  watchlistSymbols.has(
                    item.symbol.toUpperCase()
                  );

                const eventType =
                  item.eventType || item.type;

                return (
                  <article
                    key={eventId}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                  >

                    {/* Top row */}
                    <div className="flex items-start justify-between gap-3">

                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-lg">
                          {eventIcon(eventType)}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-base font-bold">
                              {item.symbol}
                            </span>

                            {isHolding && (
                              <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[9px] font-bold text-blue-500">
                                HOLDING
                              </span>
                            )}

                            {!isHolding && isWatchlist && (
                              <span className="rounded-full bg-purple-500/10 px-2 py-1 text-[9px] font-bold text-purple-500">
                                WATCHLIST
                              </span>
                            )}
                          </div>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.companyName}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                        <span
                          className={`rounded-full px-2 py-1 text-[9px] font-bold ${impactClasses(
                            item.impact
                          )}`}
                        >
                          {item.impact || "LOW"} IMPACT
                        </span>

                        {item.relevanceScore !== undefined && (
                          <span className="rounded-full bg-blue-500/10 px-2 py-1 text-[9px] font-bold text-blue-600 dark:text-blue-400">
                            {item.relevanceScore} RELEVANCE
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Type + date */}
                    <div className="mt-4 flex items-center gap-2">
                      <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {eventLabel(eventType)}
                      </span>

                      <span className="text-xs text-slate-400">
                        {formatDate(item.publishedAt)}
                      </span>
                    </div>

                    {/* Headline */}
                    <h3 className="mt-3 text-base font-bold leading-6">
                      {item.title}
                    </h3>

                    {/* Short investor explanation */}
                    <div className="mt-4 rounded-xl bg-slate-50 p-3.5 dark:bg-slate-950">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🧠</span>

                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                          Why it matters
                        </p>
                      </div>

                      <p className="mt-1.5 text-sm leading-5 text-slate-600 dark:text-slate-400">
                        {shortWhyItMatters(
                          item.investorExplanation
                        )}
                      </p>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-3 rounded-xl border border-slate-200 p-4 dark:border-slate-800">

                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Full context
                        </p>

                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                          {item.description}
                        </p>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">

                          <div>
                            <p className="text-xs text-slate-500">
                              Confidence
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {item.confidence || "Available"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Relevance
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {item.relevanceScore !== undefined
                                ? item.relevanceScore
                                : "Not available"}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs text-slate-500">
                              Published
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {formatDate(item.publishedAt)}
                            </p>
                          </div>

                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">

                      <button
                        onClick={() =>
                          setExpandedId(
                            isExpanded ? null : eventId
                          )
                        }
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300"
                      >
                        {isExpanded
                          ? "Hide details"
                          : "View details"}
                      </button>

                      {item.attachment && (
                        <a
                          href={item.attachment}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700"
                        >
                          NSE filing →
                        </a>
                      )}

                    </div>
                  </article>
                );
              })}

            </div>
          </section>
        )}

        {/* No matches */}
        {!loading &&
          news.length > 0 &&
          filteredNews.length === 0 && (
            <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="text-4xl">🔎</div>

              <h3 className="mt-3 font-semibold">
                No matching news
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Try another filter or search term.
              </p>
            </div>
          )}

      </div>
    </div>
  );
}