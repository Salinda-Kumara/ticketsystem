const prisma = require('../utils/prisma');
const { apiResponse, paginationMeta, generateTicketNumber, calculateSLADeadline } = require('../utils/helpers');
const path = require('path');
const multer = require('multer');

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', '..', 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10485760 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|txt|zip|rar|webp/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext || mime) return cb(null, true);
    cb(new Error('File type not allowed'));
  }
});

/**
 * GET /api/tickets
 */
const getTickets = async (req, res) => {
  try {
    const {
      page = 1, limit = 20, status, priority, category,
      assignee, department, search, sortBy = 'createdAt', sortOrder = 'desc',
      dateFrom, dateTo
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {};

    // Role-based filtering: employees only see their own tickets
    if (req.user.role === 'EMPLOYEE') {
      where.creatorId = req.user.id;
    }

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (category) where.categoryId = category;
    if (assignee) where.assigneeId = assignee;
    if (department) where.departmentId = department;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (search) {
      const searchUpper = search.toUpperCase().replace(' ', '_');
      const validStatuses = ['OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED', 'REOPENED'];
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      
      const orConditions = [
        { title: { contains: search, mode: 'insensitive' } },
        { ticketNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { category: { name: { contains: search, mode: 'insensitive' } } },
        { creator: { firstName: { contains: search, mode: 'insensitive' } } },
        { creator: { lastName: { contains: search, mode: 'insensitive' } } },
        { assignee: { firstName: { contains: search, mode: 'insensitive' } } },
        { assignee: { lastName: { contains: search, mode: 'insensitive' } } }
      ];

      const matchedStatuses = validStatuses.filter(s => s.includes(searchUpper));
      if (matchedStatuses.length > 0) {
        orConditions.push({ status: { in: matchedStatuses } });
      }

      const matchedPriorities = validPriorities.filter(p => p.includes(searchUpper));
      if (matchedPriorities.length > 0) {
        orConditions.push({ priority: { in: matchedPriorities } });
      }

      where.OR = orConditions;
    }

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: { select: { id: true, name: true, icon: true } },
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
          department: { select: { id: true, name: true } },
          _count: { select: { comments: true, attachments: true } }
        }
      }),
      prisma.ticket.count({ where })
    ]);

    return apiResponse(res, 200, {
      tickets,
      pagination: paginationMeta(total, page, limit)
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    return apiResponse(res, 500, null, 'Failed to fetch tickets.');
  }
};

/**
 * GET /api/tickets/:id
 */
const getTicketById = async (req, res) => {
  try {
    const ticket = await prisma.ticket.findUnique({
      where: { id: req.params.id },
      include: {
        category: { select: { id: true, name: true, icon: true } },
        creator: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
        department: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            author: { select: { id: true, firstName: true, lastName: true, avatar: true, role: true } }
          }
        },
        attachments: true,
        history: { orderBy: { createdAt: 'desc' } }
      }
    });

    if (!ticket) return apiResponse(res, 404, null, 'Ticket not found.');

    // Fetch user names for history
    if (ticket.history && ticket.history.length > 0) {
      const userIds = [...new Set(ticket.history.map(h => h.changedBy))];
      const users = await prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true, firstName: true, lastName: true }
      });
      const userMap = Object.fromEntries(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));
      ticket.history = ticket.history.map(h => ({
        ...h,
        changedByName: userMap[h.changedBy] || 'System'
      }));
    }

    // Employees can only view their own tickets
    if (req.user.role === 'EMPLOYEE' && ticket.creatorId !== req.user.id) {
      return apiResponse(res, 403, null, 'Access denied.');
    }

    // Filter internal notes for employees
    if (req.user.role === 'EMPLOYEE') {
      ticket.comments = ticket.comments.filter(c => !c.isInternal);
    }

    return apiResponse(res, 200, ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    return apiResponse(res, 500, null, 'Failed to fetch ticket.');
  }
};

/**
 * POST /api/tickets
 */
const createTicket = async (req, res) => {
  try {
    const { title, description, categoryId, priority, departmentId } = req.body;

    if (!title || !description || !categoryId) {
      return apiResponse(res, 400, null, 'Title, description, and category are required.');
    }

    const ticketNumber = await generateTicketNumber(prisma);
    const slaDeadline = await calculateSLADeadline(prisma, priority || 'MEDIUM', categoryId);

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        categoryId,
        priority: priority || 'MEDIUM',
        departmentId: departmentId || null,
        creatorId: req.user.id,
        slaDeadline
      },
      include: {
        category: { select: { id: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        department: { select: { id: true, name: true } }
      }
    });

    // Create history entry
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        field: 'status',
        oldValue: null,
        newValue: 'OPEN',
        changedBy: req.user.id
      }
    });

    // Notify admins and team leaders about new ticket
    const io = req.app.get('io');
    if (io) {
      io.to('staff').emit('ticket:new', ticket);
    }

    return apiResponse(res, 201, ticket, 'Ticket created successfully.');
  } catch (error) {
    console.error('Create ticket error:', error);
    return apiResponse(res, 500, null, 'Failed to create ticket.');
  }
};

/**
 * PUT /api/tickets/:id
 */
const updateTicket = async (req, res) => {
  try {
    const { title, description, categoryId, priority, departmentId } = req.body;

    const existing = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!existing) return apiResponse(res, 404, null, 'Ticket not found.');

    // Track changes for history
    const changes = [];
    if (priority && priority !== existing.priority) {
      changes.push({ field: 'priority', oldValue: existing.priority, newValue: priority });
    }
    if (categoryId && categoryId !== existing.categoryId) {
      changes.push({ field: 'category', oldValue: existing.categoryId, newValue: categoryId });
    }

    const updateData = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (categoryId) updateData.categoryId = categoryId;
    if (priority) {
      updateData.priority = priority;
      updateData.slaDeadline = await calculateSLADeadline(prisma, priority, categoryId || existing.categoryId);
    }
    if (departmentId !== undefined) updateData.departmentId = departmentId;

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    // Save history
    if (changes.length > 0) {
      await prisma.ticketHistory.createMany({
        data: changes.map(c => ({ ...c, ticketId: ticket.id, changedBy: req.user.id }))
      });
    }

    return apiResponse(res, 200, ticket, 'Ticket updated successfully.');
  } catch (error) {
    console.error('Update ticket error:', error);
    return apiResponse(res, 500, null, 'Failed to update ticket.');
  }
};

/**
 * PUT /api/tickets/:id/status
 */
const updateTicketStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return apiResponse(res, 400, null, 'Status is required.');

    const existing = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!existing) return apiResponse(res, 404, null, 'Ticket not found.');

    if (req.user.role === 'EMPLOYEE') {
      if (existing.creatorId !== req.user.id) {
        return apiResponse(res, 403, null, 'Access denied.');
      }
      if (existing.status !== 'RESOLVED' || !['CLOSED', 'REOPENED'].includes(status)) {
        return apiResponse(res, 403, null, 'Employees can only accept or reject resolved tickets.');
      }
    }

    const updateData = { status };
    if (status === 'RESOLVED') updateData.resolvedAt = new Date();
    if (status === 'CLOSED') updateData.closedAt = new Date();
    if (status === 'REOPENED') {
      updateData.resolvedAt = null;
      updateData.closedAt = null;
    }

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignee: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    // Save history
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        field: 'status',
        oldValue: existing.status,
        newValue: status,
        changedBy: req.user.id
      }
    });

    // Create notification for ticket creator
    await prisma.notification.create({
      data: {
        userId: ticket.creatorId,
        title: 'Ticket Status Updated',
        message: `Ticket ${ticket.ticketNumber} status changed to ${status}`,
        type: 'ticket_status',
        link: `/tickets/${ticket.id}`
      }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${ticket.creatorId}`).emit('notification:new');
      io.to(`ticket_${ticket.id}`).emit('ticket:updated', ticket);
    }

    return apiResponse(res, 200, ticket, `Ticket status updated to ${status}.`);
  } catch (error) {
    console.error('Update status error:', error);
    return apiResponse(res, 500, null, 'Failed to update ticket status.');
  }
};

/**
 * PUT /api/tickets/:id/assign
 */
const assignTicket = async (req, res) => {
  try {
    const { assigneeId } = req.body;

    const existing = await prisma.ticket.findUnique({ where: { id: req.params.id } });
    if (!existing) return apiResponse(res, 404, null, 'Ticket not found.');

    const ticket = await prisma.ticket.update({
      where: { id: req.params.id },
      data: {
        assigneeId,
        status: existing.status === 'OPEN' ? 'IN_PROGRESS' : existing.status
      },
      include: {
        assignee: { select: { id: true, firstName: true, lastName: true, email: true } },
        creator: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    // History
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        field: 'assignee',
        oldValue: existing.assigneeId,
        newValue: assigneeId,
        changedBy: req.user.id
      }
    });

    // Notify assignee
    if (assigneeId) {
      await prisma.notification.create({
        data: {
          userId: assigneeId,
          title: 'Ticket Assigned to You',
          message: `Ticket ${ticket.ticketNumber}: ${ticket.title}`,
          type: 'ticket_assigned',
          link: `/tickets/${ticket.id}`
        }
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${assigneeId}`).emit('notification:new');
      }
    }

    return apiResponse(res, 200, ticket, 'Ticket assigned successfully.');
  } catch (error) {
    console.error('Assign ticket error:', error);
    return apiResponse(res, 500, null, 'Failed to assign ticket.');
  }
};

/**
 * POST /api/tickets/:id/attachments
 */
const uploadAttachments = [
  upload.array('files', 5),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return apiResponse(res, 400, null, 'No files uploaded.');
      }

      const attachments = await Promise.all(
        req.files.map(file =>
          prisma.attachment.create({
            data: {
              ticketId: req.params.id,
              fileName: file.originalname,
              filePath: `/uploads/${file.filename}`,
              fileSize: file.size,
              mimeType: file.mimetype
            }
          })
        )
      );

      return apiResponse(res, 201, attachments, 'Files uploaded successfully.');
    } catch (error) {
      console.error('Upload error:', error);
      return apiResponse(res, 500, null, 'Failed to upload files.');
    }
  }
];

module.exports = {
  getTickets, getTicketById, createTicket, updateTicket,
  updateTicketStatus, assignTicket, uploadAttachments
};
