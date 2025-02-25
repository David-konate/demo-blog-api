const express = require("express");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const app = express();
const articleRoutes = require("./routes/articleRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const sequelize = require("./middlewares/Sequelize");
require("dotenv").config();

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Middleware de logs des requêtes
app.use((req, res, next) => {
  console.log(`📢 Requête reçue : ${req.method} ${req.originalUrl}`);
  next();
});

// Middleware CORS
const allowedOrigins = [
  "https://www.blog.david-konate.fr", // Remplace par l'URL de ton frontend
  "*", // Si tu testes en local
];

// app.use(
//   cors({
//     origin: (origin, callback) => {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("⛔ CORS non autorisé"));
//       }
//     },
//     methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//     credentials: true, // Si tu utilises des sessions ou des cookies
//   })
// );

// Middleware pour ajouter les headers CORS à toutes les réponses
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*"); // Change "*" par ton frontend si besoin
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Gérer explicitement les requêtes OPTIONS (preflight CORS)
app.options("*", (req, res) => {
  res.sendStatus(204);
});

// Middleware pour parser le corps des requêtes JSON
app.use(express.json());

// Route principale
app.get("/", (req, res) => {
  res.send("Hello, API blog!");
});

// Routes des articles
app.use("/api", articleRoutes);
app.use("/api", categoryRoutes);

// Test de connexion MySQL
sequelize
  .authenticate()
  .then(() => {
    console.log("Connexion à la base de données MySQL réussie");
  })
  .catch((err) => {
    console.error("Impossible de se connecter à la base de données:", err);
  });

sequelize
  .sync()
  .then(() => {
    console.log("Tables synchronisées");
  })
  .catch((err) => {
    console.error("Erreur de synchronisation des tables:", err);
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Serveur lancé sur http://localhost:${PORT}`);
});
