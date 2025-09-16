import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createStudentSchema = z.object({
  firstName: z.string().min(1, "Ad gerekli"),
  lastName: z.string().min(1, "Soyad gerekli"),
  classId: z.string().min(1, "Sınıf seçimi gerekli"),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }
    const students = await prisma.student.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        class: {
          include: {
            school: true,
          },
        },
        attendance: true,
      },
    });

    return NextResponse.json(students);
  } catch (error) {
    console.error("Öğrenci listesi getirme hatası:", error);
    return NextResponse.json(
      { error: "Öğrenci listesi getirilemedi" },
      { status: 500 }
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
    const data = createStudentSchema.parse(body);

    // Check if class exists
    const classItem = await prisma.class.findUnique({
      where: { id: data.classId },
      include: {
        school: true,
      },
    });

    if (!classItem) {
      return NextResponse.json(
        { error: "Seçilen sınıf bulunamadı" },
        { status: 404 }
      );
    }

    // Check if student with same name already exists in the same class
    const existingStudent = await prisma.student.findFirst({
      where: {
        firstName: data.firstName,
        lastName: data.lastName,
        classId: data.classId,
      },
    });

    if (existingStudent) {
      return NextResponse.json(
        { error: "Bu sınıfta aynı isimde bir öğrenci zaten var" },
        { status: 409 }
      );
    }

    const student = await prisma.student.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        classId: data.classId,
      },
      include: {
        class: {
          include: {
            school: true,
          },
        },
        attendance: true,
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Öğrenci oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Öğrenci oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
}