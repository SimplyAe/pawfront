"use client";

import { useState, useEffect, useTransition } from "react";
import { lookupUser, type StaffUser } from "./actions";
import BadgeChip from "@/components/BadgeChip";
import type { BadgeDefinition, BadgeStyle } from "@/types/badge";

const STYLE_OPTIONS: { value: BadgeStyle; label: string }[] = [
  // ── Originals ──────────────────────────────────────────
  { value: "rainbow",      label: "Rainbow (animated hue)" },
  { value: "supporter",    label: "Supporter (pale yellow)" },
  { value: "goat",         label: "GOAT (gold + particles)" },
  // ── Glow variants ──────────────────────────────────────
  { value: "glow-red",     label: "Glow — Red" },
  { value: "glow-blue",    label: "Glow — Blue" },
  { value: "glow-green",   label: "Glow — Green" },
  { value: "glow-purple",  label: "Glow — Purple" },
  { value: "glow-pink",    label: "Glow — Pink" },
  { value: "glow-orange",  label: "Glow — Orange" },
  { value: "glow-cyan",    label: "Glow — Cyan" },
  { value: "glow-white",   label: "Glow — Silver" },
  { value: "glow-yellow",  label: "Glow — Yellow" },
  { value: "glow-lime",    label: "Glow — Lime" },
  { value: "glow-rose",    label: "Glow — Rose" },
  // ── Animated gradients ─────────────────────────────────
  { value: "fire",         label: "Fire" },
  { value: "ice",          label: "Ice" },
  { value: "neon",         label: "Neon" },
  { value: "aurora",       label: "Aurora" },
  { value: "galaxy",       label: "Galaxy" },
  { value: "lava",         label: "Lava" },
  { value: "holograph",    label: "Holographic" },
  { value: "glitch",       label: "Glitch" },
  { value: "synthwave",    label: "Synthwave" },
  { value: "toxic",        label: "Toxic" },
  { value: "void",         label: "Void" },
  { value: "prism",        label: "Prism" },
  { value: "sakura",       label: "Sakura" },
  // ── Particle effects ───────────────────────────────────
  { value: "snowfall",     label: "Snowfall (particles)" },
  { value: "sparks",       label: "Sparks (particles)" },
  { value: "embers",       label: "Embers (particles)" },
  { value: "stardust",     label: "Stardust (particles)" },
  // ── Role / themed ──────────────────────────────────────
  { value: "staff",        label: "Staff" },
  { value: "dev",          label: "Developer" },
  { value: "alumni",       label: "Alumni" },
  { value: "verified",     label: "Verified" },
  { value: "moderator",    label: "Moderator" },
  { value: "booster",      label: "Booster" },
  // ── Prestige ───────────────────────────────────────────
  { value: "diamond",      label: "Diamond" },
  { value: "platinum",     label: "Platinum" },
  { value: "obsidian",     label: "Obsidian" },
  { value: "celestial",    label: "Celestial" },
  { value: "mythic",       label: "Mythic" },
  // ── Custom ─────────────────────────────────────────────
  { value: "custom",       label: "Custom color" },
];

export default function BadgesTab() {
  const [defs, setDefs] = useState<BadgeDefinition[]>([]);

  const [newLabel, setNewLabel]   = useState("");
  const [newStyle, setNewStyle]   = useState<BadgeStyle>("rainbow");
  const [newColor1, setNewColor1] = useState("#ff00ff");
  const [newColor2, setNewColor2] = useState("");
  const [creating, setCreating]   = useState(false);
  const [createMsg, setCreateMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const [assignQuery, setAssignQuery]   = useState("");
  const [assignUser, setAssignUser]     = useState<StaffUser | null>(null);
  const [assignError, setAssignError]   = useState("");
  const [searching, startSearch]        = useTransition();
  const [selectedBadge, setSelectedBadge] = useState("");
  const [userBadges, setUserBadges]     = useState<BadgeDefinition[]>([]);
  const [assigning, setAssigning]       = useState(false);
  const [assignMsg, setAssignMsg]       = useState<{ text: string; ok: boolean } | null>(null);

  async function loadDefs() {
    const res = await fetch("/api/badges");
    setDefs(await res.json());
  }

  useEffect(() => { loadDefs(); }, []);

  async function loadUserBadges(userId: number) {
    const res = await fetch(`/api/badges/assign?user_id=${userId}`);
    setUserBadges(await res.json());
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!assignQuery.trim()) return;
    setAssignError("");
    setAssignUser(null);
    setUserBadges([]);
    setAssignMsg(null);
    startSearch(async () => {
      const res = await lookupUser(assignQuery.trim());
      if (res.error) { setAssignError(res.error); return; }
      setAssignUser(res.user!);
      loadUserBadges(res.user!.id);
    });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    setCreateMsg(null);
    const res = await fetch("/api/badges", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel, style: newStyle, color1: newColor1, color2: newColor2 }),
    });
    if (res.ok) {
      setCreateMsg({ text: "Badge created.", ok: true });
      setNewLabel("");
      loadDefs();
    } else {
      const d = await res.json();
      setCreateMsg({ text: d.error ?? "Error", ok: false });
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    await fetch(`/api/badges?id=${id}`, { method: "DELETE" });
    loadDefs();
  }

  async function handleAssign() {
    if (!assignUser || !selectedBadge) return;
    setAssigning(true);
    setAssignMsg(null);
    const res = await fetch("/api/badges/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: selectedBadge, user_id: assignUser.id, user_name: assignUser.name }),
    });
    const d = await res.json();
    if (res.ok) {
      setAssignMsg({ text: "Badge assigned.", ok: true });
      loadUserBadges(assignUser.id);
    } else {
      setAssignMsg({ text: d.error ?? "Error", ok: false });
    }
    setAssigning(false);
  }

  async function handleRevoke(badgeId: string) {
    if (!assignUser) return;
    await fetch("/api/badges/assign", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: badgeId, user_id: assignUser.id }),
    });
    loadUserBadges(assignUser.id);
  }

  const previewBadge = defs.find((d) => d.id === (selectedBadge || defs[0]?.id));

  return (
    <>
      {/* ── Assign Badge ───────────────── */}
      <section className="staff-section">
        <h2 className="staff-section-title">Assign Badge</h2>

        <form onSubmit={handleSearch} className="staff-search-row">
          <input
            type="text"
            className="staff-search-input"
            placeholder="Username or user ID"
            value={assignQuery}
            onChange={(e) => setAssignQuery(e.target.value)}
          />
          <button type="submit" className="staff-action-btn staff-action-btn--pink" disabled={searching}>
            {searching ? "Searching…" : "Lookup"}
          </button>
        </form>
        {assignError && <div className="staff-error">{assignError}</div>}

        {assignUser && (
          <div className="badges-assign-card">
            <div className="badges-assign-user">
              <img src={`http://a.pawinput.xyz/${assignUser.id}`} className="badges-assign-avatar" alt="" />
              <div>
                <div className="badges-assign-name">{assignUser.name}</div>
                <div className="badges-assign-id">#{assignUser.id}</div>
              </div>
            </div>

            {/* Current badges */}
            <div className="badges-assign-current">
              <span className="badges-assign-label">Current badges</span>
              {userBadges.length === 0 ? (
                <span className="badges-assign-empty">None</span>
              ) : (
                <div className="badges-assign-list">
                  {userBadges.map((b) => (
                    <div key={b.id} className="badges-assign-item">
                      <BadgeChip badge={b} />
                      <button
                        className="badges-revoke-btn"
                        onClick={() => handleRevoke(b.id)}
                        title="Revoke"
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Assign new */}
            <div className="badges-assign-row">
              <select
                className="staff-search-input"
                value={selectedBadge}
                onChange={(e) => setSelectedBadge(e.target.value)}
                style={{ flex: 1 }}
              >
                <option value="">— select badge —</option>
                {defs.map((d) => (
                  <option key={d.id} value={d.id}>{d.label}</option>
                ))}
              </select>
              {selectedBadge && previewBadge && (
                <BadgeChip badge={previewBadge} />
              )}
              <button
                className="staff-action-btn staff-action-btn--pink"
                onClick={handleAssign}
                disabled={assigning || !selectedBadge}
              >
                {assigning ? "Assigning…" : "Assign"}
              </button>
            </div>
            {assignMsg && (
              <div style={{ fontSize: "0.82rem", color: assignMsg.ok ? "#6ee7b7" : "#fca5a5", marginTop: "0.4rem" }}>
                {assignMsg.text}
              </div>
            )}
          </div>
        )}
      </section>

      {/* ── Badge Definitions ──────────── */}
      <section className="staff-section">
        <h2 className="staff-section-title">Badge Definitions</h2>

        {/* Create */}
        <form onSubmit={handleCreate} className="badges-create-form">
          <input
            type="text"
            className="staff-search-input"
            placeholder="Badge label (e.g. Top Donor)"
            value={newLabel}
            maxLength={24}
            onChange={(e) => setNewLabel(e.target.value)}
            style={{ flex: 2 }}
          />
          <select
            className="staff-search-input"
            value={newStyle}
            onChange={(e) => setNewStyle(e.target.value as BadgeStyle)}
            style={{ flex: 2 }}
          >
            {STYLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          {newStyle === "custom" && (
            <>
              <input type="color" value={newColor1} onChange={(e) => setNewColor1(e.target.value)} className="badges-color-pick" title="Color 1" />
              <input type="color" value={newColor2} onChange={(e) => setNewColor2(e.target.value)} className="badges-color-pick" title="Color 2 (optional)" />
            </>
          )}
          <button type="submit" className="staff-action-btn staff-action-btn--pink" disabled={creating || !newLabel.trim()}>
            {creating ? "Creating…" : "+ Create"}
          </button>
        </form>

        {/* Live preview */}
        <div className="badges-preview-row">
          <span className="badges-preview-label">Preview</span>
          <BadgeChip badge={{
            id: "__preview__",
            label: newLabel.trim() || "Label",
            style: newStyle,
            color1: newColor1,
            color2: newColor2,
            created_at: "",
          }} />
          <span className="badges-preview-style">{newStyle}</span>
        </div>

        {createMsg && (
          <div style={{ fontSize: "0.82rem", color: createMsg.ok ? "#6ee7b7" : "#fca5a5", marginTop: "0.4rem" }}>
            {createMsg.text}
          </div>
        )}

        {/* List */}
        <div className="badges-def-list">
          {defs.map((d) => (
            <div key={d.id} className="badges-def-row">
              <BadgeChip badge={d} />
              <span className="badges-def-style">{d.style}</span>
              {d.preset && <span className="badges-def-preset">preset</span>}
              {!d.preset && (
                <button
                  className="badges-revoke-btn"
                  onClick={() => handleDelete(d.id)}
                  title="Delete"
                >✕</button>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
