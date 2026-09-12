// Transaction Controller

const transactionService = require('@loan-risk-lens/application/services/transaction');
const { validate, createTransactionSchema, transactionQuerySchema } = require('shared/utils/validator');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('shared/utils/logger');

/**
 * Create a new transaction
 * POST /api/transactions
 */
const createTransaction = asyncHandler(async (req, res) => {
  const validatedData = validate(req.body, createTransactionSchema);
  const transaction = await transactionService.createTransaction(validatedData);

  res.status(201).json({
    success: true,
    data: transaction,
  });
});

/**
 * Get user's transactions
 * GET /api/transactions/:userId
 */
const getTransactions = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const options = {
    startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
    limit: parseInt(req.query.limit) || 100,
    offset: parseInt(req.query.offset) || 0,
  };

  const transactions = await transactionService.getTransactions(userId, options);

  res.json({
    success: true,
    data: transactions,
    meta: {
      limit: options.limit,
      offset: options.offset,
      count: transactions.length,
    },
  });
});

/**
 * Get transaction analysis for a user
 * GET /api/transactions/:userId/analysis
 */
const getTransactionAnalysis = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const analysis = await transactionService.analyzeTransactions(userId);

  res.json({
    success: true,
    data: analysis,
  });
});

/**
 * Get failed transactions for a user
 * GET /api/transactions/:userId/failed
 */
const getFailedTransactions = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const limit = parseInt(req.query.limit) || 10;
  const failedTransactions = await transactionService.getFailedTransactions(userId, limit);

  res.json({
    success: true,
    data: failedTransactions,
    meta: {
      count: failedTransactions.length,
    },
  });
});

module.exports = {
  createTransaction,
  getTransactions,
  getTransactionAnalysis,
  getFailedTransactions,
};
