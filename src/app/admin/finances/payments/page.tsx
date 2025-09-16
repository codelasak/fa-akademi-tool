"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface SchoolPayment {
  id: string;
  month: number;
  year: number;
  agreedAmount: number;
  paidAmount: number;
  paymentDate: string | null;
  status: string;
  notes: string | null;
  school: {
    id: string;
    name: string;
    district: string;
  };
}

interface School {
  id: string;
  name: string;
  district: string;
}

export default function PaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<SchoolPayment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<SchoolPayment[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [filters, setFilters] = useState({
    month: "",
    year: "",
    status: searchParams.get("filter") || "",
    schoolId: "",
  });
  const [editingPayment, setEditingPayment] = useState<SchoolPayment | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(searchParams.get("action") === "create");
  const [newPayment, setNewPayment] = useState({
    schoolId: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    agreedAmount: "",
    notes: "",
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/auth/sign-in");
      return;
    }

    fetchPayments();
    fetchSchools();
  }, [session, status, router]);

  useEffect(() => {
    applyFilters();
  }, [payments, filters]);

  const fetchPayments = async () => {
    try {
      const response = await fetch("/api/admin/finances/payments");
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Ödeme kayıtları getirme hatası:", error);
      setMessage({ type: 'error', text: 'Ödeme kayıtları getirilemedi' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error("Okul listesi getirme hatası:", error);
    }
  };

  const applyFilters = () => {
    let filtered = payments;

    if (filters.month) {
      filtered = filtered.filter(p => p.month === parseInt(filters.month));
    }
    if (filters.year) {
      filtered = filtered.filter(p => p.year === parseInt(filters.year));
    }
    if (filters.status) {
      filtered = filtered.filter(p => p.status === filters.status.toUpperCase());
    }
    if (filters.schoolId) {
      filtered = filtered.filter(p => p.school.id === filters.schoolId);
    }

    setFilteredPayments(filtered);
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      const response = await fetch("/api/admin/finances/payments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          schoolId: newPayment.schoolId,
          month: newPayment.month,
          year: newPayment.year,
          agreedAmount: parseFloat(newPayment.agreedAmount),
          notes: newPayment.notes,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Ödeme kaydı oluşturuldu' });
        setShowCreateForm(false);
        setNewPayment({
          schoolId: "",
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear(),
          agreedAmount: "",
          notes: "",
        });
        fetchPayments();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Ödeme kaydı oluşturulamadı' });
      }
    } catch (error) {
      console.error("Ödeme oluşturma hatası:", error);
      setMessage({ type: 'error', text: 'Ödeme kaydı oluşturulurken hata oluştu' });
    }
  };

  const handleUpdatePayment = async (paymentId: string, updates: any) => {
    try {
      const response = await fetch(`/api/admin/finances/payments/${paymentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Ödeme kaydı güncellendi' });
        setEditingPayment(null);
        fetchPayments();
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Güncelleme başarısız' });
      }
    } catch (error) {
      console.error("Ödeme güncelleme hatası:", error);
      setMessage({ type: 'error', text: 'Güncelleme sırasında hata oluştu' });
    }
  };

  const handleMarkAsPaid = (payment: SchoolPayment) => {
    handleUpdatePayment(payment.id, {
      status: "PAID",
      paidAmount: payment.agreedAmount,
      paymentDate: new Date().toISOString().split('T')[0],
    });
  };

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

  const getMonthName = (month: number) => {
    const months = [
      'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
      'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
    ];
    return months[month - 1];
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark dark:text-white">
            Ödeme Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Okul ödemelerini takip et ve yönet
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Yeni Ödeme Kaydı
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
        <div className={`rounded-lg p-4 ${
          message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Create Payment Form */}
      {showCreateForm && (
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Yeni Ödeme Kaydı Oluştur
          </h2>
          
          <form onSubmit={handleCreatePayment} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Okul *
                </label>
                <select
                  value={newPayment.schoolId}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, schoolId: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Okul seçin</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.name} - {school.district}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Anlaşılan Tutar *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newPayment.agreedAmount}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, agreedAmount: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ay *
                </label>
                <select
                  value={newPayment.month}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {getMonthName(i + 1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yıl *
                </label>
                <select
                  value={newPayment.year}
                  onChange={(e) => setNewPayment(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                >
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() + i;
                    return (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Notlar
              </label>
              <textarea
                value={newPayment.notes}
                onChange={(e) => setNewPayment(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                İptal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Oluştur
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
        <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Filtreler
        </h2>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Okul
            </label>
            <select
              value={filters.schoolId}
              onChange={(e) => setFilters(prev => ({ ...prev, schoolId: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Okullar</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Ay
            </label>
            <select
              value={filters.month}
              onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
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
              onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
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
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
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
              onClick={() => setFilters({ month: "", year: "", status: "", schoolId: "" })}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Filtreleri Temizle
            </button>
          </div>
        </div>
      </div>

      {/* Payment Records Table */}
      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Ödeme Kayıtları ({filteredPayments.length})
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Okul
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Dönem
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Anlaşılan Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Ödenen Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Ödeme Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-dark dark:divide-gray-700">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {payment.school.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {payment.school.district}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {getMonthName(payment.month)} {payment.year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(payment.agreedAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatCurrency(payment.paidAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusText(payment.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {payment.status === "PENDING" && (
                      <button
                        onClick={() => handleMarkAsPaid(payment)}
                        className="text-green-600 hover:text-green-900 dark:hover:text-green-400"
                      >
                        Ödendi Olarak İşaretle
                      </button>
                    )}
                    <button
                      onClick={() => setEditingPayment(payment)}
                      className="text-blue-600 hover:text-blue-900 dark:hover:text-blue-400"
                    >
                      Düzenle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredPayments.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Ödeme kaydı bulunamadı
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-dark rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4 text-dark dark:text-white">
              Ödeme Kaydını Düzenle
            </h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleUpdatePayment(editingPayment.id, {
                agreedAmount: parseFloat(formData.get('agreedAmount') as string),
                paidAmount: parseFloat(formData.get('paidAmount') as string),
                status: formData.get('status'),
                notes: formData.get('notes'),
                ...(formData.get('paymentDate') && { paymentDate: formData.get('paymentDate') }),
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Anlaşılan Tutar
                  </label>
                  <input
                    type="number"
                    name="agreedAmount"
                    step="0.01"
                    defaultValue={editingPayment.agreedAmount}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ödenen Tutar
                  </label>
                  <input
                    type="number"
                    name="paidAmount"
                    step="0.01"
                    defaultValue={editingPayment.paidAmount}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Durum
                  </label>
                  <select
                    name="status"
                    defaultValue={editingPayment.status}
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
                    defaultValue={editingPayment.paymentDate?.split('T')[0] || ""}
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
                    defaultValue={editingPayment.notes || ""}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-opacity-90"
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