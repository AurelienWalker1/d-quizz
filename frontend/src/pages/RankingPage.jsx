import { useEffect, useState } from "react";

import logo from "../assets/logo.png";

const API_BASE = "https://aquaquizz-backend.onrender.com";
const LOCK_HOUR = 19;

function RankingPage() {
  const [ranking, setRanking] = useState([]);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    loadRanking();

    const rankingInterval = setInterval(() => {
      loadRanking();
    }, 5000);

    const timerInterval = setInterval(() => {
      updateTimeLeft();
    }, 1000);

    updateTimeLeft();

    return () => {
      clearInterval(rankingInterval);
      clearInterval(timerInterval);
    };
  }, []);

  async function loadRanking() {
    try {
      const response = await fetch(`${API_BASE}/api/ranking`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur classement");
        return;
      }

      setRanking(data.ranking || []);
      setLocked(data.locked);
    } catch (err) {
      setError("Impossible de charger le classement");
    }
  }

  function updateTimeLeft() {
    const now = new Date();
    const lockTime = new Date();

    lockTime.setHours(LOCK_HOUR, 0, 0, 0);

    const diff = lockTime - now;

    if (diff <= 0) {
      setLocked(true);
      setTimeLeft("Classement final");
      return;
    }

    const hours = Math.floor(diff / 1000 / 60 / 60);
    const minutes = Math.floor((diff / 1000 / 60) % 60);
    const seconds = Math.floor((diff / 1000) % 60);

    setTimeLeft(
      `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}`
    );
  }

  function formatTime(ms) {
    if (!ms) return "0.0s";

    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);

    return `${seconds}.${tenths}s`;
  }

  function plural(value, singular, pluralWord) {
    return value <= 1 ? singular : pluralWord;
  }

  return (
    <div className="card ranking-card">
      <img src={logo} alt="AQUALAND" className="app-logo" />

      <h1>D-QUIZZ</h1>

      <h2>{locked ? "Classement final 🏆" : "Classement du jour 🏆"}</h2>

      <div className={locked ? "ranking-timer final" : "ranking-timer"}>
        {locked ? "🔒 Classement final" : `⏳ Temps restant : ${timeLeft}`}
      </div>

      {error && <p>{error}</p>}

      {!error && ranking.length === 0 && <p>Aucun joueur classé pour le moment.</p>}

      {!error && ranking.length > 0 && (
        <div className="ranking-list">
          {ranking.map((player, index) => (
            <div className="ranking-row" key={player.email}>
              <div className="rank">#{index + 1}</div>

              <div className="ranking-info">
                <strong>{player.firstname}</strong>

                <span>
                  ✅ {player.correct_answers || 0}{" "}
                  {plural(
                    player.correct_answers || 0,
                    "bonne réponse",
                    "bonnes réponses"
                  )}
                </span>

                <span>⏱️ {formatTime(player.total_time_ms)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default RankingPage;