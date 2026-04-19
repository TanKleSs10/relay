import type { z } from "zod";
import { MessageSchema } from "../../schemas";

export type Message = z.infer<typeof MessageSchema>;

export type MessagePayload = {
  recipient: string;
  content: string;
  campaign_id: string;
};

export type MessageUpdatePayload = Partial<MessagePayload>;
