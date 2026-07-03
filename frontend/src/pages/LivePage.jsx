import { useEffect, useState } from "react";

import logo from "../assets/logo.png";

const API_BASE = "https://aquaquizz-backend.onrender.com";
const LOCK_HOUR = 19;

function LivePage() {
  const [ranking, setRanking] = useState([]);
  const [stats, setStats] = useState({
    totalPlayers: 0,
    totalAnswers: 0,
    totalCorrectAnswers: 0,
  });

  const [locked, setLocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadLive();

    const liveInterval = setInterval(loadLive, 3000);
    const timerInterval = setInterval(updateTimeLeft, 1000);

    updateTimeLeft();

    return () => {
      clearInterval(liveInterval);
      clearInterval(timerInterval);
    };
  }, []);

  async function loadLive() {
    try {
      const response = await fetch(`${API_BASE}/api/live`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur live");
        return;
      }

      setRanking(data.ranking || []);
      setStats(data.stats || {});
      setLocked(data.locked);
    } catch (err) {
      setError("Impossible de charger le live");
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

  const podium = ranking.slice(0, 3);
  const others = ranking.slice(3);

  return (
    <div className="live-page">
      <div className="live-header">
        <img src={logo} alt="AQUALAND" className="live-logo" />

        <h1>D-QUIZZ LIVE</h1>

        <div className={locked ? "live-timer final" : "live-timer"}>
          {locked ? "🔒 Classement final" : `⏳ Fin du jeu dans ${timeLeft}`}
        </div>
      </div>

      {error && <div className="live-error">{error}</div>}

      <div className="live-stats">
        <div className="live-stat">
          <strong>{stats.totalPlayers || 0}</strong>
          <span>{plural(stats.totalPlayers || 0, "joueur", "joueurs")}</span>
        </div>

        <div className="live-stat">
          <strong>{stats.totalAnswers || 0}</strong>
          <span>{plural(stats.totalAnswers || 0, "réponse", "réponses")}</span>
        </div>

        <div className="live-stat">
          <strong>{stats.totalCorrectAnswers || 0}</strong>
          <span>
            {plural(
              stats.totalCorrectAnswers || 0,
              "bonne réponse",
              "bonnes réponses"
            )}
          </span>
        </div>
      </div>

      <div className="podium">
        {podium.length === 0 && (
          <div className="empty-live">Aucun joueur pour le moment.</div>
        )}

        {podium.map((player, index) => (
          <div
            className={`podium-card podium-${index + 1}`}
            key={player.email}
          >
            <div className="podium-rank">
              {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
            </div>

            <h2>{player.firstname}</h2>

            <p>
              ✅ {player.correct_answers || 0}{" "}
              {plural(
                player.correct_answers || 0,
                "bonne réponse",
                "bonnes réponses"
              )}
            </p>

            <p>⏱️ {formatTime(player.total_time_ms)}</p>
          </div>
        ))}
      </div>

      {others.length > 0 && (
        <div className="live-ranking">
          {others.map((player, index) => (
            <div className="live-ranking-row" key={player.email}>
              <span>#{index + 4}</span>

              <strong>{player.firstname}</strong>

              <em>
                ✅ {player.correct_answers || 0}{" "}
                {plural(
                  player.correct_answers || 0,
                  "bonne réponse",
                  "bonnes réponses"
                )}
              </em>

              <em>⏱️ {formatTime(player.total_time_ms)}</em>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LivePage;