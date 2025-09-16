import prisma from "@/lib/prisma";

export interface AttendancePolicy {
  id: string;
  name: string;
  description?: string | null;
  concernThreshold: number;
  lateToleranceMinutes: number;
  maxAbsences: number;
  autoExcuseEnabled: boolean;
  autoExcuseReasons: string[];
}

export async function getEffectivePolicy(
  classId?: string, 
  schoolId?: string
): Promise<AttendancePolicy> {
  // Policy hierarchy: Class → School → Global
  let effectivePolicy = null;

  // Try class-specific policy first
  if (classId) {
    effectivePolicy = await prisma.attendancePolicy.findFirst({
      where: {
        scope: "CLASS",
        classId: classId,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } },
        ],
      },
      orderBy: { effectiveFrom: "desc" },
    });
  }

  // Fall back to school-specific policy
  if (!effectivePolicy && schoolId) {
    effectivePolicy = await prisma.attendancePolicy.findFirst({
      where: {
        scope: "SCHOOL",
        schoolId: schoolId,
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } },
        ],
      },
      orderBy: { effectiveFrom: "desc" },
    });
  }

  // Fall back to global policy
  if (!effectivePolicy) {
    effectivePolicy = await prisma.attendancePolicy.findFirst({
      where: {
        scope: "GLOBAL",
        isActive: true,
        effectiveFrom: { lte: new Date() },
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: new Date() } },
        ],
      },
      orderBy: { effectiveFrom: "desc" },
    });
  }

  // Return default values if no policy found
  return effectivePolicy || {
    id: "default",
    name: "Varsayılan Politika",
    description: "Sistem varsayılan değerleri",
    concernThreshold: 80,
    lateToleranceMinutes: 15,
    maxAbsences: 20,
    autoExcuseEnabled: false,
    autoExcuseReasons: [],
  };
}

export function isStudentOfConcern(
  presentCount: number, 
  totalLessons: number, 
  policy: AttendancePolicy
): boolean {
  if (totalLessons === 0) return false;
  const attendanceRate = (presentCount / totalLessons) * 100;
  return attendanceRate < policy.concernThreshold;
}

export function shouldAutoExcuse(
  reason: string, 
  policy: AttendancePolicy
): boolean {
  if (!policy.autoExcuseEnabled) return false;
  return policy.autoExcuseReasons.includes(reason.toLowerCase());
}