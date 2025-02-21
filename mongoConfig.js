const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Augmenter le timeout pour la sélection du serveur
      socketTimeoutMS: 45000, // Augmenter le timeout de socket
    });
    console.log("✅ MongoDB connecté");
  } catch (err) {
    console.error("❌ Erreur de connexion à MongoDB :", err.message);
    process.exit(1); // Arrête le serveur en cas d'erreur critique
  }
};

module.exports = connectDB;
