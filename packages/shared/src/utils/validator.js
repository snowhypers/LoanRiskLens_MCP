// Request validation schemas using Joi

const Joi = require('joi');

// User validation schemas
const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
  occupation: Joi.string().max(100).optional(),
  employerName: Joi.string().max(255).optional(),
  monthlyIncome: Joi.number().min(0).max(9999999999).optional(),
});

const userIdSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

// Transaction validation schemas
const createTransactionSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  amount: Joi.number().positive().required(),
  type: Joi.string().valid('CREDIT', 'DEBIT').required(),
  status: Joi.string().valid('SUCCESS', 'FAILED', 'PENDING').required(),
  category: Joi.string().max(50).required(),
  description: Joi.string().max(500).optional(),
});

const transactionQuerySchema = Joi.object({
  userId: Joi.string().uuid().required(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  limit: Joi.number().integer().min(1).max(1000).default(100),
  offset: Joi.number().integer().min(0).default(0),
});

// Savings validation schemas
const createSavingsSchema = Joi.object({
  userId: Joi.string().uuid().required(),
  depositAmount: Joi.number().min(0).optional(),
  withdrawalAmount: Joi.number().min(0).optional(),
  balance: Joi.number().optional(),
});

// Authentication schemas
const loginSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
  password: Joi.string().min(6).required(),
});

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
  password: Joi.string().min(6).required(),
  occupation: Joi.string().max(100).optional(),
});

// Analysis request schemas
const creditworthinessSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

const financialBehaviorSchema = Joi.object({
  userId: Joi.string().uuid().required(),
});

/**
 * Validate data against schema
 * @param {Object} data - Data to validate
 * @param {Joi.Schema} schema - Joi schema
 * @returns {Object} Validated data
 * @throws {Error} Validation error
 */
function validate(data, schema) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const errors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
    }));
    const validationError = new Error('Validation failed');
    validationError.details = errors;
    throw validationError;
  }

  return value;
}

module.exports = {
  createUserSchema,
  userIdSchema,
  createTransactionSchema,
  transactionQuerySchema,
  createSavingsSchema,
  loginSchema,
  registerSchema,
  creditworthinessSchema,
  financialBehaviorSchema,
  validate,
};
