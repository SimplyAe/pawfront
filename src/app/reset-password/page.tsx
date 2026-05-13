"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { resetPasswordAction, type ResetState } from "./actions";

const init: ResetState = {};

function ResetForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, action, pending] = useActionState(resetPasswordAction, init);

  if (!token) {
    return (
      <div className="auth-card">
        <h1 className="auth-title">Invalid link</h1>
        <p className="auth-sub" style={{ color: "rgba(255,255,255,0.45)" }}>
          This reset link is missing or invalid.{" "}
          <Link href="/login" className="auth-link">Back to login</Link>
        </p>
      </div>
    );
  }

  if (state.success) {
    return (
      <div className="auth-card">
        <h1 className="auth-title">Password updated</h1>
        <p className="auth-sub" style={{ color: "rgba(255,255,255,0.45)" }}>
          Your password has been changed successfully.{" "}
          <Link href="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h1 className="auth-title">New password</h1>
      <p className="auth-sub">Choose a new password for your account.</p>

      {state.error && <div className="auth-error">{state.error}</div>}

      <form action={action} className="auth-form">
        <input type="hidden" name="token" value={token} />

        <div className="auth-field">
          <label htmlFor="new_password">New password</label>
          <input
            id="new_password"
            name="new_password"
            type="password"
            autoComplete="new-password"
            autoFocus
            required
            minLength={8}
          />
        </div>

        <div className="auth-field">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </div>

        <button type="submit" className="auth-btn" disabled={pending}>
          {pending ? "Saving…" : "Set new password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="auth-page">
      <Suspense fallback={<div className="auth-card"><p className="auth-sub">Loading…</p></div>}>
        <ResetForm />
      </Suspense>
    </div>
  );
}
