import { z } from "zod";

export const paginationSchema = z.object({
  take: z.coerce.number().int().min(1).max(100).default(20),
  skip: z.coerce.number().int().min(0).default(0),
  search: z.string().trim().max(120).optional(),
});
