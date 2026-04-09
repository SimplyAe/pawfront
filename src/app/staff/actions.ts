"use server";

import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const API = "https://api.pawinput.xyz/v1";

export type StaffUser = {
  id: number;
  name: string;
  priv: number;
  country: string;
  restricted: boolean;
};

export async function lookupUser(query: string): Promise<{ user?: StaffUser; error?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    const res = await fetch(
      `${API}/staff/lookup?query=${encodeURIComponent(query)}&actor_id=${session.id}`,
      { cache: "no-store" },
    );
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Not found." };
    return { user: data.user };
  } catch {
    return { error: "Could not reach the server." };
  }
}

export async function restrictUser(
  targetId: number,
  restrict: boolean,
): Promise<{ error?: string; restricted?: boolean }> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    const res = await fetch(`${API}/staff/restrict`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        actor_id: String(session.id),
        target_id: String(targetId),
        restrict: String(restrict),
      }).toString(),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Action failed." };
    return { restricted: data.restricted };
  } catch {
    return { error: "Could not reach the server." };
  }
}

export async function setPriv(
  targetId: number,
  priv: number,
): Promise<{ error?: string; new_priv?: number }> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    const res = await fetch(`${API}/staff/set_priv`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        actor_id: String(session.id),
        target_id: String(targetId),
        priv: String(priv),
      }).toString(),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Action failed." };
    return { new_priv: data.new_priv };
  } catch {
    return { error: "Could not reach the server." };
  }
}

export async function getRecentUsers(): Promise<{ users?: StaffUser[]; error?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    const res = await fetch(`${API}/staff/recent_users?actor_id=${session.id}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Failed." };
    return { users: data.users };
  } catch {
    return { error: "Could not reach the server." };
  }
}
