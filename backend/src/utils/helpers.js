const crypto = require('crypto');

/**
 * Generate a unique ticket number like TKT-0001
 */
async function generateTicketNumber(prisma) {
  const lastTicket = await prisma.ticket.findFirst({
    orderBy: { createdAt: 'desc' },
    select: { ticketNumber: true }
  });

  let nextNum = 1;
  if (lastTicket) {
    const match = lastTicket.ticketNumber.match(/TKT-(\d+)/);
    if (match) nextNum = parseInt(match[1]) + 1;
  }

  return `TKT-${String(nextNum).padStart(5, '0')}`;
}

/**
 * Calculate SLA deadline based on priority and SLA rules
 */
async function calculateSLADeadline(prisma, priority, categoryId) {
  const slaRule = await prisma.sLARule.findFirst({
    where: {
      priority,
      isActive: true,
      OR: [
        { categoryId },
        { categoryId: null }
      ]
    },
    orderBy: { categoryId: 'desc' } // prefer category-specific rule
  });

  if (!slaRule) return null;

  const deadline = new Date();
  deadline.setMinutes(deadline.getMinutes() + slaRule.resolveTimeMin);
  return deadline;
}

/**
 * Format a standardized API response
 */
function apiResponse(res, statusCode, data, message = null) {
  const response = { success: statusCode >= 200 && statusCode < 300 };
  if (message) response.message = message;
  if (data !== undefined && data !== null) response.data = data;
  return res.status(statusCode).json(response);
}

/**
 * Format pagination metadata
 */
function paginationMeta(total, page, limit) {
  return {
    total,
    page: parseInt(page),
    limit: parseInt(limit),
    totalPages: Math.ceil(total / limit)
  };
}

/**
 * Generate a random reset token
 */
function generateResetToken() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Get client IP address
 */
function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
    || req.connection?.remoteAddress
    || req.ip
    || 'unknown';
}

module.exports = {
  generateTicketNumber,
  calculateSLADeadline,
  apiResponse,
  paginationMeta,
  generateResetToken,
  getClientIp
};
