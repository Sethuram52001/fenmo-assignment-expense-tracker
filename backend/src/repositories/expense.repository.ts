import prisma from '../config/prisma';
import { PrismaClient } from '@prisma/client';

type TransactionClient = Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>;

export class ExpenseRepository {
  async create(data: { amount: number; category: string; description: string; date: Date }, idempotencyKey?: string) {
    return prisma.$transaction(async (tx: TransactionClient) => {
      if (idempotencyKey) {
        await tx.idempotencyKey.create({
          data: { key: idempotencyKey }
        });
      }

      return tx.expense.create({
        data
      });
    });
  }

  async findAll(category?: string, sortDesc: boolean = true) {
    const whereClause = category ? { category } : undefined;

    return prisma.expense.findMany({
      where: whereClause,
      orderBy: [
        { date: sortDesc ? 'desc' : 'asc' },
        { created_at: sortDesc ? 'desc' : 'asc' }
      ]
    });
  }
}
