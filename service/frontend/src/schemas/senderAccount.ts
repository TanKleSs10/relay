import { z } from "zod";

export const SenderAccountStatusSchema = z.enum([
  "CREATED",
  "IDLE",
  "INITIALIZING",
  "WAITING_QR",
  "AUTHENTICATING",
  "CONNECTING",
  "CONNECTED",
  "SENDING",
  "COOLDOWN",
  "DISCONNECTED",
  "BLOCKED",
  "ERROR",
]);

export const SenderAccountSchema = z.object({
  id: z.string().uuid(),
  label: z.string().min(1),
  phone_number: z.string().nullable().optional(),
  status: SenderAccountStatusSchema,
  cooldown_until: z.string().datetime().nullable().optional(),
  last_sent_at: z.string().datetime().nullable().optional(),
  last_seen_at: z.string().datetime().nullable().optional(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
});

export const SenderQrSchema = z.object({
  sender_account_id: z.string().uuid(),
  qr_code: z.string().nullable().optional(),
  qr_generated_at: z.string().datetime().nullable().optional(),
});

export type SenderAccount = z.infer<typeof SenderAccountSchema>;
export type SenderQr = z.infer<typeof SenderQrSchema>;
