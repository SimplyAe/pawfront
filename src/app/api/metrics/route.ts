import { NextResponse } from "next/server";
import * as fs from "fs";

let lastCpuIdle = 0;
let lastCpuTotal = 0;

function readCpuUsage(): number {
  try {
    const stat = fs.readFileSync("/proc/stat", "utf8");
    const line = stat.split("\n")[0]; // cpu total line
    const parts = line.split(/\s+/).slice(1).map(Number);
    // user, nice, system, idle, iowait, irq, softirq, steal, ...
    const idle = parts[3] + (parts[4] || 0);
    const total = parts.reduce((a, b) => a + b, 0);

    const diffIdle = idle - lastCpuIdle;
    const diffTotal = total - lastCpuTotal;
    lastCpuIdle = idle;
    lastCpuTotal = total;

    if (diffTotal === 0) return 0;
    const usage = ((diffTotal - diffIdle) / diffTotal) * 100;
    return Math.max(0, Math.min(100, Number(usage.toFixed(1))));
  } catch {
    return 0;
  }
}

function readMemInfo(): { usedMb: number; totalMb: number } {
  try {
    const mem = fs.readFileSync("/proc/meminfo", "utf8");
    const parse = (key: string): number => {
      const match = mem.match(new RegExp(`^${key}:\\s+(\\d+)`, "m"));
      return match ? parseInt(match[1]) * 1024 : 0; // kB → bytes
    };
    const total = parse("MemTotal");
    const available = parse("MemAvailable");
    return {
      totalMb: Math.round(total / 1024 / 1024),
      usedMb: Math.round((total - available) / 1024 / 1024),
    };
  } catch {
    return { usedMb: 0, totalMb: 0 };
  }
}

async function pingUrl(url: string): Promise<number> {
  const start = Date.now();
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    await fetch(url, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    return Date.now() - start;
  } catch {
    return -1;
  }
}

export async function GET() {
  const cpuUsage = readCpuUsage();
  const { usedMb, totalMb } = readMemInfo();

  const [apiLatency, webLatency] = await Promise.all([
    pingUrl("https://api.pawinput.xyz/v1/get_player_count"),
    pingUrl("https://pawinput.xyz"),
  ]);

  return NextResponse.json({
    cpu: cpuUsage,
    ram: { used: usedMb, total: totalMb },
    latency: { api: apiLatency, web: webLatency },
    timestamp: Date.now(),
  });
}
