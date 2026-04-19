import { request } from "../../../api";
import type {
  SenderAccount,
  SenderAccountCreatePayload,
  SenderAccountUpdatePayload,
  SenderQr,
} from "../sender-account.types";

export function listSenderAccounts() {
  return request<SenderAccount[]>("/sender-accounts");
}

export function getSenderAccount(senderId: string) {
  return request<SenderAccount>(`/sender-accounts/${senderId}`);
}

export function createSenderAccount(payload: SenderAccountCreatePayload) {
  return request<{ id: string }>("/sender-accounts/create", {
    method: "POST",
    body: payload,
  });
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

export function updateSenderAccount(senderId: string, payload: SenderAccountUpdatePayload) {
  return request<SenderAccount>(`/sender-accounts/${senderId}`, {
    method: "PATCH",
    body: payload,
  });
}
