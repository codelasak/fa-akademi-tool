"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface Assignment {
  id: string;
  school: {
    name: string;
  };
  class: {
    id: string;
    name: string;
    students: Student[];
  };
}

interface Props {
  params: {
    id: string;
  };
}

export default function TakeAttendancePage({ params }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendance, setAttendance] = useState<Record<string, { status: string; arrivalMinutes?: number; excuseReason?: string }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "TEACHER") {
      router.push("/auth/sign-in");
      return;
    }

    fetchAssignment();
  }, [session, status, params.id]);

  const fetchAssignment = async () => {
    try {
      const response = await fetch("/api/teacher/assignments");
      if (response.ok) {
        const assignments = await response.json();
        const foundAssignment = assignments.find((a: Assignment) => a.class.id === params.id);
        
        if (foundAssignment) {
          setAssignment(foundAssignment);
          // Pre-fill all students as present
          const initialAttendance: Record<string, { status: string; arrivalMinutes?: number; excuseReason?: string }> = {};
          foundAssignment.class.students.forEach((student: Student) => {
            initialAttendance[student.id] = { status: "PRESENT" };
          });
          setAttendance(initialAttendance);
        } else {
          setMessage({ type: 'error', text: 'Bu sınıfa erişim yetkiniz yok.' });
        }
      }
    } catch (error) {
      console.error("Atama getirme hatası:", error);
      setMessage({ type: 'error', text: 'Sınıf bilgileri getirilemedi.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttendanceChange = (studentId: string, status: string, arrivalMinutes?: number, excuseReason?: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        status,
        ...(arrivalMinutes !== undefined && { arrivalMinutes }),
        ...(excuseReason && { excuseReason }),
      }
    }));
  };

  const handleBulkChange = (status: string) => {
    if (assignment) {
      const bulkAttendance: Record<string, { status: string; arrivalMinutes?: number; excuseReason?: string }> = {};
      assignment.class.students.forEach(student => {
        bulkAttendance[student.id] = { status };
      });
      setAttendance(bulkAttendance);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assignment || !attendanceDate) {
      setMessage({ type: 'error', text: 'Lütfen tarih seçin.' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/teacher/lessons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: assignment.class.id,
          date: attendanceDate,
          hoursWorked: 1, // Default to 1 hour for attendance only
          notes: `Yoklama - ${new Date(attendanceDate).toLocaleDateString('tr-TR')}`,
          attendance: attendance,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Yoklama başarıyla kaydedildi!' });
        // Redirect to class detail after success
        setTimeout(() => {
          router.push(`/teacher/attendance/class/${params.id}`);
        }, 2000);
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Yoklama kaydedilirken hata oluştu.' });
      }
    } catch (error) {
      console.error("Yoklama kaydetme hatası:", error);
      setMessage({ type: 'error', text: 'Yoklama kaydedilirken hata oluştu.' });
    } finally {
      setIsSaving(false);
    }
  };

  const attendanceStats = assignment ? {
    present: Object.values(attendance).filter(att => att.status === "PRESENT").length,
    absent: Object.values(attendance).filter(att => att.status === "ABSENT").length,
    late: Object.values(attendance).filter(att => att.status === "LATE").length,
    excused: Object.values(attendance).filter(att => att.status === "EXCUSED").length,
  } : { present: 0, absent: 0, late: 0, excused: 0 };

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

  if (!assignment) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-gray-500 dark:text-gray-400">
            Sınıf bulunamadı veya erişim yetkiniz yok.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-dark dark:text-white">
            {assignment.class.name} - Yoklama Al
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {assignment.school.name} • {assignment.class.students.length} öğrenci
          </p>
        </div>
        <button
          onClick={() => router.push(`/teacher/attendance/class/${params.id}`)}
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
        {/* Date Selection */}
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Yoklama Tarihi
          </h2>
          
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Tarih
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
        </div>

        {/* Bulk Actions */}
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Toplu İşlemler
          </h2>
          
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleBulkChange("PRESENT")}
              className="rounded-lg bg-green-100 px-4 py-2 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
            >
              Hepsini Mevcut Yap
            </button>
            <button
              type="button"
              onClick={() => handleBulkChange("ABSENT")}
              className="rounded-lg bg-red-100 px-4 py-2 text-red-800 hover:bg-red-200 dark:bg-red-900 dark:text-red-200"
            >
              Hepsini Devamsız Yap
            </button>
            <button
              type="button"
              onClick={() => handleBulkChange("LATE")}
              className="rounded-lg bg-yellow-100 px-4 py-2 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200"
            >
              Hepsini Geç Geldi Yap
            </button>
            <button
              type="button"
              onClick={() => handleBulkChange("EXCUSED")}
              className="rounded-lg bg-blue-100 px-4 py-2 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
            >
              Hepsini Mazeret Yap
            </button>
          </div>

          {/* Live Statistics */}
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg bg-green-50 p-3 text-center dark:bg-green-900/20">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {attendanceStats.present}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Mevcut</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center dark:bg-red-900/20">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {attendanceStats.absent}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">Devamsız</p>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3 text-center dark:bg-yellow-900/20">
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {attendanceStats.late}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Geç Geldi</p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-center dark:bg-blue-900/20">
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {attendanceStats.excused}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Mazeret</p>
            </div>
          </div>
        </div>

        {/* Student List */}
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Öğrenci Yoklaması ({assignment.class.students.length} öğrenci)
          </h2>
          
          <div className="space-y-3">
            {assignment.class.students.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">
                    {student.firstName} {student.lastName}
                  </h4>
                </div>
                
                <div className="flex space-x-2">
                  {[
                    { value: "PRESENT", label: "Mevcut", color: "green" },
                    { value: "ABSENT", label: "Devamsız", color: "red" },
                    { value: "LATE", label: "Geç", color: "yellow" },
                    { value: "EXCUSED", label: "Mazeret", color: "blue" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleAttendanceChange(student.id, option.value)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        attendance[student.id]?.status === option.value
                          ? `bg-${option.color}-600 text-white`
                          : `bg-${option.color}-100 text-${option.color}-800 hover:bg-${option.color}-200 dark:bg-${option.color}-900 dark:text-${option.color}-200 dark:hover:bg-${option.color}-800`
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => router.push(`/teacher/attendance/class/${params.id}`)}
            className="rounded-lg bg-gray-300 px-6 py-3 text-gray-700 hover:bg-gray-400 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500"
          >
            İptal
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="rounded-lg bg-primary px-6 py-3 text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {isSaving ? "Kaydediliyor..." : "Yoklamayı Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}