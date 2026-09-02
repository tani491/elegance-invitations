"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/*  Exchange rates (hardcoded — FCFA is the base currency)                     */
/* -------------------------------------------------------------------------- */

export type CurrencyCode = "FCFA" | "EUR" | "USD";

interface CurrencyInfo {
  code: CurrencyCode;
  symbol: string;
  rate: number; // 1 FCFA = X of this currency
  locale: string;
  decimals: number;
}

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  FCFA: { code: "FCFA", symbol: "", rate: 1, locale: "fr-FR", decimals: 0 },
  EUR:  { code: "EUR",  symbol: "\u20AC", rate: 0.00152, locale: "fr-FR", decimals: 2 },
  USD:  { code: "USD",  symbol: "$", rate: 0.00164, locale: "en-US", decimals: 2 },
};

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  formatPrice: (fcfaAmount: number) => string;
  convert: (fcfaAmount: number) => number;
  info: CurrencyInfo;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrency] = useState<CurrencyCode>("FCFA");

  const info = CURRENCIES[currency];

  const convert = useCallback(
    (fcfaAmount: number) => {
      const result = fcfaAmount * info.rate;
      return Math.round(result * Math.pow(10, info.decimals)) / Math.pow(10, info.decimals);
    },
    [info]
  );

  const formatPrice = useCallback(
    (fcfaAmount: number) => {
      const converted = convert(fcfaAmount);
      if (currency === "FCFA") {
        return `${new Intl.NumberFormat(info.locale).format(converted)} FCFA`;
      }
      return `${info.symbol}${new Intl.NumberFormat(info.locale, {
        minimumFractionDigits: info.decimals,
        maximumFractionDigits: info.decimals,
      }).format(converted)}`;
    },
    [convert, currency, info]
  );

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, convert, info }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
