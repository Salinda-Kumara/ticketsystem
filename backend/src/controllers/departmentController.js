const prisma = require('../utils/prisma');
const { apiResponse } = require('../utils/helpers');

const getDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { users: true, tickets: true } } }
    });
    return apiResponse(res, 200, departments);
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to fetch departments.');
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) return apiResponse(res, 400, null, 'Name and code are required.');

    const department = await prisma.department.create({ data: { name, code } });
    return apiResponse(res, 201, department, 'Department created.');
  } catch (error) {
    if (error.code === 'P2002') return apiResponse(res, 409, null, 'Department already exists.');
    return apiResponse(res, 500, null, 'Failed to create department.');
  }
};

const updateDepartment = async (req, res) => {
  try {
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: req.body
    });
    return apiResponse(res, 200, department, 'Department updated.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to update department.');
  }
};

const deleteDepartment = async (req, res) => {
  try {
    await prisma.department.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    return apiResponse(res, 200, null, 'Department deactivated.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to deactivate department.');
  }
};

module.exports = { getDepartments, createDepartment, updateDepartment, deleteDepartment };
