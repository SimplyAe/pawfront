"use server";

const API = "https://api.pawinput.xyz/v1";
const HEADERS = { "Content-Type": "application/x-www-form-urlencoded" };

export type ResetState = { error?: string; success?: boolean };

export async function resetPasswordAction(
  _prev: ResetState,
  formData: FormData,
): Promise<ResetState> {
  const token = (formData.get("token") ?? "") as string;
  const new_password = (formData.get("new_password") ?? "") as string;
  const confirm = (formData.get("confirm") ?? "") as string;

  if (!token) return { error: "Invalid reset link." };
  if (!new_password || !confirm) return { error: "All fields are required." };
  if (new_password !== confirm) return { error: "Passwords do not match." };
  if (new_password.length < 8) return { error: "Password must be at least 8 characters." };

  let data: { status: string; message?: string };
  try {
    const res = await fetch(`${API}/reset_password`, {
      method: "POST",
      headers: HEADERS,
      body: new URLSearchParams({ token, new_password }).toString(),
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
