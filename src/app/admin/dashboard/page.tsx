import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { PageHeader } from "@/components/Layouts/PageHeader/PageHeader";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

// Dashboard statistics component
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function StatCard({ title, value, icon, color, bgColor }: StatCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm font-medium ${color}`}>
              {title}
            </p>
            <p className="text-3xl font-bold text-dark dark:text-white mt-1">
              {value.toLocaleString("tr-TR")}
            </p>
          </div>
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${bgColor}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Quick action component
interface QuickActionProps {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

function QuickAction({ title, description, href, icon, color, bgColor }: QuickActionProps) {
  return (
    <a
      href={href}
      className="group block transition-all hover:scale-[1.02]"
    >
      <Card className="h-full border-0 hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${bgColor} group-hover:scale-110 transition-transform`}>
              <span className={color}>{icon}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-dark dark:text-white group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
}

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/unauthorized");
  }

  // Get dashboard statistics
  const stats = await Promise.all([
    prisma.user.count(),
    prisma.school.count(),
    prisma.class.count(),
    prisma.student.count(),
    prisma.lesson.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    }),
    prisma.teacherAssignment.count(),
    prisma.schoolPayment.count({
      where: {
        status: "PAID",
      },
    }),
  ]);

  const [
    totalUsers,
    totalSchools,
    totalClasses,
    totalStudents,
    lessonsThisMonth,
    totalAssignments,
    completedPayments,
  ] = stats;

  // User greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Günaydın";
    if (hour < 18) return "İyi Günler";
    return "İyi Akşamlar";
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Yönetici Paneli"
        subtitle={`${getGreeting()}, ${session.user.firstName} ${session.user.lastName}`}
        breadcrumbs={[
          { label: "Ana Sayfa", href: "/admin" },
          { label: "Dashboard" },
        ]}
      />

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Toplam Kullanıcı"
          value={totalUsers}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1.29a2.25 2.25 0 00-2.5-2.5M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          color="text-blue-600 dark:text-blue-400"
          bgColor="bg-blue-50 dark:bg-blue-900/20"
        />

        <StatCard
          title="Okullar"
          value={totalSchools}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          color="text-green-600 dark:text-green-400"
          bgColor="bg-green-50 dark:bg-green-900/20"
        />

        <StatCard
          title="Sınıflar"
          value={totalClasses}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M9 7l1-1v-1a3 3 0 116 0v1l1 1m-9 11h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
            </svg>
          }
          color="text-yellow-600 dark:text-yellow-400"
          bgColor="bg-yellow-50 dark:bg-yellow-900/20"
        />

        <StatCard
          title="Öğrenciler"
          value={totalStudents}
          icon={
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          }
          color="text-purple-600 dark:text-purple-400"
          bgColor="bg-purple-50 dark:bg-purple-900/20"
        />
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Son 30 Gün"
            subtitle="Ders kayıtları ve atamalar"
          />
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-dark dark:text-white">
                  {lessonsThisMonth}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ders Kaydı</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-dark dark:text-white">
                  {totalAssignments}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Atama</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Mali Durum"
            subtitle="Tamamlanan ödemeler"
          />
          <CardContent>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {completedPayments}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tamamlanan Ödeme</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Genel Bakış"
            subtitle="Sistem istatistikleri"
          />
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Okul Başına Öğrenci</span>
                <span className="font-medium">
                  {totalSchools > 0 ? Math.round(totalStudents / totalSchools) : 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Sınıf Başına Öğrenci</span>
                <span className="font-medium">
                  {totalClasses > 0 ? Math.round(totalStudents / totalClasses) : 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader
          title="Hızlı İşlemler"
          subtitle="Yaygın kullanılan yönetim işlemleri"
        />
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <QuickAction
              title="Kullanıcı Yönetimi"
              description="Kullanıcı ekle, düzenle veya sil"
              href="/admin/users"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-1.29a2.25 2.25 0 00-2.5-2.5M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              color="text-blue-600 dark:text-blue-400"
              bgColor="bg-blue-50 dark:bg-blue-900/20"
            />

            <QuickAction
              title="Okul Yönetimi"
              description="Okul ekle ve yapılandır"
              href="/admin/schools"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              color="text-green-600 dark:text-green-400"
              bgColor="bg-green-50 dark:bg-green-900/20"
            />

            <QuickAction
              title="Mali Durum"
              description="Ödemeleri ve maaşları takip et"
              href="/admin/finances"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="text-yellow-600 dark:text-yellow-400"
              bgColor="bg-yellow-50 dark:bg-yellow-900/20"
            />

            <QuickAction
              title="Raporlar"
              description="Sistem raporlarını görüntüle"
              href="/admin/reports"
              icon={
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              color="text-red-600 dark:text-red-400"
              bgColor="bg-red-50 dark:bg-red-900/20"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
