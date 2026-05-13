import { createReadStream, statSync } from "fs";
import path from "path";
import { NextResponse } from "next/server";

const CLIENT_PATH = path.join(process.cwd(), "client", "osu!pawclient.rar");
const FILE_NAME = "osu!pawclient.rar";

export async function GET() {
  let size: number;
  try {
    size = statSync(CLIENT_PATH).size;
  } catch {
    return NextResponse.json({ error: "Client file not found." }, { status: 404 });
  }

  const stream = createReadStream(CLIENT_PATH);
  const body = new ReadableStream({
    start(controller) {
      stream.on("data", (chunk) =>
        controller.enqueue(typeof chunk === "string" ? Buffer.from(chunk) : chunk)
      );
      stream.on("end", () => controller.close());
      stream.on("error", (err) => controller.error(err));
    },
    cancel() {
      stream.destroy();
    },
  });

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/x-rar-compressed",
      "Content-Disposition": `attachment; filename="${FILE_NAME}"`,
      "Content-Length": String(size),
    },
  });
}
