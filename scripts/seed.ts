import bcrypt from "bcryptjs";
import { PrismaClient, UserRole } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Create admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      email: "admin@fenavar.com",
      password: hashedPassword,
      firstName: "System",
      lastName: "Administrator",
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  console.log("✅ Created admin user:", admin.username);

  // Create a sample school
  const school = await prisma.school.upsert({
    where: { id: "sample-school" },
    update: {},
    create: {
      id: "sample-school",
      name: "Demo Okulu",
      district: "Merkez",
      logoUrl: null,
    },
  });

  console.log("✅ Created sample school:", school.name);

  // Create a sample teacher
  const teacherPassword = await bcrypt.hash("teacher123", 10);
  const teacher = await prisma.user.upsert({
    where: { username: "teacher1" },
    update: {},
    create: {
      username: "teacher1",
      email: "teacher@fenavar.com",
      password: teacherPassword,
      firstName: "Ahmet",
      lastName: "Öztürk",
      role: UserRole.TEACHER,
      isActive: true,
      teacherProfile: {
        create: {
          hourlyRate: 150.0,
          bio: "Robotik ve yazılım öğretmeni",
          specializations: ["Robotik", "Python", "Scratch"],
        },
      },
    },
  });

  console.log("✅ Created teacher user:", teacher.username);

  // Create a sample principal
  const principalPassword = await bcrypt.hash("principal123", 10);
  const principal = await prisma.user.upsert({
    where: { username: "principal1" },
    update: {},
    create: {
      username: "principal1",
      email: "principal@fenavar.com",
      password: principalPassword,
      firstName: "Ayşe",
      lastName: "Demir",
      role: UserRole.PRINCIPAL,
      isActive: true,
      principalProfile: {
        create: {
          schoolId: school.id,
        },
      },
    },
  });

  console.log("✅ Created principal user:", principal.username);

  // Create sample classes
  const class1 = await prisma.class.create({
    data: {
      name: "9-A Robotik",
      subject: "Robotik",
      schoolId: school.id,
      isAttendanceEnabled: true,
    },
  });

  const class2 = await prisma.class.create({
    data: {
      name: "10-B CS50x",
      subject: "CS50x",
      schoolId: school.id,
      isAttendanceEnabled: false,
    },
  });

  console.log("✅ Created sample classes");

  // Create sample students
  for (let i = 1; i <= 5; i++) {
    await prisma.student.create({
      data: {
        firstName: `Öğrenci${i}`,
        lastName: `Soyadı${i}`,
        classId: class1.id,
      },
    });
  }

  console.log("✅ Created sample students");

  console.log("🎉 Database seed completed!");
  console.log("\n📋 Default Login Credentials:");
  console.log("Admin: username=admin, password=admin123");
  console.log("Teacher: username=teacher1, password=teacher123");
  console.log("Principal: username=principal1, password=principal123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });