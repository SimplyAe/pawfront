"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { loginAction, forgotPasswordAction, type LoginState, type ForgotState } from "./actions";

const initLogin: LoginState = {};
const initForgot: ForgotState = {};

export default function LoginPage() {
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
        <h1 className="auth-title">Sign in</h1>
        <p className="auth-sub">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="auth-link">Register</Link>
        </p>

        {state.error && <div className="auth-error">{state.error}</div>}

        <form action={action} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username">Username</label>
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
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="auth-btn" disabled={pending}>
            {pending ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          className="auth-forgot-link"
          onClick={() => setModalOpen(true)}
        >
          Forgot my password
        </button>
      </div>

      {/* ── Forgot password modal ── */}
      {modalOpen && (
        <div className="fp-backdrop" onClick={closeModal}>
          <div className="fp-modal" onClick={(e) => e.stopPropagation()}>
            <button className="fp-close" onClick={closeModal} aria-label="Close">✕</button>

            {forgotState.success ? (
              <>
                <h2 className="fp-title">Check your email</h2>
                <p className="fp-desc">
                  If an account with that username or email exists, we&apos;ve sent a
                  password reset link to the associated address. It expires in&nbsp;1&nbsp;hour.
                </p>
                <button className="auth-btn" style={{ marginTop: "1rem" }} onClick={closeModal}>
                  Close
                </button>
              </>
            ) : (
              <>
                <h2 className="fp-title">Reset password</h2>
                <p className="fp-desc">
                  Enter your username or email and we&apos;ll send you a link to reset your password.
                </p>

                {forgotState.error && (
                  <div className="auth-error">{forgotState.error}</div>
                )}

                <form action={forgotAction} className="auth-form">
                  <div className="auth-field">
                    <label htmlFor="username_or_email">Username or email</label>
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
                    {forgotPending ? "Sending…" : "Send reset link"}
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
