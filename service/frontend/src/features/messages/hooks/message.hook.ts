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
  list: () => [...messageKeys.all, "list"] as const,
  detail: (messageId: number) => [...messageKeys.all, "detail", messageId] as const,
};

export const useMessages = () =>
  useQuery({
    queryKey: messageKeys.list(),
    queryFn: listMessages,
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
