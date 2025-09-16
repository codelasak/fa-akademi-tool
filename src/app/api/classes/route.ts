import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createClassSchema = z.object({
  name: z.string().min(1, "Sınıf adı gerekli"),
  subject: z.string().min(1, "Ders adı gerekli"),
  schoolId: z.string().min(1, "Okul seçimi gerekli"),
  isAttendanceEnabled: z.boolean().default(true),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }
    const classes = await prisma.class.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        school: true,
        students: true,
        lessons: true,
      },
    });

    return NextResponse.json(classes);
  } catch (error) {
    console.error("Sınıf listesi getirme hatası:", error);
    return NextResponse.json(
      { error: "Sınıf listesi getirilemedi" },
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
    const data = createClassSchema.parse(body);

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

    // Check if class name already exists in the same school
    const existingClass = await prisma.class.findFirst({
      where: {
        name: data.name,
        schoolId: data.schoolId,
      },
    });

    if (existingClass) {
      return NextResponse.json(
        { error: "Bu okulda aynı isimde bir sınıf zaten var" },
        { status: 409 },
      );
    }

    const classItem = await prisma.class.create({
      data: {
        name: data.name,
        subject: data.subject,
        schoolId: data.schoolId,
        isAttendanceEnabled: data.isAttendanceEnabled,
      },
      include: {
        school: true,
        students: true,
        lessons: true,
      },
    });

    return NextResponse.json(classItem, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("Sınıf oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Sınıf oluşturulurken hata oluştu" },
      { status: 500 },
    );
  }
}
