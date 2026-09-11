export type ResolvedPermissions = {
  isAdmin: boolean;
  /** Empty array = all pages (legacy open mode). Non-empty = allowlist. */
  allowedPages: string[];
  /** False blocks everything (except admins). */
  configured: boolean;
};

export type IPermissionRepository = {
  resolve: (userId: string) => Promise<ResolvedPermissions>;
};
