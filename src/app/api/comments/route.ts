import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const API = "https://api.pawinput.xyz/v1";

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("user_id");
  if (!userId) return NextResponse.json({ error: "Missing user_id" }, { status: 400 });

  const res = await fetch(`${API}/get_user_comments?user_id=${userId}`, { cache: "no-store" });
  const data = await res.json();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const targetId: number = body.target_id;
  const content: string = (body.content ?? "").trim().slice(0, 1000);

  if (!content) return NextResponse.json({ error: "Content required" }, { status: 400 });

  const form = new URLSearchParams();
  form.set("author_id", String(session.id));
  form.set("target_id", String(targetId));
  form.set("content", content);

  const res = await fetch(`${API}/add_comment`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const commentId = req.nextUrl.searchParams.get("id");
  if (!commentId) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const res = await fetch(`${API}/delete_comment?comment_id=${commentId}&actor_id=${session.id}`, {
    method: "DELETE",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
