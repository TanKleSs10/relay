import { request, requestWithMeta } from "../../../api";
import type { Message, MessagePayload, MessageUpdatePayload } from "../message.types";

type ListMessagesParams = {
  skip?: number;
  limit?: number;
  campaignId?: number;
  status?: string;
};

export function listMessages(params: ListMessagesParams = {}) {
  const searchParams = new URLSearchParams();
  if (typeof params.skip === "number") {
    searchParams.set("skip", String(params.skip));
  }
  if (typeof params.limit === "number") {
    searchParams.set("limit", String(params.limit));
  }
  if (typeof params.campaignId === "number") {
    searchParams.set("campaign_id", String(params.campaignId));
  }
  if (typeof params.status === "string" && params.status.length > 0) {
    searchParams.set("status", params.status);
  }
  const suffix = searchParams.toString();
  return requestWithMeta<Message[]>(`/messages${suffix ? `?${suffix}` : ""}`).then(
    ({ data, headers }) => ({
      items: data,
      total: Number(headers.get("X-Total-Count") ?? data.length),
    })
  );
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
