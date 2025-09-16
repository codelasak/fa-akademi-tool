import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

const calculateWagesSchema = z.object({
  teacherId: z.string().optional(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const teacherId = searchParams.get("teacherId");

    const where: any = {};
    if (month && year) {
      where.month = parseInt(month);
      where.year = parseInt(year);
    }
    if (teacherId) {
      where.teacherId = teacherId;
    }

    const wageRecords = await prisma.teacherWageRecord.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { year: "desc" },
        { month: "desc" },
      ],
    });

    return NextResponse.json(wageRecords);
  } catch (error) {
    console.error("Maaş kayıtları getirme hatası:", error);
    return NextResponse.json(
      { error: "Maaş kayıtları getirilemedi" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 403 });
    }

    const body = await request.json();
    const data = calculateWagesSchema.parse(body);

    // Calculate wages for specified teacher(s) and period
    const teachersToCalculate = data.teacherId 
      ? [{ id: data.teacherId }]
      : await prisma.teacherProfile.findMany({ select: { id: true } });

    const results = [];

    for (const teacher of teachersToCalculate) {
      // Get teacher's hourly rate
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { id: teacher.id },
        select: { 
          id: true, 
          hourlyRate: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      if (!teacherProfile) continue;

      // Calculate total hours for the month
      const startDate = new Date(data.year, data.month - 1, 1);
      const endDate = new Date(data.year, data.month, 0);

      const lessons = await prisma.lesson.findMany({
        where: {
          teacherId: teacher.id,
          date: {
            gte: startDate,
            lte: endDate,
          },
          isCancelled: false,
        },
        select: {
          hoursWorked: true,
        },
      });

      const totalHours = lessons.reduce((sum, lesson) => {
        return sum + parseFloat(lesson.hoursWorked.toString());
      }, 0);

      const totalAmount = totalHours * parseFloat(teacherProfile.hourlyRate.toString());

      // Check if wage record already exists
      const existingRecord = await prisma.teacherWageRecord.findUnique({
        where: {
          teacherId_month_year: {
            teacherId: teacher.id,
            month: data.month,
            year: data.year,
          },
        },
      });

      let wageRecord;
      if (existingRecord) {
        // Update existing record
        wageRecord = await prisma.teacherWageRecord.update({
          where: { id: existingRecord.id },
          data: {
            totalHours: totalHours,
            hourlyRate: teacherProfile.hourlyRate,
            totalAmount: totalAmount,
            updatedAt: new Date(),
          },
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        });
      } else {
        // Create new record
        wageRecord = await prisma.teacherWageRecord.create({
          data: {
            teacherId: teacher.id,
            month: data.month,
            year: data.year,
            totalHours: totalHours,
            hourlyRate: teacherProfile.hourlyRate,
            totalAmount: totalAmount,
            status: "PENDING",
          },
          include: {
            teacher: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        });
      }

      results.push(wageRecord);
    }

    return NextResponse.json({
      message: `${results.length} öğretmen için maaş hesaplandı`,
      records: results,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error("Maaş hesaplama hatası:", error);
    return NextResponse.json(
      { error: "Maaş hesaplanamadı" },
      { status: 500 }
    );
  }
}