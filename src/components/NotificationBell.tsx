"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { getClanInvites, type ClanInvite } from "@/lib/api";

const API = "https://api.pawinput.xyz/v1";

export default function NotificationBell({ userId }: { userId: number }) {
  const [invites, setInvites] = useState<ClanInvite[]>([]);
  const [open, setOpen] = useState(false);
  const [, startT] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  function load() {
    getClanInvites(userId).then(setInvites);
  }

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [userId]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function respond(inviteId: number, accept: boolean) {
    const fd = new FormData();
    fd.append("invite_id", String(inviteId));
    fd.append("actor_id", String(userId));
    fd.append("accept", accept ? "1" : "0");
    await fetch(`${API}/clan_invite_respond`, { method: "POST", body: fd });
    load();
  }

  const count = invites.length;

  return (
    <div ref={ref} className="nb-wrap">
      <button
        className={`nb-btn${open ? " nb-btn--open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        {count > 0 && <span className="nb-badge">{count}</span>}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-dropdown-header">Notifications</div>
          {invites.length === 0 ? (
            <div className="nb-empty">No pending notifications.</div>
          ) : (
            invites.map((inv) => (
              <div key={inv.id} className="nb-invite">
                <div className="nb-invite-text">
                  <span className="nb-invite-tag">[{inv.clan_tag}]</span>
                  <span className="nb-invite-clan">{inv.clan_name}</span>
                  <span className="nb-invite-sub">invited by {inv.inviter_name}</span>
                </div>
                <div className="nb-invite-actions">
                  <button className="nb-accept" onClick={() => respond(inv.id, true)}>Accept</button>
                  <button className="nb-decline" onClick={() => respond(inv.id, false)}>Decline</button>
                </div>
                <Link href={`/clans/${inv.clan_id}`} className="nb-invite-view">View clan</Link>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
