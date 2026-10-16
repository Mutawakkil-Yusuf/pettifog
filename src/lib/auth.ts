import { cookies } from "next/headers";
import { getUserById } from "./queries";
import type { User } from "./types";

export const SESSION_COOKIE = "pettifog_uid";

export async function getSessionUser(): Promise<User | null> {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  return getUserById(id);
}
