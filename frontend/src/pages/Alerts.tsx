import { useEffect, useState } from "react";

type AlertItem = {
  id: number;
  user_id: number;
  symbol: string;
  alert_type: string;
  target_value: number | null;
  is_active: boolean;
  created_at: string;
};

function Alerts() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [symbol, setSymbol] = useState("");
  const [alertType, setAlertType] = useState("price_above");
  const [targetValue, setTargetValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        "http://localhost:5001/api/alerts/1"
      );

      if (!response.ok) {
        throw new Error("Failed to load alerts.");
      }

      const data = await response.json();
      setAlerts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load alerts:", err);
      setError(
        "Could not load alerts. Make sure the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const createAlert = async () => {
    const cleanSymbol = symbol.trim().toUpperCase();
    const value = targetValue.trim();

    if (!cleanSymbol || !value || saving) {
      setError("Enter a stock symbol and target value.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      const response = await fetch(
        "http://localhost:5001/api/alerts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: 1,
            symbol: cleanSymbol,
            alert_type: alertType,
            target_value: Number(value),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create alert.");
      }

      setAlerts((current) => [data, ...current]);
      setSymbol("");
      setTargetValue("");
    } catch (err) {
      console.error("Failed to create alert:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Could not create alert."
      );
    } finally {
      setSaving(false);
    }
  };

  const toggleAlert = async (alert: AlertItem) => {
    try {
      setError("");

      const response = await fetch(
        `http://localhost:5001/api/alerts/${alert.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            is_active: !alert.is_active,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update alert.");
      }

      setAlerts((current) =>
        current.map((item) =>
          item.id === alert.id ? data : item
        )
      );
    } catch (err) {
      console.error("Failed to update alert:", err);
      setError("Could not update this alert.");
    }
  };

  const deleteAlert = async (id: number) => {
    try {
      setError("");

      const response = await fetch(
        `http://localhost:5001/api/alerts/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete alert.");
      }

      setAlerts((current) =>
        current.filter((alert) => alert.id !== id)
      );
    } catch (err) {
      console.error("Failed to delete alert:", err);
      setError("Could not delete this alert.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          FinPilot
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Alerts
        </h1>

        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Create and manage stock price alerts.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-semibold">
            Create Alert
          </h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={symbol}
              onChange={(event) =>
                setSymbol(event.target.value)
              }
              placeholder="NSE symbol"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
            />

            <select
              value={alertType}
              onChange={(event) =>
                setAlertType(event.target.value)
              }
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800"
            >
              <option value="price_above">Price above</option>
              <option value="price_below">Price below</option>
              <option value="change_above">Change above %</option>
              <option value="change_below">Change below %</option>
            </select>

            <input
              type="number"
              value={targetValue}
              onChange={(event) =>
                setTargetValue(event.target.value)
              }
              placeholder="Target value"
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-800"
            />
          </div>

          <button
            onClick={createAlert}
            disabled={saving}
            className="mt-4 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Creating..." : "+ Create Alert"}
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
              Loading alerts...
            </div>
          ) : alerts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
              <div className="text-4xl">🔔</div>

              <h2 className="mt-4 text-lg font-semibold">
                No alerts yet
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Create an alert above to start monitoring a stock.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <article
                  key={alert.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <h2 className="text-xl font-bold">
                      {alert.symbol}
                    </h2>

                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {alert.alert_type.replaceAll("_", " ")}{" "}
                      {alert.target_value !== null
                        ? alert.target_value
                        : ""}
                    </p>

                    <span
                      className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${
                        alert.is_active
                          ? "bg-green-500/10 text-green-600"
                          : "bg-slate-500/10 text-slate-500"
                      }`}
                    >
                      {alert.is_active ? "Active" : "Paused"}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleAlert(alert)}
                      className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      {alert.is_active ? "Pause" : "Activate"}
                    </button>

                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="rounded-lg border border-red-500/20 px-4 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/5"
                    >
                      Delete
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

export default Alerts;
