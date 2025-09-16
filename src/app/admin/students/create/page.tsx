"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface School {
  id: string;
  name: string;
  district: string;
}

interface Class {
  id: string;
  name: string;
  subject: string;
  schoolId: string;
  school: School;
}

export default function CreateStudentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    classId: "",
    schoolId: "",
  });

  useEffect(() => {
    fetchSchools();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (formData.schoolId) {
      setFilteredClasses(classes.filter(c => c.schoolId === formData.schoolId));
    } else {
      setFilteredClasses([]);
    }
    setFormData(prev => ({ ...prev, classId: "" }));
  }, [formData.schoolId, classes]);

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

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes");
      if (response.ok) {
        const classesData = await response.json();
        setClasses(classesData);
      }
    } catch (error) {
      console.error("Sınıf listesi getirme hatası:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "Ad gerekli";
    if (!formData.lastName.trim()) newErrors.lastName = "Soyad gerekli";
    if (!formData.schoolId) newErrors.schoolId = "Okul seçimi gerekli";
    if (!formData.classId) newErrors.classId = "Sınıf seçimi gerekli";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          classId: formData.classId,
        }),
      });

      if (response.ok) {
        router.push("/admin/students");
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || "Öğrenci oluşturulamadı" });
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
          Yeni Öğrenci Ekle
        </h1>
        <Link
          href="/admin/students"
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Öğrencilere Dön
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
                  Ad *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="Öğrencinin adı"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Soyad *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="Öğrencinin soyadı"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
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
                  Sınıf *
                </label>
                <select
                  name="classId"
                  value={formData.classId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                  disabled={!formData.schoolId}
                >
                  <option value="">
                    {formData.schoolId ? "Sınıf seçin" : "Önce okul seçin"}
                  </option>
                  {filteredClasses.map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name} - {classItem.subject}
                    </option>
                  ))}
                </select>
                {errors.classId && (
                  <p className="mt-1 text-sm text-red-600">{errors.classId}</p>
                )}
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {isLoading ? "Ekleniyor..." : "Öğrenci Ekle"}
              </button>
              <Link
                href="/admin/students"
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