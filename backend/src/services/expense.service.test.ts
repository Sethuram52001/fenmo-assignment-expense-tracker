import { ExpenseService } from './expense.service';
import { ExpenseRepository } from '../repositories/expense.repository';
import { IdempotencyRepository } from '../repositories/idempotency.repository';

// Mock the repositories completely
jest.mock('../repositories/expense.repository');
jest.mock('../repositories/idempotency.repository');

describe('ExpenseService', () => {
  let expenseService: ExpenseService;
  let mockExpenseRepo: jest.Mocked<ExpenseRepository>;
  let mockIdempotencyRepo: jest.Mocked<IdempotencyRepository>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create new instances (which are mocked)
    expenseService = new ExpenseService();
    
    // Grab the internal instances using any casting for testing
    mockExpenseRepo = (expenseService as any).expenseRepo;
    mockIdempotencyRepo = (expenseService as any).idempotencyRepo;
  });

  describe('createExpense', () => {
    const validExpenseData = {
      amount: 15000,
      category: 'Food',
      description: 'Lunch',
      date: '2024-04-24'
    };

    it('should create an expense successfully without an idempotency key', async () => {
      const mockResult = { id: '1', ...validExpenseData, date: new Date('2024-04-24'), created_at: new Date() };
      mockExpenseRepo.create.mockResolvedValue(mockResult);

      const result = await expenseService.createExpense(validExpenseData);

      expect(result.isDuplicate).toBe(false);
      expect(result.expense).toEqual(mockResult);
      expect(mockIdempotencyRepo.findByKey).not.toHaveBeenCalled();
      expect(mockExpenseRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 15000,
          category: 'Food',
          description: 'Lunch',
          date: expect.any(Date)
        }),
        undefined
      );
    });

    it('should create an expense if a NEW idempotency key is provided', async () => {
      const mockResult = { id: '1', ...validExpenseData, date: new Date('2024-04-24'), created_at: new Date() };
      const newKey = 'req-123';
      
      mockIdempotencyRepo.findByKey.mockResolvedValue(null); // Key not found
      mockExpenseRepo.create.mockResolvedValue(mockResult);

      const result = await expenseService.createExpense(validExpenseData, newKey);

      expect(result.isDuplicate).toBe(false);
      expect(mockIdempotencyRepo.findByKey).toHaveBeenCalledWith(newKey);
      expect(mockExpenseRepo.create).toHaveBeenCalledWith(expect.any(Object), newKey);
    });

    it('should return isDuplicate: true if an EXISTING idempotency key is provided', async () => {
      const existingKey = 'req-456';
      
      // Simulate finding an existing key
      mockIdempotencyRepo.findByKey.mockResolvedValue({ key: existingKey, created_at: new Date() });

      const result = await expenseService.createExpense(validExpenseData, existingKey);

      expect(result.isDuplicate).toBe(true);
      expect(result.expense).toBeUndefined();
      expect(mockIdempotencyRepo.findByKey).toHaveBeenCalledWith(existingKey);
      expect(mockExpenseRepo.create).not.toHaveBeenCalled(); // Should never attempt to create!
    });
  });

  describe('getExpenses', () => {
    it('should call repository findAll with correct parameters', async () => {
      mockExpenseRepo.findAll.mockResolvedValue([]);

      await expenseService.getExpenses('Food', 'date_asc');

      expect(mockExpenseRepo.findAll).toHaveBeenCalledWith('Food', false); // sortDesc = false
    });

    it('should default to descending sort if sort order is missing or date_desc', async () => {
      mockExpenseRepo.findAll.mockResolvedValue([]);

      await expenseService.getExpenses(undefined, 'date_desc');
      expect(mockExpenseRepo.findAll).toHaveBeenCalledWith(undefined, true);

      await expenseService.getExpenses(undefined, undefined);
      expect(mockExpenseRepo.findAll).toHaveBeenCalledWith(undefined, true);
    });
  });
});
