import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      class: {
        include: {
          school: true,
        },
      },
      attendance: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Öğrenci Yönetimi
        </h1>
        <Link
          href="/admin/students/create"
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Yeni Öğrenci Ekle
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Ad Soyad
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Sınıf
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Okul
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Yoklama Kayıtları
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
                {students.map((student: any) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {student.firstName} {student.lastName}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {student.class.name}
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {student.class.school.name}
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {student.attendance.length} kayıt
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          student.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {student.isActive ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/students/${student.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Düzenle
                        </Link>
                        <Link
                          href={`/admin/students/${student.id}/attendance`}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Yoklama
                        </Link>
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

          {students.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Henüz öğrenci eklenmemiş.
              </p>
              <Link
                href="/admin/students/create"
                className="mt-2 inline-block text-primary hover:underline"
              >
                İlk öğrencinizi ekleyin
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
