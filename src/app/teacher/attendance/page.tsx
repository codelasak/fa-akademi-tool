import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function TeacherAttendancePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== "TEACHER") {
    redirect("/auth/sign-in");
  }

  // Get teacher profile
  const teacherProfile = await prisma.teacherProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!teacherProfile) {
    redirect("/auth/sign-in");
  }

  // Get teacher's active assignments
  const assignments = await prisma.teacherAssignment.findMany({
    where: { 
      teacherId: teacherProfile.id,
      isActive: true 
    },
    include: {
      school: true,
      class: {
        include: {
          students: {
            include: {
              attendance: {
                include: {
                  lesson: {
                    select: {
                      id: true,
                      date: true,
                      teacherId: true,
                    },
                  },
                },
                where: {
                  lesson: {
                    teacherId: teacherProfile.id,
                  },
                },
                orderBy: {
                  lesson: {
                    date: "desc",
                  },
                },
              },
            },
          },
          lessons: {
            where: {
              teacherId: teacherProfile.id,
            },
            include: {
              attendance: true,
            },
            orderBy: {
              date: "desc",
            },
          },
        },
      },
    },
  });

  // Calculate attendance statistics
  const attendanceStats = assignments.map(assignment => {
    const totalLessons = assignment.class.lessons.length;
    const totalStudents = assignment.class.students.length;
    const totalPossibleAttendances = totalLessons * totalStudents;
    
    const attendanceCounts = assignment.class.lessons.reduce((acc, lesson) => {
      lesson.attendance.forEach(att => {
        acc[att.status] = (acc[att.status] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    const presentCount = attendanceCounts["PRESENT"] || 0;
    const absentCount = attendanceCounts["ABSENT"] || 0;
    const lateCount = attendanceCounts["LATE"] || 0;
    const excusedCount = attendanceCounts["EXCUSED"] || 0;
    const totalRecorded = presentCount + absentCount + lateCount + excusedCount;

    const attendanceRate = totalPossibleAttendances > 0 ? 
      ((presentCount + lateCount + excusedCount) / totalPossibleAttendances * 100) : 0;

    // Get recent attendance trends (last 5 lessons)
    const recentLessons = assignment.class.lessons.slice(0, 5);
    const recentTrends = recentLessons.map(lesson => ({
      date: lesson.date,
      present: lesson.attendance.filter(a => a.status === "PRESENT").length,
      absent: lesson.attendance.filter(a => a.status === "ABSENT").length,
      late: lesson.attendance.filter(a => a.status === "LATE").length,
      excused: lesson.attendance.filter(a => a.status === "EXCUSED").length,
    }));

    return {
      assignment,
      totalLessons,
      totalStudents,
      attendanceRate: Math.round(attendanceRate),
      presentCount,
      absentCount,
      lateCount,
      excusedCount,
      totalRecorded,
      recentTrends,
    };
  });

  // Get students with attendance concerns (< 80% attendance)
  const concernStudents = assignments.flatMap(assignment => 
    assignment.class.students.filter(student => {
      const studentAttendances = student.attendance;
      const totalAttendances = studentAttendances.length;
      if (totalAttendances === 0) return false;
      
      const presentCount = studentAttendances.filter(a => 
        a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED"
      ).length;
      
      const attendanceRate = (presentCount / totalAttendances) * 100;
      return attendanceRate < 80;
    }).map(student => {
      const studentAttendances = student.attendance;
      const totalAttendances = studentAttendances.length;
      const presentCount = studentAttendances.filter(a => 
        a.status === "PRESENT" || a.status === "LATE" || a.status === "EXCUSED"
      ).length;
      const attendanceRate = totalAttendances > 0 ? (presentCount / totalAttendances) * 100 : 0;
      
      return {
        student,
        attendanceRate: Math.round(attendanceRate),
        totalLessons: totalAttendances,
        class: assignment.class,
      };
    })
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Devamsızlık Yönetimi
        </h1>
        <div className="flex space-x-3">
          <Link
            href="/teacher/attendance/bulk"
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Toplu Yoklama
          </Link>
          <Link
            href="/teacher/attendance/reports"
            className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
          >
            Raporlar
          </Link>
        </div>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Sınıf
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {assignments.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-2.239" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Toplam Öğrenci
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {attendanceStats.reduce((acc, stat) => acc + stat.totalStudents, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="rounded-lg bg-yellow-100 p-3 dark:bg-yellow-900">
              <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Sorunlu Öğrenci
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {concernStudents.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                %80'in altında devam
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-card dark:bg-gray-dark">
          <div className="flex items-center">
            <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Ortalama Devam
              </p>
              <p className="text-2xl font-bold text-dark dark:text-white">
                {attendanceStats.length > 0 ? 
                  Math.round(attendanceStats.reduce((acc, stat) => acc + stat.attendanceRate, 0) / attendanceStats.length) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Class-wise Attendance */}
      <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
        <div className="border-b border-gray-200 p-6 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-dark dark:text-white">
            Sınıf Bazlı Devamsızlık Durumu
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {attendanceStats.map((stat) => (
              <div key={stat.assignment.id} className="border-b border-gray-100 pb-6 last:border-b-0 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {stat.assignment.class.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {stat.assignment.school.name} • {stat.totalStudents} öğrenci • {stat.totalLessons} ders
                    </p>
                  </div>
                  <div className="flex space-x-3">
                    <Link
                      href={`/teacher/attendance/class/${stat.assignment.class.id}`}
                      className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                    >
                      Detaylar
                    </Link>
                    <Link
                      href={`/teacher/attendance/class/${stat.assignment.class.id}/take`}
                      className="rounded-lg bg-green-100 px-3 py-1 text-sm text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200"
                    >
                      Yoklama Al
                    </Link>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {stat.presentCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mevcut</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {stat.absentCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Devamsız</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {stat.lateCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Geç Geldi</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {stat.excusedCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mazeret</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Devam Oranı</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">%{stat.attendanceRate}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                    <div 
                      className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                      style={{ width: `${stat.attendanceRate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {attendanceStats.length === 0 && (
            <div className="text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <p className="mt-4 text-lg text-gray-500 dark:text-gray-400">
                Henüz sınıf atamanız yok.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Students with Attendance Concerns */}
      {concernStudents.length > 0 && (
        <div className="rounded-lg bg-white shadow-card dark:bg-gray-dark">
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-dark dark:text-white">
              Devamsızlık Sorunu Olan Öğrenciler
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              %80'in altında devam oranına sahip öğrenciler
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {concernStudents.slice(0, 10).map((concern, index) => (
                <div key={`${concern.student.id}-${index}`} className="flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">
                      {concern.student.firstName} {concern.student.lastName}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {concern.class.name} • {concern.totalLessons} ders kaydı
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-lg font-bold text-red-600 dark:text-red-400">
                        %{concern.attendanceRate}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">devam oranı</p>
                    </div>
                    <Link
                      href={`/teacher/attendance/student/${concern.student.id}`}
                      className="rounded-lg bg-blue-100 px-3 py-1 text-sm text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200"
                    >
                      Detaylar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            
            {concernStudents.length > 10 && (
              <div className="mt-4 text-center">
                <Link
                  href="/teacher/attendance/concerns"
                  className="text-blue-600 hover:text-blue-900 dark:text-blue-400"
                >
                  Tümünü gör ({concernStudents.length} öğrenci)
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}