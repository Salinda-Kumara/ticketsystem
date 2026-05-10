const prisma = require('../utils/prisma');
const { apiResponse } = require('../utils/helpers');
const ExcelJS = require('exceljs');

const getMonthlyReport = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    const where = {};
    let startDate = null;
    
    if (month !== 'all') {
      startDate = new Date(year || new Date().getFullYear(), (month || new Date().getMonth() + 1) - 1, 1);
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59);
      where.createdAt = { gte: startDate, lte: endDate };
    } else {
      startDate = new Date(year || new Date().getFullYear(), 0, 1);
      const endDate = new Date(year || new Date().getFullYear(), 11, 31, 23, 59, 59);
      where.createdAt = { gte: startDate, lte: endDate };
    }

    const [total, byStatus, byPriority, byCategory, avgResolution] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.groupBy({ by: ['status'], _count: { id: true }, where }),
      prisma.ticket.groupBy({ by: ['priority'], _count: { id: true }, where }),
      prisma.ticket.groupBy({
        by: ['categoryId'],
        _count: { id: true },
        where,
        orderBy: { _count: { id: 'desc' } }
      }),
      prisma.ticket.findMany({
        where: { ...where, resolvedAt: { not: null } },
        select: { createdAt: true, resolvedAt: true }
      })
    ]);

    const categories = await prisma.category.findMany({ select: { id: true, name: true } });
    const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

    // Calculate average resolution time in hours
    let avgResolutionHours = 0;
    if (avgResolution.length > 0) {
      const totalHours = avgResolution.reduce((sum, t) => {
        return sum + (t.resolvedAt - t.createdAt) / (1000 * 60 * 60);
      }, 0);
      avgResolutionHours = Math.round(totalHours / avgResolution.length * 10) / 10;
    }

    return apiResponse(res, 200, {
      period: { month: startDate ? startDate.getMonth() + 1 : 'all', year: startDate ? startDate.getFullYear() : 'all' },
      total,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
      byPriority: byPriority.map(s => ({ priority: s.priority, count: s._count.id })),
      byCategory: byCategory.map(s => ({ category: catMap[s.categoryId] || 'Unknown', count: s._count.id })),
      avgResolutionHours,
      resolved: avgResolution.length
    });
  } catch (error) {
    console.error('Monthly report error:', error);
    return apiResponse(res, 500, null, 'Failed to generate report.');
  }
};

const exportTickets = async (req, res) => {
  try {
    const { dateFrom, dateTo, status, priority, search } = req.query;
    const where = {};
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
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

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        category: { select: { name: true } },
        creator: { select: { firstName: true, lastName: true, email: true } },
        assignee: { select: { firstName: true, lastName: true } },
        department: { select: { name: true } },
        history: { 
          where: { field: 'status' },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const userIds = [...new Set(
      tickets.flatMap(t => {
        const resolveEvents = t.history.filter(h => h.newValue === 'RESOLVED');
        const closeEvents = t.history.filter(h => h.newValue === 'CLOSED');
        const ids = [];
        if (resolveEvents.length > 0) ids.push(resolveEvents[resolveEvents.length - 1].changedBy);
        if (closeEvents.length > 0) ids.push(closeEvents[closeEvents.length - 1].changedBy);
        return ids;
      }).filter(Boolean)
    )];

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true }
    });
    const userMap = Object.fromEntries(users.map(u => [u.id, `${u.firstName} ${u.lastName}`]));

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Tickets');

    sheet.columns = [
      { header: 'Ticket #', key: 'ticketNumber', width: 15 },
      { header: 'Title', key: 'title', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Category', key: 'category', width: 20 },
      { header: 'Department', key: 'department', width: 20 },
      { header: 'Created By', key: 'creator', width: 25 },
      { header: 'Assigned To', key: 'assignee', width: 25 },
      { header: 'SLA Breached', key: 'slaBreached', width: 12 },
      { header: 'Created', key: 'createdAt', width: 20 },
      { header: 'Resolved', key: 'resolvedAt', width: 20 },
      { header: 'Resolved By', key: 'resolvedBy', width: 25 },
      { header: 'Time to Resolve', key: 'timeToResolve', width: 20 },
      { header: 'Closed Date', key: 'closedDate', width: 20 },
      { header: 'Closed By', key: 'closedBy', width: 25 }
    ];

    // Style header row
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1a2e' } };
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    tickets.forEach(t => {
      let resolvedBy = '-';
      let timeToResolve = '-';
      let closedBy = '-';
      let closedDate = '-';

      if (t.resolvedAt) {
        const resolveEvents = t.history.filter(h => h.newValue === 'RESOLVED');
        if (resolveEvents.length > 0) {
          const lastResolve = resolveEvents[resolveEvents.length - 1];
          resolvedBy = userMap[lastResolve.changedBy] || 'Unknown';
        }

        const startEvents = t.history.filter(h => h.newValue === 'IN_PROGRESS');
        const startTime = startEvents.length > 0 ? new Date(startEvents[0].createdAt) : new Date(t.createdAt);
        const diffMs = new Date(t.resolvedAt) - startTime;
        
        if (diffMs >= 0) {
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          timeToResolve = `${hours}h ${mins}m`;
        }
      }

      if (t.closedAt) {
        closedDate = t.closedAt.toISOString().replace('T', ' ').substring(0, 16);
        const closeEvents = t.history.filter(h => h.newValue === 'CLOSED');
        if (closeEvents.length > 0) {
          const lastClose = closeEvents[closeEvents.length - 1];
          closedBy = userMap[lastClose.changedBy] || 'Unknown';
        }
      }

      sheet.addRow({
        ticketNumber: t.ticketNumber,
        title: t.title,
        status: t.status,
        priority: t.priority,
        category: t.category?.name || '-',
        department: t.department?.name || '-',
        creator: `${t.creator.firstName} ${t.creator.lastName}`,
        assignee: t.assignee ? `${t.assignee.firstName} ${t.assignee.lastName}` : 'Unassigned',
        slaBreached: t.slaBreached ? 'Yes' : 'No',
        createdAt: t.createdAt.toISOString().replace('T', ' ').substring(0, 16),
        resolvedAt: t.resolvedAt ? t.resolvedAt.toISOString().replace('T', ' ').substring(0, 16) : '-',
        resolvedBy,
        timeToResolve,
        closedDate,
        closedBy
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets_report.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export error:', error);
    return apiResponse(res, 500, null, 'Failed to export tickets.');
  }
};

module.exports = { getMonthlyReport, exportTickets };
