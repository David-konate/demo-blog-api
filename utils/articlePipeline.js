// Définir le pipeline d'agrégation pour les articles
const getArticlePipeline = (category, page) => {
  const limit = 3;
  const skip = (page - 1) * limit;

  return [
    {
      $match: category ? { category } : {},
    },
    {
      $sort: { createdAt: -1 },
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ];
};

module.exports = getArticlePipeline;
