"use client";

import { useT } from "./LanguageContext";

interface Props {
  k: string;
  params?: Record<string, string | number>;
}

export default function T({ k, params }: Props) {
  const t = useT();
  return <>{t(k, params)}</>;
}
