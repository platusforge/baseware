export type IProviderRepository<T> = {
  load: () => T;
};

export type IDataRepository<T> = {
  create: (data: unknown) => Promise<T>;
  findOne: (filter: unknown) => Promise<T | null>;
  findMany: (filter?: unknown) => Promise<T[]>;
  update: (filter: unknown, data: unknown) => Promise<void>;
  delete: (filter: unknown) => Promise<void>;
  count: (filter?: unknown) => Promise<number>;
};
