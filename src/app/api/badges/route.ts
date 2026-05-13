import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getSession } from "@/lib/session";
import { readBadges, writeBadges } from "@/lib/badges";
import type { BadgeDefinition, BadgeStyle } from "@/types/badge";

function isStaff(priv: number): boolean {
  return !!(priv & ((1 << 12) | (1 << 13) | (1 << 14)));
}

export async function GET() {
  const data = readBadges();
  return NextResponse.json(data.definitions);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isStaff(session.priv))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { label, style, color1 = "", color2 = "" } = body as {
    label: string; style: BadgeStyle; color1?: string; color2?: string;
  };

  if (!label?.trim() || !style)
    return NextResponse.json({ error: "label and style required" }, { status: 400 });

  const data = readBadges();
  const def: BadgeDefinition = {
    id: randomUUID(),
    label: label.trim(),
    style,
    color1: color1 ?? "",
    color2: color2 ?? "",
    created_at: new Date().toISOString(),
  };
  data.definitions.push(def);
  writeBadges(data);
  return NextResponse.json(def);
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !isStaff(session.priv))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const data = readBadges();
  const def = data.definitions.find((d) => d.id === id);
  if (!def) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (def.preset) return NextResponse.json({ error: "Cannot delete preset badges" }, { status: 400 });

  data.definitions = data.definitions.filter((d) => d.id !== id);
  data.assignments = data.assignments.filter((a) => a.badge_id !== id);
  writeBadges(data);
  return NextResponse.json({ ok: true });
}
