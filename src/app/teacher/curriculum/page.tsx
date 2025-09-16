import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TeacherCurriculumPage() {
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

  // Get teacher's assignments for class selection
  const assignments = await prisma.teacherAssignment.findMany({
    where: { 
      teacherId: teacherProfile.id,
      isActive: true 
    },
    include: {
      school: true,
      class: {
        include: {
          _count: {
            select: {
              students: true,
            },
          },
        },
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
  });

  // Get all curriculum topics for this teacher
  const curriculumTopics = await prisma.curriculumTopic.findMany({
    where: { teacherId: teacherProfile.id },
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

  // Group topics by class
  const topicsByClass = curriculumTopics.reduce((acc, topic) => {
    const classKey = topic.classId;
    if (!acc[classKey]) {
      acc[classKey] = [];
    }
    acc[classKey].push(topic);
    return acc;
  }, {} as Record<string, typeof curriculumTopics>);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Müfredat Yönetimi
        </h1>
        <Link
          href="/teacher/curriculum/create"
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Yeni Konu Ekle
        </Link>
      </div>

      {/* Current Assignments */}
      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Mevcut Sınıflarım
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {assignment.class.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {assignment.school.name}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      {assignment.class._count.students} öğrenci
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {topicsByClass[assignment.class.id]?.length || 0} müfredat konusu
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <Link
                      href={`/teacher/curriculum/class/${assignment.class.id}`}
                      className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                    >
                      Müfredatı Gör
                    </Link>
                    <Link
                      href={`/teacher/curriculum/create?classId=${assignment.class.id}`}
                      className="rounded-lg bg-green-100 px-3 py-1 text-sm text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
                    >
                      Konu Ekle
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {assignments.length === 0 && (
            <p className="text-center text-gray-500 dark:text-gray-400">
              Henüz sınıf atamanız yok.
            </p>
          )}
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
              href="/teacher/curriculum/create"
              className="text-sm text-primary hover:underline"
            >
              Yeni Konu Ekle
            </Link>
          </div>
        </div>
        <div className="p-6">
          {curriculumTopics.length === 0 ? (
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                Henüz müfredat konusu eklenmemiş.
              </p>
              <Link
                href="/teacher/curriculum/create"
                className="mt-4 inline-block text-primary hover:underline"
              >
                İlk konunuzu ekleyin
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(topicsByClass).map(([classId, topics]) => {
                const classInfo = topics[0]?.class;
                return (
                  <div key={classId}>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {classInfo?.name} - {classInfo?.school.name}
                      </h3>
                      <Link
                        href={`/teacher/curriculum/class/${classId}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Tümünü Gör ({topics.length} konu)
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {topics.slice(0, 4).map((topic: any) => (
                        <div
                          key={topic.id}
                          className="rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {topic.title}
                              </h4>
                              {topic.description && (
                                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                  {topic.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                                <span>Sıra: {topic.orderIndex}</span>
                                <span>
                                  {topic.lessons.length} derste işlenmiş
                                </span>
                              </div>
                            </div>
                            <div className="ml-4 flex flex-col space-y-1">
                              <Link
                                href={`/teacher/lessons/record?classId=${classId}&topicId=${topic.id}`}
                                className="rounded-lg bg-primary px-3 py-1 text-sm text-white hover:bg-opacity-90"
                              >
                                Ders Kaydet
                              </Link>
                              <Link
                                href={`/teacher/curriculum/${topic.id}/edit`}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                              >
                                Düzenle
                              </Link>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}