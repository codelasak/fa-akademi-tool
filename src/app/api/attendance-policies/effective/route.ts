import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");
    const schoolId = searchParams.get("schoolId");

    // Policy hierarchy: Class → School → Global
    let effectivePolicy = null;

    // Try class-specific policy first
    if (classId) {
      effectivePolicy = await prisma.attendancePolicy.findFirst({
        where: {
          scope: "CLASS",
          classId: classId,
          isActive: true,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } },
          ],
        },
        orderBy: { effectiveFrom: "desc" },
      });
    }

    // Fall back to school-specific policy
    if (!effectivePolicy && schoolId) {
      effectivePolicy = await prisma.attendancePolicy.findFirst({
        where: {
          scope: "SCHOOL",
          schoolId: schoolId,
          isActive: true,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } },
          ],
        },
        orderBy: { effectiveFrom: "desc" },
      });
    }

    // Fall back to global policy
    if (!effectivePolicy) {
      effectivePolicy = await prisma.attendancePolicy.findFirst({
        where: {
          scope: "GLOBAL",
          isActive: true,
          effectiveFrom: { lte: new Date() },
          OR: [
            { effectiveTo: null },
            { effectiveTo: { gte: new Date() } },
          ],
        },
        orderBy: { effectiveFrom: "desc" },
      });
    }

    // If no policy found, return default values
    if (!effectivePolicy) {
      effectivePolicy = {
        id: "default",
        name: "Varsayılan Politika",
        description: "Sistem varsayılan değerleri",
        scope: "GLOBAL",
        concernThreshold: 80,
        lateToleranceMinutes: 15,
        maxAbsences: 20,
        autoExcuseEnabled: false,
        autoExcuseReasons: [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return NextResponse.json(effectivePolicy);
  } catch (error) {
    console.error("Etkili politika getirme hatası:", error);
    return NextResponse.json(
      { error: "Etkili politika getirilemedi" },
      { status: 500 }
    );
  }
}