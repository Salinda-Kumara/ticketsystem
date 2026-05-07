const prisma = require('../utils/prisma');
const { apiResponse, paginationMeta } = require('../utils/helpers');

const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, entity, action, dateFrom, dateTo } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    if (userId) where.userId = userId;
    if (entity) where.entity = entity;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { firstName: true, lastName: true, email: true, role: true } } }
      }),
      prisma.activityLog.count({ where })
    ]);

    return apiResponse(res, 200, { logs, pagination: paginationMeta(total, page, limit) });
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to fetch activity logs.');
  }
};

const getLoginHistory = async (req, res) => {
  try {
    const logs = await prisma.activityLog.findMany({
      where: { action: 'LOGIN' },
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { firstName: true, lastName: true, email: true } } }
    });
    return apiResponse(res, 200, logs);
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to fetch login history.');
  }
};

module.exports = { getActivityLogs, getLoginHistory };
