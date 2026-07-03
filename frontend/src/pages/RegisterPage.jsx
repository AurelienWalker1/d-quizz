import { useState } from "react";

import logo from "../assets/logo.png";

const API_BASE = "https://aquaquizz-backend.onrender.com";

function RegisterPage({ onRegister }) {

  const [firstname, setFirstname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  async function handleSubmit(e) {

    e.preventDefault();

    try {

      const response = await fetch(
        `${API_BASE}/api/players`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            firstname,
            email,
            phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {

        alert(
          data.error ||
          "Erreur inscription"
        );

        return;
      }

      if (data.success) {

        const player = {
          id: data.playerId,
          firstname: data.firstname,
        };

        localStorage.setItem(
          "aquaquizz_player",
          JSON.stringify(player)
        );

        localStorage.setItem(
          "aquaquizz_reset_version",
          String(data.resetVersion || 0)
        );

        onRegister(player);
      }

    } catch (err) {

      alert(
        "Impossible de contacter le serveur"
      );
    }
  }

  return (
    <div className="card">

      <img
        src={logo}
        alt="AQUALAND"
        className="app-logo"
      />

      <h1>D-QUIZZ</h1>

      <p className="subtitle">
        Le quiz officiel Aqualand Cap d'Agde
      </p>

      <form onSubmit={handleSubmit}>

        <input
          type="text"
          placeholder="Prénom"
          value={firstname}
          onChange={(e) =>
            setFirstname(e.target.value)
          }
          required
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          required
        />

        <input
          type="tel"
          placeholder="Téléphone"
          value={phone}
          onChange={(e) =>
            setPhone(e.target.value)
          }
          required
        />

        <button type="submit">
          Commencer le quiz
        </button>

      </form>

      <p className="legal-text">
        En participant à D-QUIZZ, vous acceptez que
        vos données (prénom, email et téléphone)
        soient conservées et utilisées par
        Aqualand Cap d’Agde dans le cadre de
        l’organisation du jeu, des classements
        et des communications liées aux animations
        du parc.
      </p>

    </div>
  );
}

export default RegisterPage;