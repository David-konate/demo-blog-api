const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB connecté"))
    .catch((err) => console.error("Erreur de connexion à MongoDB :", err));
};

module.exports = connectDB;
