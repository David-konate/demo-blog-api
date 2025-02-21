const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: false },
    fileUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    image: { type: String }, // Image optionnelle (peut être extraite du fichier Markdown)
    author: { type: String, required: true }, // Auteur extrait du fichier Markdown
    date: { type: String, required: true },
    protected: { type: Boolean, default: false }, // ✅ Définit false par défaut
  },
  { timestamps: true }
);

module.exports = mongoose.model("Article", articleSchema);
