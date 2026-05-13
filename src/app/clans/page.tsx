"use client";

import { useState, useEffect, useTransition } from "react";
import Link from "next/link";
import { getClans, type ClanEntry } from "@/lib/api";
import { addCommas, modeToInt } from "@/lib/utils";
import ModeSelector from "@/components/ModeSelector";
import { useT } from "@/i18n";

const PER_PAGE = 50;

export default function ClansPage() {
  const t = useT();
  const [mode, setMode]       = useState("osu!");
  const [mods, setMods]       = useState("Vanilla");
  const [page, setPage]       = useState(1);
  const [clans, setClans]     = useState<ClanEntry[]>([]);
  const [total, setTotal]     = useState(0);
  const [loading, startLoad]  = useTransition();

  function load(m: string, mo: string, p: number) {
    startLoad(async () => {
      const modeInt = modeToInt(m, mo);
      const res = await getClans({ mode: modeInt, page: p, limit: PER_PAGE });
      setClans(res.clans);
      setTotal(res.total);
    });
  }

  useEffect(() => { load(mode, mods, page); }, [mode, mods, page]);

  function handleMode(m: string, mo: string) {
    setMode(m); setMods(mo); setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const offset = (page - 1) * PER_PAGE;

  return (
    <div className="cl-page">
      <div className="container-main">
        <div className="cl-header">
          <h1 className="cl-title">{t("clans.title")}</h1>
          <ModeSelector mode={mode} mods={mods} onChange={handleMode} />
        </div>

        <div className="cl-table-wrap">
          <table className="cl-table">
            <thead>
              <tr>
                <th className="cl-th cl-th-rank">{t("clans.columns.rank")}</th>
                <th className="cl-th cl-th-name">{t("clans.columns.clan")}</th>
                <th className="cl-th cl-th-owner">{t("clans.columns.owner")}</th>
                <th className="cl-th cl-th-members">{t("clans.columns.members")}</th>
                <th className="cl-th cl-th-pp">{t("clans.columns.totalPp")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="cl-empty">{t("clans.loading")}</td>
                </tr>
              ) : clans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="cl-empty">{t("clans.noClans")}</td>
                </tr>
              ) : (
                clans.map((clan, i) => (
                  <tr key={clan.id} className="cl-row">
                    <td className="cl-td cl-td-rank">{offset + i + 1}</td>
                    <td className="cl-td cl-td-name">
                      <Link href={`/clans/${clan.id}`} className="cl-name-link">
                        <span className="cl-tag">[{clan.tag}]</span>
                        <span className="cl-name">{clan.name}</span>
                      </Link>
                    </td>
                    <td className="cl-td cl-td-owner">
                      <Link href={`/u/${encodeURIComponent(clan.owner_name)}`} className="cl-owner-link">
                        {clan.owner_name}
                      </Link>
                    </td>
                    <td className="cl-td cl-td-members">{clan.member_count}</td>
                    <td className="cl-td cl-td-pp">{addCommas(clan.total_pp)}pp</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="cl-pagination">
            <button
              className="cl-page-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || loading}
            >
              {t("clans.prev")}
            </button>
            <span className="cl-page-info">
              {t("clans.pageOf", { n: page, total: totalPages })}
            </span>
            <button
              className="cl-page-btn"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || loading}
            >
              {t("clans.next")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
