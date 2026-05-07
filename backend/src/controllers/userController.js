const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { apiResponse, paginationMeta } = require('../utils/helpers');

/**
 * GET /api/users
 */
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, department, isActive } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }
    if (role) where.role = role;
    if (department) where.departmentId = department;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, email: true, firstName: true, lastName: true,
          phone: true, avatar: true, role: true, isActive: true,
          departmentId: true, lastLoginAt: true, createdAt: true,
          department: { select: { id: true, name: true } },
          _count: { select: { assignedTickets: true } }
        }
      }),
      prisma.user.count({ where })
    ]);

    return apiResponse(res, 200, {
      users,
      pagination: paginationMeta(total, page, limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    return apiResponse(res, 500, null, 'Failed to fetch users.');
  }
};

/**
 * GET /api/users/:id
 */
const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatar: true, role: true, isActive: true,
        departmentId: true, lastLoginAt: true, lastLoginIp: true,
        createdAt: true, updatedAt: true,
        department: { select: { id: true, name: true } },
        _count: { select: { assignedTickets: true, createdTickets: true } }
      }
    });

    if (!user) return apiResponse(res, 404, null, 'User not found.');
    return apiResponse(res, 200, user);
  } catch (error) {
    console.error('Get user error:', error);
    return apiResponse(res, 500, null, 'Failed to fetch user.');
  }
};

/**
 * POST /api/users
 */
const createUser = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, role, departmentId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return apiResponse(res, 400, null, 'Required fields missing.');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return apiResponse(res, 409, null, 'Email already exists.');

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email, password: hashedPassword, firstName, lastName,
        phone, role: role || 'EMPLOYEE', departmentId
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, departmentId: true, createdAt: true,
        department: { select: { id: true, name: true } }
      }
    });

    return apiResponse(res, 201, user, 'User created successfully.');
  } catch (error) {
    console.error('Create user error:', error);
    return apiResponse(res, 500, null, 'Failed to create user.');
  }
};

/**
 * PUT /api/users/:id
 */
const updateUser = async (req, res) => {
  try {
    const { firstName, lastName, phone, role, departmentId, isActive } = req.body;

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { firstName, lastName, phone, role, departmentId, isActive },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, role: true, isActive: true, departmentId: true,
        department: { select: { id: true, name: true } }
      }
    });

    return apiResponse(res, 200, user, 'User updated successfully.');
  } catch (error) {
    console.error('Update user error:', error);
    return apiResponse(res, 500, null, 'Failed to update user.');
  }
};

/**
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res) => {
  try {
    // Soft delete - deactivate
    await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    return apiResponse(res, 200, null, 'User deactivated successfully.');
  } catch (error) {
    console.error('Delete user error:', error);
    return apiResponse(res, 500, null, 'Failed to deactivate user.');
  }
};

/**
 * GET /api/users/agents/list - Get all active agents/team leaders for assignment
 */
const getAgents = async (req, res) => {
  try {
    const agents = await prisma.user.findMany({
      where: {
        role: { in: ['AGENT', 'TEAM_LEADER', 'ADMIN'] },
        isActive: true
      },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        role: true, departmentId: true,
        department: { select: { id: true, name: true } },
        _count: { select: { assignedTickets: { where: { status: { in: ['OPEN', 'IN_PROGRESS', 'PENDING'] } } } } }
      },
      orderBy: { firstName: 'asc' }
    });

    return apiResponse(res, 200, agents);
  } catch (error) {
    console.error('Get agents error:', error);
    return apiResponse(res, 500, null, 'Failed to fetch agents.');
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser, getAgents };
