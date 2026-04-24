import { ExpenseRepository } from '../repositories/expense.repository';
import { IdempotencyRepository } from '../repositories/idempotency.repository';

export class ExpenseService {
  private expenseRepo: ExpenseRepository;
  private idempotencyRepo: IdempotencyRepository;

  constructor() {
    this.expenseRepo = new ExpenseRepository();
    this.idempotencyRepo = new IdempotencyRepository();
  }

  async createExpense(data: { amount: number; category: string; description: string; date: string }, idempotencyKey?: string) {
    if (idempotencyKey) {
      const existingKey = await this.idempotencyRepo.findByKey(idempotencyKey);
      if (existingKey) {
        return { isDuplicate: true };
      }
    }

    const expense = await this.expenseRepo.create({
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: new Date(data.date),
    }, idempotencyKey);

    return { isDuplicate: false, expense };
  }

  async getExpenses(category?: string, sort?: string) {
    const sortDesc = sort === 'date_desc' || !sort;
    return this.expenseRepo.findAll(category, sortDesc);
  }
}
