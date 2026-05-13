import { getSession } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

const API = "https://api.pawinput.xyz/v1";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const content: string = (body.content ?? "").slice(0, 2000);

  const form = new URLSearchParams();
  form.set("user_id", String(session.id));
  form.set("content", content);

  const res = await fetch(`${API}/update_userpage`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
