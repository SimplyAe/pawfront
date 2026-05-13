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

export type UserDetail = {
  id: number; name: string; email: string; country: string; priv: number;
  restricted: boolean; creation_time: number; latest_activity: number;
  silence_end: number; silence_remaining: number; donor_end: number;
};

export type HwidLog = {
  cpu_md5: string; gpu_md5: string; machine_guid_md5: string;
  motherboard_md5: string; bios_md5: string; login_time: string | null;
};

export type LoginHistory = {
  ip: string; osu_ver: string; osu_stream: string; datetime: string | null;
};

export type AuditLog = {
  id: number; from_id: number; from_name: string | null;
  to_id: number; to_name: string | null;
  action: string; msg: string | null; time: string | null;
};

export async function getUserDetail(targetId: number): Promise<{
  user?: UserDetail; hwid_logs?: HwidLog[]; login_history?: LoginHistory[]; audit_logs?: AuditLog[]; error?: string;
}> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const res = await fetch(`${API}/staff/user_detail?target_id=${targetId}&actor_id=${session.id}`, { cache: "no-store" });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Failed." };
    return { user: data.user, hwid_logs: data.hwid_logs, login_history: data.login_history, audit_logs: data.audit_logs };
  } catch { return { error: "Could not reach the server." }; }
}

export async function silenceUser(
  targetId: number, duration: number, reason: string,
): Promise<{ error?: string; action?: string; silence_end?: number }> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const res = await fetch(`${API}/staff/silence`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ actor_id: String(session.id), target_id: String(targetId), duration: String(duration), reason }).toString(),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Action failed." };
    return { action: data.action, silence_end: data.silence_end };
  } catch { return { error: "Could not reach the server." }; }
}

export async function editUser(
  targetId: number, name: string, email: string, country: string,
): Promise<{ error?: string; changes?: string[] }> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const res = await fetch(`${API}/staff/edit_user`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ actor_id: String(session.id), target_id: String(targetId), name, email, country }).toString(),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Action failed." };
    return { changes: data.changes };
  } catch { return { error: "Could not reach the server." }; }
}

export async function resetHwid(targetId: number): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const res = await fetch(`${API}/staff/reset_hwid`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ actor_id: String(session.id), target_id: String(targetId) }).toString(),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Action failed." };
    return {};
  } catch { return { error: "Could not reach the server." }; }
}

export async function removeScore(scoreId: number): Promise<{ error?: string; player_name?: string; map?: string; pp?: number }> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const res = await fetch(`${API}/staff/remove_score`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ actor_id: String(session.id), score_id: String(scoreId) }).toString(),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Action failed." };
    return { player_name: data.player_name, map: data.map, pp: data.pp };
  } catch { return { error: "Could not reach the server." }; }
}

export async function getStaffLogs(page = 1, action?: string, userId?: number): Promise<{
  logs?: AuditLog[]; total?: number; error?: string;
}> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const params = new URLSearchParams({ actor_id: String(session.id), page: String(page) });
    if (action) params.set("action", action);
    if (userId) params.set("user_id", String(userId));
    const res = await fetch(`${API}/staff/logs?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Failed." };
    return { logs: data.logs, total: data.total };
  } catch { return { error: "Could not reach the server." }; }
}

export async function broadcastAlert(message: string): Promise<{ error?: string; sent_to?: number }> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const res = await fetch(`${API}/staff/broadcast_alert`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ actor_id: String(session.id), message }).toString(),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Action failed." };
    return { sent_to: data.sent_to };
  } catch { return { error: "Could not reach the server." }; }
}

export async function toggleMaintenance(enabled: boolean): Promise<{ error?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const res = await fetch(`${API}/staff/maintenance`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ actor_id: String(session.id), enabled: String(enabled) }).toString(),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Action failed." };
    return {};
  } catch { return { error: "Could not reach the server." }; }
}

export async function getMaintenanceStatus(): Promise<{ maintenance?: boolean; error?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const res = await fetch(`${API}/staff/maintenance?actor_id=${session.id}`, { cache: "no-store" });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Failed." };
    return { maintenance: data.maintenance };
  } catch { return { error: "Could not reach the server." }; }
}

export async function restartServer(): Promise<{ error?: string; message?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const res = await fetch(`${API}/staff/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ actor_id: String(session.id) }).toString(),
      cache: "no-store",
    });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Action failed." };
    return { message: data.message };
  } catch { return { error: "Could not reach the server." }; }
}

export async function getActivityStats(): Promise<{ hourly?: { hour: string; count: number }[]; error?: string }> {
  const session = await getSession();
  if (!session) redirect("/login");
  try {
    const res = await fetch(`${API}/staff/activity_stats?actor_id=${session.id}`, { cache: "no-store" });
    const data = await res.json();
    if (data.status !== "success") return { error: data.message ?? "Failed." };
    return { hourly: data.hourly };
  } catch { return { error: "Could not reach the server." }; }
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
