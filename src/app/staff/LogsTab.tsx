"use client";

import { useState, useTransition } from "react";
import { getStaffLogs, type AuditLog } from "./actions";

const ACTION_OPTIONS = [
  "silence", "unsilence", "restrict", "unrestrict", "wipe",
  "reset_hwid", "remove_score", "edit_user", "broadcast_alert",
  "maintenance", "restart",
];

const ACTION_COLOR: Record<string, string> = {
  restrict: "#fca5a5",
  unrestrict: "#6ee7b7",
  silence: "#f6ad55",
  unsilence: "#6ee7b7",
  wipe: "#fca5a5",
  reset_hwid: "#93c5fd",
  remove_score: "#fca5a5",
  edit_user: "#c4b5fd",
  broadcast_alert: "#06b6d4",
  maintenance: "#f6ad55",
  restart: "#fca5a5",
};

function fmtTime(t: string | null): string {
  if (!t) return "—";
  const d = new Date(t);
  return d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function LogsTab() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filterAction, setFilterAction] = useState("");
  const [filterUser, setFilterUser] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  function load(p = page, action = filterAction, uid = filterUser) {
    start(async () => {
      const res = await getStaffLogs(p, action || undefined, uid ? Number(uid) : undefined);
      if (res.error) { setError(res.error); return; }
      setLogs(res.logs ?? []);
      setTotal(res.total ?? 0);
      setLoaded(true);
      setError("");
    });
  }

  function handleFilter(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    load(1, filterAction, filterUser);
  }

  const totalPages = Math.ceil(total / 50);

  return (
    <section className="staff-section">
      <h2 className="staff-section-title">Audit Logs</h2>

      <form onSubmit={handleFilter} style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        <select
          className="sp-select"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          style={{ minWidth: "140px" }}
        >
          <option value="">All actions</option>
          {ACTION_OPTIONS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <input
          className="staff-search-input"
          style={{ flex: "none", width: "160px" }}
          placeholder="User ID"
          type="number"
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
        />
        <button type="submit" className="staff-action-btn staff-action-btn--pink" disabled={pending}>
          {pending ? "Loading..." : loaded ? "Refresh" : "Load Logs"}
        </button>
      </form>

      {error && <div className="staff-error">{error}</div>}

      {!loaded && !pending && (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>
          Click &ldquo;Load Logs&rdquo; to fetch the audit log.
        </div>
      )}

      {loaded && logs.length === 0 && (
        <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.85rem" }}>No logs found.</div>
      )}

      {logs.length > 0 && (
        <>
          <div className="sp-logs-table">
            <div className="sp-logs-header">
              <span>Time</span>
              <span>Actor</span>
              <span>Action</span>
              <span>Target</span>
              <span>Message</span>
            </div>
            {logs.map((l) => (
              <div key={l.id} className="sp-logs-row">
                <span className="sp-logs-time">{fmtTime(l.time)}</span>
                <span className="sp-logs-actor">{l.from_name ?? `#${l.from_id}`}</span>
                <span className="sp-logs-action" style={{ color: ACTION_COLOR[l.action] ?? "rgba(255,255,255,0.7)" }}>
                  {l.action}
                </span>
                <span className="sp-logs-target">{l.to_id ? (l.to_name ?? `#${l.to_id}`) : "—"}</span>
                <span className="sp-logs-msg">{l.msg ?? "—"}</span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.85rem", alignItems: "center" }}>
              <button
                className="staff-action-btn staff-action-btn--gray"
                disabled={page <= 1 || pending}
                onClick={() => { setPage(page - 1); load(page - 1); }}
              >
                ← Prev
              </button>
              <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.45)" }}>
                Page {page} / {totalPages} &middot; {total} entries
              </span>
              <button
                className="staff-action-btn staff-action-btn--gray"
                disabled={page >= totalPages || pending}
                onClick={() => { setPage(page + 1); load(page + 1); }}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
