"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import {
  restrictUser, setPriv, wipeScores, silenceUser, editUser, resetHwid, removeScore, getUserDetail,
  type StaffUser, type UserDetail, type HwidLog, type LoginHistory, type AuditLog,
} from "./actions";
import { getRoleBadges } from "@/lib/utils";
import BadgeChip from "@/components/BadgeChip";
import type { BadgeDefinition } from "@/types/badge";

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
  { label: "All Modes", value: -1 },
  { label: "vn!std",    value: 0  },
  { label: "vn!taiko",  value: 1  },
  { label: "vn!catch",  value: 2  },
  { label: "vn!mania",  value: 3  },
  { label: "rx!std",    value: 4  },
  { label: "rx!taiko",  value: 5  },
  { label: "rx!catch",  value: 6  },
  { label: "ap!std",    value: 8  },
];

const SILENCE_DURATIONS = [
  { label: "1h",     value: 3600   },
  { label: "6h",     value: 21600  },
  { label: "24h",    value: 86400  },
  { label: "7d",     value: 604800 },
  { label: "Custom", value: -1     },
];

const ACTION_COLOR: Record<string, string> = {
  restrict: "#fca5a5", unrestrict: "#6ee7b7",
  silence: "#f6ad55",  unsilence: "#6ee7b7",
  wipe: "#fca5a5",     reset_hwid: "#93c5fd",
  remove_score: "#fca5a5", edit_user: "#c4b5fd",
};

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

type DrawerData = {
  detail: UserDetail;
  hwid_logs: HwidLog[];
  login_history: LoginHistory[];
  audit_logs: AuditLog[];
};

export default function UserDetailDrawer({
  user: initialUser,
  isDev,
  onClose,
  onUpdate,
}: {
  user: StaffUser;
  isDev: boolean;
  onClose: () => void;
  onUpdate: (u: StaffUser) => void;
}) {
  const [user, setUser] = useState(initialUser);
  const [data, setData] = useState<DrawerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "logins" | "hwid" | "audit">("overview");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Action sub-states
  const [confirmRestrict, setConfirmRestrict] = useState(false);
  const [silenceOpen, setSilenceOpen] = useState(false);
  const [silencePick, setSilencePick] = useState(3600);
  const [silenceCustom, setSilenceCustom] = useState("");
  const [silenceReason, setSilenceReason] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editEmail, setEditEmail] = useState("");
  const [editCountry, setEditCountry] = useState(user.country);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeMode, setWipeMode] = useState(-1);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const [removeOpen, setRemoveOpen] = useState(false);
  const [removeId, setRemoveId] = useState("");
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmHwid, setConfirmHwid] = useState(false);
  const [privOpen, setPrivOpen] = useState(false);
  const [newPriv, setNewPriv] = useState(user.priv);

  // Badge state
  const [allDefs, setAllDefs] = useState<BadgeDefinition[]>([]);
  const [userBadges, setUserBadges] = useState<BadgeDefinition[]>([]);
  const [selectedBadge, setSelectedBadge] = useState("");
  const [badgeMsg, setBadgeMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function flash(text: string, ok: boolean) {
    setMsg({ text, ok });
    setTimeout(() => setMsg(null), 4000);
  }

  function reload() {
    setLoading(true);
    getUserDetail(user.id).then((res) => {
      setLoading(false);
      if (res.error) { flash(res.error, false); return; }
      setData({
        detail: res.user!,
        hwid_logs: res.hwid_logs ?? [],
        login_history: res.login_history ?? [],
        audit_logs: res.audit_logs ?? [],
      });
      setEditEmail(res.user?.email ?? "");
    });
  }

  useEffect(() => { reload(); }, [user.id]);

  useEffect(() => {
    fetch("/api/badges").then((r) => r.json()).then(setAllDefs).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/badges/assign?user_id=${user.id}`)
      .then((r) => r.json())
      .then((d) => setUserBadges(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [user.id]);

  async function handleAssignBadge() {
    if (!selectedBadge) return;
    const res = await fetch("/api/badges/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: selectedBadge, user_id: user.id, user_name: user.name }),
    });
    const d = await res.json();
    if (res.ok) {
      setBadgeMsg({ text: "Badge assigned.", ok: true });
      setSelectedBadge("");
      fetch(`/api/badges/assign?user_id=${user.id}`).then((r) => r.json()).then((data) => setUserBadges(Array.isArray(data) ? data : []));
    } else {
      setBadgeMsg({ text: d.error ?? "Error", ok: false });
    }
    setTimeout(() => setBadgeMsg(null), 3000);
  }

  async function handleRevokeBadge(badgeId: string) {
    await fetch("/api/badges/assign", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ badge_id: badgeId, user_id: user.id }),
    });
    setUserBadges((prev) => prev.filter((b) => b.id !== badgeId));
  }

  // Close on Escape
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  function handleRestrict() {
    start(async () => {
      const r = await restrictUser(user.id, !user.restricted);
      if (r.error) { flash(r.error, false); return; }
      const updated = { ...user, restricted: r.restricted!, priv: r.restricted! ? user.priv & ~1 : user.priv | 1 };
      setUser(updated);
      onUpdate(updated);
      flash(r.restricted ? "User restricted." : "User unrestricted.", true);
      setConfirmRestrict(false);
      reload();
    });
  }

  function handleSilence() {
    const dur = silencePick === -1 ? (parseInt(silenceCustom) || 0) : silencePick;
    start(async () => {
      const r = await silenceUser(user.id, dur, silenceReason);
      if (r.error) { flash(r.error, false); return; }
      flash(`User ${r.action}d.`, true);
      setSilenceOpen(false);
      reload();
    });
  }

  function handleUnsilence() {
    start(async () => {
      const r = await silenceUser(user.id, 0, "");
      if (r.error) { flash(r.error, false); return; }
      flash("User unsilenced.", true);
      setSilenceOpen(false);
      reload();
    });
  }

  function handleEdit() {
    start(async () => {
      const r = await editUser(
        user.id,
        editName !== user.name ? editName : "",
        editEmail,
        editCountry !== user.country ? editCountry : "",
      );
      if (r.error) { flash(r.error, false); return; }
      if (r.changes?.length) {
        const updated = { ...user, name: editName, country: editCountry };
        setUser(updated);
        onUpdate(updated);
        flash(`Updated: ${r.changes.join(", ")}`, true);
      } else {
        flash("No changes applied.", false);
      }
      setEditOpen(false);
      reload();
    });
  }

  function handleWipe() {
    start(async () => {
      const r = await wipeScores(user.id, wipeMode);
      if (r.error) { flash(r.error, false); setConfirmWipe(false); return; }
      flash(`Scores wiped (${WIPE_MODES.find((m) => m.value === wipeMode)?.label}).`, true);
      setConfirmWipe(false);
      setWipeOpen(false);
    });
  }

  function handleResetHwid() {
    start(async () => {
      const r = await resetHwid(user.id);
      if (r.error) { flash(r.error, false); setConfirmHwid(false); return; }
      flash("HWID logs cleared.", true);
      setConfirmHwid(false);
      reload();
    });
  }

  function handleRemoveScore() {
    const sid = parseInt(removeId.trim(), 10);
    if (isNaN(sid)) { flash("Invalid score ID.", false); return; }
    start(async () => {
      const r = await removeScore(sid);
      if (r.error) { flash(r.error, false); setConfirmRemove(false); return; }
      flash(`Score #${sid} removed (${r.map}, ${r.pp?.toFixed(0)}pp).`, true);
      setRemoveOpen(false);
      setRemoveId("");
      setConfirmRemove(false);
    });
  }

  function handleSetPriv() {
    start(async () => {
      const r = await setPriv(user.id, newPriv);
      if (r.error) { flash(r.error, false); return; }
      const updated = { ...user, priv: r.new_priv!, restricted: !(r.new_priv! & 1) };
      setUser(updated);
      onUpdate(updated);
      flash("Privileges updated.", true);
      setPrivOpen(false);
      reload();
    });
  }

  const detail = data?.detail;
  const silenced = detail && detail.silence_remaining > 0;

  return (
    <>
      {/* Backdrop */}
      <div className="sp-drawer-backdrop" onClick={onClose} />

      {/* Drawer */}
      <div className="sp-drawer">
        {/* ── Header ─────────────────────────────────── */}
        <div className="sp-drawer-header">
          <img
            src={`http://a.pawinput.xyz/${user.id}`}
            alt=""
            className="sp-drawer-avatar"
          />
          <div className="sp-drawer-header-info">
            <div className="sp-drawer-name-row">
              <Link href={`/u/${user.id}`} target="_blank" className="sp-drawer-name">
                {user.name}
              </Link>
              <span className="sp-drawer-uid">#{user.id}</span>
              {user.restricted && (
                <span className="sp-drawer-badge sp-drawer-badge--red">RESTRICTED</span>
              )}
              {silenced && (
                <span className="sp-drawer-badge sp-drawer-badge--orange">
                  SILENCED {fmtSilence(detail.silence_remaining)}
                </span>
              )}
            </div>
            <div className="sp-drawer-badges-row">
              {getRoleBadges(user.priv).map((b) => (
                <span
                  key={b.short}
                  className="role-badge"
                  style={{ "--badge-color": b.color, "--badge-glow": b.glow } as React.CSSProperties}
                >
                  {b.short}
                  <span className="role-badge__tooltip">{b.full}</span>
                </span>
              ))}
            </div>
          </div>
          <button className="sp-drawer-close" onClick={onClose} title="Close (Esc)">✕</button>
        </div>

        {/* ── Flash message ───────────────────────────── */}
        {msg && (
          <div className="sp-drawer-msg" style={{ color: msg.ok ? "#6ee7b7" : "#fca5a5" }}>
            {msg.text}
          </div>
        )}

        {/* ── Action bar ──────────────────────────────── */}
        <div className="sp-drawer-actions">
          {!confirmRestrict ? (
            <button
              className={`staff-action-btn ${user.restricted ? "staff-action-btn--green" : "staff-action-btn--red"}`}
              onClick={() => setConfirmRestrict(true)} disabled={pending}
            >
              {user.restricted ? "Unrestrict" : "Restrict"}
            </button>
          ) : (
            <div className="sp-confirm-row">
              <span className="sp-confirm-label">{user.restricted ? "Unrestrict" : "Restrict"}?</span>
              <button className="staff-action-btn staff-action-btn--red" onClick={handleRestrict} disabled={pending}>Yes</button>
              <button className="staff-action-btn staff-action-btn--gray" onClick={() => setConfirmRestrict(false)}>No</button>
            </div>
          )}
          <button className={`staff-action-btn ${silenceOpen ? "staff-action-btn--pink" : "staff-action-btn--gray"}`} onClick={() => setSilenceOpen((v) => !v)} disabled={pending}>Silence</button>
          <button className={`staff-action-btn ${editOpen ? "staff-action-btn--pink" : "staff-action-btn--gray"}`} onClick={() => setEditOpen((v) => !v)} disabled={pending}>Edit</button>
          <button className={`staff-action-btn ${wipeOpen ? "staff-action-btn--pink" : "staff-action-btn--gray"}`} onClick={() => setWipeOpen((v) => !v)} disabled={pending}>Wipe</button>
          <button className={`staff-action-btn ${removeOpen ? "staff-action-btn--pink" : "staff-action-btn--gray"}`} onClick={() => setRemoveOpen((v) => !v)} disabled={pending}>Rm Score</button>
          {isDev && (
            <button className={`staff-action-btn ${privOpen ? "staff-action-btn--pink" : "staff-action-btn--gray"}`} onClick={() => setPrivOpen((v) => !v)} disabled={pending}>Priv</button>
          )}
          <button className="staff-action-btn staff-action-btn--gray" onClick={reload} disabled={pending || loading}>↻</button>
        </div>

        {/* ── Inline action panels ────────────────────── */}
        {silenceOpen && (
          <div className="sp-drawer-panel">
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
              <span className="sp-panel-label">Duration:</span>
              {SILENCE_DURATIONS.map((d) => (
                <button
                  key={d.value}
                  className={`staff-action-btn ${silencePick === d.value ? "staff-action-btn--pink" : "staff-action-btn--gray"}`}
                  onClick={() => setSilencePick(d.value)}
                >{d.label}</button>
              ))}
              {silencePick === -1 && (
                <input className="staff-search-input" style={{ width: "90px" }} type="number" placeholder="Seconds"
                  value={silenceCustom} onChange={(e) => setSilenceCustom(e.target.value)} />
              )}
            </div>
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem", alignItems: "center" }}>
              <input className="staff-search-input" style={{ flex: 1 }} placeholder="Reason (optional)"
                value={silenceReason} onChange={(e) => setSilenceReason(e.target.value)} />
              <button className="staff-action-btn staff-action-btn--red" onClick={handleSilence} disabled={pending}>Apply</button>
              <button className="staff-action-btn staff-action-btn--green" onClick={handleUnsilence} disabled={pending}>Unsilence</button>
            </div>
          </div>
        )}

        {editOpen && (
          <div className="sp-drawer-panel">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px", gap: "0.5rem" }}>
              <input className="staff-search-input" placeholder="Username" value={editName} onChange={(e) => setEditName(e.target.value)} />
              <input className="staff-search-input" placeholder="Email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
              <input className="staff-search-input" placeholder="CC" maxLength={2} value={editCountry} onChange={(e) => setEditCountry(e.target.value.toLowerCase())} />
            </div>
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.5rem" }}>
              <button className="staff-action-btn staff-action-btn--pink" onClick={handleEdit} disabled={pending}>Save</button>
              <button className="staff-action-btn staff-action-btn--gray" onClick={() => setEditOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        {wipeOpen && (
          <div className="sp-drawer-panel">
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
              <span className="sp-panel-label">Mode:</span>
              <select className="sp-select" value={wipeMode} onChange={(e) => { setWipeMode(Number(e.target.value)); setConfirmWipe(false); }}>
                {WIPE_MODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              {!confirmWipe ? (
                <button className="staff-action-btn staff-action-btn--red" onClick={() => setConfirmWipe(true)} disabled={pending}>Wipe</button>
              ) : (
                <>
                  <span className="sp-confirm-label">Sure?</span>
                  <button className="staff-action-btn staff-action-btn--red" onClick={handleWipe} disabled={pending}>Yes</button>
                  <button className="staff-action-btn staff-action-btn--gray" onClick={() => setConfirmWipe(false)}>No</button>
                </>
              )}
            </div>
          </div>
        )}

        {removeOpen && (
          <div className="sp-drawer-panel">
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <span className="sp-panel-label">Score ID:</span>
              <input className="staff-search-input" style={{ width: "120px" }} type="number" placeholder="Score ID"
                value={removeId} onChange={(e) => { setRemoveId(e.target.value); setConfirmRemove(false); }} />
              {!confirmRemove ? (
                <button className="staff-action-btn staff-action-btn--red" onClick={() => setConfirmRemove(true)} disabled={!removeId || pending}>Remove</button>
              ) : (
                <>
                  <span className="sp-confirm-label">Sure?</span>
                  <button className="staff-action-btn staff-action-btn--red" onClick={handleRemoveScore} disabled={pending}>Yes</button>
                  <button className="staff-action-btn staff-action-btn--gray" onClick={() => setConfirmRemove(false)}>No</button>
                </>
              )}
            </div>
          </div>
        )}

        {privOpen && isDev && (
          <div className="sp-drawer-panel">
            <div className="staff-priv-grid">
              {PRIV_FLAGS.map(({ label, bit }) => (
                <label key={bit} className="staff-priv-flag">
                  <input type="checkbox" checked={!!(newPriv & bit)} onChange={(e) => setNewPriv(e.target.checked ? newPriv | bit : newPriv & ~bit)} />
                  {label}
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem", alignItems: "center" }}>
              <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)" }}>Raw: {newPriv}</span>
              <button className="staff-action-btn staff-action-btn--pink" onClick={handleSetPriv} disabled={pending}>Save</button>
              <button className="staff-action-btn staff-action-btn--gray" onClick={() => setPrivOpen(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Tab bar ─────────────────────────────────── */}
        <div className="sp-drawer-tabs">
          {(["overview", "logins", "hwid", "audit"] as const).map((t) => (
            <button
              key={t}
              className={`sp-drawer-tab${tab === t ? " sp-drawer-tab--active" : ""}`}
              onClick={() => setTab(t)}
            >
              {{ overview: "Overview", logins: "Login History", hwid: "Hardware IDs", audit: "Audit Log" }[t]}
              {t === "logins" && data && <span className="sp-drawer-tab-count">{data.login_history.length}</span>}
              {t === "hwid"   && data && <span className="sp-drawer-tab-count">{data.hwid_logs.length}</span>}
              {t === "audit"  && data && <span className="sp-drawer-tab-count">{data.audit_logs.length}</span>}
            </button>
          ))}
        </div>

        {/* ── Tab content ─────────────────────────────── */}
        <div className="sp-drawer-body">
          {loading && <div className="sp-drawer-loading">Loading user data…</div>}

          {/* OVERVIEW */}
          {!loading && tab === "overview" && detail && (
            <div className="sp-drawer-overview">
              <div className="sp-info-grid">
                <InfoRow label="ID"           value={`#${detail.id}`} />
                <InfoRow label="Email"        value={detail.email || "—"} mono />
                <InfoRow label="Country"      value={detail.country.toUpperCase()} />
                <InfoRow label="Priv (raw)"   value={String(detail.priv)} mono />
                <InfoRow label="Joined"       value={fmtDT(detail.creation_time)} />
                <InfoRow label="Last Active"  value={fmtDT(detail.latest_activity)} />
                <InfoRow label="Silence"
                  value={detail.silence_remaining > 0 ? fmtSilence(detail.silence_remaining) : "None"}
                  valueColor={detail.silence_remaining > 0 ? "#f6ad55" : "#6ee7b7"}
                />
                <InfoRow label="Silence End"  value={detail.silence_end > 0 ? fmtDT(detail.silence_end) : "—"} />
                <InfoRow label="Donor End"    value={detail.donor_end > 0 ? fmtDT(detail.donor_end) : "—"} />
                <InfoRow label="Restricted"   value={detail.restricted ? "Yes" : "No"} valueColor={detail.restricted ? "#fca5a5" : "#6ee7b7"} />
              </div>

              {/* Badges */}
              <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="sp-expand-title" style={{ marginBottom: "0.6rem" }}>Badges</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.65rem", minHeight: "22px" }}>
                  {userBadges.length === 0 ? (
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.2)" }}>No badges assigned</span>
                  ) : (
                    userBadges.map((b) => (
                      <span key={b.id} style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                        <BadgeChip badge={b} />
                        <button
                          className="badges-revoke-btn"
                          onClick={() => handleRevokeBadge(b.id)}
                          title="Revoke"
                        >✕</button>
                      </span>
                    ))
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                  <select
                    className="sp-select"
                    value={selectedBadge}
                    onChange={(e) => setSelectedBadge(e.target.value)}
                    style={{ flex: 1, minWidth: "150px" }}
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

              {/* HWID reset button in overview */}
              <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="sp-expand-title" style={{ marginBottom: "0.65rem" }}>Danger Zone</div>
                {!confirmHwid ? (
                  <button className="staff-action-btn staff-action-btn--red" onClick={() => setConfirmHwid(true)}>
                    Reset HWID Logs
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                    <span className="sp-confirm-label">Delete all HWID records for this user?</span>
                    <button className="staff-action-btn staff-action-btn--red" onClick={handleResetHwid} disabled={pending}>Yes, delete</button>
                    <button className="staff-action-btn staff-action-btn--gray" onClick={() => setConfirmHwid(false)}>Cancel</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* LOGIN HISTORY */}
          {!loading && tab === "logins" && data && (
            <div>
              {data.login_history.length === 0 ? (
                <div className="sp-expand-empty">No login records.</div>
              ) : (
                <div className="sp-logs-table">
                  <div className="sp-logs-header" style={{ gridTemplateColumns: "155px 140px 100px 90px" }}>
                    <span>Time</span><span>IP</span><span>osu! Version</span><span>Stream</span>
                  </div>
                  {data.login_history.map((l, i) => (
                    <div key={i} className="sp-logs-row" style={{ gridTemplateColumns: "155px 140px 100px 90px" }}>
                      <span className="sp-logs-time">{fmtDT(l.datetime)}</span>
                      <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "rgba(255,255,255,0.75)" }}>{l.ip}</span>
                      <span style={{ fontSize: "0.78rem", color: "#60a5fa" }}>{l.osu_ver}</span>
                      <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>{l.osu_stream}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HARDWARE IDs */}
          {!loading && tab === "hwid" && data && (
            <div>
              {data.hwid_logs.length === 0 ? (
                <div className="sp-expand-empty">No HWID records.</div>
              ) : (
                <div className="sp-logs-table">
                  <div className="sp-logs-header" style={{ gridTemplateColumns: "155px 1fr 1fr 1fr" }}>
                    <span>Time</span><span>CPU</span><span>GPU</span><span>Machine GUID</span>
                  </div>
                  {data.hwid_logs.map((h, i) => (
                    <div key={i} className="sp-logs-row" style={{ gridTemplateColumns: "155px 1fr 1fr 1fr" }}>
                      <span className="sp-logs-time">{fmtDT(h.login_time)}</span>
                      <span className="sp-hwid-chip" title={h.cpu_md5}>{h.cpu_md5.slice(0, 10)}…</span>
                      <span className="sp-hwid-chip" title={h.gpu_md5}>{h.gpu_md5.slice(0, 10)}…</span>
                      <span className="sp-hwid-chip" title={h.machine_guid_md5}>{h.machine_guid_md5.slice(0, 10)}…</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* AUDIT LOG */}
          {!loading && tab === "audit" && data && (
            <div>
              {data.audit_logs.length === 0 ? (
                <div className="sp-expand-empty">No audit records for this user.</div>
              ) : (
                <div className="sp-logs-table">
                  <div className="sp-logs-header" style={{ gridTemplateColumns: "155px 120px 110px 1fr" }}>
                    <span>Time</span><span>Actor</span><span>Action</span><span>Message</span>
                  </div>
                  {data.audit_logs.map((l) => (
                    <div key={l.id} className="sp-logs-row" style={{ gridTemplateColumns: "155px 120px 110px 1fr" }}>
                      <span className="sp-logs-time">{fmtDT(l.time)}</span>
                      <span className="sp-logs-actor">{l.from_name ?? `#${l.from_id}`}</span>
                      <span className="sp-logs-action" style={{ color: ACTION_COLOR[l.action] ?? "#93c5fd" }}>{l.action}</span>
                      <span className="sp-logs-msg">{l.msg ?? "—"}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function InfoRow({ label, value, mono, valueColor }: { label: string; value: string; mono?: boolean; valueColor?: string }) {
  return (
    <div className="sp-info-row">
      <span className="sp-info-label">{label}</span>
      <span className="sp-info-value" style={{ fontFamily: mono ? "monospace" : undefined, color: valueColor }}>
        {value}
      </span>
    </div>
  );
}
