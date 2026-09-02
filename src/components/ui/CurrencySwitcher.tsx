"use client";

import { Banknote } from "lucide-react";
import { CURRENCIES, type CurrencyCode, useCurrency } from "@/context/CurrencyContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency();

  return (
    <Select value={currency} onValueChange={(value) => setCurrency(value as CurrencyCode)}>
      <SelectTrigger className="w-32">
        <Banknote className="mr-2 size-4" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(CURRENCIES) as CurrencyCode[]).map((code) => (
          <SelectItem key={code} value={code}>{code}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
