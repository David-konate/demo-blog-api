const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const getArticlePipeline = require("../utils/articlePipeline"); // Remplacer import par require

const router = express.Router();
const Article = require("../models/articleModel"); // Chemin relatif vers votre modèle Article

// Fonction pour uploader un fichier Markdown sur Cloudinary et mongoDB
const uploadMarkdownFile = async (req, res) => {
  try {
    const markdownFile = req.files?.markdown?.[0]; // Vérification correcte du fichier
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

    // Fonction pour extraire les métadonnées du contenu Markdown
    const extractMetadata = (regex) => {
      const match = markdownFile.buffer.toString().match(regex);
      return match ? match[1].trim() : null;
    };

    const author = extractMetadata(/author:\s*"?(.+?)"?$/m) || "Auteur inconnu";
    const date =
      extractMetadata(/date:\s*"?(.+?)"?$/m) || new Date().toISOString();
    const category = extractMetadata(/category:\s*"?(.+?)"?$/m) || "Non classé";
    const image = extractMetadata(/image:\s*"?(.+?)"?$/m) || "";

    // Téléchargement sur Cloudinary
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
          const article = new Article({
            title: req.body.title || slug,
            slug,
            author,
            date,
            category,
            image,
            fileUrl: result.secure_url,
          });

          await article.save();

          res.status(201).json({
            status: "success",
            message: "Article enregistré avec succès.",
            article,
          });
        } catch (err) {
          return res.status(500).json({
            status: "error",
            message: "Erreur MongoDB",
            error: err.message,
          });
        }
      }
    );

    // Envoi du fichier vers Cloudinary
    stream.end(markdownFile.buffer);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Erreur serveur",
      error: error.message,
    });
  }
};

// Fonction pour récupérer les articles avec pagination et catégorie
const getArticles = async (req, res) => {
  try {
    let { page = 1, category } = req.query;
    page = parseInt(page, 10);
    const limit = 3; // Nombre d'articles par page
    const skip = (page - 1) * limit;

    // Vérification des paramètres
    if (isNaN(page) || page < 1) {
      return res
        .status(400)
        .json({ status: "error", message: "Page invalide." });
    }

    // Filtrage par catégorie si fournie
    const filter = category ? { category } : {};

    // Récupération des articles avec pagination
    const articles = await Article.find(filter)
      .sort({ createdAt: -1 }) // Tri du plus récent au plus ancien
      .skip(skip)
      .limit(limit);

    const totalArticles = await Article.countDocuments(filter);

    res.status(200).json({
      status: "success",
      data: articles,
      total: totalArticles,
      currentPage: page,
      totalPages: Math.ceil(totalArticles / limit),
    });
  } catch (error) {
    res
      .status(500)
      .json({
        status: "error",
        message: "Erreur serveur",
        error: error.message,
      });
  }
};

// Fonction pour récupérer un article spécifique par son slug
const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log(`🔍 Recherche de l'article avec le slug: ${slug}`);

    // Recherche de l'article avec insensibilité à la casse (si nécessaire)
    const article = await Article.findOne({ title: slug.toLowerCase() }).select(
      "title slug category fileUrl createdAt imlage author date"
    );
    console.log({ article });

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
  const { slug } = req.params;

  try {
    if (!slug) {
      return res
        .status(400)
        .json({ status: "error", message: "Slug manquant." });
    }

    // Suppression du fichier Markdown
    await cloudinary.api.delete_resources_by_prefix(
      `markdown_articles/${slug}/`,
      { resource_type: "raw" }
    );

    // Suppression des images associées
    await cloudinary.api.delete_resources_by_prefix(
      `markdown_articles/${slug}/`,
      { resource_type: "image" }
    );

    // Suppression du dossier (s'il est vide)
    await cloudinary.api.delete_folder(`markdown_articles/${slug}`);

    // Suppression de l'article dans la base de données
    const deletedArticle = await Article.findOneAndDelete({ slug });
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

    // Fonction pour extraire les métadonnées depuis le fichier Markdown
    const extractMetadata = (regex) => {
      const match = markdownFile.buffer.toString().match(regex);
      return match ? match[1] : null;
    };

    // Extraction des métadonnées
    const author =
      extractMetadata(/author:\s*"?(.+?)"?$/m) || "Auteur non trouvé";
    const date = extractMetadata(/date:\s*"?(.+?)"?$/m) || "Date non trouvée";
    const category =
      extractMetadata(/category:\s*"?(.+?)"?$/m) || "Catégorie non trouvée";
    const image = extractMetadata(/image:\s*"?(.+?)"?$/m);

    // Téléchargement du fichier Markdown sur Cloudinary
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: `${slug}.md`, // Identifiant du fichier
        folder: `markdown_articles/${slug}`, // Dossier Cloudinary
        overwrite: true, // Remplace l'ancien fichier
      },
      async (error, result) => {
        if (error) {
          console.error("❌ Erreur Cloudinary :", error);
          return res.status(500).json({
            status: "error",
            message: "Erreur lors de la mise à jour sur Cloudinary.",
            error: error.message,
          });
        }

        // Mise à jour de l'article dans la base de données avec les nouvelles informations
        try {
          const updatedArticle = await Article.findOneAndUpdate(
            { slug },
            {
              fileUrl: result.secure_url,
              updatedAt: new Date(),
              author, // Mise à jour de l'auteur
              date, // Mise à jour de la date
              category, // Mise à jour de la catégorie
              image, // Mise à jour de l'image
            },
            { new: true }
          );

          if (!updatedArticle) {
            return res.status(404).json({
              status: "error",
              message: "Article non trouvé.",
            });
          }

          res.status(200).json({
            status: "success",
            message: "Fichier Markdown mis à jour avec succès.",
            markdownUrl: result.secure_url,
          });
        } catch (err) {
          console.error(
            "❌ Erreur lors de la mise à jour dans la base de données :",
            err
          );
          return res.status(500).json({
            status: "error",
            message: "Erreur lors de la mise à jour dans la base de données.",
            error: err.message,
          });
        }
      }
    );

    // Envoi du fichier vers Cloudinary
    stream.end(markdownFile.buffer);
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de l'article :", error);
    res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de la mise à jour du fichier Markdown.",
      error: error.message,
    });
  }
};

// Fonction pour vérifier si le slug existe déjà et générer un slug unique
const checkOrGenerateSlug = async (req, res) => {
  let slug = req.params.slug.trim();
  console.log({ slug });
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
  console.log({ slug });
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

// Fonction pour obtenir le nombre d'articles par catégorie
const getArticleCountByCategory = async (req, res) => {
  try {
    // Récupérer toutes les catégories uniques
    const categories = await Article.aggregate([
      {
        $group: {
          _id: "$category", // Regroupement par catégorie
          count: { $sum: 1 }, // Comptage du nombre d'articles dans chaque catégorie
        },
      },
      {
        $project: {
          _id: 0, // Exclure l'ID
          category: "$_id", // Renommer _id en category
          count: 1, // Garder le champ count
        },
      },
    ]);

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Aucune catégorie trouvée.",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Nombre d'articles par catégorie récupéré avec succès.",
      data: categories,
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

module.exports = {
  getArticleCountByCategory,
  getArticles,
  getArticleBySlug,
  uploadImageTitle,
  uploadMarkdownFile,
  checkOrGenerateSlug,
  updateArticle,
  deleteArticle,
};
