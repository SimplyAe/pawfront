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
  creation_time: string | null;
};

export type RecentScore = {
  id: number;
  userid: number;
  player_name: string;
  restricted: boolean;
  pp: number;
  acc: number;
  score: number;
  mode: number;
  status: number;
  grade: string;
  max_combo: number;
  mods: number;
  play_time: string | null;
  title: string;
  artist: string;
  version: string;
  set_id: number;
  map_status: number;
};

export type StaffMap = {
  beatmap_id: number;
  title: string;
  artist: string;
  version: string;
  new_status: number;
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

export async function wipeScores(
  targetId: number,
  mode: number,
): Promise<{ error?: string; wiped_modes?: number[] }> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    const res = await fetch(`${API}/staff/wipe_scores`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        actor_id: String(session.id),
        target_id: String(targetId),
        mode: String(mode),
      }).toString(),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Wipe failed." };
    return { wiped_modes: data.wiped_modes };
  } catch {
    return { error: "Could not reach the server." };
  }
}

export async function lookupMap(
  beatmapId: number,
): Promise<{ map?: { id: number; set_id: number; title: string; artist: string; version: string; status: number }; error?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    const res = await fetch(`${API}/get_map_info?id=${beatmapId}`, { cache: "no-store" });
    const data = await res.json();
    if (data.status !== "success") return { error: "Map not found." };
    const m = data.map;
    return { map: { id: m.id, set_id: m.set_id, title: m.title, artist: m.artist, version: m.version, status: m.status } };
  } catch {
    return { error: "Could not reach the server." };
  }
}

export async function getRecentScores(limit = 30): Promise<{ scores?: RecentScore[]; error?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    const res = await fetch(`${API}/staff/recent_scores?actor_id=${session.id}&limit=${limit}`, {
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Failed." };
    return { scores: data.scores };
  } catch {
    return { error: "Could not reach the server." };
  }
}

export async function setMapStatus(
  beatmapId: number,
  newStatus: number,
): Promise<{ error?: string; result?: StaffMap }> {
  const session = await getSession();
  if (!session) redirect("/login");

  try {
    const res = await fetch(`${API}/staff/set_map_status`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        actor_id: String(session.id),
        beatmap_id: String(beatmapId),
        new_status: String(newStatus),
      }).toString(),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Failed." };
    return { result: data };
  } catch {
    return { error: "Could not reach the server." };
  }
}
