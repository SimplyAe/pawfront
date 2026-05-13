"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  restrictUser, setPriv, wipeScores, silenceUser, editUser,
  resetHwid, removeScore, getUserDetail,
  type UserDetail, type HwidLog, type LoginHistory, type AuditLog,
} from "../../actions";
import { getRoleBadges } from "@/lib/utils";
import BadgeChip from "@/components/BadgeChip";
import type { BadgeDefinition } from "@/types/badge";

/* ─── constants ─────────────────────────────────────────── */
const PRIV_FLAGS = [
  { label: "Unrestricted",     bit: 1 << 0  },
  { label: "Verified",         bit: 1 << 1  },
  { label: "Whitelisted",      bit: 1 << 2  },
  { label: "Supporter",        bit: 1 << 3  },
  { label: "Premium",          bit: 1 << 4  },
  { label: "Alumni",           bit: 1 << 5  },
  { label: "Tournament Staff", bit: 1 << 6  },
  { label: "Nominator",        bit: 1 << 11 },
  { label: "Moderator",        bit: 1 << 12 },
  { label: "Administrator",    bit: 1 << 13 },
  { label: "Developer",        bit: 1 << 14 },
];

const WIPE_MODES = [
  { label: "All Modes", value: -1 }, { label: "vn!std",    value: 0  },
  { label: "vn!taiko",  value: 1  }, { label: "vn!catch",  value: 2  },
  { label: "vn!mania",  value: 3  }, { label: "rx!std",    value: 4  },
  { label: "rx!taiko",  value: 5  }, { label: "rx!catch",  value: 6  },
  { label: "ap!std",    value: 8  },
];

const SILENCE_OPTS = [
  { label: "1h", value: 3600 }, { label: "6h",  value: 21600  },
  { label: "24h", value: 86400 }, { label: "7d", value: 604800 },
  { label: "Custom", value: -1 },
];

const ACTION_COLOR: Record<string, string> = {
  restrict: "#fca5a5", unrestrict: "#6ee7b7",
  silence: "#f6ad55",  unsilence: "#6ee7b7",
  wipe: "#fca5a5",     reset_hwid: "#93c5fd",
  remove_score: "#fca5a5", edit_user: "#c4b5fd",
};

/* ─── helpers ───────────────────────────────────────────── */
function fmtDT(s: string | number | null): string {
  if (!s) return "—";
  const d = new Date(typeof s === "number" ? s * 1000 : s);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtSilence(secs: number): string {
  if (secs <= 0) return "None";
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean).join(" ") || "<1m";
}

function InfoRow({ label, value, mono, color }: { label: string; value: string; mono?: boolean; color?: string }) {
  return (
    <div className="sp-info-row">
      <span className="sp-info-label">{label}</span>
      <span className="sp-info-value" style={{ fontFamily: mono ? "monospace" : undefined, color }}>{value}</span>
    </div>
  );
}

function ActionCard({ title, children, accent }: { title: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="spu-action-card" style={{ borderTopColor: accent ?? "rgba(59,130,246,0.5)" }}>
      <div className="spu-action-title">{title}</div>
      {children}
    </div>
  );
}

/* ─── props ─────────────────────────────────────────────── */
type InitialData = {
  user?: UserDetail;
  hwid_logs?: HwidLog[];
  login_history?: LoginHistory[];
  audit_logs?: AuditLog[];
  error?: string;
};

export default function UserAdminPage({
  initialData,
  userId,
  sessionPriv,
}: {
  initialData: InitialData;
  userId: number;
  sessionPriv: number;
}) {
  const isDev = !!(sessionPriv & (1 << 14));

  const [user, setUser] = useState<UserDetail | null>(initialData.user ?? null);
  const [hwidLogs, setHwidLogs] = useState<HwidLog[]>(initialData.hwid_logs ?? []);
  const [loginHistory, setLoginHistory] = useState<LoginHistory[]>(initialData.login_history ?? []);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialData.audit_logs ?? []);
  const [tab, setTab] = useState<"logins" | "hwid" | "audit">("logins");
  const [pending, start] = useTransition();
  const [flash, setFlash] = useState<{ text: string; ok: boolean } | null>(null);

  // action states
  const [confirmRestrict, setConfirmRestrict] = useState(false);
  const [silencePick, setSilencePick] = useState(3600);
  const [silenceCustom, setSilenceCustom] = useState("");
  const [silenceReason, setSilenceReason] = useState("");
  const [editName, setEditName] = useState(user?.name ?? "");
  const [editEmail, setEditEmail] = useState(user?.email ?? "");
  const [editCountry, setEditCountry] = useState(user?.country ?? "");
  const [wipeMode, setWipeMode] = useState(-1);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [removeId, setRemoveId] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmHwid, setConfirmHwid] = useState(false);
  const [newPriv, setNewPriv] = useState(user?.priv ?? 0);

  // Badge state
  const [allDefs, setAllDefs] = useState<BadgeDefinition[]>([]);
  const [userBadges, setUserBadges] = useState<BadgeDefinition[]>([]);
  const [selectedBadge, setSelectedBadge] = useState("");
  const [badgeMsg, setBadgeMsg] = useState<{ text: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/badges").then((r) => r.json()).then(setAllDefs).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/badges/assign?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => setUserBadges(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [userId]);

  async function handleAssignBadge() {
    if (!selectedBadge) return;
    const res = await fetch("/api/badges/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: selectedBadge, user_id: userId, user_name: user?.name }),
    });
    const d = await res.json();
    setBadgeMsg({ text: res.ok ? "Badge assigned." : (d.error ?? "Error"), ok: res.ok });
    if (res.ok) {
      setSelectedBadge("");
      fetch(`/api/badges/assign?user_id=${userId}`).then((r) => r.json()).then((data) => setUserBadges(Array.isArray(data) ? data : []));
    }
    setTimeout(() => setBadgeMsg(null), 3000);
  }

  async function handleRevokeBadge(badgeId: string) {
    await fetch("/api/badges/assign", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: badgeId, user_id: userId }),
    });
    setUserBadges((prev) => prev.filter((b) => b.id !== badgeId));
  }

  function msg(text: string, ok: boolean) {
    setFlash({ text, ok });
    setTimeout(() => setFlash(null), 5000);
  }

  function reload() {
    start(async () => {
      const r = await getUserDetail(userId);
      if (r.user) {
        setUser(r.user);
        setEditName(r.user.name);
        setEditEmail(r.user.email);
        setEditCountry(r.user.country);
        setNewPriv(r.user.priv);
      }
      if (r.hwid_logs)     setHwidLogs(r.hwid_logs);
      if (r.login_history) setLoginHistory(r.login_history);
      if (r.audit_logs)    setAuditLogs(r.audit_logs);
    });
  }

  function handleRestrict() {
    if (!user) return;
    start(async () => {
      const r = await restrictUser(userId, !user.restricted);
      if (r.error) { msg(r.error, false); return; }
      msg(r.restricted ? "User restricted." : "User unrestricted.", true);
      setConfirmRestrict(false);
      reload();
    });
  }

  function handleSilence() {
    const dur = silencePick === -1 ? (parseInt(silenceCustom) || 0) : silencePick;
    start(async () => {
      const r = await silenceUser(userId, dur, silenceReason);
      if (r.error) { msg(r.error, false); return; }
      msg(`User ${r.action}d.`, true);
      reload();
    });
  }

  function handleUnsilence() {
    start(async () => {
      const r = await silenceUser(userId, 0, "");
      if (r.error) { msg(r.error, false); return; }
      msg("User unsilenced.", true);
      reload();
    });
  }

  function handleEdit() {
    start(async () => {
      const r = await editUser(
        userId,
        editName !== (user?.name ?? "") ? editName : "",
        editEmail,
        editCountry !== (user?.country ?? "") ? editCountry : "",
      );
      if (r.error) { msg(r.error, false); return; }
      msg(r.changes?.length ? `Updated: ${r.changes.join(", ")}` : "No changes.", !!r.changes?.length);
      reload();
    });
  }

  function handleWipe() {
    start(async () => {
      const r = await wipeScores(userId, wipeMode);
      if (r.error) { msg(r.error, false); setConfirmWipe(false); return; }
      msg(`Scores wiped (${WIPE_MODES.find((m) => m.value === wipeMode)?.label}).`, true);
      setConfirmWipe(false);
    });
  }

  function handleRemoveScore() {
    const sid = parseInt(removeId.trim(), 10);
    if (isNaN(sid)) { msg("Invalid score ID.", false); return; }
    start(async () => {
      const r = await removeScore(sid);
      if (r.error) { msg(r.error, false); setConfirmRemove(false); return; }
      msg(`Score #${sid} removed (${r.map}, ${r.pp?.toFixed(0)}pp).`, true);
      setRemoveId(""); setConfirmRemove(false);
    });
  }

  function handleResetHwid() {
    start(async () => {
      const r = await resetHwid(userId);
      if (r.error) { msg(r.error, false); setConfirmHwid(false); return; }
      msg("HWID logs cleared.", true);
      setConfirmHwid(false);
      reload();
    });
  }

  function handleSetPriv() {
    start(async () => {
      const r = await setPriv(userId, newPriv);
      if (r.error) { msg(r.error, false); return; }
      msg("Privileges updated.", true);
      reload();
    });
  }

  if (!user && initialData.error) {
    return (
      <div className="spu-page">
        <div className="spu-container">
          <Link href="/staff" className="spu-back">← Back to Staff Panel</Link>
          <div className="staff-error" style={{ marginTop: "2rem" }}>{initialData.error}</div>
        </div>
      </div>
    );
  }

  const silenced = user && user.silence_remaining > 0;

  return (
    <div className="spu-page">
      <div className="spu-container">

        {/* ── Back link ────────────────────────────── */}
        <Link href="/staff" className="spu-back">← Staff Panel</Link>

        {/* ── User hero header ─────────────────────── */}
        <div className="spu-hero">
          <img src={`http://a.pawinput.xyz/${userId}`} alt="" className="spu-hero-avatar" />
          <div className="spu-hero-info">
            <div className="spu-hero-name-row">
              <Link href={`/u/${userId}`} target="_blank" className="spu-hero-name">
                {user?.name ?? `User #${userId}`}
              </Link>
              <span className="spu-hero-id">#{userId}</span>
              {user?.restricted && <span className="sp-drawer-badge sp-drawer-badge--red">RESTRICTED</span>}
              {silenced && <span className="sp-drawer-badge sp-drawer-badge--orange">SILENCED · {fmtSilence(user.silence_remaining)}</span>}
            </div>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
              {getRoleBadges(user?.priv ?? 0).map((b) => (
                <span key={b.short} className="role-badge" style={{ "--badge-color": b.color, "--badge-glow": b.glow } as React.CSSProperties}>
                  {b.short}<span className="role-badge__tooltip">{b.full}</span>
                </span>
              ))}
            </div>
            <div className="spu-hero-meta">
              <span>{user?.country?.toUpperCase() ?? "—"}</span>
              <span>·</span>
              <span>Joined {fmtDT(user?.creation_time ?? null)}</span>
              <span>·</span>
              <span>Active {fmtDT(user?.latest_activity ?? null)}</span>
            </div>
          </div>
          <button className="staff-action-btn staff-action-btn--gray" onClick={reload} disabled={pending} style={{ alignSelf: "flex-start" }}>
            ↻ Refresh
          </button>
        </div>

        {/* ── Flash message ────────────────────────── */}
        {flash && (
          <div className="spu-flash" style={{ color: flash.ok ? "#6ee7b7" : "#fca5a5", borderColor: flash.ok ? "rgba(110,231,183,0.3)" : "rgba(252,165,165,0.3)" }}>
            {flash.text}
          </div>
        )}

        {/* ── Two-column layout ────────────────────── */}
        <div className="spu-layout">

          {/* ── LEFT: Info + Logs ──────────────────── */}
          <div className="spu-left">

            {/* Info overview */}
            {user && (
              <div className="staff-section">
                <h2 className="staff-section-title">Overview</h2>
                <div className="sp-info-grid" style={{ gridTemplateColumns: "1fr" }}>
                  <InfoRow label="ID"          value={`#${user.id}`} />
                  <InfoRow label="Email"       value={user.email || "—"} mono />
                  <InfoRow label="Country"     value={user.country.toUpperCase()} />
                  <InfoRow label="Priv (raw)"  value={String(user.priv)} mono />
                  <InfoRow label="Joined"      value={fmtDT(user.creation_time)} />
                  <InfoRow label="Last Active" value={fmtDT(user.latest_activity)} />
                  <InfoRow label="Silence"     value={user.silence_remaining > 0 ? fmtSilence(user.silence_remaining) : "None"}
                    color={user.silence_remaining > 0 ? "#f6ad55" : "#6ee7b7"} />
                  <InfoRow label="Silence End" value={user.silence_end > 0 ? fmtDT(user.silence_end) : "—"} />
                  <InfoRow label="Donor End"   value={user.donor_end > 0 ? fmtDT(user.donor_end) : "—"} />
                </div>
              </div>
            )}

            {/* Badges */}
            <div className="staff-section">
              <h2 className="staff-section-title">Badges</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.65rem", minHeight: "22px" }}>
                {userBadges.length === 0 ? (
                  <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.25)" }}>No badges assigned</span>
                ) : (
                  userBadges.map((b) => (
                    <span key={b.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                      <BadgeChip badge={b} />
                      <button className="badges-revoke-btn" onClick={() => handleRevokeBadge(b.id)} title="Revoke">✕</button>
                    </span>
                  ))
                )}
              </div>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                <select
                  className="sp-select"
                  value={selectedBadge}
                  onChange={(e) => setSelectedBadge(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">— select badge —</option>
                  {allDefs.map((d) => (
                    <option key={d.id} value={d.id}>{d.label}</option>
                  ))}
                </select>
                {selectedBadge && (() => { const b = allDefs.find((d) => d.id === selectedBadge); return b ? <BadgeChip badge={b} /> : null; })()}
                <button
                  className="staff-action-btn staff-action-btn--pink"
                  onClick={handleAssignBadge}
                  disabled={!selectedBadge}
                >Assign</button>
              </div>
              {badgeMsg && (
                <div style={{ fontSize: "0.78rem", marginTop: "0.4rem", color: badgeMsg.ok ? "#6ee7b7" : "#fca5a5" }}>
                  {badgeMsg.text}
                </div>
              )}
            </div>

            {/* Tabbed logs */}
            <div className="staff-section">
              <div className="sp-drawer-tabs" style={{ borderRadius: "6px 6px 0 0", overflow: "hidden" }}>
                {(["logins", "hwid", "audit"] as const).map((t) => (
                  <button
                    key={t}
                    className={`sp-drawer-tab${tab === t ? " sp-drawer-tab--active" : ""}`}
                    onClick={() => setTab(t)}
                  >
                    {{ logins: "Login History", hwid: "Hardware IDs", audit: "Audit Log" }[t]}
                    <span className="sp-drawer-tab-count">
                      {t === "logins" ? loginHistory.length : t === "hwid" ? hwidLogs.length : auditLogs.length}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: "0.75rem" }}>
                {/* Login History */}
                {tab === "logins" && (
                  loginHistory.length === 0 ? <div className="sp-expand-empty">No login records.</div> : (
                    <div className="sp-logs-table">
                      <div className="sp-logs-header" style={{ gridTemplateColumns: "155px 130px 95px 85px" }}>
                        <span>Time</span><span>IP</span><span>Version</span><span>Stream</span>
                      </div>
                      {loginHistory.map((l, i) => (
                        <div key={i} className="sp-logs-row" style={{ gridTemplateColumns: "155px 130px 95px 85px" }}>
                          <span className="sp-logs-time">{fmtDT(l.datetime)}</span>
                          <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,255,255,0.75)" }}>{l.ip}</span>
                          <span style={{ fontSize: "0.78rem", color: "#60a5fa" }}>{l.osu_ver}</span>
                          <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>{l.osu_stream}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* HWID */}
                {tab === "hwid" && (
                  hwidLogs.length === 0 ? <div className="sp-expand-empty">No HWID records.</div> : (
                    <div className="sp-logs-table">
                      <div className="sp-logs-header" style={{ gridTemplateColumns: "155px 1fr 1fr 1fr" }}>
                        <span>Time</span><span>CPU</span><span>GPU</span><span>GUID</span>
                      </div>
                      {hwidLogs.map((h, i) => (
                        <div key={i} className="sp-logs-row" style={{ gridTemplateColumns: "155px 1fr 1fr 1fr" }}>
                          <span className="sp-logs-time">{fmtDT(h.login_time)}</span>
                          <span className="sp-hwid-chip" title={h.cpu_md5}>{h.cpu_md5.slice(0, 10)}…</span>
                          <span className="sp-hwid-chip" title={h.gpu_md5}>{h.gpu_md5.slice(0, 10)}…</span>
                          <span className="sp-hwid-chip" title={h.machine_guid_md5}>{h.machine_guid_md5.slice(0, 10)}…</span>
                        </div>
                      ))}
                    </div>
                  )
                )}

                {/* Audit */}
                {tab === "audit" && (
                  auditLogs.length === 0 ? <div className="sp-expand-empty">No audit records.</div> : (
                    <div className="sp-logs-table">
                      <div className="sp-logs-header" style={{ gridTemplateColumns: "155px 110px 100px 1fr" }}>
                        <span>Time</span><span>Actor</span><span>Action</span><span>Message</span>
                      </div>
                      {auditLogs.map((l) => (
                        <div key={l.id} className="sp-logs-row" style={{ gridTemplateColumns: "155px 110px 100px 1fr" }}>
                          <span className="sp-logs-time">{fmtDT(l.time)}</span>
                          <span className="sp-logs-actor">{l.from_name ?? `#${l.from_id}`}</span>
                          <span className="sp-logs-action" style={{ color: ACTION_COLOR[l.action] ?? "#93c5fd" }}>{l.action}</span>
                          <span className="sp-logs-msg">{l.msg ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* ── RIGHT: Actions ─────────────────────── */}
          <div className="spu-right">
            <h2 className="staff-section-title">Actions</h2>

            {/* Restrict */}
            <ActionCard title="Restriction" accent={user?.restricted ? "rgba(110,231,183,0.6)" : "rgba(252,165,165,0.6)"}>
              <p className="spu-action-desc">
                {user?.restricted
                  ? "This user is currently restricted. They cannot log in or access the server."
                  : "Restricting will prevent this user from logging in and hide them from leaderboards."}
              </p>
              {!confirmRestrict ? (
                <button
                  className={`staff-action-btn ${user?.restricted ? "staff-action-btn--green" : "staff-action-btn--red"}`}
                  onClick={() => setConfirmRestrict(true)} disabled={pending}
                >
                  {user?.restricted ? "Unrestrict User" : "Restrict User"}
                </button>
              ) : (
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  <span className="sp-confirm-label">Are you sure?</span>
                  <button className="staff-action-btn staff-action-btn--red" onClick={handleRestrict} disabled={pending}>Confirm</button>
                  <button className="staff-action-btn staff-action-btn--gray" onClick={() => setConfirmRestrict(false)}>Cancel</button>
                </div>
              )}
            </ActionCard>

            {/* Silence */}
            <ActionCard title="Silence">
              <p className="spu-action-desc">Prevent the user from chatting in-game for a set duration.</p>
              <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
                {SILENCE_OPTS.map((o) => (
                  <button
                    key={o.value}
                    className={`staff-action-btn ${silencePick === o.value ? "staff-action-btn--pink" : "staff-action-btn--gray"}`}
                    onClick={() => setSilencePick(o.value)}
                  >{o.label}</button>
                ))}
              </div>
              {silencePick === -1 && (
                <input className="staff-search-input" style={{ width: "100%", marginBottom: "0.5rem" }}
                  type="number" placeholder="Duration in seconds"
                  value={silenceCustom} onChange={(e) => setSilenceCustom(e.target.value)} />
              )}
              <input className="staff-search-input" style={{ width: "100%", marginBottom: "0.5rem" }}
                placeholder="Reason (optional)"
                value={silenceReason} onChange={(e) => setSilenceReason(e.target.value)} />
              <div style={{ display: "flex", gap: "0.4rem" }}>
                <button className="staff-action-btn staff-action-btn--red" onClick={handleSilence} disabled={pending}>Apply Silence</button>
                {silenced && (
                  <button className="staff-action-btn staff-action-btn--green" onClick={handleUnsilence} disabled={pending}>Unsilence</button>
                )}
              </div>
            </ActionCard>

            {/* Edit User */}
            <ActionCard title="Edit User">
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                <label className="spu-field-label">Username
                  <input className="staff-search-input" style={{ width: "100%", marginTop: "0.2rem" }}
                    value={editName} onChange={(e) => setEditName(e.target.value)} />
                </label>
                <label className="spu-field-label">Email
                  <input className="staff-search-input" style={{ width: "100%", marginTop: "0.2rem" }}
                    value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </label>
                <label className="spu-field-label">Country code (2-char)
                  <input className="staff-search-input" style={{ width: "70px", marginTop: "0.2rem" }}
                    maxLength={2} value={editCountry} onChange={(e) => setEditCountry(e.target.value.toLowerCase())} />
                </label>
                <button className="staff-action-btn staff-action-btn--pink" onClick={handleEdit} disabled={pending} style={{ alignSelf: "flex-start" }}>
                  Save Changes
                </button>
              </div>
            </ActionCard>

            {/* Wipe Scores */}
            <ActionCard title="Wipe Scores" accent="rgba(252,165,165,0.5)">
              <p className="spu-action-desc">Permanently delete all scores for a game mode.</p>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center", flexWrap: "wrap" }}>
                <select className="sp-select" value={wipeMode} onChange={(e) => { setWipeMode(Number(e.target.value)); setConfirmWipe(false); }}>
                  {WIPE_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
                {!confirmWipe ? (
                  <button className="staff-action-btn staff-action-btn--red" onClick={() => setConfirmWipe(true)} disabled={pending}>Wipe</button>
                ) : (
                  <>
                    <span className="sp-confirm-label">This cannot be undone.</span>
                    <button className="staff-action-btn staff-action-btn--red" onClick={handleWipe} disabled={pending}>Confirm Wipe</button>
                    <button className="staff-action-btn staff-action-btn--gray" onClick={() => setConfirmWipe(false)}>Cancel</button>
                  </>
                )}
              </div>
            </ActionCard>

            {/* Remove Score */}
            <ActionCard title="Remove Score">
              <p className="spu-action-desc">Delete a single score by its database ID.</p>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                <input className="staff-search-input" style={{ width: "130px" }}
                  type="number" placeholder="Score ID"
                  value={removeId} onChange={(e) => { setRemoveId(e.target.value); setConfirmRemove(false); }} />
                {!confirmRemove ? (
                  <button className="staff-action-btn staff-action-btn--red" onClick={() => setConfirmRemove(true)} disabled={!removeId || pending}>Remove</button>
                ) : (
                  <>
                    <button className="staff-action-btn staff-action-btn--red" onClick={handleRemoveScore} disabled={pending}>Confirm</button>
                    <button className="staff-action-btn staff-action-btn--gray" onClick={() => setConfirmRemove(false)}>Cancel</button>
                  </>
                )}
              </div>
            </ActionCard>

            {/* Reset HWID */}
            <ActionCard title="Reset HWID Logs" accent="rgba(147,197,253,0.4)">
              <p className="spu-action-desc">Delete all hardware ID records for this user, allowing a hardware-banned device to be re-associated.</p>
              {!confirmHwid ? (
                <button className="staff-action-btn staff-action-btn--red" onClick={() => setConfirmHwid(true)} disabled={pending}>
                  Clear HWID Records
                </button>
              ) : (
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  <span className="sp-confirm-label">Delete all {hwidLogs.length} HWID records?</span>
                  <button className="staff-action-btn staff-action-btn--red" onClick={handleResetHwid} disabled={pending}>Yes, delete</button>
                  <button className="staff-action-btn staff-action-btn--gray" onClick={() => setConfirmHwid(false)}>Cancel</button>
                </div>
              )}
            </ActionCard>

            {/* Privileges (dev only) */}
            {isDev && (
              <ActionCard title="Privileges" accent="rgba(196,181,253,0.4)">
                <div className="staff-priv-grid" style={{ marginBottom: "0.65rem" }}>
                  {PRIV_FLAGS.map(({ label, bit }) => (
                    <label key={bit} className="staff-priv-flag">
                      <input type="checkbox" checked={!!(newPriv & bit)} onChange={(e) => setNewPriv(e.target.checked ? newPriv | bit : newPriv & ~bit)} />
                      {label}
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>raw: {newPriv}</span>
                  <button className="staff-action-btn staff-action-btn--pink" onClick={handleSetPriv} disabled={pending}>Save Priv</button>
                </div>
              </ActionCard>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
