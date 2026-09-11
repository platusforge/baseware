import { IUser, IUserWithHash } from "../entities/user";

export type ISessionUser = {
  id: string;
  active: boolean;
  passwordChangedAt: Date | null;
};

export type IUserRepository = {
  findByEmail: (email: string) => Promise<IUserWithHash | null>;
  findById: (id: string) => Promise<IUser | null>;
  findSessionUser: (id: string) => Promise<ISessionUser | null>;
  findByIdWithHash: (id: string) => Promise<(IUser & { passwordHash: string | null }) | null>;
  remove: (id: string) => Promise<void>;
  create: (data: { email: string; name?: string; passwordHash?: string; avatarUrl?: string; emailVerifiedAt?: Date }) => Promise<IUser>;
  update: (id: string, data: Partial<IUserWithHash & { failedLoginAttempts: number; lockedUntil: Date | null; lastLoginAt: Date; passwordChangedAt: Date }>) => Promise<void>;
  list: (filter?: { search?: string; take?: number; skip?: number }) => Promise<IUser[]>;
  count: (filter?: { search?: string }) => Promise<number>;
};
