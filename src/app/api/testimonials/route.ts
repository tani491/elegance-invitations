import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({
      where: { isVisible: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: testimonials });
  } catch (error) {
    console.error("Public testimonials fetch failed:", error);
    return NextResponse.json({ success: true, data: [] }, { headers: { "Cache-Control": "no-store" } });
  }
}
