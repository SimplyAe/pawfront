import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const AVATAR_DIR = "/root/onl-docker/.data/bancho/clan_avatars";
const DEFAULT_AVATAR = "/root/onl-docker/.data/bancho/clan_avatars/default.jpg";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const clanId = parseInt(id, 10);
  if (isNaN(clanId) || clanId < 1) {
    return new NextResponse("Not found", { status: 404 });
  }

  const filePath = path.join(AVATAR_DIR, `${clanId}.jpg`);
  try {
    const data = await readFile(filePath);
    return new NextResponse(data, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    try {
      const fallback = await readFile(DEFAULT_AVATAR);
      return new NextResponse(fallback, {
        headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=300" },
      });
    } catch {
      return new NextResponse("Not found", { status: 404 });
    }
  }
}
