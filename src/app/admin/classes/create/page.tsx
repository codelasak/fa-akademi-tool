"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface School {
  id: string;
  name: string;
  district: string;
}

export default function CreateClassPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    schoolId: "",
    isAttendanceEnabled: true,
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const response = await fetch("/api/schools");
      if (response.ok) {
        const schoolsData = await response.json();
        setSchools(schoolsData);
      }
    } catch (error) {
      console.error("Okul listesi getirme hatası:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value 
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "Sınıf adı gerekli";
    if (!formData.subject.trim()) newErrors.subject = "Ders adı gerekli";
    if (!formData.schoolId) newErrors.schoolId = "Okul seçimi gerekli";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/admin/classes");
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || "Sınıf oluşturulamadı" });
      }
    } catch (error) {
      setErrors({ submit: "Bir hata oluştu. Lütfen tekrar deneyin." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Yeni Sınıf Oluştur
        </h1>
        <Link
          href="/admin/classes"
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Sınıflara Dön
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sınıf Adı *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="örn: 9-A Robotik"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ders/Konu *
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="örn: Robotik, CS50x, Python"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
                {errors.subject && (
                  <p className="mt-1 text-sm text-red-600">{errors.subject}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Okul *
                </label>
                <select
                  name="schoolId"
                  value={formData.schoolId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="">Okul seçin</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name} - {school.district}
                    </option>
                  ))}
                </select>
                {errors.schoolId && (
                  <p className="mt-1 text-sm text-red-600">{errors.schoolId}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Yoklama Sistemi
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isAttendanceEnabled"
                    checked={formData.isAttendanceEnabled}
                    onChange={handleChange}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800"
                  />
                  <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                    Yoklama sistemini aktif et
                  </label>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {isLoading ? "Oluşturuluyor..." : "Sınıf Oluştur"}
              </button>
              <Link
                href="/admin/classes"
                className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                İptal
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}