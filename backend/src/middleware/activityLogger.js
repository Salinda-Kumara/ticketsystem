const prisma = require('../utils/prisma');
const { getClientIp } = require('../utils/helpers');

/**
 * Activity Logger Middleware
 * Automatically logs user actions for audit trail
 */
const activityLogger = (action, entity) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Only log on successful responses
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        let details = `${action} ${entity}`;
        const item = data?.data;
        if (item && typeof item === 'object') {
          const identifier = item.ticketNumber || item.assetTag || item.name || item.title || item.email;
          if (identifier) {
            details += ` (${identifier})`;
          }

          if (action === 'UPDATE_STATUS' && item.status) {
            details += ` to ${item.status}`;
          }

          if (action === 'ASSIGN') {
            if (item.assignee) {
              details += ` to ${item.assignee.firstName} ${item.assignee.lastName}`;
            } else {
              details += ` to Unassigned`;
            }
          }
        }

        const logEntry = {
          userId: req.user.id,
          action,
          entity,
          entityId: req.params.id || item?.id || null,
          details,
          ipAddress: getClientIp(req)
        };

        // Fire and forget - don't block response
        prisma.activityLog.create({ data: logEntry }).catch(err => {
          console.error('Activity log error:', err.message);
        });
      }

      return originalJson(data);
    };

    next();
  };
};

module.exports = { activityLogger };
