"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { getClan, type ClanDetail, type ClanMember } from "@/lib/api";
import { addCommas, modeToInt, formatDate } from "@/lib/utils";
import ModeSelector from "@/components/ModeSelector";
import { uploadClanAvatar, updateClan, invitePlayer, kickMember } from "./actions";

const PRIV_LABEL: Record<number, string> = { 1: "Member", 2: "Officer", 3: "Owner" };

function Msg({ msg }: { msg: { text: string; ok: boolean } | null }) {
  if (!msg) return null;
  return <div className="cd-msg" style={{ color: msg.ok ? "#68d391" : "#fc8181" }}>{msg.text}</div>;
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
  }, [clan]);

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
        <div className="container-main" style={{ textAlign: "center", padding: "4rem 1rem", color: "rgba(255,255,255,0.3)" }}>
          Clan not found.
        </div>
      </div>
    );
  }

  return (
    <div className="cd-page">
      <div className="container-main">

        {/* Header card */}
        <div className="cd-header">
          <div className="cd-avatar-wrap">
            <Image
              key={avatarKey}
              src={`/api/clan-avatar/${clanId}`}
              alt="clan avatar"
              width={96}
              height={96}
              className="cd-avatar"
              unoptimized
              onError={(e) => { (e.target as HTMLImageElement).style.opacity = "0.2"; }}
            />
            {isOwner && (
              <>
                <input ref={fileRef} type="file" name="avatar" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
                <button type="button" className="cd-avatar-btn" onClick={() => fileRef.current?.click()} title="Change clan avatar">
                  Change
                </button>
              </>
            )}
            <Msg msg={avatarMsg} />
          </div>

          <div className="cd-header-info">
            {clan ? (
              <>
                <div className="cd-title">
                  <span className="cd-tag">[{clan.tag}]</span>
                  <span className="cd-name">{clan.name}</span>
                  {isOwner && (
                    <button className="cd-edit-btn" onClick={() => setEditOpen((v) => !v)} title="Edit clan">
                      Edit
                    </button>
                  )}
                </div>
                <div className="cd-meta">
                  <span>Owned by&nbsp;<Link href={`/u/${clan.owner_id}`} className="cd-owner-link">{clan.owner_name}</Link></span>
                  <span className="cd-meta-sep">·</span>
                  <span>Created {clan.created_at ? formatDate(new Date(clan.created_at).getTime() / 1000) : "—"}</span>
                  <span className="cd-meta-sep">·</span>
                  <span>{members.length} member{members.length !== 1 ? "s" : ""}</span>
                </div>
                {clan.description && <p className="cd-description">{clan.description}</p>}
              </>
            ) : (
              <div className="cd-loading">Loading...</div>
            )}
          </div>

          <div className="cd-mode-wrap">
            <ModeSelector mode={mode} mods={mods} onChange={(m, mo) => { setMode(m); setMods(mo); }} />
          </div>
        </div>

        {/* Edit panel */}
        {isOwner && editOpen && (
          <div className="cd-edit-panel">
            <div className="cd-edit-title">Edit Clan</div>
            <div className="cd-edit-row">
              <label className="cd-edit-label">Name</label>
              <input className="cd-edit-input" value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={16} />
            </div>
            <div className="cd-edit-row">
              <label className="cd-edit-label">Description</label>
              <textarea className="cd-edit-textarea" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} maxLength={500} rows={3} placeholder="Describe your clan..." />
            </div>
            <div className="cd-edit-actions">
              <button className="cd-save-btn" onClick={handleEditSave}>Save</button>
              <button className="cd-cancel-btn" onClick={() => setEditOpen(false)}>Cancel</button>
            </div>
            <Msg msg={editMsg} />
          </div>
        )}

        {/* Invite panel (owner only) */}
        {isOwner && (
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
        )}

        {/* Members table */}
        {kickMsg && <Msg msg={kickMsg} />}
        <div className="cd-table-wrap">
          <table className="cd-table">
            <thead>
              <tr>
                <th className="cd-th cd-th-rank">#</th>
                <th className="cd-th">Player</th>
                <th className="cd-th cd-th-role">Role</th>
                <th className="cd-th cd-th-pp">PP</th>
                <th className="cd-th cd-th-acc">Acc</th>
                <th className="cd-th cd-th-plays">Plays</th>
                {isOwner && <th className="cd-th cd-th-kick"></th>}
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan={isOwner ? 7 : 6} className="cd-empty">No members found.</td></tr>
              ) : (
                members.map((m, i) => (
                  <tr key={m.id} className="cd-row">
                    <td className="cd-td cd-td-rank">{i + 1}</td>
                    <td className="cd-td">
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                        <Image src={`http://a.pawinput.xyz/${m.id}`} alt="" width={28} height={28} className="cd-member-avatar" unoptimized />
                        <div>
                          <Link href={`/u/${m.id}`} className="cd-member-link">{m.name}</Link>
                          <div className="cd-member-country">
                            <img src={`https://flagcdn.com/16x12/${m.country.toLowerCase()}.png`} alt={m.country} width={16} height={12} />
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
                    <td className="cd-td cd-td-pp">{addCommas(m.pp)}pp</td>
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
                            <button className="cd-kick-btn" onClick={() => setKickConfirm(m.id)}>Kick</button>
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

      </div>
    </div>
  );
}
