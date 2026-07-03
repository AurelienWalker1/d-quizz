import { useEffect, useState } from "react";

import logo from "../assets/logo.png";

const API_BASE = "https://d-quizz.onrender.com";

const days = [
  { key: "monday", label: "Lundi" },
  { key: "tuesday", label: "Mardi" },
  { key: "wednesday", label: "Mercredi" },
  { key: "thursday", label: "Jeudi" },
  { key: "friday", label: "Vendredi" },
  { key: "saturday", label: "Samedi" },
  { key: "sunday", label: "Dimanche" },
];

function AdminPage() {
  const [day, setDay] = useState("monday");
  const [questions, setQuestions] = useState([]);
  const [message, setMessage] = useState("");

  const [adminPassword, setAdminPassword] = useState(
    localStorage.getItem("aquaquizz_admin_password") || ""
  );

  const [isLogged, setIsLogged] = useState(
    !!localStorage.getItem("aquaquizz_admin_password")
  );

  useEffect(() => {
    if (isLogged) {
      loadQuestions();
    }
  }, [day, isLogged]);

  async function loadQuestions() {
    setMessage("");

    const response = await fetch(
      `${API_BASE}/api/admin/questions/${day}`,
      {
        headers: {
          "x-admin-password": adminPassword,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Erreur chargement");
      setIsLogged(false);
      localStorage.removeItem("aquaquizz_admin_password");
      return;
    }

    setQuestions(data.questions || []);
  }

  function login(e) {
    e.preventDefault();

    if (!adminPassword) {
      setMessage("Entre le mot de passe admin");
      return;
    }

    localStorage.setItem(
      "aquaquizz_admin_password",
      adminPassword
    );

    setIsLogged(true);
  }

  function logout() {
    localStorage.removeItem("aquaquizz_admin_password");

    setAdminPassword("");
    setIsLogged(false);
    setQuestions([]);
    setMessage("");
  }

  function updateQuestion(index, field, value) {
    const updated = [...questions];

    updated[index][field] = value;

    setQuestions(updated);
  }

  function updateChoice(index, choiceIndex, value) {
    const updated = [...questions];

    updated[index].choices[choiceIndex] = value;

    setQuestions(updated);
  }

  async function saveQuestions() {
    const response = await fetch(
      `${API_BASE}/api/admin/questions/${day}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify({
          questions,
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      setMessage("✅ Questions sauvegardées");
    } else {
      setMessage(data.error || "❌ Erreur sauvegarde");
    }
  }

  async function exportPlayers() {
    try {
      const response = await fetch(
        `${API_BASE}/api/admin/export-players`,
        {
          headers: {
            "x-admin-password": adminPassword,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        setMessage(data.error || "❌ Erreur export participants");
        return;
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `aquaquizz_participants_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      setMessage("✅ Export participants téléchargé");
    } catch (err) {
      setMessage("❌ Impossible de télécharger l’export");
    }
  }

  async function resetGame() {
    const confirmReset = window.confirm(
      "Voulez-vous vraiment réinitialiser D-QUIZZ ?"
    );

    if (!confirmReset) return;

    const response = await fetch(`${API_BASE}/api/admin/reset`, {
      method: "POST",
      headers: {
        "x-admin-password": adminPassword,
      },
    });

    const data = await response.json();

    if (data.success) {
      setMessage("✅ D-QUIZZ réinitialisé");
    } else {
      setMessage("❌ Erreur reset");
    }
  }

  if (!isLogged) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <img
            src={logo}
            alt="AQUALAND"
            className="app-logo"
          />

          <h1>D-QUIZZ Admin</h1>

          <form onSubmit={login}>
            <input
              type="password"
              placeholder="Mot de passe admin"
              value={adminPassword}
              onChange={(e) =>
                setAdminPassword(e.target.value)
              }
            />

            <button type="submit">Entrer</button>
          </form>

          {message && <p>{message}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-card">
        <img
          src={logo}
          alt="AQUALAND"
          className="app-logo"
        />

        <h1>D-QUIZZ Admin</h1>

        <button
          className="logout-button"
          onClick={logout}
        >
          Déconnexion admin
        </button>

        <button
          className="export-button"
          onClick={exportPlayers}
        >
          📥 Télécharger les participants
        </button>

        <select
          value={day}
          onChange={(e) => setDay(e.target.value)}
        >
          {days.map((d) => (
            <option
              key={d.key}
              value={d.key}
            >
              {d.label}
            </option>
          ))}
        </select>

        {questions.map((q, index) => (
          <div
            className="admin-question"
            key={q.number}
          >
            <h3>Question {q.number}</h3>

            <input
              value={q.question}
              onChange={(e) =>
                updateQuestion(
                  index,
                  "question",
                  e.target.value
                )
              }
              placeholder="Question"
            />

            {q.choices.map((choice, choiceIndex) => (
              <input
                key={choiceIndex}
                value={choice}
                onChange={(e) =>
                  updateChoice(
                    index,
                    choiceIndex,
                    e.target.value
                  )
                }
                placeholder={`Réponse ${choiceIndex + 1}`}
              />
            ))}

            <input
              value={q.correctAnswer}
              onChange={(e) =>
                updateQuestion(
                  index,
                  "correctAnswer",
                  e.target.value
                )
              }
              placeholder="Bonne réponse"
            />
          </div>
        ))}

        <button
          className="reset-button"
          onClick={resetGame}
        >
          🔄 Réinitialiser D-QUIZZ
        </button>

        <button onClick={saveQuestions}>
          Sauvegarder
        </button>

        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default AdminPage;
