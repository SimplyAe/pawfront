"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getPlayerInfo,
  getPlayerScores,
  getPlayerMostPlayed,
  getPlayerStatus,
  PlayerInfo,
  PlayerStats,
  Score,
  MostPlayedMap,
  PlayerStatus,
  beatmapCoverUrl,
} from "@/lib/api";
import {
  addCommas,
  secondsToDhm,
  timeAgo,
  formatDate,
  parseMods,
  modeToInt,
  getPrivilegeLabel,
  getRoleBadges,
  gradeToFile,
} from "@/lib/utils";
import ModeSelector from "@/components/ModeSelector";

export default function ProfilePage() {
  const params = useParams();
  const userId = Number(params.id);

  const [mode, setMode] = useState("std");
  const [mods, setMods] = useState("vn");
  const [info, setInfo] = useState<PlayerInfo | null>(null);
  const [allStats, setAllStats] = useState<Record<string, PlayerStats>>({});
  const [bestScores, setBestScores] = useState<Score[]>([]);
  const [recentScores, setRecentScores] = useState<Score[]>([]);
  const [mostPlayed, setMostPlayed] = useState<MostPlayedMap[]>([]);
  const [status, setStatus] = useState<PlayerStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [scoresTab, setScoresTab] = useState<"best" | "recent" | "maps">("best");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [viewerPriv, setViewerPriv] = useState<number>(0);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => {
      setCurrentUserId(d?.id ?? null);
      setViewerPriv(d?.priv ?? 0);
    });
  }, []);

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      const [playerData, playerStatus] = await Promise.all([
        getPlayerInfo(userId),
        getPlayerStatus(userId),
      ]);
      if (playerData) {
        setInfo(playerData.info);
        setAllStats(playerData.stats);
      }
      setStatus(playerStatus);
      setLoading(false);
    }
    if (userId) loadProfile();
  }, [userId]);

  const loadScores = useCallback(async () => {
    const modeInt = modeToInt(mode, mods);
    const [best, recent, maps] = await Promise.all([
      getPlayerScores(userId, "best", modeInt, 20),
      getPlayerScores(userId, "recent", modeInt, 20),
      getPlayerMostPlayed(userId, modeInt, 10),
    ]);
    setBestScores(best);
    setRecentScores(recent);
    setMostPlayed(maps);
  }, [userId, mode, mods]);

  useEffect(() => {
    if (userId) loadScores();
  }, [loadScores]);

  function handleModeChange(newMode: string, newMods: string) {
    setMode(newMode);
    setMods(newMods);
  }

  const modeInt = modeToInt(mode, mods);
  const stats = allStats[String(modeInt)];

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "5rem", color: "rgba(255,255,255,0.3)" }}>
        Loading...
      </div>
    );
  }

  const isStaff = !!(viewerPriv & ((1 << 12) | (1 << 13) | (1 << 14)));
  const isRestricted = info ? !(info.priv & 1) : false;

  if (!info || (isRestricted && !isStaff && currentUserId !== userId)) {
    return (
      <div style={{ textAlign: "center", padding: "5rem", color: "rgba(255,255,255,0.3)" }}>
        Player not found.
      </div>
    );
  }

  const privilege = getPrivilegeLabel(info.priv);
  const isOnline = status?.online === true;
  const currentScores = scoresTab === "best" ? bestScores : recentScores;

  return (
    <div>
      <div
        style={{
          background: "linear-gradient(180deg, #252534 0%, #1a1a26 100%)",
          borderBottom: "1px solid #3a3a4e",
          padding: "2rem 1.25rem 0",
        }}
      >
        <div style={{ maxWidth: "1160px", margin: "0 auto", position: "relative" }}>
          {currentUserId === userId && (
            <Link
              href="/settings"
              style={{
                position: "absolute",
                top: 0,
                right: 0,
                fontSize: "0.8rem",
                color: "rgba(255,255,255,0.45)",
                padding: "0.3rem 0.75rem",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "5px",
                background: "rgba(0,0,0,0.2)",
                transition: "color 0.15s, border-color 0.15s",
              }}
            >
              Edit Profile
            </Link>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "1.25rem",
              flexWrap: "wrap",
              marginBottom: "1rem",
            }}
          >
            <div style={{ position: "relative", flexShrink: 0 }}>
              <img
                src={`http://a.pawinput.xyz/${info.id}`}
                alt={info.name}
                style={{
                  width: "96px",
                  height: "96px",
                  borderRadius: "8px",
                  objectFit: "cover",
                  border: "2px solid #3a3a4e",
                  background: "#1e1e2a",
                  display: "block",
                }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                  flexWrap: "wrap",
                  marginBottom: "0.3rem",
                }}
              >
                <img
                  src={`https://flagcdn.com/24x18/${info.country.toLowerCase()}.png`}
                  alt={info.country}
                  style={{ height: "16px", borderRadius: "1px" }}
                />
                <h1
                  style={{
                    fontSize: "1.6rem",
                    fontWeight: 700,
                    color: "#fff",
                    lineHeight: 1,
                  }}
                >
                  {info.name}
                </h1>
                {info.clan_id > 0 && (
                  <span style={{ color: "#d55b9e", fontSize: "0.9rem" }}>
                    [{info.custom_badge_name ?? ""}]
                  </span>
                )}
              </div>
              {getRoleBadges(info.priv).length > 0 && (
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                  {getRoleBadges(info.priv).map((badge) => (
                    <span key={badge.short} className="role-badge" style={{ "--badge-color": badge.color, "--badge-glow": badge.glow } as React.CSSProperties}>
                      {badge.short}
                      <span className="role-badge__tooltip">{badge.full}</span>
                    </span>
                  ))}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  fontSize: "0.82rem",
                  color: isOnline ? "#68d57f" : "rgba(255,255,255,0.35)",
                }}
              >
                <span className={isOnline ? "online-dot" : "offline-dot"} />
                {isOnline ? "Online" : "Offline"}
                {!isOnline && (
                  <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: "0.25rem" }}>
                    &mdash; last seen {timeAgo(info.latest_activity)}
                  </span>
                )}
              </div>
            </div>
            {stats && stats.rank > 0 && (
              <div
                style={{
                  display: "flex",
                  gap: "1.5rem",
                  flexShrink: 0,
                  paddingBottom: "0.5rem",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff" }}>
                    #{addCommas(stats.rank)}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                    Global
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff" }}>
                    #{addCommas(stats.country_rank)}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                    {info.country.toUpperCase()}
                  </div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#d55b9e" }}>
                    {addCommas(Math.round(stats.pp))}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>pp</div>
                </div>
              </div>
            )}
          </div>
          <ModeSelector mode={mode} mods={mods} onChange={handleModeChange} />
        </div>
      </div>

      <div className="container-main" style={{ padding: "1.5rem 1.25rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px 1fr",
            gap: "1.25rem",
            alignItems: "start",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            {stats && stats.rank > 0 && (
              <div
                style={{
                  background: "#1e1e2a",
                  border: "1px solid #3a3a4e",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div className="block-header">
                  <span className="block-icon">
                    <ChartIcon />
                  </span>
                  Rank
                </div>
                <table className="stats-table">
                  <tbody>
                    <tr>
                      <td>Global rank</td>
                      <td>#{addCommas(stats.rank)}</td>
                    </tr>
                    <tr>
                      <td>Country rank</td>
                      <td>#{addCommas(stats.country_rank)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {stats && (
              <div
                style={{
                  background: "#1e1e2a",
                  border: "1px solid #3a3a4e",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div className="block-header">
                  <span className="block-icon">
                    <PieIcon />
                  </span>
                  Statistics
                </div>
                <table className="stats-table">
                  <tbody>
                    <tr>
                      <td>
                        <b>PP</b>
                      </td>
                      <td>{addCommas(Math.round(stats.pp))}</td>
                    </tr>
                    <tr>
                      <td>Ranked score</td>
                      <td>{addCommas(stats.rscore)}</td>
                    </tr>
                    <tr>
                      <td>Total score</td>
                      <td>{addCommas(stats.tscore)}</td>
                    </tr>
                    <tr>
                      <td>Max combo</td>
                      <td>{addCommas(stats.max_combo)}x</td>
                    </tr>
                    <tr>
                      <td>Playcount</td>
                      <td>{addCommas(stats.plays)}</td>
                    </tr>
                    <tr>
                      <td>Playtime</td>
                      <td>{secondsToDhm(stats.playtime)}</td>
                    </tr>
                    <tr>
                      <td>Accuracy</td>
                      <td>{stats.acc.toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td>Total hits</td>
                      <td>{addCommas(stats.total_hits)}</td>
                    </tr>
                    <tr>
                      <td>Registered</td>
                      <td>{formatDate(info.creation_time)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {stats && (
              <div
                style={{
                  background: "#1e1e2a",
                  border: "1px solid #3a3a4e",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div className="block-header">
                  <span className="block-icon">
                    <StarIcon />
                  </span>
                  Grades
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-around",
                    padding: "0.75rem 0.5rem",
                    gap: "0.25rem",
                  }}
                >
                  {[
                    { grade: "XH", count: stats.xh_count },
                    { grade: "X", count: stats.x_count },
                    { grade: "SH", count: stats.sh_count },
                    { grade: "S", count: stats.s_count },
                    { grade: "A", count: stats.a_count },
                  ].map(({ grade, count }) => (
                    <div
                      key={grade}
                      style={{ textAlign: "center", flex: 1 }}
                    >
                      <img
                        src={gradeToFile(grade, true)}
                        alt={grade}
                        style={{ height: "28px", objectFit: "contain", display: "block", margin: "0 auto" }}
                      />
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "rgba(255,255,255,0.6)",
                          marginTop: "0.3rem",
                          fontWeight: 500,
                        }}
                      >
                        {addCommas(count)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div
              style={{
                background: "#1e1e2a",
                border: "1px solid #3a3a4e",
                borderRadius: "8px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid #3a3a4e",
                }}
              >
                {(["best", "recent", "maps"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setScoresTab(tab)}
                    style={{
                      flex: 1,
                      padding: "0.7rem",
                      background: "transparent",
                      border: "none",
                      borderBottom: `2px solid ${scoresTab === tab ? "#d55b9e" : "transparent"}`,
                      color: scoresTab === tab ? "#fff" : "rgba(255,255,255,0.4)",
                      cursor: "pointer",
                      fontSize: "0.82rem",
                      fontWeight: scoresTab === tab ? 600 : 400,
                      textTransform: "capitalize",
                      transition: "all 0.15s",
                    }}
                  >
                    {tab === "maps" ? "Most Played" : `${tab.charAt(0).toUpperCase() + tab.slice(1)} Scores`}
                  </button>
                ))}
              </div>

              {scoresTab !== "maps" ? (
                <div>
                  {currentScores.length === 0 ? (
                    <div
                      style={{
                        padding: "2.5rem",
                        textAlign: "center",
                        color: "rgba(255,255,255,0.25)",
                        fontSize: "0.9rem",
                      }}
                    >
                      No scores available.
                    </div>
                  ) : (
                    currentScores.map((score) => (
                      <ScoreRow key={score.id} score={score} />
                    ))
                  )}
                </div>
              ) : (
                <div>
                  {mostPlayed.length === 0 ? (
                    <div
                      style={{
                        padding: "2.5rem",
                        textAlign: "center",
                        color: "rgba(255,255,255,0.25)",
                        fontSize: "0.9rem",
                      }}
                    >
                      No maps played.
                    </div>
                  ) : (
                    mostPlayed.map((map) => (
                      <MostPlayedRow key={map.id} map={map} />
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ score }: { score: Score }) {
  const bm = score.beatmap;
  const modList = parseMods(score.mods);

  return (
    <div className="score-block">
      <div
        style={{
          width: "64px",
          flexShrink: 0,
          background: `url(${beatmapCoverUrl(bm.set_id)}) center/cover`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
          }}
        />
      </div>
      <div
        style={{
          flex: 1,
          padding: "0.65rem 0.9rem",
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.25rem",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "0.5rem",
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <a
              href={`https://osu.ppy.sh/beatmapsets/${bm.set_id}#osu/${bm.id}`}
              target="_blank"
              rel="noreferrer"
              style={{
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.875rem",
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {bm.artist} - {bm.title}
            </a>
            <div
              style={{
                fontSize: "0.78rem",
                color: "rgba(255,255,255,0.45)",
                marginTop: "1px",
              }}
            >
              {bm.version} &mdash; mapped by {bm.creator}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
            <img
              src={gradeToFile(score.grade, true)}
              alt={score.grade}
              style={{ height: "28px", objectFit: "contain" }}
            />
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            flexWrap: "wrap",
            fontSize: "0.82rem",
          }}
        >
          <span style={{ color: "#d55b9e", fontWeight: 700 }}>
            {score.pp.toFixed(0)}pp
          </span>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>
            {score.acc.toFixed(2)}%
          </span>
          <span style={{ color: "rgba(255,255,255,0.5)" }}>
            {addCommas(score.max_combo)}x
          </span>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.75rem" }}>
            {score.n300}/{score.n100}/{score.n50}/{score.nmiss}
          </span>
          <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
            {modList.map((m) => (
              <span key={m} className={`mod-badge ${m.toLowerCase()}`}>
                {m}
              </span>
            ))}
          </div>
          <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: "auto", fontSize: "0.75rem" }}>
            {timeAgo(Math.floor(new Date(score.play_time).getTime() / 1000))}
          </span>
        </div>
      </div>
    </div>
  );
}

function MostPlayedRow({ map }: { map: MostPlayedMap }) {
  return (
    <div className="beatmap-card">
      <div
        style={{
          width: "64px",
          height: "56px",
          flexShrink: 0,
          background: `url(${beatmapCoverUrl(map.set_id)}) center/cover`,
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />
      </div>
      <div style={{ flex: 1, padding: "0.6rem 0.9rem", minWidth: 0 }}>
        <a
          href={`https://osu.ppy.sh/beatmapsets/${map.set_id}#osu/${map.id}`}
          target="_blank"
          rel="noreferrer"
          style={{
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.875rem",
            display: "block",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {map.artist} - {map.title}
        </a>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: "2px",
          }}
        >
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
            {map.version} &mdash; by {map.creator}
          </div>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.4)" }}>
            {addCommas(map.plays)} plays
          </div>
        </div>
      </div>
    </div>
  );
}

function ChartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

function PieIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}
