import { NextResponse } from "next/server";
import { getHomepageSettings } from "@/lib/homepage-settings";

export async function GET() {
  const settings = await getHomepageSettings();

  return NextResponse.json(
    { success: true, data: settings },
    { headers: { "Cache-Control": "no-store" } },
  );
}
