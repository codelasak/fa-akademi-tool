import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const updatePolicySchema = z.object({
  name: z.string().min(1, "Politika adı gerekli").optional(),
  description: z.string().optional(),
  concernThreshold: z.number().min(1).max(100, "Eşik %1-100 arasında olmalı").optional(),
  lateToleranceMinutes: z.number().min(0).max(180, "Tolerans 0-180 dakika arası olmalı").optional(),
  maxAbsences: z.number().min(1).max(365, "Maksimum devamsızlık 1-365 arası olmalı").optional(),
  autoExcuseEnabled: z.boolean().optional(),
  autoExcuseReasons: z.array(z.string()).optional(),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const policy = await prisma.attendancePolicy.findUnique({
      where: { id: params.id },
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

    if (!policy) {
      return NextResponse.json({ error: "Politika bulunamadı" }, { status: 404 });
    }

    return NextResponse.json(policy);
  } catch (error) {
    console.error("Politika getirme hatası:", error);
    return NextResponse.json(
      { error: "Politika getirilemedi" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const data = updatePolicySchema.parse(body);

    // Check if policy exists
    const existingPolicy = await prisma.attendancePolicy.findUnique({
      where: { id: params.id },
    });

    if (!existingPolicy) {
      return NextResponse.json({ error: "Politika bulunamadı" }, { status: 404 });
    }

    const policy = await prisma.attendancePolicy.update({
      where: { id: params.id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.concernThreshold && { concernThreshold: data.concernThreshold }),
        ...(data.lateToleranceMinutes !== undefined && { lateToleranceMinutes: data.lateToleranceMinutes }),
        ...(data.maxAbsences && { maxAbsences: data.maxAbsences }),
        ...(data.autoExcuseEnabled !== undefined && { autoExcuseEnabled: data.autoExcuseEnabled }),
        ...(data.autoExcuseReasons && { autoExcuseReasons: data.autoExcuseReasons }),
        ...(data.effectiveFrom && { effectiveFrom: new Date(data.effectiveFrom) }),
        ...(data.effectiveTo !== undefined && { effectiveTo: data.effectiveTo ? new Date(data.effectiveTo) : null }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        updatedAt: new Date(),
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

    return NextResponse.json(policy);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Politika güncelleme hatası:", error);
    return NextResponse.json(
      { error: "Politika güncellenemedi" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    // Check if policy exists
    const existingPolicy = await prisma.attendancePolicy.findUnique({
      where: { id: params.id },
    });

    if (!existingPolicy) {
      return NextResponse.json({ error: "Politika bulunamadı" }, { status: 404 });
    }

    // Soft delete by setting isActive to false and effectiveTo to now
    const policy = await prisma.attendancePolicy.update({
      where: { id: params.id },
      data: {
        isActive: false,
        effectiveTo: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Politika başarıyla devre dışı bırakıldı", policy });
  } catch (error) {
    console.error("Politika silme hatası:", error);
    return NextResponse.json(
      { error: "Politika silinemedi" },
      { status: 500 }
    );
  }
}