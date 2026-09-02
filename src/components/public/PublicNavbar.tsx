"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Globe, Banknote, ChevronDown } from "lucide-react";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/context/LanguageContext";
import { useCurrency, CURRENCIES, type CurrencyCode } from "@/context/CurrencyContext";
import { LOCALE_LABELS, type Locale } from "@/i18n/translations";

/* -------------------------------------------------------------------------- */
/*  Color tokens                                                               */
/* -------------------------------------------------------------------------- */
const COLORS = {
  ivory: "#FAF7F2",
  gold: "#D4AF37",
  burgundy: "#5C1D24",
  ebony: "#1A1818",
} as const;

const SCROLL_THRESHOLD = 24;
const PUBLIC_LOCALES: Locale[] = ["fr", "en", "ar"];

/* -------------------------------------------------------------------------- */
/*  useMounted — avoids hydration mismatch for scroll-dependent state          */
/* -------------------------------------------------------------------------- */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  return mounted;
}

/* ========================================================================== */
/*  PublicNavbar                                                               */
/* ========================================================================== */

export default function PublicNavbar() {
  const mounted = useMounted();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { locale, setLocale, t, dir } = useLanguage();
  const { currency, setCurrency } = useCurrency();

  /* scroll listener — only runs on client */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* sync dir attribute on <html> for RTL support */
  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);

  const scrollToSection = (href: string) => {
    if (href.startsWith("#")) {
      document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onLinkClick = (href: string) => {
    setMobileOpen(false);
    scrollToSection(href);
  };

  /* isActive: only after mount + scrolled past threshold */
  const isActive = mounted && scrolled;

  /* Nav links from translations */
  const NAV_LINKS = [
    { label: t.nav.models, href: "#modeles" },
    { label: t.nav.howItWorks, href: "#comment" },
    { label: t.nav.pricing, href: "#tarifs" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-out",
        isActive ? "border-b" : "border-b border-transparent"
      )}
      style={{
        backgroundColor: isActive ? COLORS.ivory : "transparent",
        borderColor: isActive ? COLORS.gold : "transparent",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12">
        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-1.5">
          <span
            className="font-[var(--font-cormorant)] text-2xl font-semibold tracking-wide transition-colors duration-300 sm:text-[1.65rem]"
            style={{ color: isActive ? COLORS.burgundy : COLORS.ivory }}
          >
            Élégance
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <button
                type="button"
                onClick={() => onLinkClick(link.href)}
                className="relative rounded-md px-3.5 py-2 text-sm font-medium tracking-wide transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ color: isActive ? COLORS.ebony : COLORS.ivory }}
              >
                {link.label}
                <span className="absolute bottom-1.5 left-3.5 right-3.5 h-px origin-left scale-x-0 bg-[#D4AF37] transition-transform duration-300 group-hover:scale-x-100" />
              </button>
            </li>
          ))}
        </ul>

        {/* Desktop right cluster: selectors */}
        <div className="hidden items-center gap-2 md:flex">
          {/* Language selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: isActive ? COLORS.ebony : COLORS.ivory,
                  backgroundColor: isActive ? `${COLORS.gold}12` : "transparent",
                }}
              >
                <Globe className="size-3.5" />
                <span>{locale.toUpperCase()}</span>
                <ChevronDown className="size-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {PUBLIC_LOCALES.map((l) => (
                <DropdownMenuItem
                  key={l}
                  onClick={() => setLocale(l)}
                  className={cn(
                    "cursor-pointer text-sm",
                    locale === l && "font-semibold"
                  )}
                  style={locale === l ? { color: COLORS.gold } : undefined}
                >
                  {LOCALE_LABELS[l]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Currency selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium tracking-wide transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2"
                style={{
                  color: isActive ? COLORS.ebony : COLORS.ivory,
                  backgroundColor: isActive ? `${COLORS.gold}12` : "transparent",
                }}
              >
                <Banknote className="size-3.5" />
                <span>{currency}</span>
                <ChevronDown className="size-3 opacity-60" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                <DropdownMenuItem
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={cn(
                    "cursor-pointer text-sm",
                    currency === c && "font-semibold"
                  )}
                  style={currency === c ? { color: COLORS.gold } : undefined}
                >
                  {c === "FCFA" ? "FCFA" : `${CURRENCIES[c].symbol} ${c}`}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

        </div>

        {/* Mobile hamburger */}
        <div className="relative z-10 flex md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="flex size-9 items-center justify-center rounded-md transition-colors duration-300"
                style={{ color: isActive ? COLORS.burgundy : COLORS.ivory }}
                aria-label="Ouvrir le menu"
              >
                <Menu className="size-5" />
              </button>
            </SheetTrigger>

            <SheetContent
              side="right"
              className="w-full border-l sm:max-w-sm"
              style={{
                backgroundColor: COLORS.ivory,
                borderColor: COLORS.gold,
              }}
            >
              <SheetHeader className="pt-2">
                <SheetTitle
                  className="font-[var(--font-cormorant)] text-xl font-semibold tracking-wide"
                  style={{ color: COLORS.burgundy }}
                >
                  Élégance
                </SheetTitle>
              </SheetHeader>

              <div className="flex flex-1 flex-col gap-1 px-2 pt-6">
                {/* Language + Currency row */}
                <div className="mb-4 flex gap-2">
                  {/* Language */}
                  <div className="flex-1 rounded-lg border p-2" style={{ borderColor: `${COLORS.gold}40` }}>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: `${COLORS.ebony}60` }}>
                      Langue
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {PUBLIC_LOCALES.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setLocale(l)}
                          className="rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200"
                          style={{
                            backgroundColor: locale === l ? `${COLORS.gold}25` : "transparent",
                            color: locale === l ? COLORS.burgundy : COLORS.ebony,
                          }}
                        >
                          {l.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Currency */}
                  <div className="flex-1 rounded-lg border p-2" style={{ borderColor: `${COLORS.gold}40` }}>
                    <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: `${COLORS.ebony}60` }}>
                      Devise
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCurrency(c)}
                          className="rounded-md px-2 py-1 text-xs font-medium transition-colors duration-200"
                          style={{
                            backgroundColor: currency === c ? `${COLORS.gold}25` : "transparent",
                            color: currency === c ? COLORS.burgundy : COLORS.ebony,
                          }}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Nav links */}
                {NAV_LINKS.map((link) => (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => onLinkClick(link.href)}
                    className="w-full rounded-lg px-4 py-3 text-left text-[0.935rem] font-medium tracking-wide transition-colors duration-200 hover:bg-[#D4AF37]/10 focus-visible:outline-none focus-visible:ring-2"
                    style={{ color: COLORS.ebony }}
                  >
                    {link.label}
                  </button>
                ))}

              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
