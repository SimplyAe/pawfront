"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getMapInfo,
  getMapScores,
  getBeatmapset,
  beatmapBannerUrl,
  type BeatmapInfo,
  type Score,
} from "@/lib/api";
import {
  addCommas,
  formatLength,
  mapStatus,
  diffColor,
  parseMods,
  timeAgo,
} from "@/lib/utils";
import GradeImage from "@/components/GradeImage";

type ScoreWithPlayer = Score & { userid?: number; player_name?: string };

export default function BeatmapPage() {
  const params = useParams();
  const mapId = Number(params.id);

  const [map, setMap] = useState<BeatmapInfo | null>(null);
  const [setMaps, setSetMaps] = useState<BeatmapInfo[]>([]);
  const [scores, setScores] = useState<ScoreWithPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoresLoading, setScoresLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const info = await getMapInfo(mapId);
      if (!info) { setLoading(false); return; }
      setMap(info);
      const [diffs, mapScores] = await Promise.all([
        getBeatmapset(info.set_id),
        getMapScores(mapId, info.mode),
      ]);
      setSetMaps(diffs);
      setScores(mapScores as ScoreWithPlayer[]);
      setLoading(false);
    }
    load();
  }, [mapId]);

  async function switchDiff(newMap: BeatmapInfo) {
    if (newMap.id === map?.id) return;
    setMap(newMap);
    setScoresLoading(true);
    const s = await getMapScores(newMap.id, newMap.mode);
    setScores(s as ScoreWithPlayer[]);
    setScoresLoading(false);
  }

  if (loading) {
    return <div className="bmap-loading">Loading beatmap...</div>;
  }
  if (!map) {
    return <div className="bmap-loading">Beatmap not found.</div>;
  }

  const status = mapStatus(map.status);
  const bannerUrl = beatmapBannerUrl(map.set_id);
  const coverUrl = `https://assets.ppy.sh/beatmaps/${map.set_id}/covers/list.jpg`;
  const sortedDiffs = [...setMaps].sort((a, b) => a.diff - b.diff);

  return (
    <div className="bmap-page">

      {/* ── HEADER ── */}
      <div className="bmap-hdr" style={{ "--bmap-bg": `url(${bannerUrl})` } as React.CSSProperties}>
        <div className="bmap-hdr-bg" />
        <div className="bmap-hdr-overlay" />

        <div className="bmap-hdr-inner container-main">

          {/* LEFT: main beatmap info */}
          <div className="bmap-hdr-main">

            {/* Cover */}
            <div className="bmap-picker-row">
              <img
                src={coverUrl}
                alt="cover"
                className="bmap-cover-thumb"
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>

            {/* Current diff name + stars */}
            <div className="bmap-diff-name-row">
              <span className="bmap-diff-name">{map.version}</span>
              <span className="bmap-diff-stars" style={{ color: diffColor(map.diff) }}>
                {map.diff.toFixed(2)}&thinsp;&#9733;
              </span>
            </div>

            {/* Mapper line */}
            <div className="bmap-mapper-line">
              mapped by <span className="bmap-mapper-name">{map.creator}</span>
            </div>

            {/* Play count + passes */}
            <div className="bmap-meta-row">
              <span className="bmap-meta-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                {addCommas(map.plays)}
              </span>
              <span className="bmap-meta-sep">·</span>
              <span className="bmap-meta-item">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                {addCommas(map.passes)} passes
              </span>
            </div>

            {/* Song title + artist */}
            <div className="bmap-song-title">{map.title}</div>
            <div className="bmap-song-artist">{map.artist}</div>

            {/* Action button */}
            <div className="bmap-action-row">
              <a
                href={`https://osu.ppy.sh/beatmaps/${map.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bmap-action-btn"
              >
                View on osu.ppy.sh
              </a>
            </div>
          </div>

          {/* RIGHT: stats panel */}
          <div className="bmap-hdr-stats">
            <div
              className="bmap-ranked-badge"
              style={{ color: status.color, borderColor: `${status.color}55`, background: `${status.color}18` }}
            >
              {status.label}
            </div>

            <div className="bmap-qs-row">
              <div className="bmap-qs-cell">
                <span className="bmap-qs-label">Length</span>
                <span className="bmap-qs-val">{formatLength(map.total_length)}</span>
              </div>
              <div className="bmap-qs-cell">
                <span className="bmap-qs-label">BPM</span>
                <span className="bmap-qs-val">{map.bpm.toFixed(0)}</span>
              </div>
              <div className="bmap-qs-cell">
                <span className="bmap-qs-label">Max Combo</span>
                <span className="bmap-qs-val">{addCommas(map.max_combo)}x</span>
              </div>
            </div>

            <div className="bmap-stat-bars">
              {([
                { label: "Circle Size",   val: map.cs,   max: 10 },
                { label: "HP Drain",      val: map.hp,   max: 10 },
                { label: "Accuracy",      val: map.od,   max: 10 },
                { label: "Approach Rate", val: map.ar,   max: 10 },
                { label: "Star Rating",   val: map.diff, max: 10, color: diffColor(map.diff) },
              ] as { label: string; val: number; max: number; color?: string }[]).map(({ label, val, max, color }) => (
                <div key={label} className="bmap-bar-row">
                  <span className="bmap-bar-label">{label}</span>
                  <div className="bmap-bar-track">
                    <div
                      className="bmap-bar-fill"
                      style={{ width: `${Math.min(100, (val / max) * 100)}%`, background: color ?? "#d55b9e" }}
                    />
                  </div>
                  <span className="bmap-bar-val" style={{ color: color ?? "rgba(255,255,255,0.8)" }}>
                    {val.toFixed(1)}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ── DIFF NAVIGATOR ── */}
      {sortedDiffs.length > 1 && (
        <div className="bmap-diffnav container-main">
          <div className="bmap-diffnav-label">Difficulties</div>
          <div className="bmap-diffnav-list">
            {sortedDiffs.map((d) => {
              const col = diffColor(d.diff);
              const active = d.id === map.id;
              return (
                <button
                  key={d.id}
                  className={`bmap-diffnav-btn${active ? " bmap-diffnav-btn--active" : ""}`}
                  style={{ "--dc": col } as React.CSSProperties}
                  onClick={() => switchDiff(d)}
                >
                  <svg className="bmap-diffnav-star" width="10" height="10" viewBox="0 0 24 24" fill={col}>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  <span className="bmap-diffnav-name">{d.version}</span>
                  <span className="bmap-diffnav-sr" style={{ color: col }}>{d.diff.toFixed(2)}★</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── SCOREBOARD ── */}
      <div className="bmap-content container-main">
        <div className="bmap-board">

          <div className="bmap-board-hdr">
            <span className="bmap-board-title">Leaderboard</span>
            {scoresLoading && <span className="bmap-board-loading">Loading...</span>}
          </div>

          {!scoresLoading && scores.length === 0 && (
            <div className="bmap-board-empty">No scores on this difficulty yet.</div>
          )}

          {scores.length > 0 && (
            <div className="bmap-table-scroll">
              <table className="bmap-table">
                <thead>
                  <tr className="bmap-thead-row">
                    <th className="bmap-th bmap-th--rank">#</th>
                    <th className="bmap-th bmap-th--grade">Grade</th>
                    <th className="bmap-th bmap-th--score">Score</th>
                    <th className="bmap-th bmap-th--acc">Accuracy</th>
                    <th className="bmap-th bmap-th--player">Player</th>
                    <th className="bmap-th bmap-th--combo">Combo</th>
                    <th className="bmap-th bmap-th--hit" style={{ color: "#90caf9" }}>300</th>
                    <th className="bmap-th bmap-th--hit" style={{ color: "#80deea" }}>100</th>
                    <th className="bmap-th bmap-th--hit" style={{ color: "#ffcc80" }}>50</th>
                    <th className="bmap-th bmap-th--hit" style={{ color: "#ef9a9a" }}>Miss</th>
                    <th className="bmap-th bmap-th--pp">PP</th>
                    <th className="bmap-th bmap-th--time">Time</th>
                    <th className="bmap-th bmap-th--mods">Mods</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((s, i) => {
                    const mods = parseMods(s.mods);
                    const isFirst = i === 0;
                    return (
                      <tr key={s.id} className={`bmap-tr${isFirst ? " bmap-tr--gold" : ""}`}>
                        <td className="bmap-td bmap-td--rank">
                          <span style={{ color: isFirst ? "#d55b9e" : "rgba(255,255,255,0.3)", fontWeight: isFirst ? 700 : 400 }}>
                            #{i + 1}
                          </span>
                        </td>
                        <td className="bmap-td bmap-td--grade">
                          <GradeImage grade={s.grade} small />
                        </td>
                        <td className="bmap-td bmap-td--score">{addCommas(s.score)}</td>
                        <td className="bmap-td bmap-td--acc">{s.acc.toFixed(2)}%</td>
                        <td className="bmap-td bmap-td--player">
                          <Link href={`/u/${s.userid ?? 0}`} className="bmap-player-link">
                            <img
                              src={`http://a.pawinput.xyz/${s.userid ?? 0}`}
                              alt=""
                              className="bmap-player-av"
                            />
                            <span>{s.player_name ?? "—"}</span>
                          </Link>
                        </td>
                        <td className="bmap-td bmap-td--combo">{addCommas(s.max_combo)}x</td>
                        <td className="bmap-td bmap-td--hit" style={{ color: "#90caf9" }}>{addCommas(s.n300)}</td>
                        <td className="bmap-td bmap-td--hit" style={{ color: "#80deea" }}>{addCommas(s.n100)}</td>
                        <td className="bmap-td bmap-td--hit" style={{ color: "#ffcc80" }}>{addCommas(s.n50)}</td>
                        <td className="bmap-td bmap-td--hit" style={{ color: "#ef9a9a" }}>{addCommas(s.nmiss)}</td>
                        <td className="bmap-td bmap-td--pp">{s.pp.toFixed(0)}pp</td>
                        <td className="bmap-td bmap-td--time">{timeAgo(new Date(s.play_time).getTime() / 1000)}</td>
                        <td className="bmap-td bmap-td--mods">
                          {mods[0] === "NM"
                            ? <span className="bmap-mod-nm">NM</span>
                            : mods.map(m => <span key={m} className="score-mod">{m}</span>)
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}
