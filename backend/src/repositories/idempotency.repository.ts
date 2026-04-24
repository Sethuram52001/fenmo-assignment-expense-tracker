import prisma from '../config/prisma';

export class IdempotencyRepository {
  async findByKey(key: string) {
    return prisma.idempotencyKey.findUnique({
      where: { key }
    });
  }

  async create(key: string) {
    return prisma.idempotencyKey.create({
      data: { key }
    });
  }
}
