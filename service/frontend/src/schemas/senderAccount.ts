import { z } from "zod";

export const SenderAccountStatusSchema = z.enum([
  "CREATED",
  "INITIALIZING",
  "WAITING_QR",
  "CONNECTED",
  "SENDING",
  "COOLDOWN",
  "DISCONNECTED",
  "BLOCKED",
  "ERROR",
]);

export const SenderAccountSchema = z.object({
  id: z.number().int(),
  phone_number: z.string().nullable().optional(),
  status: SenderAccountStatusSchema,
  qr_code: z.string().nullable().optional(),
  qr_generated_at: z.string().datetime().nullable().optional(),
  session_path: z.string().nullable().optional(),
  cooldown_until: z.string().datetime().nullable().optional(),
  last_sent_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
});

export type SenderAccount = z.infer<typeof SenderAccountSchema>;
