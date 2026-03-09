import { z } from "zod";

export const MessageStatusSchema = z.enum(["PENDING", "PROCESSING", "SENT", "FAILED"]);

export const MessageSchema = z.object({
  id: z.number().int(),
  recipient: z.string().min(1),
  content: z.string().min(1),
  status: MessageStatusSchema,
  campaign_id: z.number().int().optional(),
  processing_by_worker: z.number().int().nullable().optional(),
  processing_sender_id: z.number().int().nullable().optional(),
  locked_at: z.string().datetime().nullable().optional(),
  sent_at: z.string().datetime().nullable().optional(),
  retry_count: z.number().int().optional(),
  created_at: z.string().datetime().nullable().optional(),
  updated_at: z.string().datetime().nullable().optional(),
});

export type Message = z.infer<typeof MessageSchema>;
