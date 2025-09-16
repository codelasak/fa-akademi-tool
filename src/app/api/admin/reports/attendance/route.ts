import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getEffectivePolicy } from "@/lib/attendance-policy";

const attendanceReportSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  schoolId: z.string().optional(),
  classId: z.string().optional(),
  format: z.enum(["json", "csv"]).default("json"),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !["ADMIN", "PRINCIPAL"].includes(session.user.role)) {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const data = attendanceReportSchema.parse(body);

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    // Build query filters
    const whereConditions: any = {
      lesson: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    };

    if (data.schoolId) {
      whereConditions.lesson.class = {
        schoolId: data.schoolId,
      };
    }

    if (data.classId) {
      whereConditions.lesson.classId = data.classId;
    }

    // Fetch attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: whereConditions,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            class: {
              select: {
                id: true,
                name: true,
                school: {
                  select: {
                    id: true,
                    name: true,
                    district: true,
                  },
                },
              },
            },
          },
        },
        lesson: {
          select: {
            id: true,
            date: true,
            hoursWorked: true,
            class: {
              select: {
                id: true,
                name: true,
                school: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            teacher: {
              select: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ lesson: { date: "desc" } }, { student: { lastName: "asc" } }],
    });

    // Group by student for analytics
    const studentStats = new Map();
    const classStats = new Map();
    const schoolStats = new Map();

    for (const record of attendanceRecords) {
      const studentId = record.student.id;
      const classId = record.student.class.id;
      const schoolId = record.student.class.school.id;

      // Student stats
      if (!studentStats.has(studentId)) {
        studentStats.set(studentId, {
          student: record.student,
          totalLessons: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
          attendanceRate: 0,
        });
      }

      const studentStat = studentStats.get(studentId);
      studentStat.totalLessons++;
      studentStat[record.status.toLowerCase()]++;
      studentStat.attendanceRate =
        ((studentStat.present + studentStat.late) / studentStat.totalLessons) *
        100;

      // Class stats
      if (!classStats.has(classId)) {
        classStats.set(classId, {
          class: record.student.class,
          totalStudents: new Set(),
          totalLessons: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        });
      }

      const classStat = classStats.get(classId);
      classStat.totalStudents.add(studentId);
      classStat.totalLessons++;
      classStat[record.status.toLowerCase()]++;

      // School stats
      if (!schoolStats.has(schoolId)) {
        schoolStats.set(schoolId, {
          school: record.student.class.school,
          totalStudents: new Set(),
          totalClasses: new Set(),
          totalLessons: 0,
          present: 0,
          absent: 0,
          late: 0,
          excused: 0,
        });
      }

      const schoolStat = schoolStats.get(schoolId);
      schoolStat.totalStudents.add(studentId);
      schoolStat.totalClasses.add(classId);
      schoolStat.totalLessons++;
      schoolStat[record.status.toLowerCase()]++;
    }

    // Apply policy-based concern detection
    const studentsWithConcerns = [];
    for (const [studentId, stats] of studentStats.entries()) {
      const policy = await getEffectivePolicy(
        stats.student.class.id,
        stats.student.class.school.id,
      );

      if (stats.attendanceRate < policy.concernThreshold) {
        studentsWithConcerns.push({
          ...stats,
          policyApplied: policy.name,
          concernThreshold: policy.concernThreshold,
          isConcern: true,
        });
      }
    }

    // Convert Maps to Arrays and calculate averages
    const studentAnalytics = Array.from(studentStats.values()).map((stat) => ({
      ...stat,
      attendanceRate: Number(stat.attendanceRate.toFixed(2)),
    }));

    const classAnalytics = Array.from(classStats.values()).map((stat) => ({
      ...stat,
      totalStudents: stat.totalStudents.size,
      averageAttendanceRate: Number(
        (((stat.present + stat.late) / stat.totalLessons) * 100).toFixed(2),
      ),
    }));

    const schoolAnalytics = Array.from(schoolStats.values()).map((stat) => ({
      ...stat,
      totalStudents: stat.totalStudents.size,
      totalClasses: stat.totalClasses.size,
      averageAttendanceRate: Number(
        (((stat.present + stat.late) / stat.totalLessons) * 100).toFixed(2),
      ),
    }));

    const report = {
      metadata: {
        reportType: "attendance",
        dateRange: {
          start: data.startDate,
          end: data.endDate,
        },
        generatedAt: new Date().toISOString(),
        generatedBy: session.user.email,
        filters: {
          schoolId: data.schoolId,
          classId: data.classId,
        },
      },
      summary: {
        totalRecords: attendanceRecords.length,
        totalStudents: studentStats.size,
        totalClasses: classStats.size,
        totalSchools: schoolStats.size,
        studentsWithConcerns: studentsWithConcerns.length,
        overallAttendanceRate:
          attendanceRecords.length > 0
            ? Number(
                (
                  (attendanceRecords.filter((r) =>
                    ["PRESENT", "LATE"].includes(r.status),
                  ).length /
                    attendanceRecords.length) *
                  100
                ).toFixed(2),
              )
            : 0,
      },
      analytics: {
        byStudent: studentAnalytics,
        byClass: classAnalytics,
        bySchool: schoolAnalytics,
        concernStudents: studentsWithConcerns,
      },
      rawData: data.format === "json" ? attendanceRecords : null,
    };

    if (data.format === "csv") {
      // Generate CSV format for raw data
      const csvHeaders = [
        "Date",
        "Student Name",
        "Class",
        "School",
        "Status",
        "Teacher",
        "Notes",
      ];

      const csvRows = attendanceRecords.map((record) => [
        new Date(record.lesson.date).toLocaleDateString("tr-TR"),
        `${record.student.firstName} ${record.student.lastName}`,
        record.student.class.name,
        record.student.class.school.name,
        record.status,
        `${record.lesson.teacher.user.firstName} ${record.lesson.teacher.user.lastName}`,
        record.notes || "",
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map((row) => row.map((cell) => `"${cell}"`).join(","))
        .join("\n");

      return new Response(csvContent, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="attendance-report-${data.startDate}-${data.endDate}.csv"`,
        },
      });
    }

    return NextResponse.json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 },
      );
    }

    console.error("Devamsızlık raporu oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Rapor oluşturulamadı" },
      { status: 500 },
    );
  }
}
