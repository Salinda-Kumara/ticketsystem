const prisma = require('../utils/prisma');
const { apiResponse } = require('../utils/helpers');

const getStats = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'EMPLOYEE') {
      where.creatorId = req.user.id;
    } else if (req.user.role === 'AGENT') {
      // Agents see only their assigned tickets stats
      where.assigneeId = req.user.id;
    }

    const [
      totalTickets, openTickets, inProgressTickets, pendingTickets,
      resolvedTickets, closedTickets, reopenedTickets, criticalTickets, slaBreached,
      recentTickets, categoryStats, priorityStats
    ] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.count({ where: { ...where, status: 'OPEN' } }),
      prisma.ticket.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { ...where, status: 'PENDING' } }),
      prisma.ticket.count({ where: { ...where, status: 'RESOLVED' } }),
      prisma.ticket.count({ where: { ...where, status: 'CLOSED' } }),
      prisma.ticket.count({ where: { ...where, status: 'REOPENED' } }),
      prisma.ticket.count({ where: { ...where, priority: 'CRITICAL', status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.ticket.count({ where: { ...where, slaBreached: true, status: { notIn: ['CLOSED', 'RESOLVED'] } } }),
      prisma.ticket.findMany({
        where,
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { firstName: true, lastName: true } },
          assignee: { select: { firstName: true, lastName: true } },
          category: { select: { name: true } }
        }
      }),
      prisma.ticket.groupBy({
        by: ['categoryId'],
        _count: { id: true },
        where: { ...where, status: { notIn: ['CLOSED'] } }
      }),
      prisma.ticket.groupBy({
        by: ['priority'],
        _count: { id: true },
        where: { ...where, status: { notIn: ['CLOSED'] } }
      })
    ]);

    // Get category names for stats
    const categories = await prisma.category.findMany({ select: { id: true, name: true } });
    const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.name]));
    const categoryData = categoryStats.map(s => ({
      name: categoryMap[s.categoryId] || 'Unknown',
      count: s._count.id
    }));

    // Technician workload
    const techWorkload = await prisma.user.findMany({
      where: { role: { in: ['AGENT', 'TEAM_LEADER'] }, isActive: true },
      select: {
        id: true, firstName: true, lastName: true,
        _count: {
          select: {
            assignedTickets: { where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING'] } } }
          }
        }
      },
      orderBy: { firstName: 'asc' }
    });

    // Weekly trend (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyTickets = await prisma.ticket.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });

    const dailyCounts = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyCounts[key] = 0;
    }
    weeklyTickets.forEach(t => {
      const key = t.createdAt.toISOString().split('T')[0];
      if (dailyCounts[key] !== undefined) dailyCounts[key]++;
    });

    const totalActive = openTickets + inProgressTickets + pendingTickets;
    const slaCompliance = totalActive > 0
      ? Math.round(((totalActive - slaBreached) / totalActive) * 100)
      : 100;

    return apiResponse(res, 200, {
      overview: {
        totalTickets, openTickets, inProgressTickets, pendingTickets,
        resolvedTickets, closedTickets, reopenedTickets, criticalTickets, slaBreached, slaCompliance
      },
      recentTickets,
      categoryData,
      priorityData: priorityStats.map(s => ({ name: s.priority, count: s._count.id })),
      techWorkload: techWorkload.map(t => ({
        id: t.id, name: `${t.firstName} ${t.lastName}`,
        activeTickets: t._count.assignedTickets
      })),
      weeklyTrend: Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return apiResponse(res, 500, null, 'Failed to fetch dashboard stats.');
  }
};

module.exports = { getStats };
