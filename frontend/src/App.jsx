import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import "./App.css";

import RegisterPage from "./pages/RegisterPage";
import IntroPage from "./pages/IntroPage";
import ReadyPage from "./pages/ReadyPage";
import QuestionPage from "./pages/QuestionPage";
import RankingPage from "./pages/RankingPage";
import AdminPage from "./pages/AdminPage";
import LivePage from "./pages/LivePage";

const API_BASE = "https://d-quizz.onrender.com";

function App() {
  const [player, setPlayer] = useState(null);
  const [introSeen, setIntroSeen] = useState(false);

  useEffect(() => {
    const savedPlayer = localStorage.getItem("aquaquizz_player");
    const savedIntroSeen = localStorage.getItem("aquaquizz_intro_seen");

    if (savedPlayer) {
      setPlayer(JSON.parse(savedPlayer));
    }

    if (savedIntroSeen === "true") {
      setIntroSeen(true);
    }

    checkResetVersion();

    const interval = setInterval(checkResetVersion, 3000);

    return () => clearInterval(interval);
  }, []);

  async function checkResetVersion() {
    try {
      const response = await fetch(`${API_BASE}/api/state`);
      const data = await response.json();

      if (!response.ok) return;

      const localResetVersion =
        localStorage.getItem("aquaquizz_reset_version");

      if (localResetVersion === null) {
        localStorage.setItem(
          "aquaquizz_reset_version",
          String(data.resetVersion)
        );
        return;
      }

      if (Number(localResetVersion) !== Number(data.resetVersion)) {
        localStorage.removeItem("aquaquizz_player");
        localStorage.removeItem("aquaquizz_intro_seen");

        localStorage.setItem(
          "aquaquizz_reset_version",
          String(data.resetVersion)
        );

        setPlayer(null);
        setIntroSeen(false);
      }
    } catch (err) {
      console.log("Impossible de vérifier le reset");
    }
  }

  function handleRegister(newPlayer) {
    setPlayer(newPlayer);
    setIntroSeen(false);
    localStorage.removeItem("aquaquizz_intro_seen");
  }

  function handleStartQuiz() {
    localStorage.setItem("aquaquizz_intro_seen", "true");
    setIntroSeen(true);
  }

  function protectedPage(page) {
    if (!player) {
      return <RegisterPage onRegister={handleRegister} />;
    }

    if (!introSeen) {
      return (
        <IntroPage
          player={player}
          onStart={handleStartQuiz}
        />
      );
    }

    return page;
  }

  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/question/next" />}
          />

          <Route
            path="/question/next"
            element={protectedPage(<ReadyPage player={player} />)}
          />

          <Route
            path="/question/:number"
            element={protectedPage(<ReadyPage player={player} />)}
          />

          <Route
            path="/question/:number/play"
            element={protectedPage(<QuestionPage player={player} />)}
          />

          <Route path="/ranking" element={<RankingPage />} />

          <Route path="/admin" element={<AdminPage />} />

          <Route path="/live" element={<LivePage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
