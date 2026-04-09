export function addCommas(n: number): string {
  return n.toLocaleString("en-US");
}

export function formatScore(n: number): string {
  return n.toLocaleString("en-US");
}

export function secondsToDhm(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function timeAgo(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - timestamp;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  if (diff < 31536000) return `${Math.floor(diff / 2592000)}mo ago`;
  return `${Math.floor(diff / 31536000)}y ago`;
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const MOD_BITS: [number, string][] = [
  [1 << 9, "NC"],
  [1 << 6, "DT"],
  [1 << 8, "HT"],
  [1 << 0, "NF"],
  [1 << 1, "EZ"],
  [1 << 3, "HD"],
  [1 << 4, "HR"],
  [1 << 5, "SD"],
  [1 << 14, "PF"],
  [1 << 10, "FL"],
  [1 << 12, "SO"],
  [1 << 7, "RX"],
  [1 << 13, "AP"],
];

export function parseMods(mods: number): string[] {
  if (mods === 0) return ["NM"];
  const result: string[] = [];
  for (const [bit, name] of MOD_BITS) {
    if (mods & bit) {
      if (name === "DT" && mods & (1 << 9)) continue;
      result.push(name);
    }
  }
  return result;
}

export function modeToInt(mode: string, mods: string): number {
  const modeMap: Record<string, number> = {
    std: 0,
    taiko: 1,
    catch: 2,
    mania: 3,
  };
  const base = modeMap[mode] ?? 0;
  if (mods === "rx") return base + 4;
  if (mods === "ap") return 8;
  return base;
}

export function intToModeLabel(mode: number): string {
  const labels: Record<number, string> = {
    0: "osu!",
    1: "Taiko",
    2: "Catch",
    3: "Mania",
    4: "osu! (Relax)",
    5: "Taiko (Relax)",
    6: "Catch (Relax)",
    8: "osu! (Autopilot)",
  };
  return labels[mode] ?? "osu!";
}

export function gradeToFile(grade: string, small = false): string {
  const normalized = grade.toUpperCase();
  const suffix = small ? "-Small@2x.png" : "@2x.png";
  if (normalized === "XH" || normalized === "SSH") {
    return small ? `/assets/ranks/Ranking-XH-Small@2x.png` : `/assets/ranks/ranking-XH@2x.png`;
  }
  if (normalized === "SH" || normalized === "SS") {
    return small ? `/assets/ranks/Ranking-SH-Small@2x.png` : `/assets/ranks/ranking-SH@2x.png`;
  }
  if (normalized === "X") {
    return `/assets/ranks/Ranking-X${small ? "-Small" : ""}@2x.png`;
  }
  return `/assets/ranks/Ranking-${normalized}${suffix}`;
}

export function formatLength(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function mapStatus(status: number): { label: string; color: string } {
  switch (status) {
    case 5: return { label: "Loved",     color: "#ff66aa" };
    case 4: return { label: "Qualified", color: "#b3ff66" };
    case 3: return { label: "Approved",  color: "#66d9ff" };
    case 2: return { label: "Ranked",    color: "#b3ff66" };
    case 1: return { label: "Pending",   color: "#ffcc66" };
    case 0: return { label: "Pending",   color: "#ffcc66" };
    default: return { label: "Graveyard", color: "rgba(255,255,255,0.3)" };
  }
}

export function diffColor(stars: number): string {
  if (stars < 2)   return "#4fc3f7";
  if (stars < 2.7) return "#66bb6a";
  if (stars < 4)   return "#ffca28";
  if (stars < 5.3) return "#ff7043";
  if (stars < 6.5) return "#ef5350";
  return "#b71c1c";
}

export type RoleBadge = { short: string; full: string; color: string; glow: string };

export function getRoleBadges(priv: number): RoleBadge[] {
  const badges: RoleBadge[] = [];
  if (priv & 16384) badges.push({ short: "DEV", full: "Developer",          color: "#4fc3f7", glow: "rgba(79,195,247,0.35)" });
  if (priv & 8192)  badges.push({ short: "OWN", full: "Owner",              color: "#e84393", glow: "rgba(232,67,147,0.35)" });
  if (priv & 4096)  badges.push({ short: "MOD", full: "Moderator",          color: "#48bb78", glow: "rgba(72,187,120,0.35)" });
  if (priv & 2048)  badges.push({ short: "BN",  full: "Beatmap Nominator",  color: "#b794f4", glow: "rgba(183,148,244,0.35)" });
  return badges;
}

export function getPrivilegeLabel(priv: number): { label: string; color: string } | null {
  if (priv & 16384) return { label: "Developer", color: "#e84393" };
  if (priv & 8192) return { label: "Admin", color: "#e87b2a" };
  if (priv & 4096) return { label: "Moderator", color: "#2ae87b" };
  if (priv & 2048) return { label: "Nominator", color: "#7b2ae8" };
  if (priv & 32) return { label: "Premium", color: "#f0c040" };
  if (priv & 16) return { label: "Supporter", color: "#e84393" };
  return null;
}
