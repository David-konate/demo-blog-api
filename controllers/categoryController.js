const Category = require("../models/categoryModel");

// Création d'une nouvelle catégorie
const createCategory = async (req, res) => {
  try {
    const { label_category } = req.body;
    console.log(label_category);
    const newCategory = await Category.create({ label_category });
    return res.status(201).json(newCategory);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Récupérer toutes les catégories
const getCategories = async (req, res) => {
  try {
    console.log("Appel API pour récupérer les catégories");
    const categories = await Category.findAll();
    return res.status(200).json(categories);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Récupérer une catégorie par son id
const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.status(200).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Mettre à jour une catégorie
const updateCategory = async (req, res) => {
  try {
    const { label_category } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    category.label_category = label_category || category.label_category;
    await category.save();

    return res.status(200).json(category);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Supprimer une catégorie
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    await category.destroy();
    return res.status(204).json({ message: "Category deleted" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};
