"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
}

interface Class {
  id: string;
  name: string;
  school: {
    name: string;
  };
  students: Student[];
}

interface Assignment {
  id: string;
  class: Class;
}

export default function BulkAttendancePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user || session.user.role !== "TEACHER") {
      router.push("/auth/sign-in");
      return;
    }

    fetchAssignments();
  }, [session, status]);

  const fetchAssignments = async () => {
    try {
      const response = await fetch("/api/teacher/assignments");
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error("Atamalar getirme hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    // Reset attendance when class changes
    setAttendance({});
    
    // Pre-fill all students as present
    const selectedAssignment = assignments.find(a => a.class.id === classId);
    if (selectedAssignment) {
      const initialAttendance: Record<string, string> = {};
      selectedAssignment.class.students.forEach(student => {
        initialAttendance[student.id] = "PRESENT";
      });
      setAttendance(initialAttendance);
    }
  };

  const handleAttendanceChange = (studentId: string, status: string) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleBulkChange = (status: string) => {
    const selectedAssignment = assignments.find(a => a.class.id === selectedClass);
    if (selectedAssignment) {
      const bulkAttendance: Record<string, string> = {};
      selectedAssignment.class.students.forEach(student => {
        bulkAttendance[student.id] = status;
      });
      setAttendance(bulkAttendance);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedClass || !attendanceDate) {
      setMessage({ type: 'error', text: 'Lütfen sınıf ve tarih seçin.' });
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
          classId: selectedClass,
          date: attendanceDate,
          hoursWorked: 1, // Default to 1 hour for bulk attendance
          notes: `Toplu yoklama - ${new Date(attendanceDate).toLocaleDateString('tr-TR')}`,
          attendance: attendance,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Yoklama başarıyla kaydedildi!' });
        // Reset form
        setAttendance({});
        setSelectedClass("");
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

  const selectedAssignment = assignments.find(a => a.class.id === selectedClass);
  const attendanceStats = selectedAssignment ? {
    present: Object.values(attendance).filter(status => status === "PRESENT").length,
    absent: Object.values(attendance).filter(status => status === "ABSENT").length,
    late: Object.values(attendance).filter(status => status === "LATE").length,
    excused: Object.values(attendance).filter(status => status === "EXCUSED").length,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Toplu Yoklama Alma
        </h1>
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
        {/* Class and Date Selection */}
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Sınıf ve Tarih Seçimi
          </h2>
          
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Sınıf
              </label>
              <select
                value={selectedClass}
                onChange={(e) => handleClassChange(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                required
              >
                <option value="">Sınıf seçin</option>
                {assignments.map((assignment) => (
                  <option key={assignment.id} value={assignment.class.id}>
                    {assignment.class.name} - {assignment.class.school.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
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
        </div>

        {selectedAssignment && (
          <>
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

              {/* Statistics */}
              <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {attendanceStats.present}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mevcut</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                    {attendanceStats.absent}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Devamsız</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                    {attendanceStats.late}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Geç Geldi</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {attendanceStats.excused}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mazeret</p>
                </div>
              </div>
            </div>

            {/* Student List */}
            <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
              <h2 className="mb-4 text-lg font-semibold text-dark dark:text-white">
                Öğrenci Listesi ({selectedAssignment.class.students.length} öğrenci)
              </h2>
              
              <div className="space-y-3">
                {selectedAssignment.class.students.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700"
                  >
                    <div>
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
                          className={`rounded-lg px-3 py-1 text-sm ${
                            attendance[student.id] === option.value
                              ? `bg-${option.color}-600 text-white`
                              : `bg-${option.color}-100 text-${option.color}-800 hover:bg-${option.color}-200 dark:bg-${option.color}-900 dark:text-${option.color}-200`
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
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-primary px-6 py-3 text-white hover:bg-opacity-90 disabled:opacity-50"
              >
                {isSaving ? "Kaydediliyor..." : "Yoklamayı Kaydet"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}