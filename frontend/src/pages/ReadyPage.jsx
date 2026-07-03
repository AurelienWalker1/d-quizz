import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";

const API_BASE = "https://d-quizz.onrender.com";

function ReadyPage({ player }) {
  const navigate = useNavigate();

  const [nextQuestion, setNextQuestion] = useState(null);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!player || !player.id) {
      setError("Joueur introuvable");
      setLoading(false);
      return;
    }

    loadNextQuestion();
  }, [player]);

  async function loadNextQuestion() {
    try {
      setLoading(true);

      const response = await fetch(
        `${API_BASE}/api/next-question/${player.id}`
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Erreur prochaine question");
        setLoading(false);
        return;
      }

      setLocked(data.locked);
      setFinished(data.finished);

      if (!data.finished) {
        setNextQuestion(data.nextNumber);
      }

      setLoading(false);
    } catch (err) {
      setError("Impossible de contacter le backend");
      setLoading(false);
    }
  }

  function handleGo() {
    if (!nextQuestion || locked || finished) return;

    navigate(`/question/${nextQuestion}/play`);
  }

  function goRanking() {
    navigate("/ranking");
  }

  if (loading) {
    return (
      <div className="card">
        <img src={logo} alt="AQUALAND" className="app-logo" />
        <h1>D-QUIZZ</h1>
        <p>Recherche de ta prochaine question...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <img src={logo} alt="AQUALAND" className="app-logo" />
        <h1>D-QUIZZ</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="card">
        <img src={logo} alt="AQUALAND" className="app-logo" />
        <h1>D-QUIZZ</h1>

        <div className="result bad">
          🔒 Le jeu est terminé pour aujourd'hui.
          <br />
          Le classement est maintenant final.
        </div>

        <button onClick={goRanking}>Voir le classement</button>
      </div>
    );
  }

  if (finished) {
    return (
      <div className="card">
        <img src={logo} alt="AQUALAND" className="app-logo" />
        <h1>D-QUIZZ</h1>

        <div className="result good">
          🏆 Bravo, tu as terminé les 20 questions !
        </div>

        <button onClick={goRanking}>Voir le classement</button>
      </div>
    );
  }

  return (
    <div className="card">
      <img src={logo} alt="AQUALAND" className="app-logo" />

      <h1>D-QUIZZ</h1>

      <h2>Question {nextQuestion}</h2>

      <div className="intro-box">
        <p>Es-tu prêt ?</p>

        <p>
          Le chrono démarrera uniquement lorsque tu appuieras sur GO.
        </p>
      </div>

      <button onClick={handleGo}>GO</button>
    </div>
  );
}

export default ReadyPage;
