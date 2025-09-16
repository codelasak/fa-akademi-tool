"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

interface School {
  id: string;
  name: string;
  classes: {
    id: string;
    name: string;
  }[];
}

export default function CreateAttendancePolicyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedSchoolId = searchParams.get("schoolId");
  
  const [schools, setSchools] = useState<School[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    scope: "GLOBAL" as "GLOBAL" | "SCHOOL" | "CLASS",
    schoolId: preSelectedSchoolId || "",
    classId: "",
    concernThreshold: 80,
    lateToleranceMinutes: 15,
    maxAbsences: 20,
    autoExcuseEnabled: false,
    autoExcuseReasons: [] as string[],
    effectiveFrom: new Date().toISOString().split('T')[0],
    effectiveTo: "",
  });
  const [newExcuseReason, setNewExcuseReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "ADMIN") {
      router.push("/auth/sign-in");
      return;
    }

    fetchSchools();

    // Set scope based on pre-selected school
    if (preSelectedSchoolId) {
      setFormData(prev => ({
        ...prev,
        scope: "SCHOOL",
        schoolId: preSelectedSchoolId,
        name: "Okul Özel Politikası",
      }));
    }
  }, [session, status, preSelectedSchoolId, router]);

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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // Clear dependent fields when scope changes
    if (field === "scope") {
      if (value === "GLOBAL") {
        setFormData(prev => ({
          ...prev,
          schoolId: "",
          classId: "",
        }));
      } else if (value === "SCHOOL") {
        setFormData(prev => ({
          ...prev,
          classId: "",
        }));
      }
    }

    // Clear class when school changes
    if (field === "schoolId") {
      setFormData(prev => ({
        ...prev,
        classId: "",
      }));
    }
  };

  const addExcuseReason = () => {
    if (newExcuseReason.trim() && !formData.autoExcuseReasons.includes(newExcuseReason.trim())) {
      setFormData(prev => ({
        ...prev,
        autoExcuseReasons: [...prev.autoExcuseReasons, newExcuseReason.trim()],
      }));
      setNewExcuseReason("");
    }
  };

  const removeExcuseReason = (reason: string) => {
    setFormData(prev => ({
      ...prev,
      autoExcuseReasons: prev.autoExcuseReasons.filter(r => r !== reason),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const submitData = {
        ...formData,
        schoolId: formData.scope === "GLOBAL" ? undefined : formData.schoolId || undefined,
        classId: formData.scope === "CLASS" ? formData.classId || undefined : undefined,
        effectiveTo: formData.effectiveTo || undefined,
      };

      const response = await fetch("/api/admin/attendance-policies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Politika başarıyla oluşturuldu!' });
        setTimeout(() => {
          router.push("/admin/attendance-policies");
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Politika oluşturulurken hata oluştu.' });
      }
    } catch (error) {
      console.error("Politika oluşturma hatası:", error);
      setMessage({ type: 'error', text: 'Politika oluşturulurken hata oluştu.' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedSchool = schools.find(s => s.id === formData.schoolId);

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
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Yeni Devamsızlık Politikası
        </h1>
        <button
          onClick={() => router.push("/admin/attendance-policies")}
          className="rounded-lg bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
        >
          Geri Dön
        </button>
      </div>

      {message && (
        <div className={`rounded-lg p-4 ${
          message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Temel Bilgiler
          </h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Politika Adı *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Kapsam *
              </label>
              <select
                value={formData.scope}
                onChange={(e) => handleInputChange("scope", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="GLOBAL">Genel (Tüm Okullar)</option>
                <option value="SCHOOL">Okul Bazlı</option>
                <option value="CLASS">Sınıf Bazlı</option>
              </select>
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Açıklama
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* School/Class Selection */}
          {(formData.scope === "SCHOOL" || formData.scope === "CLASS") && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Okul *
                </label>
                <select
                  value={formData.schoolId}
                  onChange={(e) => handleInputChange("schoolId", e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Okul seçin</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              {formData.scope === "CLASS" && selectedSchool && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sınıf *
                  </label>
                  <select
                    value={formData.classId}
                    onChange={(e) => handleInputChange("classId", e.target.value)}
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Sınıf seçin</option>
                    {selectedSchool.classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Threshold Settings */}
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Eşik Değerleri
          </h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sorunlu Devam Eşiği (%) *
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.concernThreshold}
                onChange={(e) => handleInputChange("concernThreshold", parseInt(e.target.value) || 80)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Bu oranın altındaki öğrenciler sorunlu kabul edilir
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Geç Kalma Toleransı (Dakika) *
              </label>
              <input
                type="number"
                min="0"
                max="180"
                value={formData.lateToleranceMinutes}
                onChange={(e) => handleInputChange("lateToleranceMinutes", parseInt(e.target.value) || 15)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Bu süreden sonra geç kalma olarak işaretlenir
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Maksimum Devamsızlık (Gün) *
              </label>
              <input
                type="number"
                min="1"
                max="365"
                value={formData.maxAbsences}
                onChange={(e) => handleInputChange("maxAbsences", parseInt(e.target.value) || 20)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Bu sayıdan fazla devamsızlık uyarı verir
              </p>
            </div>
          </div>
        </div>

        {/* Auto-Excuse Settings */}
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Otomatik Mazeret Ayarları
          </h2>
          
          <div className="mb-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.autoExcuseEnabled}
                onChange={(e) => handleInputChange("autoExcuseEnabled", e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Otomatik mazeret sistemi aktif
              </span>
            </label>
          </div>

          {formData.autoExcuseEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Mazeret Nedenleri
              </label>
              <div className="mt-2 flex space-x-2">
                <input
                  type="text"
                  value={newExcuseReason}
                  onChange={(e) => setNewExcuseReason(e.target.value)}
                  placeholder="Yeni mazeret nedeni ekle"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                <button
                  type="button"
                  onClick={addExcuseReason}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Ekle
                </button>
              </div>
              
              {formData.autoExcuseReasons.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {formData.autoExcuseReasons.map((reason, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                    >
                      {reason}
                      <button
                        type="button"
                        onClick={() => removeExcuseReason(reason)}
                        className="ml-2 text-blue-600 hover:text-blue-900 dark:text-blue-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Effective Dates */}
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Geçerlilik Tarihleri
          </h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Geçerlilik Başlangıcı *
              </label>
              <input
                type="date"
                value={formData.effectiveFrom}
                onChange={(e) => handleInputChange("effectiveFrom", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Geçerlilik Bitişi
              </label>
              <input
                type="date"
                value={formData.effectiveTo}
                onChange={(e) => handleInputChange("effectiveTo", e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Boş bırakılırsa süresiz geçerli olur
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push("/admin/attendance-policies")}
            className="rounded-lg bg-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-primary px-6 py-3 text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Oluşturuluyor..." : "Politika Oluştur"}
          </button>
        </div>
      </form>
    </div>
  );
}