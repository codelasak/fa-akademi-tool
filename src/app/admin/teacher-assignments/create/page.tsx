"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Teacher {
  id: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  specializations: string[];
}

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

export default function CreateTeacherAssignmentPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [filteredClasses, setFilteredClasses] = useState<Class[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    teacherId: "",
    schoolId: "",
    classId: "",
  });

  useEffect(() => {
    fetchTeachers();
    fetchSchools();
    fetchClasses();
  }, []);

  useEffect(() => {
    if (formData.schoolId) {
      setFilteredClasses(
        classes.filter((c) => c.schoolId === formData.schoolId),
      );
    } else {
      setFilteredClasses([]);
    }
    setFormData((prev) => ({ ...prev, classId: "" }));
  }, [formData.schoolId, classes]);

  const fetchTeachers = async () => {
    try {
      const response = await fetch("/api/teachers");
      if (response.ok) {
        const teachersData = await response.json();
        setTeachers(teachersData);
      }
    } catch (error) {
      console.error("Öğretmen listesi getirme hatası:", error);
    }
  };

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

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts selecting
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.teacherId) newErrors.teacherId = "Öğretmen seçimi gerekli";
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
      const response = await fetch("/api/teacher-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/admin/teacher-assignments");
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || "Atama oluşturulamadı" });
      }
    } catch (error) {
      setErrors({ submit: "Bir hata oluştu. Lütfen tekrar deneyin." });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedTeacher = teachers.find((t) => t.id === formData.teacherId);
  const selectedClass = filteredClasses.find((c) => c.id === formData.classId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Yeni Öğretmen Ataması
        </h1>
        <Link
          href="/admin/teacher-assignments"
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Atamalara Dön
        </Link>
      </div>

      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {errors.submit && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {errors.submit}
              </div>
            )}

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Öğretmen *
                </label>
                <select
                  name="teacherId"
                  value={formData.teacherId}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  required
                >
                  <option value="">Öğretmen seçin</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.user.firstName} {teacher.user.lastName} -{" "}
                      {teacher.specializations.join(", ")}
                    </option>
                  ))}
                </select>
                {errors.teacherId && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.teacherId}
                  </p>
                )}

                {selectedTeacher && (
                  <div className="mt-2 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>Uzmanlik Alanları:</strong>{" "}
                      {selectedTeacher.specializations.join(", ")}
                    </p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                      E-posta: {selectedTeacher.user.email}
                    </p>
                  </div>
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

                {selectedClass && (
                  <div className="mt-2 rounded-lg bg-green-50 p-3 dark:bg-green-900/20">
                    <p className="text-sm text-green-800 dark:text-green-300">
                      <strong>Ders:</strong> {selectedClass.subject}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      Sınıf: {selectedClass.name}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {selectedTeacher && selectedClass && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
                <h3 className="font-medium text-yellow-800 dark:text-yellow-300">
                  Atama Özeti
                </h3>
                <p className="mt-1 text-sm text-yellow-700 dark:text-yellow-400">
                  <strong>
                    {selectedTeacher.user.firstName}{" "}
                    {selectedTeacher.user.lastName}
                  </strong>{" "}
                  öğretmeni, <strong>{selectedClass.school.name}</strong>{" "}
                  okulundaki <strong>{selectedClass.name}</strong> sınıfında{" "}
                  <strong>{selectedClass.subject}</strong> dersini verecek.
                </p>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {isLoading ? "Atama Yapılıyor..." : "Atama Yap"}
              </button>
              <Link
                href="/admin/teacher-assignments"
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
