import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDefaultThemes, serializeTheme, THEME_COMPAT_SELECT } from "@/lib/theme-store";
import { DEFAULT_THEMES } from "@/lib/theme-presets";

function fallbackThemesResponse() {
  return NextResponse.json(
    { success: true, data: DEFAULT_THEMES.map((theme) => serializeTheme(theme)), source: "static-fallback" },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  try {
    await ensureDefaultThemes();

    let themes;
    let source = "database";

    try {
      themes = await db.theme.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      });
    } catch (error) {
      console.error("Database full theme fetch failed in /api/themes, retrying with compatible columns:", error);
      themes = await db.theme.findMany({
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
        select: THEME_COMPAT_SELECT,
      });
      source = "database-compat";
    }

    if (themes.length === 0) {
      console.error("Database error in /api/themes:", new Error("Theme table is empty after initialization."));
      return fallbackThemesResponse();
    }

    return NextResponse.json(
      { success: true, data: themes.map(serializeTheme), source },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Database error in /api/themes:", err);
    return fallbackThemesResponse();
  }
}
