import { rm } from "node:fs/promises";
import { join } from "node:path";

export const AUTH_DATA_PATH =
  process.env.WHATSAPP_AUTH_PATH ?? "/app/.wwebjs_auth";

export function buildAuthSessionPath(sessionKey: string): string {
  return join(AUTH_DATA_PATH, `session-${sessionKey}`);
}

export async function removeAuthSession(sessionKey: string): Promise<void> {
  await rm(buildAuthSessionPath(sessionKey), { recursive: true, force: true });
}
