"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useT } from "@/i18n";

interface Contributor {
  id: string;
  name: string;
  role: string;
  description: string;
  osu_id: string;
  avatar_url: string;
  banner_url: string;
  github: string;
  border_style: "" | "rainbow" | "gold" | "color";
  border_color1: string;
  border_color2: string;
  added_at: string;
}

const EMPTY_FORM = {
  name: "",
  role: "",
  description: "",
  osu_id: "",
  avatar_url: "",
  banner_url: "",
  github: "",
  border_style: "",
  border_color1: "#d55b9e",
  border_color2: "",
};

function frameStyle(c: Contributor): React.CSSProperties {
  if (c.border_style === "color") {
    const bg = c.border_color2
      ? `linear-gradient(135deg, ${c.border_color1}, ${c.border_color2})`
      : c.border_color1;
    return { background: bg };
  }
  return {};
}

function ContribCard({ c, isOwner, onDelete }: {
  c: Contributor;
  isOwner: boolean;
  onDelete: (id: string) => void;
}) {
  const t = useT();
  const [bannerFailed, setBannerFailed] = useState(false);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  // Server assets are primary; custom URLs are fallbacks used only on error
  const bannerPrimary = c.osu_id ? `/api/banner/${c.osu_id}` : null;
  const bannerFallback = c.banner_url || null;
  const bannerSrc = !bannerFailed
    ? (bannerPrimary ?? bannerFallback)
    : bannerFallback;

  const avatarPrimary = c.osu_id ? `http://a.pawinput.xyz/${c.osu_id}` : null;
  const avatarFallback = c.avatar_url || null;
  const avatarSrc = !avatarFailed
    ? (avatarPrimary ?? avatarFallback)
    : avatarFallback;

  function handleBannerError() {
    if (!bannerFailed) setBannerFailed(true);
  }
  function handleAvatarError() {
    if (!avatarFailed) setAvatarFailed(true);
  }

  const nameEl = c.osu_id ? (
    <Link href={`/u/${c.osu_id}`} className="contrib-card-name-link">{c.name}</Link>
  ) : (
    <span className="contrib-card-name-text">{c.name}</span>
  );

  const frameClass = c.border_style
    ? `contrib-frame contrib-frame--${c.border_style}`
    : "contrib-frame contrib-frame--none";

  return (
    <div className={frameClass} style={frameStyle(c)}>
    <div className="contrib-card">
      {/* Banner */}
      <div className="contrib-card-banner">
        {bannerSrc && !(bannerFailed && !bannerFallback) ? (
          <img
            src={bannerSrc}
            alt=""
            className="contrib-card-banner-img"
            onError={handleBannerError}
          />
        ) : (
          <div className="contrib-card-banner-fallback" />
        )}

        {/* Admin delete button */}
        {isOwner && (
          <div className="contrib-card-del-wrap">
            {confirmDel ? (
              <>
                <button className="contrib-del-confirm" onClick={() => onDelete(c.id)}>
                  {t("contributors.admin.confirmDelete")}
                </button>
                <button className="contrib-del-cancel" onClick={() => setConfirmDel(false)}>
                  {t("contributors.admin.cancelDelete")}
                </button>
              </>
            ) : (
              <button className="contrib-del-btn" onClick={() => setConfirmDel(true)} title="Remove">✕</button>
            )}
          </div>
        )}
      </div>

      {/* Avatar — sibling of banner so it's above the card-body background */}
      {avatarSrc && (
        <img
          src={avatarSrc}
          alt={c.name}
          className="contrib-card-avatar"
          onError={handleAvatarError}
        />
      )}

      {/* Info */}
      <div className="contrib-card-body" style={avatarSrc ? { paddingTop: "2.25rem", paddingLeft: "5rem" } : undefined}>
        <div className="contrib-card-name">{nameEl}</div>
        <div className="contrib-card-role">{c.role}</div>
        {c.description && <p className="contrib-card-desc">{c.description}</p>}
        {c.github && (
          <a
            href={`https://github.com/${c.github}`}
            target="_blank"
            rel="noopener noreferrer"
            className="contrib-card-github"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            {c.github}
          </a>
        )}
      </div>
    </div>
    </div>
  );
}

export default function ContributorsPage() {
  const t = useT();
  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwner, setIsOwner] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/me")
      .then((r) => r.json())
      .then((d) => setIsOwner(d?.name?.toLowerCase() === "transwaste"));
  }, []);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/contributors");
    setContributors(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (panelOpen) setTimeout(() => firstInputRef.current?.focus(), 60);
  }, [panelOpen]);

  function handleField(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.role.trim()) return;
    setSubmitting(true);
    const res = await fetch("/api/contributors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setMsg({ text: t("contributors.admin.added"), ok: true });
      setForm(EMPTY_FORM);
      setPanelOpen(false);
      await load();
    } else {
      const d = await res.json();
      setMsg({ text: d.error ?? t("contributors.admin.error"), ok: false });
    }
    setSubmitting(false);
    setTimeout(() => setMsg(null), 4000);
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/contributors?id=${id}`, { method: "DELETE" });
    if (res.ok) await load();
  }

  return (
    <div className="contrib-page">

      {/* ── Page header ── */}
      <div className="contrib-hero">
        <div className="contrib-hero-bg" />
        <div className="container-main contrib-hero-inner">
          <h1 className="contrib-title">{t("contributors.title")}</h1>
          <p className="contrib-subtitle">{t("contributors.subtitle")}</p>

          {isOwner && (
            <button
              className="contrib-add-btn"
              onClick={() => setPanelOpen((v) => !v)}
            >
              {panelOpen ? t("contributors.admin.close") : t("contributors.admin.open")}
            </button>
          )}
        </div>
      </div>

      {/* ── Admin panel ── */}
      {isOwner && panelOpen && (
        <div className="contrib-admin-panel">
          <div className="container-main">
            <div className="contrib-admin-card">
              <h2 className="contrib-admin-title">{t("contributors.admin.title")}</h2>
              <form onSubmit={handleAdd} className="contrib-admin-form">
                <div className="contrib-form-grid">
                  <div className="contrib-field">
                    <label>{t("contributors.admin.fields.name")} <span className="contrib-required">*</span></label>
                    <input
                      ref={firstInputRef}
                      name="name"
                      value={form.name}
                      onChange={handleField}
                      placeholder="e.g. Alice"
                      required
                    />
                  </div>
                  <div className="contrib-field">
                    <label>{t("contributors.admin.fields.role")} <span className="contrib-required">*</span></label>
                    <input
                      name="role"
                      value={form.role}
                      onChange={handleField}
                      placeholder="e.g. Translator — French"
                      required
                    />
                  </div>
                  <div className="contrib-field">
                    <label>{t("contributors.admin.fields.osuId")}</label>
                    <input
                      name="osu_id"
                      value={form.osu_id}
                      onChange={handleField}
                      placeholder="osu! user ID (avatar + banner)"
                    />
                  </div>
                  <div className="contrib-field">
                    <label>{t("contributors.admin.fields.github")}</label>
                    <input
                      name="github"
                      value={form.github}
                      onChange={handleField}
                      placeholder="GitHub username"
                    />
                  </div>
                  <div className="contrib-field contrib-field--full">
                    <label>{t("contributors.admin.fields.bannerUrl")}</label>
                    <input
                      name="banner_url"
                      value={form.banner_url}
                      onChange={handleField}
                      placeholder="https://... (overrides profile banner)"
                    />
                  </div>
                  <div className="contrib-field contrib-field--full">
                    <label>{t("contributors.admin.fields.avatarUrl")}</label>
                    <input
                      name="avatar_url"
                      value={form.avatar_url}
                      onChange={handleField}
                      placeholder="https://... (overrides osu! avatar)"
                    />
                  </div>
                  <div className="contrib-field contrib-field--full">
                    <label>{t("contributors.admin.fields.description")}</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleField}
                      placeholder={t("contributors.admin.fields.descriptionPlaceholder")}
                      rows={3}
                    />
                  </div>

                  {/* Border style */}
                  <div className="contrib-field contrib-field--full">
                    <label>{t("contributors.admin.fields.borderStyle")}</label>
                    <div className="contrib-border-row">
                      {(["", "rainbow", "gold", "color"] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          className={`contrib-border-opt${form.border_style === s ? " contrib-border-opt--active" : ""} contrib-border-opt--${s || "none"}`}
                          onClick={() => setForm((f) => ({ ...f, border_style: s }))}
                        >
                          {s === "" ? "None" : s === "rainbow" ? "🌈 Rainbow" : s === "gold" ? "✨ Gold" : "🎨 Color"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {form.border_style === "color" && (
                    <>
                      <div className="contrib-field">
                        <label>{t("contributors.admin.fields.borderColor1")}</label>
                        <div className="contrib-color-row">
                          <input type="color" name="border_color1" value={form.border_color1} onChange={handleField} className="contrib-color-swatch" />
                          <input type="text" name="border_color1" value={form.border_color1} onChange={handleField} placeholder="#d55b9e" className="contrib-color-text" />
                        </div>
                      </div>
                      <div className="contrib-field">
                        <label>{t("contributors.admin.fields.borderColor2")} <span style={{ color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>(optional — makes gradient)</span></label>
                        <div className="contrib-color-row">
                          <input type="color" name="border_color2" value={form.border_color2 || "#000000"} onChange={handleField} className="contrib-color-swatch" />
                          <input type="text" name="border_color2" value={form.border_color2} onChange={handleField} placeholder="leave empty for solid" className="contrib-color-text" />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="contrib-admin-actions">
                  <button type="submit" className="contrib-submit-btn" disabled={submitting}>
                    {submitting ? t("contributors.admin.adding") : t("contributors.admin.add")}
                  </button>
                  {msg && (
                    <span className="contrib-msg" style={{ color: msg.ok ? "#68d391" : "#fc8181" }}>
                      {msg.text}
                    </span>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Contributor grid ── */}
      <div className="container-main contrib-body">
        {loading ? (
          <div className="contrib-empty">{t("common.loading")}</div>
        ) : contributors.length === 0 ? (
          <div className="contrib-empty">{t("contributors.noContributors")}</div>
        ) : (
          <div className="contrib-grid">
            {contributors.map((c) => (
              <ContribCard key={c.id} c={c} isOwner={isOwner} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
