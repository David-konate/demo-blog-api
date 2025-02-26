const { DataTypes } = require("sequelize");
const sequelize = require("../middlewares/Sequelize");
const Category = require("./categoryModel");

const Article = sequelize.define(
  "Article",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    slug: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "categories", // Utilisation du nom de la table pour éviter le problème d'import
        key: "id",
      },
    },
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    date: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    protected: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    timestamps: true,
    tableName: "articles",
  }
);

// Définir l'association entre Article et Category
Article.belongsTo(Category, { foreignKey: "categoryId", as: "category" });

module.exports = Article;
