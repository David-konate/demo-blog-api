const express = require("express");
const router = express.Router();
const multer = require("multer");

// Configuration de multer (stockage en mémoire pour Cloudinary)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage }).fields([
  { name: "markdown", maxCount: 1 }, // Fichier Markdown
  { name: "imagesData", maxCount: 10 }, // Images des sections
  { name: "imageTitleData", maxCount: 1 }, // Image principale
]);

// Importation des contrôleurs
const {
  getArticles,
  getArticleBySlug,
  uploadImageTitle,
  uploadMarkdownFile,
  checkOrGenerateSlug,
  deleteArticle,
  updateArticle,
  getArticleCountByCategory,
} = require("../controllers/articleController");

// Routes pour les articles
router.get("/articles", getArticles);
router.get("/article/:slug", getArticleBySlug);
router.post("/save/:slug", upload, uploadMarkdownFile);
router.put("/update/:slug", upload, updateArticle);
router.delete("/article/:slug", deleteArticle);

// Routes pour les images
router.post("/upload/images/:slug", upload, uploadImageTitle);

// Routes pour la gestion des slugs
router.get("/check-or-generate-slug/:slug", checkOrGenerateSlug);

// Route pour obtenir le nombre d'articles par catégorie
router.get("/articles/count-by-category", getArticleCountByCategory);

module.exports = router;
