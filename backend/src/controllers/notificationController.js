const prisma = require('../utils/prisma');
const { apiResponse, paginationMeta } = require('../utils/helpers');

const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = { userId: req.user.id };
    if (unreadOnly === 'true') where.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId: req.user.id, isRead: false } })
    ]);

    return apiResponse(res, 200, {
      notifications,
      unreadCount,
      pagination: paginationMeta(total, page, limit)
    });
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to fetch notifications.');
  }
};

const markAsRead = async (req, res) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true }
    });
    return apiResponse(res, 200, null, 'Notification marked as read.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to update notification.');
  }
};

const markAllRead = async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    return apiResponse(res, 200, null, 'All notifications marked as read.');
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to update notifications.');
  }
};

const getUnreadCount = async (req, res) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });
    return apiResponse(res, 200, { count });
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to fetch count.');
  }
};

module.exports = { getNotifications, markAsRead, markAllRead, getUnreadCount };
