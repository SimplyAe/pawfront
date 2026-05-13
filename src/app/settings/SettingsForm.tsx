"use client";

import { useActionState, useRef } from "react";
import Link from "next/link";
import { updateProfileAction, uploadAvatarAction, uploadBannerAction, type SettingsState } from "./actions";

const init: SettingsState = {};

export default function SettingsForm() {
  const [profileState, profileAction, profilePending] = useActionState(updateProfileAction, init);
  const [avatarState, avatarAction, avatarPending] = useActionState(uploadAvatarAction, init);
  const [bannerState, bannerAction, bannerPending] = useActionState(uploadBannerAction, init);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="settings-page">
      <div className="settings-container">
        <h1 className="settings-title">Settings</h1>

        {/* ── Profile section ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Profile</h2>

          {profileState.success && (
            <div className="settings-banner settings-banner--success">{profileState.success}</div>
          )}
          {profileState.general && (
            <div className="settings-banner settings-banner--error">{profileState.general}</div>
          )}

          <form action={profileAction} className="settings-form">
            <div className="settings-field">
              <label>New Username</label>
              <input
                type="text"
                name="new_username"
                placeholder="Leave blank to keep current"
                autoComplete="off"
              />
              {profileState.errors?.username?.map((e, i) => (
                <span key={i} className="settings-field-error">{e}</span>
              ))}
            </div>

            <div className="settings-field">
              <label>New Email</label>
              <input
                type="email"
                name="new_email"
                placeholder="Leave blank to keep current"
                autoComplete="off"
              />
              {profileState.errors?.email?.map((e, i) => (
                <span key={i} className="settings-field-error">{e}</span>
              ))}
            </div>

            <div className="settings-field">
              <label>New Password</label>
              <input
                type="password"
                name="new_password"
                placeholder="Leave blank to keep current"
                autoComplete="new-password"
              />
              {profileState.errors?.password?.map((e, i) => (
                <span key={i} className="settings-field-error">{e}</span>
              ))}
            </div>

            <div className="settings-field">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirm_password"
                placeholder="Confirm new password"
                autoComplete="new-password"
              />
              {profileState.errors?.confirm_password?.map((e, i) => (
                <span key={i} className="settings-field-error">{e}</span>
              ))}
            </div>

            <div className="settings-field settings-field--divider">
              <label>Current Password <span style={{ color: "#d55b9e" }}>*</span></label>
              <input
                type="password"
                name="current_password"
                placeholder="Required to save changes"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="settings-btn" disabled={profilePending}>
              {profilePending ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </section>

        {/* ── Avatar section ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Avatar</h2>

          {avatarState.success && (
            <div className="settings-banner settings-banner--success">{avatarState.success}</div>
          )}
          {avatarState.general && (
            <div className="settings-banner settings-banner--error">{avatarState.general}</div>
          )}

          <form action={avatarAction} className="settings-form">
            <div className="settings-field">
              <label>Image File <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>(PNG, JPG, GIF — max 4 MB)</span></label>
              <input
                ref={avatarInputRef}
                type="file"
                name="avatar"
                accept="image/*"
                className="settings-file-input"
              />
            </div>

            <div className="settings-field">
              <label>Current Password <span style={{ color: "#d55b9e" }}>*</span></label>
              <input
                type="password"
                name="current_password"
                placeholder="Required to upload"
                autoComplete="current-password"
                required
              />
            </div>

            <button type="submit" className="settings-btn" disabled={avatarPending}>
              {avatarPending ? "Uploading..." : "Upload Avatar"}
            </button>
          </form>
        </section>

        {/* ── Banner section ── */}
        <section className="settings-section">
          <h2 className="settings-section-title">Profile Banner</h2>

          {bannerState.success && (
            <div className="settings-banner settings-banner--success">{bannerState.success}</div>
          )}
          {bannerState.general && (
            <div className="settings-banner settings-banner--error">{bannerState.general}</div>
          )}

          <form action={bannerAction} className="settings-form">
            <div className="settings-field">
              <label>Image File <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>(PNG, JPG, WebP — max 8 MB, recommended 1400×320)</span></label>
              <input
                type="file"
                name="banner"
                accept="image/*"
                className="settings-file-input"
              />
            </div>

            <button type="submit" className="settings-btn" disabled={bannerPending}>
              {bannerPending ? "Uploading..." : "Upload Banner"}
            </button>
          </form>
        </section>

        <div style={{ marginTop: "1.5rem" }}>
          <Link href="/" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.85rem" }}>
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
