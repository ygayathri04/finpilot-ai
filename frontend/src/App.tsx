import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Intelligence from "./pages/Intelligence";
import Stocks from "./pages/Stocks";
import Companies from "./pages/Companies";
import News from "./pages/News";
import Calendar from "./pages/Calendar";
import Compare from "./pages/Compare";
import Simulator from "./pages/Simulator";
import Reports from "./pages/Reports";
import Alerts from "./pages/Alerts";
import AI from "./pages/AI";
import Profile from "./pages/Profile";

import Navbar from "./components/Navbar";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />

      <main>
        <Routes>
          {/* Main dashboard */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* FinPilot features */}
          <Route
            path="/intelligence"
            element={<Intelligence />}
          />

          <Route
            path="/stocks"
            element={<Stocks />}
          />

          <Route
            path="/companies"
            element={<Companies />}
          />

          <Route
            path="/news"
            element={<News />}
          />

          <Route
            path="/calendar"
            element={<Calendar />}
          />

          <Route
            path="/compare"
            element={<Compare />}
          />

          <Route
            path="/simulator"
            element={<Simulator />}
          />

          <Route
            path="/reports"
            element={<Reports />}
          />

          <Route
            path="/alerts"
            element={<Alerts />}
          />

          <Route
            path="/ai"
            element={<AI />}
          />

          <Route
            path="/profile"
            element={<Profile />}
          />

          {/* Unknown URL → Dashboard */}
          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;