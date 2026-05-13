"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import {
  broadcastAlert, toggleMaintenance, getMaintenanceStatus, restartServer, getActivityStats,
} from "./actions";

type MetricPoint = { t: number; cpu: number; ram: number; apiMs: number; webMs: number };

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="sp-chart-card">
      <div className="sp-chart-title">{title}</div>
      {children}
    </div>
  );
}

export default function ServerTab({ isDev }: { isDev: boolean }) {
  const [metrics, setMetrics] = useState<MetricPoint[]>([]);
  const [currentMem, setCurrentMem] = useState({ used: 0, total: 0 });
  const [activity, setActivity] = useState<{ hour: string; count: number }[]>([]);
  const [maintenance, setMaintenance] = useState(false);
  const [maintenancePending, startMaintenance] = useTransition();
  const [alertMsg, setAlertMsg] = useState("");
  const [alertStatus, setAlertStatus] = useState<string | null>(null);
  const [alertPending, startAlert] = useTransition();
  const [restartConfirm, setRestartConfirm] = useState(false);
  const [restartPending, startRestart] = useTransition();
  const [restartStatus, setRestartStatus] = useState<string | null>(null);
  const metricsRef = useRef<MetricPoint[]>([]);

  useEffect(() => {
    getMaintenanceStatus().then((r) => setMaintenance(r.maintenance ?? false));
    getActivityStats().then((r) => setActivity(r.hourly ?? []));

    async function poll() {
      try {
        const res = await fetch("/api/metrics");
        const data = await res.json();
        const point: MetricPoint = {
          t: Date.now(),
          cpu: data.cpu,
          ram: data.ram.used,
          apiMs: data.latency.api < 0 ? 0 : data.latency.api,
          webMs: data.latency.web < 0 ? 0 : data.latency.web,
        };
        setCurrentMem(data.ram);
        metricsRef.current = [...metricsRef.current.slice(-59), point];
        setMetrics([...metricsRef.current]);
      } catch {}
    }

    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, []);

  function handleToggleMaintenance() {
    startMaintenance(async () => {
      await toggleMaintenance(!maintenance);
      setMaintenance((v) => !v);
    });
  }

  function handleAlert(e: React.FormEvent) {
    e.preventDefault();
    if (!alertMsg.trim()) return;
    startAlert(async () => {
      const res = await broadcastAlert(alertMsg.trim());
      if (res.error) { setAlertStatus(`Error: ${res.error}`); return; }
      setAlertStatus(`Sent to ${res.sent_to} player(s).`);
      setAlertMsg("");
    });
  }

  function handleRestart() {
    startRestart(async () => {
      const res = await restartServer();
      if (res.error) { setRestartStatus(`Error: ${res.error}`); return; }
      setRestartStatus("Restart initiated.");
      setRestartConfirm(false);
    });
  }

  const latestCpu = metrics[metrics.length - 1]?.cpu ?? 0;
  const cpuColor = latestCpu > 80 ? "#fca5a5" : latestCpu > 50 ? "#f6ad55" : "#06b6d4";
  const ramPct = currentMem.total > 0 ? Math.round((currentMem.used / currentMem.total) * 100) : 0;
  const ramColor = ramPct > 85 ? "#fca5a5" : ramPct > 65 ? "#f6ad55" : "#3b82f6";

  const fmtHour = (h: string) => h.slice(11, 16);

  return (
    <div className="sp-server-tab">
      {/* ── Stat strip ─────────────────────────────── */}
      <div className="sp-stat-strip">
        <div className="sp-stat-chip">
          <span className="sp-stat-label">CPU</span>
          <span className="sp-stat-value" style={{ color: cpuColor }}>{latestCpu.toFixed(1)}%</span>
        </div>
        <div className="sp-stat-chip">
          <span className="sp-stat-label">RAM</span>
          <span className="sp-stat-value" style={{ color: ramColor }}>{currentMem.used} MB</span>
          <span className="sp-stat-sub">/ {currentMem.total} MB ({ramPct}%)</span>
        </div>
        <div className="sp-stat-chip">
          <span className="sp-stat-label">API Ping</span>
          <span className="sp-stat-value" style={{ color: "#06b6d4" }}>
            {metrics[metrics.length - 1]?.apiMs ?? "—"}ms
          </span>
        </div>
        <div className="sp-stat-chip">
          <span className="sp-stat-label">Web Ping</span>
          <span className="sp-stat-value" style={{ color: "#3b82f6" }}>
            {metrics[metrics.length - 1]?.webMs ?? "—"}ms
          </span>
        </div>
        <div className="sp-stat-chip" style={{ borderColor: maintenance ? "rgba(246,173,85,0.4)" : undefined }}>
          <span className="sp-stat-label">Maintenance</span>
          <span className="sp-stat-value" style={{ color: maintenance ? "#f6ad55" : "#6ee7b7" }}>
            {maintenance ? "ON" : "OFF"}
          </span>
        </div>
      </div>

      {/* ── Charts row ─────────────────────────────── */}
      <div className="sp-charts-grid">
        <ChartCard title="CPU Usage (%)">
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" hide />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} width={28} />
              <Tooltip
                contentStyle={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 11 }}
                formatter={(v) => [`${Number(v).toFixed(1)}%`, "CPU"]}
                labelFormatter={() => ""}
              />
              <Area type="monotone" dataKey="cpu" stroke="#06b6d4" fill="url(#cpuGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title={`RAM Usage (${ramPct}% · ${currentMem.used}/${currentMem.total} MB)`}>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" hide />
              <YAxis domain={[0, currentMem.total || 8192]} tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} width={36} />
              <Tooltip
                contentStyle={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 11 }}
                formatter={(v) => [`${Number(v)} MB`, "RAM"]}
                labelFormatter={() => ""}
              />
              <Area type="monotone" dataKey="ram" stroke="#3b82f6" fill="url(#ramGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Latency (ms)">
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={metrics}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="t" hide />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} width={32} />
              <Tooltip
                contentStyle={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 11 }}
                formatter={(v, name) => [`${Number(v)}ms`, name === "apiMs" ? "API" : "Website"]}
                labelFormatter={() => ""}
              />
              <Line type="monotone" dataKey="apiMs" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="apiMs" />
              <Line type="monotone" dataKey="webMs" stroke="#3b82f6" strokeWidth={1.5} dot={false} name="webMs" />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: "1rem", marginTop: "0.3rem", fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
            <span style={{ color: "#06b6d4" }}>■ API</span>
            <span style={{ color: "#3b82f6" }}>■ Website</span>
          </div>
        </ChartCard>

        <ChartCard title="Scores Submitted (last 24h)">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={activity}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="hour" tickFormatter={fmtHour} tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} interval={3} />
              <YAxis tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }} width={28} />
              <Tooltip
                contentStyle={{ background: "#0f1117", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, fontSize: 11 }}
                formatter={(v) => [Number(v), "Scores"]}
                labelFormatter={(h) => fmtHour(String(h))}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Management controls ────────────────────── */}
      {isDev && (
        <section className="staff-section" style={{ marginTop: "1.25rem" }}>
          <h2 className="staff-section-title">Server Management</h2>
          <div className="sp-mgmt-grid">

            {/* In-game alert */}
            <div className="sp-mgmt-card">
              <div className="sp-mgmt-card-title">In-Game Alert</div>
              <form onSubmit={handleAlert} style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <textarea
                  className="sp-mgmt-textarea"
                  placeholder="Message to broadcast to all online players..."
                  value={alertMsg}
                  onChange={(e) => setAlertMsg(e.target.value)}
                  rows={3}
                />
                <button type="submit" className="staff-action-btn staff-action-btn--pink" disabled={alertPending || !alertMsg.trim()}>
                  {alertPending ? "Sending..." : "Send Alert"}
                </button>
                {alertStatus && (
                  <div style={{ fontSize: "0.8rem", color: alertStatus.startsWith("Error") ? "#fca5a5" : "#6ee7b7" }}>
                    {alertStatus}
                  </div>
                )}
              </form>
            </div>

            {/* Maintenance mode */}
            <div className="sp-mgmt-card">
              <div className="sp-mgmt-card-title">Maintenance Mode</div>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.75rem" }}>
                When enabled, non-developer logins are rejected with a maintenance message.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div
                  className={`sp-toggle${maintenance ? " sp-toggle--on" : ""}`}
                  onClick={!maintenancePending ? handleToggleMaintenance : undefined}
                  role="button"
                  aria-pressed={maintenance}
                >
                  <div className="sp-toggle-thumb" />
                </div>
                <span style={{ fontSize: "0.85rem", color: maintenance ? "#f6ad55" : "rgba(255,255,255,0.45)" }}>
                  {maintenance ? "Maintenance ON" : "Maintenance OFF"}
                </span>
              </div>
            </div>

            {/* Restart server */}
            <div className="sp-mgmt-card">
              <div className="sp-mgmt-card-title">Restart Server</div>
              <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.45)", marginBottom: "0.75rem" }}>
                Restarts the <code style={{ color: "#06b6d4" }}>pawtoka-bancho-1</code> Docker container.
                All players will be disconnected.
              </p>
              {!restartConfirm ? (
                <button className="staff-action-btn staff-action-btn--red" onClick={() => setRestartConfirm(true)}>
                  Restart Server
                </button>
              ) : (
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  <span style={{ fontSize: "0.82rem", color: "#fca5a5" }}>Are you sure?</span>
                  <button className="staff-action-btn staff-action-btn--red" onClick={handleRestart} disabled={restartPending}>
                    {restartPending ? "Restarting..." : "Yes, Restart"}
                  </button>
                  <button className="staff-action-btn staff-action-btn--gray" onClick={() => setRestartConfirm(false)}>
                    Cancel
                  </button>
                </div>
              )}
              {restartStatus && (
                <div style={{ fontSize: "0.8rem", color: restartStatus.startsWith("Error") ? "#fca5a5" : "#6ee7b7", marginTop: "0.5rem" }}>
                  {restartStatus}
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
