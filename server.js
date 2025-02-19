const express = require("express");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const app = express();
const articleRoutes = require("./routes/articleRoutes");
const connectDB = require("./mongoConfig");
require("dotenv").config();

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Fonction de test Cloudinary au démarrage
const testCloudinary = async () => {
  try {
    console.log("🔄 Test de Cloudinary en cours...");

    const result = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      { folder: "tests" }
    );

    console.log(
      "✅ Cloudinary fonctionne ! URL de l'image :",
      result.secure_url
    );
  } catch (error) {
    console.error("❌ Erreur lors du test Cloudinary :", error.message);
  }
};

// Middleware CORS
app.use(
  cors({
    origin: "http://localhost:8000", // ou l'URL de votre frontend Vue
    methods: ["GET", "POST", "PUT", "DELETE"], // les méthodes HTTP autorisées
    allowedHeaders: ["Content-Type", "Authorization"], // les en-têtes autorisés
  })
);

app.get("/", (req, res) => {
  res.send("Hello, API avec Yarn!");
});

app.use("/api", articleRoutes);

connectDB(); // Connexion à MongoDB
testCloudinary(); // Test Cloudinary au démarrage

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
