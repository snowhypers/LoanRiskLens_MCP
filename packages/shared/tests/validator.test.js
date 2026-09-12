// Unit Tests for Validators

const {
  validate,
  createUserSchema,
  createTransactionSchema,
  creditworthinessSchema,
} = require('../src/utils/validator');

describe('Validators', () => {
  describe('createUserSchema', () => {
    it('should validate valid user data', () => {
      const validData = {
        name: 'John Doe',
        phone: '919876543210',
        occupation: 'Self Employed',
        monthlyIncome: 50000,
      };
      const result = validate(validData, createUserSchema);
      expect(result.name).toBe('John Doe');
      expect(result.phone).toBe('919876543210');
    });

    it('should reject invalid phone numbers', () => {
      const invalidData = {
        name: 'John Doe',
        phone: '123', // Too short
      };
      expect(() => validate(invalidData, createUserSchema)).toThrow();
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        name: 'John Doe',
        // Missing phone
      };
      expect(() => validate(invalidData, createUserSchema)).toThrow();
    });

    it('should strip unknown fields', () => {
      const data = {
        name: 'John Doe',
        phone: '919876543210',
        unknownField: 'should be removed',
      };
      const result = validate(data, createUserSchema);
      expect(result.unknownField).toBeUndefined();
    });
  });

  describe('createTransactionSchema', () => {
    it('should validate valid transaction data', () => {
      const validData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 5000,
        type: 'CREDIT',
        status: 'SUCCESS',
        category: 'SALARY',
      };
      const result = validate(validData, createTransactionSchema);
      expect(result.amount).toBe(5000);
      expect(result.type).toBe('CREDIT');
    });

    it('should reject invalid transaction type', () => {
      const invalidData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 5000,
        type: 'INVALID',
        status: 'SUCCESS',
        category: 'SALARY',
      };
      expect(() => validate(invalidData, createTransactionSchema)).toThrow();
    });

    it('should reject negative amounts', () => {
      const invalidData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
        amount: -100,
        type: 'CREDIT',
        status: 'SUCCESS',
        category: 'SALARY',
      };
      expect(() => validate(invalidData, createTransactionSchema)).toThrow();
    });

    it('should reject invalid UUID', () => {
      const invalidData = {
        userId: 'not-a-uuid',
        amount: 5000,
        type: 'CREDIT',
        status: 'SUCCESS',
        category: 'SALARY',
      };
      expect(() => validate(invalidData, createTransactionSchema)).toThrow();
    });
  });

  describe('creditworthinessSchema', () => {
    it('should validate valid user ID', () => {
      const validData = {
        userId: '550e8400-e29b-41d4-a716-446655440000',
      };
      const result = validate(validData, creditworthinessSchema);
      expect(result.userId).toBe('550e8400-e29b-41d4-a716-446655440000');
    });

    it('should reject missing user ID', () => {
      expect(() => validate({}, creditworthinessSchema)).toThrow();
    });
  });
});
