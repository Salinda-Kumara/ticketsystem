const prisma = require('../utils/prisma');
const { apiResponse } = require('../utils/helpers');

const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { tickets: true } } }
    });
    return apiResponse(res, 200, categories);
  } catch (error) {
    console.error('Get categories error:', error);
    return apiResponse(res, 500, null, 'Failed to fetch categories.');
  }
};

const createCategory = async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    if (!name) return apiResponse(res, 400, null, 'Category name is required.');

    const category = await prisma.category.create({
      data: { name, description, icon }
    });
    return apiResponse(res, 201, category, 'Category created.');
  } catch (error) {
    if (error.code === 'P2002') return apiResponse(res, 409, null, 'Category already exists.');
    return apiResponse(res, 500, null, 'Failed to create category.');
  }
};

const updateCategory = async (req, res) => {
  try {
    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: req.body
    });
    return apiResponse(res, 200, category, 'Category updated.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to update category.');
  }
};

const deleteCategory = async (req, res) => {
  try {
    await prisma.category.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    return apiResponse(res, 200, null, 'Category deactivated.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to deactivate category.');
  }
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
