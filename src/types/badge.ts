export type BadgeStyle =
  | "rainbow"
  | "supporter"
  | "glow-red"
  | "glow-blue"
  | "glow-green"
  | "goat"
  // Glow variants
  | "glow-purple"
  | "glow-pink"
  | "glow-orange"
  | "glow-cyan"
  | "glow-white"
  | "glow-yellow"
  | "glow-lime"
  | "glow-rose"
  // Animated gradients
  | "fire"
  | "ice"
  | "neon"
  | "aurora"
  | "galaxy"
  | "lava"
  | "holograph"
  | "glitch"
  | "synthwave"
  | "toxic"
  | "void"
  | "prism"
  | "sakura"
  // Particle effects
  | "snowfall"
  | "sparks"
  | "embers"
  | "stardust"
  // Role / themed
  | "staff"
  | "dev"
  | "alumni"
  | "verified"
  | "moderator"
  | "booster"
  // Prestige
  | "diamond"
  | "platinum"
  | "obsidian"
  | "celestial"
  | "mythic"
  | "custom";

export interface BadgeDefinition {
  id: string;
  label: string;
  style: BadgeStyle;
  color1: string;
  color2: string;
  preset?: boolean;
  created_at: string;
}

export interface BadgeAssignment {
  badge_id: string;
  user_id: number;
  user_name: string;
  assigned_at: string;
}

export interface BadgesData {
  definitions: BadgeDefinition[];
  assignments: BadgeAssignment[];
}
