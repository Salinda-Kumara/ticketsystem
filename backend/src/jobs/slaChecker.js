const cron = require('node-cron');
const prisma = require('../utils/prisma');

/**
 * SLA Checker - runs every 60 seconds
 * Checks for tickets approaching/breaching SLA deadlines
 */
function startSLAChecker(io) {
  cron.schedule('*/60 * * * * *', async () => {
    try {
      const now = new Date();

      // Find tickets with breached SLA that haven't been marked yet
      const breachedTickets = await prisma.ticket.findMany({
        where: {
          slaDeadline: { lte: now },
          slaBreached: false,
          status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING'] }
        },
        include: {
          assignee: { select: { id: true, firstName: true, lastName: true } },
          creator: { select: { id: true } }
        }
      });

      for (const ticket of breachedTickets) {
        // Mark as breached
        await prisma.ticket.update({
          where: { id: ticket.id },
          data: { slaBreached: true }
        });

        // Notify assignee and admins
        const notifyUsers = [];
        if (ticket.assigneeId) notifyUsers.push(ticket.assigneeId);

        // Get all admins and team leaders
        const leaders = await prisma.user.findMany({
          where: { role: { in: ['ADMIN', 'TEAM_LEADER'] }, isActive: true },
          select: { id: true }
        });
        leaders.forEach(l => {
          if (!notifyUsers.includes(l.id)) notifyUsers.push(l.id);
        });

        // Create notifications
        const notifications = notifyUsers.map(userId => ({
          userId,
          title: '⚠️ SLA Breach',
          message: `Ticket ${ticket.ticketNumber} has breached its SLA deadline!`,
          type: 'sla_breach',
          link: `/tickets/${ticket.id}`
        }));

        if (notifications.length > 0) {
          await prisma.notification.createMany({ data: notifications });

          // Emit real-time alerts
          if (io) {
            notifyUsers.forEach(uid => {
              io.to(`user_${uid}`).emit('notification:new');
              io.to(`user_${uid}`).emit('sla:breach', {
                ticketId: ticket.id,
                ticketNumber: ticket.ticketNumber
              });
            });
          }
        }

        console.log(`⚠️ SLA breach: ${ticket.ticketNumber}`);
      }

      // Find tickets approaching SLA (within 15 minutes)
      const fifteenMinsFromNow = new Date(now.getTime() + 15 * 60 * 1000);
      const approachingTickets = await prisma.ticket.findMany({
        where: {
          slaDeadline: { gt: now, lte: fifteenMinsFromNow },
          slaBreached: false,
          status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING'] }
        },
        select: { id: true, ticketNumber: true, assigneeId: true, slaDeadline: true }
      });

      for (const ticket of approachingTickets) {
        if (ticket.assigneeId && io) {
          const remainingMs = ticket.slaDeadline - now;
          io.to(`user_${ticket.assigneeId}`).emit('sla:warning', {
            ticketId: ticket.id,
            ticketNumber: ticket.ticketNumber,
            remainingMinutes: Math.round(remainingMs / 60000)
          });
        }
      }
    } catch (error) {
      console.error('SLA checker error:', error.message);
    }
  });

  console.log('⏱️ SLA checker started (runs every 60s)');
}

module.exports = { startSLAChecker };
