const express = require("express");
const router = express.Router();
const multer = require("multer");

const storage = multer.memoryStorage(); // Stockage en mémoire des fichiers
const upload = multer({ storage: storage }).fields([
  { name: "markdown", maxCount: 1 }, // Champ pour le fichier markdown
  { name: "imagesData", maxCount: 10 }, // Correspond au champ pour les sections
  { name: "imageTitleData", maxCount: 1 }, // Correspond au champ pour l'image titre
]);

const {
  getArticles,
  getArticleBySlug,
  uploadImageTitle,
  uploadMarkdownFile,
  checkOrGenerateSlug,
} = require("../controllers/articleController");

router.get("/articles", getArticles);
router.get("/article/:slug", getArticleBySlug);
router.post("/upload/images/:slug", upload, uploadImageTitle);
router.post("/save/:slug", upload, uploadMarkdownFile);
router.get("/check-or-generate-slug/:slug", checkOrGenerateSlug);

module.exports = router;
