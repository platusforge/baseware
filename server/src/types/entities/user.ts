export type IUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  active: boolean;
  type: string;
  mfaEnabled: boolean;
  mustChangePassword: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type IUserWithHash = IUser & { passwordHash: string | null };
