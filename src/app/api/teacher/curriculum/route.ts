import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== "TEACHER") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
    }

    // Get teacher profile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacherProfile) {
      return NextResponse.json({ error: "Öğretmen profili bulunamadı" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get("classId");

    let whereClause: any = { teacherId: teacherProfile.id };
    
    if (classId) {
      // Verify teacher is assigned to this class
      const assignment = await prisma.teacherAssignment.findFirst({
        where: {
          teacherId: teacherProfile.id,
          classId: classId,
          isActive: true,
        },
      });

      if (!assignment) {
        return NextResponse.json(
          { error: "Bu sınıfa atanmamışsınız" },
          { status: 403 }
        );
      }

      whereClause.classId = classId;
    }

    // Get curriculum topics
    const topics = await prisma.curriculumTopic.findMany({
      where: whereClause,
      orderBy: [
        { classId: "asc" },
        { orderIndex: "asc" },
      ],
      include: {
        class: {
          include: {
            school: true,
          },
        },
        lessons: {
          include: {
            lesson: {
              select: {
                id: true,
                date: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error("Müfredat konuları getirme hatası:", error);
    return NextResponse.json(
      { error: "Müfredat konuları getirilemedi" },
      { status: 500 }
    );
  }
}