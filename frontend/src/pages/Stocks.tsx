import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Holding = {
  id: number | string;
  symbol: string;
  quantity: number;
  averagePrice: number;
};

type StockQuote = {
  symbol: string;
  price: number;
  previousClose: number;
  change?: number;
  changePercent?: number;
};

function formatMoney(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function MiniChart({
  changePercent,
}: {
  changePercent: number;
}) {
  const positive = changePercent >= 0;

  return (
    <div className="mt-5 h-20 w-full overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950">
      <svg
        viewBox="0 0 500 100"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        <polyline
          points={
            positive
              ? "0,72 45,65 90,70 135,52 180,58 225,38 270,45 315,25 360,34 405,18 450,28 500,12"
              : "0,25 45,30 90,22 135,42 180,35 225,55 270,48 315,67 360,58 405,78 450,70 500,88"
          }
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={
            positive
              ? "text-emerald-500"
              : "text-red-500"
          }
        />
      </svg>
    </div>
  );
}

export default function Stocks() {
  const navigate = useNavigate();

  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [quotes, setQuotes] = useState<
    Record<string, StockQuote>
  >({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showAddForm, setShowAddForm] =
    useState(false);

  const [editingId, setEditingId] =
    useState<number | string | null>(null);

  const [formSymbol, setFormSymbol] =
    useState("");

  const [formQuantity, setFormQuantity] =
    useState("");

  const [formPrice, setFormPrice] =
    useState("");

  const [search, setSearch] =
    useState("");

  // --------------------------------
  // Fetch holdings
  // --------------------------------

  const fetchHoldings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5001/api/holdings/1"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load holdings."
        );
      }

      const data = await response.json();

      const loadedHoldings =
        Array.isArray(data)
          ? data
          : Array.isArray(data.holdings)
          ? data.holdings
          : [];

      setHoldings(
        loadedHoldings.map((item: any) => ({
          id: item.id,
          symbol: item.symbol,
          quantity: Number(item.quantity),
          averagePrice: Number(
            item.averagePrice ??
              item.average_price ??
              0
          ),
        }))
      );
    } catch (err) {
      console.error(
        "Failed to load holdings:",
        err
      );

      setError(
        "Could not load your stocks. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // Fetch stock quote
  // --------------------------------

  const fetchQuote = async (
    symbol: string
  ) => {
    try {
      const response = await fetch(
        `http://localhost:5001/api/market/${symbol}`
      );

      if (!response.ok) return;

      const data = await response.json();

      setQuotes((previous) => ({
        ...previous,
        [symbol]: data,
      }));
    } catch (err) {
      console.error(
        `Failed to load quote for ${symbol}:`,
        err
      );
    }
  };

  // --------------------------------
  // Initial load
  // --------------------------------

  useEffect(() => {
    fetchHoldings();
  }, []);

  // --------------------------------
  // Load prices
  // --------------------------------

  useEffect(() => {
    const symbols = [
      ...new Set(
        holdings.map((holding) =>
          holding.symbol.toUpperCase()
        )
      ),
    ];

    symbols.forEach((symbol) => {
      fetchQuote(symbol);
    });
  }, [holdings]);

  // --------------------------------
  // Search
  // --------------------------------

  const filteredHoldings = useMemo(() => {
    const query =
      search.trim().toUpperCase();

    if (!query) {
      return holdings;
    }

    return holdings.filter((holding) =>
      holding.symbol
        .toUpperCase()
        .includes(query)
    );
  }, [holdings, search]);

  // --------------------------------
  // Reset add/edit state
  // --------------------------------

  const resetForm = () => {
    setFormSymbol("");
    setFormQuantity("");
    setFormPrice("");
    setEditingId(null);
    setShowAddForm(false);
  };

  // --------------------------------
  // Add holding
  // --------------------------------

  const handleAdd = async () => {
    const symbol =
      formSymbol.trim().toUpperCase();

    const quantity =
      Number(formQuantity);

    const averagePrice =
      Number(formPrice);

    if (
      !symbol ||
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(averagePrice) ||
      averagePrice <= 0
    ) {
      setError(
        "Please enter a valid stock, quantity and average price."
      );
      return;
    }

    try {
      setError("");

      const response = await fetch(
        "http://localhost:5001/api/holdings",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            portfolio_id: 1,
            symbol,
            quantity,
            average_price: averagePrice,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to add holding."
        );
      }

      resetForm();
      await fetchHoldings();
    } catch (err) {
      console.error(
        "Failed to add holding:",
        err
      );

      setError(
        "Could not add this stock."
      );
    }
  };

  // --------------------------------
  // Start editing
  // --------------------------------

  const startEditing = (
    holding: Holding
  ) => {
    setError("");

    setEditingId(holding.id);

    setFormSymbol(holding.symbol);

    setFormQuantity(
      String(holding.quantity)
    );

    setFormPrice(
      String(holding.averagePrice)
    );

    // IMPORTANT:
    // Do NOT open the top form.
    // The edit form appears inside
    // the selected stock card.
    setShowAddForm(false);
  };

  // --------------------------------
  // Update holding
  // --------------------------------

  const handleUpdate = async () => {
    if (editingId === null) return;

    const quantity =
      Number(formQuantity);

    const averagePrice =
      Number(formPrice);

    if (
      !Number.isFinite(quantity) ||
      quantity <= 0 ||
      !Number.isFinite(averagePrice) ||
      averagePrice <= 0
    ) {
      setError(
        "Please enter a valid quantity and average price."
      );
      return;
    }

    try {
      setError("");

      const response = await fetch(
        `http://localhost:5001/api/holdings/${editingId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity,
            average_price: averagePrice,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to update holding."
        );
      }

      resetForm();

      await fetchHoldings();
    } catch (err) {
      console.error(
        "Failed to update holding:",
        err
      );

      setError(
        "Could not update this holding."
      );
    }
  };

  // --------------------------------
  // Remove holding
  // --------------------------------

  const handleRemove = async (
    id: number | string
  ) => {
    const confirmed =
      window.confirm(
        "Remove this stock from your holdings?"
      );

    if (!confirmed) return;

    try {
      setError("");

      const response = await fetch(
        `http://localhost:5001/api/holdings/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to remove holding."
        );
      }

      if (editingId === id) {
        resetForm();
      }

      await fetchHoldings();
    } catch (err) {
      console.error(
        "Failed to remove holding:",
        err
      );

      setError(
        "Could not remove this holding."
      );
    }
  };

  // --------------------------------
  // Portfolio totals
  // --------------------------------

  const totalInvested =
    holdings.reduce(
      (total, holding) =>
        total +
        holding.quantity *
          holding.averagePrice,
      0
    );

  const totalCurrentValue =
    holdings.reduce(
      (total, holding) => {
        const quote =
          quotes[
            holding.symbol.toUpperCase()
          ];

        const currentPrice =
          quote?.price ??
          holding.averagePrice;

        return (
          total +
          holding.quantity *
            currentPrice
        );
      },
      0
    );

  const totalPnL =
    totalCurrentValue -
    totalInvested;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-7xl">

        {/* =================================
            HEADER
        ================================= */}

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              FinPilot Stocks
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              My Stocks
            </h1>

            <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-400">
              Manage your holdings, update
              quantities and prices, and quickly
              explore each stock.
            </p>
          </div>

          <button
            onClick={() => {
              if (editingId !== null) {
                resetForm();
                return;
              }

              setShowAddForm(
                !showAddForm
              );
            }}
            className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            {showAddForm
              ? "Close"
              : "+ Add Stock"}
          </button>
        </div>

        {/* =================================
            SUMMARY
        ================================= */}

        <div className="mt-8 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">
              Invested
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatMoney(
                totalInvested
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">
              Current value
            </p>

            <p className="mt-2 text-2xl font-bold">
              {formatMoney(
                totalCurrentValue
              )}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm text-slate-500">
              Overall P&L
            </p>

            <p
              className={`mt-2 text-2xl font-bold ${
                totalPnL >= 0
                  ? "text-emerald-500"
                  : "text-red-500"
              }`}
            >
              {totalPnL >= 0 ? "+" : ""}
              {formatMoney(totalPnL)}
            </p>
          </div>

        </div>

        {/* =================================
            ADD STOCK FORM
        ================================= */}

        {showAddForm && (
          <section className="mt-6 rounded-2xl border border-blue-500/20 bg-white p-6 shadow-sm dark:border-blue-500/20 dark:bg-slate-900">

            <p className="text-sm font-semibold uppercase tracking-wider text-blue-500">
              Add Holding
            </p>

            <h2 className="mt-1 text-xl font-bold">
              Add a stock to your portfolio
            </h2>

            <div className="mt-5 grid gap-4 md:grid-cols-3">

              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  NSE Symbol
                </label>

                <input
                  value={formSymbol}
                  onChange={(e) =>
                    setFormSymbol(
                      e.target.value
                    )
                  }
                  placeholder="TCS"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={formQuantity}
                  onChange={(e) =>
                    setFormQuantity(
                      e.target.value
                    )
                  }
                  placeholder="10"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Average buy price
                </label>

                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formPrice}
                  onChange={(e) =>
                    setFormPrice(
                      e.target.value
                    )
                  }
                  placeholder="2150"
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>

            </div>

            <div className="mt-5 flex gap-3">

              <button
                onClick={handleAdd}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Add Stock
              </button>

              <button
                onClick={resetForm}
                className="rounded-xl bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                Cancel
              </button>

            </div>
          </section>
        )}

        {/* =================================
            ERROR
        ================================= */}

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* =================================
            HOLDINGS HEADER + SEARCH
        ================================= */}

        <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>
            <h2 className="text-xl font-bold">
              Your holdings
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              {holdings.length} holding
              {holdings.length === 1
                ? ""
                : "s"} tracked
            </p>
          </div>

          <input
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search your stocks..."
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 sm:w-64 dark:border-slate-700 dark:bg-slate-900"
          />

        </div>

        {/* =================================
            HOLDINGS
        ================================= */}

        {loading ? (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">

            {[1, 2].map((item) => (
              <div
                key={item}
                className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-900"
              />
            ))}

          </div>
        ) : filteredHoldings.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">

            <div className="text-4xl">
              📈
            </div>

            <h3 className="mt-4 text-lg font-semibold">
              No stocks found
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Add a stock to start tracking it
              here.
            </p>

          </div>
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-2">

            {filteredHoldings.map(
              (holding) => {
                const quote =
                  quotes[
                    holding.symbol.toUpperCase()
                  ];

                const currentPrice =
                  quote?.price ??
                  holding.averagePrice;

                const invested =
                  holding.quantity *
                  holding.averagePrice;

                const currentValue =
                  holding.quantity *
                  currentPrice;

                const pnl =
                  currentValue -
                  invested;

                const changePercent =
                  quote?.changePercent ??
                  0;

                const isEditing =
                  editingId === holding.id;

                return (
                  <article
                    key={holding.id}
                    className={`rounded-2xl border bg-white p-6 shadow-sm transition dark:bg-slate-900 ${
                      isEditing
                        ? "border-blue-400 shadow-md"
                        : "border-slate-200 hover:shadow-md dark:border-slate-800"
                    }`}
                  >

                    {/* =========================
                        CARD HEADER
                    ========================= */}

                    <div className="flex items-start justify-between gap-4">

                      <div>
                        <div className="flex items-center gap-3">

                          <h3 className="text-2xl font-bold">
                            {holding.symbol}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              changePercent >= 0
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {formatPercent(
                              changePercent
                            )}
                          </span>

                        </div>

                        <p className="mt-1 text-sm text-slate-500">
                          NSE
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-slate-500">
                          Current price
                        </p>

                        <p className="mt-1 text-xl font-bold">
                          {formatMoney(
                            currentPrice
                          )}
                        </p>
                      </div>

                    </div>

                    {/* =========================
                        MINI CHART
                    ========================= */}

                    <MiniChart
                      changePercent={
                        changePercent
                      }
                    />

                    <p className="mt-2 text-xs text-slate-500">
                      Today's movement
                    </p>

                    {/* =========================
                        INLINE EDIT
                    ========================= */}

                    {isEditing ? (
                      <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">

                        <div className="mb-3">
                          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            Editing{" "}
                            {holding.symbol}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            Update the quantity or
                            average buy price below.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                          <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Quantity
                            </label>

                            <input
                              type="number"
                              min="1"
                              value={formQuantity}
                              onChange={(e) =>
                                setFormQuantity(
                                  e.target.value
                                )
                              }
                              autoFocus
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                              Average buy price
                            </label>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={formPrice}
                              onChange={(e) =>
                                setFormPrice(
                                  e.target.value
                                )
                              }
                              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950"
                            />
                          </div>

                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">

                          <button
                            onClick={
                              handleUpdate
                            }
                            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            Save Changes
                          </button>

                          <button
                            onClick={
                              resetForm
                            }
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                          >
                            Cancel
                          </button>

                        </div>
                      </div>
                    ) : (
                      /* =========================
                         NORMAL STATS
                      ========================= */

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">

                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                          <p className="text-xs text-slate-500">
                            Quantity
                          </p>

                          <p className="mt-1 font-semibold">
                            {holding.quantity}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                          <p className="text-xs text-slate-500">
                            Avg. price
                          </p>

                          <p className="mt-1 font-semibold">
                            {formatMoney(
                              holding.averagePrice
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                          <p className="text-xs text-slate-500">
                            Invested
                          </p>

                          <p className="mt-1 font-semibold">
                            {formatMoney(
                              invested
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                          <p className="text-xs text-slate-500">
                            P&L
                          </p>

                          <p
                            className={`mt-1 font-semibold ${
                              pnl >= 0
                                ? "text-emerald-500"
                                : "text-red-500"
                            }`}
                          >
                            {pnl >= 0
                              ? "+"
                              : ""}
                            {formatMoney(
                              pnl
                            )}
                          </p>
                        </div>

                      </div>
                    )}

                    {/* =========================
                        ACTIONS
                    ========================= */}

                    {!isEditing && (
                      <div className="mt-6 flex flex-wrap gap-2">

                        <button
                          onClick={() =>
                            startEditing(
                              holding
                            )
                          }
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-slate-700 dark:text-slate-300"
                        >
                          ✏️ Edit
                        </button>

                        <button
                          onClick={() =>
                            handleRemove(
                              holding.id
                            )
                          }
                          className="rounded-lg border border-red-500/20 px-3 py-2 text-xs font-semibold text-red-500 hover:bg-red-500/5"
                        >
                          🗑️ Remove
                        </button>

                        <button
                          onClick={() =>
                            navigate(
                              `/intelligence?symbol=${holding.symbol.toUpperCase()}`
                            )
                          }
                          className="ml-auto rounded-lg bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-500 hover:bg-blue-500/20"
                        >
                          🧠 Learn more →
                        </button>

                      </div>
                    )}

                  </article>
                );
              }
            )}

          </div>
        )}

        {/* =================================
            BOTTOM EXPLANATION
        ================================= */}

        <div className="mt-8 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-5">

          <p className="font-semibold text-blue-500">
            💡 Want to understand a stock?
          </p>

          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
            Use{" "}
            <strong>Learn more</strong> on any
            holding to open FinPilot Intelligence
            and investigate its movement, market
            context, sector peers, and recent
            company events.
          </p>

        </div>

      </div>
    </div>
  );
}