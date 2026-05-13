"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage, LOCALES } from "@/i18n";

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="lang-switcher">
      <button
        className="lang-switcher-btn"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change language"
      >
        <span className="lang-flag">{current.flag}</span>
        <span className="lang-code">{current.code.toUpperCase()}</span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="lang-dropdown">
          {LOCALES.map((l) => (
            <button
              key={l.code}
              className={`lang-option${locale === l.code ? " lang-option--active" : ""}`}
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
            >
              <span className="lang-flag">{l.flag}</span>
              <span>{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
