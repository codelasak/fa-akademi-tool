import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
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

    // Get teacher's active assignments
    const assignments = await prisma.teacherAssignment.findMany({
      where: { 
        teacherId: teacherProfile.id,
        isActive: true 
      },
      include: {
        school: true,
        class: {
          include: {
            students: true,
          },
        },
      },
      orderBy: {
        assignedAt: "desc",
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("Öğretmen atamaları getirme hatası:", error);
    return NextResponse.json(
      { error: "Atamalar getirilemedi" },
      { status: 500 }
    );
  }
}