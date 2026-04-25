import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createSenderAccount,
  deleteSenderAccount,
  getSenderAccount,
  getSenderQr,
  listSenderAccounts,
  requestSenderQr,
  resetSenderSession,
  updateSenderAccount,
} from "../api/sender-account.api";
import type {
  SenderAccount,
  SenderAccountCreatePayload,
  SenderAccountUpdatePayload,
} from "../sender-account.types";

export const senderAccountKeys = {
  all: ["sender-accounts"] as const,
  list: () => [...senderAccountKeys.all, "list"] as const,
  detail: (senderId: string) => [...senderAccountKeys.all, "detail", senderId] as const,
  qr: (senderId: string) => [...senderAccountKeys.all, "qr", senderId] as const,
};

const TRANSITIONAL_SENDER_STATUSES = new Set([
  "INITIALIZING",
  "QR_REQUESTED",
  "WAITING_QR",
  "AUTHENTICATING",
  "CONNECTING",
  "SENDING",
]);

const SENDER_LIST_IDLE_REFETCH_MS = 15_000;
const SENDER_LIST_ACTIVE_REFETCH_MS = 4_000;
const QR_REFETCH_MS = 5_000;

export const useSenderAccounts = () =>
  useQuery({
    queryKey: senderAccountKeys.list(),
    queryFn: listSenderAccounts,
    refetchInterval: (query) =>
      shouldRefetchSendersFrequently(query.state.data)
        ? SENDER_LIST_ACTIVE_REFETCH_MS
        : SENDER_LIST_IDLE_REFETCH_MS,
  });

export const useSenderAccount = (senderId: string) =>
  useQuery({
    queryKey: senderAccountKeys.detail(senderId),
    queryFn: () => getSenderAccount(senderId),
    enabled: senderId.length > 0,
  });

export const useSenderQr = (
  senderId: string,
  senderStatus?: SenderAccount["status"],
  enabled = true
) =>
  useQuery({
    queryKey: senderAccountKeys.qr(senderId),
    queryFn: () => getSenderQr(senderId),
    enabled: enabled && senderId.length > 0,
    refetchInterval:
      enabled && shouldPollQr(senderStatus)
        ? QR_REFETCH_MS
        : false,
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

export const useRequestSenderQr = () =>
  useMutation({
    mutationFn: (senderId: string) => requestSenderQr(senderId),
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

function shouldRefetchSendersFrequently(senders: SenderAccount[] | undefined): boolean {
  if (!senders?.length) {
    return false;
  }

  return senders.some((sender) => TRANSITIONAL_SENDER_STATUSES.has(sender.status));
}

function shouldPollQr(senderStatus: SenderAccount["status"] | undefined): boolean {
  return (
    senderStatus === "QR_REQUESTED" ||
    senderStatus === "WAITING_QR"
  );
}
