import { Router } from 'express';
import { ExpenseController } from '../controllers/expense.controller';

const router = Router();
const expenseController = new ExpenseController();

router.post('/', expenseController.createExpense);
router.get('/', expenseController.getExpenses);

export default router;
