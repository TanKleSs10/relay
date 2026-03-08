import { request } from "../../../api";
import type { Message, MessagePayload, MessageUpdatePayload } from "../message.types";

export function listMessages() {
  return request<Message[]>("/messages");
}

export function getMessage(messageId: number) {
  return request<Message>(`/messages/${messageId}`);
}

export function createMessage(payload: MessagePayload) {
  return request<Message>("/messages", {
    method: "POST",
    body: payload,
  });
}

export function updateMessage(messageId: number, payload: MessageUpdatePayload) {
  return request<Message>(`/messages/${messageId}`, {
    method: "PATCH",
    body: payload,
  });
}

export function deleteMessage(messageId: number) {
  return request(`/messages/${messageId}`, {
    method: "DELETE",
  });
}
