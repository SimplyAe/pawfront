import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const BANNER_DIR = "/root/pawtoka/.data/banners";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const userId = parseInt(id, 10);
  if (isNaN(userId) || userId < 1) {
    return new NextResponse("Not found", { status: 404 });
  }

  for (const ext of ["jpg", "jpeg", "png", "webp"]) {
    try {
      const data = await readFile(path.join(BANNER_DIR, `${userId}.${ext}`));
      const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "png" ? "image/png" : "image/webp";
      return new NextResponse(data, {
        headers: {
          "Content-Type": mime,
          "Cache-Control": "public, max-age=60",
        },
      });
    } catch {
      continue;
    }
  }

  return new NextResponse("Not found", { status: 404 });
}
