import { NextResponse } from "next/server";
import { getHomepageSettings } from "@/lib/homepage-settings";

export async function GET() {
  try {
    const settings = await getHomepageSettings();

    return NextResponse.json(
      { success: true, data: settings },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Settings API failed:", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger les parametres." },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
