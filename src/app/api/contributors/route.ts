import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

export interface Contributor {
  id: string;
  name: string;
  role: string;
  description: string;
  osu_id: string;
  avatar_url: string;
  banner_url: string;
  github: string;
  border_style: "" | "rainbow" | "gold" | "color";
  border_color1: string;
  border_color2: string;
  added_at: string;
}

const DATA_PATH = path.join(process.cwd(), "data", "contributors.json");

function readContributors(): Contributor[] {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf-8"));
  } catch {
    return [];
  }
}

function writeContributors(list: Contributor[]) {
  fs.mkdirSync(path.dirname(DATA_PATH), { recursive: true });
  fs.writeFileSync(DATA_PATH, JSON.stringify(list, null, 2));
}

function isOwner(name: string) {
  return name.toLowerCase() === "transwaste";
}

export async function GET() {
  return NextResponse.json(readContributors());
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isOwner(session.name)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const name: string = (body.name ?? "").trim();
  const role: string = (body.role ?? "").trim();
  if (!name || !role) {
    return NextResponse.json({ error: "name and role are required" }, { status: 400 });
  }

  const contributor: Contributor = {
    id: randomUUID(),
    name,
    role,
    description: (body.description ?? "").trim(),
    osu_id: (body.osu_id ?? "").trim(),
    avatar_url: (body.avatar_url ?? "").trim(),
    banner_url: (body.banner_url ?? "").trim(),
    github: (body.github ?? "").trim(),
    border_style: ["rainbow", "gold", "color"].includes(body.border_style) ? body.border_style : "",
    border_color1: (body.border_color1 ?? "").trim(),
    border_color2: (body.border_color2 ?? "").trim(),
    added_at: new Date().toISOString(),
  };

  const list = readContributors();
  list.push(contributor);
  writeContributors(list);

  return NextResponse.json(contributor, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session || !isOwner(session.name)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const list = readContributors().filter((c) => c.id !== id);
  writeContributors(list);

  return NextResponse.json({ ok: true });
}
