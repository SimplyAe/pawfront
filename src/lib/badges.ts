import { readFileSync, writeFileSync } from "fs";
import path from "path";
import type { BadgesData } from "@/types/badge";

export type { BadgeDefinition, BadgeAssignment, BadgesData, BadgeStyle } from "@/types/badge";

const FILE = path.join(process.cwd(), "data", "badges.json");

export function readBadges(): BadgesData {
  try {
    return JSON.parse(readFileSync(FILE, "utf-8")) as BadgesData;
  } catch {
    return { definitions: [], assignments: [] };
  }
}

export function writeBadges(data: BadgesData): void {
  writeFileSync(FILE, JSON.stringify(data, null, 2));
}
