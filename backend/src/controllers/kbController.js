const prisma = require('../utils/prisma');
const { apiResponse, paginationMeta } = require('../utils/helpers');

const getArticles = async (req, res) => {
  try {
    const { page = 1, limit = 12, search, category, published } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Employees only see published articles
    if (req.user.role === 'EMPLOYEE') {
      where.isPublished = true;
    } else if (published !== undefined) {
      where.isPublished = published === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
        { tags: { has: search } }
      ];
    }
    if (category) where.categoryTag = category;

    const [articles, total] = await Promise.all([
      prisma.kBArticle.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { firstName: true, lastName: true } } }
      }),
      prisma.kBArticle.count({ where })
    ]);

    return apiResponse(res, 200, { articles, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to fetch articles.');
  }
};

const getArticleById = async (req, res) => {
  try {
    const article = await prisma.kBArticle.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
      include: { author: { select: { firstName: true, lastName: true } } }
    });
    return apiResponse(res, 200, article);
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to fetch article.');
  }
};

const createArticle = async (req, res) => {
  try {
    const { title, content, categoryTag, tags, isPublished } = req.body;
    if (!title || !content) return apiResponse(res, 400, null, 'Title and content required.');

    const article = await prisma.kBArticle.create({
      data: { title, content, categoryTag, tags: tags || [], authorId: req.user.id, isPublished: isPublished || false }
    });
    return apiResponse(res, 201, article, 'Article created.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to create article.');
  }
};

const updateArticle = async (req, res) => {
  try {
    const article = await prisma.kBArticle.update({
      where: { id: req.params.id },
      data: req.body
    });
    return apiResponse(res, 200, article, 'Article updated.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to update article.');
  }
};

const deleteArticle = async (req, res) => {
  try {
    await prisma.kBArticle.delete({ where: { id: req.params.id } });
    return apiResponse(res, 200, null, 'Article deleted.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to delete article.');
  }
};

module.exports = { getArticles, getArticleById, createArticle, updateArticle, deleteArticle };
