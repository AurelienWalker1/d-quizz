const QRCode = require("qrcode");
const fs = require("fs");
const path = require("path");

const BASE_URL = "https://voluble-pasca-48217d.netlify.app";

const outputDir = path.join(__dirname, "qrcodes");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

async function generateQRCodes() {
  for (let i = 1; i <= 20; i++) {
    const url = `${BASE_URL}/question/${i}`;
    const filePath = path.join(outputDir, `QR-question-${i}.png`);

    await QRCode.toFile(filePath, url, {
      width: 800,
      margin: 2,
    });

    console.log(`✅ QR code créé : ${filePath}`);
    console.log(`🔗 ${url}`);
  }

  console.log("🎉 Les 20 QR codes D-QUIZZ sont prêts !");
}

generateQRCodes();
