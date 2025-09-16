import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { getEffectivePolicy } from "@/lib/attendance-policy";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ClassAttendanceDetailPage({ params }: Props) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/auth/sign-in");
  }

  // Get teacher profile
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!teacherProfile) {
    redirect("/auth/sign-in");
  }

  // Verify teacher is assigned to this class
  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: teacherProfile.id,
      classId: id,
      isActive: true,
    },
    include: {
      school: true,
      class: {
        include: {
          students: {
            include: {
              attendance: {
                include: {
                  lesson: {
                    select: {
                      id: true,
                      date: true,
                      teacherId: true,
                    },
                  },
                },
                where: {
                  lesson: {
                    teacherId: teacherProfile.id,
                  },
                },
                orderBy: {
                  lesson: {
                    date: "desc",
                  },
                },
              },
            },
            orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
          },
          lessons: {
            where: {
              teacherId: teacherProfile.id,
            },
            include: {
              attendance: {
                include: {
                  student: true,
                },
              },
            },
            orderBy: {
              date: "desc",
            },
          },
        },
      },
    },
  });

  if (!assignment) {
    redirect("/teacher/attendance");
  }

  // Get effective policy for this class
  const policy = await getEffectivePolicy(
    assignment.class.id,
    assignment.school.id,
  );

  // Calculate student statistics
  const studentStats = assignment.class.students.map((student) => {
    const attendances = student.attendance;
    const totalLessons = attendances.length;

    const presentCount = attendances.filter(
      (a) => a.status === "PRESENT",
    ).length;
    const absentCount = attendances.filter((a) => a.status === "ABSENT").length;
    const lateCount = attendances.filter((a) => a.status === "LATE").length;
    const excusedCount = attendances.filter(
      (a) => a.status === "EXCUSED",
    ).length;

    const attendanceRate =
      totalLessons > 0
        ? ((presentCount + lateCount + excusedCount) / totalLessons) * 100
        : 0;

    return {
      student,
      totalLessons,
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      attendanceRate: Math.round(attendanceRate),
    };
  });

  // Recent lessons with attendance
  const recentLessons = assignment.class.lessons.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark dark:text-white">
            {assignment.class.name} - Devamsızlık Detayları
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {assignment.school.name} • {assignment.class.students.length}{" "}
            öğrenci
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            href={`/teacher/attendance/class/${id}/take`}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Yoklama Al
          </Link>
          <Link
            href="/teacher/attendance"
            className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Geri Dön
          </Link>
        </div>
      </div>

      {/* Class Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.239"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Öğrenci Sayısı
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {assignment.class.students.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Ders
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {assignment.class.lessons.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900">
              <svg
                className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sorunlu Öğrenci
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {
                  studentStats.filter(
                    (s) => s.attendanceRate < policy.concernThreshold,
                  ).length
                }
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <svg
                className="h-6 w-6 text-purple-600 dark:text-purple-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Ortalama Devam
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {studentStats.length > 0
                  ? Math.round(
                      studentStats.reduce(
                        (acc, s) => acc + s.attendanceRate,
                        0,
                      ) / studentStats.length,
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Öğrenci Devamsızlık Durumu
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {studentStats.map((stat) => (
              <div
                key={stat.student.id}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {stat.student.firstName} {stat.student.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.totalLessons} ders kaydı
                    </p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-600 dark:text-green-400">
                          {stat.presentCount}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Mevcut
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-600 dark:text-red-400">
                          {stat.absentCount}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Devamsız
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-yellow-600 dark:text-yellow-400">
                          {stat.lateCount}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Geç
                        </p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                          {stat.excusedCount}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Mazeret
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p
                        className={`text-lg font-bold ${
                          stat.attendanceRate >= 90
                            ? "text-green-600 dark:text-green-400"
                            : stat.attendanceRate >= 80
                              ? "text-yellow-600 dark:text-yellow-400"
                              : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        %{stat.attendanceRate}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        devam oranı
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div
                      className={`h-full ${
                        stat.attendanceRate >= 90
                          ? "bg-green-500"
                          : stat.attendanceRate >= 80
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${stat.attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {studentStats.length === 0 && (
            <div className="text-center">
              <p className="text-lg text-gray-500 dark:text-gray-400">
                Bu sınıfta öğrenci bulunmuyor.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Lessons */}
      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Son Dersler ({recentLessons.length})
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {recentLessons.map((lesson) => {
              const totalStudents = assignment.class.students.length;
              const attendanceCount = lesson.attendance.length;
              const presentCount = lesson.attendance.filter(
                (a) => a.status === "PRESENT",
              ).length;
              const absentCount = lesson.attendance.filter(
                (a) => a.status === "ABSENT",
              ).length;

              return (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {new Date(lesson.date).toLocaleDateString("tr-TR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {attendanceCount}/{totalStudents} yoklama alındı
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-green-600 dark:text-green-400">
                      {presentCount} mevcut
                    </span>
                    <span className="text-red-600 dark:text-red-400">
                      {absentCount} devamsız
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {recentLessons.length === 0 && (
            <div className="text-center">
              <p className="text-lg text-gray-500 dark:text-gray-400">
                Henüz ders kaydı bulunmuyor.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
