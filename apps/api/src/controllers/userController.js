// User Controller

const userRepository = require('@loan-risk-lens/infrastructure/repositories/user');
const { validate, createUserSchema, userIdSchema } = require('shared/utils/validator');
const { asyncHandler } = require('../middleware/errorHandler');
const { generateToken } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const logger = require('shared/utils/logger');

/**
 * Create a new user
 * POST /api/users
 */
const createUser = asyncHandler(async (req, res) => {
  const validatedData = validate(req.body, createUserSchema);

  // Check if user already exists
  const existingUser = await userRepository.findByPhone(validatedData.phone);
  if (existingUser) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'A user with this phone number already exists',
    });
  }

  const user = await userRepository.create(validatedData);

  // Generate token for the new user
  const token = generateToken({
    userId: user.id,
    phone: user.phone,
    role: 'user',
  });

  res.status(201).json({
    success: true,
    data: user,
    token,
  });
});

/**
 * Get user by ID
 * GET /api/users/:userId
 */
const getUserById = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  validate({ userId }, userIdSchema);

  const user = await userRepository.findById(userId);

  if (!user) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    data: user,
  });
});

/**
 * Update user
 * PUT /api/users/:userId
 */
const updateUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  validate({ userId }, userIdSchema);

  const user = await userRepository.update(userId, req.body);

  if (!user) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    data: user,
  });
});

/**
 * List users
 * GET /api/users
 */
const listUsers = asyncHandler(async (req, res) => {
  const options = {
    limit: parseInt(req.query.limit) || 20,
    offset: parseInt(req.query.offset) || 0,
  };

  const result = await userRepository.list(options);

  res.json({
    success: true,
    data: result.users,
    meta: {
      total: result.total,
      limit: options.limit,
      offset: options.offset,
    },
  });
});

/**
 * Delete user
 * DELETE /api/users/:userId
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  validate({ userId }, userIdSchema);

  const deleted = await userRepository.delete(userId);

  if (!deleted) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'User not found',
    });
  }

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
});

module.exports = {
  createUser,
  getUserById,
  updateUser,
  listUsers,
  deleteUser,
};
