"use client";

import { useState, useEffect, useCallback } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import html from "@bbob/html";
import presetHTML5 from "@bbob/preset-html5";
import { useParams } from "next/navigation";
import Link from "next/link";
import Flag from "@/components/Flag";
import {
  getPlayerInfo,
  getPlayerScores,
  getPlayerMostPlayed,
  getPlayerStatus,
  getClan,
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
import BadgeChip from "@/components/BadgeChip";
import { useT } from "@/i18n";
import type { BadgeDefinition } from "@/types/badge";

interface Comment {
  id: number;
  author_id: number;
  author_name: string;
  content: string;
  created_at: string | null;
}

function renderBBCode(raw: string): string {
  try {
    return html(raw, presetHTML5());
  } catch {
    return raw.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}

export default function ProfilePage() {
  const t = useT();
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
  const [clanTag, setClanTag] = useState<string | null>(null);
  const [hasBanner, setHasBanner] = useState(false);
  const [bioEdit, setBioEdit] = useState(false);
  const [bioValue, setBioValue] = useState("");
  const [bioSaving, setBioSaving] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [commentPosting, setCommentPosting] = useState(false);
  const [activity, setActivity] = useState<{ yr: number; mo: number; plays: number }[]>([]);
  const [userBadges, setUserBadges] = useState<BadgeDefinition[]>([]);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((d) => {
      setCurrentUserId(d?.id ?? null);
      setViewerPriv(d?.priv ?? 0);
    });
  }, []);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/badges/assign?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => setUserBadges(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/comments?user_id=${userId}`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []));
  }, [userId]);

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
        if (playerData.info.clan_id > 0) {
          getClan(playerData.info.clan_id).then((c) => setClanTag(c?.clan.tag ?? null));
        }
      }
      setStatus(playerStatus);
      setLoading(false);
    }
    if (userId) loadProfile();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/banner/${userId}`, { method: "HEAD" })
      .then((r) => setHasBanner(r.ok))
      .catch(() => setHasBanner(false));
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
    fetch(`https://api.pawinput.xyz/v1/get_player_activity?id=${userId}&mode=${modeInt}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setActivity(d.activity ?? []))
      .catch(() => {});
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
        {t("common.loading")}
      </div>
    );
  }

  const isStaff = !!(viewerPriv & ((1 << 12) | (1 << 13) | (1 << 14)));
  const isOwn = currentUserId === userId;
  const isRestricted = info ? !(info.priv & 1) : false;

  async function saveBio() {
    setBioSaving(true);
    await fetch("/api/userpage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: bioValue }),
    });
    if (info) info.userpage_content = bioValue || null;
    setBioEdit(false);
    setBioSaving(false);
  }

  async function postComment() {
    if (!commentText.trim() || !currentUserId) return;
    setCommentPosting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target_id: userId, content: commentText.trim() }),
    });
    if (res.ok) {
      setCommentText("");
      const data = await fetch(`/api/comments?user_id=${userId}`).then((r) => r.json());
      setComments(data.comments ?? []);
    }
    setCommentPosting(false);
  }

  async function deleteComment(id: number) {
    await fetch(`/api/comments?id=${id}`, { method: "DELETE" });
    setComments((prev) => prev.filter((c) => c.id !== id));
  }

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
          position: "relative",
          borderBottom: "1px solid #3a3a4e",
          minHeight: "220px",
          overflow: "hidden",
          background: hasBanner
            ? "transparent"
            : "linear-gradient(180deg, #252534 0%, #1a1a26 100%)",
        }}
      >
        {hasBanner && (
          <>
            <div
              style={{
                position: "absolute",
                inset: 0,
                backgroundImage: `url(/api/banner/${userId})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                zIndex: 0,
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(180deg, rgba(15,15,25,0.55) 0%, rgba(15,15,25,0.82) 100%)",
                zIndex: 1,
              }}
            />
          </>
        )}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 2 }}>
          <div className="container-main">
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
          <div style={{ marginBottom: "1rem" }}>
            {/* Avatar + username — left column only */}
            <div style={{ display: "flex", gap: "0.85rem", alignItems: "flex-end", paddingBottom: "0.25rem", width: "300px" }}>
              <img
                src={`http://a.pawinput.xyz/${info.id}`}
                alt={info.name}
                style={{ width: "80px", height: "80px", borderRadius: "8px", objectFit: "cover", border: "2px solid rgba(255,255,255,0.15)", background: "#1e1e2a", display: "block", flexShrink: 0 }}
              />
              <div style={{ minWidth: 0, paddingBottom: "0.1rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                  <Flag country={info.country} />
                  <h1 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{info.name}</h1>
                  {info.clan_id > 0 && clanTag && (
                    <Link href={`/clans/${info.clan_id}`} style={{ color: "#d55b9e", fontSize: "0.85rem", textDecoration: "none" }}>[{clanTag}]</Link>
                  )}
                </div>
                {getRoleBadges(info.priv).length > 0 && (
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                    {getRoleBadges(info.priv).map((badge) => (
                      <span key={badge.short} className="role-badge" style={{ "--badge-color": badge.color, "--badge-glow": badge.glow } as React.CSSProperties}>
                        {badge.short}<span className="role-badge__tooltip">{badge.full}</span>
                      </span>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: isOnline ? "#68d57f" : "rgba(255,255,255,0.35)" }}>
                  <span className={isOnline ? "online-dot" : "offline-dot"} />
                  {isOnline ? "Online" : "Offline"}
                  {!isOnline && <span style={{ color: "rgba(255,255,255,0.25)", marginLeft: "0.2rem" }}>&mdash; last seen {timeAgo(info.latest_activity)}</span>}
                </div>
              </div>
            </div>
          </div>
          </div>{/* /container-main */}
        </div>{/* /absolute bottom wrapper */}

        {/* PP/Rank stats — absolute, left of mode picker */}
        {stats && stats.rank > 0 && (
          <div style={{ position: "absolute", right: "440px", bottom: "1rem", zIndex: 3, display: "flex", gap: "1.5rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff" }}>#{addCommas(stats.rank)}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>Global</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#fff" }}>#{addCommas(stats.country_rank)}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>{info.country.toUpperCase()}</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.3rem", fontWeight: 700, color: "#d55b9e" }}>{addCommas(Math.round(stats.pp))}</div>
              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>pp</div>
            </div>
          </div>
        )}

        {/* Mode selector — absolute far right of banner */}
        <div style={{ position: "absolute", right: "10px", bottom: "0.75rem", zIndex: 3 }}>
          <ModeSelector mode={mode} mods={mods} onChange={handleModeChange} banner />
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
                  {t("profile.rank.title")}
                </div>
                <table className="stats-table">
                  <tbody>
                    <tr>
                      <td>{t("profile.rank.global")}</td>
                      <td>#{addCommas(stats.rank)}</td>
                    </tr>
                    <tr>
                      <td>{t("profile.rank.country")}</td>
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
                  {t("profile.stats.title")}
                </div>
                <table className="stats-table">
                  <tbody>
                    <tr>
                      <td><b>{t("profile.stats.pp")}</b></td>
                      <td>{addCommas(Math.round(stats.pp))}</td>
                    </tr>
                    <tr>
                      <td>{t("profile.stats.rankedScore")}</td>
                      <td>{addCommas(stats.rscore)}</td>
                    </tr>
                    <tr>
                      <td>{t("profile.stats.totalScore")}</td>
                      <td>{addCommas(stats.tscore)}</td>
                    </tr>
                    <tr>
                      <td>{t("profile.stats.maxCombo")}</td>
                      <td>{addCommas(stats.max_combo)}x</td>
                    </tr>
                    <tr>
                      <td>{t("profile.stats.playcount")}</td>
                      <td>{addCommas(stats.plays)}</td>
                    </tr>
                    <tr>
                      <td>{t("profile.stats.playtime")}</td>
                      <td>{secondsToDhm(stats.playtime)}</td>
                    </tr>
                    <tr>
                      <td>{t("profile.stats.accuracy")}</td>
                      <td>{stats.acc.toFixed(2)}%</td>
                    </tr>
                    <tr>
                      <td>{t("profile.stats.totalHits")}</td>
                      <td>{addCommas(stats.total_hits)}</td>
                    </tr>
                    <tr>
                      <td>{t("profile.stats.replaysWatched")}</td>
                      <td>{addCommas(stats.replay_views)}</td>
                    </tr>
                    <tr>
                      <td>{t("profile.stats.registered")}</td>
                      <td>{formatDate(info.creation_time)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {userBadges.length > 0 && (
              <div
                style={{
                  background: "#1e1e2a",
                  border: "1px solid #3a3a4e",
                  borderRadius: "8px",
                  overflow: "hidden",
                }}
              >
                <div className="block-header">
                  <span className="block-icon"><BadgesIcon /></span>
                  Badges
                </div>
                <div style={{ padding: "0.75rem 1rem", display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {userBadges.map((b) => (
                    <BadgeChip key={b.id} badge={b} />
                  ))}
                </div>
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
                  {t("profile.grades")}
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
            {/* ── Userpage Bio ── */}
            {(info.userpage_content || isOwn) && (
              <div className="up-bio-block">
                <div className="up-bio-header">
                  <span className="up-bio-label">About</span>
                  {isOwn && !bioEdit && (
                    <button
                      className="up-bio-edit-btn"
                      onClick={() => { setBioValue(info.userpage_content ?? ""); setBioEdit(true); }}
                    >
                      {info.userpage_content ? t("profile.userpage.edit") : "+ Add bio"}
                    </button>
                  )}
                </div>
                {bioEdit ? (
                  <div className="up-bio-editor">
                    <div className="up-bio-tabs">
                      <span className="up-bio-tab-label">{t("profile.userpage.write")}</span>
                    </div>
                    <textarea
                      className="up-bio-textarea"
                      value={bioValue}
                      onChange={(e) => setBioValue(e.target.value)}
                      placeholder="Write your bio… BBCode supported: [b], [i], [url], [img], [color], [size], [quote], [spoiler]…"
                      maxLength={2000}
                      rows={6}
                    />
                    {bioValue && (
                      <>
                        <div className="up-bio-preview-label">{t("profile.userpage.preview")}</div>
                        <div
                          className="up-bio-preview"
                          dangerouslySetInnerHTML={{ __html: renderBBCode(bioValue) }}
                        />
                      </>
                    )}
                    <div className="up-bio-editor-actions">
                      <span className="up-bio-charcount">{bioValue.length}/2000</span>
                      <button className="up-bio-cancel-btn" onClick={() => setBioEdit(false)}>{t("profile.userpage.cancel")}</button>
                      <button className="up-bio-save-btn" onClick={saveBio} disabled={bioSaving}>
                        {bioSaving ? t("profile.userpage.saving") : t("profile.userpage.save")}
                      </button>
                    </div>
                  </div>
                ) : info.userpage_content ? (
                  <div
                    className="up-bio-content"
                    dangerouslySetInnerHTML={{ __html: renderBBCode(info.userpage_content) }}
                  />
                ) : isOwn ? (
                  <div className="up-bio-empty">No bio yet. Click &ldquo;+ Add bio&rdquo; to write one.</div>
                ) : null}
              </div>
            )}

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
                    {tab === "best" ? t("profile.tabs.best") : tab === "recent" ? t("profile.tabs.recent") : t("profile.tabs.mostPlayed")}
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
                      {t("profile.scores.noScores")}
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
                      {t("profile.scores.noMostPlayed")}
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

        {/* ── Playcount Graph ── */}
        {activity.length > 0 && (
          <PlaycountGraph activity={activity} />
        )}

        {/* ── Comments Section ── */}
        <div className="up-comments-section">
          <div className="up-comments-header">
            <span className="up-comments-title">{t("profile.comments.title")}</span>
            <span className="up-comments-count">{comments.length}</span>
          </div>

          {currentUserId && !isOwn && (
            <div className="up-comment-form">
              <textarea
                className="up-comment-textarea"
                placeholder={t("profile.comments.placeholder")}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                maxLength={1000}
                rows={3}
              />
              <div className="up-comment-form-actions">
                <span className="up-bio-charcount">{commentText.length}/1000</span>
                <button
                  className="up-comment-submit-btn"
                  onClick={postComment}
                  disabled={commentPosting || !commentText.trim()}
                >
                  {commentPosting ? t("profile.comments.posting") : t("profile.comments.post")}
                </button>
              </div>
            </div>
          )}

          {comments.length === 0 ? (
            <div className="up-comments-empty">{t("profile.comments.noComments")}</div>
          ) : (
            <div className="up-comments-list">
              {comments.map((c) => (
                <div key={c.id} className="up-comment-row">
                  <img
                    src={`http://a.pawinput.xyz/${c.author_id}`}
                    alt=""
                    className="up-comment-avatar"
                  />
                  <div className="up-comment-body">
                    <div className="up-comment-meta">
                      <Link href={`/u/${c.author_id}`} className="up-comment-author">{c.author_name}</Link>
                      <span className="up-comment-time">
                        {c.created_at ? timeAgo(Math.floor(new Date(c.created_at).getTime() / 1000)) : ""}
                      </span>
                      {(isStaff || currentUserId === c.author_id || currentUserId === userId) && (
                        <button
                          className="up-comment-delete-btn"
                          onClick={() => deleteComment(c.id)}
                          title="Delete comment"
                        >
                          ×
                        </button>
                      )}
                    </div>
                    <div className="up-comment-content">{c.content}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function PlaycountGraph({ activity }: { activity: { yr: number; mo: number; plays: number }[] }) {
  const t = useT();
  const now = new Date();

  const endDate    = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstEntry = activity.length > 0 ? activity[0] : null;
  // start exactly at first play month; fall back to 12 months ago only when no data
  const startDate  = firstEntry
    ? new Date(firstEntry.yr, firstEntry.mo - 1, 1)
    : new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const totalMonths =
    (endDate.getFullYear() - startDate.getFullYear()) * 12 +
    (endDate.getMonth()    - startDate.getMonth()) + 1;

  const slots = Array.from({ length: totalMonths }, (_, i) => {
    const d     = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
    const isJan = d.getMonth() === 0;
    const label = isJan ? `Jan ${d.getFullYear()}` : MONTH_ABBR[d.getMonth()];
    return { yr: d.getFullYear(), mo: d.getMonth() + 1, label, plays: 0 };
  });

  for (const a of activity) {
    const slot = slots.find((s) => s.yr === a.yr && s.mo === a.mo);
    if (slot) slot.plays = a.plays;
  }

  const max = Math.max(...slots.map((s) => s.plays), 1);
  const tickInterval = slots.length > 24 ? Math.floor(slots.length / 12) : 0;

  return (
    <div className="up-graph-block">
      <div className="up-graph-header">
        <span className="up-graph-title">{t("profile.playcountGraph.title")}</span>
        <span className="up-graph-sub">{t("profile.playcountGraph.subtitle")}</span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={slots} margin={{ top: 10, right: 12, left: -24, bottom: 0 }}>
          <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={true} horizontal={true} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval={tickInterval}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            domain={[0, max]}
            allowDecimals={false}
            width={40}
          />
          <Tooltip
            contentStyle={{ background: "#1e1e2a", border: "1px solid #3a3a4e", borderRadius: "6px", fontSize: "0.8rem" }}
            labelStyle={{ color: "rgba(255,255,255,0.5)" }}
            itemStyle={{ color: "#d55b9e" }}
            formatter={(v) => [v, "plays"]}
            cursor={{ stroke: "rgba(255,255,255,0.15)", strokeWidth: 1 }}
          />
          <Line
            type="linear"
            dataKey="plays"
            stroke="#d55b9e"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: "#d55b9e", strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
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
            <Link
              href={`/b/${bm.id}`}
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
            </Link>
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
        <Link
          href={`/b/${map.id}`}
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
        </Link>
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

function BadgesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  );
}
