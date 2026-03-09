import { request } from "../../../api";
import type { SendRules } from "../send-rules.types";

export function listSendRules() {
  return request<SendRules[]>("/send-rules");
}
