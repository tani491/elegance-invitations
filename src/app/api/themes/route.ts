import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDefaultThemes, serializeTheme } from "@/lib/theme-store";
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

    const themes = await db.theme.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    if (themes.length === 0) {
      console.error("Database error in /api/themes:", new Error("Theme table is empty after initialization."));
      return fallbackThemesResponse();
    }

    return NextResponse.json(
      { success: true, data: themes.map(serializeTheme), source: "database" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("Database error in /api/themes:", err);
    return fallbackThemesResponse();
  }
}
