const { body, param } = require("express-validator");
const xss = require("xss");

// Fonction pour nettoyer les données et prévenir les attaques XSS
const cleanXSS = (value) => xss(value);

// Validation pour la création d'une catégorie
const createCategoryValidator = [
  body("label_category")
    .notEmpty()
    .withMessage("Category label is required.")
    .isLength({ max: 255 })
    .withMessage("Category label must not exceed 255 characters.")
    .matches(/^[a-zA-Z0-9\s]+$/) // Regex pour autoriser seulement lettres, chiffres et espaces
    .withMessage(
      "Category label must only contain letters, numbers, and spaces."
    )
    .trim()
    .custom((value) => cleanXSS(value)), // Protection XSS
];

// Validation pour la mise à jour d'une catégorie
const updateCategoryValidator = [
  param("id").isInt().withMessage("Category ID must be a valid integer."),

  body("label_category")
    .optional()
    .notEmpty()
    .withMessage("Category label is required.")
    .isLength({ max: 255 })
    .withMessage("Category label must not exceed 255 characters.")
    .matches(/^[a-zA-Z0-9\s]+$/) // Regex pour autoriser seulement lettres, chiffres et espaces
    .withMessage(
      "Category label must only contain letters, numbers, and spaces."
    )
    .trim()
    .custom((value) => cleanXSS(value)), // Protection XSS
];

module.exports = { createCategoryValidator, updateCategoryValidator };
