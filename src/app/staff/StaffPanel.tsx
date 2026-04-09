"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { lookupUser, restrictUser, setPriv, getRecentUsers, type StaffUser } from "./actions";
import { getRoleBadges } from "@/lib/utils";

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
  const [msg, setMsg] = useState("");

  function handleToggleRestrict() {
    startTransition(async () => {
      const result = await restrictUser(user.id, !user.restricted);
      if (result.error) { setMsg(result.error); return; }
      onUpdate({ ...user, restricted: result.restricted!, priv: result.restricted! ? user.priv & ~1 : user.priv | 1 });
      setMsg(result.restricted ? "User restricted." : "User unrestricted.");
    });
  }

  function handleSetPriv() {
    startTransition(async () => {
      const result = await setPriv(user.id, newPriv);
      if (result.error) { setMsg(result.error); return; }
      onUpdate({ ...user, priv: result.new_priv!, restricted: !(result.new_priv! & 1) });
      setPrivEdit(false);
      setMsg("Privileges updated.");
    });
  }

  return (
    <div className={`staff-card${user.restricted ? " staff-card--restricted" : ""}`}>
      <div className="staff-card-header">
        <img
          src={`http://a.pawinput.xyz/${user.id}`}
          alt=""
          className="staff-card-avatar"
        />
        <div className="staff-card-info">
          <Link href={`/u/${user.id}`} className="staff-card-name">{user.name}</Link>
          <span className="staff-card-id">#{user.id} &middot; {user.country.toUpperCase()}</span>
          <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.25rem" }}>
            <PrivBadges priv={user.priv} />
            {user.restricted && (
              <span style={{ fontSize: "0.7rem", color: "#fc8181", border: "1px solid rgba(252,129,129,0.4)", padding: "1px 6px", borderRadius: "3px" }}>RESTRICTED</span>
            )}
          </div>
        </div>
        <div className="staff-card-actions">
          <button
            className={`staff-action-btn${user.restricted ? " staff-action-btn--green" : " staff-action-btn--red"}`}
            onClick={handleToggleRestrict}
            disabled={pending}
          >
            {user.restricted ? "Unrestrict" : "Restrict"}
          </button>
          {isDev && (
            <button
              className="staff-action-btn staff-action-btn--gray"
              onClick={() => setPrivEdit((v) => !v)}
              disabled={pending}
            >
              Set Priv
            </button>
          )}
        </div>
      </div>

      {msg && <div className="staff-card-msg">{msg}</div>}

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
            <button className="staff-action-btn staff-action-btn--pink" onClick={handleSetPriv} disabled={pending}>
              Save
            </button>
            <button className="staff-action-btn staff-action-btn--gray" onClick={() => setPrivEdit(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StaffPanel({ sessionPriv }: { sessionPriv: number }) {
  const isDev = !!(sessionPriv & (1 << 14));
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

        {/* Search */}
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

        {/* Recent users */}
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
      </div>
    </div>
  );
}
