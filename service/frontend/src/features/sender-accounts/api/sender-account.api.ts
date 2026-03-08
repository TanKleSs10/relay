import { request } from "../../../api";
import type { SenderAccount } from "../sender-account.types";

export function listSenderAccounts() {
  return request<SenderAccount[]>("/sender-accounts");
}

export function getSenderAccount(senderId: number) {
  return request<SenderAccount>(`/sender-accounts/${senderId}`);
}

export function createSenderAccount() {
  return request<SenderAccount>("/sender-accounts/create", { method: "POST" });
}

export function deleteSenderAccount(senderId: number) {
  return request(`/sender-accounts/${senderId}`, { method: "DELETE" });
}
