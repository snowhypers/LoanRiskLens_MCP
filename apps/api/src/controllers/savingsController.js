// Savings Controller

const savingsService = require('@loan-risk-lens/application/services/savings');
const { validate, createSavingsSchema, userIdSchema } = require('shared/utils/validator');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('shared/utils/logger');

/**
 * Create a new savings record
 * POST /api/savings
 */
const createSavingsRecord = asyncHandler(async (req, res) => {
  const validatedData = validate(req.body, createSavingsSchema);
  const record = await savingsService.createSavingsRecord(validatedData);

  res.status(201).json({
    success: true,
    data: record,
  });
});

/**
 * Get user's savings records
 * GET /api/savings/:userId
 */
const getSavingsRecords = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const options = {
    limit: parseInt(req.query.limit) || 100,
    offset: parseInt(req.query.offset) || 0,
  };

  const records = await savingsService.getSavingsRecords(userId, options);

  res.json({
    success: true,
    data: records,
    meta: {
      limit: options.limit,
      offset: options.offset,
      count: records.length,
    },
  });
});

/**
 * Get savings analysis for a user
 * GET /api/savings/:userId/analysis
 */
const getSavingsAnalysis = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const analysis = await savingsService.analyzeSavings(userId);

  res.json({
    success: true,
    data: analysis,
  });
});

/**
 * Get current savings balance for a user
 * GET /api/savings/:userId/balance
 */
const getCurrentBalance = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const balance = await savingsService.getCurrentBalance(userId);

  res.json({
    success: true,
    data: {
      userId,
      balance,
      currency: 'INR',
    },
  });
});

module.exports = {
  createSavingsRecord,
  getSavingsRecords,
  getSavingsAnalysis,
  getCurrentBalance,
};
