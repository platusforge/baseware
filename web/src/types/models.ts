export type IUser = {
  id: string;
  email: string;
  name: string | null;
  type: string;
  emailVerifiedAt: string | null;
  mfaEnabled?: boolean;
  mustChangePassword?: boolean;
  permissions?: IUserPermission | null;
};

export type IOrganization = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  trialEndsAt?: string | null;
  role?: string;
};

export type IUserPermission = {
  allowedPages: string[];
  configured: boolean;
};
