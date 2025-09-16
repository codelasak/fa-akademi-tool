import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TeachersPage() {
  const teachers = await prisma.teacherProfile.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: true,
      assignments: {
        include: {
          school: true,
          class: true,
        },
      },
      lessons: true,
      wageRecords: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Öğretmen Yönetimi
        </h1>
        <Link
          href="/admin/teachers/create"
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Yeni Öğretmen Ekle
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
                    E-posta
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Uzmanlik Alanları
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Saatlik Ücret
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Atama Sayısı
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Toplam Ders
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher: any) => (
                  <tr key={teacher.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {teacher.user.firstName} {teacher.user.lastName}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {teacher.user.email}
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      <div className="flex flex-wrap gap-1">
                        {teacher.specializations.slice(0, 2).map((spec: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex rounded-full bg-blue-100 px-2 text-xs font-semibold leading-5 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                          >
                            {spec}
                          </span>
                        ))}
                        {teacher.specializations.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{teacher.specializations.length - 2} daha
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      ₺{teacher.hourlyRate.toString()}/saat
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {teacher.assignments.filter((a: any) => a.isActive).length} aktif atama
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {teacher.lessons.length} ders
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/teachers/${teacher.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Düzenle
                        </Link>
                        <Link
                          href={`/admin/teachers/${teacher.id}/assignments`}
                          className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                        >
                          Atamalar
                        </Link>
                        <Link
                          href={`/admin/teachers/${teacher.id}/wages`}
                          className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300"
                        >
                          Hakedişler
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

          {teachers.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Henüz öğretmen eklenmemiş.
              </p>
              <Link
                href="/admin/teachers/create"
                className="mt-2 inline-block text-primary hover:underline"
              >
                İlk öğretmeninizi ekleyin
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}