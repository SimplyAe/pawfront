"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import {
  getBeatmaps,
  type BeatmapsetCard,
} from "@/lib/api";
import { mapStatus, diffColor, addCommas } from "@/lib/utils";

const STATUS_FILTERS = [
  { label: "Any",       value: undefined },
  { label: "Ranked",    value: 2 },
  { label: "Approved",  value: 3 },
  { label: "Loved",     value: 5 },
  { label: "Qualified", value: 4 },
  { label: "Pending",   value: 0 },
  { label: "Graveyard", value: -2 },
];

const MODE_FILTERS = [
  { label: "Any",    value: undefined },
  { label: "osu!",   value: 0 },
  { label: "Taiko",  value: 1 },
  { label: "Catch",  value: 2 },
  { label: "Mania",  value: 3 },
];

const SORT_OPTIONS = [
  { label: "Plays",      value: "plays" },
  { label: "Difficulty", value: "diff" },
  { label: "Title",      value: "title" },
  { label: "Artist",     value: "artist" },
];

const PAGE_SIZE = 20;

export default function BeatmapsPage() {
  const [query, setQuery] = useState("");
  const [inputVal, setInputVal] = useState("");
  const [statusFilter, setStatusFilter] = useState<number | undefined>(undefined);
  const [modeFilter, setModeFilter] = useState<number | undefined>(undefined);
  const [sort, setSort] = useState("plays");
  const [page, setPage] = useState(1);

  const [beatmapsets, setBeatmapsets] = useState<BeatmapsetCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMaps = useCallback(async (
    q: string,
    status: number | undefined,
    mode: number | undefined,
    sortBy: string,
    pg: number,
  ) => {
    setLoading(true);
    const result = await getBeatmaps({
      q: q || undefined,
      status,
      mode,
      sort: sortBy,
      page: pg,
      limit: PAGE_SIZE,
    });
    setBeatmapsets(result.beatmapsets);
    setTotal(result.total);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMaps(query, statusFilter, modeFilter, sort, page);
  }, [query, statusFilter, modeFilter, sort, page, fetchMaps]);

  function handleInputChange(val: string) {
    setInputVal(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(val);
      setPage(1);
    }, 400);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQuery(inputVal);
    setPage(1);
  }

  function changeStatus(val: number | undefined) {
    setStatusFilter(val);
    setPage(1);
  }

  function changeMode(val: number | undefined) {
    setModeFilter(val);
    setPage(1);
  }

  function changeSort(val: string) {
    setSort(val);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="bl-page">

      {/* ── Search header ── */}
      <div className="bl-search-bar">
        <div className="container-main">
          <form className="bl-search-form" onSubmit={handleSearch}>
            <input
              className="bl-search-input"
              type="text"
              placeholder="type in keywords..."
              value={inputVal}
              onChange={(e) => handleInputChange(e.target.value)}
            />
            <button type="submit" className="bl-search-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </form>

          {/* Filters */}
          <div className="bl-filters">
            <div className="bl-filter-row">
              <span className="bl-filter-label">Status</span>
              <div className="bl-filter-opts">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={String(f.value)}
                    className={`bl-filter-opt${statusFilter === f.value ? " bl-filter-opt--active" : ""}`}
                    onClick={() => changeStatus(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="bl-filter-row">
              <span className="bl-filter-label">Mode</span>
              <div className="bl-filter-opts">
                {MODE_FILTERS.map((f) => (
                  <button
                    key={String(f.value)}
                    className={`bl-filter-opt${modeFilter === f.value ? " bl-filter-opt--active" : ""}`}
                    onClick={() => changeMode(f.value)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sort bar ── */}
      <div className="bl-sort-bar">
        <div className="container-main bl-sort-inner">
          <span className="bl-sort-label">Sort by</span>
          <div className="bl-sort-opts">
            {SORT_OPTIONS.map((s) => (
              <button
                key={s.value}
                className={`bl-sort-opt${sort === s.value ? " bl-sort-opt--active" : ""}`}
                onClick={() => changeSort(s.value)}
              >
                {s.label}
              </button>
            ))}
          </div>
          {total > 0 && (
            <span className="bl-result-count">{addCommas(total)} beatmapsets</span>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="container-main bl-grid-wrap">
        {loading ? (
          <div className="bl-empty">Loading...</div>
        ) : beatmapsets.length === 0 ? (
          <div className="bl-empty">No beatmaps found.</div>
        ) : (
          <div className="bl-grid">
            {beatmapsets.map((bs) => (
              <BeatmapCard key={bs.set_id} bs={bs} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="bl-pagination">
            <button
              className="bl-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              ‹ Prev
            </button>
            <span className="bl-page-info">
              {page} / {totalPages}
            </span>
            <button
              className="bl-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next ›
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function BeatmapCard({ bs }: { bs: BeatmapsetCard }) {
  const status = mapStatus(bs.status);
  const coverUrl = `https://assets.ppy.sh/beatmaps/${bs.set_id}/covers/card.jpg`;
  const bannerUrl = `https://assets.ppy.sh/beatmaps/${bs.set_id}/covers/cover@2x.jpg`;

  return (
    <Link href={`/b/${bs.id}`} className="bl-card">
      {/* Blurred bg */}
      <div
        className="bl-card-bg"
        style={{ backgroundImage: `url(${bannerUrl})` }}
      />
      <div className="bl-card-overlay" />

      {/* Cover thumbnail */}
      <img
        src={coverUrl}
        alt=""
        className="bl-card-cover"
        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
      />

      {/* Info */}
      <div className="bl-card-info">
        <div className="bl-card-title">{bs.title}</div>
        <div className="bl-card-artist">{bs.artist}</div>
        <div className="bl-card-mapper">
          mapped by <span className="bl-card-mapper-name">{bs.creator}</span>
        </div>

        {/* Bottom row: status + diffs */}
        <div className="bl-card-bottom">
          <span
            className="bl-card-status"
            style={{ color: status.color, borderColor: `${status.color}60`, background: `${status.color}18` }}
          >
            {status.label}
          </span>
          <div className="bl-card-diffs">
            {bs.diffs.slice(0, 12).map((d) => (
              <span
                key={d.id}
                className="bl-card-diff-dot"
                style={{ background: diffColor(d.diff) }}
                title={`${d.version} (${d.diff.toFixed(2)}★)`}
              />
            ))}
            {bs.diffs.length > 12 && (
              <span className="bl-card-diff-more">+{bs.diffs.length - 12}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
