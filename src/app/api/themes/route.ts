import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ensureDefaultThemes, serializeTheme } from "@/lib/theme-store";

export async function GET() {
  await ensureDefaultThemes();

  const themes = await db.theme.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(
    { success: true, data: themes.map(serializeTheme) },
    { headers: { "Cache-Control": "no-store" } },
  );
}
