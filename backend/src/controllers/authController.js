const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const { apiResponse, getClientIp } = require('../utils/helpers');

// Generate JWT token
function generateToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
}

/**
 * POST /api/auth/register
 */
const register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, departmentId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return apiResponse(res, 400, null, 'Email, password, first name, and last name are required.');
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiResponse(res, 409, null, 'Email already registered.');
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        departmentId: departmentId || null,
        role: 'EMPLOYEE'
      },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        role: true, createdAt: true
      }
    });

    const token = generateToken(user.id);

    return apiResponse(res, 201, { user, token }, 'Registration successful.');
  } catch (error) {
    console.error('Register error:', error);
    return apiResponse(res, 500, null, 'Registration failed.');
  }
};

/**
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return apiResponse(res, 400, null, 'Email and password are required.');
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { department: { select: { id: true, name: true } } }
    });

    if (!user) {
      return apiResponse(res, 401, null, 'Invalid email or password.');
    }

    if (!user.isActive) {
      return apiResponse(res, 403, null, 'Account has been deactivated. Contact administrator.');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return apiResponse(res, 401, null, 'Invalid email or password.');
    }

    // Update last login info
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: getClientIp(req) }
    });

    // Log login activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN',
        entity: 'user',
        entityId: user.id,
        details: 'User logged in',
        ipAddress: getClientIp(req)
      }
    });

    const token = generateToken(user.id);

    const { password: _, ...userWithoutPassword } = user;

    return apiResponse(res, 200, { user: userWithoutPassword, token }, 'Login successful.');
  } catch (error) {
    console.error('Login error:', error);
    return apiResponse(res, 500, null, 'Login failed.');
  }
};

/**
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatar: true, role: true, departmentId: true,
        isActive: true, createdAt: true, updatedAt: true,
        department: { select: { id: true, name: true } }
      }
    });

    return apiResponse(res, 200, user);
  } catch (error) {
    console.error('GetMe error:', error);
    return apiResponse(res, 500, null, 'Failed to fetch profile.');
  }
};

/**
 * PUT /api/auth/profile
 */
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { firstName, lastName, phone },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatar: true, role: true, departmentId: true,
        department: { select: { id: true, name: true } }
      }
    });

    return apiResponse(res, 200, user, 'Profile updated.');
  } catch (error) {
    console.error('Update profile error:', error);
    return apiResponse(res, 500, null, 'Failed to update profile.');
  }
};

/**
 * PUT /api/auth/change-password
 */
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return apiResponse(res, 400, null, 'Current and new passwords are required.');
    }

    if (newPassword.length < 6) {
      return apiResponse(res, 400, null, 'New password must be at least 6 characters.');
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(currentPassword, user.password);

    if (!isValid) {
      return apiResponse(res, 401, null, 'Current password is incorrect.');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    return apiResponse(res, 200, null, 'Password changed successfully.');
  } catch (error) {
    console.error('Change password error:', error);
    return apiResponse(res, 500, null, 'Failed to change password.');
  }
};

module.exports = { register, login, getMe, updateProfile, changePassword };
