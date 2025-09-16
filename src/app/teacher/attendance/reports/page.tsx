import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function AttendanceReportsPage() {
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
          },
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Devamsızlık Raporları
        </h1>
        <Link
          href="/teacher/attendance"
          className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          Devamsızlık Yönetimine Dön
        </Link>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Sınıf Raporları
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sınıf bazlı devamsızlık durumu
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/teacher/attendance/reports/class"
              className="w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
            >
              Rapor Görüntüle
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Öğrenci Raporları
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Bireysel devamsızlık takibi
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/teacher/attendance/reports/student"
              className="w-full rounded-lg bg-green-600 px-4 py-2 text-center text-white hover:bg-green-700"
            >
              Rapor Görüntüle
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Trend Analizi
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Devamsızlık eğilimleri
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Link
              href="/teacher/attendance/reports/trends"
              className="w-full rounded-lg bg-purple-600 px-4 py-2 text-center text-white hover:bg-purple-700"
            >
              Rapor Görüntüle
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Rapor Özeti
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const totalStudents = assignment.class.students.length;
              const allAttendances = assignment.class.students.flatMap(s => s.attendance);
              const attendanceRate = allAttendances.length > 0 ? 
                (allAttendances.filter(a => a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED").length / allAttendances.length * 100) : 0;
              
              return (
                <div key={assignment.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {assignment.class.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {assignment.school.name} • {totalStudents} öğrenci
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      %{Math.round(attendanceRate)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      devam oranı
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {assignments.length === 0 && (
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                Henüz sınıf atamanız yok.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}