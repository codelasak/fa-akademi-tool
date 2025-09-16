import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== "PRINCIPAL") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Get principal's school information
    const principalProfile = await prisma.principalProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        school: {
          include: {
            classes: {
              where: { isActive: true },
              include: {
                students: {
                  where: { isActive: true }
                },
                teacherAssignments: {
                  where: { isActive: true },
                  include: {
                    teacher: {
                      include: {
                        user: true
                      }
                    }
                  }
                },
                lessons: {
                  orderBy: { date: 'desc' },
                  take: 5,
                  include: {
                    teacher: {
                      include: {
                        user: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!principalProfile) {
      return NextResponse.json({ error: "Principal profile not found" }, { status: 404 });
    }

    // Calculate statistics
    const school = principalProfile.school;
    const totalClasses = school.classes.length;
    const totalStudents = school.classes.reduce((sum: number, cls: any) => sum + cls.students.length, 0);
    const activeTeachers = new Set(
      school.classes.flatMap((cls: any) => 
        cls.teacherAssignments.map((assignment: any) => assignment.teacher.userId)
      )
    ).size;

    // Get recent attendance data for the school
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentAttendance = await prisma.attendance.findMany({
      where: {
        lesson: {
          class: {
            schoolId: school.id
          },
          date: {
            gte: oneWeekAgo
          }
        }
      },
      include: {
        lesson: {
          include: {
            class: true
          }
        },
        student: true
      }
    });

    // Calculate attendance rate
    const totalAttendanceRecords = recentAttendance.length;
    const presentRecords = recentAttendance.filter((att: any) => att.status === 'PRESENT').length;
    const attendanceRate = totalAttendanceRecords > 0 ? 
      (presentRecords / totalAttendanceRecords) * 100 : 0;

    // Get recent lessons
    const recentLessons = await prisma.lesson.findMany({
      where: {
        class: {
          schoolId: school.id
        },
        date: {
          gte: oneWeekAgo
        }
      },
      include: {
        class: true,
        teacher: {
          include: {
            user: true
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 10
    });

    // Get monthly financial data
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const monthlyPayment = await prisma.schoolPayment.findUnique({
      where: {
        schoolId_month_year: {
          schoolId: school.id,
          month: currentMonth,
          year: currentYear
        }
      }
    });

    // Get teacher wage data for this school's teachers
    const schoolTeacherIds = school.classes
      .flatMap((cls: any) => cls.teacherAssignments.map((assignment: any) => assignment.teacher.id));

    const monthlyWages = await prisma.teacherWageRecord.findMany({
      where: {
        teacherId: {
          in: schoolTeacherIds
        },
        month: currentMonth,
        year: currentYear
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        }
      }
    });

    const totalWages = monthlyWages.reduce((sum: number, wage: any) => sum + Number(wage.totalAmount), 0);
    const paidWages = monthlyWages.reduce((sum: number, wage: any) => sum + Number(wage.paidAmount), 0);

    const dashboardData = {
      school: {
        id: school.id,
        name: school.name,
        district: school.district,
        logoUrl: school.logoUrl
      },
      statistics: {
        totalClasses,
        totalStudents,
        activeTeachers,
        attendanceRate: Math.round(attendanceRate * 10) / 10
      },
      recentActivity: {
        lessons: recentLessons.map((lesson: any) => ({
          id: lesson.id,
          date: lesson.date,
          className: lesson.class.name,
          subject: lesson.class.subject,
          teacherName: `${lesson.teacher.user.firstName} ${lesson.teacher.user.lastName}`,
          hoursWorked: Number(lesson.hoursWorked),
          isCancelled: lesson.isCancelled
        }))
      },
      financial: {
        monthlyPayment: monthlyPayment ? {
          amount: Number(monthlyPayment.agreedAmount),
          status: monthlyPayment.status,
          dueDate: monthlyPayment.paymentDate || new Date(monthlyPayment.year, monthlyPayment.month - 1, 1) // Use paymentDate or compute from month/year
        } : null,
        wages: {
          total: totalWages,
          paid: paidWages,
          pending: totalWages - paidWages,
          count: monthlyWages.length
        }
      },
      classes: school.classes.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        subject: cls.subject,
        studentCount: cls.students.length,
        teacherCount: cls.teacherAssignments.length,
        isAttendanceEnabled: cls.isAttendanceEnabled
      }))
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error("Principal dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}