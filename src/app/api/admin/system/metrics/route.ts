import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { SystemMetricsService } from "@/lib/system-metrics";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "current") {
      const metrics = await SystemMetricsService.collectMetrics();
      return NextResponse.json(metrics);
    }

    if (action === "history") {
      const hours = parseInt(searchParams.get("hours") || "24");
      const history = await SystemMetricsService.getMetricsHistory(hours);
      return NextResponse.json(history);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("System metrics error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}