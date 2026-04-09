"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchPlayers } from "@/lib/api";
import { logoutAction } from "@/app/logout/actions";
import type { SessionUser } from "@/lib/session";

export default function Header({ user }: { user: SessionUser | null }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ id: number; name: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function openSearch() {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    setShowResults(false);
  }

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      const matches = await searchPlayers(query);
      setResults(matches.slice(0, 8));
      setShowResults(true);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowResults(false);
        if (searchOpen) closeSearch();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && searchOpen) closeSearch();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [searchOpen]);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "#2f2f3b",
        height: "55px",
        display: "flex",
        alignItems: "center",
        padding: "0 1.5rem",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}
    >
      <div
        style={{
          maxWidth: "1160px",
          margin: "0 auto",
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
        }}
      >
        <Link
          href="/"
          style={{
            fontWeight: 700,
            fontSize: "1.15rem",
            color: "#d55b9e",
            letterSpacing: "-0.01em",
            flexShrink: 0,
          }}
        >
          pawinput
        </Link>

        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
          <NavLink href="/">Home</NavLink>
          <NavLink href="/leaderboard">Leaderboard</NavLink>
          <NavLink href="/beatmaps">Beatmaps</NavLink>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search + Auth — right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", position: "relative" }}>

          {/* Expanding search */}
          <div ref={searchRef} className={`nav-search${searchOpen ? " nav-search--open" : ""}`}>
            {/* Magnifying glass / close button — stays on left */}
            <button
              className="nav-search-icon-btn"
              onClick={searchOpen ? closeSearch : openSearch}
              aria-label={searchOpen ? "Close search" : "Search players"}
            >
              {searchOpen ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              )}
            </button>

            {/* Expanding wrapper — absolutely anchored to icon's right, grows rightward */}
            <div className="nav-search-expanding">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search players..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results.length > 0) {
                    router.push(`/u/${results[0].id}`);
                    closeSearch();
                  }
                }}
                className="nav-search-input"
                tabIndex={searchOpen ? 0 : -1}
              />
            </div>

            {/* Dropdown results */}
            {showResults && results.length > 0 && (
              <div className="nav-search-dropdown">
                {results.map((r) => (
                  <Link
                    key={r.id}
                    href={`/u/${r.id}`}
                    onClick={closeSearch}
                    className="nav-search-result"
                  >
                    <img
                      src={`http://a.pawinput.xyz/${r.id}`}
                      alt=""
                      style={{ width: "28px", height: "28px", borderRadius: "3px", objectFit: "cover", background: "#1e1e2a" }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/assets/ranks/default.png"; }}
                    />
                    <span>{r.name}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Auth nav — fades out when search is open */}
          <div className={`nav-auth${searchOpen ? " nav-auth--hidden" : ""}`}>
            {user ? (
              <>
                {!!(user.priv & ((1 << 12) | (1 << 13) | (1 << 14))) && (
                  <Link href="/staff" className="staff-nav-btn">Staff</Link>
                )}
                <Link
                  href={`/u/${user.id}`}
                  style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "rgba(255,255,255,0.85)", fontSize: "0.875rem" }}
                >
                  <img
                    src={`http://a.pawinput.xyz/${user.id}`}
                    alt=""
                    style={{ width: "26px", height: "26px", borderRadius: "4px", objectFit: "cover", background: "#1e1e2a" }}
                  />
                  <span style={{ fontWeight: 500 }}>{user.name}</span>
                </Link>
                <form action={logoutAction}>
                  <button type="submit" style={{ background: "none", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "4px", color: "rgba(255,255,255,0.45)", fontSize: "0.78rem", padding: "0.25rem 0.6rem", cursor: "pointer" }}>
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.875rem", padding: "0.3rem 0.65rem", borderRadius: "4px", border: "1px solid rgba(255,255,255,0.12)" }}>
                  Sign in
                </Link>
                <Link href="/register" style={{ background: "#d55b9e", color: "#fff", fontSize: "0.875rem", padding: "0.3rem 0.65rem", borderRadius: "4px", fontWeight: 600 }}>
                  Register
                </Link>
              </>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        color: "rgba(255,255,255,0.75)",
        fontSize: "0.9rem",
        padding: "0.35rem 0.6rem",
        borderRadius: "4px",
        transition: "color 0.15s, background 0.15s",
        fontWeight: 400,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.color = "#fff";
        (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.75)";
        (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      {children}
    </Link>
  );
}
