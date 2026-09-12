// Utility helper functions

/**
 * Calculate weighted score
 * @param {Object} scores - Object with score values
 * @param {Object} weights - Object with weight values
 * @returns {number} Weighted average score
 */
function calculateWeightedScore(scores, weights) {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [key, score] of Object.entries(scores)) {
    if (weights[key] !== undefined) {
      weightedSum += score * weights[key];
      totalWeight += weights[key];
    }
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Classify risk level based on score
 * @param {number} score - Credit score
 * @param {Object} thresholds - Risk thresholds
 * @returns {'LOW' | 'MEDIUM' | 'HIGH'} Risk level
 */
function classifyRiskLevel(score, thresholds) {
  if (score >= thresholds.low) return 'LOW';
  if (score >= thresholds.medium) return 'MEDIUM';
  return 'HIGH';
}

/**
 * Generate recommended loan amount based on score and risk
 * @param {number} score - Credit score
 * @param {string} riskLevel - Risk level
 * @param {Object} loanConfig - Loan configuration
 * @returns {number} Recommended loan amount
 */
function calculateRecommendedLoanAmount(score, riskLevel, loanConfig) {
  const multiplier = riskLevel === 'LOW' ? 0.7 : riskLevel === 'MEDIUM' ? 0.5 : 0.2;
  const baseAmount = loanConfig.defaultAmount;
  const maxAmount = loanConfig.maxAmount;
  const minAmount = loanConfig.minAmount;

  const recommended = Math.min(maxAmount, Math.max(minAmount, baseAmount * (score / 100) * multiplier * 10));
  return Math.round(recommended / 1000) * 1000; // Round to nearest 1000
}

/**
 * Format currency
 * @param {number} amount - Amount to format
 * @param {string} [currency='INR'] - Currency code
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'INR') {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate repayment confidence
 * @param {number} score - Credit score
 * @param {string} riskLevel - Risk level
 * @returns {'HIGH' | 'MEDIUM' | 'LOW'} Repayment confidence
 */
function calculateRepaymentConfidence(score, riskLevel) {
  if (riskLevel === 'LOW' && score >= 70) return 'HIGH';
  if (riskLevel === 'MEDIUM' && score >= 50) return 'MEDIUM';
  return 'LOW';
}

/**
 * Generate decision based on score and risk
 * @param {number} score - Credit score
 * @param {string} riskLevel - Risk level
 * @returns {'APPROVED' | 'REVIEW' | 'REJECTED'} Credit decision
 */
function generateCreditDecision(score, riskLevel) {
  if (riskLevel === 'LOW' && score >= 60) return 'APPROVED';
  if (riskLevel === 'MEDIUM' && score >= 40) return 'REVIEW';
  return 'REJECTED';
}

/**
 * Calculate date range for analysis
 * @param {number} months - Number of months to look back
 * @returns {Date} Start date
 */
function getDateRange(months = 6) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);
  return { startDate, endDate };
}

/**
 * Sleep utility for async operations
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate audit log entry
 * @param {Object} data - Audit data
 * @returns {Object} Formatted audit log entry
 */
function createAuditEntry(data) {
  return {
    id: data.id || require('uuid').v4(),
    userId: data.userId,
    action: data.action,
    resource: data.resource,
    details: data.details || {},
    ipAddress: data.ipAddress,
    userAgent: data.userAgent,
    createdAt: new Date(),
  };
}

module.exports = {
  calculateWeightedScore,
  classifyRiskLevel,
  calculateRecommendedLoanAmount,
  formatCurrency,
  calculateRepaymentConfidence,
  generateCreditDecision,
  getDateRange,
  sleep,
  createAuditEntry,
};
