"use server";

import { redirect } from "next/navigation";
import { setSession } from "@/lib/session";

export type RegisterState = {
  errors?: Record<string, string[]>;
  general?: string;
};

const API = "https://api.pawinput.xyz/v1";
const HEADERS = { "Content-Type": "application/x-www-form-urlencoded" };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const username = (formData.get("username") ?? "") as string;
  const email = (formData.get("email") ?? "") as string;
  const password = (formData.get("password") ?? "") as string;
  const confirm = (formData.get("confirm") ?? "") as string;

  if (!username || !email || !password || !confirm)
    return { general: "All fields are required." };

  if (password !== confirm)
    return { errors: { confirm: ["Passwords do not match."] } };

  let data: { status: string; errors?: Record<string, string[]>; user?: { id: number; name: string } };
  try {
    const res = await fetch(`${API}/register`, {
      method: "POST",
      headers: HEADERS,
      body: new URLSearchParams({ username, email, password }).toString(),
      cache: "no-store",
    });
    data = await res.json();
  } catch {
    return { general: "Could not reach the server. Try again." };
  }

  if (data.status !== "success") {
    return { errors: data.errors };
  }

  await setSession({ id: data.user!.id, name: data.user!.name, priv: 1, country: "xx" });
  redirect("/welcome");
}
