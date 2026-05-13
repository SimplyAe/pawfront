"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getLeaderboard, LeaderboardEntry } from "@/lib/api";
import { addCommas, modeToInt } from "@/lib/utils";
import ModeSelector from "@/components/ModeSelector";
import Flag from "@/components/Flag";

const SORT_OPTIONS = [
  { key: "pp", label: "Performance" },
  { key: "rscore", label: "Ranked Score" },
  { key: "tscore", label: "Total Score" },
  { key: "acc", label: "Accuracy" },
  { key: "plays", label: "Play Count" },
  { key: "playtime", label: "Playtime" },
];

export default function LeaderboardPage() {
  const [mode, setMode] = useState("std");
  const [mods, setMods] = useState("vn");
  const [sort, setSort] = useState("pp");
  const [country, setCountry] = useState("");
  const [page, setPage] = useState(0);
  const [boards, setBoards] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const modeInt = modeToInt(mode, mods);
    const data = await getLeaderboard(modeInt, sort, 50, page * 50, country || undefined);
    setBoards(data);
    setLoading(false);
  }, [mode, mods, sort, country, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleModeChange(newMode: string, newMods: string) {
    setMode(newMode);
    setMods(newMods);
    setPage(0);
  }

  return (
    <div className="container-main" style={{ padding: "2rem 1.25rem" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          marginBottom: "1.25rem",
          color: "#fff",
        }}
      >
        Leaderboard
      </h1>

      <div
        style={{
          background: "#1e1e2a",
          border: "1px solid #3a3a4e",
          borderRadius: "8px",
          overflow: "hidden",
        }}
      >
        <ModeSelector mode={mode} mods={mods} onChange={handleModeChange} />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            padding: "0.75rem 1rem",
            background: "#252534",
            borderBottom: "1px solid #3a3a4e",
            flexWrap: "wrap",
          }}
        >
          <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => {
                  setSort(s.key);
                  setPage(0);
                }}
                style={{
                  padding: "0.3rem 0.75rem",
                  borderRadius: "4px",
                  fontSize: "0.8rem",
                  fontWeight: 500,
                  border: "1px solid",
                  borderColor: sort === s.key ? "#d55b9e" : "#3a3a4e",
                  background: sort === s.key ? "rgba(213,91,158,0.15)" : "transparent",
                  color: sort === s.key ? "#d55b9e" : "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <input
              type="text"
              placeholder="Country (e.g. US)"
              maxLength={2}
              value={country}
              onChange={(e) => {
                setCountry(e.target.value.toUpperCase());
                setPage(0);
              }}
              style={{
                background: "rgba(0,0,0,0.25)",
                border: "1px solid #3a3a4e",
                borderRadius: "4px",
                color: "#fff",
                padding: "0.3rem 0.6rem",
                fontSize: "0.8rem",
                width: "130px",
                outline: "none",
              }}
            />
          </div>
        </div>

        {loading ? (
          <div
            style={{
              padding: "3rem",
              textAlign: "center",
              color: "rgba(255,255,255,0.3)",
              fontSize: "0.9rem",
            }}
          >
            Loading...
          </div>
        ) : (
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #3a3a4e" }}>
                    <th style={thStyle}>#</th>
                    <th style={{ ...thStyle, textAlign: "left" }}>Player</th>
                    {sort === "pp" && <th style={thStyle}>PP</th>}
                    {(sort === "rscore" || sort === "tscore") && <th style={thStyle}>Score</th>}
                    <th style={thStyle}>Accuracy</th>
                    <th style={thStyle}>Playcount</th>
                    <th style={thStyle}>Max Combo</th>
                  </tr>
                </thead>
                <tbody>
                  {boards.map((entry, i) => {
                    const rank = page * 50 + i + 1;
                    return (
                      <tr
                        key={entry.player_id}
                        style={{
                          borderBottom: "1px solid rgba(58,58,78,0.4)",
                          transition: "background 0.1s",
                        }}
                        onMouseEnter={(e) =>
                          ((e.currentTarget as HTMLElement).style.background =
                            "rgba(255,255,255,0.025)")
                        }
                        onMouseLeave={(e) =>
                          ((e.currentTarget as HTMLElement).style.background = "transparent")
                        }
                      >
                        <td
                          style={{
                            padding: "0.65rem 1rem",
                            textAlign: "right",
                            color:
                              rank === 1
                                ? "#ffd700"
                                : rank === 2
                                ? "#c0c0c0"
                                : rank === 3
                                ? "#cd7f32"
                                : "rgba(255,255,255,0.35)",
                            fontWeight: rank <= 3 ? 700 : 400,
                            fontSize: "0.85rem",
                            width: "56px",
                          }}
                        >
                          #{rank}
                        </td>
                        <td style={{ padding: "0.65rem 1rem" }}>
                          <Link
                            href={`/u/${entry.player_id}`}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.6rem",
                              color: "#fff",
                            }}
                          >
                            <img
                              src={`http://a.pawinput.xyz/${entry.player_id}`}
                              alt=""
                              className="player-avatar-small"
                            />
                            <Flag country={entry.country} />
                            {entry.clan_tag && (
                              <span style={{ color: "#d55b9e", fontSize: "0.8rem" }}>
                                [{entry.clan_tag}]
                              </span>
                            )}
                            <span style={{ fontWeight: 500 }}>{entry.name}</span>
                          </Link>
                        </td>
                        {sort === "pp" && (
                          <td
                            style={{
                              padding: "0.65rem 1rem",
                              textAlign: "right",
                              color: "#d55b9e",
                              fontWeight: 600,
                            }}
                          >
                            {addCommas(Math.round(entry.pp))}
                          </td>
                        )}
                        {(sort === "rscore" || sort === "tscore") && (
                          <td
                            style={{
                              padding: "0.65rem 1rem",
                              textAlign: "right",
                              color: "rgba(255,255,255,0.75)",
                            }}
                          >
                            {addCommas(sort === "rscore" ? entry.rscore : entry.tscore)}
                          </td>
                        )}
                        <td
                          style={{
                            padding: "0.65rem 1rem",
                            textAlign: "right",
                            color: "rgba(255,255,255,0.7)",
                          }}
                        >
                          {entry.acc.toFixed(2)}%
                        </td>
                        <td
                          style={{
                            padding: "0.65rem 1rem",
                            textAlign: "right",
                            color: "rgba(255,255,255,0.7)",
                          }}
                        >
                          {addCommas(entry.plays)}
                        </td>
                        <td
                          style={{
                            padding: "0.65rem 1rem",
                            textAlign: "right",
                            color: "rgba(255,255,255,0.7)",
                          }}
                        >
                          {addCommas(entry.max_combo)}x
                        </td>
                      </tr>
                    );
                  })}
                  {boards.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        style={{
                          padding: "2.5rem",
                          textAlign: "center",
                          color: "rgba(255,255,255,0.3)",
                        }}
                      >
                        No players to display.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem",
                padding: "0.75rem 1rem",
                borderTop: "1px solid #3a3a4e",
              }}
            >
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{
                  padding: "0.35rem 0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #3a3a4e",
                  background: "transparent",
                  color: page === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                  cursor: page === 0 ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Prev
              </button>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem" }}>
                Page {page + 1}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={boards.length < 50}
                style={{
                  padding: "0.35rem 0.9rem",
                  borderRadius: "4px",
                  border: "1px solid #3a3a4e",
                  background: "transparent",
                  color:
                    boards.length < 50 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
                  cursor: boards.length < 50 ? "not-allowed" : "pointer",
                  fontSize: "0.85rem",
                }}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  padding: "0.6rem 1rem",
  textAlign: "right",
  color: "rgba(255,255,255,0.4)",
  fontWeight: 500,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  whiteSpace: "nowrap",
};
