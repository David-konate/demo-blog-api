const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} = require("../controllers/categoryController"); // Importation des contrôleurs
const {
  createCategoryValidator,
  updateCategoryValidator,
} = require("../validators/categoryValidator"); // Importation des validateurs

// Route pour créer une nouvelle catégorie
router.post(
  "/categories",
  createCategoryValidator, // Appliquer les validateurs
  createCategory
);

// Route pour récupérer toutes les catégories
router.get("/categories", getCategories);

// Route pour récupérer une catégorie par son id
router.get("/categories/:id", getCategoryById);

// Route pour mettre à jour une catégorie
router.put(
  "/categories/:id",
  updateCategoryValidator, // Appliquer les validateurs
  updateCategory
);

// Route pour supprimer une catégorie
router.delete("/categories/:id", deleteCategory);

module.exports = router;
