import { z } from "zod";

export const MessageStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "SENT",
  "FAILED",
  "NO_WA",
]);

export const MessageSchema = z.object({
  id: z.string().uuid(),
  recipient: z.string().min(1),
  content: z.string().min(1),
  status: MessageStatusSchema,
  campaign_id: z.string().uuid().optional(),
  processing_by_worker_id: z.string().uuid().nullable().optional(),
  processing_sender_id: z.string().uuid().nullable().optional(),
  locked_at: z.string().datetime().nullable().optional(),
  sent_at: z.string().datetime().nullable().optional(),
  retry_count: z.number().int().optional(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
});

export type Message = z.infer<typeof MessageSchema>;
