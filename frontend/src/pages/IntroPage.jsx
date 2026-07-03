import { useNavigate } from "react-router-dom";

import logo from "../assets/logo.png";

function IntroPage({ player, onStart }) {

  const navigate = useNavigate();

  function handleStart() {

    onStart();

    navigate("/question/1");
  }

  return (
    <div className="card">

      <img
        src={logo}
        alt="AQUALAND"
        className="app-logo"
      />

      <h1>D-QUIZZ</h1>

      <h2>
        Bienvenue {player.firstname} !
      </h2>

      <div className="intro-box">

        <p>
          📱 Trouve et Scanne les QR codes D-QUIZZ présents dans le parc
          pour répondre aux questions.
        </p>

        <p>
          ⏱️ Le chrono démarre automatiquement
          dès qu’une question s’affiche.
        </p>

        <p>
          ❌ Tu ne peux répondre qu’une seule
          fois à chaque question.
        </p>

        <p>
          🏆 Le classement récompense le joueur
          avec le plus de bonnes réponses,
          puis le meilleur temps total.
        </p>

        <p>
          🔒 Le jeu se termine automatiquement
          à 19h.
        </p>

      </div>

      <button onClick={handleStart}>
        Commencer le jeu
      </button>

    </div>
  );
}

export default IntroPage;