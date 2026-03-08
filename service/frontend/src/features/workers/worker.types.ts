import type { z } from "zod";
import { WorkerSchema } from "../../schemas";

export type Worker = z.infer<typeof WorkerSchema>;

export type WorkerCount = {
  available_workers?: number;
  active_workers?: number;
};
