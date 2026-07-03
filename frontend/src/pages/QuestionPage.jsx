import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import logo from "../assets/logo.png";

const API_BASE = "https://aquaquizz-backend.onrender.com";

function QuestionPage({ player }) {
  const { number } = useParams();
  const navigate = useNavigate();

  const [questionData, setQuestionData] = useState(null);
  const [error, setError] = useState("");
  const [startTime, setStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [result, setResult] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    async function loadQuestion() {
      try {
        const response = await fetch(`${API_BASE}/api/question/${number}`);
        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Erreur question");
          return;
        }

        setQuestionData(data);
        setLocked(data.locked);
        setStartTime(data.locked ? null : Date.now());
        setElapsedTime(0);
        setResult(null);
        setHasAnswered(false);
      } catch (err) {
        setError("Impossible de contacter le backend");
      }
    }

    loadQuestion();
  }, [number]);

  useEffect(() => {
    if (!startTime || hasAnswered || locked) return;

    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 100);

    return () => clearInterval(timer);
  }, [startTime, hasAnswered, locked]);

  function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const tenths = Math.floor((ms % 1000) / 100);

    return `${seconds}.${tenths}s`;
  }

  async function handleAnswer(choice) {
    if (locked) {
      setResult({
        error: "Le jeu est terminé pour aujourd'hui",
      });
      return;
    }

    if (hasAnswered || !questionData || !startTime) return;

    const finalTime = Date.now() - startTime;

    setHasAnswered(true);
    setElapsedTime(finalTime);

    const response = await fetch(`${API_BASE}/api/answers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        playerId: player.id,
        questionNumber: questionData.question.number,
        dayKey: questionData.day,
        answer: choice,
        timeMs: finalTime,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setResult({
        error: data.error || "Erreur enregistrement",
      });
      return;
    }

    setResult(data);
  }

  function goNextQuestion() {
    navigate("/question/next");
  }

  function goRanking() {
    navigate("/ranking");
  }

  if (error) {
    return (
      <div className="card">
        <img src={logo} alt="AQUALAND" className="app-logo" />

        <h1>D-QUIZZ</h1>

        <p>{error}</p>

        <button onClick={goNextQuestion}>Continuer</button>
      </div>
    );
  }

  if (!questionData) {
    return (
      <div className="card">
        <img src={logo} alt="AQUALAND" className="app-logo" />

        <h1>D-QUIZZ</h1>

        <p>Chargement de la question...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <img src={logo} alt="AQUALAND" className="app-logo" />

      <h1>D-QUIZZ</h1>

      <p className="subtitle">Joueur : {player.firstname}</p>

      {locked ? (
        <div className="result bad">
          🔒 Le jeu est terminé pour aujourd'hui.
          <br />
          Le classement est maintenant final.
        </div>
      ) : (
        <div className="chrono">⏱️ {formatTime(elapsedTime)}</div>
      )}

      <h2>Question {questionData.question.number}</h2>

      <p className="question-text">{questionData.question.question}</p>

      <div className="choices">
        {questionData.question.choices.map((choice) => (
          <button
            key={choice}
            onClick={() => handleAnswer(choice)}
            disabled={hasAnswered || locked}
          >
            {choice}
          </button>
        ))}
      </div>

      {result && (
        <div
          className={
            result.error
              ? "result bad"
              : result.isCorrect
              ? "result good"
              : "result bad"
          }
        >
          {result.error ? (
            result.error
          ) : (
            <>
              {result.isCorrect
                ? "✅ Bonne réponse !"
                : "❌ Mauvaise réponse"}
              <br />
              Temps : {formatTime(result.timeMs)}
              <br />
              Bonne réponse : {result.correctAnswer}
            </>
          )}

          <br />
          <br />

          <button onClick={goNextQuestion}>Question suivante</button>

          <button onClick={goRanking}>Voir le classement</button>
        </div>
      )}
    </div>
  );
}

export default QuestionPage;
