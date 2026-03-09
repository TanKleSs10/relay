import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createMessage,
  deleteMessage,
  getMessage,
  listMessages,
  updateMessage,
} from "../api/message.api";
import type { MessagePayload, MessageUpdatePayload } from "../message.types";

export const messageKeys = {
  all: ["messages"] as const,
  list: (params?: {
    campaignId?: number;
    page?: number;
    limit?: number;
    status?: string;
  }) =>
    [...messageKeys.all, "list", params] as const,
  detail: (messageId: number) => [...messageKeys.all, "detail", messageId] as const,
};

export const useMessages = (params?: {
  campaignId?: number;
  page?: number;
  limit?: number;
  status?: string;
}) =>
  useQuery({
    queryKey: messageKeys.list(params),
    queryFn: () =>
      listMessages({
        campaignId: params?.campaignId,
        status: params?.status,
        skip:
          typeof params?.page === "number" && typeof params?.limit === "number"
            ? Math.max(0, params.page - 1) * params.limit
            : undefined,
        limit: params?.limit,
      }),
  });

export const useMessage = (messageId: number) =>
  useQuery({
    queryKey: messageKeys.detail(messageId),
    queryFn: () => getMessage(messageId),
    enabled: Number.isFinite(messageId),
  });

export const useCreateMessage = () =>
  useMutation({
    mutationFn: (payload: MessagePayload) => createMessage(payload),
  });

export const useUpdateMessage = () =>
  useMutation({
    mutationFn: ({ messageId, payload }: { messageId: number; payload: MessageUpdatePayload }) =>
      updateMessage(messageId, payload),
  });

export const useDeleteMessage = () =>
  useMutation({
    mutationFn: (messageId: number) => deleteMessage(messageId),
  });
