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

    // Augment logs with human readable names for legacy logs that don't have it in details
    const ticketIds = logs.filter(l => l.entity === 'Ticket' && l.entityId).map(l => l.entityId);
    if (ticketIds.length > 0) {
      const tickets = await prisma.ticket.findMany({ where: { id: { in: ticketIds } }, select: { id: true, ticketNumber: true } });
      const ticketMap = Object.fromEntries(tickets.map(t => [t.id, t.ticketNumber]));
      logs.forEach(l => {
        if (l.entity === 'Ticket' && ticketMap[l.entityId] && (!l.details || !l.details.includes(ticketMap[l.entityId]))) {
          l.details = `${l.details || ''} (${ticketMap[l.entityId]})`;
        }
      });
    }

    const assetIds = logs.filter(l => l.entity === 'Asset' && l.entityId).map(l => l.entityId);
    if (assetIds.length > 0) {
      const assets = await prisma.asset.findMany({ where: { id: { in: assetIds } }, select: { id: true, assetTag: true } });
      const assetMap = Object.fromEntries(assets.map(t => [t.id, t.assetTag]));
      logs.forEach(l => {
        if (l.entity === 'Asset' && assetMap[l.entityId] && (!l.details || !l.details.includes(assetMap[l.entityId]))) {
          l.details = `${l.details || ''} (${assetMap[l.entityId]})`;
        }
      });
    }

    const userIdsList = logs.filter(l => l.entity === 'User' && l.entityId).map(l => l.entityId);
    if (userIdsList.length > 0) {
      const users = await prisma.user.findMany({ where: { id: { in: userIdsList } }, select: { id: true, email: true } });
      const userMap = Object.fromEntries(users.map(t => [t.id, t.email]));
      logs.forEach(l => {
        if (l.entity === 'User' && userMap[l.entityId] && (!l.details || !l.details.includes(userMap[l.entityId]))) {
          l.details = `${l.details || ''} (${userMap[l.entityId]})`;
        }
      });
    }

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
