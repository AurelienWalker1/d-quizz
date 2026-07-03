const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const path = require("path");

const questions = require("./questions");

const app = express();
const PORT = 5001;
const ADMIN_PASSWORD = "D-quizz2026";
const LOCK_HOUR = 19;

app.use(cors());
app.use(express.json());

function getTodayKey() {
  const days = [
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ];

  return days[new Date().getDay()];
}

function isGameLocked() {
  const now = new Date();
  return now.getHours() >= LOCK_HOUR;
}

function checkAdminPassword(req, res, next) {
  const password = req.headers["x-admin-password"];

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({
      error: "Accès admin refusé",
    });
  }

  next();
}

function escapeCsv(value) {
  if (value === null || value === undefined) return "";

  const stringValue = String(value).replace(/"/g, '""');

  return `"${stringValue}"`;
}

function getResetVersion(callback) {
  db.get(
    "SELECT value FROM app_state WHERE key = 'reset_version'",
    [],
    (err, row) => {
      if (err) {
        callback(err, null);
        return;
      }

      callback(null, row ? Number(row.value) : 0);
    }
  );
}

const db = new sqlite3.Database("./dquizz.sqlite", (err) => {
  if (err) {
    console.error("❌ Erreur SQLite :", err.message);
  } else {
    console.log("✅ Base D-QUIZZ connectée");
  }
});

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstname TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL,
      question_number INTEGER NOT NULL,
      day_key TEXT NOT NULL,
      answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      time_ms INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

      UNIQUE(player_id, question_number, day_key)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS app_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  db.run(`
    INSERT OR IGNORE INTO app_state (key, value)
    VALUES ('reset_version', '0')
  `);
});

app.get("/", (req, res) => {
  getResetVersion((err, resetVersion) => {
    res.json({
      app: "D-QUIZZ",
      status: "Backend actif",
      locked: isGameLocked(),
      lockHour: LOCK_HOUR,
      resetVersion: resetVersion || 0,
    });
  });
});

app.get("/api/state", (req, res) => {
  getResetVersion((err, resetVersion) => {
    if (err) {
      return res.status(500).json({
        error: "Erreur état application",
      });
    }

    res.json({
      resetVersion,
      locked: isGameLocked(),
      lockHour: LOCK_HOUR,
    });
  });
});

app.get("/api/next-question/:playerId", (req, res) => {
  const playerId = Number(req.params.playerId);
  const todayKey = getTodayKey();
  const todayQuestions = questions[todayKey] || [];

  if (!playerId) {
    return res.status(400).json({
      error: "Joueur manquant",
    });
  }

  db.all(
    `
    SELECT question_number
    FROM answers
    WHERE player_id = ?
    AND day_key = ?
    `,
    [playerId, todayKey],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          error: "Erreur recherche prochaine question",
        });
      }

      const answeredNumbers = rows.map((row) => row.question_number);

      const nextQuestion = todayQuestions.find(
        (question) => !answeredNumbers.includes(question.number)
      );

      if (!nextQuestion) {
        return res.json({
          finished: true,
          day: todayKey,
          locked: isGameLocked(),
          lockHour: LOCK_HOUR,
          totalQuestions: todayQuestions.length,
          answeredCount: answeredNumbers.length,
        });
      }

      res.json({
        finished: false,
        day: todayKey,
        nextNumber: nextQuestion.number,
        locked: isGameLocked(),
        lockHour: LOCK_HOUR,
        totalQuestions: todayQuestions.length,
        answeredCount: answeredNumbers.length,
      });
    }
  );
});

app.get("/api/question/:number", (req, res) => {
  const number = parseInt(req.params.number);

  const todayKey = getTodayKey();
  const todayQuestions = questions[todayKey];

  if (!todayQuestions) {
    return res.status(404).json({
      error: "Aucune série aujourd'hui",
    });
  }

  const question = todayQuestions.find((q) => q.number === number);

  if (!question) {
    return res.status(404).json({
      error: "Question introuvable",
    });
  }

  getResetVersion((err, resetVersion) => {
    res.json({
      day: todayKey,
      question,
      locked: isGameLocked(),
      lockHour: LOCK_HOUR,
      resetVersion: resetVersion || 0,
    });
  });
});

app.post("/api/players", (req, res) => {
  const { firstname, email, phone } = req.body;

  if (!firstname || !email || !phone) {
    return res.status(400).json({
      error: "Informations manquantes",
    });
  }

  db.run(
    `
    INSERT INTO players (firstname, email, phone)
    VALUES (?, ?, ?)
    `,
    [firstname, email, phone],
    function (err) {
      if (err) {
        return res.status(500).json({
          error: "Erreur création joueur",
        });
      }

      getResetVersion((stateErr, resetVersion) => {
        res.json({
          success: true,
          playerId: this.lastID,
          firstname,
          resetVersion: resetVersion || 0,
        });
      });
    }
  );
});

app.post("/api/answers", (req, res) => {
  if (isGameLocked()) {
    return res.status(403).json({
      error: "Le jeu est terminé pour aujourd'hui",
      locked: true,
      lockHour: LOCK_HOUR,
    });
  }

  const { playerId, questionNumber, dayKey, answer, timeMs } = req.body;

  if (
    !playerId ||
    !questionNumber ||
    !dayKey ||
    !answer ||
    timeMs === undefined
  ) {
    return res.status(400).json({
      error: "Données manquantes",
    });
  }

  const todayQuestions = questions[dayKey];

  if (!todayQuestions) {
    return res.status(404).json({
      error: "Série introuvable",
    });
  }

  const question = todayQuestions.find(
    (q) => q.number === Number(questionNumber)
  );

  if (!question) {
    return res.status(404).json({
      error: "Question introuvable",
    });
  }

  const isCorrect = answer === question.correctAnswer ? 1 : 0;

  db.run(
    `
    INSERT INTO answers (
      player_id,
      question_number,
      day_key,
      answer,
      is_correct,
      time_ms
    )
    VALUES (?, ?, ?, ?, ?, ?)
    `,
    [playerId, questionNumber, dayKey, answer, isCorrect, timeMs],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.status(400).json({
            error: "Question déjà répondue",
          });
        }

        return res.status(500).json({
          error: "Erreur enregistrement réponse",
        });
      }

      res.json({
        success: true,
        isCorrect,
        correctAnswer: question.correctAnswer,
        timeMs,
      });
    }
  );
});

app.get("/api/ranking", (req, res) => {
  const todayKey = getTodayKey();

  db.all(
    `
    SELECT 
      players.firstname,
      players.email,
      COUNT(answers.id) AS total_answers,
      SUM(answers.is_correct) AS correct_answers,
      SUM(answers.time_ms) AS total_time_ms
    FROM answers
    JOIN players ON players.id = answers.player_id
    WHERE answers.day_key = ?
    GROUP BY players.id
    ORDER BY correct_answers DESC, total_time_ms ASC
    LIMIT 10
    `,
    [todayKey],
    (err, rows) => {
      if (err) {
        return res.status(500).json({
          error: "Erreur classement",
        });
      }

      res.json({
        day: todayKey,
        locked: isGameLocked(),
        lockHour: LOCK_HOUR,
        ranking: rows,
      });
    }
  );
});

app.get("/api/live", (req, res) => {
  const todayKey = getTodayKey();

  const rankingQuery = `
    SELECT 
      players.firstname,
      players.email,
      COUNT(answers.id) AS total_answers,
      SUM(answers.is_correct) AS correct_answers,
      SUM(answers.time_ms) AS total_time_ms
    FROM answers
    JOIN players ON players.id = answers.player_id
    WHERE answers.day_key = ?
    GROUP BY players.id
    ORDER BY correct_answers DESC, total_time_ms ASC
    LIMIT 10
  `;

  const statsQuery = `
    SELECT
      COUNT(DISTINCT players.id) AS total_players,
      COUNT(answers.id) AS total_answers,
      SUM(answers.is_correct) AS total_correct_answers
    FROM players
    LEFT JOIN answers ON answers.player_id = players.id
    AND answers.day_key = ?
  `;

  db.all(rankingQuery, [todayKey], (rankingErr, rankingRows) => {
    if (rankingErr) {
      return res.status(500).json({
        error: "Erreur classement live",
      });
    }

    db.get(statsQuery, [todayKey], (statsErr, stats) => {
      if (statsErr) {
        return res.status(500).json({
          error: "Erreur statistiques live",
        });
      }

      res.json({
        day: todayKey,
        locked: isGameLocked(),
        lockHour: LOCK_HOUR,

        stats: {
          totalPlayers: stats.total_players || 0,
          totalAnswers: stats.total_answers || 0,
          totalCorrectAnswers: stats.total_correct_answers || 0,
        },

        ranking: rankingRows,
      });
    });
  });
});

app.get(
  "/api/admin/questions/:day",
  checkAdminPassword,
  (req, res) => {
    const { day } = req.params;

    if (!questions[day]) {
      return res.status(404).json({
        error: "Jour introuvable",
      });
    }

    res.json({
      day,
      questions: questions[day],
    });
  }
);

app.put(
  "/api/admin/questions/:day",
  checkAdminPassword,
  (req, res) => {
    const { day } = req.params;
    const { questions: newQuestions } = req.body;

    const allowedDays = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    if (!allowedDays.includes(day)) {
      return res.status(400).json({
        error: "Jour invalide",
      });
    }

    const filePath = path.join(__dirname, "questions", `${day}.js`);

    const fileContent = `module.exports = ${JSON.stringify(
      newQuestions,
      null,
      2
    )};\n`;

    fs.writeFile(filePath, fileContent, "utf8", (err) => {
      if (err) {
        return res.status(500).json({
          error: "Erreur sauvegarde fichier",
        });
      }

      delete require.cache[require.resolve(`./questions/${day}`)];

      questions[day] = require(`./questions/${day}`);

      res.json({
        success: true,
      });
    });
  }
);

app.get(
  "/api/admin/export-players",
  checkAdminPassword,
  (req, res) => {
    db.all(
      `
      SELECT
        players.firstname,
        players.email,
        players.phone,
        players.created_at,
        COUNT(answers.id) AS total_answers,
        SUM(answers.is_correct) AS correct_answers,
        SUM(answers.time_ms) AS total_time_ms
      FROM players
      LEFT JOIN answers ON answers.player_id = players.id
      GROUP BY players.id
      ORDER BY players.created_at DESC
      `,
      [],
      (err, rows) => {
        if (err) {
          return res.status(500).json({
            error: "Erreur export participants",
          });
        }

        const headers = [
          "Prénom",
          "Email",
          "Téléphone",
          "Date inscription",
          "Réponses données",
          "Bonnes réponses",
          "Temps total ms",
        ];

        const csvRows = rows.map((row) => [
          escapeCsv(row.firstname),
          escapeCsv(row.email),
          escapeCsv(row.phone),
          escapeCsv(row.created_at),
          escapeCsv(row.total_answers || 0),
          escapeCsv(row.correct_answers || 0),
          escapeCsv(row.total_time_ms || 0),
        ]);

        const csvContent = [
          headers.map(escapeCsv).join(";"),
          ...csvRows.map((row) => row.join(";")),
        ].join("\n");

        const filename = `aquaquizz_participants_${new Date()
          .toISOString()
          .slice(0, 10)}.csv`;

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${filename}"`
        );

        res.send("\uFEFF" + csvContent);
      }
    );
  }
);

app.post(
  "/api/admin/reset",
  checkAdminPassword,
  (req, res) => {
    db.serialize(() => {
      db.run("DELETE FROM answers");
      db.run("DELETE FROM players");

      db.run("DELETE FROM sqlite_sequence WHERE name='answers'");
      db.run("DELETE FROM sqlite_sequence WHERE name='players'");

      db.run(
        `
        UPDATE app_state
        SET value = CAST(CAST(value AS INTEGER) + 1 AS TEXT)
        WHERE key = 'reset_version'
        `,
        [],
        (err) => {
          if (err) {
            return res.status(500).json({
              error: "Erreur reset",
            });
          }

          getResetVersion((stateErr, resetVersion) => {
            res.json({
              success: true,
              resetVersion: resetVersion || 0,
            });
          });
        }
      );
    });
  }
);

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`✅ D-QUIZZ lancé sur http://localhost:${PORT}`);
});

server.on("error", (err) => {
  console.error("❌ Erreur serveur :", err);
});

setInterval(() => {}, 1000);
