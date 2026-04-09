"use server";

import { redirect } from "next/navigation";
import { getSession, setSession } from "@/lib/session";

export type SettingsState = {
  errors?: Record<string, string[]>;
  general?: string;
  success?: string;
};

const API = "https://api.pawinput.xyz/v1";

export async function updateProfileAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const current_password = (formData.get("current_password") ?? "") as string;
  const new_username = (formData.get("new_username") ?? "") as string;
  const new_email = (formData.get("new_email") ?? "") as string;
  const new_password = (formData.get("new_password") ?? "") as string;
  const confirm_password = (formData.get("confirm_password") ?? "") as string;

  if (!current_password) return { general: "Current password is required." };
  if (new_password && new_password !== confirm_password)
    return { errors: { confirm_password: ["Passwords do not match."] } };

  let data: { status: string; message?: string; errors?: Record<string, string[]>; user?: { id: number; name: string; priv: number; country: string } };
  try {
    const body = new URLSearchParams({ user_id: String(session.id), current_password });
    if (new_username) body.set("new_username", new_username);
    if (new_email) body.set("new_email", new_email);
    if (new_password) body.set("new_password", new_password);

    const res = await fetch(`${API}/update_profile`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
      cache: "no-store",
    });
    data = await res.json();
  } catch {
    return { general: "Could not reach the server. Try again." };
  }

  if (data.status !== "success") {
    if (data.errors) return { errors: data.errors };
    return { general: data.message ?? "Update failed." };
  }

  if (data.user) {
    await setSession({
      id: data.user.id,
      name: data.user.name,
      priv: data.user.priv,
      country: data.user.country,
    });
  }

  return { success: "Profile updated successfully." };
}

export async function uploadAvatarAction(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await getSession();
  if (!session) redirect("/login");

  const current_password = (formData.get("current_password") ?? "") as string;
  const avatar = formData.get("avatar") as File | null;

  if (!current_password) return { general: "Current password is required." };
  if (!avatar || avatar.size === 0) return { general: "Please select an image." };

  // Verify password against the API before writing
  let authData: { status: string; message?: string };
  try {
    const res = await fetch(`${API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: session.name, password: current_password }).toString(),
      cache: "no-store",
    });
    authData = await res.json();
  } catch {
    return { general: "Could not reach the server. Try again." };
  }

  if (authData.status !== "success") return { general: "Incorrect password." };

  if (!avatar.type.startsWith("image/")) return { general: "File must be an image." };
  if (avatar.size > 4 * 1024 * 1024) return { general: "Image must be under 4 MB." };

  try {
    const { writeFile } = await import("fs/promises");
    const bytes = await avatar.arrayBuffer();
    const dest = `/root/onl-docker/.data/bancho/avatars/${session.id}.jpg`;
    await writeFile(dest, Buffer.from(bytes));
  } catch {
    return { general: "Failed to save avatar. Try again." };
  }

  return { success: "Avatar updated! It may take a moment to refresh." };
}
