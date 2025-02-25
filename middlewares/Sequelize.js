const { Sequelize } = require("sequelize");

// Configuration pour se connecter à MySQL via MAMP
const sequelize = new Sequelize("blog", "root", "root", {
  // Utilise les credentials par défaut de MAMP (root / root)
  host: "127.0.0.1",
  port: 3306, // Port par défaut de MySQL sous MAMP
  dialect: "mysql",
  logging: false, // Désactiver les logs SQL si nécessaire
});

module.exports = sequelize;
