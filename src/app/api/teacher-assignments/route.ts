import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createAssignmentSchema = z.object({
  teacherId: z.string().min(1, "Öğretmen seçimi gerekli"),
  schoolId: z.string().min(1, "Okul seçimi gerekli"),
  classId: z.string().min(1, "Sınıf seçimi gerekli"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const assignments = await prisma.teacherAssignment.findMany({
      orderBy: {
        assignedAt: "desc",
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        school: true,
        class: true,
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Öğretmen atamaları listesi getirme hatası:", error);
    return NextResponse.json(
      { error: "Öğretmen atamaları listesi getirilemedi" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const data = createAssignmentSchema.parse(body);

    // Check if teacher exists
    const teacher = await prisma.teacherProfile.findUnique({
      where: { id: data.teacherId },
      include: { user: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Seçilen öğretmen bulunamadı" },
        { status: 404 },
      );
    }

    // Check if school exists
    const school = await prisma.school.findUnique({
      where: { id: data.schoolId },
    });

    if (!school) {
      return NextResponse.json(
        { error: "Seçilen okul bulunamadı" },
        { status: 404 },
      );
    }

    // Check if class exists and belongs to the selected school
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: { school: true },
    });

    if (!classItem) {
      return NextResponse.json(
        { error: "Seçilen sınıf bulunamadı" },
        { status: 404 },
      );
    }

    if (classItem.schoolId !== data.schoolId) {
      return NextResponse.json(
        { error: "Seçilen sınıf, seçilen okula ait değil" },
        { status: 400 },
      );
    }

    // Check if this teacher is already assigned to this class
    const existingAssignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: data.teacherId,
        classId: data.classId,
        isActive: true,
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: "Bu öğretmen zaten bu sınıfa atanmış" },
        { status: 409 },
      );
    }

    // Create teacher assignment
    const assignment = await prisma.teacherAssignment.create({
      data: {
        teacherId: data.teacherId,
        schoolId: data.schoolId,
        classId: data.classId,
        isActive: true,
      },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
        school: true,
        class: true,
      },
    });

    return NextResponse.json(assignment, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("Öğretmen ataması oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Öğretmen ataması oluşturulurken hata oluştu" },
      { status: 500 },
    );
  }
}
