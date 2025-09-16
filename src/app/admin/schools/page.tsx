import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function SchoolsPage() {
  const schools = await prisma.school.findMany({
    orderBy: {
      createdAt: "desc",
    },
    include: {
      classes: true,
      principalProfile: {
        include: {
          user: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Okul Yönetimi
        </h1>
        <Link
          href="/admin/schools/create"
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Yeni Okul Ekle
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Okul
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    İlçe
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Sınıf Sayısı
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    Okul Müdürü
                  </th>
                  <th className="pb-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody>
                {schools.map((school: any) => (
                  <tr key={school.id} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-4">
                      <div className="flex items-center space-x-3">
                        {school.logoUrl && (
                          <img
                            src={school.logoUrl}
                            alt={school.name}
                            className="h-10 w-10 rounded-full object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {school.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {school.district}
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {school.classes.length}
                    </td>
                    <td className="py-4 text-sm text-gray-900 dark:text-gray-100">
                      {school.principalProfile 
                        ? `${school.principalProfile.user.firstName} ${school.principalProfile.user.lastName}`
                        : "Atanmamış"
                      }
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/schools/${school.id}/edit`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Düzenle
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

          {schools.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Henüz okul eklenmemiş.
              </p>
              <Link
                href="/admin/schools/create"
                className="mt-2 inline-block text-primary hover:underline"
              >
                İlk okulunuzu ekleyin
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}