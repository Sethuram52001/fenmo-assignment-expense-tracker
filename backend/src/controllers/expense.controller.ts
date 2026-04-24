import { Request, Response } from 'express';
import { ExpenseService } from '../services/expense.service';
import { z } from 'zod';

const createExpenseSchema = z.object({
  amount: z.number().int().positive("Amount must be a positive integer"),
  category: z.string().min(1, "Category is required").max(50, "Category too long"),
  description: z.string().max(255, "Description cannot exceed 255 characters").optional().default(""),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
}).strict();

export class ExpenseController {
  private expenseService: ExpenseService;

  constructor() {
    this.expenseService = new ExpenseService();
  }

  createExpense = async (req: Request, res: Response) => {
    try {
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;
      const parsedData = createExpenseSchema.parse(req.body);

      const result = await this.expenseService.createExpense(parsedData, idempotencyKey);

      if (result.isDuplicate) {
        return res.status(200).json({ message: "Expense already processed (Idempotent request)" });
      }

      return res.status(201).json(result.expense);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.errors });
      }
      console.error("Error creating expense:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };

  getExpenses = async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      const sort = req.query.sort as string | undefined;

      const expenses = await this.expenseService.getExpenses(category, sort);
      return res.json(expenses);
    } catch (error) {
      console.error("Error fetching expenses:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  };
}
