import { request } from "../../../api";
import type { AuthUser, LoginPayload } from "../auth.types";

export function login(payload: LoginPayload) {
  return request<AuthUser>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function getMe() {
  return request<AuthUser>("/auth/me");
}
