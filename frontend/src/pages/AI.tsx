import Chatbot from "../components/Chatbot";

function AI() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
        FinPilot AI
      </h1>

      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Ask FinPilot questions about stocks and your portfolio.
      </p>

      <Chatbot />
    </div>
  );
}

export default AI;