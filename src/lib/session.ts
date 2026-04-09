import { cookies } from "next/headers";

export interface SessionUser {
  id: number;
  name: string;
  priv: number;
  country: string;
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const val = store.get("session")?.value;
  if (!val) return null;
  try {
    return JSON.parse(val) as SessionUser;
  } catch {
    return null;
  }
}

export async function setSession(user: SessionUser): Promise<void> {
  const store = await cookies();
  store.set("session", JSON.stringify(user), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export async function clearSession(): Promise<void> {
  const store = await cookies();
  store.delete("session");
}
