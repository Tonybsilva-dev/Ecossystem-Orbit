import { z } from "../../validation/zod-config";

export const TenantSchema = z.object({
  name: z.string().min(3).max(50),
  slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  status: z.enum(["ACTIVE", "INACTIVE", "PAST_DUE"]).optional(),
  user: z.object({
    email: z.string().email(),
    name: z.string().min(2).optional(),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

export const CreateTenantSchema = TenantSchema;
export const UpdateTenantSchema = TenantSchema.partial();

export type CreateTenantInput = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantInput = z.infer<typeof UpdateTenantSchema>;
