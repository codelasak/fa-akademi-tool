import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function ClassesPage() {
  const classes = await prisma.class.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      school: true,
      students: true,
      lessonRecords: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Sınıf Yönetimi
        </h1>
        <Link
          href="/admin/classes/create"
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Yeni Sınıf Ekle
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Sınıf Adı
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Okul
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Ders
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Öğrenci Sayısı
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Yoklama Sistemi
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {classes.map((classItem: any) => (
                  <tr key={classItem.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {classItem.name}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {classItem.school.name}
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {classItem.subject}
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {classItem.students.length}
                    </td>
                    <td className="py-4">
                      <span
                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                          classItem.isAttendanceEnabled
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                        }`}
                      >
                        {classItem.isAttendanceEnabled ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/classes/${classItem.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Düzenle
                        </Link>
                        <Link
                          href={`/admin/classes/${classItem.id}/students`}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Öğrenciler
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

          {classes.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Henüz sınıf eklenmemiş.
              </p>
              <Link
                href="/admin/classes/create"
                className="mt-2 inline-block text-primary hover:underline"
              >
                İlk sınıfınızı ekleyin
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}