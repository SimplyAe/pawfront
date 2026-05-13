"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getTopScores, TopScore } from "@/lib/api";
import { addCommas, parseMods, diffColor, modeToInt, timeAgo } from "@/lib/utils";
import ModeSelector from "@/components/ModeSelector";
import GradeImage from "@/components/GradeImage";
import { useT } from "@/i18n";

const TOTAL_PAGES = 10;

export default function TopPlaysPage() {
  const t = useT();
  const [mode, setMode] = useState("std");
  const [mods, setMods] = useState("vn");
  const [page, setPage] = useState(0);
  const [scores, setScores] = useState<TopScore[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const modeInt = modeToInt(mode, mods);
    const data = await getTopScores(modeInt, page);
    setScores(data);
    setLoading(false);
  }, [mode, mods, page]);

  useEffect(() => { load(); }, [load]);

  function handleModeChange(newMode: string, newMods: string) {
    setMode(newMode);
    setMods(newMods);
    setPage(0);
  }

  return (
    <div className="tp-page">
      {/* Page header */}
      <div className="tp-page-header">
        <div className="container-main">
          <div className="tp-head-inner">
            <div>
              <h1 className="tp-title">{t("topPlays.title")}</h1>
              <p className="tp-subtitle">{t("topPlays.subtitle")}</p>
            </div>
            <ModeSelector mode={mode} mods={mods} onChange={handleModeChange} />
          </div>
        </div>
      </div>

      <div className="container-main tp-body">
        {/* Score list */}
        <div className="tp-list">
          {loading ? (
            <div className="tp-loading">{t("topPlays.loading")}</div>
          ) : scores.length === 0 ? (
            <div className="tp-placeholder">{t("topPlays.noScores")}</div>
          ) : (
            scores.map((s, i) => {
              const rank = page * 10 + i + 1;
              const bm = s.beatmap;
              const modList = parseMods(s.mods);
              const dc = diffColor(bm.diff);
              const bannerUrl = `https://assets.ppy.sh/beatmaps/${bm.set_id}/covers/cover.jpg`;

              return (
                <div
                  key={s.id}
                  className="tp-card"
                  style={{ "--banner": `url(${bannerUrl})` } as React.CSSProperties}
                >
                  {/* background layers */}
                  <div className="tp-card-bg" />
                  <div className="tp-card-gradient" />

                  {/* foreground content */}
                  <div className="tp-card-inner">

                    {/* Left: rank + player */}
                    <div className="tp-left">
                      <span className="tp-rank-num">#{rank}</span>
                      <Link href={`/u/${s.userid}`} className="tp-player-block">
                        <img
                          src={`http://a.pawinput.xyz/${s.userid}`}
                          alt=""
                          className="tp-avatar"
                        />
                        <span className="tp-player-name">{s.player_name}</span>
                      </Link>
                    </div>

                    {/* Centre: map info */}
                    <div className="tp-centre">
                      <Link href={`/b/${bm.id}`} className="tp-map-title">
                        {bm.artist} — <strong>{bm.title}</strong>
                      </Link>
                      <div className="tp-map-meta">
                        <span className="tp-diff-star" style={{ color: dc }}>
                          ★ {bm.diff.toFixed(2)}
                        </span>
                        <span className="tp-map-version">[{bm.version}]</span>
                        {modList[0] !== "NM" && modList.map(m => (
                          <span key={m} className="score-mod tp-mod">{m}</span>
                        ))}
                      </div>
                      <div className="tp-score-detail">
                        <span>{addCommas(s.max_combo)}x</span>
                        <span className="tp-sep">·</span>
                        <span>{s.nmiss > 0 ? t("topPlays.miss", { n: s.nmiss }) : t("topPlays.fc")}</span>
                        <span className="tp-sep">·</span>
                        <span>{s.n300}/{s.n100}/{s.n50}/{s.nmiss}</span>
                        <span className="tp-sep">·</span>
                        <span className="tp-time-ago">
                          {s.play_time ? timeAgo(new Date(s.play_time).getTime() / 1000) : "—"}
                        </span>
                      </div>
                    </div>

                    {/* Right: grade + pp + acc */}
                    <div className="tp-right">
                      <div className="tp-grade-wrap">
                        <GradeImage grade={s.grade} />
                      </div>
                      <div className="tp-pp-block">
                        <span className="tp-pp-val">{addCommas(Math.round(s.pp))}<span className="tp-pp-unit">pp</span></span>
                        <span className="tp-acc-val">{s.acc.toFixed(2)}%</span>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <div className="tp-pagination">
          <button
            className="tp-page-btn"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            {t("topPlays.prev")}
          </button>
          <div className="tp-page-nums">
            {Array.from({ length: TOTAL_PAGES }, (_, i) => (
              <button
                key={i}
                className={`tp-page-num${page === i ? " active" : ""}`}
                onClick={() => setPage(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button
            className="tp-page-btn"
            onClick={() => setPage((p) => Math.min(TOTAL_PAGES - 1, p + 1))}
            disabled={page === TOTAL_PAGES - 1}
          >
            {t("topPlays.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
