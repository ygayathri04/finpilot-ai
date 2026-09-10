import { useState } from "react";

function Chatbot() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const sendQuestion = async () => {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || loading) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        role: "user",
        text: trimmedQuestion,
      },
    ]);

    setQuestion("");
    setLoading(true);

    try {
      const response = await fetch(
        "http://localhost:5001/api/ai/chat",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: trimmedQuestion,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to get AI response"
        );
      }

      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text: data.answer,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          text:
            error instanceof Error
              ? error.message
              : "Unable to connect to FinPilot AI.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          Ask FinPilot AI
        </h2>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Ask questions about your stocks and portfolio.
        </p>
      </div>

      <div className="min-h-[300px] space-y-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
        {messages.length === 0 && (
          <div className="flex h-[260px] items-center justify-center text-center text-slate-500 dark:text-slate-400">
            <div>
              <p className="font-medium">
                What would you like to know?
              </p>

              <p className="mt-2 text-sm">
                Try: "How is my portfolio performing?"
              </p>
            </div>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={
              message.role === "user"
                ? "ml-auto max-w-[80%] rounded-2xl bg-slate-900 p-4 text-white"
                : "mr-auto max-w-[80%] rounded-2xl bg-white p-4 text-slate-800 shadow-sm dark:bg-slate-700 dark:text-white"
            }
          >
            <p className="whitespace-pre-wrap text-sm leading-6">
              {message.text}
            </p>
          </div>
        ))}

        {loading && (
          <div className="mr-auto rounded-2xl bg-white p-4 text-sm text-slate-500 shadow-sm dark:bg-slate-700 dark:text-slate-300">
            FinPilot is thinking...
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-3">
        <input
          value={question}
          onChange={(event) =>
            setQuestion(event.target.value)
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              sendQuestion();
            }
          }}
          placeholder="Ask about your stocks or portfolio..."
          className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />

        <button
          onClick={sendQuestion}
          disabled={loading || !question.trim()}
          className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </div>
    </div>
  );
}

export default Chatbot;