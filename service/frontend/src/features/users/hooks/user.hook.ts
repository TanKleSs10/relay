import { useMutation, useQuery } from "@tanstack/react-query";

import { createUser, listUsers, updateUserStatus } from "../api/user.api";
import type { UserCreatePayload, UserStatusUpdatePayload } from "../user.types";

export const userKeys = {
  all: ["users"] as const,
  list: () => [...userKeys.all, "list"] as const,
};

export const useUsers = () =>
  useQuery({
    queryKey: userKeys.list(),
    queryFn: () => listUsers({ skip: 0, limit: 100 }),
    refetchInterval: 5000,
  });

export const useCreateUser = () =>
  useMutation({
    mutationFn: (payload: UserCreatePayload) => createUser(payload),
  });

export const useUpdateUserStatus = () =>
  useMutation({
    mutationFn: ({
      userId,
      payload,
    }: {
      userId: string;
      payload: UserStatusUpdatePayload;
    }) => updateUserStatus(userId, payload),
  });

