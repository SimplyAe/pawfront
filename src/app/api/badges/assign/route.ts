import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { readBadges, writeBadges } from "@/lib/badges";
import type { BadgeAssignment } from "@/types/badge";

const API = "https://api.pawinput.xyz/v1";

async function logBadgeAction(opts: {
  sessionId: number;
  action: string;
  targetId: number;
  targetName: string;
  badgeLabel: string;
  badgeStyle: string;
  badgeColor1: string;
}) {
  const { sessionId, action, targetId, targetName, badgeLabel, badgeStyle, badgeColor1 } = opts;
  fetch(`${API}/staff/log_badge_action`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      actor_id:    String(sessionId),
      action,
      target_id:   String(targetId),
      target_name: targetName,
      badge_label: badgeLabel,
      badge_style: badgeStyle,
      badge_color1: badgeColor1,
    }).toString(),
  }).catch(() => {});
}

function isStaff(priv: number): boolean {
  return !!(priv & ((1 << 12) | (1 << 13) | (1 << 14)));
}

export async function GET(req: NextRequest) {
  const userId = Number(new URL(req.url).searchParams.get("user_id"));
  if (!userId) return NextResponse.json({ error: "user_id required" }, { status: 400 });

  const data = readBadges();
  const ids = new Set(
    data.assignments.filter((a) => a.user_id === userId).map((a) => a.badge_id)
  );
  const badges = data.definitions.filter((d) => ids.has(d.id));
  return NextResponse.json(badges);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isStaff(session.priv))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { badge_id, user_id, user_name } = await req.json() as {
    badge_id: string; user_id: number; user_name?: string;
  };
  if (!badge_id || !user_id)
    return NextResponse.json({ error: "badge_id and user_id required" }, { status: 400 });

  const data = readBadges();
  if (!data.definitions.find((d) => d.id === badge_id))
    return NextResponse.json({ error: "Badge not found" }, { status: 404 });
  if (data.assignments.find((a) => a.badge_id === badge_id && a.user_id === Number(user_id)))
    return NextResponse.json({ error: "Already assigned" }, { status: 400 });

  const assignment: BadgeAssignment = {
    badge_id,
    user_id: Number(user_id),
    user_name: user_name ?? "",
    assigned_at: new Date().toISOString(),
  };
  data.assignments.push(assignment);
  writeBadges(data);

  const def = data.definitions.find((d) => d.id === badge_id);
  logBadgeAction({
    sessionId:   session.id,
    action:      "badge_assign",
    targetId:    Number(user_id),
    targetName:  user_name ?? String(user_id),
    badgeLabel:  def?.label   ?? badge_id,
    badgeStyle:  def?.style   ?? "custom",
    badgeColor1: def?.color1  ?? "",
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !isStaff(session.priv))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { badge_id, user_id } = await req.json() as { badge_id: string; user_id: number };
  if (!badge_id || !user_id)
    return NextResponse.json({ error: "badge_id and user_id required" }, { status: 400 });

  const data = readBadges();
  const def = data.definitions.find((d) => d.id === badge_id);
  const revokedAssignment = data.assignments.find(
    (a) => a.badge_id === badge_id && a.user_id === Number(user_id)
  );
  data.assignments = data.assignments.filter(
    (a) => !(a.badge_id === badge_id && a.user_id === Number(user_id))
  );
  writeBadges(data);

  logBadgeAction({
    sessionId:   session.id,
    action:      "badge_revoke",
    targetId:    Number(user_id),
    targetName:  revokedAssignment?.user_name ?? String(user_id),
    badgeLabel:  def?.label  ?? badge_id,
    badgeStyle:  def?.style  ?? "custom",
    badgeColor1: def?.color1 ?? "",
  });

  return NextResponse.json({ ok: true });
}
