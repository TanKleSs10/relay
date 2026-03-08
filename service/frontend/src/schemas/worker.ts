import { z } from "zod";

export const WorkerStatusSchema = z.enum(["ONLINE", "OFFLINE"]);
export const WorkerTypeSchema = z.enum(["qr", "session", "campaign"]);

export const WorkerSchema = z.object({
  id: z.number().int(),
  worker_name: z.string().min(1),
  worker_type: WorkerTypeSchema,
  status: WorkerStatusSchema,
  last_seen: z.string().datetime().nullable().optional(),
  started_at: z.string().datetime().nullable().optional(),
});

export type Worker = z.infer<typeof WorkerSchema>;
