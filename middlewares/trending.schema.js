// src/middlewares/trending.schema.js
import { z } from "zod";

export const trendingQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  city: z.string().trim().min(2).optional(),
  limit: z.coerce.number().min(1).max(30).default(10),
});
