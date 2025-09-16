"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface School {
  id: string;
  name: string;
  district: string;
}

interface Class {
  id: string;
  name: string;
  schoolId: string;
  school: {
    name: string;
  };
}

export default function PrincipalReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [principalSchool, setPrincipalSchool] = useState<School | null>(null);
  
  const [reportConfig, setReportConfig] = useState({
    type: "attendance" as "attendance" | "financial",
    subType: "summary" as "summary" | "wages" | "payments",
    startDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      return date.toISOString().split('T')[0];
    })(),
    endDate: new Date().toISOString().split('T')[0],
    classId: "",
    format: "json" as "json" | "csv" | "pdf",
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "PRINCIPAL") {
      router.push("/auth/sign-in");
      return;
    }

    fetchPrincipalData();
  }, [session, status, router]);

  const fetchPrincipalData = async () => {
    try {
      // Get principal's school and classes from dashboard API
      const response = await fetch("/api/principal/dashboard");
      if (response.ok) {
        const dashboardData = await response.json();
        setPrincipalSchool(dashboardData.school);
        setClasses(dashboardData.classes.map((cls: any) => ({
          id: cls.id,
          name: cls.name,
          schoolId: dashboardData.school.id,
          school: {
            name: dashboardData.school.name
          }
        })));
      }
    } catch (error) {
      console.error("Müdür verilerini getirme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!principalSchool) {
      setMessage({ type: 'error', text: 'Okul bilgisi bulunamadı' });
      return;
    }

    setIsGenerating(true);
    setMessage(null);
    setReportData(null);

    try {
      const endpoint = reportConfig.type === "attendance" 
        ? "/api/admin/reports/attendance"
        : "/api/admin/reports/financial";

      const requestBody: any = {
        startDate: reportConfig.startDate,
        endDate: reportConfig.endDate,
        format: reportConfig.format === "pdf" ? "json" : reportConfig.format,
        schoolId: principalSchool.id, // Always filter by principal's school
      };

      if (reportConfig.type === "attendance") {
        if (reportConfig.classId) requestBody.classId = reportConfig.classId;
      } else {
        requestBody.reportType = reportConfig.subType;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        if (reportConfig.format === "csv") {
          // Handle CSV download
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'report.csv';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
          setMessage({ type: 'success', text: 'Rapor başarıyla indirildi!' });
        } else {
          const data = await response.json();
          setReportData(data);
          setMessage({ type: 'success', text: 'Rapor başarıyla oluşturuldu!' });
        }
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Rapor oluşturulurken hata oluştu' });
      }
    } catch (error) {
      console.error("Rapor oluşturma hatası:", error);
      setMessage({ type: 'error', text: 'Rapor oluşturulurken hata oluştu' });
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = async () => {
    if (!reportData) return;

    const element = document.getElementById('report-content');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const reportType = reportConfig.type === "attendance" ? "devamsizlik" : "finansal";
      const fileName = `${principalSchool?.name || 'okul'}-${reportType}-raporu-${new Date().toISOString().split('T')[0]}.pdf`;
      
      pdf.save(fileName);
      setMessage({ type: 'success', text: 'PDF raporu başarıyla indirildi!' });
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      setMessage({ type: 'error', text: 'PDF oluşturulurken hata oluştu' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('tr-TR');
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Rapor sistemi yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark dark:text-white">
            Raporlar
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {principalSchool?.name} - Devamsızlık ve finansal raporları oluştur ve dışa aktar
          </p>
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

      {/* Report Configuration */}
      <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
        <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
          Rapor Ayarları
        </h2>
        
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Rapor Türü *
            </label>
            <select
              value={reportConfig.type}
              onChange={(e) => setReportConfig(prev => ({ 
                ...prev, 
                type: e.target.value as "attendance" | "financial",
                subType: "summary"
              }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="attendance">Devamsızlık Raporu</option>
              <option value="financial">Finansal Rapor</option>
            </select>
          </div>

          {reportConfig.type === "financial" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Alt Tür *
              </label>
              <select
                value={reportConfig.subType}
                onChange={(e) => setReportConfig(prev => ({ 
                  ...prev, 
                  subType: e.target.value as "summary" | "wages" | "payments"
                }))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="summary">Özet</option>
                <option value="wages">Maaş Detayı</option>
                <option value="payments">Ödeme Detayı</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Başlangıç Tarihi *
            </label>
            <input
              type="date"
              value={reportConfig.startDate}
              onChange={(e) => setReportConfig(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bitiş Tarihi *
            </label>
            <input
              type="date"
              value={reportConfig.endDate}
              onChange={(e) => setReportConfig(prev => ({ ...prev, endDate: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {reportConfig.type === "attendance" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sınıf (Opsiyonel)
              </label>
              <select
                value={reportConfig.classId}
                onChange={(e) => setReportConfig(prev => ({ ...prev, classId: e.target.value }))}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Tüm Sınıflar</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Format *
            </label>
            <select
              value={reportConfig.format}
              onChange={(e) => setReportConfig(prev => ({ ...prev, format: e.target.value as "json" | "csv" | "pdf" }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="json">Görüntüle (JSON)</option>
              <option value="csv">CSV İndir</option>
              <option value="pdf">PDF İndir</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleGenerateReport}
            disabled={isGenerating || !reportConfig.startDate || !reportConfig.endDate}
            className="w-full rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50 md:w-auto"
          >
            {isGenerating ? "Oluşturuluyor..." : "Rapor Oluştur"}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-dark dark:text-white">
              Rapor Sonuçları
            </h2>
            {reportConfig.format === "json" && (
              <button
                onClick={generatePDF}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                PDF İndir
              </button>
            )}
          </div>

          <div id="report-content" className="space-y-4">
            {reportConfig.type === "attendance" ? (
              <div>
                <h3 className="mb-2 font-medium text-dark dark:text-white">Devamsızlık Raporu</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {formatDate(reportConfig.startDate)} - {formatDate(reportConfig.endDate)}
                </p>
                {reportData.summary && (
                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Kayıt</p>
                      <p className="text-xl font-bold text-dark dark:text-white">{reportData.summary.totalRecords}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Devam Eden</p>
                      <p className="text-xl font-bold text-green-600">{reportData.summary.presentCount}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Devamsızlık Oranı</p>
                      <p className="text-xl font-bold text-red-600">{reportData.summary.absenteeismRate}%</p>
                    </div>
                  </div>
                )}
                {reportData.details && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left">Öğrenci</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Sınıf</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Devam</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Devamsızlık</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Oran</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.details.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="border border-gray-300 px-4 py-2">{item.studentName}</td>
                            <td className="border border-gray-300 px-4 py-2">{item.className}</td>
                            <td className="border border-gray-300 px-4 py-2 text-green-600">{item.presentCount}</td>
                            <td className="border border-gray-300 px-4 py-2 text-red-600">{item.absentCount}</td>
                            <td className="border border-gray-300 px-4 py-2">{item.attendanceRate}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="mb-2 font-medium text-dark dark:text-white">Finansal Rapor</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {formatDate(reportConfig.startDate)} - {formatDate(reportConfig.endDate)}
                </p>
                {reportData.summary && (
                  <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Gelir</p>
                      <p className="text-xl font-bold text-green-600">{formatCurrency(reportData.summary.totalIncome || 0)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Gider</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(reportData.summary.totalExpenses || 0)}</p>
                    </div>
                    <div className="rounded-lg border p-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Net Kar/Zarar</p>
                      <p className={`text-xl font-bold ${(reportData.summary.netProfit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(reportData.summary.netProfit || 0)}
                      </p>
                    </div>
                  </div>
                )}
                {reportData.details && (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="border border-gray-300 px-4 py-2 text-left">Açıklama</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Tutar</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Durum</th>
                          <th className="border border-gray-300 px-4 py-2 text-left">Tarih</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportData.details.map((item: any, index: number) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="border border-gray-300 px-4 py-2">{item.description}</td>
                            <td className="border border-gray-300 px-4 py-2">{formatCurrency(item.amount)}</td>
                            <td className="border border-gray-300 px-4 py-2">
                              <span className={`rounded-full px-2 py-1 text-xs ${
                                item.status === 'PAID' ? 'bg-green-100 text-green-800' :
                                item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {item.status === 'PAID' ? 'Ödendi' : 
                                 item.status === 'PENDING' ? 'Beklemede' : 'Gecikmiş'}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-4 py-2">{formatDate(item.date)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}