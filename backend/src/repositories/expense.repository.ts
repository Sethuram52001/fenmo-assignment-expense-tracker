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

  async findAll(category?: string, sortDesc: boolean = true, cursor?: string, limit: number = 20) {
    const whereClause = category ? { category } : undefined;

    const items = await prisma.expense.findMany({
      where: whereClause,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      skip: cursor ? 1 : 0,
      orderBy: [
        { date: sortDesc ? 'desc' : 'asc' },
        { created_at: sortDesc ? 'desc' : 'asc' }
      ]
    });

    let nextCursor: string | undefined = undefined;
    if (items.length > limit) {
      const nextItem = items.pop();
      nextCursor = nextItem?.id;
    }

    return { items, nextCursor };
  }
}
