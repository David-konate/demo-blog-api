const { body, param, query } = require("express-validator");
const xss = require("xss");

// Fonction pour nettoyer les données et prévenir les attaques XSS
const cleanXSS = (value) => xss(value);

// Validation des données pour l'article
const createArticleValidator = [
  body("title")
    .notEmpty()
    .withMessage("Title is required.")
    .isLength({ max: 255 })
    .withMessage("Title must not exceed 255 characters.")
    .trim()
    .custom((value) => cleanXSS(value)),

  body("slug")
    .notEmpty()
    .withMessage("Slug is required.")
    .isLength({ max: 255 })
    .withMessage("Slug must not exceed 255 characters.")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) // Regex pour slug : lettres, chiffres, et tirets
    .withMessage(
      "Slug must only contain lowercase letters, numbers, and hyphens."
    )
    .trim()
    .custom((value) => cleanXSS(value)),

  body("fileUrl")
    .notEmpty()
    .withMessage("File URL is required.")
    .isURL()
    .withMessage("File URL must be a valid URL.")
    .trim(),

  body("author")
    .notEmpty()
    .withMessage("Author is required.")
    .isLength({ max: 255 })
    .withMessage("Author name must not exceed 255 characters.")
    .matches(/^[a-zA-Z\s]+$/) // Regex pour autoriser seulement les lettres et espaces
    .withMessage("Author name must only contain letters and spaces.")
    .trim()
    .custom((value) => cleanXSS(value)),

  body("date")
    .notEmpty()
    .withMessage("Date is required.")
    .isDate()
    .withMessage("Date must be a valid date.")
    .trim(),

  // Optionnel : validation de la catégorie si elle est fournie
  body("categoryId")
    .optional()
    .isInt()
    .withMessage("Category ID must be a valid integer."),
];

// Validation pour l'update d'un article
const updateArticleValidator = [
  param("slug")
    .notEmpty()
    .withMessage("Slug is required.")
    .trim()
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) // Regex pour slug : lettres, chiffres, et tirets
    .withMessage(
      "Slug must only contain lowercase letters, numbers, and hyphens."
    )
    .custom((value) => cleanXSS(value)),

  body("title")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Title must not exceed 255 characters.")
    .trim()
    .custom((value) => cleanXSS(value)),

  body("slug")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Slug must not exceed 255 characters.")
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) // Regex pour slug : lettres, chiffres, et tirets
    .withMessage(
      "Slug must only contain lowercase letters, numbers, and hyphens."
    )
    .trim()
    .custom((value) => cleanXSS(value)),

  body("fileUrl")
    .optional()
    .isURL()
    .withMessage("File URL must be a valid URL.")
    .trim(),

  body("author")
    .optional()
    .isLength({ max: 255 })
    .withMessage("Author name must not exceed 255 characters.")
    .matches(/^[a-zA-Z\s]+$/) // Regex pour autoriser seulement les lettres et espaces
    .withMessage("Author name must only contain letters and spaces.")
    .trim()
    .custom((value) => cleanXSS(value)),

  body("date")
    .optional()
    .isDate()
    .withMessage("Date must be a valid date.")
    .trim(),

  body("protected")
    .optional()
    .isBoolean()
    .withMessage("Protected must be a boolean value."),
];

module.exports = { createArticleValidator, updateArticleValidator };
