const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, required: false },
    fileUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    image: { type: String },
    author: { type: String, required: true },
    date: { type: String, required: true },
    protected: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Article = mongoose.model("Article", articleSchema);

module.exports = Article;
