const prisma = require('../utils/prisma');
const { apiResponse } = require('../utils/helpers');

const getComments = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const where = { ticketId };
    
    // Employees cannot see internal notes
    if (req.user.role === 'EMPLOYEE') {
      where.isInternal = false;
    }

    const comments = await prisma.ticketComment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } }
      }
    });

    return apiResponse(res, 200, comments);
  } catch (error) {
    return apiResponse(res, 500, null, 'Failed to fetch comments.');
  }
};

const createComment = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { content, isInternal } = req.body;

    if (!content) return apiResponse(res, 400, null, 'Comment content is required.');

    // Employees cannot create internal notes
    const internalFlag = req.user.role === 'EMPLOYEE' ? false : (isInternal || false);

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        authorId: req.user.id,
        content,
        isInternal: internalFlag
      },
      include: {
        author: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } }
      }
    });

    // Notify relevant parties
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      select: { creatorId: true, assigneeId: true, ticketNumber: true }
    });

    if (ticket) {
      const notifyUsers = new Set();
      if (ticket.creatorId !== req.user.id) notifyUsers.add(ticket.creatorId);
      if (ticket.assigneeId && ticket.assigneeId !== req.user.id) notifyUsers.add(ticket.assigneeId);

      const notifications = [...notifyUsers].map(userId => ({
        userId,
        title: internalFlag ? 'New Internal Note' : 'New Comment',
        message: `New ${internalFlag ? 'note' : 'comment'} on ${ticket.ticketNumber}`,
        type: 'ticket_comment',
        link: `/tickets/${ticketId}`
      }));

      if (notifications.length > 0) {
        await prisma.notification.createMany({ data: notifications });
        const io = req.app.get('io');
        if (io) {
          notifyUsers.forEach(uid => io.to(`user_${uid}`).emit('notification:new'));
          io.to(`ticket_${ticketId}`).emit('comment:new', comment);
        }
      }
    }

    return apiResponse(res, 201, comment, 'Comment added.');
  } catch (error) {
    console.error('Create comment error:', error);
    return apiResponse(res, 500, null, 'Failed to add comment.');
  }
};

module.exports = { getComments, createComment };
