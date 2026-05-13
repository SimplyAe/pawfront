"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";
import { useT } from "@/i18n";

const init: RegisterState = {};

export default function RegisterPage() {
  const t = useT();
  const [state, action, pending] = useActionState(registerAction, init);

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">{t("register.title")}</h1>
        <p className="auth-sub">
          {t("register.hasAccount")}{" "}
          <Link href="/login" className="auth-link">{t("register.signIn")}</Link>
        </p>

        {state.general && <div className="auth-error">{state.general}</div>}

        <form action={action} className="auth-form">
          <div className="auth-field">
            <label htmlFor="username">{t("register.username")}</label>
            <input id="username" name="username" type="text" autoComplete="username" autoFocus required />
            {state.errors?.username?.map((e) => (
              <span key={e} className="auth-field-error">{e}</span>
            ))}
          </div>

          <div className="auth-field">
            <label htmlFor="email">{t("register.email")}</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
            {state.errors?.email?.map((e) => (
              <span key={e} className="auth-field-error">{e}</span>
            ))}
          </div>

          <div className="auth-field">
            <label htmlFor="password">{t("register.password")}</label>
            <input id="password" name="password" type="password" autoComplete="new-password" required />
            {state.errors?.password?.map((e) => (
              <span key={e} className="auth-field-error">{e}</span>
            ))}
          </div>

          <div className="auth-field">
            <label htmlFor="confirm">{t("register.confirmPassword")}</label>
            <input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
            {state.errors?.confirm?.map((e) => (
              <span key={e} className="auth-field-error">{e}</span>
            ))}
          </div>

          <button type="submit" className="auth-btn" disabled={pending}>
            {pending ? t("register.submitting") : t("register.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
