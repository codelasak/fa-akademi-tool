import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TeacherAssignmentsPage() {
  const assignments = await prisma.teacherAssignment.findMany({
    orderBy: {
      assignedAt: "desc",
    },
    include: {
      teacher: {
        include: {
          user: true,
        },
      },
      school: true,
      class: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Öğretmen Atamaları
        </h1>
        <Link
          href="/admin/teacher-assignments/create"
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Yeni Atama Yap
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Öğretmen
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Okul
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Sınıf
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Atama Tarihi
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Durum
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment: any) => (
                  <tr key={assignment.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {assignment.teacher.user.firstName} {assignment.teacher.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {assignment.teacher.user.email}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      <div className="font-medium">{assignment.school.name}</div>
                      <div className="text-gray-500 dark:text-gray-400">{assignment.school.district}</div>
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      <div className="font-medium">{assignment.class.name}</div>
                      <div className="text-gray-500 dark:text-gray-400">{assignment.class.subject}</div>
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {new Date(assignment.assignedAt).toLocaleDateString('tr-TR')}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          assignment.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {assignment.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/teacher-assignments/${assignment.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Düzenle
                        </Link>
                        <button 
                          className={`${
                            assignment.isActive 
                              ? "text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                              : "text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          }`}
                        >
                          {assignment.isActive ? "Pasifleştir" : "Aktifleştir"}
                        </button>
                        <button className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300">
                          Sil
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {assignments.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Henüz öğretmen ataması yapılmamış.
              </p>
              <Link
                href="/admin/teacher-assignments/create"
                className="mt-2 inline-block text-primary hover:underline"
              >
                İlk atamanızı yapın
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}