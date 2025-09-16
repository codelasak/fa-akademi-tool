"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface WageRecord {
  id: string;
  month: number;
  year: number;
  totalHours: number;
  hourlyRate: number;
  totalAmount: number;
  paidAmount: number;
  paymentDate: string | null;
  status: string;
  notes: string | null;
  teacher: {
    id: string;
    hourlyRate: number;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
}

export default function WagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [wages, setWages] = useState<WageRecord[]>([]);
  const [filteredWages, setFilteredWages] = useState<WageRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [filters, setFilters] = useState({
    month: "",
    year: "",
    status: searchParams.get("filter") || "",
    teacherId: "",
  });
  const [editingWage, setEditingWage] = useState<WageRecord | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/auth/sign-in");
      return;
    }

    fetchWages();

    // Handle action from URL
    if (searchParams.get("action") === "calculate") {
      handleCalculateCurrentMonth();
    }
  }, [session, status, router, searchParams]);

  useEffect(() => {
    applyFilters();
  }, [wages, filters]);

  const fetchWages = async () => {
    try {
      const response = await fetch("/api/admin/finances/wages");
      if (response.ok) {
        const data = await response.json();
        setWages(data);
      }
    } catch (error) {
      console.error("Maaş kayıtları getirme hatası:", error);
      setMessage({ type: "error", text: "Maaş kayıtları getirilemedi" });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = wages;

    if (filters.month) {
      filtered = filtered.filter((w) => w.month === parseInt(filters.month));
    }
    if (filters.year) {
      filtered = filtered.filter((w) => w.year === parseInt(filters.year));
    }
    if (filters.status) {
      filtered = filtered.filter(
        (w) => w.status === filters.status.toUpperCase(),
      );
    }

    setFilteredWages(filtered);
  };

  const handleCalculateCurrentMonth = async () => {
    const currentDate = new Date();
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();

    await handleCalculateWages(month, year);
  };

  const handleCalculateWages = async (
    month: number,
    year: number,
    teacherId?: string,
  ) => {
    setIsCalculating(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/finances/wages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          month,
          year,
          ...(teacherId && { teacherId }),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setMessage({ type: "success", text: result.message });
        fetchWages();
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.error || "Maaş hesaplaması başarısız",
        });
      }
    } catch (error) {
      console.error("Maaş hesaplama hatası:", error);
      setMessage({
        type: "error",
        text: "Maaş hesaplaması sırasında hata oluştu",
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleUpdateWage = async (wageId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/finances/wages/${wageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Maaş kaydı güncellendi" });
        setEditingWage(null);
        fetchWages();
      } else {
        const errorData = await response.json();
        setMessage({
          type: "error",
          text: errorData.error || "Güncelleme başarısız",
        });
      }
    } catch (error) {
      console.error("Maaş güncelleme hatası:", error);
      setMessage({ type: "error", text: "Güncelleme sırasında hata oluştu" });
    }
  };

  const handleMarkAsPaid = (wage: WageRecord) => {
    handleUpdateWage(wage.id, {
      status: "PAID",
      paidAmount: wage.totalAmount,
      paymentDate: new Date().toISOString().split("T")[0],
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
    }).format(amount);
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
        return "Bekliyor";
      case "OVERDUE":
        return "Gecikmiş";
      default:
        return status;
    }
  };

  const getMonthName = (month: number) => {
    const months = [
      "Ocak",
      "Şubat",
      "Mart",
      "Nisan",
      "Mayıs",
      "Haziran",
      "Temmuz",
      "Ağustos",
      "Eylül",
      "Ekim",
      "Kasım",
      "Aralık",
    ];
    return months[month - 1];
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark dark:text-white">
            Maaş Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Öğretmen maaşlarını hesapla, takip et ve öde
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleCalculateCurrentMonth}
            disabled={isCalculating}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isCalculating ? "Hesaplanıyor..." : "Bu Ay Hesapla"}
          </button>
          <button
            onClick={() => router.push("/admin/finances")}
            className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
          >
            Geri Dön
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === "success"
              ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
        <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Filtreler
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ay
            </label>
            <select
              value={filters.month}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, month: e.target.value }))
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Aylar</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  {getMonthName(i + 1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Yıl
            </label>
            <select
              value={filters.year}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, year: e.target.value }))
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Yıllar</option>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Durum
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Durumlar</option>
              <option value="PENDING">Bekliyor</option>
              <option value="PAID">Ödendi</option>
              <option value="OVERDUE">Gecikmiş</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() =>
                setFilters({ month: "", year: "", status: "", teacherId: "" })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Wage Records Table */}
      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Maaş Kayıtları ({filteredWages.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Öğretmen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Dönem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Çalışılan Saat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Saatlik Ücret
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Toplam Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Ödenen
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white dark:divide-gray-700 dark:bg-gray-dark">
              {filteredWages.map((wage) => (
                <tr
                  key={wage.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {wage.teacher.user.firstName}{" "}
                        {wage.teacher.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {wage.teacher.user.email}
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {getMonthName(wage.month)} {wage.year}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {wage.totalHours} saat
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {formatCurrency(wage.hourlyRate)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(wage.totalAmount)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {formatCurrency(wage.paidAmount)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(wage.status)}`}
                    >
                      {getStatusText(wage.status)}
                    </span>
                  </td>
                  <td className="space-x-2 whitespace-nowrap px-6 py-4 text-sm">
                    {wage.status === "PENDING" && (
                      <button
                        onClick={() => handleMarkAsPaid(wage)}
                        className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                      >
                        Ödendi Olarak İşaretle
                      </button>
                    )}
                    <button
                      onClick={() => setEditingWage(wage)}
                      className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                    >
                      Düzenle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredWages.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Maaş kaydı bulunamadı
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingWage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-gray-dark">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
              Maaş Kaydını Düzenle
            </h3>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateWage(editingWage.id, {
                  paidAmount: parseFloat(formData.get("paidAmount") as string),
                  status: formData.get("status"),
                  notes: formData.get("notes"),
                  ...(formData.get("paymentDate") && {
                    paymentDate: formData.get("paymentDate"),
                  }),
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ödenen Tutar
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    step="0.01"
                    defaultValue={editingWage.paidAmount}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Durum
                  </label>
                  <select
                    name="status"
                    defaultValue={editingWage.status}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="PENDING">Bekliyor</option>
                    <option value="PAID">Ödendi</option>
                    <option value="OVERDUE">Gecikmiş</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ödeme Tarihi
                  </label>
                  <input
                    type="date"
                    name="paymentDate"
                    defaultValue={editingWage.paymentDate?.split("T")[0] || ""}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notlar
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingWage.notes || ""}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setEditingWage(null)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
