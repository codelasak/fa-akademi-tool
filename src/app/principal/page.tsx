"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface DashboardData {
  school: {
    id: string;
    name: string;
    district: string;
    logoUrl?: string;
  };
  statistics: {
    totalClasses: number;
    totalStudents: number;
    activeTeachers: number;
    attendanceRate: number;
  };
  recentActivity: {
    lessons: Array<{
      id: string;
      date: string;
      className: string;
      subject: string;
      teacherName: string;
      hoursWorked: number;
      isCancelled: boolean;
    }>;
  };
  financial: {
    monthlyPayment: {
      amount: number;
      status: string;
      dueDate: string;
    } | null;
    wages: {
      total: number;
      paid: number;
      pending: number;
      count: number;
    };
  };
  classes: Array<{
    id: string;
    name: string;
    subject: string;
    studentCount: number;
    teacherCount: number;
    isAttendanceEnabled: boolean;
  }>;
}

export default function PrincipalDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || session.user.role !== "PRINCIPAL") {
      router.push("/auth/sign-in");
      return;
    }

    fetchDashboardData();
  }, [session, status, router]);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/principal/dashboard");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Dashboard verileri yüklenemedi");
      }
    } catch (error) {
      console.error("Dashboard veri yükleme hatası:", error);
      setError("Dashboard verileri yüklenirken hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("tr-TR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
        return "text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200";
      case "PENDING":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200";
      case "OVERDUE":
        return "text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "PAID":
        return "Ödendi";
      case "PENDING":
        return "Beklemede";
      case "OVERDUE":
        return "Gecikmiş";
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Dashboard yükleniyor...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mb-4 text-xl text-red-500">⚠️</div>
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark dark:text-white">
            {dashboardData.school.name} - Müdür Paneli
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {dashboardData.school.district} • Hoş geldiniz,{" "}
            {session?.user?.firstName} {session?.user?.lastName}
          </p>
        </div>
        <div className="flex space-x-4">
          <Link
            href="/principal/reports"
            className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
          >
            📊 Raporlar
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Sınıf
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {dashboardData.statistics.totalClasses}
              </p>
            </div>
            <div className="text-3xl">🏫</div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Öğrenci
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {dashboardData.statistics.totalStudents}
              </p>
            </div>
            <div className="text-3xl">👥</div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Aktif Öğretmen
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {dashboardData.statistics.activeTeachers}
              </p>
            </div>
            <div className="text-3xl">👨‍🏫</div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Devam Oranı
              </p>
              <p
                className={`text-2xl font-bold ${dashboardData.statistics.attendanceRate >= 85 ? "text-green-600" : dashboardData.statistics.attendanceRate >= 70 ? "text-yellow-600" : "text-red-600"}`}
              >
                {dashboardData.statistics.attendanceRate.toFixed(1)}%
              </p>
            </div>
            <div className="text-3xl">📈</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
            Son Dersler
          </h3>
          {dashboardData.recentActivity.lessons.length > 0 ? (
            <div className="space-y-3">
              {dashboardData.recentActivity.lessons
                .slice(0, 5)
                .map((lesson) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between border-b border-gray-200 pb-3 last:border-b-0 dark:border-gray-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-dark dark:text-white">
                          {lesson.className}
                        </p>
                        {lesson.isCancelled && (
                          <span className="rounded-full bg-red-100 px-2 py-1 text-xs text-red-800 dark:bg-red-900 dark:text-red-200">
                            İptal
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {lesson.subject} • {lesson.teacherName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(lesson.date)} • {lesson.hoursWorked} saat
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Henüz ders kaydı bulunmuyor.
            </p>
          )}
        </div>

        {/* Financial Overview */}
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
            Finansal Durum
          </h3>

          {/* Monthly Payment */}
          {dashboardData.financial.monthlyPayment && (
            <div className="mb-4 rounded-lg border border-gray-200 p-4 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Aylık Ödeme
                  </p>
                  <p className="text-lg font-bold text-dark dark:text-white">
                    {formatCurrency(
                      dashboardData.financial.monthlyPayment.amount,
                    )}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(dashboardData.financial.monthlyPayment.status)}`}
                >
                  {getStatusText(dashboardData.financial.monthlyPayment.status)}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                Vade:{" "}
                {new Date(
                  dashboardData.financial.monthlyPayment.dueDate,
                ).toLocaleDateString("tr-TR")}
              </p>
            </div>
          )}

          {/* Wages Summary */}
          <div className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
            <p className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">
              Öğretmen Maaşları
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Toplam
                </p>
                <p className="font-semibold text-dark dark:text-white">
                  {formatCurrency(dashboardData.financial.wages.total)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Ödenen
                </p>
                <p className="font-semibold text-green-600">
                  {formatCurrency(dashboardData.financial.wages.paid)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Bekleyen
                </p>
                <p className="font-semibold text-yellow-600">
                  {formatCurrency(dashboardData.financial.wages.pending)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  Öğretmen
                </p>
                <p className="font-semibold text-dark dark:text-white">
                  {dashboardData.financial.wages.count}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Overview */}
      <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
        <h3 className="mb-4 text-xl font-semibold text-dark dark:text-white">
          Sınıflar
        </h3>
        {dashboardData.classes.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Sınıf
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Konu
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Öğrenci
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Öğretmen
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">
                    Devamsızlık
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {dashboardData.classes.map((cls) => (
                  <tr
                    key={cls.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="px-4 py-3 font-medium text-dark dark:text-white">
                      {cls.name}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {cls.subject}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {cls.studentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                        {cls.teacherCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${cls.isAttendanceEnabled ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" : "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"}`}
                      >
                        {cls.isAttendanceEnabled ? "✓ Aktif" : "✗ Pasif"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">
            Henüz sınıf bulunmuyor.
          </p>
        )}
      </div>
    </div>
  );
}
