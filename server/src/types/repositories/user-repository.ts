import { IUser, IUserWithHash } from "../entities/user";

export type IUserRepository = {
  findByEmail: (email: string) => Promise<IUserWithHash | null>;
  findById: (id: string) => Promise<IUser | null>;
  create: (data: { email: string; name?: string; passwordHash?: string; avatarUrl?: string; emailVerifiedAt?: Date }) => Promise<IUser>;
  update: (id: string, data: Partial<IUserWithHash & { failedLoginAttempts: number; lockedUntil: Date | null; lastLoginAt: Date; passwordChangedAt: Date }>) => Promise<void>;
  list: (filter?: { search?: string; take?: number; skip?: number }) => Promise<IUser[]>;
  count: (filter?: { search?: string }) => Promise<number>;
};
