import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TeacherDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/auth/sign-in");
  }

  // Get teacher profile and data
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      user: true,
      assignments: {
        where: { isActive: true },
        include: {
          school: true,
          class: {
            include: {
              students: true,
            },
          },
        },
      },
      lessons: {
        take: 5,
        orderBy: { date: "desc" },
        include: {
          class: {
            include: {
              school: true,
            },
          },
        },
      },
      curriculumTopics: {
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          class: {
            include: {
              school: true,
            },
          },
        },
      },
    },
  });

  if (!teacherProfile) {
    redirect("/auth/sign-in");
  }

  // Calculate statistics
  const totalAssignments = teacherProfile.assignments.length;
  const totalStudents = teacherProfile.assignments.reduce(
    (sum, assignment) => sum + assignment.class.students.length,
    0,
  );
  const thisMonthLessons = await prisma.lesson.count({
    where: {
      teacherId: teacherProfile.id,
      date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });

  const thisMonthHours = await prisma.lesson.aggregate({
    where: {
      teacherId: teacherProfile.id,
      date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
    _sum: {
      hoursWorked: true,
    },
  });

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-dark dark:text-white">
                Hoş Geldiniz, {teacherProfile.user.firstName}{" "}
                {teacherProfile.user.lastName}
              </h1>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                Uzmanlik Alanları: {teacherProfile.specializations.join(", ")}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Saatlik Ücret
              </p>
              <p className="text-xl font-bold text-primary">
                ₺{teacherProfile.hourlyRate.toString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Aktif Atamalar
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {totalAssignments}
              </p>
            </div>
            <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
              <svg
                className="h-6 w-6 text-blue-600 dark:text-blue-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Öğrenci
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {totalStudents}
              </p>
            </div>
            <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
              <svg
                className="h-6 w-6 text-green-600 dark:text-green-300"
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
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bu Ay Ders Sayısı
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {thisMonthLessons}
              </p>
            </div>
            <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
              <svg
                className="h-6 w-6 text-yellow-600 dark:text-yellow-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Bu Ay Çalışılan Saat
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {thisMonthHours._sum.hoursWorked?.toString() || "0"}
              </p>
            </div>
            <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
              <svg
                className="h-6 w-6 text-purple-600 dark:text-purple-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-dark dark:text-white">
              Hızlı İşlemler
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Link
                href="/teacher/lessons/record"
                className="flex items-center rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-primary dark:border-gray-600 dark:hover:border-primary"
              >
                <div className="w-full">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Ders Kaydet
                  </p>
                </div>
              </Link>

              <Link
                href="/teacher/curriculum"
                className="flex items-center rounded-lg border-2 border-dashed border-gray-300 p-4 text-center hover:border-primary dark:border-gray-600 dark:hover:border-primary"
              >
                <div className="w-full">
                  <svg
                    className="mx-auto h-8 w-8 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                    Müfredat Yönet
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Lessons */}
        <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dark dark:text-white">
                Son Dersler
              </h2>
              <Link
                href="/teacher/lessons"
                className="text-sm text-primary hover:underline"
              >
                Tümünü Gör
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {teacherProfile.lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 dark:border-gray-700"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {lesson.class.name} - {lesson.class.school.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(lesson.date).toLocaleDateString("tr-TR")} -{" "}
                      {lesson.hoursWorked.toString()} saat
                    </p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                      lesson.isCancelled
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    }`}
                  >
                    {lesson.isCancelled ? "İptal" : "Tamamlandı"}
                  </span>
                </div>
              ))}
              {teacherProfile.lessons.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Henüz ders kaydı yok.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assignments and Curriculum Topics */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Current Assignments */}
        <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-dark dark:text-white">
              Mevcut Atamalarım
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {teacherProfile.assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {assignment.class.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {assignment.school.name} - {assignment.school.district}
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        {assignment.class.students.length} öğrenci
                      </p>
                    </div>
                    <Link
                      href={`/teacher/lessons/record?classId=${assignment.class.id}`}
                      className="rounded-lg bg-primary px-3 py-1 text-sm text-white hover:bg-opacity-90"
                    >
                      Ders Kaydet
                    </Link>
                  </div>
                </div>
              ))}
              {teacherProfile.assignments.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Henüz atama yok.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Recent Curriculum Topics */}
        <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-dark dark:text-white">
                Son Müfredat Konuları
              </h2>
              <Link
                href="/teacher/curriculum"
                className="text-sm text-primary hover:underline"
              >
                Müfredat Yönet
              </Link>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {teacherProfile.curriculumTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="border-b border-gray-100 pb-4 last:border-0 dark:border-gray-700"
                >
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {topic.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {topic.class.name} - {topic.class.school.name}
                  </p>
                  {topic.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {topic.description}
                    </p>
                  )}
                </div>
              ))}
              {teacherProfile.curriculumTopics.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  Henüz müfredat konusu yok.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
