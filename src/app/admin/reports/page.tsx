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

export default function ReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  
  const [reportConfig, setReportConfig] = useState({
    type: "attendance" as "attendance" | "financial",
    subType: "summary" as "summary" | "wages" | "payments",
    startDate: (() => {
      const date = new Date();
      date.setMonth(date.getMonth() - 1);
      return date.toISOString().split('T')[0];
    })(),
    endDate: new Date().toISOString().split('T')[0],
    schoolId: "",
    classId: "",
    format: "json" as "json" | "csv" | "pdf",
  });

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || !["ADMIN", "PRINCIPAL"].includes(session.user.role)) {
      router.push("/auth/sign-in");
      return;
    }

    fetchSchools();
    fetchClasses();
  }, [session, status, router]);

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        const data = await response.json();
        setSchools(data);
      }
    } catch (error) {
      console.error("Okul listesi getirme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const data = await response.json();
        setClasses(data);
      }
    } catch (error) {
      console.error("Sınıf listesi getirme hatası:", error);
    }
  };

  const handleGenerateReport = async () => {
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
      };

      if (reportConfig.type === "attendance") {
        if (reportConfig.schoolId) requestBody.schoolId = reportConfig.schoolId;
        if (reportConfig.classId) requestBody.classId = reportConfig.classId;
      } else {
        requestBody.reportType = reportConfig.subType;
        if (reportConfig.schoolId) requestBody.schoolId = reportConfig.schoolId;
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
          setMessage({ type: 'success', text: 'Rapor CSV olarak indirildi' });
        } else {
          const data = await response.json();
          setReportData(data);
          
          if (reportConfig.format === "pdf") {
            await generatePDF(data);
          } else {
            setMessage({ type: 'success', text: 'Rapor başarıyla oluşturuldu' });
          }
        }
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Rapor oluşturulamadı' });
      }
    } catch (error) {
      console.error("Rapor oluşturma hatası:", error);
      setMessage({ type: 'error', text: 'Rapor oluşturma sırasında hata oluştu' });
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDF = async (data: any) => {
    try {
      const element = document.getElementById('report-content');
      if (!element) {
        setMessage({ type: 'error', text: 'PDF oluşturulamadı: İçerik bulunamadı' });
        return;
      }

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      
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

      const fileName = `fennaver-rapor-${reportConfig.type}-${reportConfig.startDate}-${reportConfig.endDate}.pdf`;
      pdf.save(fileName);
      
      setMessage({ type: 'success', text: 'PDF raporu başarıyla indirildi' });
    } catch (error) {
      console.error("PDF oluşturma hatası:", error);
      setMessage({ type: 'error', text: 'PDF oluşturma sırasında hata oluştu' });
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const filteredClasses = classes.filter(cls => 
    !reportConfig.schoolId || cls.schoolId === reportConfig.schoolId
  );

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
            Rapor Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Devamsızlık ve finansal raporları oluştur ve dışa aktar
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
                <option value="wages">Maaşlar</option>
                <option value="payments">Ödemeler</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Çıktı Formatı *
            </label>
            <select
              value={reportConfig.format}
              onChange={(e) => setReportConfig(prev => ({ 
                ...prev, 
                format: e.target.value as "json" | "csv" | "pdf"
              }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="json">Ekranda Görüntüle</option>
              <option value="csv">CSV İndir</option>
              <option value="pdf">PDF İndir</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Başlangıç Tarihi *
            </label>
            <input
              type="date"
              value={reportConfig.startDate}
              onChange={(e) => setReportConfig(prev => ({ ...prev, startDate: e.target.value }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
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
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Okul (Opsiyonel)
            </label>
            <select
              value={reportConfig.schoolId}
              onChange={(e) => setReportConfig(prev => ({ 
                ...prev, 
                schoolId: e.target.value,
                classId: "" // Reset class when school changes
              }))}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="">Tüm Okullar</option>
              {schools.map(school => (
                <option key={school.id} value={school.id}>
                  {school.name} - {school.district}
                </option>
              ))}
            </select>
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
                disabled={!reportConfig.schoolId}
              >
                <option value="">Tüm Sınıflar</option>
                {filteredClasses.map(cls => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full rounded-lg bg-primary px-4 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {isGenerating ? "Oluşturuluyor..." : "Rapor Oluştur"}
            </button>
          </div>
        </div>
      </div>

      {/* Report Display */}
      {reportData && reportConfig.format === "json" && (
        <div id="report-content" className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="mb-6 border-b border-gray-200 pb-4 dark:border-gray-700">
            <h2 className="text-xl font-bold text-dark dark:text-white">
              {reportConfig.type === "attendance" ? "Devamsızlık Raporu" : "Finansal Rapor"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {new Date(reportData.metadata.dateRange.start).toLocaleDateString('tr-TR')} - {' '}
              {new Date(reportData.metadata.dateRange.end).toLocaleDateString('tr-TR')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Oluşturulma: {new Date(reportData.metadata.generatedAt).toLocaleString('tr-TR')}
            </p>
          </div>

          {reportConfig.type === "attendance" ? (
            <div className="space-y-6">
              {/* Attendance Summary */}
              <div>
                <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">Özet</h3>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{reportData.summary.totalRecords}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Kayıt</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{formatPercentage(reportData.summary.overallAttendanceRate)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Genel Devam Oranı</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{reportData.summary.studentsWithConcerns}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Sorunlu Öğrenci</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">{reportData.summary.totalStudents}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Öğrenci</p>
                  </div>
                </div>
              </div>

              {/* Concern Students */}
              {reportData.analytics.concernStudents.length > 0 && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-red-600">Sorunlu Öğrenciler</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                          <th className="px-3 py-2 text-left">Öğrenci</th>
                          <th className="px-3 py-2 text-left">Sınıf</th>
                          <th className="px-3 py-2 text-left">Devam Oranı</th>
                          <th className="px-3 py-2 text-left">Toplam Ders</th>
                          <th className="px-3 py-2 text-left">Uygulanan Politika</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {reportData.analytics.concernStudents.map((student: any, index: number) => (
                          <tr key={index}>
                            <td className="px-3 py-2">
                              {student.student.firstName} {student.student.lastName}
                            </td>
                            <td className="px-3 py-2">{student.student.class.name}</td>
                            <td className="px-3 py-2 text-red-600 font-semibold">
                              {formatPercentage(student.attendanceRate)}
                            </td>
                            <td className="px-3 py-2">{student.totalLessons}</td>
                            <td className="px-3 py-2">{student.policyApplied}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Class Analytics */}
              <div>
                <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">Sınıf Bazlı Analiz</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-3 py-2 text-left">Sınıf</th>
                        <th className="px-3 py-2 text-left">Okul</th>
                        <th className="px-3 py-2 text-left">Öğrenci Sayısı</th>
                        <th className="px-3 py-2 text-left">Ortalama Devam</th>
                        <th className="px-3 py-2 text-left">Toplam Ders</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {reportData.analytics.byClass.map((cls: any, index: number) => (
                        <tr key={index}>
                          <td className="px-3 py-2">{cls.class.name}</td>
                          <td className="px-3 py-2">{cls.class.school.name}</td>
                          <td className="px-3 py-2">{cls.totalStudents}</td>
                          <td className="px-3 py-2">
                            <span className={cls.averageAttendanceRate < 80 ? 'text-red-600' : 'text-green-600'}>
                              {formatPercentage(cls.averageAttendanceRate)}
                            </span>
                          </td>
                          <td className="px-3 py-2">{cls.totalLessons}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Financial Summary */}
              {reportData.summary && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">Finansal Özet</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.summary.totalIncome)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Gelir</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.summary.totalExpenses)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Gider</p>
                    </div>
                    <div className="text-center">
                      <p className={`text-2xl font-bold ${reportData.summary.netResult >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(reportData.summary.netResult)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Net Kar/Zarar</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">{formatPercentage(reportData.summary.netMargin)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Kar Marjı</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wage Data */}
              {reportData.wageData && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">Maaş Analizi</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(reportData.wageData.analytics.totalWages)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Maaş</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">{formatCurrency(reportData.wageData.analytics.totalPaid)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Ödenen</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-yellow-600">{formatCurrency(reportData.wageData.analytics.totalPending)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bekleyen</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Data */}
              {reportData.paymentData && (
                <div>
                  <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">Ödeme Analizi</h3>
                  <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                    <div className="text-center">
                      <p className="text-xl font-bold text-blue-600">{formatCurrency(reportData.paymentData.analytics.totalRevenue)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Toplam Gelir</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-green-600">{formatCurrency(reportData.paymentData.analytics.totalReceived)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Alınan</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-bold text-yellow-600">{formatCurrency(reportData.paymentData.analytics.totalPending)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bekleyen</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}