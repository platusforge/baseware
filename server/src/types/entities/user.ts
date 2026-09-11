export type IUser = {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: Date | null;
  active: boolean;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

export type IUserWithHash = IUser & { passwordHash: string | null };
