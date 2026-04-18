import Link from "next/link";
import { getPlayerCount, getLeaderboard, getServerStats, getRecentScores, type RecentScore } from "@/lib/api";
import { addCommas, parseMods, diffColor, timeAgo } from "@/lib/utils";
import GradeImage from "@/components/GradeImage";

function gradeColor(grade: string): string {
  const g = grade.toUpperCase();
  if (g === "XH" || g === "SSH") return "#c9d6e3";
  if (g === "X"  || g === "SS")  return "#ffd700";
  if (g === "SH")                 return "#c0c0c0";
  if (g === "S")                  return "#a78bfa";
  if (g === "A")                  return "#66bb6a";
  if (g === "B")                  return "#4fc3f7";
  if (g === "C")                  return "#ffca28";
  return "#ef4444";
}

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [counts, serverStats, topPlayers, recentScores] = await Promise.all([
    getPlayerCount(),
    getServerStats(),
    getLeaderboard(0, "pp", 10, 0),
    getRecentScores(16),
  ]);

  return (
    <div>
      <section className="hero-section">
        <div className="hero-inner container-main">
          <div className="hero-mascot-wrap">
            <img src="/mascot.png" alt="Pawtoka mascot" className="hero-mascot" />
          </div>

          <div className="hero-card">
            <div className="hero-stats-row">
              <span className="hero-stat-pill total">
                <strong>{addCommas(counts?.total ?? 0)}</strong> total users
              </span>
              <span className="hero-stat-pill online">
                <strong>{counts?.online ?? 0}</strong> online
              </span>
            </div>

            <h1 className="hero-title">Pawtoka</h1>

            <ul className="hero-points">
              <li>A revival of the beloved <strong>osu!atoka</strong> private server.</li>
              <li>We have a <strong>custom client</strong> made exclusively for this server.</li>
              <li>Relaxed rules — <strong>some cheats are allowed</strong>.</li>
            </ul>

            <div className="hero-actions">
              <Link href="/leaderboard" className="hero-btn primary">
                View Leaderboards
              </Link>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      <div className="home-staff">
        <div className="container-main">
          <div className="home-staff-header">Staff</div>
          <div className="staff-cards">
            <div className="staff-card">
              <div className="staff-avatar-wrap rainbow-border">
                <img src="/staff-ae.jpg" alt="Ae" className="staff-avatar" />
              </div>
              <div className="staff-info">
                <span className="staff-name rainbow-text">Ae</span>
                <span className="staff-role">Owner &amp; Dev</span>
                <span className="staff-discord-row">Discord: <strong>transwaste</strong></span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <hr className="section-divider" />

      <div className="stats-strip-bg">

        <div className="stats-strip">

          <div className="stats-strip-cell" style={{ "--ac": "#3b82f6" } as React.CSSProperties}>
            <div className="ssc-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            </div>
            <div className="ssc-body">
              <div className="ssc-value">{counts?.online ?? 0} / {addCommas(counts?.total ?? 0)}</div>
              <div className="ssc-label">Online / Registered</div>
            </div>
          </div>

          <div className="stats-strip-cell" style={{ "--ac": "#f59e0b" } as React.CSSProperties}>
            <div className="ssc-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
            </div>
            <div className="ssc-body">
              <div className="ssc-value">{serverStats?.latest_player || "—"}</div>
              <div className="ssc-label">Latest Player</div>
            </div>
          </div>

          <div className="stats-strip-cell" style={{ "--ac": "#22c55e" } as React.CSSProperties}>
            <div className="ssc-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            </div>
            <div className="ssc-body">
              <div className="ssc-value">{addCommas(serverStats?.submitted_scores ?? 0)}</div>
              <div className="ssc-label">Submitted Scores</div>
            </div>
          </div>

          <div className="stats-strip-cell" style={{ "--ac": "#ef4444" } as React.CSSProperties}>
            <div className="ssc-icon" style={{ color: "#ef4444" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
            </div>
            <div className="ssc-body">
              <div className="ssc-value" style={{ color: "#ef4444" }}>{addCommas(serverStats?.restricted_count ?? 0)}</div>
              <div className="ssc-label">Restricted Players</div>
            </div>
          </div>

          <div className="stats-strip-cell" style={{ "--ac": "#a78bfa" } as React.CSSProperties}>
            <div className="ssc-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>
            </div>
            <div className="ssc-body">
              <div className="ssc-value">{serverStats?.top_score_pp ? addCommas(Math.round(serverStats.top_score_pp)) + "pp" : "—"}</div>
              <div className="ssc-label">Top Score{serverStats?.top_score_player ? <><br/><span className="ssc-sub">Done by {serverStats.top_score_player}</span></> : null}</div>
            </div>
          </div>

          <div className="stats-strip-cell" style={{ "--ac": "#d55b9e" } as React.CSSProperties}>
            <div className="ssc-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
            <div className="ssc-body">
              <div className="ssc-value">{addCommas(serverStats?.total_pp ?? 0)}</div>
              <div className="ssc-label">Total PP</div>
            </div>
          </div>

        </div>
      </div>

      <hr className="section-divider" />

      <div className="container-main" style={{ padding: "2rem 1.25rem" }}>

        {/* Section header */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
          <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
            Top Players &mdash; osu! (Vanilla)
          </span>
          <Link href="/leaderboard" style={{ marginLeft: "auto", color: "#d55b9e", fontSize: "0.8rem" }}>
            View all
          </Link>
        </div>

        {/* Podium — top 3 */}
        {topPlayers.length >= 3 && (
          <div className="podium-wrap">
            {/* 2nd place */}
            <div className="podium-slot podium-2">
              <Link href={`/u/${topPlayers[1].player_id}`} className="podium-card">
                <img src={`http://a.pawinput.xyz/${topPlayers[1].player_id}`} alt="" className="podium-avatar" />
                <div className="podium-rank silver">#2</div>
                <div className="podium-name">{topPlayers[1].name}</div>
                <div className="podium-pp">{addCommas(Math.round(topPlayers[1].pp))}pp</div>
                <div className="podium-acc">{topPlayers[1].acc.toFixed(2)}%</div>
                <div className="podium-plinth podium-plinth-2" />
              </Link>
            </div>

            {/* 1st place */}
            <div className="podium-slot podium-1">
              <div className="podium-crown">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffd700"><path d="M2 20h20v2H2v-2ZM4 17l4-8 4 4 4-6 4 10H4Z"/></svg>
              </div>
              <Link href={`/u/${topPlayers[0].player_id}`} className="podium-card">
                <img src={`http://a.pawinput.xyz/${topPlayers[0].player_id}`} alt="" className="podium-avatar podium-avatar-lg" />
                <div className="podium-rank gold">#1</div>
                <div className="podium-name">{topPlayers[0].name}</div>
                <div className="podium-pp">{addCommas(Math.round(topPlayers[0].pp))}pp</div>
                <div className="podium-acc">{topPlayers[0].acc.toFixed(2)}%</div>
                <div className="podium-plinth podium-plinth-1" />
              </Link>
            </div>

            {/* 3rd place */}
            <div className="podium-slot podium-3">
              <Link href={`/u/${topPlayers[2].player_id}`} className="podium-card">
                <img src={`http://a.pawinput.xyz/${topPlayers[2].player_id}`} alt="" className="podium-avatar" />
                <div className="podium-rank bronze">#3</div>
                <div className="podium-name">{topPlayers[2].name}</div>
                <div className="podium-pp">{addCommas(Math.round(topPlayers[2].pp))}pp</div>
                <div className="podium-acc">{topPlayers[2].acc.toFixed(2)}%</div>
                <div className="podium-plinth podium-plinth-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Ranks 4–10 table */}
        {topPlayers.length > 3 && (
          <div style={{ background: "#1e1e2a", border: "1px solid #3a3a4e", borderRadius: "8px", overflow: "hidden", marginTop: "0" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #3a3a4e" }}>
                    {["#", "Player", "PP", "Accuracy", "Playcount", "Max Combo"].map((h) => (
                      <th key={h} style={{ padding: "0.6rem 1rem", textAlign: h === "Player" ? "left" : "right", color: "rgba(255,255,255,0.4)", fontWeight: 500, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topPlayers.slice(3).map((entry, i) => (
                    <tr key={entry.player_id} className="lb-row">
                      <td style={{ padding: "0.6rem 1rem", textAlign: "right", color: "rgba(255,255,255,0.3)", fontSize: "0.85rem", width: "48px" }}>
                        #{i + 4}
                      </td>
                      <td style={{ padding: "0.6rem 1rem" }}>
                        <Link href={`/u/${entry.player_id}`} style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "#fff" }}>
                          <img src={`http://a.pawinput.xyz/${entry.player_id}`} alt="" className="player-avatar-small" />
                          <img src={`https://flagcdn.com/20x15/${entry.country.toLowerCase()}.png`} alt={entry.country} className="flag-img" />
                          {entry.clan_tag && <span style={{ color: "#d55b9e", fontSize: "0.8rem" }}>[{entry.clan_tag}]</span>}
                          <span style={{ fontWeight: 500 }}>{entry.name}</span>
                        </Link>
                      </td>
                      <td style={{ padding: "0.6rem 1rem", textAlign: "right", color: "#d55b9e", fontWeight: 600 }}>{addCommas(Math.round(entry.pp))}</td>
                      <td style={{ padding: "0.6rem 1rem", textAlign: "right", color: "rgba(255,255,255,0.65)" }}>{entry.acc.toFixed(2)}%</td>
                      <td style={{ padding: "0.6rem 1rem", textAlign: "right", color: "rgba(255,255,255,0.65)" }}>{addCommas(entry.plays)}</td>
                      <td style={{ padding: "0.6rem 1rem", textAlign: "right", color: "rgba(255,255,255,0.65)" }}>{addCommas(entry.max_combo)}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      <hr className="section-divider" />

      {/* ── RECENT SCORES ── */}
      {recentScores.length > 0 && (
        <div style={{ background: "#0f0f18" }}>
        <div className="container-main" style={{ padding: "2rem 1.25rem 1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
            <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 500 }}>
              Recent Scores
            </span>
          </div>
          <div className="rscore-grid">
            {[recentScores.slice(0, 8), recentScores.slice(8, 16)].map((col, ci) => (
              <div key={ci} className="rscore-col">
                {col.map((s: RecentScore) => {
                  const mods = parseMods(s.mods);
                  const dc = diffColor(s.diff);
                  const gc = gradeColor(s.grade);
                  return (
                    <div key={s.id} className="rscore-row" style={{ "--gc": gc } as React.CSSProperties}>
                      {/* Cover thumbnail */}
                      <div
                        className="rscore-cover"
                        style={{ backgroundImage: `url(https://assets.ppy.sh/beatmaps/${s.set_id}/covers/list.jpg)` }}
                      />

                      {/* Grade */}
                      <div className="rscore-grade">
                        <GradeImage grade={s.grade} small />
                      </div>

                      {/* Map info */}
                      <div className="rscore-mapinfo">
                        <Link href={`/b/${s.map_id}`} className="rscore-maptitle">
                          {s.artist} &mdash; {s.title}
                        </Link>
                        <div className="rscore-diff">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill={dc} style={{ flexShrink: 0 }}>
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                          </svg>
                          <span style={{ color: dc, fontWeight: 700 }}>{s.diff.toFixed(2)}</span>
                          <span>{s.version}</span>
                        </div>
                      </div>

                      {/* Mods */}
                      <div className="rscore-mods">
                        {mods[0] === "NM"
                          ? <span className="rscore-mod-nm">NM</span>
                          : mods.map(m => <span key={m} className="score-mod">{m}</span>)
                        }
                      </div>

                      {/* Stats */}
                      <div className="rscore-stats">
                        <span className="rscore-pp">{s.pp.toFixed(0)}pp</span>
                        <span className="rscore-acc">{s.acc.toFixed(2)}%</span>
                      </div>

                      {/* Player + time stacked */}
                      <div className="rscore-player-wrap">
                        <Link href={`/u/${s.userid}`} className="rscore-player">
                          <img src={`http://a.pawinput.xyz/${s.userid}`} alt="" className="rscore-avatar" />
                          <span>{s.player_name}</span>
                        </Link>
                        <div className="rscore-time">
                          {s.play_time ? timeAgo(new Date(s.play_time).getTime() / 1000) : "—"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        </div>
      )}

    </div>
  );
}
