import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function createDefaultPolicy() {
  try {
    // Check if global policy already exists
    const existingPolicy = await prisma.attendancePolicy.findFirst({
      where: {
        scope: "GLOBAL",
        isActive: true,
      },
    });

    if (existingPolicy) {
      console.log("Global policy already exists:", existingPolicy.name);
      return;
    }

    // Create default global policy
    const defaultPolicy = await prisma.attendancePolicy.create({
      data: {
        name: "Varsayılan Genel Politika",
        description: "Tüm okullar için varsayılan devamsızlık kuralları",
        scope: "GLOBAL",
        concernThreshold: 80,
        lateToleranceMinutes: 15,
        maxAbsences: 20,
        autoExcuseEnabled: false,
        autoExcuseReasons: [],
        isActive: true,
      },
    });

    console.log("Default global policy created:", defaultPolicy);
  } catch (error) {
    console.error("Error creating default policy:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createDefaultPolicy();
