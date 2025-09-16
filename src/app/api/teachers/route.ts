import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

const createTeacherSchema = z.object({
  firstName: z.string().min(1, "Ad gerekli"),
  lastName: z.string().min(1, "Soyad gerekli"),
  email: z.string().email("Geçerli bir e-posta adresi girin"),
  username: z.string().min(1, "Kullanıcı adı gerekli"),
  password: z.string().min(6, "Şifre en az 6 karakter olmalı"),
  hourlyRate: z.number().positive("Saatlik ücret pozitif olmalı"),
  specializations: z.array(z.string()).min(1, "En az bir uzmanlik alanı seçin"),
  bio: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const teachers = await prisma.teacherProfile.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true,
        assignments: {
          include: {
            school: true,
            class: true,
          },
        },
        lessons: true,
        wageRecords: true,
      },
    });

    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Öğretmen listesi getirme hatası:", error);
    return NextResponse.json(
      { error: "Öğretmen listesi getirilemedi" },
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
    const data = createTeacherSchema.parse(body);

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      return NextResponse.json(
        { error: "Bu e-posta adresi zaten kullanımda" },
        { status: 409 },
      );
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      return NextResponse.json(
        { error: "Bu kullanıcı adı zaten kullanımda" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Create user and teacher profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          username: data.username,
          password: hashedPassword,
          role: "TEACHER",
        },
      });

      // Create teacher profile
      const teacherProfile = await tx.teacherProfile.create({
        data: {
          userId: user.id,
          hourlyRate: data.hourlyRate,
          specializations: data.specializations,
          bio: data.bio || "",
        },
        include: {
          user: true,
          assignments: {
            include: {
              school: true,
              class: true,
            },
          },
          lessons: true,
          wageRecords: true,
        },
      });

      return teacherProfile;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("Öğretmen oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Öğretmen oluşturulurken hata oluştu" },
      { status: 500 },
    );
  }
}
