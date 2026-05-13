"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { updateProfileAction, uploadAvatarAction, uploadBannerAction, type SettingsState } from "./actions";
import { useT } from "@/i18n";

const init: SettingsState = {};

export default function SettingsForm() {
  const t = useT();
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, init);
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatarAction, init);
  const [bannerState, bannerAction, bannerPending] = useActionState(uploadBannerAction, init);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">{t("settings.title")}</h1>

        {/* ── Profile section ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">{t("settings.profile.title")}</h2>

          {profileState.success && (
            <div className="settings-banner settings-banner--success">{profileState.success}</div>
          )}
          {profileState.general && (
            <div className="settings-banner settings-banner--error">{profileState.general}</div>
          )}

          <form action={profileAction} className="settings-form">
            <div className="settings-field">
              <label>{t("settings.profile.newUsername")}</label>
              <input
                type="text"
                name="new_username"
                placeholder={t("settings.profile.keepCurrent")}
                autoComplete="off"
              />
              {profileState.errors?.username?.map((e, i) => (
                <span key={i} className="settings-field-error">{e}</span>
              ))}
            </div>

            <div className="settings-field">
              <label>{t("settings.profile.newEmail")}</label>
              <input
                type="email"
                name="new_email"
                placeholder={t("settings.profile.keepCurrent")}
                autoComplete="off"
              />
              {profileState.errors?.email?.map((e, i) => (
                <span key={i} className="settings-field-error">{e}</span>
              ))}
            </div>

            <div className="settings-field">
              <label>{t("settings.profile.newPassword")}</label>
              <input
                type="password"
                name="new_password"
                placeholder={t("settings.profile.keepCurrent")}
                autoComplete="new-password"
              />
              {profileState.errors?.password?.map((e, i) => (
                <span key={i} className="settings-field-error">{e}</span>
              ))}
            </div>

            <div className="settings-field">
              <label>{t("settings.profile.confirmPassword")}</label>
              <input
                type="password"
                name="confirm_password"
                placeholder={t("settings.profile.confirmPlaceholder")}
                autoComplete="new-password"
              />
              {profileState.errors?.confirm_password?.map((e, i) => (
                <span key={i} className="settings-field-error">{e}</span>
              ))}
            </div>

            <div className="settings-field settings-field--divider">
              <label>{t("settings.profile.currentPassword")} <span style={{ color: "#d55b9e" }}>*</span></label>
              <input
                type="password"
                name="current_password"
                placeholder={t("settings.profile.currentRequired")}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="settings-btn" disabled={profilePending}>
              {profilePending ? t("settings.profile.saving") : t("settings.profile.save")}
            </button>
          </form>
        </section>

        {/* ── Avatar section ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">{t("settings.avatar.title")}</h2>

          {avatarState.success && (
            <div className="settings-banner settings-banner--success">{avatarState.success}</div>
          )}
          {avatarState.general && (
            <div className="settings-banner settings-banner--error">{avatarState.general}</div>
          )}

          <form action={avatarAction} className="settings-form">
            <div className="settings-field">
              <label>{t("settings.avatar.imageFile")} <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>{t("settings.avatar.imageHint")}</span></label>
              <input
                ref={avatarInputRef}
                type="file"
                name="avatar"
                accept="image/*"
                className="settings-file-input"
              />
            </div>

            <div className="settings-field">
              <label>{t("settings.avatar.currentPassword")} <span style={{ color: "#d55b9e" }}>*</span></label>
              <input
                type="password"
                name="current_password"
                placeholder={t("settings.avatar.requiredToUpload")}
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="settings-btn" disabled={avatarPending}>
              {avatarPending ? t("settings.avatar.uploading") : t("settings.avatar.upload")}
            </button>
          </form>
        </section>

        {/* ── Banner section ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">{t("settings.banner.title")}</h2>

          {bannerState.success && (
            <div className="settings-banner settings-banner--success">{bannerState.success}</div>
          )}
          {bannerState.general && (
            <div className="settings-banner settings-banner--error">{bannerState.general}</div>
          )}

          <form action={bannerAction} className="settings-form">
            <div className="settings-field">
              <label>{t("settings.banner.imageFile")} <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>{t("settings.banner.imageHint")}</span></label>
              <input
                type="file"
                name="banner"
                accept="image/*"
                className="settings-file-input"
              />
            </div>

            <button type="submit" className="settings-btn" disabled={bannerPending}>
              {bannerPending ? t("settings.banner.uploading") : t("settings.banner.upload")}
            </button>
          </form>
        </section>

        <div style={{ marginTop: "1.5rem" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
            {t("settings.backToHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
