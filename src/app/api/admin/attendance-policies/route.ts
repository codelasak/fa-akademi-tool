import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createPolicySchema = z.object({
  name: z.string().min(1, "Politika adı gerekli"),
  description: z.string().optional(),
  scope: z.enum(["GLOBAL", "SCHOOL", "CLASS"]),
  schoolId: z.string().optional(),
  classId: z.string().optional(),
  concernThreshold: z.number().min(1).max(100, "Eşik %1-100 arasında olmalı"),
  lateToleranceMinutes: z
    .number()
    .min(0)
    .max(180, "Tolerans 0-180 dakika arası olmalı"),
  maxAbsences: z
    .number()
    .min(1)
    .max(365, "Maksimum devamsızlık 1-365 arası olmalı"),
  autoExcuseEnabled: z.boolean().default(false),
  autoExcuseReasons: z.array(z.string()).default([]),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const policies = await prisma.attendancePolicy.findMany({
      orderBy: [{ scope: "asc" }, { createdAt: "desc" }],
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            school: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error("Politika listesi getirme hatası:", error);
    return NextResponse.json(
      { error: "Politika listesi getirilemedi" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const data = createPolicySchema.parse(body);

    // Validate scope-specific requirements
    if (data.scope === "SCHOOL" && !data.schoolId) {
      return NextResponse.json(
        { error: "Okul politikası için okul seçimi gerekli" },
        { status: 400 },
      );
    }

    if (data.scope === "CLASS" && (!data.classId || !data.schoolId)) {
      return NextResponse.json(
        { error: "Sınıf politikası için sınıf ve okul seçimi gerekli" },
        { status: 400 },
      );
    }

    if (data.scope === "GLOBAL" && (data.schoolId || data.classId)) {
      return NextResponse.json(
        { error: "Genel politika okul veya sınıfa bağlanamaz" },
        { status: 400 },
      );
    }

    // Check for existing active policy with same scope
    const existingPolicy = await prisma.attendancePolicy.findFirst({
      where: {
        scope: data.scope,
        schoolId: data.schoolId || null,
        classId: data.classId || null,
        isActive: true,
        effectiveTo: null,
      },
    });

    // End-date any existing active policy for the same scope before creating new one
    if (existingPolicy) {
      await prisma.attendancePolicy.update({
        where: { id: existingPolicy.id },
        data: {
          effectiveTo: new Date(),
          isActive: false,
        },
      });
    }

    const policy = await prisma.attendancePolicy.create({
      data: {
        name: data.name,
        description: data.description,
        scope: data.scope,
        schoolId: data.schoolId,
        classId: data.classId,
        concernThreshold: data.concernThreshold,
        lateToleranceMinutes: data.lateToleranceMinutes,
        maxAbsences: data.maxAbsences,
        autoExcuseEnabled: data.autoExcuseEnabled,
        autoExcuseReasons: data.autoExcuseReasons,
        effectiveFrom: data.effectiveFrom
          ? new Date(data.effectiveFrom)
          : new Date(),
        effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null,
        isActive: true, // Explicitly set as active
      },
      include: {
        school: {
          select: {
            id: true,
            name: true,
          },
        },
        class: {
          select: {
            id: true,
            name: true,
            school: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("Politika oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Politika oluşturulamadı" },
      { status: 500 },
    );
  }
}
