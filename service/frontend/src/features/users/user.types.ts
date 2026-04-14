import type { z } from "zod";
import { UserSchema } from "../../schemas";

export type User = z.infer<typeof UserSchema>;

export type UserCreatePayload = {
  email: string;
  username: string;
  password: string;
};

export type UserStatusUpdatePayload = {
  status: "ACTIVE" | "INACTIVE";
};

