import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function AttendancePoliciesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/auth/sign-in");
  }

  // Get all schools for policy management
  const schools = await prisma.school.findMany({
    orderBy: {
      name: "asc",
    },
    include: {
      classes: {
        include: {
          _count: {
            select: {
              students: true,
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
          Devamsızlık Politikaları
        </h1>
        <Link
          href="/admin/attendance-policies/create"
          className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
        >
          Yeni Politika Oluştur
        </Link>
      </div>

      {/* Global Default Settings */}
      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Genel Varsayılan Ayarlar
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tüm okullar için geçerli olan varsayılan devamsızlık kuralları
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Sorunlu Devam Eşiği
              </h3>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                %80
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bu oranın altındaki öğrenciler sorunlu kabul edilir
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Geç Kalma Toleransı
              </h3>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                15 dk
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bu süreden sonra geç kalma olarak işaretlenir
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Maksimum Devamsızlık
              </h3>
              <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                20 gün
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bu sayıdan fazla devamsızlık uyarı verir
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Otomatik Mazeret
              </h3>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                Aktif
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Belirli durumlar otomatik mazeret sayılır
              </p>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href="/admin/attendance-policies/global"
              className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Genel Ayarları Düzenle
            </Link>
          </div>
        </div>
      </div>

      {/* School-specific Policies */}
      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Okul Bazlı Politikalar
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Her okul için özel devamsızlık kuralları tanımlayabilirsiniz
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {schools.map((school) => (
              <div key={school.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {school.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {school.classes.length} sınıf • {school.classes.reduce((acc, cls) => acc + cls._count.students, 0)} öğrenci
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      href={`/admin/attendance-policies/school/${school.id}`}
                      className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                    >
                      Politika Görüntüle
                    </Link>
                    <Link
                      href={`/admin/attendance-policies/school/${school.id}/edit`}
                      className="rounded-lg bg-green-100 px-3 py-1 text-sm text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
                    >
                      Düzenle
                    </Link>
                  </div>
                </div>

                {/* School policy preview */}
                <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      %80
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sorunlu Eşik</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      15dk
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Geç Tolerans</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      20
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Max Devamsızlık</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600 dark:text-green-400">
                      Aktif
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Otomatik Mazeret</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {schools.length === 0 && (
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H5m0 0h2M7 7h10M7 11h4m6 7v-3a2 2 0 00-2-2h-4a2 2 0 00-2 2v3m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v8" />
              </svg>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                Henüz okul bulunmuyor.
              </p>
              <Link
                href="/admin/schools"
                className="mt-4 inline-block text-primary hover:underline"
              >
                İlk okulunuzu ekleyin
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Policy Templates */}
      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Politika Şablonları
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Yaygın kullanılan devamsızlık politika şablonları
          </p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Sıkı Politika
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Yüksek standartlar için katı devamsızlık kuralları
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <p>• Sorunlu eşik: %90</p>
                <p>• Geç tolerans: 5 dakika</p>
                <p>• Max devamsızlık: 10 gün</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Standart Politika
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Çoğu okul için uygun genel kurallar
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <p>• Sorunlu eşik: %80</p>
                <p>• Geç tolerans: 15 dakika</p>
                <p>• Max devamsızlık: 20 gün</p>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                Esnek Politika
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Özel durumlar için toleranslı yaklaşım
              </p>
              <div className="mt-3 space-y-1 text-sm">
                <p>• Sorunlu eşik: %70</p>
                <p>• Geç tolerans: 30 dakika</p>
                <p>• Max devamsızlık: 30 gün</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}