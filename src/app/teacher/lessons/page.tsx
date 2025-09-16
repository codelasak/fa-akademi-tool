import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TeacherLessonsPage() {
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

  // Get all lessons for this teacher
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

  // Group lessons by month for better organization
  const lessonsByMonth = lessons.reduce(
    (acc, lesson) => {
      const monthKey = new Date(lesson.date).toLocaleDateString("tr-TR", {
        year: "numeric",
        month: "long",
      });
      if (!acc[monthKey]) {
        acc[monthKey] = [];
      }
      acc[monthKey].push(lesson);
      return acc;
    },
    {} as Record<string, typeof lessons>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Ders Kayıtlarım
        </h1>
        <Link
          href="/teacher/lessons/record"
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Yeni Ders Kaydet
        </Link>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Ders
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {lessons.length}
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
                Toplam Saat
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {lessons
                  .reduce((sum, lesson) => sum + Number(lesson.hoursWorked), 0)
                  .toFixed(1)}
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                İptal Edilen
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {lessons.filter((lesson) => lesson.isCancelled).length}
              </p>
            </div>
            <div className="rounded-full bg-red-100 p-3 dark:bg-red-900">
              <svg
                className="h-6 w-6 text-red-600 dark:text-red-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 4h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.412.608-2.008L17 13m-5 1V9a2 2 0 012-2h1"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Lessons by Month */}
      <div className="space-y-6">
        {Object.entries(lessonsByMonth).length === 0 ? (
          <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
            <div className="p-8 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
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
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                Henüz ders kaydınız yok.
              </p>
              <Link
                href="/teacher/lessons/record"
                className="mt-4 inline-block text-primary hover:underline"
              >
                İlk dersinizi kaydedin
              </Link>
            </div>
          </div>
        ) : (
          Object.entries(lessonsByMonth).map(([month, monthLessons]) => (
            <div
              key={month}
              className="rounded-lg bg-white shadow-card dark:bg-gray-dark"
            >
              <div className="border-b border-gray-200 p-6 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-dark dark:text-white">
                  {month} ({monthLessons.length} ders,{" "}
                  {monthLessons
                    .reduce(
                      (sum, lesson) => sum + Number(lesson.hoursWorked),
                      0,
                    )
                    .toFixed(1)}{" "}
                  saat)
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {monthLessons.map((lesson: any) => (
                    <div
                      key={lesson.id}
                      className={`rounded-lg border p-4 ${
                        lesson.isCancelled
                          ? "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
                          : "border-gray-200 dark:border-gray-700"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 dark:text-gray-100">
                              {lesson.class.name} - {lesson.class.school.name}
                            </h3>
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

                          <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-600 dark:text-gray-400 md:grid-cols-3">
                            <div>
                              <strong>Tarih:</strong>{" "}
                              {new Date(lesson.date).toLocaleDateString(
                                "tr-TR",
                              )}
                            </div>
                            <div>
                              <strong>Süre:</strong>{" "}
                              {lesson.hoursWorked.toString()} saat
                            </div>
                            <div>
                              <strong>Yoklama:</strong>{" "}
                              {
                                lesson.attendance.filter(
                                  (a: any) => a.status === "PRESENT",
                                ).length
                              }
                              /{lesson.attendance.length} öğrenci
                            </div>
                          </div>

                          {lesson.topics.length > 0 && (
                            <div className="mt-2">
                              <strong className="text-sm text-gray-700 dark:text-gray-300">
                                İşlenen Konular:
                              </strong>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {lesson.topics.map((lessonTopic: any) => (
                                  <span
                                    key={lessonTopic.topic.id}
                                    className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                  >
                                    {lessonTopic.topic.title}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {lesson.notes && (
                            <div className="mt-2">
                              <strong className="text-sm text-gray-700 dark:text-gray-300">
                                Notlar:
                              </strong>
                              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                {lesson.notes}
                              </p>
                            </div>
                          )}

                          {lesson.isCancelled && lesson.cancellationReason && (
                            <div className="mt-2">
                              <strong className="text-sm text-red-700 dark:text-red-300">
                                İptal Nedeni:
                              </strong>
                              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                {lesson.cancellationReason}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="ml-4 flex space-x-2">
                          <Link
                            href={`/teacher/lessons/${lesson.id}/edit`}
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            Düzenle
                          </Link>
                          <Link
                            href={`/teacher/lessons/${lesson.id}/attendance`}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Yoklama
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
