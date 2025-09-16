"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Assignment {
  id: string;
  class: {
    id: string;
    name: string;
    subject: string;
    school: {
      name: string;
      district: string;
    };
    students: {
      id: string;
      firstName: string;
      lastName: string;
    }[];
  };
}

interface CurriculumTopic {
  id: string;
  title: string;
  description?: string;
  orderIndex: number;
}

export default function RecordLessonPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [curriculumTopics, setCurriculumTopics] = useState<CurriculumTopic[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    classId: searchParams?.get("classId") || "",
    date: new Date().toISOString().split("T")[0],
    hoursWorked: "",
    notes: "",
    topicIds: [] as string[],
    attendance: {} as Record<string, "PRESENT" | "ABSENT" | "LATE" | "EXCUSED">,
  });

  useEffect(() => {
    fetchAssignments();
  }, []);

  useEffect(() => {
    if (formData.classId) {
      fetchCurriculumTopics(formData.classId);
      // Initialize attendance for all students
      const selectedAssignment = assignments.find(a => a.class.id === formData.classId);
      if (selectedAssignment) {
        const attendance: Record<string, "PRESENT" | "ABSENT" | "LATE" | "EXCUSED"> = {};
        selectedAssignment.class.students.forEach(student => {
          attendance[student.id] = "PRESENT";
        });
        setFormData(prev => ({ ...prev, attendance }));
      }
    }
  }, [formData.classId, assignments]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/teacher/assignments");
      if (response.ok) {
        const assignmentsData = await response.json();
        setAssignments(assignmentsData);
      }
    } catch (error) {
      console.error("Atamalar getirme hatası:", error);
    }
  };

  const fetchCurriculumTopics = async (classId: string) => {
    try {
      const response = await fetch(`/api/teacher/curriculum?classId=${classId}`);
      if (response.ok) {
        const topicsData = await response.json();
        setCurriculumTopics(topicsData);
      }
    } catch (error) {
      console.error("Müfredat konuları getirme hatası:", error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleTopicChange = (topicId: string) => {
    setFormData(prev => ({
      ...prev,
      topicIds: prev.topicIds.includes(topicId)
        ? prev.topicIds.filter(id => id !== topicId)
        : [...prev.topicIds, topicId]
    }));
  };

  const handleAttendanceChange = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE" | "EXCUSED") => {
    setFormData(prev => ({
      ...prev,
      attendance: {
        ...prev.attendance,
        [studentId]: status
      }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.classId) newErrors.classId = "Sınıf seçimi gerekli";
    if (!formData.date) newErrors.date = "Tarih gerekli";
    if (!formData.hoursWorked || parseFloat(formData.hoursWorked) <= 0) {
      newErrors.hoursWorked = "Geçerli bir çalışma saati girin";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch("/api/teacher/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          hoursWorked: parseFloat(formData.hoursWorked),
        }),
      });

      if (response.ok) {
        router.push("/teacher/lessons");
      } else {
        const errorData = await response.json();
        setErrors({ submit: errorData.error || "Ders kaydedilemedi" });
      }
    } catch (error) {
      setErrors({ submit: "Bir hata oluştu. Lütfen tekrar deneyin." });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAssignment = assignments.find(a => a.class.id === formData.classId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Ders Kaydet
        </h1>
        <Link
          href="/teacher/dashboard"
          className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Dashboard'a Dön
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

            {/* Lesson Details */}
            <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
              <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
                Ders Bilgileri
              </h2>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
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
                  >
                    <option value="">Sınıf seçin</option>
                    {assignments.map((assignment) => (
                      <option key={assignment.class.id} value={assignment.class.id}>
                        {assignment.class.name} - {assignment.class.subject} ({assignment.class.school.name})
                      </option>
                    ))}
                  </select>
                  {errors.classId && (
                    <p className="mt-1 text-sm text-red-600">{errors.classId}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ders Tarihi *
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  />
                  {errors.date && (
                    <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Çalışılan Saat *
                  </label>
                  <input
                    type="number"
                    name="hoursWorked"
                    value={formData.hoursWorked}
                    onChange={handleChange}
                    step="0.5"
                    min="0"
                    placeholder="örn: 2.5"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  />
                  {errors.hoursWorked && (
                    <p className="mt-1 text-sm text-red-600">{errors.hoursWorked}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ders Notları
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    placeholder="Bu derste işlenen konular, önemli notlar..."
                  />
                </div>
              </div>
            </div>

            {/* Curriculum Topics */}
            {curriculumTopics.length > 0 && (
              <div className="border-b border-gray-200 pb-6 dark:border-gray-700">
                <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
                  İşlenen Müfredat Konuları
                </h2>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {curriculumTopics.map((topic) => (
                    <label key={topic.id} className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData.topicIds.includes(topic.id)}
                        onChange={() => handleTopicChange(topic.id)}
                        className="mr-3 mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary dark:border-gray-600 dark:bg-gray-800"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {topic.title}
                        </span>
                        {topic.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {topic.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance */}
            {selectedAssignment && selectedAssignment.class.students.length > 0 && (
              <div>
                <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
                  Yoklama ({selectedAssignment.class.students.length} öğrenci)
                </h2>
                <div className="space-y-3">
                  {selectedAssignment.class.students.map((student) => (
                    <div
                      key={student.id}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700"
                    >
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {student.firstName} {student.lastName}
                      </span>
                      <div className="flex space-x-2">
                        {["PRESENT", "ABSENT", "LATE", "EXCUSED"].map((status) => (
                          <label key={status} className="flex items-center">
                            <input
                              type="radio"
                              name={`attendance-${student.id}`}
                              checked={formData.attendance[student.id] === status}
                              onChange={() => handleAttendanceChange(student.id, status as any)}
                              className="mr-1 h-4 w-4 text-primary focus:ring-primary"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              {status === "PRESENT" && "Var"}
                              {status === "ABSENT" && "Yok"}
                              {status === "LATE" && "Geç"}
                              {status === "EXCUSED" && "Mazur"}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-lg bg-primary px-6 py-2 text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {isLoading ? "Kaydediliyor..." : "Dersi Kaydet"}
              </button>
              <Link
                href="/teacher/dashboard"
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