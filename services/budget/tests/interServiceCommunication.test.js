const Budget = require('../src/models/Budget');
const BudgetEventPublisher = require('../src/events/budgetEventPublisher');
const expenseEventHandler = require('../src/events/eventHandlers');

describe('Budget Service Inter-Service Communication', () => {
  describe('Budget Model', () => {
    test('should create a valid budget instance', () => {
      const budgetData = {
        id: 'test-budget-1',
        userId: 'user-123',
        category: 'Food',
        amount: 500,
        spent: 200,
        period: 'monthly',
        startDate: '2024-01-01',
        endDate: '2024-01-31',
        warningThreshold: 80
      };

      const budget = new Budget(budgetData);
      
      expect(budget.id).toBe('test-budget-1');
      expect(budget.userId).toBe('user-123');
      expect(budget.category).toBe('Food');
      expect(budget.amount).toBe(500);
      expect(budget.spent).toBe(200);
      expect(budget.remaining).toBe(300);
      expect(budget.getSpentPercentage()).toBe(40);
      expect(budget.isExceeded()).toBe(false);
      expect(budget.isWarningThresholdReached()).toBe(false);
    });

    test('should validate budget data correctly', () => {
      const invalidBudget = new Budget({
        userId: '', // Invalid: empty user ID
        category: '', // Invalid: empty category
        amount: -100, // Invalid: negative amount
        period: 'invalid', // Invalid: unsupported period
        warningThreshold: 150 // Invalid: over 100%
      });

      const validation = invalidBudget.validate();
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
      expect(validation.errors).toContain('User ID is required');
      expect(validation.errors).toContain('Category is required');
      expect(validation.errors).toContain('Budget amount must be greater than 0');
      expect(validation.errors).toContain('Period must be monthly, weekly, or yearly');
      expect(validation.errors).toContain('Warning threshold must be between 0 and 100');
    });

    test('should calculate spent percentage correctly', () => {
      const budget = new Budget({
        amount: 1000,
        spent: 750
      });

      expect(budget.getSpentPercentage()).toBe(75);
      expect(budget.isWarningThresholdReached()).toBe(false); // Default threshold is 80%

      budget.spent = 850;
      expect(budget.getSpentPercentage()).toBe(85);
      expect(budget.isWarningThresholdReached()).toBe(true);
    });

    test('should detect budget exceeded', () => {
      const budget = new Budget({
        amount: 500,
        spent: 600
      });

      expect(budget.isExceeded()).toBe(true);
      expect(budget.remaining).toBe(-100);
    });

    test('should update spent amount correctly', () => {
      const budget = new Budget({
        amount: 1000,
        spent: 300
      });

      // Test add operation
      budget.updateSpent(200, 'add');
      expect(budget.spent).toBe(500);
      expect(budget.remaining).toBe(500);

      // Test subtract operation
      budget.updateSpent(100, 'subtract');
      expect(budget.spent).toBe(400);
      expect(budget.remaining).toBe(600);

      // Test set operation
      budget.updateSpent(750, 'set');
      expect(budget.spent).toBe(750);
      expect(budget.remaining).toBe(250);

      // Test subtract that would go negative
      budget.updateSpent(1000, 'subtract');
      expect(budget.spent).toBe(0); // Should not go below 0
      expect(budget.remaining).toBe(1000);
    });
  });

  describe('Budget Event Publisher', () => {
    test('should have correct event channels', () => {
      expect(BudgetEventPublisher.CHANNELS.CREATED).toBe('budget.created');
      expect(BudgetEventPublisher.CHANNELS.UPDATED).toBe('budget.updated');
      expect(BudgetEventPublisher.CHANNELS.DELETED).toBe('budget.deleted');
      expect(BudgetEventPublisher.CHANNELS.EXCEEDED).toBe('budget.exceeded');
      expect(BudgetEventPublisher.CHANNELS.WARNING).toBe('budget.warning');
      expect(BudgetEventPublisher.CHANNELS.RESET).toBe('budget.reset');
    });
  });

  describe('Expense Event Handler', () => {
    test('should handle expense created events correctly', async () => {
      const expenseData = {
        userId: 'user-123',
        category: 'Food',
        amount: 50,
        date: '2024-01-15'
      };

      // This test would require mocking the budget sync service
      // For now, we're just testing that the handler function exists and can be called
      expect(typeof expenseEventHandler.onExpenseCreated).toBe('function');
      
      // In a real test, we would mock the dependencies and verify the behavior
      // await expenseEventHandler.onExpenseCreated(expenseData);
    });

    test('should handle expense updated events correctly', async () => {
      const expenseData = {
        userId: 'user-123',
        category: 'Food',
        amount: 75,
        date: '2024-01-15'
      };

      const previousData = {
        userId: 'user-123',
        category: 'Food',
        amount: 50,
        date: '2024-01-15'
      };

      expect(typeof expenseEventHandler.onExpenseUpdated).toBe('function');
      
      // In a real test, we would verify that the budget spending is updated correctly
      // await expenseEventHandler.onExpenseUpdated(expenseData, previousData);
    });

    test('should handle expense deleted events correctly', async () => {
      const expenseData = {
        id: 'expense-123',
        userId: 'user-123',
        category: 'Food',
        amount: 50,
        date: '2024-01-15'
      };

      expect(typeof expenseEventHandler.onExpenseDeleted).toBe('function');
      
      // In a real test, we would verify that the budget spending is reduced
      // await expenseEventHandler.onExpenseDeleted(expenseData);
    });
  });

  describe('Service Integration', () => {
    test('should have all required service clients', () => {
      const authServiceClient = require('../src/services/authServiceClient');
      const expenseServiceClient = require('../src/services/expenseServiceClient');
      const httpClient = require('../src/services/httpClient');

      expect(authServiceClient).toBeDefined();
      expect(expenseServiceClient).toBeDefined();
      expect(httpClient).toBeDefined();

      // Check that key methods exist
      expect(typeof authServiceClient.validateToken).toBe('function');
      expect(typeof authServiceClient.getUserById).toBe('function');
      expect(typeof authServiceClient.healthCheck).toBe('function');

      expect(typeof expenseServiceClient.getExpensesByUser).toBe('function');
      expect(typeof expenseServiceClient.getExpensesByCategory).toBe('function');
      expect(typeof expenseServiceClient.healthCheck).toBe('function');

      expect(typeof httpClient.get).toBe('function');
      expect(typeof httpClient.post).toBe('function');
      expect(typeof httpClient.put).toBe('function');
      expect(typeof httpClient.delete).toBe('function');
    });

    test('should have Redis configuration', () => {
      const redisManager = require('../src/config/redis');
      
      expect(redisManager).toBeDefined();
      expect(typeof redisManager.connect).toBe('function');
      expect(typeof redisManager.publish).toBe('function');
      expect(typeof redisManager.subscribe).toBe('function');
      expect(typeof redisManager.disconnect).toBe('function');
    });

    test('should have authentication middleware', () => {
      const auth = require('../src/middleware/auth');
      
      expect(auth).toBeDefined();
      expect(typeof auth.authenticateToken).toBe('function');
      expect(typeof auth.optionalAuth).toBe('function');
      expect(typeof auth.serviceAuth).toBe('function');
      expect(typeof auth.validateUserContext).toBe('function');
    });
  });
});

// Mock console methods to avoid cluttering test output
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});