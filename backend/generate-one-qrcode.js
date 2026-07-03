const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const URL = "http://localhost:5173/";
const outputDir = path.join(__dirname, "qrcodes");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

QRCode.toFile(
  path.join(outputDir, "d-quizz-qrcode.png"),
  URL,
  {
    width: 1000,
    margin: 2,
  },
  (err) => {
    if (err) {
      console.error("Erreur QR code :", err);
      return;
    }

    console.log("✅ QR code D-QUIZZ généré !");
    console.log(URL);
  }
);