import { prisma } from "@/prisma";
import { logger } from "@/logger";
import { IUserRepository } from "@/types/repositories/user-repository";

const publicSelect = {
  id: true,
  email: true,
  name: true,
  avatarUrl: true,
  emailVerifiedAt: true,
  active: true,
  type: true,
  createdAt: true,
  updatedAt: true,
} as const;

export class PrismaUserRepository implements IUserRepository {
  async findByEmail(email: string) {
    try {
      return await prisma.user.findUnique({
        where: { email },
        select: { ...publicSelect, passwordHash: true, failedLoginAttempts: true, lockedUntil: true },
      }) as never as Awaited<ReturnType<IUserRepository["findByEmail"]>>;
    } catch (err) {
      logger.error(`PrismaUserRepository.findByEmail error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async findById(id: string) {
    try {
      return await prisma.user.findUnique({ where: { id }, select: publicSelect });
    } catch (err) {
      logger.error(`PrismaUserRepository.findById error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async findSessionUser(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
        select: { id: true, active: true, passwordChangedAt: true },
      });
    } catch (err) {
      logger.error(`PrismaUserRepository.findSessionUser error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async findByIdWithHash(id: string) {
    try {
      return await prisma.user.findUnique({
        where: { id },
        select: { ...publicSelect, passwordHash: true },
      });
    } catch (err) {
      logger.error(`PrismaUserRepository.findByIdWithHash error: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async remove(id: string) {
    await prisma.user.delete({ where: { id } });
  }

  async create(data: { email: string; name?: string; passwordHash?: string; avatarUrl?: string; emailVerifiedAt?: Date }) {
    return prisma.user.create({
      data: { email: data.email, name: data.name, passwordHash: data.passwordHash, avatarUrl: data.avatarUrl, emailVerifiedAt: data.emailVerifiedAt },
      select: publicSelect,
    });
  }

  async update(id: string, data: Record<string, unknown>) {
    await prisma.user.update({ where: { id }, data: data as never });
  }

  async list(filter?: { search?: string; take?: number; skip?: number }) {
    try {
      return await prisma.user.findMany({
        where: filter?.search ? { email: { contains: filter.search, mode: "insensitive" } } : undefined,
        take: filter?.take ?? 20,
        skip: filter?.skip ?? 0,
        orderBy: { createdAt: "desc" },
        select: publicSelect,
      });
    } catch (err) {
      logger.error(`PrismaUserRepository.list error: ${err instanceof Error ? err.message : err}`);
      return [];
    }
  }

  async count(filter?: { search?: string }) {
    try {
      return await prisma.user.count({
        where: filter?.search ? { email: { contains: filter.search, mode: "insensitive" } } : undefined,
      });
    } catch (err) {
      logger.error(`PrismaUserRepository.count error: ${err instanceof Error ? err.message : err}`);
      return 0;
    }
  }
}
