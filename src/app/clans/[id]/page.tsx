"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import Flag from "@/components/Flag";
import { useParams } from "next/navigation";
import { getClan, type ClanDetail, type ClanMember } from "@/lib/api";
import { addCommas, modeToInt, formatDate } from "@/lib/utils";
import ModeSelector from "@/components/ModeSelector";
import { uploadClanAvatar, updateClan, invitePlayer, kickMember } from "./actions";

const PRIV_LABEL: Record<number, string> = { 1: "Member", 2: "Officer", 3: "Owner" };

function parseBBCode(raw: string): string {
  let s = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  s = s.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, "<strong>$1</strong>");
  s = s.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, "<em>$1</em>");
  s = s.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, "<u>$1</u>");
  s = s.replace(/\[s\]([\s\S]*?)\[\/s\]/gi, "<s>$1</s>");
  s = s.replace(/\[color=(#[0-9a-fA-F]{3,8}|[a-zA-Z]+)\]([\s\S]*?)\[\/color\]/gi,
    (_, c, t) => `<span style="color:${c}">${t}</span>`);
  s = s.replace(/\[size=(\d+)\]([\s\S]*?)\[\/size\]/gi, (_, n, t) => {
    const px = Math.min(Math.max(parseInt(n), 8), 48);
    return `<span style="font-size:${px}px;line-height:1.4">${t}</span>`;
  });
  s = s.replace(/\[center\]([\s\S]*?)\[\/center\]/gi, "<div style=\"text-align:center\">$1</div>");
  s = s.replace(/\[left\]([\s\S]*?)\[\/left\]/gi,   "<div style=\"text-align:left\">$1</div>");
  s = s.replace(/\[right\]([\s\S]*?)\[\/right\]/gi,  "<div style=\"text-align:right\">$1</div>");
  s = s.replace(/\[url=((https?:\/\/)[^\]]+)\]([\s\S]*?)\[\/url\]/gi,
    (_, href, __, label) => `<a href="${href}" target="_blank" rel="noopener noreferrer" class="bbcode-link">${label}</a>`);
  s = s.replace(/\[url\]((https?:\/\/)[^\[]+)\[\/url\]/gi,
    (_, href) => `<a href="${href}" target="_blank" rel="noopener noreferrer" class="bbcode-link">${href}</a>`);
  s = s.replace(/\[img\]((https?:\/\/)[^\[]+)\[\/img\]/gi,
    (_, src) => `<img src="${src}" style="max-width:100%;border-radius:6px" loading="lazy" />`);
  s = s.replace(/\[quote(?:=[^\]]+)?\]([\s\S]*?)\[\/quote\]/gi,
    "<blockquote class=\"bbcode-quote\">$1</blockquote>");
  s = s.replace(/\[code\]([\s\S]*?)\[\/code\]/gi,
    "<pre class=\"bbcode-code\">$1</pre>");
  s = s.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi,
    "<details class=\"bbcode-spoiler\"><summary>Spoiler</summary><div>$1</div></details>");
  s = s.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_, body) => {
    const items = body.split(/\[\*\]/).filter((t: string) => t.trim());
    return "<ul class=\"bbcode-list\">" + items.map((t: string) => `<li>${t.trim()}</li>`).join("") + "</ul>";
  });
  s = s.replace(/\n/g, "<br />");
  return s;
}

function BBCodeRenderer({ text }: { text: string }) {
  return (
    <div
      className="bbcode-render"
      dangerouslySetInnerHTML={{ __html: parseBBCode(text) }}
    />
  );
}

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return <div className="cd-msg" style={{ color: msg.ok ? "#68d391" : "#fc8181" }}>{msg.text}</div>;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="cd-rank-badge cd-rank-badge--gold">#1</span>;
  if (rank === 2) return <span className="cd-rank-badge cd-rank-badge--silver">#2</span>;
  if (rank === 3) return <span className="cd-rank-badge cd-rank-badge--bronze">#3</span>;
  return <span className="cd-rank-badge">#{rank}</span>;
}

export default function ClanPage() {
  const { id } = useParams<{ id: string }>();
  const clanId = parseInt(id, 10);

  const [clan, setClan]         = useState<ClanDetail | null>(null);
  const [members, setMembers]   = useState<ClanMember[]>([]);
  const [mode, setMode]         = useState("osu!");
  const [mods, setMods]         = useState("Vanilla");
  const [notFound, setNotFound] = useState(false);
  const [, startLoad]           = useTransition();
  const [meId, setMeId]         = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"info" | "leaderboard">("info");

  // About / description BBCode editor
  const [aboutEditOpen, setAboutEditOpen] = useState(false);
  const [aboutDraft, setAboutDraft]       = useState("");
  const [aboutTab, setAboutTab]           = useState<"write" | "preview">("write");
  const [aboutMsg, setAboutMsg]           = useState<{ text: string; ok: boolean } | null>(null);
  const [, startAbout]                    = useTransition();

  // Avatar
  const [avatarKey, setAvatarKey]   = useState(0);
  const [avatarMsg, setAvatarMsg]   = useState<{ text: string; ok: boolean } | null>(null);
  const [, startUpload]             = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  // Edit panel
  const [editOpen, setEditOpen]     = useState(false);
  const [editName, setEditName]     = useState("");
  const [editDesc, setEditDesc]     = useState("");
  const [editMsg, setEditMsg]       = useState<{ text: string; ok: boolean } | null>(null);
  const [, startEdit]               = useTransition();

  // Invite
  const [inviteTarget, setInvite]   = useState("");
  const [inviteMsg, setInviteMsg]   = useState<{ text: string; ok: boolean } | null>(null);
  const [, startInvite]             = useTransition();

  // Kick confirm
  const [kickConfirm, setKickConfirm] = useState<number | null>(null);
  const [kickMsg, setKickMsg]         = useState<{ text: string; ok: boolean } | null>(null);
  const [, startKick]                 = useTransition();

  function load(m: string, mo: string) {
    startLoad(async () => {
      const modeInt = modeToInt(m, mo);
      const res = await getClan(clanId, modeInt);
      if (!res) { setNotFound(true); return; }
      setClan(res.clan);
      setMembers(res.members);
    });
  }

  useEffect(() => { load(mode, mods); }, [mode, mods]);

  useEffect(() => {
    fetch("/api/me").then((r) => r.json()).then((me) => { if (me?.id) setMeId(me.id); });
  }, []);

  useEffect(() => {
    if (clan && editName === "" && editDesc === "") {
      setEditName(clan.name);
      setEditDesc(clan.description ?? "");
    }
    if (clan && aboutDraft === "") {
      setAboutDraft(clan.description ?? "");
    }
  }, [clan]);

  function handleAboutSave() {
    startAbout(async () => {
      const res = await updateClan(clanId, clan?.name ?? editName, aboutDraft);
      setAboutMsg({ text: res.error ?? "Saved!", ok: !res.error });
      if (!res.error) { setAboutEditOpen(false); load(mode, mods); }
      setTimeout(() => setAboutMsg(null), 3000);
    });
  }

  const isOwner = !!(clan && meId === clan.owner_id);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const fd = new FormData();
    fd.append("avatar", e.target.files[0]);
    startUpload(async () => {
      const res = await uploadClanAvatar(clanId, fd);
      setAvatarMsg({ text: res.error ?? "Avatar updated!", ok: !res.error });
      if (!res.error) setAvatarKey((k) => k + 1);
      setTimeout(() => setAvatarMsg(null), 3000);
    });
  }

  function handleEditSave() {
    startEdit(async () => {
      const res = await updateClan(clanId, editName, editDesc);
      setEditMsg({ text: res.error ?? "Saved!", ok: !res.error });
      if (!res.error) { load(mode, mods); setEditOpen(false); }
      setTimeout(() => setEditMsg(null), 3000);
    });
  }

  function handleInvite() {
    if (!inviteTarget.trim()) return;
    startInvite(async () => {
      const res = await invitePlayer(clanId, inviteTarget.trim());
      setInviteMsg({ text: res.error ?? `Invited ${res.invited}!`, ok: !res.error });
      if (!res.error) setInvite("");
      setTimeout(() => setInviteMsg(null), 4000);
    });
  }

  function handleKick(targetId: number) {
    startKick(async () => {
      const res = await kickMember(clanId, targetId);
      setKickMsg({ text: res.error ?? "Member kicked.", ok: !res.error });
      setKickConfirm(null);
      if (!res.error) load(mode, mods);
      setTimeout(() => setKickMsg(null), 3000);
    });
  }

  if (notFound) {
    return (
      <div className="cd-page">
        <div className="cd-notfound">Clan not found.</div>
      </div>
    );
  }

  const topPP = members.length > 0 ? members[0].pp : 0;

  return (
    <div className="cd-page">

      {/* ── Banner ── */}
      <div className="cd-banner">
        <div
          className="cd-banner__bg"
          style={{ backgroundImage: `url(/api/clan-avatar/${clanId}?key=${avatarKey})` }}
        />
        <div className="cd-banner__overlay" />

        <div className="cd-banner__body">
          <div className="cd-banner__avatar-wrap">
            <Image
              key={avatarKey}
              src={`/api/clan-avatar/${clanId}`}
              alt="clan avatar"
              width={88}
              height={88}
              className="cd-banner__avatar"
              unoptimized
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.15"; }}
            />
            {isOwner && (
              <>
                <input ref={fileRef} type="file" name="avatar" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                <button type="button" className="cd-banner__avatar-btn" onClick={() => fileRef.current?.click()} title="Change avatar">✎</button>
              </>
            )}
          </div>

          <div className="cd-banner__info">
            {clan ? (
              <>
                <div className="cd-banner__title">
                  <span className="cd-banner__tag">[{clan.tag}]</span>
                  <span className="cd-banner__name">{clan.name}</span>
                  {isOwner && (
                    <button className="cd-banner__edit-btn" onClick={() => setEditOpen((v) => !v)}>Edit</button>
                  )}
                </div>
                <div className="cd-banner__meta">
                  <span>by <Link href={`/u/${clan.owner_id}`} className="cd-banner__owner">{clan.owner_name}</Link></span>
                  <span className="cd-banner__sep">·</span>
                  <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
                  {clan.created_at && (
                    <>
                      <span className="cd-banner__sep">·</span>
                      <span>est. {formatDate(new Date(clan.created_at).getTime() / 1000)}</span>
                    </>
                  )}
                </div>
              </>
            ) : (
              <div className="cd-loading">Loading...</div>
            )}
          </div>

          <div className="cd-banner__mode">
            <ModeSelector mode={mode} mods={mods} onChange={(m, mo) => { setMode(m); setMods(mo); }} />
          </div>
        </div>

        {/* Tab nav */}
        <div className="cd-banner__tabs">
          <button
            className={`cd-tab ${activeTab === "info" ? "cd-tab--active" : ""}`}
            onClick={() => setActiveTab("info")}
          >
            info
          </button>
          <button
            className={`cd-tab ${activeTab === "leaderboard" ? "cd-tab--active" : ""}`}
            onClick={() => setActiveTab("leaderboard")}
          >
            leaderboard
          </button>
        </div>
      </div>

      {/* ── Avatar message ── */}
      {avatarMsg && (
        <div className="cd-page-msg" style={{ color: avatarMsg.ok ? "#68d391" : "#fc8181" }}>
          {avatarMsg.text}
        </div>
      )}

      {/* ── Content ── */}
      <div className="cd-content">

        {activeTab === "info" && (
          <div className="cd-info-layout">

            {/* Left: key-value card */}
            <div className="cd-info-card">
              <div className="cd-info-entries">
                <div className="cd-info-entry">
                  <span className="cd-info-label">Owner</span>
                  <span className="cd-info-value">
                    <Link href={`/u/${clan?.owner_id}`} className="cd-banner__owner">{clan?.owner_name ?? "—"}</Link>
                  </span>
                </div>
                <div className="cd-info-entry">
                  <span className="cd-info-label">Members</span>
                  <span className="cd-info-value cd-info-value--large">{members.length}</span>
                </div>
                <div className="cd-info-entry">
                  <span className="cd-info-label">Top PP</span>
                  <span className="cd-info-value cd-info-value--pp">{addCommas(topPP)}pp</span>
                </div>
                {clan?.created_at && (
                  <div className="cd-info-entry">
                    <span className="cd-info-label">Founded</span>
                    <span className="cd-info-value">{formatDate(new Date(clan.created_at).getTime() / 1000)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: description + owner controls */}
            <div className="cd-info-right">

              {/* About / BBCode panel */}
              <div className="cd-about">
                <div className="cd-about__header">
                  <span className="cd-section-title" style={{ marginBottom: 0 }}>About</span>
                  {isOwner && !aboutEditOpen && (
                    <button
                      className="cd-about__edit-btn"
                      onClick={() => { setAboutDraft(clan?.description ?? ""); setAboutEditOpen(true); setAboutTab("write"); }}
                    >
                      {clan?.description ? "Edit" : "+ Add description"}
                    </button>
                  )}
                </div>

                {aboutEditOpen ? (
                  <div className="cd-about__editor">
                    <div className="cd-editor-tabs">
                      <button
                        className={`cd-editor-tab ${aboutTab === "write" ? "cd-editor-tab--active" : ""}`}
                        onClick={() => setAboutTab("write")}
                      >Write</button>
                      <button
                        className={`cd-editor-tab ${aboutTab === "preview" ? "cd-editor-tab--active" : ""}`}
                        onClick={() => setAboutTab("preview")}
                      >Preview</button>
                      <a
                        href="https://osu.ppy.sh/wiki/en/BBCode"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cd-bbcode-help"
                      >BBCode reference ↗</a>
                    </div>

                    {aboutTab === "write" ? (
                      <textarea
                        className="cd-about__textarea"
                        value={aboutDraft}
                        onChange={(e) => setAboutDraft(e.target.value)}
                        maxLength={2000}
                        rows={12}
                        placeholder="Write your clan description using BBCode...&#10;&#10;[b]bold[/b]  [i]italic[/i]  [color=#d55b9e]colored[/color]  [size=20]big[/size]&#10;[url=https://example.com]link[/url]  [img]https://...[/img]"
                        spellCheck={false}
                      />
                    ) : (
                      <div className="cd-about__preview">
                        {aboutDraft.trim()
                          ? <BBCodeRenderer text={aboutDraft} />
                          : <span className="cd-about__empty">Nothing to preview yet.</span>}
                      </div>
                    )}

                    <div className="cd-edit-actions" style={{ marginTop: "0.6rem" }}>
                      <button className="cd-save-btn" onClick={handleAboutSave}>Save</button>
                      <button className="cd-cancel-btn" onClick={() => setAboutEditOpen(false)}>Cancel</button>
                      <span className="cd-char-count">{aboutDraft.length}/2000</span>
                    </div>
                    <Msg msg={aboutMsg} />
                  </div>
                ) : (
                  clan?.description
                    ? <BBCodeRenderer text={clan.description} />
                    : <p className="cd-about__empty">{isOwner ? "No description yet. Click \"+ Add description\" to write one." : "No description provided."}</p>
                )}
              </div>

              {/* Owner management */}
              {isOwner && (
                <>
                  {editOpen && (
                    <div className="cd-edit-panel">
                      <div className="cd-edit-title">Edit Clan Name</div>
                      <div className="cd-edit-row">
                        <label className="cd-edit-label">Name</label>
                        <input className="cd-edit-input" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={16} />
                      </div>
                      <div className="cd-edit-actions">
                        <button className="cd-save-btn" onClick={handleEditSave}>Save</button>
                        <button className="cd-cancel-btn" onClick={() => setEditOpen(false)}>Cancel</button>
                      </div>
                      <Msg msg={editMsg} />
                    </div>
                  )}

                  <div className="cd-invite-panel">
                    <div className="cd-edit-title">Invite Player</div>
                    <div className="cd-invite-row">
                      <input
                        className="cd-edit-input"
                        placeholder="Username or ID"
                        value={inviteTarget}
                        onChange={(e) => setInvite(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") handleInvite(); }}
                      />
                      <button className="cd-invite-btn" onClick={handleInvite}>Invite</button>
                    </div>
                    <Msg msg={inviteMsg} />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === "leaderboard" && (
          <div className="cd-lb-wrap">
            {kickMsg && <Msg msg={kickMsg} />}
            <table className="cd-table">
              <thead>
                <tr>
                  <th className="cd-th cd-th-rank">#</th>
                  <th className="cd-th">Player</th>
                  <th className="cd-th cd-th-role">Role</th>
                  <th className="cd-th cd-th-pp">Performance</th>
                  <th className="cd-th cd-th-acc">Accuracy</th>
                  <th className="cd-th cd-th-plays">Plays</th>
                  {isOwner && <th className="cd-th cd-th-kick" />}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={isOwner ? 7 : 6} className="cd-empty">No members found.</td></tr>
                ) : (
                  members.map((m, i) => (
                    <tr key={m.id} className="cd-row">
                      <td className="cd-td cd-td-rank">
                        <RankBadge rank={i + 1} />
                      </td>
                      <td className="cd-td">
                        <div className="cd-player-cell">
                          <Image src={`http://a.pawinput.xyz/${m.id}`} alt="" width={36} height={36} className="cd-member-avatar" unoptimized />
                          <div>
                            <Link href={`/u/${m.id}`} className="cd-member-link">{m.name}</Link>
                            <div className="cd-member-country">
                              <Flag country={m.country} />
                              <span>{m.country.toUpperCase()}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="cd-td cd-td-role">
                        <span className={`cd-role cd-role--${(PRIV_LABEL[m.clan_priv] ?? "member").toLowerCase()}`}>
                          {PRIV_LABEL[m.clan_priv] ?? "Member"}
                        </span>
                      </td>
                      <td className="cd-td cd-td-pp">{addCommas(m.pp)}<span className="cd-pp-unit">pp</span></td>
                      <td className="cd-td cd-td-acc">{m.acc.toFixed(2)}%</td>
                      <td className="cd-td cd-td-plays">{addCommas(m.plays)}</td>
                      {isOwner && (
                        <td className="cd-td cd-td-kick">
                          {m.id !== meId && (
                            kickConfirm === m.id ? (
                              <span className="cd-kick-confirm">
                                <button className="cd-kick-yes" onClick={() => handleKick(m.id)}>Kick</button>
                                <button className="cd-kick-no" onClick={() => setKickConfirm(null)}>No</button>
                              </span>
                            ) : (
                              <button className="cd-kick-btn" onClick={() => setKickConfirm(m.id)}>✕</button>
                            )
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
