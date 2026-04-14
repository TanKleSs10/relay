import { request } from "../../../api";
import type { User, UserCreatePayload, UserStatusUpdatePayload } from "../user.types";

export function listUsers(params: { skip?: number; limit?: number } = {}) {
  const searchParams = new URLSearchParams();
  if (typeof params.skip === "number") searchParams.set("skip", String(params.skip));
  if (typeof params.limit === "number") searchParams.set("limit", String(params.limit));
  const suffix = searchParams.toString();
  return request<User[]>(`/users${suffix ? `?${suffix}` : ""}`);
}

export function createUser(payload: UserCreatePayload) {
  return request<User>("/users", { method: "POST", body: payload });
}

export function updateUserStatus(userId: string, payload: UserStatusUpdatePayload) {
  return request<User>(`/users/${userId}/status`, { method: "PATCH", body: payload });
}

