"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface School {
  id: string;
  name: string;
}

export default function CreateUser() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [schools, setSchools] = useState<School[]>([]);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "TEACHER",
    schoolId: "",
    hourlyRate: "",
    specializations: [""],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch schools for principal assignment
    const fetchSchools = async () => {
      try {
        const response = await fetch("/api/admin/schools");
        if (response.ok) {
          const schoolsData = await response.json();
          setSchools(schoolsData);
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
      }
    };

    fetchSchools();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSpecializationChange = (index: number, value: string) => {
    const newSpecializations = [...formData.specializations];
    newSpecializations[index] = value;
    setFormData(prev => ({
      ...prev,
      specializations: newSpecializations
    }));
  };

  const addSpecialization = () => {
    setFormData(prev => ({
      ...prev,
      specializations: [...prev.specializations, ""]
    }));
  };

  const removeSpecialization = (index: number) => {
    const newSpecializations = formData.specializations.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      specializations: newSpecializations
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) newErrors.username = "Kullanıcı adı gerekli";
    if (!formData.email.trim()) newErrors.email = "E-posta gerekli";
    if (!formData.password.trim()) newErrors.password = "Şifre gerekli";
    if (!formData.firstName.trim()) newErrors.firstName = "Ad gerekli";
    if (!formData.lastName.trim()) newErrors.lastName = "Soyad gerekli";
    
    if (formData.role === "PRINCIPAL" && !formData.schoolId) {
      newErrors.schoolId = "Okul müdürü için okul seçimi gerekli";
    }

    if (formData.role === "TEACHER" && !formData.hourlyRate) {
      newErrors.hourlyRate = "Öğretmen için saatlik ücret gerekli";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const requestData = {
        ...formData,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
        specializations: formData.specializations.filter(s => s.trim() !== "")
      };

      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        router.push("/admin/users");
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || "Kullanıcı oluşturulamadı" });
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
          Yeni Kullanıcı Oluştur
        </h1>
        <Link
          href="/admin/users"
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Kullanıcılara Dön
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="rounded-lg bg-red-50 p-4 text-red-700 dark:bg-red-900 dark:text-red-300">
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Kullanıcı Adı *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">Kullanıcı adı gerekli</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  E-posta *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">E-posta gerekli</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ad *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">Ad gerekli</p>
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
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">Soyad gerekli</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Şifre *
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">Şifre gerekli</p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rol *
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="TEACHER">Öğretmen</option>
                  <option value="PRINCIPAL">Okul Müdürü</option>
                  <option value="ADMIN">Yönetici</option>
                </select>
              </div>
            </div>

            {/* Role-specific fields */}
            {formData.role === "PRINCIPAL" && (
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
                      {school.name}
                    </option>
                  ))}
                </select>
                {errors.schoolId && (
                  <p className="mt-1 text-sm text-red-600">{errors.schoolId}</p>
                )}
              </div>
            )}

            {formData.role === "TEACHER" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Hourly Rate (₺) *
                  </label>
                  <input
                    type="number"
                    name="hourlyRate"
                    value={formData.hourlyRate}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  />
                  {errors.hourlyRate && (
                    <p className="mt-1 text-sm text-red-600">{errors.hourlyRate}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Branşlar
                  </label>
                  {formData.specializations.map((specialization, index) => (
                    <div key={index} className="mb-2 flex items-center space-x-2">
                      <input
                        type="text"
                        value={specialization}
                        onChange={(e) => handleSpecializationChange(index, e.target.value)}
                        placeholder="örn: Robotik, Python, Scratch"
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                      />
                      {formData.specializations.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSpecialization(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Kaldır
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSpecialization}
                    className="text-primary hover:text-primary-dark"
                  >
                    + Branş Ekle
                  </button>
                </div>
              </>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {isLoading ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
              </button>
              <Link
                href="/admin/users"
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