import { useMutation, useQuery } from "@tanstack/react-query";

import { getMe, login, logout } from "../api/auth.api";
import type { LoginPayload } from "../auth.types";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export const useLogin = () =>
  useMutation({
    mutationFn: (payload: LoginPayload) => login(payload),
  });

export const useMe = () =>
  useQuery({
    queryKey: authKeys.me(),
    queryFn: getMe,
    retry: false,
  });

export const useLogout = () =>
  useMutation({
    mutationFn: logout,
  });
