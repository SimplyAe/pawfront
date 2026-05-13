"use server";

import { redirect } from "next/navigation";
import { setSession } from "@/lib/session";

export type LoginState = {
  error?: string;
};

const API = "https://api.pawinput.xyz/v1";
const HEADERS = { "Content-Type": "application/x-www-form-urlencoded" };

export type ForgotState = { error?: string; success?: boolean };

export async function forgotPasswordAction(
  _prev: ForgotState,
  formData: FormData,
): Promise<ForgotState> {
  const val = (formData.get("username_or_email") ?? "") as string;
  if (!val.trim()) return { error: "Please enter your username or email." };

  let data: { status: string; message?: string };
  try {
    const res = await fetch(`${API}/forgot_password`, {
      method: "POST",
      headers: HEADERS,
      body: new URLSearchParams({ username_or_email: val.trim() }).toString(),
      cache: "no-store",
    });
    data = await res.json();
  } catch {
    return { error: "Could not reach the server. Try again." };
  }

  if (data.status !== "success") {
    return { error: data.message ?? "Something went wrong." };
  }
  return { success: true };
}

export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const username = (formData.get("username") ?? "") as string;
  const password = (formData.get("password") ?? "") as string;

  if (!username || !password) return { error: "All fields are required." };

  let data: { status: string; message?: string; user?: { id: number; name: string; priv: number; country: string } };
  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: HEADERS,
      body: new URLSearchParams({ username, password }).toString(),
      cache: "no-store",
    });
    data = await res.json();
  } catch {
    return { error: "Could not reach the server. Try again." };
  }

  if (data.status !== "success" || !data.user) {
    return { error: data.message ?? "Invalid username or password." };
  }

  await setSession(data.user);
  redirect("/");
}
