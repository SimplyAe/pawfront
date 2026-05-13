"use client";

import type { BadgeDefinition } from "@/types/badge";

export default function BadgeChip({ badge }: { badge: BadgeDefinition }) {
  if (badge.style === "custom") {
    const bg = badge.color2
      ? `linear-gradient(135deg, ${badge.color1}2a, ${badge.color2}1a)`
      : `${badge.color1}20`;
    return (
      <span
        className="user-badge user-badge--custom"
        style={{
          background: bg,
          borderColor: badge.color1 || "#fff",
          color: badge.color1 || "#fff",
          boxShadow: `0 0 7px ${badge.color1}55`,
        }}
      >
        {badge.label}
      </span>
    );
  }

  if (badge.style === "goat") {
    return (
      <span className="user-badge user-badge--goat">
        <span className="user-badge__particle" aria-hidden="true" />
        <span className="user-badge__particle" aria-hidden="true" />
        <span className="user-badge__particle" aria-hidden="true" />
        {badge.label}
      </span>
    );
  }

  if (badge.style === "snowfall") {
    return (
      <span className="user-badge user-badge--snowfall">
        <span className="user-badge__snow" aria-hidden="true" />
        <span className="user-badge__snow" aria-hidden="true" />
        <span className="user-badge__snow" aria-hidden="true" />
        <span className="user-badge__snow" aria-hidden="true" />
        <span className="user-badge__snow" aria-hidden="true" />
        {badge.label}
      </span>
    );
  }

  if (badge.style === "sparks") {
    return (
      <span className="user-badge user-badge--sparks">
        <span className="user-badge__spark" aria-hidden="true" />
        <span className="user-badge__spark" aria-hidden="true" />
        <span className="user-badge__spark" aria-hidden="true" />
        <span className="user-badge__spark" aria-hidden="true" />
        {badge.label}
      </span>
    );
  }

  if (badge.style === "embers") {
    return (
      <span className="user-badge user-badge--embers">
        <span className="user-badge__ember" aria-hidden="true" />
        <span className="user-badge__ember" aria-hidden="true" />
        <span className="user-badge__ember" aria-hidden="true" />
        {badge.label}
      </span>
    );
  }

  if (badge.style === "stardust") {
    return (
      <span className="user-badge user-badge--stardust">
        <span className="user-badge__star" aria-hidden="true" />
        <span className="user-badge__star" aria-hidden="true" />
        <span className="user-badge__star" aria-hidden="true" />
        {badge.label}
      </span>
    );
  }

  return (
    <span className={`user-badge user-badge--${badge.style}`}>
      {badge.label}
    </span>
  );
}
