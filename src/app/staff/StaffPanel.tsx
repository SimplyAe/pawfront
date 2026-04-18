"use client";

import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  lookupUser,
  restrictUser,
  setPriv,
  getRecentUsers,
  wipeScores,
  lookupMap,
  setMapStatus,
  getRecentScores,
  type StaffUser,
  type RecentScore,
} from "./actions";
import { getRoleBadges, gradeToFile, timeAgo, intToModeLabel, parseMods } from "@/lib/utils";

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

const MAP_STATUSES: { label: string; value: number; color: string }[] = [
  { label: "Ranked",    value: 2,  color: "#68d391" },
  { label: "Approved",  value: 3,  color: "#63b3ed" },
  { label: "Loved",     value: 5,  color: "#f687b3" },
  { label: "Pending",   value: 0,  color: "#f6ad55" },
  { label: "Graveyard", value: -2, color: "#a0aec0" },
];

function formatJoinDate(iso: string | null): string {
  if (!iso) return "Unknown";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

function PrivBadges({ priv }: { priv: number }) {
  const badges = getRoleBadges(priv);
  if (!badges.length) return <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.78rem" }}>None</span>;
  return (
    <>
      {badges.map((b) => (
        <span key={b.short} className="role-badge" style={{ "--badge-color": b.color, "--badge-glow": b.glow } as React.CSSProperties}>
          {b.short}
          <span className="role-badge__tooltip">{b.full}</span>
        </span>
      ))}
    </>
  );
}

function UserCard({
  user,
  isDev,
  onUpdate,
}: {
  user: StaffUser;
  isDev: boolean;
  onUpdate: (u: StaffUser) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [privEdit, setPrivEdit] = useState(false);
  const [newPriv, setNewPriv] = useState(user.priv);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [confirmRestrict, setConfirmRestrict] = useState(false);
  const [wipeOpen, setWipeOpen] = useState(false);
  const [wipeMode, setWipeMode] = useState(-1);
  const [confirmWipe, setConfirmWipe] = useState(false);

  function handleToggleRestrict() {
    startTransition(async () => {
      const result = await restrictUser(user.id, !user.restricted);
      if (result.error) { setMsg({ text: result.error, ok: false }); setConfirmRestrict(false); return; }
      onUpdate({ ...user, restricted: result.restricted!, priv: result.restricted! ? user.priv & ~1 : user.priv | 1 });
      setMsg({ text: result.restricted ? "User restricted." : "User unrestricted.", ok: true });
      setConfirmRestrict(false);
    });
  }

  function handleSetPriv() {
    startTransition(async () => {
      const result = await setPriv(user.id, newPriv);
      if (result.error) { setMsg({ text: result.error, ok: false }); return; }
      onUpdate({ ...user, priv: result.new_priv!, restricted: !(result.new_priv! & 1) });
      setPrivEdit(false);
      setMsg({ text: "Privileges updated.", ok: true });
    });
  }

  function handleWipe() {
    startTransition(async () => {
      const result = await wipeScores(user.id, wipeMode);
      if (result.error) { setMsg({ text: result.error, ok: false }); setConfirmWipe(false); return; }
      const modeLabel = WIPE_MODES.find((m) => m.value === wipeMode)?.label ?? String(wipeMode);
      setMsg({ text: `Scores wiped for ${modeLabel}.`, ok: true });
      setConfirmWipe(false);
      setWipeOpen(false);
    });
  }

  return (
    <div className={`staff-card${user.restricted ? " staff-card--restricted" : ""}`}>
      <div className="staff-card-header">
        <img src={`http://a.pawinput.xyz/${user.id}`} alt="" className="staff-card-avatar" />
        <div className="staff-card-info">
          <Link href={`/u/${user.id}`} className="staff-card-name">{user.name}</Link>
          <span className="staff-card-id">
            #{user.id} &middot; {user.country.toUpperCase()} &middot; Joined {formatJoinDate(user.creation_time)}
          </span>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
            <PrivBadges priv={user.priv} />
            {user.restricted && (
              <span style={{ fontSize: "0.7rem", color: "#fc8181", border: "1px solid rgba(252,129,129,0.4)", padding: "1px 6px", borderRadius: "3px" }}>RESTRICTED</span>
            )}
          </div>
        </div>
        <div className="staff-card-actions">
          {!confirmRestrict ? (
            <button
              className={`staff-action-btn${user.restricted ? " staff-action-btn--green" : " staff-action-btn--red"}`}
              onClick={() => setConfirmRestrict(true)}
              disabled={pending}
            >
              {user.restricted ? "Unrestrict" : "Restrict"}
            </button>
          ) : (
            <div className="sp-confirm-row">
              <span className="sp-confirm-label">{user.restricted ? "Unrestrict" : "Restrict"}?</span>
              <button className="staff-action-btn staff-action-btn--red" onClick={handleToggleRestrict} disabled={pending}>Yes</button>
              <button className="staff-action-btn staff-action-btn--gray" onClick={() => setConfirmRestrict(false)}>No</button>
            </div>
          )}
          <button
            className="staff-action-btn staff-action-btn--gray"
            onClick={() => { setWipeOpen((v) => !v); setConfirmWipe(false); }}
            disabled={pending}
          >
            Wipe
          </button>
          {isDev && (
            <button
              className="staff-action-btn staff-action-btn--gray"
              onClick={() => setPrivEdit((v) => !v)}
              disabled={pending}
            >
              Priv
            </button>
          )}
        </div>
      </div>

      {msg && (
        <div className="staff-card-msg" style={{ color: msg.ok ? "#68d391" : "#fc8181" }}>
          {msg.text}
        </div>
      )}

      {wipeOpen && (
        <div className="sp-wipe-panel">
          <div className="sp-wipe-row">
            <span className="sp-panel-label">Wipe scores</span>
            <select
              className="sp-select"
              value={wipeMode}
              onChange={(e) => { setWipeMode(Number(e.target.value)); setConfirmWipe(false); }}
            >
              {WIPE_MODES.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
            {!confirmWipe ? (
              <button className="staff-action-btn staff-action-btn--red" onClick={() => setConfirmWipe(true)} disabled={pending}>
                Wipe
              </button>
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

      {privEdit && isDev && (
        <div className="staff-priv-editor">
          <div className="staff-priv-grid">
            {PRIV_FLAGS.map(({ label, bit }) => (
              <label key={bit} className="staff-priv-flag">
                <input
                  type="checkbox"
                  checked={!!(newPriv & bit)}
                  onChange={(e) => setNewPriv(e.target.checked ? newPriv | bit : newPriv & ~bit)}
                />
                {label}
              </label>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>Raw: {newPriv}</span>
            <button className="staff-action-btn staff-action-btn--pink" onClick={handleSetPriv} disabled={pending}>Save</button>
            <button className="staff-action-btn staff-action-btn--gray" onClick={() => setPrivEdit(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

type MapInfo = { id: number; set_id: number; title: string; artist: string; version: string; status: number };

function MapPanel() {
  const [mapId, setMapId] = useState("");
  const [mapInfo, setMapInfo] = useState<MapInfo | null>(null);
  const [mapError, setMapError] = useState("");
  const [looking, startLook] = useTransition();
  const [pending, startSet] = useTransition();
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    const id = parseInt(mapId.trim(), 10);
    if (isNaN(id)) { setMapError("Enter a valid map ID."); return; }
    setMapError("");
    setMapInfo(null);
    setStatusMsg(null);
    startLook(async () => {
      const res = await lookupMap(id);
      if (res.error) { setMapError(res.error); return; }
      setMapInfo(res.map!);
    });
  }

  function handleSetStatus(newStatus: number) {
    if (!mapInfo) return;
    startSet(async () => {
      const res = await setMapStatus(mapInfo.id, newStatus);
      if (res.error) { setStatusMsg({ text: res.error, ok: false }); return; }
      setMapInfo((prev) => prev ? { ...prev, status: newStatus } : prev);
      const label = MAP_STATUSES.find((s) => s.value === newStatus)?.label ?? String(newStatus);
      setStatusMsg({ text: `Map set to ${label}.`, ok: true });
    });
  }

  const currentStatus = MAP_STATUSES.find((s) => s.value === mapInfo?.status);

  return (
    <section className="staff-section">
      <h2 className="staff-section-title">Map Status</h2>
      <form onSubmit={handleLookup} className="staff-search-row">
        <input
          type="number"
          className="staff-search-input"
          placeholder="Beatmap ID"
          value={mapId}
          onChange={(e) => setMapId(e.target.value)}
        />
        <button type="submit" className="staff-action-btn staff-action-btn--pink" disabled={looking}>
          {looking ? "Looking..." : "Lookup"}
        </button>
      </form>
      {mapError && <div className="staff-error">{mapError}</div>}

      {mapInfo && (
        <div className="sp-map-card">
          <img
            src={`https://assets.ppy.sh/beatmaps/${mapInfo.set_id}/covers/list.jpg`}
            alt=""
            className="sp-map-thumb"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="sp-map-info">
            <div className="sp-map-title">{mapInfo.artist} — {mapInfo.title}</div>
            <div className="sp-map-diff">[{mapInfo.version}] &middot; ID: {mapInfo.id}</div>
            <div className="sp-map-status-row">
              <span
                className="sp-map-status-badge"
                style={{ color: currentStatus?.color ?? "#fff", borderColor: currentStatus?.color ?? "#fff" }}
              >
                {currentStatus?.label ?? `Status ${mapInfo.status}`}
              </span>
            </div>
          </div>
          <div className="sp-map-btns">
            {MAP_STATUSES.map((s) => (
              <button
                key={s.value}
                className="staff-action-btn"
                style={{
                  borderColor: mapInfo.status === s.value ? s.color : "rgba(255,255,255,0.12)",
                  color: mapInfo.status === s.value ? s.color : "rgba(255,255,255,0.5)",
                  background: mapInfo.status === s.value ? `${s.color}18` : "transparent",
                }}
                onClick={() => handleSetStatus(s.value)}
                disabled={pending || mapInfo.status === s.value}
              >
                {s.label}
              </button>
            ))}
          </div>
          {statusMsg && (
            <div className="staff-card-msg" style={{ color: statusMsg.ok ? "#68d391" : "#fc8181", marginTop: "0.75rem" }}>
              {statusMsg.text}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function RecentScoresSidebar() {
  const [scores, setScores] = useState<RecentScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startRefresh] = useTransition();

  function load() {
    setLoading(true);
    getRecentScores(30).then((res) => {
      setScores(res.scores ?? []);
      setLoading(false);
    });
  }

  useEffect(() => { load(); }, []);

  function handleRefresh() {
    startRefresh(() => { load(); });
  }

  const GRADE_COLORS: Record<string, string> = {
    XH: "#c0c0c0", X: "#f6c90e", SH: "#c0c0c0", S: "#f6c90e",
    A: "#68d391", B: "#63b3ed", C: "#f6ad55", D: "#fc8181", F: "#a0aec0",
  };

  return (
    <aside className="sp-scores-sidebar">
      <div className="sp-scores-header">
        <span className="staff-section-title" style={{ marginBottom: 0 }}>Recent Scores</span>
        <button className="sp-refresh-btn" onClick={handleRefresh} title="Refresh">↻</button>
      </div>
      {loading ? (
        <div className="sp-scores-empty">Loading...</div>
      ) : scores.length === 0 ? (
        <div className="sp-scores-empty">No scores yet.</div>
      ) : (
        <div className="sp-scores-list">
          {scores.map((s) => {
            const mods = parseMods(s.mods).filter((m) => m !== "NM");
            const gradeColor = GRADE_COLORS[s.grade] ?? "#fff";
            return (
              <div key={s.id} className={`sp-score-row${s.restricted ? " sp-score-row--restricted" : ""}`}>
                <div className="sp-score-grade" style={{ color: gradeColor }}>{s.grade}</div>
                <div className="sp-score-body">
                  <div className="sp-score-map">
                    {s.title} <span className="sp-score-diff">[{s.version}]</span>
                  </div>
                  <div className="sp-score-meta">
                    <Link href={`/u/${s.userid}`} className="sp-score-player">
                      {s.player_name}
                    </Link>
                    {s.restricted && <span className="sp-score-restr">restricted</span>}
                    <span className="sp-score-mode">{intToModeLabel(s.mode)}</span>
                    {mods.length > 0 && <span className="sp-score-mods">{mods.join("")}</span>}
                  </div>
                </div>
                <div className="sp-score-right">
                  {s.pp > 0 && s.map_status >= 2 && (
                    <div className="sp-score-pp">{Math.round(s.pp)}pp</div>
                  )}
                  <div className="sp-score-acc">{s.acc.toFixed(2)}%</div>
                  <div className="sp-score-time">{s.play_time ? timeAgo(Math.floor(new Date(s.play_time).getTime() / 1000)) : "—"}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </aside>
  );
}

export default function StaffPanel({ sessionPriv }: { sessionPriv: number }) {
  const isDev = !!(sessionPriv & (1 << 14));
  const [tab, setTab] = useState<"users" | "maps">("users");
  const [query, setQuery] = useState("");
  const [searchResult, setSearchResult] = useState<StaffUser | null>(null);
  const [searchError, setSearchError] = useState("");
  const [searching, startSearch] = useTransition();
  const [recentUsers, setRecentUsers] = useState<StaffUser[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    getRecentUsers().then((res) => {
      setRecentUsers(res.users ?? []);
      setLoadingRecent(false);
    });
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchError("");
    setSearchResult(null);
    startSearch(async () => {
      const res = await lookupUser(query.trim());
      if (res.error) { setSearchError(res.error); return; }
      setSearchResult(res.user!);
    });
  }

  function updateSearchResult(u: StaffUser) {
    setSearchResult(u);
    setRecentUsers((prev) => prev.map((r) => (r.id === u.id ? u : r)));
  }

  function updateRecentUser(u: StaffUser) {
    setRecentUsers((prev) => prev.map((r) => (r.id === u.id ? u : r)));
  }

  return (
    <div className="staff-page">
      <div className="staff-container">
        <h1 className="staff-title">Staff Panel</h1>

        <div className="sp-layout">
          <div className="sp-main">

        <div className="sp-tab-bar">
          <button
            className={`sp-tab-btn${tab === "users" ? " sp-tab-btn--active" : ""}`}
            onClick={() => setTab("users")}
          >
            Users
          </button>
          <button
            className={`sp-tab-btn${tab === "maps" ? " sp-tab-btn--active" : ""}`}
            onClick={() => setTab("maps")}
          >
            Maps
          </button>
        </div>

        {tab === "users" && (
          <>
            <section className="staff-section">
              <h2 className="staff-section-title">User Lookup</h2>
              <form onSubmit={handleSearch} className="staff-search-row">
                <input
                  type="text"
                  className="staff-search-input"
                  placeholder="Username or user ID"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button type="submit" className="staff-action-btn staff-action-btn--pink" disabled={searching}>
                  {searching ? "Searching..." : "Search"}
                </button>
              </form>
              {searchError && <div className="staff-error">{searchError}</div>}
              {searchResult && (
                <div style={{ marginTop: "0.75rem" }}>
                  <UserCard user={searchResult} isDev={isDev} onUpdate={updateSearchResult} />
                </div>
              )}
            </section>

            <section className="staff-section">
              <h2 className="staff-section-title">Recent Registrations</h2>
              {loadingRecent ? (
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>Loading...</div>
              ) : recentUsers.length === 0 ? (
                <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>No users found.</div>
              ) : (
                <div className="staff-user-list">
                  {recentUsers.map((u) => (
                    <UserCard key={u.id} user={u} isDev={isDev} onUpdate={updateRecentUser} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {tab === "maps" && <MapPanel />}
          </div>
          <RecentScoresSidebar />
        </div>
      </div>
    </div>
  );
}
