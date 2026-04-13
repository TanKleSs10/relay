import { request } from "../../../api";
import type { SenderAccount, SenderQr } from "../sender-account.types";

export function listSenderAccounts() {
  return request<SenderAccount[]>("/sender-accounts");
}

export function getSenderAccount(senderId: string) {
  return request<SenderAccount>(`/sender-accounts/${senderId}`);
}

export function createSenderAccount() {
  return request<SenderAccount>("/sender-accounts/create", { method: "POST" });
}

export function deleteSenderAccount(senderId: string) {
  return request(`/sender-accounts/${senderId}`, { method: "DELETE" });
}

export function resetSenderSession(senderId: string) {
  return request(`/sender-accounts/${senderId}/reset-session`, { method: "POST" });
}

export function getSenderQr(senderId: string) {
  return request<SenderQr>(`/sender-accounts/${senderId}/qr`);
}
