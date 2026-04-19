import { z } from "zod";

export const UserStatusSchema = z.enum(["ACTIVE", "INACTIVE"]);

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  username: z.string().min(1),
  roles: z.array(z.string()).min(1),
  status: UserStatusSchema,
  created_at: z.string().datetime().nullable().optional(),
});

export type User = z.infer<typeof UserSchema>;
