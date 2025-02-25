const express = require("express");
const cloudinary = require("cloudinary").v2;

const { Sequelize } = require("sequelize");
const router = express.Router();
const Article = require("../models/articleModel");

const validator = require("validator");
const Category = require("../models/categoryModel");

const uploadMarkdownFile = async (req, res) => {
  try {
    const markdownFile = req.files?.markdown?.[0];
    const slug = req.params.slug;

    if (!markdownFile) {
      return res
        .status(400)
        .json({ status: "error", message: "Fichier Markdown manquant." });
    }

    if (!slug) {
      return res
        .status(400)
        .json({ status: "error", message: "Slug manquant." });
    }

    // Validation du slug
    if (!validator.isSlug(slug)) {
      return res
        .status(400)
        .json({ status: "error", message: "Slug invalide." });
    }
    const extractMetadata = (regex) => {
      const match = markdownFile.buffer.toString().match(regex);
      return match ? match[1].trim() : null;
    };
    const categoryString = extractMetadata(/category:\s*"?(.+?)"?$/m);
    const categoryId = categoryString ? parseInt(categoryString, 10) : 0; // Conversion en entier

    const author = extractMetadata(/author:\s*"?(.+?)"?$/m) || "Auteur inconnu";
    const date =
      extractMetadata(/date:\s*"?(.+?)"?$/m) || new Date().toISOString();
    const image = extractMetadata(/image:\s*"?(.+?)"?$/m) || "";

    // // Vérification si la catégorie existe
    const category = await Category.findByPk(categoryId);
    if (!category) {
      return res
        .status(400)
        .json({ status: "error", message: "Catégorie inexistante." });
    }

    // Validation des métadonnées
    if (!validator.isAlpha(author.replace(/\s+/g, ""))) {
      return res
        .status(400)
        .json({ status: "error", message: "Auteur invalide." });
    }

    if (!validator.isDate(date)) {
      return res
        .status(400)
        .json({ status: "error", message: "Date invalide." });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: `${slug}.md`,
        folder: `markdown_articles/${slug}`,
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({
            status: "error",
            message: "Erreur Cloudinary",
            error: error.message,
          });
        }

        try {
          const article = await Article.create({
            title: slug.replace(/-/g, " "),
            slug,
            categoryId, // Utilisation de l'ID de la catégorie
            author,
            date,
            image,
            fileUrl: result.secure_url,
          });

          res.status(201).json({
            status: "success",
            message: "Article enregistré avec succès.",
            article: {
              id: article.id,
              title: article.title,
              slug: article.slug,
              author: article.author,
              date: article.date,
              categoryId: article.categoryId, // Renvoi de l'ID de la catégorie
              image: article.image,
              fileUrl: article.fileUrl,
            },
          });
        } catch (err) {
          return res.status(500).json({
            status: "error",
            message: "Erreur base de données",
            error: err.message,
          });
        }
      }
    );

    stream.end(markdownFile.buffer);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Fonction pour mettre à jour un article existant
const updateArticle = async (req, res) => {
  try {
    const { slug } = req.params;
    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "Slug manquant.",
      });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Aucun fichier reçu.",
      });
    }

    const markdownFile = req.files["markdown"]
      ? req.files["markdown"][0]
      : null;
    if (!markdownFile) {
      return res.status(400).json({
        status: "error",
        message: "Fichier Markdown manquant.",
      });
    }

    const extractMetadata = (regex) => {
      const match = markdownFile.buffer.toString().match(regex);
      return match ? match[1] : null;
    };

    const author =
      extractMetadata(/author:\s*"?(.+?)"?$/m) || "Auteur non trouvé";
    const date = extractMetadata(/date:\s*"?(.+?)"?$/m) || "Date non trouvée";
    const categoryId = req.body.categoryId; // Receiving categoryId from the body
    const image = extractMetadata(/image:\s*"?(.+?)"?$/m);

    // Validation des champs extraits
    if (!validator.isAlpha(author.replace(/\s+/g, ""))) {
      return res
        .status(400)
        .json({ status: "error", message: "Auteur invalide." });
    }

    if (!validator.isDate(date)) {
      return res
        .status(400)
        .json({ status: "error", message: "Date invalide." });
    }

    if (!categoryId || isNaN(categoryId)) {
      return res
        .status(400)
        .json({ status: "error", message: "ID de catégorie invalide." });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: `${slug}.md`,
        folder: `markdown_articles/${slug}`,
        overwrite: true,
      },
      async (error, result) => {
        if (error) {
          return res.status(500).json({
            status: "error",
            message: "Erreur lors de la mise à jour sur Cloudinary.",
            error: error.message,
          });
        }

        try {
          const updatedArticle = await Article.findOne({
            where: { slug },
          });

          if (!updatedArticle) {
            return res.status(404).json({
              status: "error",
              message: "Article non trouvé.",
            });
          }

          // Find the category using the categoryId
          const category = await Category.findByPk(categoryId);
          if (!category) {
            return res.status(404).json({
              status: "error",
              message: "Catégorie non trouvée.",
            });
          }

          updatedArticle.fileUrl = result.secure_url;
          updatedArticle.updatedAt = new Date();
          updatedArticle.author = author;
          updatedArticle.date = date;
          updatedArticle.categoryId = category.id; // Update with the category ID
          updatedArticle.image = image;

          await updatedArticle.save();

          res.status(200).json({
            status: "success",
            message: "Article mis à jour avec succès.",
            article: {
              id: updatedArticle.id,
              title: updatedArticle.title,
              slug: updatedArticle.slug,
              author: updatedArticle.author,
              date: updatedArticle.date,
              categoryId: updatedArticle.categoryId,
              image: updatedArticle.image,
              fileUrl: updatedArticle.fileUrl,
            },
          });
        } catch (err) {
          return res.status(500).json({
            status: "error",
            message: "Erreur lors de la mise à jour dans la base de données.",
            error: err.message,
          });
        }
      }
    );

    stream.end(markdownFile.buffer);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la mise à jour.",
      error: error.message,
    });
  }
};

const getArticles = async (req, res) => {
  try {
    let { page = 1, category } = req.query;
    page = parseInt(page, 10);
    const limit = 3;
    const offset = (page - 1) * limit;

    if (isNaN(page) || page < 1) {
      return res.status(400).json({
        status: "error",
        message: "Page invalide.",
      });
    }

    const filter = category ? { categoryId: category } : {}; // Update to use categoryId for filtering

    // Récupérer les articles avec pagination, filtre et la catégorie associée
    const { rows: articles, count: totalArticles } =
      await Article.findAndCountAll({
        where: filter, // Appliquer le filtre (s'il existe)
        order: [["createdAt", "DESC"]], // Trier par date de création décroissante
        limit, // Limiter à 3 articles
        offset, // Calculer l'offset pour la pagination
        include: [
          {
            model: Category, // Inclure la catégorie dans la requête
            as: "category", // Alias pour la relation
            attributes: ["id", "name"], // Choisir les attributs à inclure de la catégorie
          },
        ],
      });

    res.status(200).json({
      status: "success",
      data: articles,
      total: totalArticles,
      currentPage: page,
      totalPages: Math.ceil(totalArticles / limit),
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

const getArticleCountByCategory = async (req, res) => {
  try {
    const categories = await Article.findAll({
      attributes: [
        "category", // Sélectionne la catégorie
        [Sequelize.fn("COUNT", Sequelize.col("category")), "count"], // Compte le nombre d'articles par catégorie
      ],
      group: ["category"], // Regroupe par catégorie
      raw: true, // Retourne le résultat sous forme d'objet simple
    });

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Aucune catégorie trouvée.",
      });
    }

    // Structure du résultat pour correspondre à la réponse attendue
    const result = categories.map((category) => ({
      category: category.category,
      count: category.count,
    }));

    res.status(200).json({
      status: "success",
      message: "Nombre d'articles par catégorie récupéré avec succès.",
      data: result,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération du nombre d'articles par catégorie :",
      error
    );
    res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la récupération des données.",
      error: error.message,
    });
  }
};

// Fonction pour récupérer un article spécifique par son ID
const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Recherche de l'article par ID avec la catégorie associée
    const article = await Article.findOne({
      where: { id }, // Recherche par l'ID
      attributes: [
        "title",
        "slug",
        "fileUrl",
        "createdAt",
        "image",
        "author",
        "date",
      ], // Sélectionne les champs à retourner
      include: [
        {
          model: Category, // Inclure la catégorie dans la requête
          as: "category", // Alias pour la relation
          attributes: ["id", "name"], // Choisir les attributs à inclure de la catégorie
        },
      ],
    });

    if (!article) {
      return res.status(404).json({
        status: "error",
        message: "Article non trouvé",
      });
    }

    res.status(200).json({
      status: "success",
      data: article,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'article:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Fonction pour uploader une image (image titre) sur Cloudinary
const uploadImageTitle = async (req, res) => {
  try {
    const files = req.files;
    const slug = req.params.slug;
    console.log("Fichiers reçus :", files);
    if (!files || !files.imageTitleData) {
      return res.status(400).json({
        status: "error",
        message: "Aucune image reçue.",
      });
    }

    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "Le slug est manquant.",
      });
    }

    let imageTitleDataUrl = null;

    // Gestion de l'image titre (imageTitleData)
    if (files.imageTitleData && files.imageTitleData[0]) {
      const titleFile = files.imageTitleData[0];
      const titleImageName = titleFile.originalname;
      const titlePath = `markdown_articles/${slug}`;

      try {
        const uploadResponse = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              resource_type: "image",
              folder: titlePath,
              public_id: titleImageName.split(".")[0],
              transformation: [{ width: 1200, height: 628, crop: "fill" }],
            },
            (error, result) => {
              if (error) {
                reject(error);
              } else {
                resolve(result);
              }
            }
          );
          uploadStream.end(titleFile.buffer);
        });

        imageTitleDataUrl = uploadResponse.secure_url;
      } catch (error) {
        return res.status(500).json({
          status: "error",
          message: "Erreur lors de l'upload de l'image titre.",
          error: error.message,
        });
      }
    }

    // Répondre avec l'URL de l'image titre téléchargée
    return res.status(200).json({
      status: "success",
      message: "Image téléchargée avec succès.",
      image_title_url: imageTitleDataUrl,
      slug: slug,
    });
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Une erreur inattendue s'est produite.",
      error: error.message,
    });
  }
};

// Fonction pour supprimer un article (Markdown + images associées)
const deleteArticle = async (req, res) => {
  const { id } = req.params;

  try {
    if (!id) {
      return res.status(400).json({ status: "error", message: "ID manquant." });
    }

    // Suppression du fichier Markdown
    await cloudinary.api.delete_resources_by_prefix(
      `markdown_articles/${id}/`,
      { resource_type: "raw" }
    );

    // Suppression des images associées
    await cloudinary.api.delete_resources_by_prefix(
      `markdown_articles/${id}/`,
      { resource_type: "image" }
    );

    // Suppression du dossier (s'il est vide)
    await cloudinary.api.delete_folder(`markdown_articles/${id}`);

    // Suppression de l'article dans la base de données
    const deletedArticle = await Article.destroy({ where: { id } });
    if (!deletedArticle) {
      return res
        .status(404)
        .json({ status: "error", message: "Article non trouvé." });
    }

    res.status(200).json({
      status: "success",
      message: "Article supprimé avec succès.",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de l'article:", error);
    res.status(500).json({
      status: "error",
      message: "Erreur lors de la suppression de l'article.",
      error: error.message,
    });
  }
};

// Fonction pour vérifier si le slug existe déjà et générer un slug unique
const checkOrGenerateSlug = async (req, res) => {
  let slug = req.params.slug.trim();
  if (!slug) {
    return res.status(400).json({
      status: "error",
      message: 'Le paramètre "slug" est requis.',
    });
  }

  try {
    const slugExists = await checkCloudinaryExistence(slug);

    if (slugExists) {
      const uniqueSlug = await generateUniqueSlug(slug);
      return res.status(200).json({
        status: "success",
        exists: true,
        uniqueSlug,
      });
    } else {
      return res.status(200).json({
        status: "success",
        exists: false,
        uniqueSlug: slug,
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "error",
      message: "Une erreur est survenue lors de la vérification du slug.",
      error: error.message,
    });
  }
};

// Fonction pour générer un slug unique pour les articles
const generateUniqueSlug = async (baseSlug) => {
  let slug = baseSlug;
  let counter = 1;

  while (await checkCloudinaryExistence(slug)) {
    slug = `${baseSlug}_${counter}`;
    counter++;
  }

  return slug;
};

// Fonction pour vérifier l'existence du fichier sur Cloudinary
const checkCloudinaryExistence = async (slug) => {
  try {
    const result = await cloudinary.search
      .expression(
        `resource_type:raw AND public_id:markdown_articles/${slug}/${slug}.md`
      )
      .max_results(1)
      .execute();

    return result.resources.length > 0;
  } catch (error) {
    throw new Error("Erreur lors de la recherche du fichier dans Cloudinary.");
  }
};

module.exports = {
  getArticleCountByCategory,
  getArticles,
  getArticleById,
  uploadImageTitle,
  uploadMarkdownFile,
  checkOrGenerateSlug,
  updateArticle,
  deleteArticle,
};
