import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const eventCount = await db.event.count();
    const guestCount = await db.eventGuest.count();
    const testimonialCount = await db.testimonial.count();
    return NextResponse.json({
      status: "ok",
      version: "1.0.0",
      stats: { events: eventCount, guests: guestCount, testimonials: testimonialCount },
    });
  } catch {
    return NextResponse.json({ status: "error", message: "Database unavailable" }, { status: 503 });
  }
}
