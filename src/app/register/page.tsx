"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";

const init: RegisterState = {};

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, init);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-sub">
          Already have an account?{" "}
          <Link href="/login" className="auth-link">Sign in</Link>
        </p>

        {state.general && <div className="auth-error">{state.general}</div>}

        <form action={action} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" autoComplete="username" autoFocus required />
            {state.errors?.username?.map((e) => (
              <span key={e} className="auth-field-error">{e}</span>
            ))}
          </div>

          <div className="auth-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
            {state.errors?.email?.map((e) => (
              <span key={e} className="auth-field-error">{e}</span>
            ))}
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="new-password" required />
            {state.errors?.password?.map((e) => (
              <span key={e} className="auth-field-error">{e}</span>
            ))}
          </div>

          <div className="auth-field">
            <label htmlFor="confirm">Confirm Password</label>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
            {state.errors?.confirm?.map((e) => (
              <span key={e} className="auth-field-error">{e}</span>
            ))}
          </div>

          <button type="submit" className="auth-btn" disabled={pending}>
            {pending ? "Creating account…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
