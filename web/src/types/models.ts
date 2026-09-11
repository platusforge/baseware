export type IUser = {
  id: string;
  email: string;
  name: string | null;
  type: string;
};

export type IOrganization = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role?: string;
};

export type IUserPermission = {
  allowedPages: string[];
  configured: boolean;
};
