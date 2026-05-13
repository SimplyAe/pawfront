"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { loginAction, forgotPasswordAction, type LoginState, type ForgotState } from "./actions";
import { useT } from "@/i18n";

const initLogin: LoginState = {};
const initForgot: ForgotState = {};

export default function LoginPage() {
  const t = useT();
  const [state, action, pending] = useActionState(loginAction, initLogin);
  const [forgotState, forgotAction, forgotPending] = useActionState(forgotPasswordAction, initForgot);

  const [modalOpen, setModalOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (modalOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [modalOpen]);

  function closeModal() { setModalOpen(false); }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{t("login.title")}</h1>
        <p className="auth-sub">
          {t("login.noAccount")}{" "}
          <Link href="/register" className="auth-link">{t("login.register")}</Link>
        </p>

        {state.error && <div className="auth-error">{state.error}</div>}

        <form action={action} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username">{t("login.username")}</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              autoFocus
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="password">{t("login.password")}</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={pending}>
            {pending ? t("login.submitting") : t("login.submit")}
          </button>
        </form>

        <button
          type="button"
          className="auth-forgot-link"
          onClick={() => setModalOpen(true)}
        >
          {t("login.forgotPassword")}
        </button>
      </div>

      {/* ── Forgot password modal ── */}
      {modalOpen && (
        <div className="fp-backdrop" onClick={closeModal}>
          <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
            <button className="fp-close" onClick={closeModal} aria-label="Close">✕</button>

            {forgotState.success ? (
              <>
                <h2 className="fp-title">{t("login.resetModal.successTitle")}</h2>
                <p className="fp-desc">{t("login.resetModal.successDesc")}</p>
                <button className="auth-btn" style={{ marginTop: "1rem" }} onClick={closeModal}>
                  {t("login.resetModal.close")}
                </button>
              </>
            ) : (
              <>
                <h2 className="fp-title">{t("login.resetModal.title")}</h2>
                <p className="fp-desc">{t("login.resetModal.description")}</p>

                {forgotState.error && (
                  <div className="auth-error">{forgotState.error}</div>
                )}

                <form action={forgotAction} className="auth-form">
                  <div className="auth-field">
                    <label htmlFor="username_or_email">{t("login.resetModal.usernameOrEmail")}</label>
                    <input
                      ref={inputRef}
                      id="username_or_email"
                      name="username_or_email"
                      type="text"
                      autoComplete="email username"
                      required
                    />
                  </div>
                  <button type="submit" className="auth-btn" disabled={forgotPending}>
                    {forgotPending ? t("login.resetModal.sending") : t("login.resetModal.send")}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
