import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createSchoolSchema = z.object({
  name: z.string().min(1, "Okul adı gerekli"),
  district: z.string().min(1, "İlçe gerekli"),
  logoUrl: z.string().url().optional().or(z.literal("")),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const schools = await prisma.school.findMany({
      orderBy: {
        createdAt: "desc",
      },
      include: {
        classes: true,
        principalProfile: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json(schools);
  } catch (error) {
    console.error("Okul listesi getirme hatası:", error);
    return NextResponse.json(
      { error: "Okullar listelenirken hata oluştu" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createSchoolSchema.parse(body);

    // Check if school name already exists
    const existingSchool = await prisma.school.findFirst({
      where: {
        name: validatedData.name,
      },
    });

    if (existingSchool) {
      return NextResponse.json(
        { error: "Bu isimde bir okul zaten mevcut" },
        { status: 400 }
      );
    }

    const school = await prisma.school.create({
      data: {
        name: validatedData.name,
        district: validatedData.district,
        logoUrl: validatedData.logoUrl || null,
      },
    });

    return NextResponse.json(school, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Okul oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Okul oluşturulurken hata oluştu" },
      { status: 500 }
    );
  }
}