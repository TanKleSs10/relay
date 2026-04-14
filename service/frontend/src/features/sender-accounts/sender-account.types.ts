import type { z } from "zod";
import { SenderAccountSchema, SenderQrSchema } from "../../schemas";

export type SenderAccount = z.infer<typeof SenderAccountSchema>;
export type SenderQr = z.infer<typeof SenderQrSchema>;

export type SenderAccountCreatePayload = {
  label: string;
};
