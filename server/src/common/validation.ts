import { z } from "zod";

export const paginationSchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
  search: z.string().trim().max(120).optional(),
});

/** Express 5 types route params as `string | string[]`; app routes are single-valued. */
export function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}
