const express = require("express");
const mongoose = require("mongoose");
const cloudinary = require("cloudinary").v2;

const router = express.Router();

// Schéma de Mongoose pour un article
const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  fileUrl: { type: String, required: true }, // URL du fichier .md sur Cloudinary
  createdAt: { type: Date, default: Date.now },
});

const Article = mongoose.model("Article", articleSchema);

// Fonction pour récupérer les articles avec pagination et catégorie
const getArticles = async (req, res) => {
  try {
    const { page = 1, category } = req.query;
    const pipeline = getArticlePipeline(category, page);

    const articles = await Article.aggregate(pipeline);

    if (!articles.length) {
      return res.status(404).json({ message: "Aucun article trouvé" });
    }

    res.status(200).json({
      status: "success",
      data: articles,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des articles:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
};

// Fonction pour récupérer un article spécifique par son slug
const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    console.log(`🔍 Recherche de l'article avec le slug: ${slug}`);

    const article = await Article.findOne({ slug });

    if (!article) {
      return res.status(404).json({ message: "Article non trouvé" });
    }

    res.status(200).json({
      status: "success",
      data: article,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération de l'article:", error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
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

// Fonction pour uploader un fichier Markdown sur Cloudinary
const uploadMarkdownFile = async (req, res) => {
  try {
    const markdownFile = req.file;
    const slug = req.params.slug;

    if (!markdownFile) {
      return res.status(400).json({
        status: "error",
        message: "Fichier Markdown manquant.",
      });
    }

    if (!slug) {
      return res.status(400).json({
        status: "error",
        message: "Slug manquant.",
      });
    }

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "raw",
        public_id: `${slug}.md`, // Le fichier Markdown sera nommé avec le slug
        folder: `markdown_articles/${slug}`, // Dossier basé sur le slug
      },
      (error, result) => {
        if (error) {
          return res.status(500).json({
            status: "error",
            message: "Erreur lors du téléchargement sur Cloudinary.",
            error: error.message,
          });
        }

        // Enregistrement de l'URL du fichier dans la base de données
        const article = new Article({
          title: slug,
          fileUrl: result.secure_url,
        });

        article
          .save()
          .then(() => {
            res.status(200).json({
              status: "success",
              message: "Fichier Markdown téléchargé avec succès.",
              markdownUrl: result.secure_url,
            });
          })
          .catch((err) => {
            res.status(500).json({
              status: "error",
              message:
                "Erreur lors de l'enregistrement dans la base de données.",
              error: err.message,
            });
          });
      }
    );

    stream.end(markdownFile.buffer);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message:
        "Une erreur est survenue lors de l'enregistrement du fichier Markdown.",
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
  getArticles,
  getArticleBySlug,
  uploadImageTitle,
  uploadMarkdownFile,
  checkOrGenerateSlug,
};
