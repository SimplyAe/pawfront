"use server";

import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const API = "https://api.pawinput.xyz/v1";
const AVATAR_DIR = "/root/onl-docker/.data/bancho/clan_avatars";

export async function updateClan(
  clanId: number,
  name: string,
  description: string,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) redirect("/login");
  const fd = new FormData();
  fd.append("clan_id", String(clanId));
  fd.append("actor_id", String(session.id));
  fd.append("name", name);
  fd.append("description", description);
  try {
    const res = await fetch(`${API}/update_clan`, { method: "POST", body: fd, cache: "no-store" });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Failed." };
    return { success: true };
  } catch {
    return { error: "Could not reach the server." };
  }
}

export async function invitePlayer(
  clanId: number,
  target: string,
): Promise<{ error?: string; invited?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  const fd = new FormData();
  fd.append("clan_id", String(clanId));
  fd.append("actor_id", String(session.id));
  fd.append("target", target);
  try {
    const res = await fetch(`${API}/clan_invite`, { method: "POST", body: fd, cache: "no-store" });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Failed." };
    return { invited: data.invited };
  } catch {
    return { error: "Could not reach the server." };
  }
}

export async function kickMember(
  clanId: number,
  targetId: number,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) redirect("/login");
  const fd = new FormData();
  fd.append("clan_id", String(clanId));
  fd.append("actor_id", String(session.id));
  fd.append("target_id", String(targetId));
  try {
    const res = await fetch(`${API}/clan_kick`, { method: "POST", body: fd, cache: "no-store" });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Failed." };
    return { success: true };
  } catch {
    return { error: "Could not reach the server." };
  }
}

export async function uploadClanAvatar(
  clanId: number,
  formData: FormData,
): Promise<{ error?: string; success?: boolean }> {
  const session = await getSession();
  if (!session) redirect("/login");

  const file = formData.get("avatar") as File | null;
  if (!file || !file.type.startsWith("image/")) {
    return { error: "Please select a valid image file." };
  }
  if (file.size > 4 * 1024 * 1024) {
    return { error: "Image must be under 4 MB." };
  }

  // Verify the session user is actually the clan owner
  const res = await fetch(`${API}/get_clan?id=${clanId}&mode=0`, { cache: "no-store" });
  const data = await res.json();
  if (data.status !== "success") return { error: "Clan not found." };
  if (data.clan.owner_id !== session.id) return { error: "Only the clan owner can change the avatar." };

  try {
    await mkdir(AVATAR_DIR, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(AVATAR_DIR, `${clanId}.jpg`), buffer);
    return { success: true };
  } catch {
    return { error: "Failed to save avatar." };
  }
}
