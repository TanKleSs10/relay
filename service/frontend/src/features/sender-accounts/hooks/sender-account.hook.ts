import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createSenderAccount,
  deleteSenderAccount,
  getSenderAccount,
  getSenderQr,
  listSenderAccounts,
  resetSenderSession,
  updateSenderAccount,
} from "../api/sender-account.api";
import type { SenderAccountCreatePayload, SenderAccountUpdatePayload } from "../sender-account.types";

export const senderAccountKeys = {
  all: ["sender-accounts"] as const,
  list: () => [...senderAccountKeys.all, "list"] as const,
  detail: (senderId: string) => [...senderAccountKeys.all, "detail", senderId] as const,
  qr: (senderId: string) => [...senderAccountKeys.all, "qr", senderId] as const,
};

export const useSenderAccounts = () =>
  useQuery({
    queryKey: senderAccountKeys.list(),
    queryFn: listSenderAccounts,
    refetchInterval: 3000,
  });

export const useSenderAccount = (senderId: string) =>
  useQuery({
    queryKey: senderAccountKeys.detail(senderId),
    queryFn: () => getSenderAccount(senderId),
    enabled: senderId.length > 0,
  });

export const useSenderQr = (senderId: string, enabled = true) =>
  useQuery({
    queryKey: senderAccountKeys.qr(senderId),
    queryFn: () => getSenderQr(senderId),
    enabled: enabled && senderId.length > 0,
    refetchInterval: enabled ? 5000 : false,
  });

export const useCreateSenderAccount = () =>
  useMutation({
    mutationFn: (payload: SenderAccountCreatePayload) => createSenderAccount(payload),
  });

export const useDeleteSenderAccount = () =>
  useMutation({
    mutationFn: (senderId: string) => deleteSenderAccount(senderId),
  });

export const useResetSenderSession = () =>
  useMutation({
    mutationFn: (senderId: string) => resetSenderSession(senderId),
  });

export const useUpdateSenderAccount = () =>
  useMutation({
    mutationFn: ({
      senderId,
      payload,
    }: {
      senderId: string;
      payload: SenderAccountUpdatePayload;
    }) => updateSenderAccount(senderId, payload),
  });
