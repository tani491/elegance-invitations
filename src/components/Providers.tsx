"use client";

import type { ReactNode } from "react";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { LanguageProvider } from "@/context/LanguageContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <CurrencyProvider>{children}</CurrencyProvider>
    </LanguageProvider>
  );
}
