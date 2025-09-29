import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const started = Date.now();
    // Lightweight DB check
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - started;

    return NextResponse.json({
      status: "ok",
      db: { connected: true, durationMs: duration },
    });
  } catch (error: any) {
    console.error("Health check failed:", error);
    return NextResponse.json(
      { status: "error", db: { connected: false } },
      { status: 503 },
    );
  }
}

