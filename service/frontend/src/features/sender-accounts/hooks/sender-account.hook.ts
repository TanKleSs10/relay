import { useMutation, useQuery } from "@tanstack/react-query";

import {
  createSenderAccount,
  deleteSenderAccount,
  getSenderAccount,
  listSenderAccounts,
  resetSenderSession,
} from "../api/sender-account.api";

export const senderAccountKeys = {
  all: ["sender-accounts"] as const,
  list: () => [...senderAccountKeys.all, "list"] as const,
  detail: (senderId: number) => [...senderAccountKeys.all, "detail", senderId] as const,
};

export const useSenderAccounts = () =>
  useQuery({
    queryKey: senderAccountKeys.list(),
    queryFn: listSenderAccounts,
    refetchInterval: 3000,
  });

export const useSenderAccount = (senderId: number) =>
  useQuery({
    queryKey: senderAccountKeys.detail(senderId),
    queryFn: () => getSenderAccount(senderId),
    enabled: Number.isFinite(senderId),
  });

export const useCreateSenderAccount = () =>
  useMutation({
    mutationFn: createSenderAccount,
  });

export const useDeleteSenderAccount = () =>
  useMutation({
    mutationFn: (senderId: number) => deleteSenderAccount(senderId),
  });

export const useResetSenderSession = () =>
  useMutation({
    mutationFn: (senderId: number) => resetSenderSession(senderId),
  });
