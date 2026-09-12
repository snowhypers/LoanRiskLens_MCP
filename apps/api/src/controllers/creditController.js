// Credit Controller - Main creditworthiness analysis endpoints

const creditService = require('@loan-risk-lens/application/services/credit');
const { validate, creditworthinessSchema, financialBehaviorSchema, userIdSchema } = require('shared/utils/validator');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('shared/utils/logger');

/**
 * Analyze creditworthiness
 * POST /api/credit/creditworthiness
 */
const analyzeCreditworthiness = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const validatedData = validate({ userId }, creditworthinessSchema);

  logger.info('Creditworthiness analysis requested', { userId });

  const analysis = await creditService.analyzeCreditworthiness(validatedData.userId);

  res.json({
    success: true,
    data: analysis,
  });
});

/**
 * Analyze financial behavior
 * POST /api/credit/financial-behavior
 */
const analyzeFinancialBehavior = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const validatedData = validate({ userId }, financialBehaviorSchema);

  logger.info('Financial behavior analysis requested', { userId });

  const analysis = await creditService.analyzeFinancialBehavior(validatedData.userId);

  res.json({
    success: true,
    data: analysis,
  });
});

/**
 * Generate underwriting report
 * POST /api/credit/underwriting-report
 */
const generateUnderwritingReport = asyncHandler(async (req, res) => {
  const { userId } = req.body;
  const validatedData = validate({ userId }, userIdSchema);

  logger.info('Underwriting report generation requested', { userId });

  const report = await creditService.generateUnderwritingReport(validatedData.userId);

  res.json({
    success: true,
    data: report,
  });
});

/**
 * Get credit score (simplified endpoint)
 * GET /api/credit/:userId/score
 */
const getCreditScore = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  logger.info('Quick credit score check requested', { userId });

  const analysis = await creditService.analyzeCreditworthiness(userId);

  res.json({
    success: true,
    data: {
      userId,
      creditScore: analysis.creditScore,
      riskLevel: analysis.riskLevel,
      decision: analysis.decision,
    },
  });
});

module.exports = {
  analyzeCreditworthiness,
  analyzeFinancialBehavior,
  generateUnderwritingReport,
  getCreditScore,
};
