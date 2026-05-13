"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useT } from "@/i18n";

export default function WelcomePage() {
  const t = useT();
  const [userId, setUserId] = useState<number | null>(null);
  const [name, setName] = useState("Player");

  useEffect(() => {
    fetch("/api/me").then(r => r.json()).then(d => {
      if (d?.name) setName(d.name);
      if (d?.id) setUserId(d.id);
    });
  }, []);

  return (
    <div className="welcome-page">
      <div className="welcome-inner">

        {/* Hero */}
        <div className="welcome-hero">
          <div className="welcome-check">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="welcome-title" dangerouslySetInnerHTML={{ __html: t("welcome.title", { name: `<span>${name}</span>` }) }} />
          <p className="welcome-sub">{t("welcome.sub")}</p>
        </div>

        {/* Download card */}
        <div className="welcome-download-card">
          <div className="welcome-download-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          </div>
          <div className="welcome-download-info">
            <div className="welcome-download-name">{t("welcome.downloadName")}</div>
            <div className="welcome-download-size">{t("welcome.downloadSize")}</div>
          </div>
          <a href="/api/client/download" className="welcome-download-btn" download>
            {t("welcome.downloadBtn")}
          </a>
        </div>

        {/* Steps */}
        <div className="welcome-steps">
          <h2 className="welcome-steps-title">{t("welcome.stepsTitle")}</h2>

          <ol className="welcome-step-list">
            <li className="welcome-step">
              <span className="welcome-step-num">1</span>
              <div className="welcome-step-body">
                <strong>{t("welcome.step1.title")}</strong>
                <p>
                  {t("welcome.step1.desc1")} <code>.rar</code> {t("welcome.step1.desc2")}{" "}
                  <a href="https://www.win-rar.com/" target="_blank" rel="noopener noreferrer">WinRAR</a> or{" "}
                  <a href="https://www.7-zip.org/" target="_blank" rel="noopener noreferrer">7-Zip</a> {t("welcome.step1.desc3")}
                </p>
              </div>
            </li>

            <li className="welcome-step">
              <span className="welcome-step-num">2</span>
              <div className="welcome-step-body">
                <strong>{t("welcome.step2.title")}</strong>
                <p>{t("welcome.step2.desc", { exe: "osu!.exe" })}</p>
              </div>
            </li>

            <li className="welcome-step">
              <span className="welcome-step-num">3</span>
              <div className="welcome-step-body">
                <strong>{t("welcome.step3.title")}</strong>
                <p>{t("welcome.step3.desc")}</p>
              </div>
            </li>

            <li className="welcome-step">
              <span className="welcome-step-num">4</span>
              <div className="welcome-step-body">
                <strong>{t("welcome.step4.title")}</strong>
                <p>{t("welcome.step4.desc")}</p>
              </div>
            </li>
          </ol>

          <div className="welcome-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            {t("welcome.note")}
          </div>
        </div>

        {/* Footer actions */}
        <div className="welcome-actions">
          <Link href={userId ? `/u/${userId}` : "/"} className="welcome-profile-btn">
            {t("welcome.profileBtn")}
          </Link>
          <Link href="/" className="welcome-home-link">
            {t("welcome.homeLink")}
          </Link>
        </div>

      </div>
    </div>
  );
}
