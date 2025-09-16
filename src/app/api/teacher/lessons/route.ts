import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const createLessonSchema = z.object({
  classId: z.string().min(1, "Sınıf seçimi gerekli"),
  date: z.string().min(1, "Tarih gerekli"),
  hoursWorked: z.number().positive("Çalışma saati pozitif olmalı"),
  notes: z.string().optional(),
  topicIds: z.array(z.string()).optional(),
  attendance: z.record(z.string(), z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"])).optional(),
});

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

    // Get teacher's lessons
    const lessons = await prisma.lesson.findMany({
      where: { teacherId: teacherProfile.id },
      orderBy: { date: "desc" },
      include: {
        class: {
          include: {
            school: true,
          },
        },
        topics: {
          include: {
            topic: true,
          },
        },
        attendance: {
          include: {
            student: true,
          },
        },
      },
    });

    return NextResponse.json(lessons);
  } catch (error) {
    console.error("Öğretmen dersleri getirme hatası:", error);
    return NextResponse.json(
      { error: "Dersler getirilemedi" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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

    const body = await request.json();
    const data = createLessonSchema.parse(body);

    // Verify teacher is assigned to this class
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacherProfile.id,
        classId: data.classId,
        isActive: true,
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Bu sınıfa atanmamışsınız" },
        { status: 403 }
      );
    }

    // Create lesson with attendance in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create lesson
      const lesson = await tx.lesson.create({
        data: {
          teacherId: teacherProfile.id,
          classId: data.classId,
          date: new Date(data.date),
          hoursWorked: data.hoursWorked,
          notes: data.notes || "",
        },
        include: {
          class: {
            include: {
              school: true,
            },
          },
        },
      });

      // Link curriculum topics if provided
      if (data.topicIds && data.topicIds.length > 0) {
        await tx.lessonTopic.createMany({
          data: data.topicIds.map(topicId => ({
            lessonId: lesson.id,
            topicId: topicId,
          })),
        });
      }

      // Create attendance records if provided
      if (data.attendance) {
        // Fetch class roster to validate student IDs belong to this class
        const classStudents = await tx.student.findMany({
          where: { classId: data.classId },
          select: { id: true },
        });
        
        const validStudentIds = new Set(classStudents.map(s => s.id));
        
        // Filter attendance to only include valid student IDs
        const validAttendanceEntries = Object.entries(data.attendance).filter(([studentId]) => 
          validStudentIds.has(studentId)
        );
        
        if (validAttendanceEntries.length > 0) {
          const attendanceData = validAttendanceEntries.map(([studentId, status]) => ({
            lessonId: lesson.id,
            studentId: studentId,
            status: status as "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
          }));

          await tx.attendance.createMany({
            data: attendanceData,
          });
        }
        
        // Log warning if some student IDs were invalid (for debugging)
        const invalidIds = Object.keys(data.attendance).filter(id => !validStudentIds.has(id));
        if (invalidIds.length > 0) {
          console.warn(`Invalid student IDs submitted for class ${data.classId}:`, invalidIds);
        }
      }

      return lesson;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Ders kaydetme hatası:", error);
    return NextResponse.json(
      { error: "Ders kaydedilemedi" },
      { status: 500 }
    );
  }
}