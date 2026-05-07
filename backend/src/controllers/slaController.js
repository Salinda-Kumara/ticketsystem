const prisma = require('../utils/prisma');
const { apiResponse } = require('../utils/helpers');

const getSLARules = async (req, res) => {
  try {
    const rules = await prisma.sLARule.findMany({
      orderBy: [{ priority: 'asc' }, { name: 'asc' }],
      include: { category: { select: { id: true, name: true } } }
    });
    return apiResponse(res, 200, rules);
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to fetch SLA rules.');
  }
};

const createSLARule = async (req, res) => {
  try {
    const { name, priority, categoryId, responseTimeMin, resolveTimeMin, escalateAfterMin } = req.body;
    if (!name || !priority || !responseTimeMin || !resolveTimeMin) {
      return apiResponse(res, 400, null, 'Required fields missing.');
    }

    const rule = await prisma.sLARule.create({
      data: { name, priority, categoryId, responseTimeMin, resolveTimeMin, escalateAfterMin },
      include: { category: { select: { id: true, name: true } } }
    });
    return apiResponse(res, 201, rule, 'SLA rule created.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to create SLA rule.');
  }
};

const updateSLARule = async (req, res) => {
  try {
    const rule = await prisma.sLARule.update({
      where: { id: req.params.id },
      data: req.body,
      include: { category: { select: { id: true, name: true } } }
    });
    return apiResponse(res, 200, rule, 'SLA rule updated.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to update SLA rule.');
  }
};

const deleteSLARule = async (req, res) => {
  try {
    await prisma.sLARule.delete({ where: { id: req.params.id } });
    return apiResponse(res, 200, null, 'SLA rule deleted.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to delete SLA rule.');
  }
};

module.exports = { getSLARules, createSLARule, updateSLARule, deleteSLARule };
