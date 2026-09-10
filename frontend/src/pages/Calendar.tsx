import { useEffect, useState } from "react";

type EventItem = {
  id?: string | number;
  symbol?: string;
  title?: string;
  subject?: string;
  description?: string;
  date?: string;
  publishedAt?: string;
  createdAt?: string;
  category?: string;
};

function Calendar() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadEvents = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:5001/api/intelligence/LTM"
        );

        if (!response.ok) {
          throw new Error("Failed to load market events.");
        }

        const data = await response.json();

        const rawEvents = Array.isArray(data?.newsAnalysis?.events)
          ? data.newsAnalysis.events
          : [];

        setEvents(rawEvents);
      } catch (err) {
        console.error("Failed to load calendar:", err);
        setError(
          "Could not load market events. Make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  const getEventTitle = (event: EventItem) =>
    event.title ||
    event.subject ||
    event.description ||
    "Market event";

  const getEventDate = (event: EventItem) =>
    event.date ||
    event.publishedAt ||
    event.createdAt ||
    "";

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-white sm:px-6">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
          FinPilot
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          Market Calendar
        </h1>

        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Explore earnings, company events, announcements, and important
          stock movements.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-500">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            Loading market events...
          </div>
        ) : events.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="text-4xl">📅</div>

            <h2 className="mt-4 text-lg font-semibold">
              No market events available
            </h2>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Calendar events will appear here when FinPilot has event data.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-4">
            {events.map((event, index) => {
              const eventDate = getEventDate(event);

              return (
                <article
                  key={event.id ?? index}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {event.symbol && (
                          <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {event.symbol}
                          </span>
                        )}

                        {event.category && (
                          <span className="rounded-full bg-slate-500/10 px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {event.category}
                          </span>
                        )}
                      </div>

                      <h2 className="mt-3 text-lg font-semibold">
                        {getEventTitle(event)}
                      </h2>

                      {event.description &&
                        event.description !== getEventTitle(event) && (
                          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                            {event.description}
                          </p>
                        )}
                    </div>

                    {eventDate && (
                      <time className="shrink-0 text-sm font-medium text-slate-500 dark:text-slate-400">
                        {new Date(eventDate).toLocaleDateString()}
                      </time>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Calendar;
