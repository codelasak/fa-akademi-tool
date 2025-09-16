"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface FinancialSummary {
  totalWagesPending: number;
  totalWagesPaid: number;
  totalPaymentsPending: number;
  totalPaymentsPaid: number;
  currentMonthWages: number;
  currentMonthPayments: number;
  overduePayments: number;
  overdueWages: number;
}

interface RecentTransaction {
  id: string;
  type: 'wage' | 'payment';
  amount: number;
  status: string;
  date: string;
  description: string;
}

export default function FinancesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/auth/sign-in");
      return;
    }

    fetchFinancialData();
  }, [session, status, router]);

  const fetchFinancialData = async () => {
    try {
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();

      // Fetch wage records
      const wagesResponse = await fetch("/api/admin/finances/wages");
      const wages = wagesResponse.ok ? await wagesResponse.json() : [];

      // Fetch payment records
      const paymentsResponse = await fetch("/api/admin/finances/payments");
      const payments = paymentsResponse.ok ? await paymentsResponse.json() : [];

      // Calculate summary
      const summary: FinancialSummary = {
        totalWagesPending: wages
          .filter((w: any) => w.status === "PENDING")
          .reduce((sum: number, w: any) => sum + parseFloat(w.totalAmount), 0),
        totalWagesPaid: wages
          .filter((w: any) => w.status === "PAID")
          .reduce((sum: number, w: any) => sum + parseFloat(w.paidAmount), 0),
        totalPaymentsPending: payments
          .filter((p: any) => p.status === "PENDING")
          .reduce((sum: number, p: any) => sum + parseFloat(p.agreedAmount), 0),
        totalPaymentsPaid: payments
          .filter((p: any) => p.status === "PAID")
          .reduce((sum: number, p: any) => sum + parseFloat(p.paidAmount), 0),
        currentMonthWages: wages
          .filter((w: any) => w.month === currentMonth && w.year === currentYear)
          .reduce((sum: number, w: any) => sum + parseFloat(w.totalAmount), 0),
        currentMonthPayments: payments
          .filter((p: any) => p.month === currentMonth && p.year === currentYear)
          .reduce((sum: number, p: any) => sum + parseFloat(p.agreedAmount), 0),
        overduePayments: payments.filter((p: any) => p.status === "OVERDUE").length,
        overdueWages: wages.filter((w: any) => w.status === "OVERDUE").length,
      };

      // Prepare recent transactions
      const recentTransactions: RecentTransaction[] = [
        ...wages.slice(0, 5).map((w: any) => ({
          id: w.id,
          type: 'wage' as const,
          amount: parseFloat(w.totalAmount),
          status: w.status,
          date: w.updatedAt,
          description: `${w.teacher.user.firstName} ${w.teacher.user.lastName} - ${w.month}/${w.year}`,
        })),
        ...payments.slice(0, 5).map((p: any) => ({
          id: p.id,
          type: 'payment' as const,
          amount: parseFloat(p.agreedAmount),
          status: p.status,
          date: p.updatedAt,
          description: `${p.school.name} - ${p.month}/${p.year}`,
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 8);

      setSummary(summary);
      setRecentTransactions(recentTransactions);
    } catch (error) {
      console.error("Finansal veri getirme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-200';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'OVERDUE':
        return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'Ödendi';
      case 'PENDING':
        return 'Bekliyor';
      case 'OVERDUE':
        return 'Gecikmiş';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Finansal Yönetim
        </h1>
        <div className="flex space-x-3">
          <button
            onClick={() => router.push("/admin/finances/wages")}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Maaş Yönetimi
          </button>
          <button
            onClick={() => router.push("/admin/finances/payments")}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Ödeme Yönetimi
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Bekleyen Maaşlar
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summary.totalWagesPending)}
                </p>
              </div>
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900">
                <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Bekleyen Ödemeler
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summary.totalPaymentsPending)}
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Bu Ay Toplam Maaş
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summary.currentMonthWages)}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Bu Ay Toplam Gelir
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(summary.currentMonthPayments)}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Alerts for Overdue Payments */}
      {summary && (summary.overduePayments > 0 || summary.overdueWages > 0) && (
        <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                Dikkat: Gecikmiş Ödemeler
              </h3>
              <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                <ul className="list-disc pl-5 space-y-1">
                  {summary.overdueWages > 0 && (
                    <li>{summary.overdueWages} gecikmiş maaş ödemesi var</li>
                  )}
                  {summary.overduePayments > 0 && (
                    <li>{summary.overduePayments} gecikmiş okul ödemesi var</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
        <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Son İşlemler
        </h2>
        
        {recentTransactions.length > 0 ? (
          <div className="space-y-3">
            {recentTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <div className={`rounded-full p-2 ${
                    transaction.type === 'wage' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-green-100 dark:bg-green-900'
                  }`}>
                    {transaction.type === 'wage' ? (
                      <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {transaction.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {transaction.type === 'wage' ? 'Maaş' : 'Okul Ödemesi'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(transaction.amount)}
                  </p>
                  <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(transaction.status)}`}>
                    {getStatusText(transaction.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400">
            Henüz işlem kaydı yok
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Maaş İşlemleri
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/admin/finances/wages?action=calculate")}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700"
            >
              Bu Ay Maaşlarını Hesapla
            </button>
            <button
              onClick={() => router.push("/admin/finances/wages?filter=pending")}
              className="w-full rounded-lg border border-blue-600 px-4 py-3 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              Bekleyen Maaşları Görüntüle
            </button>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Ödeme İşlemleri
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => router.push("/admin/finances/payments?action=create")}
              className="w-full rounded-lg bg-green-600 px-4 py-3 text-white hover:bg-green-700"
            >
              Yeni Ödeme Kaydı Oluştur
            </button>
            <button
              onClick={() => router.push("/admin/finances/payments?filter=pending")}
              className="w-full rounded-lg border border-green-600 px-4 py-3 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
            >
              Bekleyen Ödemeleri Görüntüle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}